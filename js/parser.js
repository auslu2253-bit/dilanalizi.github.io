/**
 * Dil Analizi - Transkript Ayrıştırıcı (parser.js)
 * Ç: (çocuk) ve T: (terapist) satırlarını ayrıştırır.
 * Zaman damgalarını [00:03], kodlamaları ((labirent), [Hata], [E:sözcük], [EM], XXX, [L2]) işler.
 */

export class TranscriptParser {
  /**
   * Transkript metnini satır satır ayrıştırır
   * @param {string} rawText 
   * @returns {object} Ayrıştırma sonucu
   */
  static parse(rawText) {
    if (!rawText || typeof rawText !== "string" || !rawText.trim()) {
      return {
        isValid: false,
        error: "Lütfen analiz edilecek bir transkript metni giriniz.",
        childUtterances: [],
        therapistUtterances: [],
        allTurns: [],
        estimatedDurationMinutes: null,
        hasExplicitCoding: { mazes: false, errors: false, omissions: false, l2: false },
        unintelligibleCount: 0
      };
    }

    const lines = rawText.split(/\r?\n/);
    const childUtterances = [];
    const therapistUtterances = [];
    const allTurns = [];
    const timestamps = [];
    let unintelligibleCount = 0;

    let hasMazeCode = false;
    let hasErrorCode = false;
    let hasOmissionCode = false;
    let hasL2Code = false;

    let childIndex = 0;
    let therapistIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Zaman damgası kontrolü: [00:15] veya (01:23)
      let timestampSec = null;
      const tsMatch = line.match(/^\[?\(?(\d{1,2}):(\d{2})\]?\)?/);
      let content = line;
      if (tsMatch) {
        const mins = parseInt(tsMatch[1], 10);
        const secs = parseInt(tsMatch[2], 10);
        timestampSec = mins * 60 + secs;
        timestamps.push(timestampSec);
        content = line.substring(tsMatch[0].length).trim();
      }

      // Konuşmacı tespiti (Ç: çocuk, T: terapist / klinisyen)
      const speakerMatch = content.match(/^([ÇçCcTt])\s*[:：]\s*(.*)$/);
      if (!speakerMatch) {
        // Ön ek yoksa ve çocuk satırına benziyorsa veya genel metinse
        continue;
      }

      const speakerLetter = speakerMatch[1].toUpperCase();
      const utteranceRaw = speakerMatch[2].trim();
      if (!utteranceRaw) continue;

      const isChild = (speakerLetter === "Ç" || speakerLetter === "C");

      // Kodlama etiketlerini incele
      if (utteranceRaw.includes("[Hata]") || utteranceRaw.includes("[hata]")) hasErrorCode = true;
      if (utteranceRaw.includes("[E:") || utteranceRaw.includes("[EM]")) hasOmissionCode = true;
      if (utteranceRaw.includes("[L2]") || utteranceRaw.includes("[l2]")) hasL2Code = true;
      if (/\([^\)]+\)|<[^>]+>/.test(utteranceRaw)) hasMazeCode = true;

      if (isChild) {
        childIndex++;
        const parsedUtt = this.parseChildUtterance(utteranceRaw, childIndex, timestampSec, i + 1);
        childUtterances.push(parsedUtt);
        unintelligibleCount += parsedUtt.unintelligibleTokens.length;

        allTurns.push({
          turnNumber: allTurns.length + 1,
          speaker: "child",
          speakerLabel: "Çocuk",
          rawText: utteranceRaw,
          cleanedText: parsedUtt.cleanedText,
          wordCount: parsedUtt.words.length,
          timestampSec: timestampSec,
          lineNum: i + 1
        });
      } else {
        therapistIndex++;
        const tCleaned = utteranceRaw
          .replace(/\[[^\]]+\]/g, "")
          .replace(/\([^\)]+\)/g, "")
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const tWords = tCleaned ? tCleaned.split(/\s+/).filter(w => w.length > 0) : [];

        therapistUtterances.push({
          id: therapistIndex,
          lineNum: i + 1,
          rawText: utteranceRaw,
          cleanedText: tCleaned,
          words: tWords,
          timestampSec: timestampSec
        });

        allTurns.push({
          turnNumber: allTurns.length + 1,
          speaker: "therapist",
          speakerLabel: "Terapist",
          rawText: utteranceRaw,
          cleanedText: tCleaned,
          wordCount: tWords.length,
          timestampSec: timestampSec,
          lineNum: i + 1
        });
      }
    }

    // Süre tahmini: zaman damgası varsa
    let estimatedDurationMinutes = null;
    if (timestamps.length >= 2) {
      const minTs = Math.min(...timestamps);
      const maxTs = Math.max(...timestamps);
      const diffSecs = maxTs - minTs;
      if (diffSecs > 10) {
        // En az 10 saniye fark varsa dakika cinsinden hesapla
        estimatedDurationMinutes = Math.round((diffSecs / 60) * 10) / 10;
      }
    }

    if (childUtterances.length === 0) {
      return {
        isValid: false,
        error: "Metinde 'Ç:' ile başlayan çocuk ifadesi bulunamadı. Lütfen çocuk satırlarının 'Ç:' ile başladığından emin olunuz.",
        childUtterances: [],
        therapistUtterances: [],
        allTurns: [],
        estimatedDurationMinutes: null,
        hasExplicitCoding: { mazes: false, errors: false, omissions: false, l2: false },
        unintelligibleCount: 0
      };
    }

    return {
      isValid: true,
      childUtterances,
      therapistUtterances,
      allTurns,
      estimatedDurationMinutes,
      hasExplicitCoding: {
        mazes: hasMazeCode,
        errors: hasErrorCode,
        omissions: hasOmissionCode,
        l2: hasL2Code
      },
      unintelligibleCount
    };
  }

  /**
   * Tek bir çocuk ifadesini ayrıntılı ayrıştırır
   */
  static parseChildUtterance(rawText, id, timestampSec, lineNum) {
    let workingText = rawText;

    // 1. Labirentleri yakala: (ııı), <atıyor>
    const mazes = [];
    const mazeRegex = /\(([^)]+)\)|<([^>]+)>/g;
    let mMatch;
    while ((mMatch = mazeRegex.exec(rawText)) !== null) {
      const mazeContent = (mMatch[1] || mMatch[2]).trim();
      if (mazeContent) {
        const mazeWords = mazeContent.split(/\s+/).filter(w => w.length > 0);
        mazes.push({
          raw: mMatch[0],
          content: mazeContent,
          words: mazeWords,
          count: mazeWords.length
        });
      }
    }

    // 2. Hataları yakala: [Hata]
    const errors = [];
    const errorRegex = /\[(Hata|hata|error)\]/gi;
    let errMatch;
    while ((errMatch = errorRegex.exec(rawText)) !== null) {
      errors.push({ type: "general_error", raw: errMatch[0] });
    }

    // 3. Eksik sözcükleri yakala: [E:sözcük]
    const wordOmissions = [];
    const wordOmRegex = /\[E:([^\]]+)\]/gi;
    let woMatch;
    while ((woMatch = wordOmRegex.exec(rawText)) !== null) {
      wordOmissions.push({ omittedWord: woMatch[1].trim(), raw: woMatch[0] });
    }

    // 4. Eksik bağlı morfemleri yakala: [EM]
    const morphemeOmissions = [];
    const morphOmRegex = /\[EM\]/gi;
    let moMatch;
    while ((moMatch = morphOmRegex.exec(rawText)) !== null) {
      morphemeOmissions.push({ raw: moMatch[0] });
    }

    // 5. İki dilli [L2] veya [L2:word] etiketlerini yakala
    const l2Words = [];
    const l2Regex = /\[L2(?::([^\]]+))?\]\s*([a-zA-ZçğıöşüÇĞİÖŞÜ]+)?/gi;
    let l2Match;
    while ((l2Match = l2Regex.exec(rawText)) !== null) {
      const wordVal = (l2Match[1] || l2Match[2] || "").trim();
      l2Words.push({
        raw: l2Match[0],
        word: wordVal
      });
    }

    // 6. Anlaşılmaz sözcükleri (XXX) yakala
    const unintelligibleTokens = [];
    const xxxRegex = /\b(XXX|xxx)\b/g;
    let xxxMatch;
    while ((xxxMatch = xxxRegex.exec(rawText)) !== null) {
      unintelligibleTokens.push(xxxMatch[0]);
    }

    // 7. Temiz metin üret (SALT kuralları: kodlar ve XXX hariç tutulur, labirentler MLU için ayıklanır)
    // Labirent parantezlerini temizle
    const unmazedText = rawText
      .replace(/\([^\)]+\)/g, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\[[^\]]+\]/g, " ")
      .replace(/\b(XXX|xxx)\b/g, " ")
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'«»]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Sözcük listesi (küçük harfe çevrilmiş)
    const words = unmazedText ? unmazedText.split(/\s+/).filter(w => w.length > 0) : [];

    // Labirent sözcükleri toplamı
    const totalMazeWordsCount = mazes.reduce((acc, m) => acc + m.count, 0);

    return {
      id,
      lineNum,
      rawText,
      cleanedText: unmazedText,
      words,
      mazes,
      mazeWordCount: totalMazeWordsCount,
      errors,
      wordOmissions,
      morphemeOmissions,
      l2Words,
      unintelligibleTokens,
      timestampSec
    };
  }
}
