# Dil Analizi - Klinik Çocuk Dil Örneği Analiz Aracı

"Dil Analizi", çocukların spontan konuşma ve anlatı transkriptlerini (Türkçe) web tarayıcısı üzerinde yerel olarak ayrıştıran, 3 temel akademik makalenin yöntem ve eşiklerine göre güvenilirlik ve yapısal raporlar üreten, tamamen statik tek sayfalık bir klinik karar destek aracıdır.

Proje herhangi bir sunucuya, arka yüze (backend), API anahtarına veya derleme adımına ihtiyaç duymaz; GitHub Pages üzerinde doğrudan yayınlanabilir.

---

## 🔒 Veri Gizliliği ve KVKK Güvencesi

* **Sıfır Sunucu İletişimi:** Tüm transkripsiyon ve morfolojik analiz adımları kullanıcının tarayıcısında (Client-side JavaScript) yürütülür.
* **Ağ Trafiği Yoktur:** Transkript metinleri, çocuk profilleri veya analiz sonuçları hiçbir uzak sunucuya veya bulut servisine gönderilmez.
* **KVKK Önerisi:** Gizlilik ilkeleri gereğince gerçek çocuk/danışan isimleri yerine daima anonim kodlar (örn: `D-101`, `Ç-02`) kullanılması önerilir.
* **Oturum Sıfırlama:** "Temizle" düğmesine basıldığında tarayıcı belleğindeki (`localStorage`) tüm veriler kalıcı olarak silinir.

---

## 📚 Akademik ve Bilimsel Dayanaklar

Uygulamanın tüm ölçütleri, güvenilirlik eşikleri ve analiz yapıları aşağıdaki üç temel akademik makaleye dayanmaktadır:

### 1. Heilmann, Nockerts & Miller (2010)
> **Heilmann, J., Nockerts, A., & Miller, J. F. (2010).** *Language Sampling: Does the Length of the Transcript Matter?* Language, Speech, and Hearing Services in Schools, 41(4), 393–404.
* **Örnek Uzunluğu ve Güvenilirlik:** 1, 3 ve 7 dakikalık örneklerin test-tekrar test güvenilirliği (Cronbach alfa, α) 231 tipik gelişim gösteren çocukta incelenmiştir.
* **Temel Bulgular:** Örnek uzunluğunun temel ölçütler üzerindeki ana etkisi anlamlı değildir (tüm $\eta^2 < .01$). Ancak kısa örneklerde değişkenlik (varyasyon katsayısı) artar.
* **Ölçüt Eşikleri:**
  * **NTU (İfade Sayısı), WPM (Dakikadaki Sözcük), NDW (Farklı Sözcük):** 1 dakikada $\alpha > 0.70$, 3 dakikada $\alpha > 0.80$ (Yüksek güvenilirlik).
  * **MLUm (Ortalama Morfem):** 3 dakikada $\alpha \approx 0.72$ (Orta-İyi).
  * **% Labirent (% Maze):** 1 dakikada zayıf ($\alpha \approx 0.44$), 3 dakikada kabul edilebilir ($\alpha \approx 0.69$).
  * **Hata ve Eksiklikler:** Tipik gelişimde nadir olduğundan kısa örneklerde güvenilmezdir ($\alpha < 0.60$).
* **Örnek Yeterliliği:** Detaylı morfolojik ve labirent analizi için geleneksel $\ge 50$ ifade önerilir (Makalede 7 dk ortalaması: 97,4 ifade).

### 2. Westerveld & Claessen (2014)
> **Westerveld, M. F., & Claessen, M. (2014).** *Clinician survey of language sampling practices in Australia.* International Journal of Speech-Language Pathology, 16(3), 242–249.
* **Klinisyen Anketi ($n=257$):** Klinisyenlerin %91'i spontan dil örneği toplamakta, ancak yalnızca %56'sı ses kaydı almakta ve %12,5'i bilgisayar destekli analiz kullanmaktadır.
* **Zaman Engeli:** Klinisyenlerin %80'inden fazlası için transkripsiyon ve analiz süresi en büyük engeldir; %57'si güvenilir bir analiz aracı talep etmektedir.
* **Tipik Klinik Örnek Boyutu:** Klinisyenlerin pratikte aldığı ortalama örnek uzunluğu 16–23 ifadedir (aykırı değerler çıkarılınca konuşma 23.3, anlatı 16.6 ifade).
* **Gelişimsel Bağlam Eşleşmesi:**
  * $< 4$ yaş: Serbest Oyun (Free Play).
  * $4;0 - 5;11$ yaş: Sohbet (Conversation) ve basit anlatı (Retelling).
  * $6;0 - 11;11$ yaş: Anlatı (Narrative) ve Açıklayıcı Söylem (Expository).
  * $12+$ yaş: Açıklayıcı Söylem (Expository) okul başarısı ve karmaşık sözdizimi için en hassas bağlamdır.

### 3. Özdemir (2010)
> **Özdemir, M. (2010).** *Nitel Veri Analizi: Sosyal Bilimlerde Yöntembilim Sorunsalı Üzerine Bir Çalışma.* Eskişehir Osmangazi Üniversitesi Sosyal Bilimler Dergisi, 11(1), 323–343.
* **Ortak Süreç Modeli:** Veri $\rightarrow$ Analiz Birimi $\rightarrow$ Açık Kodlama $\rightarrow$ Eksenel Kategori $\rightarrow$ Seçici Tema $\rightarrow$ Denence ve Raporlama.
* **Dayandığı Modeller:** Miles & Huberman (veri azaltma-görselleştirme-sonuca ulaşma), Dey (betimleme-sınıflandırma-ilişkilendirme), Strauss & Corbin (kodlama türleri) ve Wolcott (betimleme-analiz-yorumlama).
* **Nitel Analiz Türleri:** İçerik Analizi, Betimsel Analiz, Sabit Karşılaştırma Analizi (Grounded Theory), Söylem Çözümlemesi ve Fenomenolojik Analiz.
* **Geçerlik ve Güvenilirlik:** İç geçerliğin doğrudan blok alıntılarla gösterilmesi ve araştırmacılar arası tutarlılık formülü:
  $$\text{Uzlaşma Yüzdesi} = \left[ \frac{\text{Görüş Birliği}}{\text{Görüş Birliği} + \text{Görüş Ayrılığı}} \right] \times 100 \ge \%80$$

---

## 🛠️ Dosya Yapısı

```
Dil Analizi/
├── .nojekyll                 # GitHub Pages Jekyll atlama dosyası
├── index.html                # Ana tek sayfalık HTML arayüzü
├── tests.html                # Birim test doğrulama sayfası
├── README.md                 # Proje belgeleri ve kurulum kılavuzu
├── css/
│   └── style.css             # Tema, erişilebilirlik ve @media print stilleri
├── js/
│   ├── app.js                # Ana uygulama kontrolörü ve olay yönetimi
│   ├── parser.js             # Ç: ve T: satır, damga ve kodlama ayrıştırıcısı
│   ├── morphology.js         # Kural tabanlı Türkçe morfem ayrıştırıcısı
│   ├── metrics.js            # NTU, NTW, NDW, TTR, MLU, MLUm, WPM, LARSP
│   ├── reliability.js        # Heilmann 2010 eşikleri ve bağlam uyumu
│   ├── qualitative.js        # Özdemir 2010 etkileşimli nitel analiz motoru
│   ├── recorder.js           # Ses kaydı (MediaRecorder), AnalyserNode seviye göstergesi, Web Speech API dikte ve Whisper
│   └── ui.js                 # DOM ve Chart.js grafik yöneticisi
├── data/
│   ├── roots.js              # ~500 en sık Türkçe çocuk dili kök sözlüğü
│   └── examples.js           # 3 örnek transkript (Anlatı, Sohbet, İki Dilli)
└── vendor/
    └── chart.umd.min.js      # Chart.js yerel UMD kütüphanesi
```

---

## 💻 Yerelde Çalıştırma

### Yöntem 1: Doğrudan Çift Tıklayarak Açma (file://)
Uygulama tamamen statik olup harici mutlak bağımlılık içermez. `index.html` dosyasını Chrome, Edge, Firefox veya Safari üzerinde doğrudan çift tıklayarak açabilirsiniz.

### Yöntem 2: Yerel HTTP Sunucusu İle Açma (Önerilen)
Bazı modern tarayıcılar yerel ES modüllerini (`type="module"`) `file://` protokolü altında sıkı CORS politikası nedeniyle engelleyebilir. Bu durumda terminalden bir yerel HTTP sunucusu başlatabilirsiniz:

```bash
# Python 3 ile
python -m http.server 8000

# Veya Node ile (npx)
npx serve .
```
Tarayıcınızda `http://localhost:8000` adresine gidiniz.

---

## 🚀 GitHub Pages Üzerinde Yayınlama Adımları

1. GitHub üzerinde yeni bir depo (repository) oluşturun (örn: `dil-analizi`).
2. Proje dizinindeki tüm dosyaları depoya gönderin:
   ```bash
   git init
   git add .
   git commit -m "İlk sürüm: Dil Analizi klinik karar destek sistemi"
   git branch -M main
   git remote add origin https://github.com/KULLANICI_ADINIZ/dil-analizi.git
   git push -u origin main
   ```
3. GitHub depo sayfanızda **Settings** (Ayarlar) sekmesine gidin.
4. Sol menüden **Pages** seçeneğine tıklayın.
5. **Build and deployment** başlığı altında:
   * **Source:** `Deploy from a branch` seçin.
   * **Branch:** `main` ve dizin olarak `/ (root)` seçin.
   * **Save** düğmesine tıklayın.
6. Birkaç dakika içinde siteniz `https://KULLANICI_ADINIZ.github.io/dil-analizi/` adresinde canlıya geçecektir.

> **Önemli:** Depo kökündeki `.nojekyll` dosyası, GitHub Pages'in `vendor/` veya alt dizinlerdeki dosyaları yoksaymasını engeller. Tüm bağlantılar göreli (`./`) olduğu için site kök veya alt dizin ayrımı olmaksızın sorunsuz çalışır.

---

## 🧪 Birim Testleri Çalıştırma

Proje içerisinde yer alan fonksiyonların (ayrıştırıcı, morfoloji kuralları, metrik hesaplamaları ve güvenilirlik eşikleri) doğruluğunu test etmek için:
* `tests.html` dosyasını tarayıcınızda açınız.
* 10 adet otomatik birim test çalışacak ve yeşil rozetlerle raporlanacaktır.

---

## ⚠️ Sınırlılıklar ve Yasal Sorumluluk Reddi

> **UYARI:** Bu araç bir **klinik karar DESTEK aracıdır**; tek başına tıbbi, gelişimsel veya eğitsel tanı koymaz.
* **Türkçe Norm Verisi Eksikliği:** Ölçüt referansları (Heilmann 2010, Westerveld 2014) İngilizce konuşan çocuklardan elde edilmiştir. Türkçe sondan eklemeli bir dil olduğu için morfem uzunluğu (MLUm) doğal olarak İngilizceden farklıdır.
* **Morfolojik Kestirim:** Türkçe morfem ayrıştırıcısı kural tabanlı bir algoritmadır; çocuk dilindeki düzensiz yapılar uzman klinisyen tarafından kontrol edilmelidir.
* **Eğitim ve Karar:** Klinik kararlar her zaman standartlaştırılmış değerlendirme bataryaları, uzman klinik gözlemi ve aile görüşmeleriyle birlikte verilmelidir.
