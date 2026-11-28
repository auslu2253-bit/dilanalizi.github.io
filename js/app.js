/**
 * Dil Analizi - Ana Uygulama Mantığı (app.js)
 * Modülleri entegre eder, kullanıcı etkileşimlerini yönetir ve sekmeleri günceller.
 */

import { TranscriptParser } from "./parser.js";
import { TurkishMorphology } from "./morphology.js";
import { LanguageMetrics } from "./metrics.js";
import { ReliabilityEngine } from "./reliability.js";
import { QualitativeAnalysisEngine } from "./qualitative.js";
import { UIController } from "./ui.js";
import { EXAMPLE_TRANSCRIPTS } from "../data/examples.js";
import { VoiceRecorder, LiveDictationService, OfflineWhisperService } from "./recorder.js";

class App {
  constructor() {
    this.ui = new UIController();
    this.qualitativeEngine = new QualitativeAnalysisEngine();
    this.lastAnalysisResult = null;
    this.voiceRecorder = null;
    this.dictationService = null;
    this.whisperService = null;
    this.activeSpeaker = "Ç";

    this.init();
  }

  init() {
    this.initTheme();
    this.initEventListeners();
    this.initRecorderModule();
    this.initRouting();
    this.loadInitialInputs();
    this.updateContextWarning();
    this.updateUtteranceCount();
    this.renderLongitudinalHistory();

    // Sayfa açıldığında örnek 1'i yükleyip otomatik analiz et
    if (!document.getElementById("transcript-input").value.trim()) {
      this.loadExample("narrative");
    } else {
      this.runAnalysis();
    }
  }

  /**
   * Açık/Koyu Tema Yönetimi
   */
  initTheme() {
    const savedTheme = localStorage.getItem("dil_analizi_theme");
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = savedTheme || (prefersDark ? "dark" : "light");

    document.documentElement.setAttribute("data-theme", theme);
    this.updateThemeButtonIcon(theme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("dil_analizi_theme", newTheme);
    this.updateThemeButtonIcon(newTheme);
  }

  updateThemeButtonIcon(theme) {
    const btn = document.getElementById("theme-toggle-btn");
    if (!btn) return;
    btn.innerHTML = theme === "dark"
      ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg> Açık Mod`
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> Koyu Mod`;
  }

  /**
   * Hash Tabanlı Yönlendirme (#ozet, #bicimbilim ...)
   */
  initRouting() {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "") || "ozet";
      this.ui.switchTab(hash);
    };

    window.addEventListener("hashchange", handleHash);
    handleHash();
  }

  /**
   * Etkinlik Dinleyicileri
   */
  initEventListeners() {
    // Tema düğmesi
    document.getElementById("theme-toggle-btn")?.addEventListener("click", () => this.toggleTheme());

    // Sekme butonları
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const tab = e.currentTarget.getAttribute("data-tab");
        this.ui.switchTab(tab);
      });
    });

    // Profil girdileri değiştikçe uyarıları güncelle ve sakla
    const profileInputs = ["client-code", "client-age-group", "client-exact-age", "sampling-context", "eval-purpose", "lingual-profile", "sample-duration"];
    profileInputs.forEach(id => {
      document.getElementById(id)?.addEventListener("change", () => {
        this.updateContextWarning();
        this.saveInputsToStorage();
      });
    });

    // Transkript alanı canlı sayaç
    const textarea = document.getElementById("transcript-input");
    if (textarea) {
      textarea.addEventListener("input", () => {
        this.updateUtteranceCount();
        this.saveInputsToStorage();
      });
    }

    // Örnek Yükle seçimi
    document.getElementById("example-select")?.addEventListener("change", (e) => {
      const val = e.target.value;
      if (val) this.loadExample(val);
    });

    // Dosya Yükle (.txt veya .pdf)
    const fileInput = document.getElementById("file-upload");
    fileInput?.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleFileUpload(file);
        e.target.value = ""; // Aynı dosyanın tekrar seçilmesine olanak tanı
      }
    });

    // Transkript alanına sürükle-bırak desteği (.txt ve .pdf)
    if (textarea) {
      textarea.addEventListener("dragover", (e) => {
        e.preventDefault();
        textarea.classList.add("drag-over");
      });
      textarea.addEventListener("dragleave", () => {
        textarea.classList.remove("drag-over");
      });
      textarea.addEventListener("drop", (e) => {
        e.preventDefault();
        textarea.classList.remove("drag-over");
        const file = e.dataTransfer?.files?.[0];
        if (file) this.handleFileUpload(file);
      });
    }

    // Analiz Et düğmesi
    document.getElementById("btn-analyze")?.addEventListener("click", () => {
      this.runAnalysis();
    });

    // Temizle düğmesi
    document.getElementById("btn-clear")?.addEventListener("click", () => {
      if (confirm("Tüm transkript metni ve profil bilgileri temizlensin mi?")) {
        this.clearAll();
      }
    });

    // Dışa aktarma düğmeleri
    document.getElementById("btn-export-txt")?.addEventListener("click", () => this.exportTXT());
    document.getElementById("btn-export-json")?.addEventListener("click", () => this.exportJSON());
    document.getElementById("btn-export-csv")?.addEventListener("click", () => this.exportCSV());
    document.getElementById("btn-print")?.addEventListener("click", () => window.print());

    // Kaynakça modal tetikleyicileri (event delegation)
    document.addEventListener("click", (e) => {
      const badge = e.target.closest("[data-citation]");
      if (badge) {
        const paper = badge.getAttribute("data-citation");
        this.ui.openCitationModal(paper);
      }
    });

    // Nitel Strateji Seçimi
    document.getElementById("qual-strategy-select")?.addEventListener("change", (e) => {
      this.qualitativeEngine.state.selectedStrategy = e.target.value;
      this.qualitativeEngine.saveState();
      this.renderQualitativeModule();
    });

    // Nitel Önerileri Uygula Düğmesi
    document.getElementById("btn-apply-suggestions")?.addEventListener("click", () => {
      if (this.lastAnalysisResult) {
        const suggestions = QualitativeAnalysisEngine.generateAutoSuggestions(this.lastAnalysisResult.parsedData.childUtterances);
        this.qualitativeEngine.applySuggestions(suggestions);
        this.ui.showToast("Ön-kod önerileri kategorileriyle birlikte uygulandı.", "success");
        this.renderQualitativeModule();
      }
    });

    // Nitel Alıntıları Kopyala Düğmesi
    document.getElementById("btn-copy-quotes")?.addEventListener("click", () => {
      if (this.lastAnalysisResult) {
        const quotes = this.qualitativeEngine.compileDirectQuotes(this.lastAnalysisResult.parsedData.childUtterances);
        navigator.clipboard.writeText(quotes).then(() => {
          this.ui.showToast("Doğrudan alıntılar panoya kopyalandı.", "success");
        }).catch(() => {
          this.ui.showToast("Kopyalama başarısız oldu.", "warning");
        });
      }
    });

    // Nitel Yeni Kod Ekleme Formu
    document.getElementById("btn-add-code")?.addEventListener("click", () => {
      const name = prompt("Yeni kod adı:");
      if (name && name.trim()) {
        const catName = prompt("Hangi kategoriye eklensin? (Boş bırakabilirsiniz):");
        let catId = null;
        if (catName && catName.trim()) {
          let cat = this.qualitativeEngine.state.categories.find(c => c.name.toLowerCase() === catName.trim().toLowerCase());
          if (!cat) {
            cat = this.qualitativeEngine.addCategory(catName.trim());
          }
          catId = cat.id;
        }
        this.qualitativeEngine.addCode(name.trim(), catId);
        this.ui.showToast(`'${name}' kodu eklendi.`, "success");
        this.renderQualitativeModule();
      }
    });

    // Oturumu Kaydet (Tab 6 - İlerleme İzleme)
    document.getElementById("btn-save-session")?.addEventListener("click", () => {
      this.saveCurrentSession();
    });

    // Oturum Geçmişini Temizle
    document.getElementById("btn-clear-history")?.addEventListener("click", () => {
      if (confirm("Kayıtlı oturum geçmişi temizlensin mi?")) {
        localStorage.removeItem("dil_analizi_client_history");
        this.renderLongitudinalHistory();
        this.ui.showToast("Oturum geçmişi silindi.", "info");
      }
    });
  }

  /**
   * Ses Kaydedici, Canlı Dikte ve Çevrimdışı Whisper Modülü Entegrasyonu
   */
  initRecorderModule() {
    const timerBadge = document.getElementById("recording-timer-badge");
    const btnStart = document.getElementById("btn-rec-start");
    const btnPause = document.getElementById("btn-rec-pause");
    const btnResume = document.getElementById("btn-rec-resume");
    const btnStop = document.getElementById("btn-rec-stop");

    // 1. MediaRecorder Nesnesi
    this.voiceRecorder = new VoiceRecorder({
      onTimerUpdate: (secs, formatted) => {
        if (timerBadge) {
          timerBadge.textContent = formatted;
          timerBadge.classList.add("timer-active");
        }
      },
      onStateChange: (state) => {
        if (state === "recording") {
          if (btnStart) {
            btnStart.disabled = true;
            btnStart.classList.add("recording-active");
          }
          if (btnPause) {
            btnPause.disabled = false;
            btnPause.style.display = "inline-flex";
          }
          if (btnResume) btnResume.style.display = "none";
          if (btnStop) btnStop.disabled = false;
        } else if (state === "paused") {
          if (btnPause) btnPause.style.display = "none";
          if (btnResume) {
            btnResume.style.display = "inline-flex";
            btnResume.disabled = false;
          }
        } else if (state === "inactive") {
          if (btnStart) {
            btnStart.disabled = false;
            btnStart.classList.remove("recording-active");
          }
          if (btnPause) {
            btnPause.disabled = true;
            btnPause.style.display = "inline-flex";
          }
          if (btnResume) btnResume.style.display = "none";
          if (btnStop) btnStop.disabled = true;
          if (timerBadge) timerBadge.classList.remove("timer-active");
        }
      },
      onError: (msg) => {
        this.ui.showToast(msg, "danger");
      },
      onRecordingComplete: (data) => {
        const playerCard = document.getElementById("audio-player-card");
        const player = document.getElementById("audio-player");
        const downloadBtn = document.getElementById("btn-download-audio");
        const durationInfo = document.getElementById("audio-duration-info");

        if (playerCard) playerCard.style.display = "block";
        if (player) {
          player.src = data.url;
        }
        if (downloadBtn) {
          downloadBtn.href = data.url;
          downloadBtn.download = `dil-kaydi-${Date.now()}.${data.ext}`;
        }
        if (durationInfo) {
          const m = Math.floor(data.elapsedSeconds / 60);
          const s = data.elapsedSeconds % 60;
          durationInfo.textContent = `Toplam: ${m > 0 ? `${m} dk ` : ""}${s} sn`;
        }

        // Örnek süresi alanına otomatik yaz (dakika cinsinden)
        const durationInput = document.getElementById("sample-duration");
        if (durationInput) {
          durationInput.value = data.durationMinutes;
          this.saveInputsToStorage();
          this.updateContextWarning();
        }

        this.ui.showToast(`Ses kaydı tamamlandı (${data.elapsedSeconds} sn). Süre profil alanına işlendi.`, "success");
      }
    });

    // Kayıt buton olayları
    btnStart?.addEventListener("click", async () => {
      try {
        await this.voiceRecorder.start();
      } catch (e) {
        // Hata onError içinde toast olarak gösterildi
      }
    });

    btnPause?.addEventListener("click", () => {
      this.voiceRecorder.pause();
    });

    btnResume?.addEventListener("click", () => {
      this.voiceRecorder.resume();
    });

    btnStop?.addEventListener("click", () => {
      this.voiceRecorder.stop();
      if (this.dictationService && this.dictationService.isListening) {
        this.dictationService.stop();
      }
    });

    // 2. Konuşmacı Seçici (Ç / T) ve Klavye Kısayolları (Tab / Space)
    const btnChild = document.getElementById("btn-speaker-child");
    const btnTherapist = document.getElementById("btn-speaker-therapist");

    btnChild?.addEventListener("click", () => this.setActiveSpeaker("Ç"));
    btnTherapist?.addEventListener("click", () => this.setActiveSpeaker("T"));

    window.addEventListener("keydown", (e) => {
      const activeEl = document.activeElement;
      const tag = activeEl ? activeEl.tagName.toLowerCase() : "";
      const isInput = tag === "input" || tag === "textarea";

      // Tab tuşu veya input dışında Space basıldığında konuşmacıyı değiştir
      if (e.key === "Tab" || (e.key === " " && !isInput)) {
        e.preventDefault();
        this.toggleActiveSpeaker();
      }
    });

    // 3. Web Speech API Canlı Dikte (tr-TR)
    const consentCheck = document.getElementById("dictation-consent-checkbox");
    const btnDictate = document.getElementById("btn-toggle-dictation");
    const dictationStatus = document.getElementById("dictation-status-indicator");
    const interimBox = document.getElementById("dictation-interim-box");
    const interimText = document.getElementById("interim-text");

    if (!LiveDictationService.isSupported()) {
      if (btnDictate) {
        btnDictate.disabled = true;
        btnDictate.title = "Tarayıcınız Web Speech API'yi desteklememektedir.";
      }
      if (dictationStatus) {
        dictationStatus.textContent = "Tarayıcı desteği yok";
      }
    } else {
      this.dictationService = new LiveDictationService({
        onInterimText: (text) => {
          if (interimBox) interimBox.style.display = "block";
          if (interimText) interimText.textContent = text;
        },
        onFinalSentence: (sentence, speaker) => {
          if (interimBox) interimBox.style.display = "none";
          if (!sentence || !sentence.trim()) return;

          // Zaman damgası [mm:ss]
          const elapsed = this.voiceRecorder ? this.voiceRecorder.elapsedSeconds : 0;
          const mins = String(Math.floor(elapsed / 60)).padStart(2, "0");
          const secs = String(elapsed % 60).padStart(2, "0");
          const timestamp = `[${mins}:${secs}]`;

          const line = `${timestamp} ${speaker}: ${sentence.trim()}`;
          const textarea = document.getElementById("transcript-input");
          if (textarea) {
            const current = textarea.value.trim();
            textarea.value = (current ? current + "\n" : "") + line;
            this.updateUtteranceCount();
            this.saveInputsToStorage();
          }
        },
        onError: (err) => {
          this.ui.showToast(`Dikte: ${err}`, "warning");
        },
        onStatusChange: (isListening) => {
          if (isListening) {
            if (btnDictate) {
              btnDictate.classList.add("btn-danger");
              btnDictate.classList.remove("btn-secondary");
              btnDictate.innerHTML = "⏹️ Dikteyi Durdur";
            }
            if (dictationStatus) {
              dictationStatus.textContent = "🎙️ Dinleniyor...";
              dictationStatus.classList.add("status-active");
            }
          } else {
            if (btnDictate) {
              btnDictate.classList.remove("btn-danger");
              btnDictate.classList.add("btn-secondary");
              btnDictate.innerHTML = "🎙️ Canlı Dikteyi Aç (tr-TR)";
            }
            if (dictationStatus) {
              dictationStatus.textContent = "Dikte kapalı";
              dictationStatus.classList.remove("status-active");
            }
            if (interimBox) interimBox.style.display = "none";
          }
        }
      });

      consentCheck?.addEventListener("change", (e) => {
        const checked = e.target.checked;
        if (this.dictationService) {
          this.dictationService.hasConsent = checked;
        }
        if (btnDictate) {
          btnDictate.disabled = !checked;
          btnDictate.title = checked ? "Canlı dikteyi başlat" : "Önce KVKK onay kutusunu işaretleyiniz";
        }
      });

      btnDictate?.addEventListener("click", () => {
        if (!this.dictationService) return;
        if (this.dictationService.isListening) {
          this.dictationService.stop();
        } else {
          try {
            this.dictationService.start();
          } catch (err) {
            this.ui.showToast(err.message, "warning");
          }
        }
      });
    }

    // 4. Çevrimdışı Whisper Transkripsiyon Düğmesi
    const btnWhisper = document.getElementById("btn-whisper-transcribe");
    btnWhisper?.addEventListener("click", async () => {
      try {
        const text = await this.transcribeWithWhisper();
        if (text && text.trim()) {
          const textarea = document.getElementById("transcript-input");
          if (textarea) {
            const current = textarea.value.trim();
            const line = `Ç: ${text.trim()}`;
            textarea.value = (current ? current + "\n" : "") + line;
            this.updateUtteranceCount();
            this.saveInputsToStorage();
          }
          this.ui.showToast("Whisper transkripsiyonu transkripte eklendi.", "success");
        } else if (text !== null) {
          this.ui.showToast("Whisper ses kaydında konuşma tespit edemedi.", "info");
        }
      } catch (err) {
        console.error("Whisper hatası:", err);
        this.ui.showToast("Çevrimdışı transkripsiyon hatası: " + (err.message || err), "danger");
      }
    });

    // 5. Kaydedilen Ses Dosyasını Doğrudan .txt Olarak İndir
    const btnDownloadAudioTxt = document.getElementById("btn-download-audio-txt");
    btnDownloadAudioTxt?.addEventListener("click", () => {
      this.downloadAudioAsTxt();
    });

    // 6. Kaydedilen Sesi Base64 Metin (.txt) Olarak İndir
    const btnDownloadAudioBase64 = document.getElementById("btn-download-audio-base64");
    btnDownloadAudioBase64?.addEventListener("click", () => {
      this.downloadAudioAsBase64Txt();
    });
  }

  /**
   * Whisper ile Cihaz İçi Transkripsiyon (Ortak Metot)
   */
  async transcribeWithWhisper() {
    if (!this.voiceRecorder || !this.voiceRecorder.audioBlob) {
      this.ui.showToast("Önce bir ses kaydı yapmalısınız.", "warning");
      return null;
    }

    const whisperBox = document.getElementById("whisper-progress-box");
    const whisperStatus = document.getElementById("whisper-status-label");
    const whisperPercent = document.getElementById("whisper-percent-label");
    const whisperBar = document.getElementById("whisper-progress-bar");
    const btnWhisper = document.getElementById("btn-whisper-transcribe");
    const btnDownloadTxt = document.getElementById("btn-download-audio-txt");

    if (!this.whisperService) {
      this.whisperService = new OfflineWhisperService({
        onProgress: (p) => {
          if (whisperPercent) whisperPercent.textContent = `${p}%`;
          if (whisperBar) whisperBar.style.width = `${p}%`;
        },
        onStatus: (status) => {
          if (whisperStatus) whisperStatus.textContent = status;
        }
      });
    }

    try {
      if (btnWhisper) btnWhisper.disabled = true;
      if (btnDownloadTxt) btnDownloadTxt.disabled = true;
      if (whisperBox) whisperBox.style.display = "block";
      if (whisperPercent) whisperPercent.textContent = "0%";
      if (whisperBar) whisperBar.style.width = "0%";

      const text = await this.whisperService.transcribeAudioBlob(this.voiceRecorder.audioBlob);
      return text;
    } finally {
      if (btnWhisper) btnWhisper.disabled = false;
      if (btnDownloadTxt) btnDownloadTxt.disabled = false;
    }
  }

  setActiveSpeaker(speaker) {
    this.activeSpeaker = speaker === "T" ? "T" : "Ç";
    if (this.dictationService) {
      this.dictationService.setSpeaker(this.activeSpeaker);
    }

    const btnChild = document.getElementById("btn-speaker-child");
    const btnTherapist = document.getElementById("btn-speaker-therapist");

    if (this.activeSpeaker === "Ç") {
      btnChild?.classList.add("active-child");
      btnChild?.setAttribute("aria-checked", "true");
      btnTherapist?.classList.remove("active-therapist");
      btnTherapist?.setAttribute("aria-checked", "false");
    } else {
      btnTherapist?.classList.add("active-therapist");
      btnTherapist?.setAttribute("aria-checked", "true");
      btnChild?.classList.remove("active-child");
      btnChild?.setAttribute("aria-checked", "false");
    }

    this.ui.showToast(`Aktif Konuşmacı: ${this.activeSpeaker === "Ç" ? "Çocuk (Ç:)" : "Terapist (T:)"}`, "info");
  }

  toggleActiveSpeaker() {
    const nextSpeaker = this.activeSpeaker === "Ç" ? "T" : "Ç";
    this.setActiveSpeaker(nextSpeaker);
  }

  /**
   * Canlı İfade Sayacı
   */
  updateUtteranceCount() {
    const text = document.getElementById("transcript-input")?.value || "";
    const lines = text.split(/\r?\n/);
    let childCount = 0;
    lines.forEach(l => {
      if (/^\s*\[?\d{0,2}:?\d{0,2}\]?\s*[ÇçCc]\s*[:：]/.test(l.trim())) {
        childCount++;
      }
    });

    const badge = document.getElementById("live-utterance-badge");
    if (badge) {
      badge.textContent = `${childCount} Çocuk İfadesi`;
      badge.className = `badge ${childCount >= 50 ? "badge-success" : (childCount > 0 ? "badge-warning" : "badge-secondary")}`;
    }
  }

  /**
   * Bağlam ve Yaş Uygunluk Uyarısını Güncelle (Makale 2)
   */
  updateContextWarning() {
    const ageGroup = document.getElementById("client-age-group")?.value || "4;0-5;11";
    const exactAge = document.getElementById("client-exact-age")?.value || "";
    const context = document.getElementById("sampling-context")?.value || "conversation";

    const evalResult = ReliabilityEngine.evaluateContextMatch(ageGroup, exactAge, context);
    const box = document.getElementById("context-match-box");
    if (!box) return;

    box.className = `context-alert alert-${evalResult.warningLevel}`;
    box.innerHTML = `
      <div class="alert-icon">
        ${evalResult.warningLevel === "success" ? "✓" : "⚠"}
      </div>
      <div class="alert-content">
        <strong>${evalResult.title}</strong>
        <p>${evalResult.message}</p>
        <small class="text-muted">${evalResult.rationale}</small>
      </div>
    `;
  }

  /**
   * Örnek Transkript Yükle
   */
  loadExample(exampleKey) {
    const ex = EXAMPLE_TRANSCRIPTS[exampleKey];
    if (!ex) return;

    document.getElementById("client-code").value = ex.clientCode || "D-01";
    document.getElementById("client-age-group").value = ex.ageGroup || "4;0-5;11";
    document.getElementById("client-exact-age").value = ex.exactAge || "";
    document.getElementById("sampling-context").value = ex.context || "narrative";
    document.getElementById("eval-purpose").value = ex.purpose || "assessment";
    document.getElementById("lingual-profile").value = ex.lingualProfile || "monolingual";
    document.getElementById("sample-duration").value = ex.duration || "";
    document.getElementById("transcript-input").value = ex.text;

    this.updateContextWarning();
    this.updateUtteranceCount();
    this.saveInputsToStorage();
    this.runAnalysis();
    this.ui.showToast(`'${ex.title}' başarıyla yüklendi ve analiz edildi.`, "success");
  }

  /**
   * Dosya Okuma (.txt ve .pdf)
   */
  async handleFileUpload(file) {
    const fileNameLower = file.name.toLowerCase();
    const isTxt = fileNameLower.endsWith(".txt");
    const isPdf = fileNameLower.endsWith(".pdf");

    if (!isTxt && !isPdf) {
      this.ui.showToast("Lütfen sadece .txt veya .pdf uzantılı transkript dosyası seçiniz.", "warning");
      return;
    }

    if (isTxt) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        document.getElementById("transcript-input").value = content;
        this.updateUtteranceCount();
        this.runAnalysis();
        this.ui.showToast(`'${file.name}' dosyası yüklendi ve analiz edildi.`, "success");
      };
      reader.onerror = () => {
        this.ui.showToast("Dosya okunamadı.", "danger");
      };
      reader.readAsText(file, "UTF-8");
    } else if (isPdf) {
      try {
        this.ui.showToast(`'${file.name}' PDF içeriği okunuyor...`, "info");
        const arrayBuffer = await file.arrayBuffer();
        const extractedText = await this.extractTextFromPDF(arrayBuffer);

        if (!extractedText || !extractedText.trim()) {
          this.ui.showToast("PDF dosyasında metin bulunamadı. (Taranmış görsel PDF'ler yerine metin içeren PDF yükleyiniz)", "warning");
          return;
        }

        document.getElementById("transcript-input").value = extractedText.trim();
        this.updateUtteranceCount();
        this.runAnalysis();
        this.ui.showToast(`'${file.name}' PDF transkripti başarıyla yüklendi ve analiz edildi.`, "success");
      } catch (err) {
        console.error("PDF okuma hatası:", err);
        this.ui.showToast("PDF dosyası okunamadı: " + (err.message || err), "danger");
      }
    }
  }

  /**
   * PDF.js ile İstemci Tarafında PDF Metin Çıkarma
   */
  async extractTextFromPDF(arrayBuffer) {
    if (!window.pdfjsLib) {
      throw new Error("PDF.js kütüphanesi yüklenemedi.");
    }

    // Worker yolunu yerel vendor kopyasına yönlendir
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = "./vendor/pdf.worker.min.js";

    const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      let lastY = null;
      let pageText = "";

      for (const item of textContent.items) {
        if (!item.str) continue;

        // Y eksenindeki belirgin değişimlerde yeni satıra geç (satır bütünlüğünü korur)
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          pageText += "\n";
        } else if (pageText.length > 0 && !pageText.endsWith("\n") && !pageText.endsWith(" ")) {
          pageText += " ";
        }

        pageText += item.str;
        lastY = item.transform[5];
      }

      if (pageText.trim()) {
        fullText += pageText.trim() + "\n";
      }
    }

    return fullText.trim();
  }

  /**
   * Profil ve Girdi Durumunu Kaydet / Yükle
   */
  saveInputsToStorage() {
    try {
      const data = {
        code: document.getElementById("client-code")?.value,
        ageGroup: document.getElementById("client-age-group")?.value,
        exactAge: document.getElementById("client-exact-age")?.value,
        context: document.getElementById("sampling-context")?.value,
        purpose: document.getElementById("eval-purpose")?.value,
        lingual: document.getElementById("lingual-profile")?.value,
        duration: document.getElementById("sample-duration")?.value,
        transcript: document.getElementById("transcript-input")?.value
      };
      localStorage.setItem("dil_analizi_inputs", JSON.stringify(data));
    } catch (e) {
      console.warn("Girdiler saklanamadı:", e);
    }
  }

  loadInitialInputs() {
    try {
      const saved = localStorage.getItem("dil_analizi_inputs");
      if (saved) {
        const data = JSON.parse(saved);
        if (data.code) document.getElementById("client-code").value = data.code;
        if (data.ageGroup) document.getElementById("client-age-group").value = data.ageGroup;
        if (data.exactAge) document.getElementById("client-exact-age").value = data.exactAge;
        if (data.context) document.getElementById("sampling-context").value = data.context;
        if (data.purpose) document.getElementById("eval-purpose").value = data.purpose;
        if (data.lingual) document.getElementById("lingual-profile").value = data.lingual;
        if (data.duration) document.getElementById("sample-duration").value = data.duration;
        if (data.transcript) document.getElementById("transcript-input").value = data.transcript;
      }
    } catch (e) {}
  }

  clearAll() {
    localStorage.removeItem("dil_analizi_inputs");
    document.getElementById("transcript-input").value = "";
    document.getElementById("client-code").value = "D-01";
    document.getElementById("client-exact-age").value = "";
    document.getElementById("sample-duration").value = "";
    this.qualitativeEngine.resetState();

    // Ses Kaydedici ve Dikte Temizliği (URL.revokeObjectURL ve bellek temizliği)
    if (this.voiceRecorder) {
      this.voiceRecorder.destroy();
    }
    if (this.dictationService && this.dictationService.isListening) {
      this.dictationService.stop();
    }
    const playerCard = document.getElementById("audio-player-card");
    if (playerCard) playerCard.style.display = "none";
    const player = document.getElementById("audio-player");
    if (player) player.src = "";
    const timerBadge = document.getElementById("recording-timer-badge");
    if (timerBadge) {
      timerBadge.textContent = "00:00";
      timerBadge.classList.remove("timer-active");
    }

    this.updateUtteranceCount();
    this.updateContextWarning();
    this.renderEmptyState();
    this.ui.showToast("Tüm form ve oturum verileri temizlendi.", "info");
  }

  /**
   * ANA ANALİZ BORU HATTI
   */
  runAnalysis() {
    const rawTranscript = document.getElementById("transcript-input")?.value || "";

    const clientProfile = {
      code: document.getElementById("client-code")?.value || "Belirtilmedi",
      ageGroup: document.getElementById("client-age-group")?.value || "4;0-5;11",
      exactAge: document.getElementById("client-exact-age")?.value || "",
      context: document.getElementById("sampling-context")?.value || "conversation",
      purpose: document.getElementById("eval-purpose")?.value || "assessment",
      lingualProfile: document.getElementById("lingual-profile")?.value || "monolingual",
      duration: document.getElementById("sample-duration")?.value ? parseFloat(document.getElementById("sample-duration").value) : null
    };

    // 1. Transkript Ayrıştırma
    const parsedData = TranscriptParser.parse(rawTranscript);

    if (!parsedData.isValid) {
      this.renderParseError(parsedData.error);
      return;
    }

    // 2. Türkçe Morfem Ayrıştırma
    const morphologyData = TurkishMorphology.analyzeUtterances(parsedData.childUtterances);

    // 3. Ölçütleri Hesapla
    const metrics = LanguageMetrics.computeAll(parsedData, morphologyData, clientProfile);

    // 4. Güvenilirlik Değerlendirmesi
    const adequacy = ReliabilityEngine.evaluateSampleAdequacy(metrics.ntu);
    const reliabilityTable = ReliabilityEngine.getReliabilityTable(metrics.durationMinutes);

    this.lastAnalysisResult = {
      clientProfile,
      parsedData,
      morphologyData,
      metrics,
      adequacy,
      reliabilityTable,
      analyzedAt: new Date().toLocaleString("tr-TR")
    };

    // Tüm Sekmeleri Çiz
    this.renderTab1Summary(this.lastAnalysisResult);
    this.renderTab2Morphology(this.lastAnalysisResult);
    this.renderTab3Lexical(this.lastAnalysisResult);
    this.renderTab4Discourse(this.lastAnalysisResult);
    this.renderQualitativeModule();
    this.renderTab6Clinical(this.lastAnalysisResult);

    this.ui.showToast("Dil örneği analizi başarıyla tamamlandı.", "success");
  }

  /**
   * Ayrıştırma Hatası Durumu
   */
  renderParseError(errorMsg) {
    const container = document.getElementById("analysis-results-container");
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state-alert alert-warning">
        <div class="empty-icon">⚠️</div>
        <h3>Transkript Ayrıştırılamadı</h3>
        <p>${errorMsg}</p>
        <div class="guidance-box">
          <strong>Örnek Doğru Format:</strong>
          <pre><code>[00:05] T: Ne gördün parkta?
[00:08] Ç: Büyük bir köpek gördüm.
[00:12] Ç: (ııı) köpek havladı.</code></pre>
        </div>
      </div>
    `;
  }

  renderEmptyState() {
    const container = document.getElementById("analysis-results-container");
    if (container) {
      container.innerHTML = `
        <div class="empty-state-alert">
          <div class="empty-icon">📝</div>
          <h3>Analiz İçin Transkript Bekleniyor</h3>
          <p>Sol panelden bir transkript yapıştırın, örnek yükleyin veya canlı dikte ile kaydedin.</p>
        </div>
      `;
    }
  }

  /**
   * SEKME 1: Özet ve Güvenilirlik (Heilmann ve ark., 2010)
   */
  renderTab1Summary(res) {
    const { metrics, adequacy, reliabilityTable, clientProfile } = res;

    // Yeterlilik kartı
    const adequacyBox = document.getElementById("adequacy-banner");
    if (adequacyBox) {
      adequacyBox.className = `adequacy-card ${adequacy.cardClass}`;
      adequacyBox.innerHTML = `
        <div class="adequacy-header">
          <span class="badge ${adequacy.isAdequate ? "badge-success" : "badge-warning"}">${adequacy.badge}</span>
          <h4>${adequacy.title}</h4>
          <span class="citation-tag" data-citation="heilmann2010">Kaynak: ${adequacy.citation} ⓘ</span>
        </div>
        <p class="adequacy-message">${adequacy.message}</p>
      `;
    }

    // Metrik Kartları
    document.getElementById("val-ntu").textContent = metrics.ntu;
    document.getElementById("val-ntw").textContent = metrics.ntw;
    document.getElementById("val-ndw").textContent = metrics.ndw;
    document.getElementById("val-ttr").textContent = metrics.ttr;
    document.getElementById("val-mlu").textContent = metrics.mluWords;
    document.getElementById("val-mlum").textContent = metrics.mlum;
    document.getElementById("val-wpm").textContent = metrics.wpm !== null ? metrics.wpm : "—";

    // Labirent
    const mazeEl = document.getElementById("val-maze");
    if (mazeEl) {
      mazeEl.innerHTML = `${metrics.maze.percentage}% <small class="text-muted">(${metrics.maze.totalMazeWords} sözcük, ${metrics.maze.isExplicitlyCoded ? "kodlandı" : "tahmini"})</small>`;
    }

    // Hatalar
    const errEl = document.getElementById("val-errors");
    if (errEl) {
      if (metrics.errors.isCoded) {
        errEl.innerHTML = `${metrics.errors.composite} <small class="text-muted">(${metrics.errors.perMinute !== null ? metrics.errors.perMinute + '/dk' : 'kodlandı'})</small>`;
      } else {
        errEl.innerHTML = `<span class="badge badge-secondary">Kodlanmadı</span>`;
      }
    }

    // En Uzun İfade
    const longestEl = document.getElementById("val-longest-utt");
    if (longestEl && metrics.longestUtterance) {
      longestEl.innerHTML = `
        <div class="longest-utt-box">
          <span class="longest-meta">İfade #${metrics.longestUtterance.id} (${metrics.longestUtterance.wordCount} sözcük):</span>
          <blockquote class="longest-quote">"${metrics.longestUtterance.rawText}"</blockquote>
        </div>
      `;
    }

    // Güvenilirlik Tablosu (Tablo 2 Cronbach Alfa)
    const tableBody = document.getElementById("reliability-table-body");
    const noteEl = document.getElementById("reliability-mapping-note");
    if (noteEl) noteEl.textContent = reliabilityTable.mappingNote;

    if (tableBody) {
      tableBody.innerHTML = reliabilityTable.rows.map(r => `
        <tr>
          <td><strong>${r.metric}</strong></td>
          <td><code>α = ${r.alpha.toFixed(2)}</code></td>
          <td><span class="badge ${r.band.badgeClass}">${r.band.label}</span></td>
          <td><small>${r.note}</small></td>
        </tr>
      `).join("");
    }
  }

  /**
   * SEKME 2: Biçimbilim ve Sözdizimi (Makale 1 ve 2)
   */
  renderTab2Morphology(res) {
    const { morphologyData, metrics } = res;

    // Brown Aşaması
    const brownBox = document.getElementById("brown-stage-box");
    if (brownBox) {
      brownBox.innerHTML = `
        <div class="stage-badge-large">${metrics.brownStage.stage}</div>
        <div class="stage-info">
          <h5>Gelişimsel Eşleşme: ${metrics.brownStage.ageRange}</h5>
          <p>${metrics.brownStage.description}</p>
          <div class="norm-disclaimer">
            <strong>⚠️ Norm Uyarısı (Westerveld & Claessen 2014):</strong> ${metrics.brownStage.disclaimer}
          </div>
        </div>
      `;
    }

    // Ek Frekans Grafiği ve Tablosu
    this.ui.renderAffixChart(morphologyData.affixCounts);

    const affixTable = document.getElementById("affix-table-body");
    if (affixTable) {
      const sortedAffixes = Object.entries(morphologyData.affixCounts).sort((a, b) => b[1] - a[1]);
      const totalAffixes = sortedAffixes.reduce((acc, curr) => acc + curr[1], 0);

      affixTable.innerHTML = sortedAffixes.slice(0, 8).map(([name, count]) => `
        <tr>
          <td>${name}</td>
          <td><strong>${count}</strong></td>
          <td>%${totalAffixes > 0 ? ((count / totalAffixes) * 100).toFixed(1) : 0}</td>
        </tr>
      `).join("");
    }

    // LARSP Grafiği
    this.ui.renderLarspChart(metrics.larspDistribution);

    // İlk 8 İfade Morfem Döküm Tablosu
    const breakdownContainer = document.getElementById("morpheme-breakdown-list");
    if (breakdownContainer) {
      breakdownContainer.innerHTML = morphologyData.breakdownExamples.map(ex => `
        <div class="breakdown-card">
          <div class="breakdown-header">
            <strong>İfade #${ex.id}:</strong> <em>"${ex.rawText}"</em>
            <span class="badge badge-info">${ex.totalMorphemes} Morfem</span>
          </div>
          <div class="breakdown-words">
            ${ex.wordsParsed.map(wp => `
              <span class="morpheme-chip ${wp.isEstimated ? 'chip-estimated' : ''}" title="${wp.isEstimated ? 'Sözlük dışı (Tahmini Kök)' : 'Doğrulanmış Kök'}">
                <strong class="chip-root">${wp.root}</strong>
                ${wp.suffixes.map(s => `<span class="chip-suffix">${s.affix}</span>`).join("")}
              </span>
            `).join(" ")}
          </div>
        </div>
      `).join("");
    }
  }

  /**
   * SEKME 3: Sözdizimi-Sözcük (Sözcük Çeşitliliği)
   */
  renderTab3Lexical(res) {
    const { metrics } = res;

    // En Sık 15 Sözcük Tablosu
    const topWordsTable = document.getElementById("top-words-table-body");
    if (topWordsTable) {
      topWordsTable.innerHTML = metrics.sortedWords.map((w, idx) => `
        <tr>
          <td>${idx + 1}</td>
          <td><strong>${w.word}</strong></td>
          <td><span class="pos-tag pos-${w.pos}">${w.pos}</span></td>
          <td>${w.count}</td>
          <td>%${w.percentage}</td>
        </tr>
      `).join("");
    }

    // POS Grafiği
    this.ui.renderPosChart(metrics.posCounts);

    // Nadir İşaretçiler Kartı
    const rareBox = document.getElementById("rare-markers-box");
    if (rareBox) {
      const rm = metrics.rareMarkers;
      rareBox.innerHTML = `
        <div class="rare-metric-item">
          <span class="rare-label">Soru Sözcükleri:</span>
          <span class="rare-val">${rm.questionWordsCount} adet</span>
          <span class="rare-rate">${rm.questionRatePerMin !== null ? rm.questionRatePerMin + '/dk' : 'Süre girilmedi'}</span>
          <small class="text-muted">(Makale 1 ref: ~${rm.benchmarks.questionRate}/dk)</small>
        </div>
        <div class="rare-metric-item">
          <span class="rare-label">Olumsuzluklar:</span>
          <span class="rare-val">${rm.negationsCount} adet</span>
          <span class="rare-rate">${rm.negationRatePerMin !== null ? rm.negationRatePerMin + '/dk' : 'Süre girilmedi'}</span>
          <small class="text-muted">(Makale 1 ref: ~${rm.benchmarks.negationRate}/dk)</small>
        </div>
        <div class="rare-metric-item">
          <span class="rare-label">İşaret Sözcükleri:</span>
          <span class="rare-val">${rm.demonstrativesCount} adet</span>
          <span class="rare-rate">${rm.demonstrativeRatePerMin !== null ? rm.demonstrativeRatePerMin + '/dk' : 'Süre girilmedi'}</span>
          <small class="text-muted">(Makale 1 ref: ~${rm.benchmarks.demonstrativeRate}/dk)</small>
        </div>
      `;
    }
  }

  /**
   * SEKME 4: Söylem, Anlamsal ve Labirent
   */
  renderTab4Discourse(res) {
    const { metrics } = res;

    // Labirent detayları
    const mazeDetailBox = document.getElementById("maze-breakdown-box");
    if (mazeDetailBox) {
      mazeDetailBox.innerHTML = `
        <div class="metric-mini-card">
          <span class="mini-label">Toplam Labirent Oranı</span>
          <span class="mini-value">%${metrics.maze.percentage}</span>
        </div>
        <div class="metric-mini-card">
          <span class="mini-label">Dolgu Sözcükler (ııı, şey)</span>
          <span class="mini-value">${metrics.maze.detectedFillersCount}</span>
        </div>
        <div class="metric-mini-card">
          <span class="mini-label">Tekrarlar (ben ben)</span>
          <span class="mini-value">${metrics.maze.detectedRepetitionsCount}</span>
        </div>
        <div class="metric-mini-card">
          <span class="mini-label">Kodlama Durumu</span>
          <span class="mini-value">${metrics.maze.isExplicitlyCoded ? "Kullanıcı Kodladı" : "Otomatik Bulundu"}</span>
        </div>
      `;
    }

    // Konuşma Sırası Dinamikleri
    const turnBox = document.getElementById("discourse-turn-box");
    if (turnBox) {
      const dd = metrics.discourseDynamics;
      turnBox.innerHTML = `
        <tr><td>Toplam Konuşma Sırası (Tur):</td><td><strong>${dd.totalTurns}</strong></td></tr>
        <tr><td>Çocuk İfade / Tur Sayısı:</td><td><strong>${dd.childTurnsCount}</strong></td></tr>
        <tr><td>Terapist İfade / Tur Sayısı:</td><td><strong>${dd.therapistTurnsCount}</strong></td></tr>
        <tr><td>Terapist / Çocuk Sözcük Oranı:</td><td><strong>${dd.therapistChildWordRatio !== null ? dd.therapistChildWordRatio : 'Terapist konuşmadı'}</strong></td></tr>
        <tr><td>Çocuğun Başlattığı / Soru Oranı:</td><td><strong>%${dd.childInitiatedRatio}</strong> (${dd.childInitiatedCount} ifade)</td></tr>
        <tr><td>Çocuk Ortalama Tur Uzunluğu:</td><td><strong>${dd.childMeanTurnLength} sözcük</strong></td></tr>
        <tr><td>Terapist Ortalama Tur Uzunluğu:</td><td><strong>${dd.therapistMeanTurnLength} sözcük</strong></td></tr>
      `;
    }

    // Anlatı Hikâye Dilbilgisi
    const storyBox = document.getElementById("story-grammar-box");
    if (storyBox) {
      const sg = metrics.storyGrammar;
      storyBox.innerHTML = `
        <div class="story-progress-bar">
          <div class="progress-fill" style="width: ${(sg.identifiedCount / sg.totalCount) * 100}%"></div>
        </div>
        <div class="story-elements-grid">
          ${sg.elements.map(el => `
            <div class="story-element-card ${el.found ? 'found' : 'missing'}">
              <div class="element-header">
                <span class="element-status">${el.found ? '✓' : '○'}</span>
                <strong>${el.name}</strong>
              </div>
              <div class="element-evidence">
                ${el.found
                  ? el.evidence.map(ev => `<small class="ev-item">"${ev.text}" (anahtar: <em>${ev.keyword}</em>)</small>`).join("")
                  : `<small class="text-muted">Açık anahtar sözcük bulunamadı.</small>`}
              </div>
            </div>
          `).join("")}
        </div>
        <p class="story-disclaimer"><small>${sg.note}</small></p>
      `;
    }
  }

  /**
   * SEKME 5: Nitel Analiz (Özdemir, 2010)
   */
  renderQualitativeModule() {
    if (!this.lastAnalysisResult) return;
    const childUtterances = this.lastAnalysisResult.parsedData.childUtterances;

    // Strateji seçiciyi senkronize et
    const stratSelect = document.getElementById("qual-strategy-select");
    if (stratSelect) stratSelect.value = this.qualitativeEngine.state.selectedStrategy;

    // Strateji rehberi kutusu
    const stratInfoBox = document.getElementById("qual-strategy-info");
    const strategies = QualitativeAnalysisEngine.getStrategies();
    const curStrat = strategies[this.qualitativeEngine.state.selectedStrategy] || strategies.constant_comparative;

    if (stratInfoBox) {
      stratInfoBox.innerHTML = `
        <div class="strat-header">
          <h4>${curStrat.title}</h4>
          <span class="strat-founder">${curStrat.founder}</span>
        </div>
        <p class="strat-desc">${curStrat.description}</p>
        <div class="strat-steps">
          <strong>Uygulanacak Aşamalar:</strong>
          <ol>
            ${curStrat.steps.map(s => `<li>${s}</li>`).join("")}
          </ol>
        </div>
      `;
    }

    // Kodlama Arayüzü: İfade Listesi
    const uttListContainer = document.getElementById("qual-utterances-list");
    if (uttListContainer) {
      uttListContainer.innerHTML = childUtterances.map(u => {
        const assignedCodeIds = this.qualitativeEngine.state.utteranceCodings[u.id] || [];
        const assignedCodes = this.qualitativeEngine.state.codes.filter(c => assignedCodeIds.includes(c.id));

        return `
          <div class="qual-utterance-row" data-utt-id="${u.id}">
            <div class="qual-utt-meta">
              <span class="utt-num">#${u.id}</span>
              <span class="utt-text">${u.rawText}</span>
            </div>
            <div class="qual-utt-codes">
              ${assignedCodes.map(c => `
                <span class="qual-code-badge" style="background-color: ${c.color}">
                  ${c.name}
                  <button type="button" class="btn-remove-code" data-utt-id="${u.id}" data-code-id="${c.id}">&times;</button>
                </span>
              `).join("")}
              <button type="button" class="btn-assign-code" data-utt-id="${u.id}">+ Kod Ata</button>
            </div>
          </div>
        `;
      }).join("");

      // Kod atama butonları
      uttListContainer.querySelectorAll(".btn-assign-code").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const uId = e.currentTarget.getAttribute("data-utt-id");
          this.promptAssignCode(uId);
        });
      });

      // Kod silme butonları
      uttListContainer.querySelectorAll(".btn-remove-code").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const uId = e.currentTarget.getAttribute("data-utt-id");
          const cId = e.currentTarget.getAttribute("data-code-id");
          this.qualitativeEngine.toggleUtteranceCode(uId, cId);
          this.renderQualitativeModule();
        });
      });
    }

    // Kod-Kategori-Tema Matrisi Tablosu
    const matrix = this.qualitativeEngine.getMatrix(childUtterances);
    const matrixTable = document.getElementById("qual-matrix-body");
    if (matrixTable) {
      if (matrix.length === 0) {
        matrixTable.innerHTML = `<tr><td colspan="5" class="text-center text-muted">Henüz tanımlı kod bulunmamaktadır. "Ön-Kod Önerilerini Uygula" düğmesine basabilir veya yeni kod ekleyebilirsiniz.</td></tr>`;
      } else {
        matrixTable.innerHTML = matrix.map(m => `
          <tr>
            <td>
              <span class="matrix-code-chip" style="background-color: ${m.code.color}">${m.code.name}</span>
            </td>
            <td><strong>${m.category}</strong></td>
            <td>${m.theme}</td>
            <td><span class="badge badge-info">${m.frequency} ifade</span></td>
            <td>
              <button type="button" class="btn btn-sm btn-outline-danger btn-delete-code" data-code-id="${m.code.id}">Sil</button>
            </td>
          </tr>
        `).join("");

        matrixTable.querySelectorAll(".btn-delete-code").forEach(btn => {
          btn.addEventListener("click", (e) => {
            const cId = e.currentTarget.getAttribute("data-code-id");
            if (confirm("Bu kod silinsin mi?")) {
              this.qualitativeEngine.deleteCode(cId);
              this.renderQualitativeModule();
            }
          });
        });
      }
    }

    // Nitel Kod Grafiği
    const freqs = this.qualitativeEngine.getCodeFrequencies();
    this.ui.renderQualitativeChart(freqs);

    // Tema Ağacı Görünümü
    this.renderThemeTree();

    // Doğrudan Alıntılar Önizleme
    const quotesPreview = document.getElementById("qual-quotes-preview");
    if (quotesPreview) {
      quotesPreview.textContent = this.qualitativeEngine.compileDirectQuotes(childUtterances);
    }
  }

  promptAssignCode(utteranceId) {
    if (this.qualitativeEngine.state.codes.length === 0) {
      alert("Henüz tanımlı bir kod yok. Önce otomatik önerileri uygulayabilir veya yeni bir kod ekleyebilirsiniz.");
      return;
    }

    const codeNames = this.qualitativeEngine.state.codes.map((c, i) => `${i + 1}. ${c.name}`).join("\n");
    const choice = prompt(`Atamak istediğiniz kodun numarasını veya adını girin:\n${codeNames}`);
    if (!choice) return;

    let targetCode = null;
    const num = parseInt(choice, 10);
    if (!isNaN(num) && num > 0 && num <= this.qualitativeEngine.state.codes.length) {
      targetCode = this.qualitativeEngine.state.codes[num - 1];
    } else {
      targetCode = this.qualitativeEngine.state.codes.find(c => c.name.toLowerCase() === choice.trim().toLowerCase());
    }

    if (targetCode) {
      this.qualitativeEngine.toggleUtteranceCode(utteranceId, targetCode.id);
      this.renderQualitativeModule();
    } else {
      alert("Kod bulunamadı.");
    }
  }

  renderThemeTree() {
    const treeContainer = document.getElementById("qual-theme-tree");
    if (!treeContainer) return;

    const themes = this.qualitativeEngine.state.themes;
    const categories = this.qualitativeEngine.state.categories;
    const codes = this.qualitativeEngine.state.codes;

    if (themes.length === 0 && categories.length === 0 && codes.length === 0) {
      treeContainer.innerHTML = `<p class="text-muted">Ağaç yapısını oluşturmak için kod ve temalar ekleyiniz.</p>`;
      return;
    }

    let treeHtml = `<div class="tree-root"><strong>Çekirdek Dil Örneği (Veri)</strong><ul>`;

    themes.forEach(t => {
      const themeCats = categories.filter(c => c.themeId === t.id);
      treeHtml += `<li><strong>Tema: ${t.name}</strong><ul>`;

      themeCats.forEach(c => {
        const catCodes = codes.filter(cod => cod.categoryId === c.id);
        treeHtml += `<li><em>Kategori: ${c.name}</em><ul>`;
        catCodes.forEach(cod => {
          treeHtml += `<li><span style="color: ${cod.color}">●</span> Kod: ${cod.name}</li>`;
        });
        treeHtml += `</ul></li>`;
      });

      treeHtml += `</ul></li>`;
    });

    // Temasız kategoriler
    const orphanCats = categories.filter(c => !c.themeId);
    if (orphanCats.length > 0) {
      treeHtml += `<li><strong>(Temasız Kategoriler)</strong><ul>`;
      orphanCats.forEach(c => {
        const catCodes = codes.filter(cod => cod.categoryId === c.id);
        treeHtml += `<li><em>Kategori: ${c.name}</em><ul>`;
        catCodes.forEach(cod => {
          treeHtml += `<li><span style="color: ${cod.color}">●</span> Kod: ${cod.name}</li>`;
        });
        treeHtml += `</ul></li>`;
      });
      treeHtml += `</ul></li>`;
    }

    treeHtml += `</ul></div>`;
    treeContainer.innerHTML = treeHtml;
  }

  /**
   * SEKME 6: Bağlam ve Klinik Öneri (Westerveld & Claessen 2014)
   */
  renderTab6Clinical(res) {
    const { clientProfile, adequacy, metrics } = res;

    // Otomatik Klinik Rapor Oluşturucu
    const reportBox = document.getElementById("clinical-summary-report");
    if (reportBox) {
      let goalsText = "";
      if (clientProfile.purpose === "screening") {
        goalsText = "Bu değerlendirme tarama amaçlıdır; standartlaştırılmış testler ve gelişimsel kontrol listeleriyle desteklenmelidir.";
      } else if (clientProfile.purpose === "diagnosis") {
        goalsText = "Tanısal kararlar için tek bir kısa dil örneği yeterli değildir; farklı ortamlarda (ev/okul) ve farklı bağlamlarda ek örnekler alınmalıdır.";
      } else if (clientProfile.purpose === "goals") {
        goalsText = `Müdahale hedefi olarak morfolojik çeşitlilik (MLUm = ${metrics.mlum}) ve karmaşık cümle yapılarının artırılması hedeflenebilir.`;
      } else {
        goalsText = "İlerleme takibinde oturumlar arasında mutlaka AYNI bağlam, AYNI uyaranlar ve benzer süre kullanılmalıdır (Makale 1).";
      }

      reportBox.innerHTML = `
        <div class="report-section">
          <h4>Klinik Değerlendirme Rapor Özeti</h4>
          <p><strong>Danışan:</strong> ${clientProfile.code} | <strong>Yaş Grubu:</strong> ${clientProfile.ageGroup} (${clientProfile.exactAge || 'tam yaş belirtilmedi'}) | <strong>Bağlam:</strong> ${clientProfile.context}</p>
          <hr>
          <h5>1. Örnek Yeterliliği ve Kararlılık:</h5>
          <p>${adequacy.message}</p>

          <h5>2. Güvenilir Ölçütler (Heilmann ve ark., 2010):</h5>
          <p>Bu örnekte <strong>NTU (${metrics.ntu})</strong>, <strong>NDW (${metrics.ndw})</strong> ve <strong>WPM (${metrics.wpm || 'hesaplanmadı'})</strong> ölçütleri en yüksek test-tekrar test kararlılığına sahiptir (α > 0.70).</p>

          <h5>3. Dikkatle Yorumlanacak Ölçütler:</h5>
          <p><strong>MLUm (${metrics.mlum})</strong> ve <strong>% Labirent (%${metrics.maze.percentage})</strong> kısa örneklerde oturumlar arasında değişkenlik gösterebilir; tek başına tanı ölçütü olarak kullanılmamalıdır.</p>

          <h5>4. Amaca Yönelik Klinik Öneri (${clientProfile.purpose}):</h5>
          <p>${goalsText}</p>
        </div>
      `;
    }

    // Yaşa Göre Bağlam Grafiği
    this.ui.renderAgeContextChart();
  }

  /**
   * Oturum Kaydetme ve İlerleme İzleme (Tab 6)
   */
  saveCurrentSession() {
    if (!this.lastAnalysisResult) {
      this.ui.showToast("Kaydedilecek bir analiz sonucu bulunamadı.", "warning");
      return;
    }

    const { clientProfile, metrics } = this.lastAnalysisResult;
    const sessionRecord = {
      id: Date.now(),
      date: new Date().toLocaleDateString("tr-TR"),
      clientCode: clientProfile.code,
      exactAge: clientProfile.exactAge,
      context: clientProfile.context,
      metrics: {
        ntu: metrics.ntu,
        ndw: metrics.ndw,
        mlum: metrics.mlum,
        wpm: metrics.wpm
      }
    };

    let history = [];
    try {
      const saved = localStorage.getItem("dil_analizi_client_history");
      if (saved) history = JSON.parse(saved);
    } catch (e) {}

    history.push(sessionRecord);
    localStorage.setItem("dil_analizi_client_history", JSON.stringify(history));

    this.renderLongitudinalHistory();
    this.ui.showToast("Bu oturum ilerleme izleme geçmişine kaydedildi.", "success");
  }

  renderLongitudinalHistory() {
    let history = [];
    try {
      const saved = localStorage.getItem("dil_analizi_client_history");
      if (saved) history = JSON.parse(saved);
    } catch (e) {}

    const tableBody = document.getElementById("history-table-body");
    if (tableBody) {
      if (history.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Henüz kaydedilmiş oturum bulunmamaktadır.</td></tr>`;
      } else {
        tableBody.innerHTML = history.map((s, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${s.date}</td>
            <td><strong>${s.clientCode}</strong></td>
            <td>${s.context}</td>
            <td>NTU: ${s.metrics.ntu}, NDW: ${s.metrics.ndw}, MLUm: ${s.metrics.mlum}</td>
            <td>
              <button type="button" class="btn btn-sm btn-outline-danger btn-delete-session" data-session-id="${s.id}">Sil</button>
            </td>
          </tr>
        `).join("");

        tableBody.querySelectorAll(".btn-delete-session").forEach(btn => {
          btn.addEventListener("click", (e) => {
            const sid = parseInt(e.currentTarget.getAttribute("data-session-id"), 10);
            history = history.filter(item => item.id !== sid);
            localStorage.setItem("dil_analizi_client_history", JSON.stringify(history));
            this.renderLongitudinalHistory();
          });
        });
      }
    }

    this.ui.renderLongitudinalChart(history);
  }

  /**
   * JSON Dışa Aktar
   */
  exportJSON() {
    if (!this.lastAnalysisResult) {
      this.ui.showToast("Dışa aktarılacak analiz sonucu yok.", "warning");
      return;
    }

    const payload = {
      project: "Dil Analizi - Klinik Dil Örneği Analiz Raporu",
      generatedAt: new Date().toISOString(),
      clientProfile: this.lastAnalysisResult.clientProfile,
      metrics: this.lastAnalysisResult.metrics,
      adequacy: this.lastAnalysisResult.adequacy,
      qualitativeState: this.qualitativeEngine.state
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dil-analizi-${this.lastAnalysisResult.clientProfile.code || "rapor"}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.ui.showToast("JSON raporu indirildi.", "success");
  }

  /**
   * CSV (Ölçütler Tablosu) Dışa Aktar
   */
  exportCSV() {
    if (!this.lastAnalysisResult) {
      this.ui.showToast("Dışa aktarılacak analiz sonucu yok.", "warning");
      return;
    }

    const m = this.lastAnalysisResult.metrics;
    const p = this.lastAnalysisResult.clientProfile;

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += "Ölçüt,Değer,Birim / Not\n";
    csvContent += `Danışan Kodu,"${p.code}",\n`;
    csvContent += `Yaş Grubu,"${p.ageGroup}",${p.exactAge || ""}\n`;
    csvContent += `Bağlam,"${p.context}",\n`;
    csvContent += `Çocuk İfadesi (NTU),${m.ntu},ifade\n`;
    csvContent += `Toplam Sözcük (NTW),${m.ntw},sözcük\n`;
    csvContent += `Farklı Sözcük (NDW),${m.ndw},çeşitlilik\n`;
    csvContent += `Type-Token Oranı (TTR),${m.ttr},oran\n`;
    csvContent += `Ortalama İfade Uzunluğu (MLU - Sözcük),${m.mluWords},sözcük/ifade\n`;
    csvContent += `Ortalama İfade Uzunluğu (MLUm - Morfem),${m.mlum},morfem/ifade\n`;
    csvContent += `Dakikadaki Sözcük (WPM),${m.wpm || ""},sözcük/dk\n`;
    csvContent += `Labirent Yüzdesi (% Maze),%${m.maze.percentage},${m.maze.totalMazeWords} sözcük\n`;
    csvContent += `Hata ve Eksiklikler,${m.errors.composite},${m.errors.perMinute || ""} /dk\n`;
    csvContent += `Brown Gelişim Aşaması,"${m.brownStage.stage}","${m.brownStage.ageRange}"\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dil-analizi-${p.code || "metrikler"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    this.ui.showToast("CSV metrik tablosu indirildi.", "success");
  }

  /**
   * Kaydedilen Ses Dosyasını (Binary Audio Blob) Doğrudan .txt Uzantısıyla İndir
   */
  downloadAudioAsTxt() {
    if (!this.voiceRecorder || !this.voiceRecorder.audioBlob) {
      this.ui.showToast("Önce bir ses kaydı yapmalısınız.", "warning");
      return;
    }

    const audioBlob = this.voiceRecorder.audioBlob;
    const clientCode = document.getElementById("client-code")?.value || "Danisan";
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${clientCode}-ses-kaydi-${dateStr}.txt`;

    // Ses dosyasını .txt MIME türü ve .txt uzantısıyla doğrudan indir
    const txtBlob = new Blob([audioBlob], { type: "text/plain;charset=x-user-defined" });
    const url = URL.createObjectURL(txtBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    this.ui.showToast(`Ses dosyası '${filename}' olarak indirildi.`, "success");
  }

  /**
   * Kaydedilen Sesi Base64 Kodlu Metin (.txt) Olarak İndir
   */
  downloadAudioAsBase64Txt() {
    if (!this.voiceRecorder || !this.voiceRecorder.audioBlob) {
      this.ui.showToast("Önce bir ses kaydı yapmalısınız.", "warning");
      return;
    }

    const audioBlob = this.voiceRecorder.audioBlob;
    const clientCode = document.getElementById("client-code")?.value || "Danisan";
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${clientCode}-ses-base64-${dateStr}.txt`;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result;
      const blob = new Blob([base64Data], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      this.ui.showToast(`Ses Base64 verisi '${filename}' olarak indirildi.`, "success");
    };
    reader.readAsDataURL(audioBlob);
  }

  /**
   * Transkript Metnini Düz TXT Olarak İndir
   */
  exportTXT() {
    const text = document.getElementById("transcript-input")?.value?.trim() || "";
    if (!text) {
      this.ui.showToast("İndirilecek transkript metni bulunamadı.", "warning");
      return;
    }

    const code = document.getElementById("client-code")?.value || "Danisan";
    const dateStr = new Date().toISOString().slice(0, 10);
    this.downloadTxt(text, `${code}-transkript-${dateStr}.txt`);
    this.ui.showToast("Transkript .txt dosyası olarak indirildi.", "success");
  }

  /**
   * Düz Metin Dosyası İndirme Yardımcısı (Blob tabanlı)
   */
  downloadTxt(content, filename) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || `transkript-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

// Uygulamayı başlat
document.addEventListener("DOMContentLoaded", () => {
  window.dilAnaliziApp = new App();
});
