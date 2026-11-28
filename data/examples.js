/**
 * Dil Analizi - Örnek Transkriptler
 * 1. Hikâye Anlatma (Anlatı Bağlamı, 54 ifade, >=50 eşiğini aşan yeterli örnek)
 * 2. Sohbet (Klinik Sohbet Bağlamı, 28 ifade, <50 klinik tipik kısa örnek)
 * 3. İki Dilli (Türkçe-İngilizce Kod Değiştirme ve [L2] Etiketli Örnek)
 */

export const EXAMPLE_TRANSCRIPTS = {
  narrative: {
    id: "narrative",
    title: "1. Hikâye Anlatma: Kurbağa Neredesin? (Anlatı, 54 İfade)",
    clientCode: "D-101",
    ageGroup: "6;0-11;11",
    exactAge: "6;4",
    context: "narrative",
    purpose: "assessment",
    lingualProfile: "monolingual",
    duration: 5,
    description: "Mercer Mayer'in resimli kurbağa hikâyesini yeniden anlatma. 50 ifadeden uzun, hikâye dilbilgisi bileşenlerini ve labirentleri içeren yüksek güvenilirlikli örnek.",
    text: `[00:02] T: Bu resimli kitapta bir çocuk ve kurbağası var, bana anlatır mısın?
[00:06] Ç: Bir gün küçük bir çocuk varmış.
[00:10] Ç: Çocuğun sevimli bir köpeği ve yeşil kurbağası varmış.
[00:15] Ç: Gece olunca çocuk yatağında uyumuş.
[00:20] Ç: Kurbağa kavanozdan gizlice dışarı çıkmış.
[00:25] Ç: Sabah olunca çocuk hemen uyanmış.
[00:29] Ç: Kavanoza bakmış ama kurbağa yokmuş.
[00:34] Ç: Çocuk çok üzülmüş ve korkmuş.
[00:39] Ç: Köpeğiyle birlikte aramaya başlamışlar.
[00:44] Ç: Çocuk çizmelerini ve kazağını giymiş.
[00:49] Ç: Köpek başını kavanoza sokmuş.
[00:54] Ç: Sonra kavanoz köpeğin kafasına sıkışmış.
[01:00] T: Sonra ne olmuş?
[01:03] Ç: Çocuk pencereyi açmış ve dışarıya seslenmiş.
[01:08] Ç: Kurbağa neredesin diye bağırmış.
[01:13] Ç: Köpek pencereden aşağıya düşmüş.
[01:18] Ç: Kavanoz kırılmış şangır diye.
[01:23] Ç: Çocuk aşağı inmiş ve köpeğini kucağına almış.
[01:28] Ç: Çocuk köpeğe biraz kızmış ama sonra sarılmış.
[01:34] Ç: Beraber büyük bir ormana gitmişler.
[01:40] Ç: Ormanda ağaçların arasına bakmışlar.
[01:45] Ç: Çocuk bir arı yuvası görmüş.
[01:50] Ç: Köpek arı kovanını koklamış ve sallamış.
[01:56] Ç: Çocuk yerdeki deliğe seslenmiş.
[02:01] Ç: (ııı) delikten küçük bir köstebek çıkmış.
[02:07] Ç: Köstebek çocuğun burnunu ısırmış.
[02:12] Ç: Arılar kovandan çıkıp köpeği kovalamış.
[02:18] Ç: Çocuk büyük bir ağacın kovuğuna tırmanmış.
[02:24] Ç: Kovuktan birdenbire kocaman bir baykuş uçmuş.
[02:30] Ç: Çocuk korkup ağaçtan yere yuvarlanmış.
[02:36] T: Peki çocuk vazgeçmiş mi?
[02:39] Ç: Hayır çocuk aramaya devam etmiş.
[02:44] Ç: Büyük kayaların arkasına koşmuş.
[02:50] Ç: Kayaların üstündeki dalları tutmuş.
[02:55] Ç: Ama o dallar geyiğin boynuzlarıymış.
[03:01] Ç: Geyik çocuğu sırtına alıp koşmaya başlamış.
[03:07] Ç: Köpek de arkalarından havlayarak koşmuş.
[03:13] Ç: Geyik uçurumun kenarında aniden durmuş.
[03:19] Ç: Çocuk ve köpek göle yuvarlanmışlar.
[03:25] Ç: Suya lıkır lıkır batmışlar.
[03:30] Ç: Su çok soğukmuş ama derin değilmiş.
[03:36] Ç: Çocuk sudan başını çıkarmış ve gülmüş.
[03:42] Ç: Köpek de çocuğun kafasına çıkmış.
[03:48] Ç: Çocuk bir kütüğün arkasından ses duymuş.
[03:54] Ç: Köpeğe sus sessiz ol demiş.
[04:00] Ç: Yavaşça kütüğün arkasına bakmışlar.
[04:06] Ç: Orada iki tane kurbağa görmüşler.
[04:12] Ç: Yanlarında da küçük küçük minik yavru kurbağalar varmış.
[04:18] Ç: Çocuk kurbağasını bulduğu için çok sevinmiş.
[04:24] Ç: Anne ve baba kurbağa ona bir yavru hediye etmiş.
[04:30] Ç: Çocuk yavru kurbağayı eline almış.
[04:33] Ç: Kurbağalar gölde vırak vırak ses çıkarmış.
[04:37] Ç: Çocuk arkadaşlarına el sallamış.
[04:42] Ç: Köpek neşeyle havlayarak etrafta dönmüş.
[04:47] Ç: Birlikte patika yoldan eve doğru yürümüşler.
[04:52] Ç: Eve varınca kurbağayı yeni yuvasına koymuşlar.
[04:56] Ç: Hep birlikte mutlu mutlu yaşamışlar.`
  },

  conversation: {
    id: "conversation",
    title: "2. Klinik Sohbet: Oyun ve Günlük Yaşam (Sohbet, 22 İfade)",
    clientCode: "D-202",
    ageGroup: "4;0-5;11",
    exactAge: "5;2",
    context: "conversation",
    purpose: "screening",
    lingualProfile: "monolingual",
    duration: 3,
    description: "Terapist ve çocuk arasında yapılandırılmış serbest sohbet. Westerveld & Claessen (2014) anketinde klinisyenlerin topladığı tipik örnek uzunluğunu (16-23 ifade) temsil eder.",
    text: `[00:03] T: Bugün buraya kiminle geldin?
[00:06] Ç: Annemle babamla geldim.
[00:10] T: Yolda gelirken neler gördün?
[00:14] Ç: Kırmızı büyük bir kamyon gördüm.
[00:19] Ç: Bir de sokakta sarı kedi vardı.
[00:24] T: Kedi ne yapıyordu?
[00:27] Ç: Ağaca tırmanıyordu ama çıkamadı.
[00:32] T: Neden çıkamadı acaba?
[00:35] Ç: Çünkü köpek havladı ondan korktu.
[00:40] T: Evde senin de hayvanın var mı?
[00:43] Ç: Hayır yok ama ben kuş istiyorum.
[00:48] T: Kuşun olsaydı ona ne isim koyardın?
[00:52] Ç: Maviş koyardım kafesinde uçardı.
[00:57] T: En çok hangi oyuncağınla oynamayı seviyorsun?
[01:01] Ç: (ııı) lego arabalarımı seviyorum.
[01:06] Ç: Kule yapıyorum sonra güm diye yıkıyorum.
[01:12] T: Kule yıkılınca kardeşin ne diyor?
[01:16] Ç: Kardeşim gülüyor alkış yapıyor.
[01:21] Ç: Bazen o da legoları <atıyor> fırlatıyor.
[01:27] T: Sen ne yapıyorsun o zaman?
[01:30] Ç: Ben [Hata] kızıyo ona ama annem kızma diyor.
[01:36] Ç: Çünkü o daha bebek bilmiyor.
[01:42] T: Hafta sonu parka gittiniz mi?
[01:46] Ç: Evet salıncakta çok hızlı sallandım.
[01:52] Ç: Kaydıraktan da kaydım.
[01:57] Ç: Sonra dondurma yedim çilekli.
[02:03] T: Üstüne damladı mı peki?
[02:06] Ç: Birazcık [E:tişörtüme] damladı annem sildi.
[02:12] Ç: Parkta bir çocukla arkadaş oldum.
[02:18] Ç: Birlikte kumda kale yaptık.
[02:24] T: Kalenin içine ne koydunuz?
[02:28] Ç: Taş koyduk su döktük köprü yaptık.
[02:34] Ç: Akşam olunca eve gittik ben çok yoruldum.
[02:40] Ç: Yatağımda mışıl mışıl uyudum.`
  },

  bilingual: {
    id: "bilingual",
    title: "3. İki Dilli Çocuk: Türkçe-İngilizce Kod Değiştirme (29 İfade)",
    clientCode: "D-303",
    ageGroup: "4;0-5;11",
    exactAge: "5;8",
    context: "retelling",
    purpose: "goals",
    lingualProfile: "bilingual",
    duration: 3,
    description: "İki dilli (Türkçe ve İngilizce) çocuğun anlatısı. Kod değiştirme (code-switching) [L2] etiketleriyle işaretlenmiştir (Heilmann & Westerveld 2013, Williams & McLeod 2012).",
    text: `[00:04] T: Resme bakıp bana ne olduğunu anlatır mısın?
[00:08] Ç: Çocuk ve [L2] dog parka gitmişler.
[00:13] Ç: Parkta büyük bir [L2] butterfly görmüşler.
[00:18] Ç: Köpek kelebeğin arkasından koştu.
[00:23] Ç: Çocuk dur diye bağırdı.
[00:28] Ç: Ama köpek [L2] fast koştu dinlemedi.
[00:33] Ç: Sonra bir ağacın altına geldiler.
[00:39] Ç: Ağaçta [L2] apple vardı kırmızı kırmızı.
[00:44] Ç: Çocuk elmayı almak istedi.
[00:49] Ç: Boyu yetmedi [L2] because boyu küçüktü.
[00:55] Ç: Köpek havladı yardım etmek için.
[01:00] T: Sonra ne yaptılar?
[01:04] Ç: Çocuk bir taşın üstüne çıktı.
[01:09] Ç: [L2] Look elmayı tuttu.
[01:14] Ç: Ama taş kaydı çocuk düştü.
[01:19] Ç: Dizi acıdı birazcık ağladı.
[01:25] Ç: Köpek geldi çocuğun elini yaladı.
[01:30] Ç: Çocuk güldü tamam [L2] I am okay dedi.
[01:36] Ç: Beraber elmayı paylaştılar.
[01:41] Ç: Yarısını köpek yedi yarısını çocuk yedi.
[01:47] Ç: Sonra [L2] rain başladı yağmur yağdı.
[01:52] Ç: Her yer ıslandı çamur oldu.
[01:57] Ç: Çocuk şemsiyesini [EM] açtı.
[02:03] Ç: Eve doğru koştular hızlıca.
[02:08] Ç: Anne kapıyı açtı [L2] come inside dedi.
[02:14] Ç: Çocuk üstünü değiştirdi kuru tişört giydi.
[02:20] Ç: Köpeği de havluyla kuruladılar.
[02:26] Ç: Sıcak süt içtiler kurabiye yediler.
[02:32] Ç: Çocuk camdan dışarı baktı.
[02:38] Ç: Yağmur dindi güneş çıktı gökkuşağı oldu.
[02:44] Ç: Çocuk çok mutlu oldu anneye sarıldı.`
  }
};
