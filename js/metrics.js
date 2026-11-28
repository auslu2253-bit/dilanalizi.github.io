/**
 * Dil Analizi - Ölçütler Modülü (metrics.js)
 * Heilmann, Nockerts & Miller (2010), Westerveld & Claessen (2014)
 * NTU, NTW, NDW, TTR, MLU, MLUm, WPM, % Labirent, Hata/Eksiklik, LARSP, Brown Aşaması
 */

export class LanguageMetrics {
  /**
   * Tüm nicel dil ölçütlerini hesaplar
   */
  static computeAll(parsedData, morphologyData, clientProfile = {}) {
    const { childUtterances, therapistUtterances, allTurns, estimatedDurationMinutes, hasExplicitCoding, unintelligibleCount } = parsedData;
    const { allWordsParsed, totalMorphemes, affixCounts, categoryCounts, breakdownExamples } = morphologyData;

    // 1. Temel Ölçütler
    const ntu = childUtterances.length; // Number of Total Utterances

    // Tüm çocuk sözcükleri (küçük harfli)
    const allChildWords = [];
    childUtterances.forEach(u => {
      u.words.forEach(w => allChildWords.push(w.toLowerCase()));
    });

    const ntw = allChildWords.length; // Number of Total Words (tokens)

    // Farklı sözcükler (types)
    const uniqueWordMap = new Map();
    allChildWords.forEach(w => {
      uniqueWordMap.set(w, (uniqueWordMap.get(w) || 0) + 1);
    });
    const ndw = uniqueWordMap.size; // Number of Different Words

    // TTR (Type-Token Ratio)
    const ttr = ntw > 0 ? Math.round((ndw / ntw) * 1000) / 1000 : 0;

    // MLU (Sözcük cinsinden ortalama ifade uzunluğu)
    const mluWords = ntu > 0 ? Math.round((ntw / ntu) * 100) / 100 : 0;

    // MLUm (Morfem cinsinden ortalama ifade uzunluğu)
    const mlum = ntu > 0 ? Math.round((totalMorphemes / ntu) * 100) / 100 : 0;

    // Süre tespiti (kullanıcı girdisi veya transkript damgası)
    const durationMinutes = clientProfile.duration
      ? parseFloat(clientProfile.duration)
      : (estimatedDurationMinutes || null);

    // WPM (Words Per Minute)
    const wpm = (durationMinutes && durationMinutes > 0 && ntw > 0)
      ? Math.round((ntw / durationMinutes) * 10) / 10
      : null;

    // 2. Labirent Analizi (% Maze)
    let explicitMazeWordCount = 0;
    childUtterances.forEach(u => {
      explicitMazeWordCount += u.mazeWordCount;
    });

    // Otomatik heuristik labirent tespiti (dolgu sözcükleri, tekrarlar)
    const heuristicFillers = ["ııı", "eee", "şey", "yani", "hani", "ımm", "ııım"];
    let detectedFillersCount = 0;
    let detectedRepetitionsCount = 0;

    childUtterances.forEach(u => {
      // Dolgu kelimeleri
      u.words.forEach(w => {
        if (heuristicFillers.includes(w.toLowerCase())) {
          detectedFillersCount++;
        }
      });
      // Art arda gelen aynı kelimeler (örn: "ben ben", "gitti gitti")
      for (let i = 0; i < u.words.length - 1; i++) {
        if (u.words[i].toLowerCase() === u.words[i + 1].toLowerCase()) {
          detectedRepetitionsCount++;
        }
      }
    });

    const isMazeExplicitlyCoded = hasExplicitCoding.mazes;
    const totalMazeWords = isMazeExplicitlyCoded
      ? explicitMazeWordCount
      : (detectedFillersCount + detectedRepetitionsCount);

    const totalWordsWithMaze = ntw + totalMazeWords;
    const mazePercentage = totalWordsWithMaze > 0
      ? Math.round((totalMazeWords / totalWordsWithMaze) * 1000) / 10
      : 0;

    // 3. Hatalar ve Eksiklikler
    let totalErrors = 0;
    let totalWordOmissions = 0;
    let totalMorphemeOmissions = 0;

    childUtterances.forEach(u => {
      totalErrors += u.errors.length;
      totalWordOmissions += u.wordOmissions.length;
      totalMorphemeOmissions += u.morphemeOmissions.length;
    });

    const compositeErrorsOmissions = totalErrors + totalWordOmissions + totalMorphemeOmissions;
    const isErrorOmissionCoded = hasExplicitCoding.errors || hasExplicitCoding.omissions;
    const errorsPerMinute = (durationMinutes && durationMinutes > 0 && isErrorOmissionCoded)
      ? Math.round((compositeErrorsOmissions / durationMinutes) * 100) / 100
      : null;

    // 4. En Uzun İfade (Longest Utterance)
    let longestUtterance = null;
    let maxWords = -1;

    childUtterances.forEach(u => {
      if (u.words.length > maxWords) {
        maxWords = u.words.length;
        longestUtterance = {
          id: u.id,
          lineNum: u.lineNum,
          rawText: u.rawText,
          cleanedText: u.cleanedText,
          wordCount: u.words.length
        };
      }
    });

    // 5. Brown'un Yapısal Aşamaları (MLUm Temelli Tahmin)
    const brownStage = this.estimateBrownStage(mlum);

    // 6. LARSP Tarzı İfade Uzunluk ve Karmaşıklık Dağılımı
    const larspDistribution = this.computeLarspDistribution(childUtterances);

    // 7. En Sık 15 Sözcük
    const sortedWords = Array.from(uniqueWordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([word, count]) => {
        const parsed = morphologyData.allWordsParsed.find(p => p.word.toLowerCase() === word) || {};
        return {
          word,
          count,
          percentage: ntw > 0 ? Math.round((count / ntw) * 1000) / 10 : 0,
          pos: parsed.rootPos || "noun"
        };
      });

    // 8. Sözcük Türü (POS) Dağılımı
    const posCounts = {
      noun: 0,
      verb: 0,
      adj: 0,
      adv: 0,
      pron: 0,
      conj: 0,
      prep: 0,
      interj: 0,
      maze: 0,
      num: 0,
      unknown: 0
    };

    allWordsParsed.forEach(p => {
      const pos = p.rootPos || "unknown";
      if (posCounts[pos] !== undefined) {
        posCounts[pos]++;
      } else {
        posCounts.unknown++;
      }
    });

    // 9. Nadir Sözdizimsel-Anlamsal İşaretleyiciler (Makale 1 Dakika Başına Referanslar)
    const questionWords = ["ne", "kim", "nerede", "nasıl", "neden", "niçin", "niye", "hangisi", "kaç", "ne zaman"];
    let questionWordsCount = 0;
    allChildWords.forEach(w => {
      if (questionWords.includes(w)) questionWordsCount++;
    });

    const demonstrativeWords = ["bu", "şu", "o", "bunlar", "şunlar", "onlar", "burası", "şurası", "orası", "bura", "şura", "ora"];
    let demonstrativesCount = 0;
    allChildWords.forEach(w => {
      if (demonstrativeWords.includes(w)) demonstrativesCount++;
    });

    const negationsCount = categoryCounts.negation + (allChildWords.filter(w => w === "değil" || w === "yok" || w === "hayır").length);

    const questionRatePerMin = (durationMinutes && durationMinutes > 0) ? Math.round((questionWordsCount / durationMinutes) * 100) / 100 : null;
    const demonstrativeRatePerMin = (durationMinutes && durationMinutes > 0) ? Math.round((demonstrativesCount / durationMinutes) * 100) / 100 : null;
    const negationRatePerMin = (durationMinutes && durationMinutes > 0) ? Math.round((negationsCount / durationMinutes) * 100) / 100 : null;

    // 10. Söylem ve Konuşma Sırası (Terapist - Çocuk)
    const discourseDynamics = this.computeDiscourseDynamics(allTurns, childUtterances, therapistUtterances);

    // 11. Anlatı Hikâye Dilbilgisi Kontrol Listesi
    const storyGrammar = this.analyzeStoryGrammar(childUtterances);

    // 12. İki Dilli Kod Değiştirme (L2) İncelemesi
    let l2Count = 0;
    childUtterances.forEach(u => {
      l2Count += u.l2Words.length;
    });
    const l2Rate = ntw > 0 ? Math.round((l2Count / ntw) * 1000) / 10 : 0;

    return {
      // Özet Metrikler
      ntu,
      ntw,
      ndw,
      ttr,
      mluWords,
      mlum,
      durationMinutes,
      wpm,
      unintelligibleCount,
      // Labirent
      maze: {
        isExplicitlyCoded: isMazeExplicitlyCoded,
        explicitWordsCount: explicitMazeWordCount,
        detectedFillersCount,
        detectedRepetitionsCount,
        totalMazeWords,
        percentage: mazePercentage
      },
      // Hatalar
      errors: {
        isCoded: isErrorOmissionCoded,
        totalErrors,
        totalWordOmissions,
        totalMorphemeOmissions,
        composite: compositeErrorsOmissions,
        perMinute: errorsPerMinute
      },
      longestUtterance,
      brownStage,
      larspDistribution,
      sortedWords,
      posCounts,
      // Nadir işaretçiler (Heilmann 2010 karşılaştırmalı)
      rareMarkers: {
        questionWordsCount,
        questionRatePerMin,
        demonstrativesCount,
        demonstrativeRatePerMin,
        negationsCount,
        negationRatePerMin,
        benchmarks: {
          questionRate: 0.29,
          negationRate: 1.79,
          demonstrativeRate: 1.58
        }
      },
      discourseDynamics,
      storyGrammar,
      bilingual: {
        isBilingual: clientProfile.lingualProfile === "bilingual" || hasExplicitCoding.l2,
        l2Count,
        l2Rate
      }
    };
  }

  /**
   * Brown'un Yapısal Aşamaları (MLUm temelli)
   */
  static estimateBrownStage(mlum) {
    let stage = "";
    let ageRange = "";
    let description = "";

    if (mlum < 1.0) {
      stage = "Aşama Öncesi (<I)";
      ageRange = "< 18 ay";
      description = "Tek sözcüklü veya erken dönem ifadeler.";
    } else if (mlum >= 1.0 && mlum < 2.0) {
      stage = "Aşama I";
      ageRange = "12 - 26 ay";
      description = "Doğrusal anlamsal ilişkiler, tek sözcük ve iki sözcüklü ilkel kombinasyonlar.";
    } else if (mlum >= 2.0 && mlum < 2.5) {
      stage = "Aşama II";
      ageRange = "27 - 30 ay";
      description = "Gramer morfemlerinin ortaya çıkışı (çoğul, iyelik, durum ekleri).";
    } else if (mlum >= 2.5 && mlum < 3.0) {
      stage = "Aşama III";
      ageRange = "31 - 34 ay";
      description = "Tümce kipleri, soru ve olumsuzlama yapılarının gelişimi.";
    } else if (mlum >= 3.0 && mlum < 3.75) {
      stage = "Aşama IV";
      ageRange = "35 - 40 ay";
      description = "Karmaşık tümce yapıları, yan tümce bağlanması.";
    } else if (mlum >= 3.75 && mlum <= 4.5) {
      stage = "Aşama V";
      ageRange = "41 - 46 ay";
      description = "Bileşik ve sıralı tümceler, bağlaçlı yapılar.";
    } else {
      stage = "Aşama V+";
      ageRange = "47+ ay";
      description = "Gelişmiş sözdizimsel yapılar ve söylem üretimi.";
    }

    return {
      stage,
      ageRange,
      description,
      disclaimer: "Westerveld & Claessen (2014) anketi uyarınca klinisyenlerin %56'sı Brown aşamalarını kullanmaktadır; ancak bu aşamalar İngilizceye dayanır. Türkçe sondan eklemeli bir dil olduğundan MLUm doğal olarak İngilizceden yüksektir. Değerler sadece yapısal karşılaştırma içindir, tanı ölçütü değildir."
    };
  }

  /**
   * LARSP Tarzı İfade Dağılımı
   */
  static computeLarspDistribution(childUtterances) {
    let singleWord = 0;
    let twoElements = 0;
    let threeElements = 0;
    let fourPlusElements = 0;
    let complexClause = 0;

    const clauseConjunctions = ["çünkü", "için", "ama", "fakat", "ancak", "veya", "eğer", "diye", "ki"];

    childUtterances.forEach(u => {
      const len = u.words.length;
      const rawLower = u.rawText.toLowerCase();

      // Yan tümce / karmaşık yapı kontrolü (ulaç ekleri veya bağlaçlar)
      const hasConjunction = clauseConjunctions.some(c => rawLower.includes(c));
      const hasConverb = /(-[y]?(arak|erek|ken|ınca|ince|ıp|ip|up|üp|dık|dik|duk|dük|tık|tik)|(ken\b|diye\b))/i.test(rawLower);

      if ((hasConjunction || hasConverb) && len >= 3) {
        complexClause++;
      } else if (len === 1) {
        singleWord++;
      } else if (len === 2) {
        twoElements++;
      } else if (len === 3) {
        threeElements++;
      } else {
        fourPlusElements++;
      }
    });

    const total = childUtterances.length || 1;
    return {
      singleWord: { count: singleWord, percentage: Math.round((singleWord / total) * 100) },
      twoElements: { count: twoElements, percentage: Math.round((twoElements / total) * 100) },
      threeElements: { count: threeElements, percentage: Math.round((threeElements / total) * 100) },
      fourPlusElements: { count: fourPlusElements, percentage: Math.round((fourPlusElements / total) * 100) },
      complexClause: { count: complexClause, percentage: Math.round((complexClause / total) * 100) }
    };
  }

  /**
   * Söylem ve Konuşma Sırası Dinamikleri
   */
  static computeDiscourseDynamics(allTurns, childUtterances, therapistUtterances) {
    const totalTurns = allTurns.length;
    const childTurnsCount = childUtterances.length;
    const therapistTurnsCount = therapistUtterances.length;

    let childTotalWords = 0;
    childUtterances.forEach(u => childTotalWords += u.words.length);

    let therapistTotalWords = 0;
    therapistUtterances.forEach(t => therapistTotalWords += t.words.length);

    // Terapist / Çocuk sözcük oranı
    const therapistChildWordRatio = childTotalWords > 0
      ? Math.round((therapistTotalWords / childTotalWords) * 100) / 100
      : null;

    // Çocuğun soru sorma / başlattığı ifade sayısı
    let childInitiatedCount = 0;
    childUtterances.forEach(u => {
      if (u.rawText.includes("?") || /^(neden|niye|nerede|ne|kim|nasıl)\b/i.test(u.cleanedText)) {
        childInitiatedCount++;
      }
    });

    const childInitiatedRatio = childTurnsCount > 0
      ? Math.round((childInitiatedCount / childTurnsCount) * 1000) / 10
      : 0;

    const childMeanTurnLength = childTurnsCount > 0
      ? Math.round((childTotalWords / childTurnsCount) * 10) / 10
      : 0;

    const therapistMeanTurnLength = therapistTurnsCount > 0
      ? Math.round((therapistTotalWords / therapistTurnsCount) * 10) / 10
      : 0;

    return {
      totalTurns,
      childTurnsCount,
      therapistTurnsCount,
      childTotalWords,
      therapistTotalWords,
      therapistChildWordRatio,
      childInitiatedCount,
      childInitiatedRatio,
      childMeanTurnLength,
      therapistMeanTurnLength
    };
  }

  /**
   * Anlatı Hikâye Dilbilgisi Analizi
   */
  static analyzeStoryGrammar(childUtterances) {
    const fullText = childUtterances.map(u => u.cleanedText.toLowerCase()).join(" ");

    const elements = [
      {
        id: "character",
        name: "Karakter / Kahraman",
        keywords: ["çocuk", "köpek", "kurbağa", "ayı", "geyik", "arı", "köstebek", "baykuş", "kardeş", "anne", "baba"],
        found: false,
        evidence: []
      },
      {
        id: "setting",
        name: "Mekân ve Zaman",
        keywords: ["ev", "orman", "oda", "göl", "su", "ağaç", "sabah", "gece", "bir gün", "park", "yatak", "dışarı"],
        found: false,
        evidence: []
      },
      {
        id: "initiating_event",
        name: "Başlangıç Olayı / Sorun",
        keywords: ["kaçmış", "çıkmış", "yokmuş", "kayboldu", "düştü", "kırıldı", "ısırdı", "kovaladı", "kaçtı"],
        found: false,
        evidence: []
      },
      {
        id: "internal_reaction",
        name: "İçsel Tepki / Duygu",
        keywords: ["üzüldü", "korktu", "korkup", "kızdı", "sevindi", "şaşırdı", "ağladı", "istedi", "yoruldum"],
        found: false,
        evidence: []
      },
      {
        id: "attempt",
        name: "Girişim / Arama / Eylem",
        keywords: ["aramaya", "aradı", "koştu", "seslendi", "bağırdı", "tırmandı", "baktı", "tuttu", "kokladı"],
        found: false,
        evidence: []
      },
      {
        id: "outcome",
        name: "Sonuç / Çözüm",
        keywords: ["buldu", "bulduğu", "hediye", "aldı", "döndü", "dönmüşler", "kurtuldu", "sarılmış", "bitti"],
        found: false,
        evidence: []
      }
    ];

    elements.forEach(el => {
      const matches = [];
      childUtterances.forEach(u => {
        const text = u.cleanedText.toLowerCase();
        for (const kw of el.keywords) {
          if (text.includes(kw)) {
            matches.push({ uttId: u.id, text: u.rawText, keyword: kw });
            break;
          }
        }
      });

      if (matches.length > 0) {
        el.found = true;
        el.evidence = matches.slice(0, 3); // İlk 3 kanıt cümlesi
      }
    });

    const identifiedCount = elements.filter(e => e.found).length;

    return {
      elements,
      identifiedCount,
      totalCount: elements.length,
      note: "Hikâye bileşenleri anahtar sözcük eşleştirmesiyle tespit edilmiştir. Otomatik bir ön kestirimdir; klinisyen tarafından teyit edilmelidir (Heilmann ve ark., 2010)."
    };
  }
}
