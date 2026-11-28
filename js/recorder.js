/**
 * Dil Analizi - Ses Kaydedici, Canlı Dikte ve Çevrimdışı Whisper Modülü (recorder.js)
 * 1. MediaRecorder ile ses kaydı (Başlat / Duraklat / Devam / Durdur)
 * 2. AnalyserNode ile canlı ses seviyesi göstergesi (Canvas visualizer)
 * 3. Web Speech API (tr-TR) canlı dikte (KVKK onaylı, continuous + interim)
 * 4. Çocuk (Ç) / Terapist (T) konuşmacı geçişi ve [mm:ss] zaman damgası
 * 5. İsteğe bağlı Transformers.js Whisper cihaz içi çevrimdışı transkripsiyon
 */

export class VoiceRecorder {
  constructor(options = {}) {
    this.onTimerUpdate = options.onTimerUpdate || (() => {});
    this.onStateChange = options.onStateChange || (() => {});
    this.onError = options.onError || (() => {});
    this.onRecordingComplete = options.onRecordingComplete || (() => {});

    this.mediaRecorder = null;
    this.audioStream = null;
    this.audioChunks = [];
    this.audioBlob = null;
    this.audioUrl = null;

    this.audioContext = null;
    this.analyser = null;
    this.animFrameId = null;

    this.state = "inactive"; // "inactive" | "recording" | "paused"
    this.startTime = 0;
    this.elapsedSeconds = 0;
    this.timerInterval = null;
    this.mimeType = "";
  }

  /**
   * Tarayıcının desteklediği en uygun ses mimeType'ını seç
   */
  static getSupportedMimeType() {
    if (typeof MediaRecorder === "undefined") return "";

    const candidates = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
      "audio/ogg",
      "audio/wav"
    ];

    for (const mime of candidates) {
      if (MediaRecorder.isTypeSupported(mime)) {
        return mime;
      }
    }
    return "";
  }

  /**
   * Mikrofonu başlat ve kayda başla
   */
  async start() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Tarayıcınız ses kaydı (MediaDevices API) desteği sunmamaktadır.");
      }

      if (typeof MediaRecorder === "undefined") {
        throw new Error("Tarayıcınız MediaRecorder API'sini desteklememektedir.");
      }

      this.mimeType = VoiceRecorder.getSupportedMimeType();

      // Mikrofon akışı talep et
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.audioChunks = [];
      const options = this.mimeType ? { mimeType: this.mimeType } : {};
      this.mediaRecorder = new MediaRecorder(this.audioStream, options);

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.audioChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        this.finishRecording();
      };

      this.mediaRecorder.start(250); // 250ms aralıklarla veri topla
      this.state = "recording";
      this.startTime = Date.now();
      this.elapsedSeconds = 0;

      this.startTimer();
      this.startVisualizer(this.audioStream);
      this.onStateChange(this.state);

    } catch (err) {
      this.cleanupStream();
      let userMsg = "Mikrofon başlatılamadı: " + (err.message || err.name);

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        userMsg = "Mikrofon erişim izni reddedildi. Lütfen tarayıcı adres çubuğundaki kilit simgesinden mikrofon iznini etkinleştiriniz.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        userMsg = "Bağlı bir mikrofon aygıtı bulunamadı. Lütfen mikrofonunuzu bağlayıp tekrar deneyiniz.";
      } else if (err.name === "NotSupportedError") {
        userMsg = "Tarayıcınız bu ses kaydı biçimini desteklememektedir.";
      }

      this.onError(userMsg, err);
      throw err;
    }
  }

  /**
   * Kaydı Duraklat
   */
  pause() {
    if (this.mediaRecorder && this.state === "recording") {
      this.mediaRecorder.pause();
      this.state = "paused";
      this.stopTimer();
      this.onStateChange(this.state);
    }
  }

  /**
   * Kayda Devam Et
   */
  resume() {
    if (this.mediaRecorder && this.state === "paused") {
      this.mediaRecorder.resume();
      this.state = "recording";
      this.startTimer();
      this.onStateChange(this.state);
    }
  }

  /**
   * Kaydı Tamamla ve Durdur
   */
  stop() {
    if (this.mediaRecorder && this.state !== "inactive") {
      this.mediaRecorder.stop();
      this.state = "inactive";
      this.stopTimer();
      this.stopVisualizer();
      this.onStateChange(this.state);
    }
  }

  /**
   * Canlı Süre Sayacı
   */
  startTimer() {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
      this.onTimerUpdate(this.elapsedSeconds, this.formatTime(this.elapsedSeconds));
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  /**
   * AnalyserNode ile Canlı Ses Seviyesi Görselleştirici
   */
  startVisualizer(stream) {
    try {
      if (typeof window === "undefined") return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      source.connect(this.analyser);

      const canvas = document.getElementById("audio-level-canvas");
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const renderFrame = () => {
        if (this.state === "inactive") return;
        this.animFrameId = requestAnimationFrame(renderFrame);

        this.analyser.getByteFrequencyData(dataArray);

        // Ortalama ses genliği hesapla
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength; // 0..255

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Arka plan kılavuz çizgisi
        ctx.fillStyle = "#edf2f7";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Seviyeye göre renk tonu (yeşil -> turuncu -> kırmızı)
        const percent = Math.min(100, Math.round((average / 160) * 100));
        let barColor = "#319795"; // teal
        if (percent > 65) barColor = "#dd6b20"; // turuncu
        if (percent > 85) barColor = "#e53e3e"; // kırmızı

        // Dinamik ses seviyesi dolgusu
        const barWidth = (canvas.width * percent) / 100;
        ctx.fillStyle = barColor;
        ctx.fillRect(0, 0, barWidth, canvas.height);

        // Dalgalı barlar efekti
        const numBars = 18;
        const step = canvas.width / numBars;
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        for (let i = 0; i < numBars; i++) {
          const val = dataArray[i % bufferLength] || 0;
          const h = (val / 255) * canvas.height;
          ctx.fillRect(i * step, (canvas.height - h) / 2, step - 2, h);
        }
      };

      renderFrame();
    } catch (e) {
      console.warn("Visualizer başlatılamadı:", e);
    }
  }

  stopVisualizer() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.audioContext && this.audioContext.state !== "closed") {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }

    // Canvas'ı temizle
    const canvas = document.getElementById("audio-level-canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  /**
   * Mikrofon donanım akışını tamamen durdur (LED söndürme)
   */
  cleanupStream() {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      this.audioStream = null;
    }
  }

  /**
   * Kayıt Tamamlandığında Blob ve URL Oluştur
   */
  finishRecording() {
    this.cleanupStream();

    if (this.audioChunks.length === 0) return;

    // Önceki URL'i temizle
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }

    const mime = this.mimeType || "audio/webm";
    this.audioBlob = new Blob(this.audioChunks, { type: mime });
    this.audioUrl = URL.createObjectURL(this.audioBlob);

    // Süreyi dakika cinsinden hesapla (örn: 3.4 dk)
    const durationMinutes = Math.max(0.1, Math.round((this.elapsedSeconds / 60) * 10) / 10);

    // Dosya uzantısı belirle
    let ext = "webm";
    if (mime.includes("mp4")) ext = "mp4";
    else if (mime.includes("ogg")) ext = "ogg";
    else if (mime.includes("wav")) ext = "wav";

    this.onRecordingComplete({
      blob: this.audioBlob,
      url: this.audioUrl,
      elapsedSeconds: this.elapsedSeconds,
      durationMinutes,
      ext
    });
  }

  /**
   * Nesne ve Bellek Temizliği (Temizle Düğmesi İçin)
   */
  destroy() {
    this.stop();
    this.cleanupStream();
    this.stopVisualizer();
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
    this.audioBlob = null;
    this.audioChunks = [];
    this.elapsedSeconds = 0;
  }
}

/**
 * Web Speech API Canlı Türkçe Dikte Servisi
 */
export class LiveDictationService {
  constructor(options = {}) {
    this.onInterimText = options.onInterimText || (() => {});
    this.onFinalSentence = options.onFinalSentence || (() => {});
    this.onError = options.onError || (() => {});
    this.onStatusChange = options.onStatusChange || (() => {});

    this.recognition = null;
    this.isListening = false;
    this.activeSpeaker = "Ç"; // "Ç" (Çocuk) veya "T" (Terapist)
    this.hasConsent = false;
    this.shouldRestart = false;

    this.initRecognition();
  }

  static isSupported() {
    if (typeof window === "undefined") return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  initRecognition() {
    if (typeof window === "undefined") return;
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    this.recognition = new SpeechRec();
    this.recognition.lang = "tr-TR";
    this.recognition.continuous = true;
    this.recognition.interimResults = true;

    this.recognition.onresult = (event) => {
      let interim = "";
      let finalSentence = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const text = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalSentence += text.trim() + " ";
        } else {
          interim += text;
        }
      }

      if (interim) {
        this.onInterimText(interim.trim());
      }

      if (finalSentence.trim()) {
        this.onFinalSentence(finalSentence.trim(), this.activeSpeaker);
      }
    };

    this.recognition.onerror = (e) => {
      console.warn("Speech Recognition hatası:", e.error);
      if (e.error === "not-allowed") {
        this.shouldRestart = false;
        this.isListening = false;
        this.onError("Mikrofon izni reddedildi.");
      }
    };

    this.recognition.onend = () => {
      // Sürekli dikte için yeniden başlat
      if (this.isListening && this.shouldRestart) {
        try {
          this.recognition.start();
        } catch (e) {}
      } else {
        this.isListening = false;
        this.onStatusChange(false);
      }
    };
  }

  setSpeaker(speaker) {
    this.activeSpeaker = speaker === "T" ? "T" : "Ç";
  }

  toggleSpeaker() {
    this.activeSpeaker = this.activeSpeaker === "Ç" ? "T" : "Ç";
    return this.activeSpeaker;
  }

  start() {
    if (!this.recognition) {
      throw new Error("Tarayıcınız Web Speech API'yi desteklememektedir.");
    }
    if (!this.hasConsent) {
      throw new Error("KVKK ses aktarım onay kutusu işaretlenmeden canlı dikte başlatılamaz.");
    }

    try {
      this.shouldRestart = true;
      this.isListening = true;
      this.recognition.start();
      this.onStatusChange(true);
    } catch (e) {
      console.warn("Dikte başlatma uyarısı:", e);
    }
  }

  stop() {
    this.shouldRestart = false;
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
    this.onStatusChange(false);
  }
}

/**
 * Cihaz İçi Çevrimdışı Whisper Servisi (Transformers.js)
 * Yalnızca kullanıcı açıkça tıkladığında dinamik olarak CDN'den indirilir.
 */
export class OfflineWhisperService {
  constructor(options = {}) {
    this.onProgress = options.onProgress || (() => {});
    this.onStatus = options.onStatus || (() => {});
    this.pipeline = null;
    this.isLoading = false;
    this.isReady = false;
  }

  /**
   * Transformers.js kütüphanesini ve Türkçe Whisper modelini dinamik yükle
   */
  async loadModel() {
    if (this.isReady && this.pipeline) return this.pipeline;
    if (this.isLoading) return null;

    this.isLoading = true;
    this.onStatus("Transformers.js modülü yükleniyor...");

    try {
      // ESM üzerinden dinamik import
      const transformers = await import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2");
      const { pipeline, env } = transformers;

      // Yerel önbellek kullanımını etkinleştir
      env.allowLocalModels = false;
      env.useBrowserCache = true;

      this.onStatus("Whisper-tiny Türkçe modeli indiriliyor (yaklaşık ~39MB, bir kez indirilir)...");

      // Hafif ve hızlı Türkçe uyumlu whisper-tiny modeli
      this.pipeline = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny", {
        progress_callback: (progressData) => {
          if (progressData.status === "progress" && progressData.progress !== undefined) {
            this.onProgress(Math.round(progressData.progress));
          } else if (progressData.status === "initiate") {
            this.onStatus(`${progressData.file || "Model dosyası"} başlatılıyor...`);
          } else if (progressData.status === "done") {
            this.onStatus(`${progressData.file || "Model"} indirildi.`);
          }
        }
      });

      this.isReady = true;
      this.isLoading = false;
      this.onStatus("Whisper modeli hazır.");
      return this.pipeline;

    } catch (err) {
      this.isLoading = false;
      this.onStatus("Model yüklenemedi: " + (err.message || err));
      throw err;
    }
  }

  /**
   * Kaydedilen ses Blob'unu 16kHz float32 ses dizisine çevirip Whisper ile transkribe et
   */
  async transcribeAudioBlob(audioBlob) {
    const transcriber = await this.loadModel();
    if (!transcriber) throw new Error("Whisper modeli başlatılamadı.");

    this.onStatus("Ses işleniyor ve yazıya dökülüyor...");

    // Blob'u ArrayBuffer'a ve AudioBuffer'a çöz
    const arrayBuffer = await audioBlob.arrayBuffer();
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const audioCtx = new AudioCtx({ sampleRate: 16000 });
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Tek kanallı (mono) 16kHz Float32Array çıkar
    const channelData = audioBuffer.getChannelData(0);

    // Whisper pipeline çağrısı
    const output = await transcriber(channelData, {
      language: "turkish",
      task: "transcribe",
      chunk_length_s: 30,
      stride_length_s: 5
    });

    try {
      audioCtx.close();
    } catch (e) {}

    this.onStatus("Çevrimdışı yazıya dökme tamamlandı.");
    return output.text || "";
  }
}
