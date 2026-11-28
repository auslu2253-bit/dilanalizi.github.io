/**
 * Dil Analizi - Güvenilirlik ve Klinik Eşikler Modülü (reliability.js)
 * Makale 1: Heilmann, Nockerts & Miller (2010)
 * Makale 2: Westerveld & Claessen (2014)
 * Cronbach Alfa Eşikleri, Örnek Yeterliliği ve Bağlam Uyumu
 */

export class ReliabilityEngine {
  /**
   * Heilmann ve ark. (2010) Tablo 2 Cronbach Alfa Verileri (7 dakikalık referansa göre)
   */
  static ALPHA_BENCHMARKS = {
    1: {
      ntu: { alpha: 0.74, level: "Yüksek", band: "İyi", note: "1 dakikada bile yeterli kararlılık" },
      wpm: { alpha: 0.76, level: "Yüksek", band: "İyi", note: "Üretkenlik hızı için güvenilir" },
      ndw: { alpha: 0.73, level: "Yüksek", band: "İyi", note: "Sözcük çeşitliliği hızla yansır" },
      mlum: { alpha: 0.61, level: "Orta-İyi", band: "İstenmeyen/Sınırda", note: "Kısa sürede dalgalanabilir (0.56-0.79)" },
      maze: { alpha: 0.44, level: "Düşük/Değişken", band: "Yetersiz", note: "1 dakikalık örnekte labirent güvenilmez" },
      errors: { alpha: 0.48, level: "Düşük", band: "Yetersiz", note: "Tipik gelişimde nadir olduğundan 1 dk'da yetersiz" }
    },
    3: {
      ntu: { alpha: 0.88, level: "Yüksek", band: "Çok İyi", note: "Çok yüksek iç tutarlılık" },
      wpm: { alpha: 0.87, level: "Yüksek", band: "Çok İyi", note: "Konuşma hızı son derece kararlı" },
      ndw: { alpha: 0.84, level: "Yüksek", band: "Çok İyi", note: "Sözcük dağarcığı çeşitliliği güvenilir" },
      mlum: { alpha: 0.72, level: "Orta-İyi", band: "İyi", note: "Gramer morfemleri 3 dakikada kabul edilebilir" },
      maze: { alpha: 0.69, level: "Orta-İyi", band: "Asgari Kabul Edilebilir", note: "Küçük çocuk anlatılarında değişken olabilir" },
      errors: { alpha: 0.58, level: "Düşük", band: "Yetersiz", note: "3 dakikada da klinik karar için tek başına yetersiz" }
    }
  };

  /**
   * Alfa Yorum Bantları (DeVellis 1991 / Nunnally 1978)
   */
  static getAlphaBandInfo(alpha) {
    if (alpha < 0.60) {
      return { label: "Yetersiz", badgeClass: "badge-danger", color: "#e53e3e", desc: "< 0.60 kabul edilemez düzeyde düşük" };
    } else if (alpha < 0.65) {
      return { label: "İstenmeyen", badgeClass: "badge-warning-high", color: "#dd6b20", desc: "0.60 - 0.65 istenmeyen sınır" };
    } else if (alpha < 0.70) {
      return { label: "Asgari Kabul Edilebilir", badgeClass: "badge-warning", color: "#d69e2e", desc: "0.65 - 0.70 minimum kabul eşiği" };
    } else if (alpha < 0.80) {
      return { label: "İyi", badgeClass: "badge-info", color: "#319795", desc: "0.70 - 0.80 iyi düzeyde güvenilirlik" };
    } else {
      return { label: "Çok İyi", badgeClass: "badge-success", color: "#38a169", desc: ">= 0.80 yüksek güvenilirlik" };
    }
  }

  /**
   * Örnek Yeterliliğini Değerlendir (Makale 1 ve Makale 2)
   */
  static evaluateSampleAdequacy(ntu) {
    if (ntu >= 50) {
      return {
        isAdequate: true,
        level: "Yüksek",
        cardClass: "card-success",
        title: "Yüksek Güvenilirlikli Örnek",
        badge: "≥50 İfade Karşılandı",
        message: "Örnek boyutu geleneksel ≥50 ifade eşiğini karşılamaktadır (Lee 1974; Miller 1981; Templin 1957). Heilmann ve ark. (2010) çalışmasında 7 dakikalık örneklerde ortalama 97,4 ifade toplanmıştır. Ayrıntılı gramer, labirent ve sözcük analizi için güvenilirdir.",
        citation: "Heilmann et al. (2010); Miller (1981)"
      };
    } else {
      return {
        isAdequate: false,
        level: "Kısa Örnek (Dikkatli Yorum)",
        cardClass: "card-warning",
        title: "Kısa Klinik Örnek (<50 İfade)",
        badge: `${ntu} İfade (<50)`,
        message: "Örnek 50 ifadenin altındadır. Westerveld & Claessen (2014) anketinde Avustralyalı klinisyenlerin tipik örnek uzunluğu 16-23 ifade aralığındadır (aykırı değerler çıkarılınca sohbet ort. 23,3; anlatı 16,6). Bu uzunluk genel tarama için kullanılabilir ancak gramer morfemleri, labirent ve hata analizi gibi ayrıntılı incelemeler için kısa kabul edilir.",
        citation: "Westerveld & Claessen (2014); Heilmann et al. (2010)"
      };
    }
  }

  /**
   * Süreye göre en yakın güvenilirlik referans tablosunu getir
   */
  static getReliabilityTable(durationMinutes) {
    let mappedMin = 3;
    let mappingNote = "";

    if (!durationMinutes || durationMinutes <= 2) {
      mappedMin = 1;
      mappingNote = durationMinutes
        ? `Girilen süre (${durationMinutes} dk) en yakın referans olan 1 dakikalık modele eşlenmiştir.`
        : "Süre belirtilmediğinden 1 dakikalık asgari referans modeli gösterilmektedir.";
    } else {
      mappedMin = 3;
      mappingNote = `Girilen süre (${durationMinutes} dk) 3 dakikalık referans modeline eşlenmiştir.`;
    }

    const data = this.ALPHA_BENCHMARKS[mappedMin];
    const rows = [
      {
        metric: "Çocuk İfadesi (NTU)",
        code: "ntu",
        alpha: data.ntu.alpha,
        level: data.ntu.level,
        band: this.getAlphaBandInfo(data.ntu.alpha),
        note: data.ntu.note
      },
      {
        metric: "Dakikadaki Sözcük (WPM)",
        code: "wpm",
        alpha: data.wpm.alpha,
        level: data.wpm.level,
        band: this.getAlphaBandInfo(data.wpm.alpha),
        note: data.wpm.note
      },
      {
        metric: "Farklı Sözcük (NDW)",
        code: "ndw",
        alpha: data.ndw.alpha,
        level: data.ndw.level,
        band: this.getAlphaBandInfo(data.ndw.alpha),
        note: data.ndw.note
      },
      {
        metric: "Ortalama Morfem (MLUm)",
        code: "mlum",
        alpha: data.mlum.alpha,
        level: data.mlum.level,
        band: this.getAlphaBandInfo(data.mlum.alpha),
        note: data.mlum.note
      },
      {
        metric: "% Labirent (% Maze)",
        code: "maze",
        alpha: data.maze.alpha,
        level: data.maze.level,
        band: this.getAlphaBandInfo(data.maze.alpha),
        note: data.maze.note
      },
      {
        metric: "Hata ve Eksiklikler",
        code: "errors",
        alpha: data.errors.alpha,
        level: data.errors.level,
        band: this.getAlphaBandInfo(data.errors.alpha),
        note: data.errors.note
      }
    ];

    return {
      mappedMinutes: mappedMin,
      mappingNote,
      rows
    };
  }

  /**
   * Yaş ve Bağlam Uyumu Değerlendirmesi (Makale 2: Westerveld & Claessen 2014)
   */
  static evaluateContextMatch(ageGroup, exactAge, context) {
    let warningLevel = "info"; // "success", "warning", "info"
    let title = "Bağlam Uyumu";
    let message = "";
    let rationale = "";

    // Yaş tahmini
    let years = 5;
    if (exactAge && exactAge.includes(";")) {
      const parts = exactAge.split(";");
      years = parseFloat(parts[0]) + (parseFloat(parts[1]) || 0) / 12;
    } else if (ageGroup === "<4") {
      years = 3;
    } else if (ageGroup === "4;0-5;11") {
      years = 4.8;
    } else if (ageGroup === "6;0-11;11") {
      years = 8;
    } else if (ageGroup === "12+") {
      years = 13;
    }

    if (years < 1.5) {
      warningLevel = "warning";
      title = "Dikkat: Erken Gelişim Dönemi (<18 ay)";
      message = "18 aydan küçük ya da sözel iletişim kurmayan çocuklarda standart dil örneği analizi (LSA) uygun olmayabilir. Doğal iletişimsel niyet gözlemi ve ebeveyn bildirim ölçekleri önerilir.";
      rationale = "Westerveld & Claessen (2014) anketi uyarınca klinisyenler sözel olmayan veya çok küçük çocuklarda yapılandırılmış LSA yerine serbest oyun ve ebeveyn etkileşimi tercih etmektedir.";
    } else if (years < 4) {
      if (context === "play") {
        warningLevel = "success";
        title = "Mükemmel Eşleşme: Serbest Oyun";
        message = "< 4 yaş çocuklarda serbest oyun bağlamı doğal dili ve iletişimi en iyi yansıtan yöntemdir.";
        rationale = "Klinisyen anketinde okul öncesi küçük çocuklarda serbest oyunun açık ara en sık kullanılan bağlam olduğu saptanmıştır.";
      } else {
        warningLevel = "warning";
        title = "Olası Uyumsuzluk: Küçük Yaş Grubu";
        message = "4 yaşından küçük çocuklarda sohbet veya anlatı bağlamı zorlayıcı olabilir ve dil üretimini yapay olarak baskılayabilir. Serbest oyun bağlamı önerilir.";
        rationale = "4 yaş altı çocukların bilişsel ve söylem becerileri henüz yapılandırılmış anlatı üretimi için olgunlaşmamış olabilir.";
      }
    } else if (years >= 4 && years < 6) {
      if (context === "conversation" || context === "retelling" || context === "narrative") {
        warningLevel = "success";
        title = "Uygun Eşleşme: Sohbet veya Anlatı";
        message = "4;6 yaşından itibaren sohbet bağlamı ve resim destekli hikâye yeniden anlatma klinik olarak başarıyla uygulanır.";
        rationale = "Makale 2 bulgusu: Klinisyenlerin %82'si 4-5 yaş aralığında sohbet ve basit resimli anlatıları birincil yöntem olarak kullanmaktadır.";
      } else if (context === "expository") {
        warningLevel = "warning";
        title = "Bağlam Uyarısı: Açıklayıcı Söylem";
        message = "Açıklayıcı söylem (expository discourse) okul öncesi için oldukça soyut kalabilir; sohbet veya resimli hikâye bağlamı tercih edilmelidir.";
        rationale = "Açıklayıcı söylem nedensel ve mantıksal bilişsel şemalar gerektirir.";
      }
    } else if (years >= 6 && years < 12) {
      if (context === "narrative" || context === "retelling" || context === "expository") {
        warningLevel = "success";
        title = "Güçlü Eşleşme: Okul Çağı Anlatı ve Açıklayıcı Söylem";
        message = "Okul çağında hikâye anlatımı ve açıklayıcı söylem, sözdizimsel karmaşıklığı ve okul başarısıyla ilişkili akademik dili değerlendirmede en hassas bağlamlardır.";
        rationale = "Westerveld & Claessen (2014): Okul çağında serbest oyun terk edilir; anlatı ve açıklayıcı söylem müfredat beklentileriyle doğrudan örtüşür.";
      } else if (context === "play") {
        warningLevel = "warning";
        title = "Tavsiye: Daha Yapılandırılmış Bağlam";
        message = "Okul çağı çocuklarında serbest oyun, karmaşık yan tümceleri ve zengin sözcük dağarcığını ortaya çıkarmada yetersiz kalabilir.";
        rationale = "Daha zengin sözdizimi için hikâye üretimi veya kural açıklama gibi bağlamlar önerilir.";
      }
    } else {
      // 12+ yaş
      if (context === "expository") {
        warningLevel = "success";
        title = "İdeal Eşleşme: Adölesan ve Açıklayıcı Söylem";
        message = "Lise ve adölesan döneminde açıklayıcı söylem (bir oyunun kurallarını açıklama, bir süreci anlatma) akademik dil yeterliliğini değerlendirmede altın standarttır.";
        rationale = "Westerveld & Claessen (2014): Avustralyalı klinisyenlerin çoğu adölesanlarda alışkanlıkla kişisel anlatı kullansa da, literatür açıklayıcı söylemin karmaşık sözdizimini çok daha iyi uyardığını göstermektedir.";
      } else {
        warningLevel = "info";
        title = "Klinik Not: Adölesan Dönemi";
        message = "Bu yaş grubunda kişisel anlatı yaygın kullanılsa da, müfredat uyumlu karmaşık sözdizimini ölçmek için 'Açıklayıcı Söylem' (Expository) bağlamı güçlü bir alternatif olarak önerilir.";
        rationale = "Heilmann & Westerveld (2014); Nippold ve ark. (2008).";
      }
    }

    return {
      warningLevel,
      title,
      message,
      rationale
    };
  }
}
