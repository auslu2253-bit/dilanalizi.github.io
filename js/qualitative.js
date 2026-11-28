/**
 * Dil Analizi - Nitel Analiz Modülü (qualitative.js)
 * Makale 3: Özdemir (2010) "Nitel Veri Analizi: Sosyal Bilimlerde Yöntembilim Sorunsalı Üzerine Bir Çalışma"
 * Kodlama, Kategori, Tema, Görselleştirme, Doğrudan Alıntı Derleyici ve Geçerlik Hatırlatıcıları
 */

export class QualitativeAnalysisEngine {
  constructor(storageKey = "dil_analizi_qualitative_state") {
    this.storageKey = storageKey;
    this.state = this.loadState();
  }

  /**
   * Varsayılan durum nesnesi
   */
  getDefaultState() {
    return {
      selectedStrategy: "constant_comparative", // "content_analysis", "descriptive", "constant_comparative", "discourse", "phenomenological"
      codes: [
        // { id, name, categoryId, color, description }
      ],
      categories: [
        // { id, name, themeId, description }
      ],
      themes: [
        // { id, name, description }
      ],
      utteranceCodings: {
        // [utteranceId]: [codeId1, codeId2]
      }
    };
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("Nitel veri localStorage'dan okunamadı:", e);
    }
    return this.getDefaultState();
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    } catch (e) {
      console.warn("Nitel veri localStorage'a yazılamadı:", e);
    }
  }

  resetState() {
    this.state = this.getDefaultState();
    this.saveState();
  }

  /**
   * Nitel Strateji Açıklamaları ve Metodolojik Adımlar (Özdemir 2010)
   */
  static getStrategies() {
    return {
      constant_comparative: {
        id: "constant_comparative",
        title: "Sabit Karşılaştırma Analizi (Gömülü Teori / Tümevarım)",
        founder: "Glaser & Strauss (1967); Strauss & Corbin (1990)",
        description: "Veri parçaları (olaylar, ifadeler) sürekli birbiriyle karşılaştırılarak benzerlik ve farklılıklar saptanır. Açık kodlama ile kavramlar, eksenel kodlama ile kategoriler ve seçici kodlama ile çekirdek temalar türetilir.",
        steps: [
          "1. Veriyi okuma ve açık kodlama (ifadeleri kavramsallaştırma)",
          "2. Benzer kodları sürekli karşılaştırarak kategoriler altında toplama",
          "3. Kategorilerin boyutlarını ve alt özelliklerini netleştirme",
          "4. Seçici kodlama ile ana temayı (çekirdek kategoriyi) belirleme",
          "5. Veriye dayalı denenceler formüle etme"
        ]
      },
      content_analysis: {
        id: "content_analysis",
        title: "İçerik Analizi (Tümdengelimci / Frekans Odaklı)",
        founder: "Berelson (1952); Krippendorff (2004)",
        description: "Önceden belirlenmiş kuramsal çerçeveye göre kategoriler ve kodlar tanımlanır. Metindeki kodların frekansları sayılır ve sayısal dağılım üzerinden örüntüler çıkarılır.",
        steps: [
          "1. Kuramsal kategorileri önceden tanımlama",
          "2. Analiz birimini (ifade/kelime) belirleme",
          "3. Metni önceden belirlenen kod listesine göre tarama ve kodlama",
          "4. Kod frekanslarını ve kategori yüzdelerini hesaplama",
          "5. Bulguları kuramsal modele göre yorumlama"
        ]
      },
      descriptive: {
        id: "descriptive",
        title: "Betimsel Analiz (Doğrudan Alıntı ve Tema Özeti)",
        founder: "Wolcott (1994); Yıldırım & Şimşek (2008)",
        description: "Veriler araştırma sorularının veya önceden belirlenen temaların yapısına göre özetlenir ve doğrudan alıntılarla desteklenerek betimlenir. Yorumlama betimlemeye sadık kalınarak yapılır.",
        steps: [
          "1. Tematik çerçeveyi araştırma sorularına göre oluşturma",
          "2. Verileri temalara göre düzenleme ve gruplama",
          "3. Her temayı temsil eden çarpıcı doğrudan alıntıları seçme",
          "4. Bulguları nedensel ilişkilerle ve sade bir dille açıklama"
        ]
      },
      discourse: {
        id: "discourse",
        title: "Söylem ve Konuşma Çözümlemesi",
        founder: "Sacks, Schegloff & Jefferson (1974); Fairclough (1992)",
        description: "Konuşma sırası alma (turn-taking), duraklamalar, terapist-çocuk etkileşimi ve dilin sosyal eylemleri nasıl kurduğu incelenir.",
        steps: [
          "1. Konuşma sıralarını ve sıra geçişlerini işaretleme",
          "2. Soru-cevap çiftlerini ve konu başlatma girişimlerini analiz etme",
          "3. Onarım mekanizmalarını (labirentler, tekrarlar) bağlamında inceleme",
          "4. İletişimsel güç ve katılım dinamiklerini yorumlama"
        ]
      },
      phenomenological: {
        id: "phenomenological",
        title: "Fenomenolojik Analiz (Öznel Deneyim ve Anlam Dünyası)",
        founder: "Husserl; Moustakas (1994); Giorgi (1985)",
        description: "Çocuğun anlattığı deneyime (örneğin korku, kayıp, oyun başarısı) yüklediği öznel anlam ve yaşantının özü ortaya çıkarılmaya çalışılır.",
        steps: [
          "1. Ön yargıları askıya alma (epoche)",
          "2. İfadelerdeki anlam birimlerini tespit etme",
          "3. Anlam birimlerini öze ait temalarda birleştirme",
          "4. Yaşantının 'ne' ve 'nasıl' deneyimlendiğine dair yapısal betimleme oluşturma"
        ]
      }
    };
  }

  /**
   * Otomatik Ön-Kod Önerileri (Leech & Onwuegbuzie 2007 Anahtar Sözcük Mantığı)
   */
  static generateAutoSuggestions(childUtterances) {
    const rules = [
      {
        codeName: "Duygusal İfade",
        categoryName: "Duyuşsal Yaşantı",
        themeName: "İç Dünyası ve Duygusal Tepkiler",
        color: "#ed8936",
        keywords: ["korktu", "korktum", "korkup", "üzüldü", "üzüldüm", "kızdı", "kızdım", "sevindi", "sevindim", "ağladı", "mutlu", "komik", "acıdı", "şaşırdı"],
        description: "Korku, sevinç, üzüntü ve hayret gibi içsel duygu ifadeleri."
      },
      {
        codeName: "Nedensel Akıl Yürütme",
        categoryName: "Bilişsel & Mantıksal Açıklamalar",
        themeName: "Düşünme ve Problem Çözme Becerileri",
        color: "#319795",
        keywords: ["çünkü", "için", "bu yüzden", "onun için", "diye", "neden"],
        description: "Olaylar arasında neden-sonuç bağı kurma ve gerekçelendirme."
      },
      {
        codeName: "Zaman ve Olay Dizilimi",
        categoryName: "Anlatı Yapısı",
        themeName: "Söylem ve Zaman Çerçevesi",
        color: "#4299e1",
        keywords: ["sonra", "önce", "bir gün", "sabah", "gece", "dün", "şimdi", "artık", "aniden"],
        description: "Olayların kronolojik sırasını belirten zaman belirteçleri."
      },
      {
        codeName: "Reddetme ve İtiraz",
        categoryName: "İletişimsel İşlevler",
        themeName: "Sosyal Etkileşim ve Öznel Tutum",
        color: "#e53e3e",
        keywords: ["hayır", "istemiyorum", "olmaz", "yok", "değil", "bırak"],
        description: "Karşı çıkma, reddetme veya olumsuzlama bildiren ifadeler."
      },
      {
        codeName: "Merak ve Soru Sorma",
        categoryName: "Bilgi Edinme",
        themeName: "Düşünme ve Problem Çözme Becerileri",
        color: "#805ad5",
        keywords: ["nerede", "kim", "nasıl", "ne zaman", "ne oldu", "hangisi"],
        description: "Çevresini anlama, soru sorma ve bilgi talep etme girişimleri."
      },
      {
        codeName: "Yardım Çağrısı ve Talep",
        categoryName: "İletişimsel İşlevler",
        themeName: "Sosyal Etkileşim ve Öznel Tutum",
        color: "#38a169",
        keywords: ["yardım", "lütfen", "ver", "aç", "bak", "yapalım", "gel"],
        description: "Yetişkinden veya akrandan destek, eylem veya nesne talep etme."
      }
    ];

    const suggestions = [];

    rules.forEach((rule, rIdx) => {
      const matchingUtts = [];
      childUtterances.forEach(u => {
        const text = u.cleanedText.toLowerCase();
        for (const kw of rule.keywords) {
          if (text.includes(kw)) {
            matchingUtts.push({
              utteranceId: u.id,
              rawText: u.rawText,
              keyword: kw
            });
            break;
          }
        }
      });

      if (matchingUtts.length > 0) {
        suggestions.push({
          id: `auto_${rIdx}`,
          codeName: rule.codeName,
          categoryName: rule.categoryName,
          themeName: rule.themeName,
          color: rule.color,
          description: rule.description,
          matches: matchingUtts
        });
      }
    });

    return suggestions;
  }

  /**
   * Otomatik önerileri state'e ekle
   */
  applySuggestions(suggestions) {
    suggestions.forEach(s => {
      // 1. Tema kontrolü / oluştur
      let theme = this.state.themes.find(t => t.name === s.themeName);
      if (!theme) {
        theme = { id: `thm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, name: s.themeName, description: "Otomatik öneriden türetildi" };
        this.state.themes.push(theme);
      }

      // 2. Kategori kontrolü / oluştur
      let category = this.state.categories.find(c => c.name === s.categoryName && c.themeId === theme.id);
      if (!category) {
        category = { id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`, name: s.categoryName, themeId: theme.id, description: "" };
        this.state.categories.push(category);
      }

      // 3. Kod kontrolü / oluştur
      let code = this.state.codes.find(c => c.name === s.codeName);
      if (!code) {
        code = {
          id: `cod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          name: s.codeName,
          categoryId: category.id,
          color: s.color,
          description: s.description
        };
        this.state.codes.push(code);
      } else {
        code.categoryId = category.id;
      }

      // 4. İfade kodlamalarını ekle
      s.matches.forEach(m => {
        if (!this.state.utteranceCodings[m.utteranceId]) {
          this.state.utteranceCodings[m.utteranceId] = [];
        }
        if (!this.state.utteranceCodings[m.utteranceId].includes(code.id)) {
          this.state.utteranceCodings[m.utteranceId].push(code.id);
        }
      });
    });

    this.saveState();
  }

  /**
   * Bir ifadeye kod ata / kaldır
   */
  toggleUtteranceCode(utteranceId, codeId) {
    if (!this.state.utteranceCodings[utteranceId]) {
      this.state.utteranceCodings[utteranceId] = [];
    }
    const idx = this.state.utteranceCodings[utteranceId].indexOf(codeId);
    if (idx >= 0) {
      this.state.utteranceCodings[utteranceId].splice(idx, 1);
    } else {
      this.state.utteranceCodings[utteranceId].push(codeId);
    }
    this.saveState();
  }

  /**
   * Yeni Kod Ekle
   */
  addCode(name, categoryId = null, color = "#319795", description = "") {
    const id = `cod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newCode = { id, name, categoryId, color, description };
    this.state.codes.push(newCode);
    this.saveState();
    return newCode;
  }

  /**
   * Yeni Kategori Ekle
   */
  addCategory(name, themeId = null, description = "") {
    const id = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newCat = { id, name, themeId, description };
    this.state.categories.push(newCat);
    this.saveState();
    return newCat;
  }

  /**
   * Yeni Tema Ekle
   */
  addTheme(name, description = "") {
    const id = `thm_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const newThm = { id, name, description };
    this.state.themes.push(newThm);
    this.saveState();
    return newThm;
  }

  /**
   * Kod Sil
   */
  deleteCode(codeId) {
    this.state.codes = this.state.codes.filter(c => c.id !== codeId);
    for (const uId in this.state.utteranceCodings) {
      this.state.utteranceCodings[uId] = this.state.utteranceCodings[uId].filter(id => id !== codeId);
    }
    this.saveState();
  }

  /**
   * Kategori Sil
   */
  deleteCategory(catId) {
    this.state.categories = this.state.categories.filter(c => c.id !== catId);
    this.state.codes.forEach(code => {
      if (code.categoryId === catId) code.categoryId = null;
    });
    this.saveState();
  }

  /**
   * Tema Sil
   */
  deleteTheme(themeId) {
    this.state.themes = this.state.themes.filter(t => t.id !== themeId);
    this.state.categories.forEach(cat => {
      if (cat.themeId === themeId) cat.themeId = null;
    });
    this.saveState();
  }

  /**
   * Kod Frekans Dağılımını Hesapla
   */
  getCodeFrequencies() {
    const freqs = {};
    this.state.codes.forEach(c => freqs[c.id] = 0);

    for (const uId in this.state.utteranceCodings) {
      const codeIds = this.state.utteranceCodings[uId];
      codeIds.forEach(id => {
        if (freqs[id] !== undefined) freqs[id]++;
      });
    }

    return this.state.codes.map(c => ({
      code: c,
      count: freqs[c.id] || 0
    })).sort((a, b) => b.count - a.count);
  }

  /**
   * Kod - Kategori - Tema Matrisi
   */
  getMatrix(childUtterances) {
    const uttLookup = {};
    childUtterances.forEach(u => uttLookup[u.id] = u);

    const matrix = [];

    this.state.codes.forEach(code => {
      const cat = this.state.categories.find(c => c.id === code.categoryId);
      const thm = cat ? this.state.themes.find(t => t.id === cat.themeId) : null;

      // Bu koda sahip ifadeler
      const matchingUtts = [];
      for (const [uId, cIds] of Object.entries(this.state.utteranceCodings)) {
        if (cIds.includes(code.id) && uttLookup[uId]) {
          matchingUtts.push(uttLookup[uId]);
        }
      }

      matrix.push({
        code,
        category: cat ? cat.name : "Kategorisiz",
        theme: thm ? thm.name : "Temasız",
        frequency: matchingUtts.length,
        utterances: matchingUtts
      });
    });

    return matrix;
  }

  /**
   * Temaya Göre Blok Alıntı Derleyicisi (Rapor Yazımı için)
   */
  compileDirectQuotes(childUtterances) {
    const matrix = this.getMatrix(childUtterances);
    const themeGroups = {};

    matrix.forEach(item => {
      const thmName = item.theme;
      if (!themeGroups[thmName]) themeGroups[thmName] = {};

      const catName = item.category;
      if (!themeGroups[thmName][catName]) themeGroups[thmName][catName] = [];

      themeGroups[thmName][catName].push({
        codeName: item.code.name,
        color: item.code.color,
        utterances: item.utterances
      });
    });

    let reportMarkdown = "";

    for (const [theme, categories] of Object.entries(themeGroups)) {
      reportMarkdown += `### Tema: ${theme}\n\n`;

      for (const [category, codes] of Object.entries(categories)) {
        reportMarkdown += `#### Kategori: ${category}\n\n`;

        codes.forEach(c => {
          reportMarkdown += `* **Kod: ${c.codeName}** (${c.utterances.length} ifade)\n`;
          c.utterances.forEach(u => {
            reportMarkdown += `  > [İf. ${u.id}] "${u.rawText}"\n`;
          });
          reportMarkdown += `\n`;
        });
      }
    }

    return reportMarkdown || "Henüz kodlanmış ve gruplanmış ifade bulunmamaktadır.";
  }

  /**
   * Nitel Geçerlik ve Güvenilirlik Notları (Özdemir 2010)
   */
  static getValidityNotes() {
    return {
      internalValidity: {
        title: "İç Geçerlik (İnandırıcılık / Doğruluk)",
        desc: "Miles & Huberman (1994) uyarınca bulguların ham verilerle doğrudan uyuşmasıdır. Araştırmacı varsayımlarını doğrudan öğrenci/çocuk alıntılarıyla test etmeli, aykırı örnekleri göz ardı etmemelidir."
      },
      externalValidity: {
        title: "Dış Geçerlik (Aktarılabilirlik)",
        desc: "Bulguların benzer klinik bağlamlara aktarılabilmesi için örneklem bağlamı, çocuğun yaşı ve transkripsiyon koşulları ayrıntılı betimlenmelidir (thick description)."
      },
      reliability: {
        title: "Araştırmacılar Arası Tutarlılık (Teyit Edilebilirlik)",
        desc: "Miles & Huberman uyarınca iki bağımsız kodlayıcı arasındaki uzlaşma formülü: Uzlaşma Yüzdesi = [Görüş Birliği / (Görüş Birliği + Görüş Ayrılığı)] × 100. %80 ve üzeri uzlaşma nitel araştırmalarda güvenilirlik ölçütü kabul edilir."
      }
    };
  }
}
