/**
 * Dil Analizi - Kural Tabanlı Türkçe Morfem Ayrıştırıcı (morphology.js)
 * Kök + ek tespiti, ünlü uyumu, ünsüz benzeşmesi/yumuşaması.
 * Kök sözlüğü: /data/roots.js
 */

import { TURKISH_ROOTS } from "../data/roots.js";

export class TurkishMorphology {
  /**
   * Türkçe küçük harfe çevirme (I -> ı, İ -> i duyarlı)
   */
  static toTurkishLower(str) {
    if (!str) return "";
    return str
      .replace(/İ/g, "i")
      .replace(/I/g, "ı")
      .toLowerCase();
  }

  /**
   * Ünlü mü?
   */
  static isVowel(ch) {
    return /[aeıioöuü]/i.test(ch);
  }

  /**
   * Sert ünsüz mü? (f, s, t, k, ç, ş, h, p)
   */
  static isHardConsonant(ch) {
    return /[fstkçşhp]/i.test(ch);
  }

  /**
   * Tek bir sözcüğü morfemlerine ayrıştırır
   * @param {string} rawWord 
   * @returns {object} { word, root, rootPos, suffixes, morphemeCount, isEstimated }
   */
  static parseWord(rawWord) {
    const word = this.toTurkishLower(rawWord).trim();
    if (!word) {
      return {
        word: rawWord,
        root: "",
        rootPos: "unknown",
        suffixes: [],
        morphemeCount: 0,
        isEstimated: false
      };
    }

    // 1. Kök sözlüğünde doğrudan tam eşleşme (yalın hal)
    if (TURKISH_ROOTS[word]) {
      const entry = TURKISH_ROOTS[word];
      return {
        word: rawWord,
        root: word,
        rootPos: entry.pos,
        suffixes: [],
        morphemeCount: 1,
        isEstimated: false
      };
    }

    // 2. Kök sözlüğünden ön ek eşleşmesi ara (yumuşama ve ses düşmesi dahil)
    const candidates = [];

    for (const [rKey, rVal] of Object.entries(TURKISH_ROOTS)) {
      // Düz kök ön ek mi? (örn: orman -> orman-lar)
      if (word.startsWith(rKey) && word.length > rKey.length) {
        const remainder = word.slice(rKey.length);
        const parsedSuff = this.parseSuffixSequence(remainder, rVal.pos);
        if (parsedSuff.isValid) {
          candidates.push({
            root: rKey,
            rootPos: rVal.pos,
            suffixes: parsedSuff.suffixes,
            remainderLength: parsedSuff.unmatched.length,
            isEstimated: false
          });
        }
      }

      // Yumuşamış kök kontrolü (çocuk -> çocuğ-a, köpek -> köpeğ-i, kitap -> kitab-ı)
      if (rVal.alt && word.startsWith(rVal.alt) && word.length > rVal.alt.length) {
        const remainder = word.slice(rVal.alt.length);
        const parsedSuff = this.parseSuffixSequence(remainder, rVal.pos);
        if (parsedSuff.isValid) {
          candidates.push({
            root: rKey,
            rootPos: rVal.pos,
            suffixes: parsedSuff.suffixes,
            remainderLength: parsedSuff.unmatched.length,
            isEstimated: false
          });
        }
      }
    }

    // Adaylar arasından kalanı en kısa olanı (en çok ek eşleşen) seç
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.remainderLength - b.remainderLength || b.suffixes.length - a.suffixes.length);
      const best = candidates[0];
      if (best.remainderLength === 0) {
        return {
          word: rawWord,
          root: best.root,
          rootPos: best.rootPos,
          suffixes: best.suffixes,
          morphemeCount: 1 + best.suffixes.length,
          isEstimated: false
        };
      }
    }

    // 3. Sözlükte yoksa: Kural tabanlı sağdan sola ek budama (heuristik)
    const estimated = this.heuristicSuffixPeeling(word);
    return {
      word: rawWord,
      root: estimated.root,
      rootPos: estimated.rootPos,
      suffixes: estimated.suffixes,
      morphemeCount: Math.max(1, 1 + estimated.suffixes.length),
      isEstimated: true
    };
  }

  /**
   * Kökten sonraki ek dizisini tanı
   */
  static parseSuffixSequence(suffixStr, posHint = "noun") {
    let rem = suffixStr;
    const suffixes = [];

    // Ek desenleri (sıralı ve kategoriye göre)
    const suffixPatterns = [
      // Çoğul
      { regex: /^(lar|ler)/, cat: "plural", name: "Çoğul (-lAr)" },

      // İyelik ekleri
      { regex: /^(mız|miz|muz|müz|nız|niz|nuz|nüz)/, cat: "possessive", name: "İyelik (-mIz/-nIz)" },
      { regex: /^(ları|leri)/, cat: "possessive", name: "3. Çoğul İyelik (-lArI)" },
      { regex: /^([sşn]?)([ıiuü])m\b/, cat: "possessive", name: "1. Tekil İyelik (-m)" },
      { regex: /^([sşn]?)([ıiuü])n\b/, cat: "possessive", name: "2. Tekil İyelik (-n)" },
      { regex: /^(sı|si|su|sü)\b/, cat: "possessive", name: "3. Tekil İyelik (-sI)" },

      // Hal / Durum ekleri
      { regex: /^(dan|den|tan|ten)/, cat: "case", name: "Ayrılma Hali (-DEn)" },
      { regex: /^(da|de|ta|te)/, cat: "case", name: "Bulunma Hali (-DE)" },
      { regex: /^([y]?)(la|le)/, cat: "case", name: "Vasıta Hali (-lA)" },
      { regex: /^([n]?)(ın|in|un|ün)/, cat: "case", name: "İlgi Hali (-In)" },
      { regex: /^([y]?)(a|e)/, cat: "case", name: "Yönelme Hali (-E)" },
      { regex: /^([y]?)([ıiuü])\b/, cat: "case", name: "Belirtme Hali (-I)" },

      // Zaman / Kip ekleri (Fiil)
      { regex: /^([ıiuü]?)yor/, cat: "tense", name: "Şimdiki Zaman (-Iyor)" },
      { regex: /^(dı|di|du|dü|tı|ti|tu|tü)/, cat: "tense", name: "Görülen Geçmiş (-DI)" },
      { regex: /^(mış|miş|muş|müş)/, cat: "tense", name: "Duyulan Geçmiş (-mIş)" },
      { regex: /^([y]?)(acak|ecek)/, cat: "tense", name: "Gelecek Zaman (-EcEk)" },
      { regex: /^(ar|er|[ıiuü]?r)\b/, cat: "tense", name: "Geniş Zaman (-Ir/-Er)" },
      { regex: /^(malı|meli)/, cat: "tense", name: "Gereklilik (-mElI)" },
      { regex: /^(sa|se)\b/, cat: "tense", name: "Dilek-Koşul (-sA)" },

      // Olumsuzluk eki (Fiil)
      { regex: /^(ma|me|mı|mi|mu|mü)\b/, cat: "negation", name: "Olumsuzluk (-mA)" },

      // Ek-fiil
      { regex: /^([y]?)(dı|di|du|dü|mış|miş|muş|müş|sa|se)/, cat: "copula", name: "Ek-Fiil (-(y)DI/-(y)mIş)" },
      { regex: /^(dır|dir|dur|dür|tır|tir|tur|tür)/, cat: "copula", name: "Bildirme Eki (-dIr)" },

      // Ulaç / Ortaç (Zarf-fiil / Sıfat-fiil)
      { regex: /^ken\b/, cat: "converb", name: "Ulaç (-ken)" },
      { regex: /^([y]?)(ıp|ip|up|üp)/, cat: "converb", name: "Ulaç (-(y)Ip)" },
      { regex: /^([y]?)(arak|erek)/, cat: "converb", name: "Ulaç (-(y)ErEk)" },
      { regex: /^([y]?)(ınca|ince|unca|ünce)/, cat: "converb", name: "Ulaç (-(y)IncA)" },
      { regex: /^(madan|meden)/, cat: "converb", name: "Ulaç (-mEdEn)" },
      { regex: /^(dık|dik|duk|dük|tık|tik|tuk|tük)/, cat: "converb", name: "Ortaç (-dIk)" },
      { regex: /^([y]?)(an|en)/, cat: "converb", name: "Ortaç (-(y)An)" },

      // Çatı (Ettirgen / Edilgen / İşteş)
      { regex: /^(t|dır|dir|dur|dür|tır|tir)\b/, cat: "voice", name: "Ettirgen Çatı (-t/-dIr)" },
      { regex: /^([ıiuü]?)(l|n)\b/, cat: "voice", name: "Edilgen/Dönüşlü Çatı (-Il/-In)" },
      { regex: /^([ıiuü]?)ş\b/, cat: "voice", name: "İşteş Çatı (-Iş)" },

      // Kişi ekleri
      { regex: /^([y]?)(ız|iz|uz|üz|k)\b/, cat: "person", name: "1. Çoğul Kişi (-k/-(y)Iz)" },
      { regex: /^(sınız|siniz|sunuz|sünüz)/, cat: "person", name: "2. Çoğul Kişi (-sInIz)" },
      { regex: /^(sın|sin|sun|sün)/, cat: "person", name: "2. Tekil Kişi (-sIn)" },
      { regex: /^([y]?)(ım|im|um|üm|m)\b/, cat: "person", name: "1. Tekil Kişi (-m/-(y)Im)" },

      // Yapım ekleri
      { regex: /^(lı|li|lu|lü)/, cat: "derivation", name: "Yapım Eki (-lI)" },
      { regex: /^(sız|siz|suz|süz)/, cat: "derivation", name: "Yapım Eki (-sIz)" },
      { regex: /^(lık|lik|luk|lük)/, cat: "derivation", name: "Yapım Eki (-lIk)" },
      { regex: /^(cı|ci|cu|cü|çı|çi|çu|çü)/, cat: "derivation", name: "Yapım Eki (-cI)" },
      { regex: /^(cık|cik|cuk|cük)/, cat: "derivation", name: "Küçültme Eki (-cIk)" }
    ];

    let safety = 0;
    while (rem.length > 0 && safety < 8) {
      safety++;
      let matched = false;

      for (const pat of suffixPatterns) {
        const m = rem.match(pat.regex);
        if (m) {
          const affixStr = m[0];
          suffixes.push({
            affix: "-" + affixStr,
            category: pat.cat,
            name: pat.name
          });
          rem = rem.slice(affixStr.length);
          matched = true;
          break;
        }
      }

      if (!matched) break;
    }

    return {
      isValid: suffixes.length > 0,
      suffixes,
      unmatched: rem
    };
  }

  /**
   * Sözlükte bulunmayan sözcükler için sezgisel sağdan sola ek ayıklama
   */
  static heuristicSuffixPeeling(word) {
    if (word.length <= 3) {
      return { root: word, rootPos: "noun", suffixes: [] };
    }

    let current = word;
    const suffixes = [];

    const peelRules = [
      // Çoğul
      { regex: /(lar|ler)$/, cat: "plural", name: "Çoğul (-lAr)" },
      // Ayrılma
      { regex: /(dan|den|tan|ten)$/, cat: "case", name: "Ayrılma Hali (-DEn)" },
      // Bulunma
      { regex: /(da|de|ta|te)$/, cat: "case", name: "Bulunma Hali (-DE)" },
      // Vasıta
      { regex: /(yla|yle|la|le)$/, cat: "case", name: "Vasıta Hali (-lA)" },
      // İlgi
      { regex: /(nın|nin|nun|nün|ın|in|un|ün)$/, cat: "case", name: "İlgi Hali (-In)" },
      // Yönelme
      { regex: /(ya|ye|a|e)$/, cat: "case", name: "Yönelme Hali (-E)" },
      // Belirtme
      { regex: /(yı|yi|yu|yü|ı|i|u|ü)$/, cat: "case", name: "Belirtme Hali (-I)" },
      // Zaman
      { regex: /(dı|di|du|dü|tı|ti|tu|tü)$/, cat: "tense", name: "Geçmiş Zaman (-DI)" },
      { regex: /(mış|miş|muş|müş)$/, cat: "tense", name: "Duyulan Geçmiş (-mIş)" },
      { regex: /(ıyor|iyor|uyor|üyor)$/, cat: "tense", name: "Şimdiki Zaman (-Iyor)" },
      { regex: /(acak|ecek)$/, cat: "tense", name: "Gelecek Zaman (-EcEk)" },
      // Ulaç
      { regex: /(arak|erek|ken|ınca|ince)$/, cat: "converb", name: "Ulaç / Zarf-Fiil" }
    ];

    let safety = 0;
    while (current.length > 3 && safety < 4) {
      safety++;
      let peeled = false;
      for (const rule of peelRules) {
        const match = current.match(rule.regex);
        if (match && current.length - match[0].length >= 2) {
          const affix = match[0];
          suffixes.unshift({
            affix: "-" + affix,
            category: rule.cat,
            name: rule.name
          });
          current = current.slice(0, current.length - affix.length);
          peeled = true;
          break;
        }
      }
      if (!peeled) break;
    }

    return {
      root: current,
      rootPos: "noun",
      suffixes
    };
  }

  /**
   * Bir ifade dizisini analiz eder ve morfolojik özet çıkarır
   */
  static analyzeUtterances(childUtterances) {
    const allWordsParsed = [];
    const affixCounts = {};
    const categoryCounts = {
      plural: 0,
      case: 0,
      possessive: 0,
      tense: 0,
      negation: 0,
      copula: 0,
      person: 0,
      voice: 0,
      converb: 0,
      derivation: 0
    };

    let totalMorphemes = 0;

    const breakdownExamples = [];

    for (let uIdx = 0; uIdx < childUtterances.length; uIdx++) {
      const utt = childUtterances[uIdx];
      const parsedUttWords = [];
      let uttMorphemeCount = 0;

      for (const w of utt.words) {
        const parsedWord = this.parseWord(w);
        parsedUttWords.push(parsedWord);
        allWordsParsed.push(parsedWord);
        uttMorphemeCount += parsedWord.morphemeCount;

        // Ek istatistikleri
        for (const s of parsedWord.suffixes) {
          const k = s.name || s.affix;
          affixCounts[k] = (affixCounts[k] || 0) + 1;
          if (categoryCounts[s.category] !== undefined) {
            categoryCounts[s.category]++;
          }
        }
      }

      totalMorphemes += uttMorphemeCount;

      // İlk 8 ifadenin detaylı morfem dökümünü kaydet
      if (uIdx < 8) {
        breakdownExamples.push({
          id: utt.id,
          rawText: utt.rawText,
          wordsParsed: parsedUttWords,
          totalMorphemes: uttMorphemeCount
        });
      }
    }

    return {
      allWordsParsed,
      totalMorphemes,
      affixCounts,
      categoryCounts,
      breakdownExamples
    };
  }
}
