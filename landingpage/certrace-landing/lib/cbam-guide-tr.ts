import type { CbamGuide } from "./cbam-guide";

/* Turkish text for the CBAM knowledge hub.

   Turkey is the EU's largest CBAM-exposed steel and aluminium supplier, so
   this is the one translation where the reader is likely to be further along
   than the English reader. Registered names stay in English (CBAM, EU ETS,
   CN Code, TARIC, Annex, SEE, Scope 1/2, EU Login) — that is how they appear
   in Turkish ministry and TÜRKAK material, and how they are searched for. */

export const CBAM_TR: CbamGuide = {
  hub: {
    eyebrow: "CBAM HAKKINDA",
    headline: "CBAM'in ihracatçıdan istediği\nher şey, açık açık.",
    intro:
      "AB'nin Sınırda Karbon Düzenleme Mekanizması 1 Ocak 2026'da kesin dönemine geçti. Bu on beş rehber, CBAM'in artık ne istediğini, neye mal olduğunu ve AB dışı ihracatçının neyi kanıtlaması gerektiğini anlatıyor — beyanı sunan AB'li ithalatçı için değil, karbon verisini üreten ihracatçı için yazıldı.",
    searchLabel: "Rehberlerde ara",
    searchPlaceholder: "CBAM rehberlerinde ara…",
    allTopics: "Tüm konular",
    noResults: "Bu aramayla eşleşen bir içerik yok.",
    clear: "Temizle",
    readTime: "dk okuma",
    pillarLabel: "BURADAN BAŞLAYIN",
    updatedLabel: "Güncellendi",
  },
  article: {
    backToHub: "TÜM CBAM REHBERLERİ",
    keyFacts: "Kısa cevap",
    onThisPage: "BU SAYFADA",
    faqHeading: "İnsanların gerçekten sorduğu sorular",
    relatedHeading: "Sırada okuyun",
    updatedPrefix: "Güncellendi",
    readPrefix: "",
    ctaEyebrow: "PRATİĞE DÖKÜN",
    ctaHeadline: "Kuralı bilmek işin kolay yarısı.",
    ctaBody:
      "Zor yarısı, ihracatçının tedarik zincirini AB'li ithalatçının kabul edeceği doğrulanmış, eksiksiz ve zamanında karbon verisine dönüştürmek. Certrace'in yaptığı iş tam olarak bu — tedarikçi başına tek bir bağlantı, CBAM hesabı ihracatçı adına çalışır ve alıcı sormadan önce biten, doğrulayıcıya hazır bir rapor.",
    ctaPrimary: "ÜCRETSİZ DENEYİN",
    ctaSecondary: "DEMO TALEP EDİN",
  },

  articles: {
    "what-is-cbam": {
      title: "CBAM nedir ve 1 Ocak 2026'da ne değişti?",
      dek: "CBAM, AB'nin ithal mallara uyguladığı karbon fiyatıdır. 1 Ocak 2026'dan beri artık bir raporlama alıştırması değil — AB'li ithalatçılar, AB dışı ihracatçının kendilerine sattığı malın içindeki gömülü emisyonlar için CBAM sertifikası satın alıp teslim ediyor.",
      metaTitle: "CBAM nedir? AB Sınırda Karbon Düzenleme Mekanizması ihracatçılar için (2026)",
      metaDescription:
        "CBAM 1 Ocak 2026'da kesin dönemine geçti. AB dışı ihracatçılar için sade bir rehber: CBAM nedir, hangi ürünleri kapsar, kim öder, ihracatçının AB'li ithalatçıya neyi kanıtlaması gerekir ve artık bağlayıcı olan tarihler.",
      topic: "Temeller",
      keyFacts: [
        { label: "Tam adı", value: "Carbon Border Adjustment Mechanism" },
        { label: "Hukuki dayanak", value: "Regulation (EU) 2023/956" },
        { label: "Kesin dönem başlangıcı", value: "1 Ocak 2026" },
        { label: "Kapsanan sektörler", value: "Demir-çelik, alüminyum, çimento, gübre, hidrojen, elektrik" },
        { label: "Sertifikayı kim alır", value: "AB'li ithalatçı (authorized CBAM declarant)" },
        { label: "Veriyi kim üretir", value: "AB dışı üretici ve ihracatçı" },
        { label: "İlk beyan tarihi", value: "30 Eylül 2027, 2026 ithalatı için" },
      ],
      sections: [
        {
          h: "Tek paragraflık hâli",
          p: [
            "CBAM, belirli malları Avrupa Birliği'ne getiren ithalatçının, o malları üretmek için bir Avrupa fabrikasının ödeyeceği karbon fiyatının aynısını ödemesini sağlar. İthalatçı, ithal edilen her tonun içindeki sera gazı emisyonlarını hesaplar, bunları karşılamak için CBAM sertifikası alır ve yılda bir kez teslim eder. Sertifika fiyatı AB Emisyon Ticaret Sistemi'ni (EU ETS) izler.",
            "Mekanizma karbon kaçağını hedefliyor — Avrupa iklim politikasının üretimi ve emisyonlarını Avrupa dışına taşıma riskini. AB dışı ihracatçı tasarımına katılsın ya da katılmasın, ihracatçıya etkisi dar ve nettir: ihracatçının emisyon rakamı artık AB'li ithalatçının ondan alma maliyetinde bir satır kalemidir.",
          ],
        },
        {
          h: "2026'da gerçekte ne değişti",
          p: [
            "Ekim 2023 ile 2025 sonu arasında CBAM bir geçiş dönemi yürüttü. İthalatçılar gömülü emisyonları üç ayda bir raporladı ve hiçbir şey satın almadı. Eksik veri can sıkıcıydı ama idare edilebilirdi ve varsayılan değerler serbestçe kullanılabiliyordu.",
            "1 Ocak 2026'da kesin dönem başladı. Üç şey aynı anda değişti:",
          ],
          list: [
            "Sertifikalar gerçek oldu. 2026'dan itibaren ithal edilen malların gömülü emisyonları satın alınmış sertifikalarla karşılanmak ve yıllık olarak teslim edilmek zorunda.",
            "Doğrulama zorunlu oldu. Gerçek bir emisyon rakamı ancak akredite bir doğrulayıcı kontrol ettiyse sayılır. Doğrulanmamış olan, varsayılan demektir.",
            "Varsayılan değerler pahalılaştı. AB'nin varsayılan değerleri bilerek yüksek emisyonlu tesislerden belirlenir; oraya düşmek AB'li ithalatçıya para kaybettirir — ithalatçının, başka seçenek bırakmayan ihracatçıyla harcamamaya çalışacağı bir para.",
          ],
          note: "2026'da tek bir kolaylık var: ithalatçılar 2026 ithalatını raporlar ama 2026 içinde sertifika bulundurmak zorunda değildir. Satın alma Şubat 2027'de açılır ve ilk teslim 30 Eylül 2027'ye düşer.",
        },
        {
          h: "Hangi ürünler kapsamda",
          p: [
            "Bugün altı sektör kapsanıyor ve kapsam ürün adıyla değil CN Code ile tanımlanıyor — bu önemli, çünkü kulağa benzer gelen iki ürün çizginin iki farklı tarafında olabilir:",
          ],
          list: [
            "Demir ve çelik — açık ara en büyük kategori ve Türk ihracatçıların ilk karşılaştığı kalem",
            "Alüminyum",
            "Çimento",
            "Gübre",
            "Hidrojen",
            "Elektrik",
          ],
        },
        {
          h: "Kim ne yapar",
          p: [
            "Hukuki yükümlülük AB'li ithalatçıdadır; kapsamdaki malları ithal edebilmek için authorized CBAM declarant olmak zorundadır. CBAM Registry'ye kaydolur, yıllık beyanı sunar, sertifikaları alır ve teslim eder.",
            "Ama veri ithalatçının tarafında yok. Fırının ne kadar gaz yaktığını, elektriğin hangi şebeke faktörünü taşıdığını ve kütüğe hangi ön maddelerin girdiğini yalnızca ihracatçı bilir. Dolayısıyla yükümlülük hukuken AB'li ithalatçıyı bağlasa da ticari olarak ihracatçıya iner: ihracatçıdan veri yoksa ithalatçı için gerçek değer de yok, ve rakip ihracatçının doğrulanmış rakamından daha pahalıya gelen bir varsayılan değer var.",
            "Bu yüzden CBAM'i bir vergiden çok bir ticaret koşulu olarak okumak doğrudur. AB dışı ihracatçının Avrupa'ya satmasını engellemez. Avrupa'nın hangi ihracatçıdan almayı tercih ettiğini değiştirir.",
          ],
        },
        {
          h: "İhracatçının üretebilmesi gerekenler",
          list: [
            "Her ürün için ton başına özgül gömülü emisyon (SEE), doğrudan ve — kuralın gerektirdiği yerde — dolaylı emisyon olarak ayrılmış",
            "Malın üretildiği üretim rotası ve ihracatçının ölçüm yaptığı sistem sınırı",
            "Karmaşık bir mala giren her ön madde, kendi miktarı ve kendi gömülü emisyonuyla",
            "İzleme kanıtı: sayaç okumaları, yakıt faturaları, laboratuvar analizleri, elektrik faturaları, kalite belgeleri",
            "Akredite bir doğrulayıcıdan doğrulama raporu",
            "Mahsup edilecekse, ihracatçının kendi ülkesinde hâlihazırda ödediği karbon fiyatı",
          ],
          p: [
            "Bunların hiçbiri egzotik değil. CBAM'i zorlaştıran şey listedeki tek bir kalem değil — hepsini birden, her ay, her tesis ve zincirde ihracatçının üstündeki her tedarikçi için, akredite bir Avrupa doğrulayıcısının kabul edeceği biçimde ve AB'li ithalatçı sormadan önce üretmektir.",
          ],
        },
      ],
      faq: [
        {
          q: "AB dışı ihracatçının AB'ye kaydolması gerekiyor mu?",
          a: "Hayır. CBAM Registry'ye kayıt, authorized CBAM declarant olmak zorunda olan AB'li ithalatçılar içindir. AB dışı üretici, tesis işletmecisi şeklinde kayıtlanabilir ve sistem üzerinden veri paylaşabilir, ama beyan yükümlülüğü AB'li ithalatçıda kalır.",
        },
        {
          q: "Certrace veya başka bir sağlayıcı ihracatçının CBAM beyanını sunabilir mi?",
          a: "Hayır — hiçbir sağlayıcı sunamaz. Registry'ye yalnızca AB'li ithalatçının authorized CBAM declarant'ı beyan sunabilir. Bir platformun yapabileceği şey, beyanın mümkün olması için o beyan sahibine ihracatçıdan gelen eksiksiz, doğrulanmış ve doğru biçimlendirilmiş bir veri seti vermektir.",
        },
        {
          q: "İhracatçı hiç veri vermezse ne olur?",
          a: "Hukuken ihracatçıya bir şey olmaz. AB'li ithalatçı bilerek yüksek belirlenmiş AB varsayılan değerini uygular ve doğrulanmış rakam veren rakip bir ihracatçıdan almaya kıyasla ton başına daha fazla öder. O fiyat farkı, yaptırımın kendisidir.",
        },
        {
          q: "Sadece az miktarda çelik içeren ürünler CBAM'e giriyor mu?",
          a: "Henüz hayır. Bugün kapsam altı sektörün kendi ürünleridir. Komisyon, 1 Ocak 2028'den itibaren yüksek çelik veya alüminyum içerikli yaklaşık 180 alt akım imalat ürününe genişletmeyi önerdi.",
        },
      ],
    },

    "cbam-key-dates": {
      title: "Bugünden Eylül 2027'ye kadar önemli olan bütün CBAM tarihleri",
      dek: "Sertifika satışı Şubat 2027'de açılıyor, 2027 boyunca dört bulundurma kontrolü yapılıyor ve 2026 ithalatı için ilk beyan ile ilk teslim 30 Eylül 2027'ye düşüyor.",
      metaTitle: "CBAM son tarihleri 2026–2027: kilit tarihler, bulundurma kontrolleri ve ilk beyan",
      metaDescription:
        "CBAM kesin dönem takviminin tamamı: 2026'da üç aylık fiyat yayını, Şubat 2027'de sertifika satışının açılması, %50'lik üç aylık bulundurma kontrolleri ve 30 Eylül 2027 beyan tarihi.",
      topic: "Tarihler",
      keyFacts: [
        { label: "Kesin dönem başladı", value: "1 Ocak 2026" },
        { label: "Sertifika satışı açılıyor", value: "Şubat 2027, 2026 ithalatı için" },
        { label: "Üç aylık bulundurma şartı", value: "Yıl başından itibaren gömülü emisyonların ≥ %50'si" },
        { label: "İlk beyan + ilk teslim", value: "30 Eylül 2027" },
        { label: "Kapsanan raporlama yılı", value: "2026 takvim yılı" },
        { label: "2026'da fiyat yayını", value: "Üç aylık · 2027'den itibaren haftalık" },
      ],
      sections: [
        {
          h: "Sırasıyla takvim",
          table: {
            head: ["Ne zaman", "Ne oluyor"],
            rows: [
              ["1 Ocak 2026", "Kesin dönem başlıyor. 2026 ithalatı kapsamda, ancak 2026 içinde sertifika bulundurmak gerekmiyor."],
              ["7 Nisan 2026", "2026 1. çeyrek CBAM sertifika fiyatı yayımlandı — ton CO₂e başına €75,36."],
              ["6 Temmuz 2026", "2026 2. çeyrek fiyatı yayımlandı — ton CO₂e başına €75,28."],
              ["5 Ekim 2026", "2026 3. çeyrek fiyatı yayımlanıyor."],
              ["4 Ocak 2027", "2026 4. çeyrek fiyatı yayımlanıyor."],
              ["Şubat 2027", "2026 ithalatı için authorized CBAM declarant'lara Common Central Platform üzerinden sertifika satışı açılıyor."],
              ["2027 boyunca", "Üç aylık yayının yerini haftalık fiyat yayını alıyor."],
              ["2027 1. çeyrek sonu", "İlk bulundurma kontrolü: 2027 yılbaşından itibaren gömülü emisyonların en az %50'si karşılanmalı."],
              ["2027 2. çeyrek sonu", "İkinci kontrol, aynı %50 testi."],
              ["30 Haziran 2027", "Komisyonun yayımladığı takvimdeki yıl ortası kontrol noktası."],
              ["30 Eylül 2027", "2026 için ilk CBAM beyanı sunuluyor ve ilk sertifikalar teslim ediliyor. Aynı zamanda 2027 3. çeyrek bulundurma kontrolünün sonu."],
              ["2027 4. çeyrek sonu", "Dördüncü bulundurma kontrolü."],
            ],
          },
        },
        {
          h: "Bulundurma kontrolleri ihracatçı için ne demek",
          p: [
            "Üç aylık bulundurma kontrolleri ihracatçının değil AB'li ithalatçının yükümlülüğü — ama ithalatçının ihracatçının rakamlarına ne zaman ihtiyaç duyacağını değiştirdiği için pratikte ihracatçının sorunu oluyor.",
            "Bir çeyrek sonunda yıl başından beri biriken emisyonların %50'sini bulundurabilmek için beyan sahibi o emisyonun ne olduğunu bilmek zorundadır. Yıl sonu mutabakatını bekleyemez. 2027 başından itibaren üç aylık ritimde veri talepleri bekleyin ve ilk ciddi talebin Eylül son tarihine yakın değil, 2027 1. çeyrekte geleceğini varsayın.",
          ],
          note: "Pratik okuma: Ağustos 2027'de ihracatçının 2026 rakamlarının hiç doğrulanmadığını fark eden bir AB'li ithalatçının düzeltecek vakti kalmamıştır. İhracatçının verisinin kullanılabilir olup olmadığını belirleyen konuşma, son tarihten bir yıl önce yapılır.",
        },
        {
          h: "2026 neden sessiz görünüyor ama değil",
          p: [
            "2026 ithalatı için 2026 içinde sertifika bulundurma şartı yok. Bu, AB'li ithalatçının nakit akışında gerçek bir rahatlamadır ve başka bir şey değildir. İhracatçının bu yıl sevk ettiği her partinin içindeki gömülü emisyonlar sayılmaya devam ediyor ve ithalatçı bunları 2027'de kimsenin geriye dönük indiremeyeceği bir fiyattan ödeyecek.",
            "İhracatçının 2026'da toplamadığı veri 2027'de yeniden yaratılamaz. Mart 2026'ya ait bir gaz sayacı okuması ya Mart 2026'da vardır ya da hiç yoktur — ve akredite bir doğrulayıcı hafızadan kurgulanmış bir rakamı kabul etmez. Sessiz yıl, ihracatçının toplama yılıdır.",
          ],
        },
        {
          h: "Ne zaman ne hazır olmalı",
          list: [
            "Şimdi — her tesis ve kapsamdaki her ürün için aylık izleme çalışıyor, kanıt üretildiği anda dosyalanıyor",
            "Şimdi — her ön madde tedarikçisi belirlenmiş, talep gönderilmiş ve gerçekten cevap veren bir muhatap var",
            "2026 4. çeyrek — 2026 verisinin tamamı kapatılmış ve şirket içinde onaylanmış",
            "2027 1. çeyrek — akredite bir doğrulayıcıyla anlaşılmış; sıra gerçektir (doğrulayıcı rehberine bakın)",
            "2027 ilk yarı — ihracatçının doğrulaması tamamlanmış, böylece AB'li ithalatçı 1. ve 2. çeyrek kontrollerini gerçek değerlerle geçebilsin",
            "30 Eylül 2027'ye kadar — AB'li ithalatçı, AB varsayılan değeri yerine ihracatçının doğrulanmış rakamlarıyla beyanı sunuyor",
          ],
        },
      ],
      faq: [
        {
          q: "İlk CBAM beyanı ne zaman?",
          a: "30 Eylül 2027; 2026 takvim yılında ithal edilen malları kapsar. O ithalata ait sertifikalar da aynı anda teslim edilmelidir.",
        },
        {
          q: "2026'da sertifikaya ihtiyacım var mı?",
          a: "AB dışı ihracatçının hiçbir zaman sertifikaya ihtiyacı olmaz — AB'li ithalatçının olur. 2026 ithalatı için ithalatçının 2026 içinde bulundurması gerekmez; satın alma Şubat 2027'de açılır.",
        },
        {
          q: "%50 bulundurma kuralı nedir?",
          a: "2027'den itibaren her çeyreğin sonunda bir authorized CBAM declarant, o yılın başından beri ithal ettiği malların gömülü emisyonlarının en az %50'sini karşılayan CBAM sertifikası bulundurmak zorundadır.",
        },
        {
          q: "Sertifika fiyatları ne sıklıkla yayımlanıyor?",
          a: "2026'da yayımlanmış bir takvime göre üç ayda bir. 2027'den itibaren Komisyon haftalık ortalama fiyatlamaya geçiyor.",
        },
      ],
    },

    "cbam-certificate-price": {
      title: "Bir CBAM sertifikası ne kadar ve fiyatı kim belirliyor?",
      dek: "Bir sertifika bir ton CO₂e'yi karşılar. Komisyon 2026 1. çeyrek için €75,36, 2. çeyrek için €75,28 yayımladı; ikisi de EU ETS açık artırma fiyatlarını izliyor. 3. ve 4. çeyrek 5 Ekim 2026 ve 4 Ocak 2027'de duyurulacak.",
      metaTitle: "CBAM sertifika fiyatı 2026: 1. çeyrek €75,36, 2. çeyrek €75,28 ve fiyat nasıl hesaplanır",
      metaDescription:
        "2026'da bir CBAM sertifikasının maliyeti, Avrupa Komisyonunun EU ETS açık artırma fiyatlarından nasıl hesapladığı, üç aylık yayın takvimi ve 2027'den itibaren haftalık fiyatlamaya geçiş.",
      topic: "Maliyet",
      keyFacts: [
        { label: "Bir sertifika neyi karşılar", value: "1 ton CO₂e gömülü emisyon" },
        { label: "2026 1. çeyrek fiyatı", value: "€75,36 / tCO₂e (7 Nisan 2026'da yayımlandı)" },
        { label: "2026 2. çeyrek fiyatı", value: "€75,28 / tCO₂e (6 Temmuz 2026'da yayımlandı)" },
        { label: "2026 3. çeyrek fiyatı", value: "5 Ekim 2026'da duyurulacak" },
        { label: "2026 4. çeyrek fiyatı", value: "4 Ocak 2027'de duyurulacak" },
        { label: "Dayanak", value: "EU ETS ortalama açık artırma takas fiyatı" },
        { label: "2027'den itibaren", value: "Haftalık ortalama fiyatlama" },
      ],
      sections: [
        {
          h: "2026 için yayımlanmış takvim",
          table: {
            head: ["Çeyrek", "Fiyat (€/tCO₂e)", "Yayım tarihi"],
            rows: [
              ["2026 1. çeyrek", "€75,36", "7 Nisan 2026"],
              ["2026 2. çeyrek", "€75,28", "6 Temmuz 2026"],
              ["2026 3. çeyrek", "Henüz yok", "5 Ekim 2026"],
              ["2026 4. çeyrek", "Henüz yok", "4 Ocak 2027"],
            ],
          },
          note: "2026 3. ve 4. çeyrek, bu yazının kaleme alındığı tarihte yayımlanmadı. Bu çeyrekler için ihracatçıya ya da ithalatçıya aktarılan herhangi bir rakam birilerinin tahminidir, Komisyon fiyatı değildir.",
        },
        {
          h: "Rakam nereden geliyor",
          p: [
            "Bir CBAM sertifikası, aynı ton CO₂ için bir Avrupalı üreticinin ödediğine denk gelecek şekilde fiyatlanır. Bu çıpa EU ETS'tir: Komisyon, açık artırmalarda EU ETS tahsisatlarının ortalama takas fiyatını alır ve CBAM sertifika fiyatı olarak yayımlar.",
            "2026'da bu ortalama üç ayda bir hesaplanıyor. 2027'den itibaren haftalık ortalamaya geçiyor; bu da ithalat maliyetinin üç ay boyunca sabit durmak yerine karbon piyasasıyla birlikte hareket etmesi demek.",
          ],
        },
        {
          h: "Üç aylıktan haftalığa — bu değişim neden önemli",
          p: [
            "Üç aylık fiyatlamada alıcı ton başına karbon maliyetini üç ay önceden bilir ve sözleşmeye yazabilir. Haftalık fiyatlamada bilemez ve bu oynaklığı bir yere itmeye başlar — genellikle farkı tedarikçiye geçiren bir CBAM maddesine ya da doğrulanmış düşük emisyonu sayesinde oynaklığı mutlak olarak küçük kalan tedarikçilere yönelerek.",
            "İki tepki de aynı şeyi ödüllendiriyor. Bir ihracatçının özgül gömülü emisyonu rakip ihracatçının yarısıysa, her fiyat hareketi o ihracatçıdan alırken AB'li ithalatçıya yarı yarıya daha ucuza gelir.",
          ],
        },
        {
          h: "Fiyatın söylemedikleri",
          p: [
            "Sertifika fiyatı maliyetin yalnızca bir terimidir. Sertifika sayısı diğeridir ve ihracatçının kontrol ettiği terim odur. Sertifikalar sayılmadan önce hesap, bir Avrupalı üreticinin alacağı ücretsiz tahsisatı ve ihracatçının kendi ülkesinde hâlihazırda ödediği karbon fiyatını düşer.",
            "Yani yükselen sertifika fiyatı ile düşen ücretsiz tahsisat oranı aynı şeyi çarpar: ihracatçının ton başına emisyonunu. Üzerinde çalışmaya değer terim odur ve gerçekten ihracatçının elinde olan tek terim de odur.",
          ],
        },
      ],
      faq: [
        {
          q: "2026'da CBAM sertifika fiyatı nedir?",
          a: "2026 1. çeyrek için ton CO₂e başına €75,36 ve 2. çeyrek için €75,28. 3. çeyrek 5 Ekim 2026'da, 4. çeyrek 4 Ocak 2027'de duyurulacak.",
        },
        {
          q: "CBAM sertifikalarını kim öder?",
          a: "AB'li ithalatçı, authorized CBAM declarant sıfatıyla. Maliyet genellikle fiyat müzakeresi ya da tedarik sözleşmesindeki bir CBAM maddesi üzerinden ihracatçıya ulaşır.",
        },
        {
          q: "AB dışı ihracatçı olarak CBAM sertifikası alabilir miyim?",
          a: "Hayır. Sertifikalar Common Central Platform üzerinden yalnızca authorized CBAM declarant'lara satılır. Satış, 2026 ithalatı için Şubat 2027'de açılır.",
        },
        {
          q: "Fiyat yükselmeye devam eder mi?",
          a: "EU ETS açık artırma piyasasını izler, yani bir takvime göre değil piyasayla birlikte hareket eder. Takvimi olan şey, her yıl azalıp 2034'te sıfırlanan ücretsiz tahsisat oranıdır — bu, sertifika fiyatı sabit kalsa bile efektif maliyeti yükseltir.",
        },
      ],
    },

    "cbam-cost-formula": {
      title: "CBAM maliyet formülü, terim terim",
      dek: "CBAM maliyeti = sertifika fiyatı × (toplam gömülü emisyon − ücretsiz tahsisat − menşe ülkede ödenmiş karbon fiyatı). Bu terimlerden yalnızca biri ihracatçının oynatabileceği terimdir.",
      metaTitle: "CBAM maliyeti nasıl hesaplanır: formülün terim terim açıklaması",
      metaDescription:
        "CBAM maliyet denklemi sade bir dille — sertifika fiyatı, toplam gömülü emisyon, EU ETS ücretsiz tahsisatı (Benchmark × Free Allocation Rate × Cross-sectoral Correction Factor) ve menşe ülkede ödenmiş karbon fiyatı indirimi.",
      topic: "Maliyet",
      keyFacts: [
        { label: "Formül", value: "Sertifika fiyatı × (Gömülü emisyon − Ücretsiz tahsisat − Ödenmiş karbon fiyatı)" },
        { label: "Ücretsiz tahsisat", value: "Benchmark × Free Allocation Rate × Cross-sectoral Correction Factor" },
        { label: "2026 ücretsiz tahsisat oranı", value: "%97,5; 2034'te %0'a iniyor" },
        { label: "Cross-sectoral Correction Factor", value: "Komisyon yayımlar; genellikle 1" },
        { label: "Menşe karbon fiyatı", value: "Yalnızca fiilen ödenmiş ve doğrulanabilirse indirilir" },
        { label: "İhracatçının kontrol ettiği terim", value: "Ton başına gömülü emisyon" },
      ],
      sections: [
        {
          h: "Denklem",
          p: ["Özüne indirildiğinde, AB'li ithalatçının ihracatçının bir ton malı için taşıdığı maliyet şudur:"],
          note: "CBAM maliyeti = CBAM sertifika fiyatı (€/tCO₂e) × [ toplam gömülü emisyon (tCO₂) − EU ETS ücretsiz tahsisatı (tCO₂) − menşe ülkede ödenmiş karbon fiyatı (tCO₂) ]",
        },
        {
          h: "Terim 1 — sertifika fiyatı",
          p: [
            "Avrupa Komisyonu EU ETS açık artırma fiyatlarından belirler: 2026 1. çeyrek €75,36, 2. çeyrek €75,28; 2026 boyunca üç aylık, 2027'den itibaren haftalık. Tedarik zincirinde kimse bunu etkileyemez.",
          ],
        },
        {
          h: "Terim 2 — toplam gömülü emisyon",
          p: [
            "Bir ton malın içindeki sera gazları. Bu, ihracatçının tesisinden gelen rakamdır ve denklemde ihracatçının değiştirebileceği tek terimdir.",
            "Ya gerçek değer olur — ölçülmüş, izlenmiş ve akredite bir doğrulayıcı tarafından doğrulanmış — ya da AB'nin yayımladığı varsayılan değer. Gerçek değerler neredeyse her zaman daha düşüktür, çünkü varsayılanlar tasarım gereği yüksek emisyonlu tesislerden belirlenir.",
          ],
        },
        {
          h: "Terim 3 — ücretsiz tahsisat",
          p: [
            "Avrupalı üreticiler her ton için tam ETS fiyatını ödemez; bir kısmını ücretsiz tahsisat olarak alırlar. CBAM bunun karşılığını düşer, böylece ithalatçı yerli üreticinin efektif ödediğinden fazlasına muhatap olmaz. Şöyle hesaplanır:",
          ],
          list: [
            "Benchmark — AB'nin o mal için referans değeri; ürüne ve gerçek/varsayılan değer kullanımına göre değişir",
            "Free Allocation Rate — 2026'da %97,5, her yıl azalarak 2034'te %0",
            "Cross-sectoral Correction Factor — Komisyon yayımlar, genellikle 1'e eşittir",
          ],
          note: "Ücretsiz tahsisat oranı yayımlanmış bir takvimle her yıl düştüğü için, sertifika fiyatı hiç hareket etmese bile aynı emisyon rakamı her yıl daha pahalıya gelir. Mekanizmanın tamamında en öngörülebilir baskı bu takvimdir.",
        },
        {
          h: "Terim 4 — menşe ülkede ödenmiş karbon fiyatı",
          p: [
            "İhracatçı kendi ülkesinde gerçekten bir karbon fiyatı ödediyse — karbon vergisi ya da bir emisyon ticaret sistemi — bu tutar düşülebilir; böylece aynı ton iki kez ücretlendirilmez.",
            "İki koşul sıkı bağlar. Yasalaşmış değil fiilen ödenmiş olmalı ve doğrulanabilir olmalı. Kâğıt üzerinde var olan bir sistem ya da ihracatçının muaf tutulduğu bir harç hiçbir şey düşürmez.",
          ],
        },
        {
          h: "Formülün strateji hakkında söyledikleri",
          p: [
            "Dört terimden üçü Brüksel'de kararlaştırılır. Sertifika fiyatı ihracatçının işlem yapmadığı bir piyasayı, ücretsiz tahsisat oranı hiçbir ihracatçının itiraz edemeyeceği bir takvimi izler ve menşe karbon indirimi ihracatçıdan çok ihracatçı ülkenin hükümetine bağlıdır.",
            "Dördüncü terim ise ihracatçının fırını, şebeke bileşimi, üretim rotası ve ön maddeleridir — ve geri kalan her şeyle çarpılır. Ton başına gömülü emisyonu düşürmek ya da tesisin zaten ulaştığı daha düşük rakamı kanıtlamak, bir ihracatçının elindeki stratejinin tamamıdır.",
          ],
        },
      ],
      faq: [
        {
          q: "CBAM maliyeti nasıl hesaplanır?",
          a: "CBAM sertifika fiyatını, EU ETS ücretsiz tahsisatı ve menşe ülkede ödenmiş karbon fiyatı düşüldükten sonra malların gömülü emisyonuyla çarpın.",
        },
        {
          q: "2026 için ücretsiz tahsisat oranı nedir?",
          a: "%97,5. Yayımlanmış takvime göre her yıl düşer — 2027'de %95, 2028'de %90, 2029'da %77,5, 2030'da %51,5, 2031'de %39, 2032'de %26,5, 2033'te %14 ve 2034'ten itibaren %0.",
        },
        {
          q: "Türkiye'deki karbon fiyatı düşülebilir mi?",
          a: "Yalnızca o emisyonlar için fiilen bir karbon fiyatı ödendiği ve bu doğrulanabildiği ölçüde. Gönüllü bir sistem, bir muafiyet ya da yürürlüğe girmemiş bir yasa hiçbir indirim sağlamaz.",
        },
        {
          q: "Daha düşük bir emisyon rakamı maliyeti orantılı azaltır mı?",
          a: "Aynı indirim yapısı içinde büyük ölçüde evet — emisyon terimi sertifika fiyatıyla çarpıldığı için, ton başına doğrulanmış emisyonu yarıya indirmek o tonun taşıdığı sertifika maliyetini kabaca yarıya indirir.",
        },
      ],
    },

    "cbam-free-allocation-phase-down": {
      title: "CBAM factor: ücretsiz tahsisat %97,5'ten sıfıra",
      dek: "CBAM maliyetinden düşülen ücretsiz EU ETS tahsisat payı her yıl azalıyor — 2026'da %97,5, 2030'da %51,5, 2033'te %14 ve 2034'ten itibaren hiç. Sertifika fiyatı hareket etsin etmesin ihracatçının karbon maliyeti bu takvime göre yükseliyor.",
      metaTitle: "CBAM factor ve ücretsiz tahsisatın kaldırılması 2026–2034: tam takvim",
      metaDescription:
        "CBAM factor, CBAM maliyetinden ne kadar EU ETS ücretsiz tahsisatı düşüleceğini belirler. Yayımlanmış takvim 2026'da %97,5'ten 2034'te %0'a iner — sözleşme ve karbonsuzlaşma planlayan ihracatçılar için ne anlama geldiği.",
      topic: "Maliyet",
      keyFacts: [
        { label: "CBAM factor nedir", value: "Yıl bazında hâlâ düşülen ücretsiz EU ETS tahsisat payı" },
        { label: "2026", value: "%97,5" },
        { label: "2030", value: "%51,5" },
        { label: "2033", value: "%14" },
        { label: "2034 ve sonrası", value: "%0 — ücretsiz tahsisat tamamen bitiyor" },
        { label: "Hukuki dayanak", value: "Directive (EU) 2023/959, Madde 10a" },
      ],
      sections: [
        {
          h: "Yayımlanmış takvim",
          table: {
            head: ["Yıl", "Ücretsiz tahsisat / CBAM factor"],
            rows: [
              ["2026", "%97,5"],
              ["2027", "%95"],
              ["2028", "%90"],
              ["2029", "%77,5"],
              ["2030", "%51,5"],
              ["2031", "%39"],
              ["2032", "%26,5"],
              ["2033", "%14"],
              ["2034 ve sonrası", "%0"],
            ],
          },
        },
        {
          h: "Gerçekte ne yapıyor",
          p: [
            "CBAM, ithalatçıdan gömülü emisyonun her tonu için ücret almaz. Önce bir Avrupalı üreticinin EU ETS kapsamında ücretsiz alacağı miktarı düşer, böylece iki taraf eşit muamele görür. CBAM factor, belirli bir yılda bu ücretsiz tahsisatın hâlâ düşülmekte olan oranıdır.",
            "AB kendi sanayisinden ücretsiz tahsisatı çekerken, aynı hızda ithalattan da eşdeğer indirimi çeker. 2034'e gelindiğinde iki tarafta da ücretsiz tahsisat kalmaz ve ithal mallar tam karbon fiyatını taşır.",
          ],
        },
        {
          h: "Eğriye bakın, sona değil",
          p: [
            "Tehlikeli şekil ortada. 2029 ile 2031 arasında faktör %77,5'ten %39'a düşer — iki yılda kabaca yarıya iner. 2026'da CBAM'i rahatça soğuran bir marj, tamamen aynı emisyon rakamı ve aynı sertifika fiyatıyla 2030'da soğuramayabilir.",
            "CBAM'in gerçekten öngörülebilir olan kısmı budur; dolayısıyla uyum takviminden çok beş yıllık plana ait bir kısımdır. Bugün imzalanıp 2029'a uzanan sözleşmeler artışı kimin taşıyacağını yazmalıdır.",
          ],
          note: "Pratik test: ihracatçı mevcut maliyet riskini %51,5 faktörle hesaplamalı. Bu, bugünkü emisyonlarla 2030 demektir. Sonuç ticari bir kararı değiştiriyorsa, o karar o yılın değil bu yılın planına aittir.",
        },
        {
          h: "İki kaldıraç ve her birinin değeri",
          list: [
            "Emisyonu düşürmek — faktörün uygulandığı terimi kısar. Her yıl bileşik etki yapar ve faktör düştükçe daha da değerlenir.",
            "Varsayılan yerine doğrulanmış gerçek veri kullanmak — genellikle daha büyük ve daha hızlı kazanç, çünkü varsayılan değerler tasarım gereği cezalandırıcıdır ve doğrulanmış bir rakama geçmek hiç yatırım harcaması gerektirmez.",
          ],
          p: [
            "Çoğu ihracatçının ikinci kaldıracı hemen elinin altındadır ve hiç çekmemiştir. Emisyonlar zaten AB varsayılanından düşüktür; eksik olan, doğru bir rakamı kabul edilen bir rakama çeviren izleme, kanıt ve doğrulamadır.",
          ],
        },
      ],
      faq: [
        {
          q: "CBAM factor nedir?",
          a: "CBAM maliyeti hesaplanırken hâlâ düşülen EU ETS ücretsiz tahsisat oranıdır. 2026'da %97,5'tir ve her yıl azalarak 2034'te %0 olur.",
        },
        {
          q: "Ücretsiz tahsisat tamamen ne zaman bitiyor?",
          a: "2034'te. O yıldan itibaren kapsamdaki ithal mallar hiçbir ücretsiz tahsisat indirimi olmaksızın tam karbon fiyatını taşır.",
        },
        {
          q: "Bu kademeli azalma ihracatçıyı mı yoksa yalnızca ithalatçıyı mı etkiler?",
          a: "Hukuken ithalatçının faturasını değiştirir. Ticari olarak ihracatçıya ulaşır, çünkü yüksek emisyonlu bir tonu almanın artan maliyeti alıcıları tedarikçi değiştirmeye ya da yeniden pazarlığa iten şeydir.",
        },
      ],
    },

    "cbam-scope-2028-extension": {
      title: "CBAM bugün neyi kapsıyor — ve 2028'de gelecek 180 alt akım ürün",
      dek: "Bugün altı sektör kapsamda. Komisyon, 1 Ocak 2028'den itibaren CBAM'i yüksek çelik veya alüminyum içerikli yaklaşık 180 alt akım imalat ürününe genişletmeyi önerdi — cıvata, tekerlek, radyatör, boru, yapısal bileşenler.",
      metaTitle: "CBAM kapsamı 2026 ve 2028 alt akım genişlemesi: sektörler, CN Code'lar ve 180 yeni ürün",
      metaDescription:
        "CBAM'in kesin döneminde hangi malları kapsadığı ve ortalama %79 çelik veya alüminyum içerikli yaklaşık 180 alt akım ürüne yönelik 2028 genişleme önerisi. Üreticilerin şimdi ne yapması gerektiği.",
      topic: "Kapsam",
      keyFacts: [
        { label: "1 Oca 2026'dan beri kapsamdaki sektörler", value: "Demir-çelik, alüminyum, çimento, gübre, hidrojen, elektrik" },
        { label: "Önerilen genişleme tarihi", value: "1 Ocak 2028" },
        { label: "Eklenecek ürünler", value: "≈ 180 alt akım ürün" },
        { label: "Ortalama çelik veya alüminyum içeriği", value: "≈ %79" },
        { label: "Kapsam neyle tanımlanıyor", value: "CN Code — bazı çimento ürünlerinde 10 haneli TARIC Code" },
      ],
      sections: [
        {
          h: "Bugünkü kapsam",
          p: [
            "Kesin dönemin 1 Ocak 2026'da başlamasından bu yana, altı sektörde hammadde ve yarı mamul ithal edenler gömülü emisyonları raporlamak ve karşılığında sertifika teslim etmek zorunda:",
          ],
          list: ["Demir ve çelik", "Alüminyum", "Çimento", "Gübre", "Hidrojen", "Elektrik"],
          note: "Kapsam açıklamayla değil gümrük koduyla belirlenir. Bir malın kapsam dışı olduğuna karar vermeden önce kendi ticari faturanızdaki CN Code'u kontrol edin — aynı ürün ailesindeki yakın komşular çoğu zaman sınırın iki tarafında yer alır.",
        },
        {
          h: "Önerilen 2028 genişlemesi",
          p: [
            "Mevcut sınırın bariz bir zayıflığı var: bir çelik rulosunu yakalıyor ama o rulodan yapılan cıvatayı yakalamıyor. Bu, bir işleme adımını AB dışına taşıyıp bitmiş parçayı ithal etmeye açık bir davettir — yani yan kapıdan giren karbon kaçağı.",
            "Bu nedenle Komisyon, CBAM'i 1 Ocak 2028'den itibaren yüksek çelik veya alüminyum payı olan yaklaşık 180 alt akım imalat ürününe genişletmeyi önerdi — içerik olarak ortalama %79 civarında. Adı geçen örnekler:",
          ],
          list: [
            "Cıvata, somun ve vidalar",
            "Tekerlekler ve parçaları",
            "Kapı ve pencereler",
            "Radyatörler",
            "Yapısal bileşenler",
            "Borular ve tüpler",
          ],
        },
        {
          h: "Bu neden daha büyük bir değişim",
          p: [
            "Mevcut altı sektör görece az sayıda büyük tesiste yoğunlaşmıştır. Alt akım imalat böyle değildir: binlerce orta ölçekli imalatçıdan oluşur ve çoğu hiç emisyon rakamı hesaplamamış, kendini karbon yoğun bir sanayi olarak görmemiştir.",
            "Bu firmalar için 2028 genişlemesi bir kademe değişimidir ve yanında ikinci bir sorunla gelir. Alt akım bir ürün karmaşık bir maldır: gömülü emisyonunun büyük kısmı içine giren çelik ya da alüminyumdan devralınır. Yani imalatçının kendi fırını cevabın küçük kısmıdır, büyük kısmı tedarikçilerden toplanmak zorundadır — üst akım sektörlerin şu anda boğuştuğu veri sorununun aynısı.",
          ],
        },
        {
          h: "2028'den önce yapılacaklar",
          list: [
            "İhracatçı kendi CN Code'larını önerilen listeyle karşılaştırmalı, AB'li müşterisininkini de — ihracatçı kapsam dışı olabilir ama parçasının girdiği bitmiş ürün kapsamda olabilir",
            "Tedarikçi emisyon verisini şimdiden, gayriresmî olsa bile kaydetmeye başlayın; 2028 yükümlülüğü 2027 referans verisi ister",
            "İhracatçı yirmi tedarikçiye ihtiyaç duymadan önce bir çelik veya alüminyum tedarikçisini pilot olarak düzgün cevap verir hâle getirmeli",
            "Yeni tedarik sözleşmelerine CBAM maddesi koyun ki veri yükümlülüğü siparişle birlikte zincirde yukarı çıksın",
          ],
        },
      ],
      faq: [
        {
          q: "CBAM hangi sektörleri kapsıyor?",
          a: "CN Code ile tanımlanmak üzere demir-çelik, alüminyum, çimento, gübre, hidrojen ve elektrik.",
        },
        {
          q: "CBAM alt akım ürünlere genişletiliyor mu?",
          a: "Komisyon, 1 Ocak 2028'den itibaren ortalama %79 civarında yüksek çelik veya alüminyum içerikli yaklaşık 180 alt akım imalat ürününe genişletmeyi önerdi.",
        },
        {
          q: "İhracatçı bir ürünün kapsamda olup olmadığını nasıl anlar?",
          a: "Adına göre değil CN Code'una göre. Bazı çimento ürünleri, beyaz ve gri klinkeri ayırt edebilmek için 10 haneli TARIC Code'lara taşındı — sınırın ne kadar ince olabildiğini gösteren bir ayrıntı.",
        },
      ],
    },
    "actual-vs-default-values": {
      title: "Gerçek değerler ile varsayılan değerler — ve varsayılanlar neden pahalı",
      dek: "Gerçek bir emisyon değeri ölçülmeli ve akredite bir doğrulayıcı tarafından doğrulanmalıdır. İhracatçı sağlayamazsa AB'li ithalatçı AB varsayılan değerini kullanmak zorunda kalır — en kötü performanslı tesislerden belirlenen ve üstüne bir de mark-up eklenen değer.",
      metaTitle: "CBAM gerçek değerler ile varsayılan değerler: doğrulama, mark-up ve verisizliğin bedeli",
      metaDescription:
        "CBAM varsayılan değerleri neden tasarım gereği cezalandırıcı, Annex I–IV varsayılan değer yapısı nasıl işliyor, %10/%20/%30 mark-up takvimi ve bir ihracatçının gerçek değer için neye ihtiyacı var.",
      topic: "Veri",
      keyFacts: [
        { label: "Gerçek değer için gerekenler", value: "İzleme, kanıt ve akredite doğrulayıcı doğrulaması" },
        { label: "Gerçek değer yoksa", value: "AB varsayılan değeri uygulanır" },
        { label: "Varsayılanlar nasıl belirlenir", value: "Tasarım gereği yüksek emisyonlu veya en kötü performanslı tesislerden" },
        { label: "Varsayılanlara mark-up", value: "2026 için %10, 2027 için %20, 2028'den itibaren %30" },
        { label: "Mark-up'ı kim uygular", value: "Yayımlanan tablo değil, CBAM Registry" },
        { label: "Varsayılan değer tabloları", value: "Uygulama tüzüğünün Ek I–IV'ü" },
      ],
      sections: [
        {
          h: "İlke",
          p: [
            "CBAM'in beyan edilmiş tercihi net: emisyonlar ölçülmüş, izlenmiş ve doğrulanmış gerçek veri olarak raporlanmalıdır. Varsayılan değerler, bu veri gerçekten elde edilemediğinde başvurulacak yedektir — eşdeğer bir seçenek değil.",
            "Tasarım bu tercihi ısırtıyor. Varsayılan değerler bilerek yüksek emisyonlu tesislerden alınır, dolayısıyla birini kullanmak tarafsız değildir. İhracatçının emisyonunu sistematik olarak abartır ve bu yüzden AB'li ithalatçının alması gereken sertifika sayısını da abartır.",
          ],
          note: "Kural tek cümlede: doğrulanmış veri yoksa varsayılan değer uygulanır ve varsayılan değer, sektörün zaten en kirli üreticileri arasında olmayan herkes için gerçekten daha kötü olacak biçimde tasarlanmıştır.",
        },
        {
          h: "Gerçek değer olarak ne kabul edilir",
          list: [
            "Belgelenmiş bir metodolojiye göre, tanımlı bir sistem sınırı içinde izlenen emisyonlar",
            "Her rakam için birincil kanıtın saklanması — sayaç okumaları, yakıt faturaları ve kalorifik değerler, laboratuvar analizleri, elektrik faturaları",
            "Beyan edilen ve tesisin fiilen çalıştırdığıyla eşleşen bir üretim rotası",
            "CBAM işi için kayıtlı ve tanınan, akredite bir doğrulayıcı tarafından doğrulama",
          ],
          p: [
            "Çoğu ihracatçının takıldığı yer doğrulama şartıdır. Şirket içinde doğru hesaplanmış, her destekleyici belgesi dosyalanmış bir rakam bile, akredite bir üçüncü taraf imzalayana kadar varsayılan değer vakasıdır. Doğrulama, rakama eklenen bir evrak işi değildir — rakamı gerçek değere dönüştüren şeydir.",
          ],
        },
        {
          h: "Varsayılan değerler nereden geliyor",
          p: ["AB varsayılan değerleri, her biri farklı bir durumu kapsayan dört ekte yayımlar:"],
          table: {
            head: ["Ek", "Kapsam"],
            rows: [
              ["ANNEX I", "Elektrik hariç, Birliğin gümrük bölgesine ithal edilen mallar"],
              ["ANNEX II", "Regulation (EU) 2023/956 Ek I'de yer alan ve aynı tüzüğün Ek II'sinde yer almayan malların dolaylı emisyonları"],
              ["ANNEX III", "Birliğin gümrük bölgesine ithal edilen elektrik"],
              ["ANNEX IV", "Üretim ülkesi tespit edilemeyen ön maddeler"],
            ],
          },
        },
        {
          h: "Düzeltilmiş varsayılan değerler ve mark-up",
          p: [
            "AB, varsayılan değerlerini gerçeği daha yakından yansıtacak biçimde revize etti ve bu revizyon bilinmeye değer iki şeyi değiştirdi.",
            "Birincisi, hassasiyet. Bazı ürünler, daha önce tek başlık altında toplanan malların ayrıştırılabilmesi için 8 haneli CN Code'lardan 10 haneli TARIC Code'lara taşındı — örneğin aynı CN Code'u paylaşan ama emisyonları epey farklı olan beyaz klinker ile gri klinker.",
            "İkincisi, sunum. Yayımlanan tablolar artık yalnızca base default values veriyor. Mark-up tabloya önceden hesaplanmıyor; CBAM Registry beyan anında artan bir takvime göre uyguluyor: 2026 için %10, 2027 için %20, 2028'den itibaren %30.",
          ],
          note: "Bu takvim, ücretsiz tahsisatın kademeli azalmasıyla birleşir. 2028'de bir varsayılan değer, ücretsiz tahsisatın yalnızca %90'ının düşüldüğü bir yılda %30 mark-up taşır — doğrulanmış bir rakamla varsayılan bir rakam arasındaki fark her yıl açılır.",
        },
        {
          h: "Örnek hesap",
          p: [
            "Yayımlanmış ANNEX I tablosundan bir demir-çelik satırı alalım. Toplam base default değeri ton başına 1,190 tCO₂e olan bir mal, 2026'da 1,309 (%10 mark-up), 2027'de 1,428 (%20) ve 2028'den itibaren 1,547 (%30) olarak beyan edilir. Fabrikada hiçbir şey değişmedi; rakam yalnızca doğrulanmış bir değer sunulmadığı için %30 arttı.",
            "Tesisin gerçek, doğrulanmış rakamı ton başına 0,9 tCO₂e ise, 2028'e gelindiğinde fark ürün tonu başına 0,647 ton CO₂'dir — yetmişli euro seviyelerindeki bir sertifika fiyatından, sevk edilen her ton için satın alınır.",
          ],
        },
        {
          h: "Pratikte ne anlama geliyor",
          list: [
            "İhracatçının mallarının ve üretim ülkesinin revize varsayılan değer tablolarında görünüp görünmediğini kontrol edin — bazı rotalar değişti",
            "İhracatçının malları için kayıtlı üretim rotasının tesisin fiilen çalıştırdığıyla hâlâ eşleştiğini doğrulayın",
            "Bir sözleşme varsayılan değer alıntılıyorsa hangi yılın mark-up'ını varsaydığını kontrol edin",
            "Doğrulamayı bir formalite değil, bir tedarik süresi olarak görün — ihracatçının gerçek rakamını AB'li ithalatçının kullanabileceği bir rakama çeviren adım odur",
          ],
        },
      ],
      faq: [
        {
          q: "CBAM'de gerçek değer ile varsayılan değer arasındaki fark nedir?",
          a: "Gerçek değer, ihracatçının tesis düzeyinde ölçülmüş, izlenmiş ve akredite bir doğrulayıcı tarafından bağımsız olarak doğrulanmış emisyon rakamıdır. Varsayılan değer, doğrulanmış gerçek değer olmadığında ithalatçının başvurduğu, bilerek yüksek belirlenmiş bir AB tahminidir.",
        },
        {
          q: "CBAM varsayılan değer mark-up'ı ne kadar?",
          a: "2026 için %10, 2027 için %20 ve 2028'den itibaren %30. Yayımlanan tablolarda yalnızca temel değerler vardır; mark-up'ı beyan sırasında CBAM Registry uygular.",
        },
        {
          q: "Doğrulayıcı olmadan kendi hesabımı kullanabilir miyim?",
          a: "Gerçek değer olarak hayır. Akredite bir doğrulayıcı tarafından doğrulanmadan rakam nitelik kazanmaz ve varsayılan değer uygulanır.",
        },
        {
          q: "Varsayılan değerler her ülke için aynı mı?",
          a: "Hayır. Tablolar ülkeye ve CN Code'a göre ayrılır; revizyon ayrıca daha önce tek kod paylaşan malları ayırmak için bazı ürünleri 10 haneli TARIC Code'lara taşıdı.",
        },
      ],
    },

    "precursors-20-percent-rule": {
      title: "Karmaşık mallar, ön maddeler ve %20 varsayılan değer kuralı",
      dek: "Karmaşık bir malda varsayılan değerler, ön maddelerden gelen toplam gömülü emisyonun en fazla %20'sini karşılayabilir. İhracatçı eşiği aşarsa beyanın tamamı kriteri karşılamaz — ve tüm ana ürüne tam varsayılan değer uygulanır.",
      metaTitle: "CBAM ön maddeleri ve %20 kuralı: karmaşık mallar, tedarik zincirleri ve uçurum kenarı",
      metaDescription:
        "CBAM karmaşık malları ve ön maddeleri nasıl ele alıyor, ön madde emisyonlarında varsayılan değerler için %20 tavanı, aşıldığında ne oluyor ve tedarik zincirinde doğrulanmış ön madde verisi nasıl toplanır.",
      topic: "Veri",
      keyFacts: [
        { label: "Karmaşık mal", value: "Üretiminde kapsamdaki ön madde tüketilen mal" },
        { label: "Ön maddeler için izin verilen varsayılan değer", value: "Toplam gömülü emisyonun en fazla %20'si" },
        { label: "İhracatçı %20'yi aşarsa", value: "Beyan kriteri karşılamaz ve ana mala tam varsayılan değer uygulanır" },
        { label: "İznin amaçlanan kullanımı", value: "Tedarikçi verisi gerçekten elde edilemeyen küçük ön maddeler" },
        { label: "Pratik sonuç", value: "Cevap vermeyen tek bir büyük tedarikçi, tüm ürünün gerçek değerini geçersiz kılabilir" },
      ],
      sections: [
        {
          h: "Karmaşık mal nedir",
          p: [
            "Basit mal, kapsamdaki hiçbir ön madde kullanılmadan üretilir. Karmaşık mal ise biriyle üretilir — çelik kütük sıcak haddelenmiş rulo olur, rulo boru olur ve her adım üstündeki her şeyin gömülü emisyonunu devralır.",
            "Karmaşık bir malda gömülü emisyonlar yalnızca ihracatçının fırınının saldığı değildir. İhracatçının kendi süreç emisyonları artı tedarikçilerden alınıp tüketilen, kapsamdaki her ön maddenin gömülü emisyonudur. Çoğu çelik ve alüminyum tedarik zincirinde devralınan kısım baskındır.",
          ],
        },
        {
          h: "%20 izni ve nasıl kullanılması amaçlandı",
          p: [
            "Tüzük, bir üreticinin her tedarikçiden doğrulanmış rakam alamayabileceğini kabul eder. Bu yüzden ön maddeler için varsayılan değer kullanımına izin verir — malın toplam gömülü emisyonunun %20'sine kadar.",
            "İzin açıkça küçük ön maddeler için tasarlanmıştır: az miktarlı girdiler; zincirde çok yukarıda ya da doğrulanmış veri üretemeyecek kadar küçük tedarikçilerden gelen ve peşine düşme maliyeti kazanılan doğruluğu aşan girdiler. Genel amaçlı bir boşluk doldurucu olarak tasarlanmamıştır.",
          ],
        },
        {
          h: "Uçurum kenarı",
          p: [
            "İhracatçıları şaşırtan kısım burası. %20'yi aşmak, emisyonun %25'inin tahmin, geri kalanının gerçek olduğu anlamına gelmez. Beyanın artık kriteri karşılamadığı ve tüm ana ürüne — ihracatçının düzgün ölçüp doğrulattığı kısımlar dâhil — tam varsayılan değerin uygulandığı anlamına gelir.",
            "Cevap vermeyen büyük bir tedarikçi bu yüzden diğer her şeyde yapılan bir yıllık izlemenin değerini yok edebilir. Bu bir eşik kuralıdır, kayan bir ölçek değil ve kısmi puanı yoktur.",
          ],
          note: "Toplamayı ortalamaya göre değil eşiğe göre tasarlayın. Ön maddeleri toplam gömülü emisyondaki paylarına göre sıralayın ve bu sırayla peşlerine düşün — ürünün tamamının geçip geçmeyeceğine karar veren, en büyük katkıyı yapandır.",
        },
        {
          h: "Bir ön madde kaydında gerçekten ne olmalı",
          list: [
            "Hangi ön madde olduğu, serbest metin bir not olarak değil bir malzeme olarak",
            "İhracatçının bitmiş malının tonu başına tüketilen miktar",
            "Kendi özgül gömülü emisyonu ve bunun gerçek mi varsayılan mı olduğu",
            "Onu üreten tesis ve ülkesi",
            "O rakamın doğrulanıp doğrulanmadığı ve kim tarafından",
          ],
          p: [
            "Serbest metin ön madde açıklamaları, bir veri setinin kullanılamamasının en yaygın nedenlerinden biridir. “Yerel fabrikadan kütük” bir cümledir; CBAM'in ihtiyacı çarpılabilen, toplanabilen ve kontrol edilebilen yapılandırılmış bir satırdır.",
          ],
        },
        {
          h: "Zincirde yukarı doğru toplamak",
          p: [
            "Ön maddelerle ilgili en zor şey, ihracatçının tedarikçisinin ihracatçıyla aynı sorunu bir kademe yukarıda yaşaması — ve tedarikçinin onu çözmek için daha az nedeni olması, çünkü Avrupa siparişini kaybedecek olan o değil.",
            "Pratikte üç şey işi yürütür. Tedarikçinin kendi dilinde ve bitirilecek kadar kısa bir formda sorun. Bir kez sorup cevabı yeniden kullanın, böylece ocak ayı için dolduran kişiye şubatta aynı sorular sorulmasın. Ve talebi sözleşmesel hâle getirin ki iyi niyete bağlı kalmak yerine satın alma siparişiyle birlikte yolculuk etsin.",
            "Certrace, bu döngü — sor, takip et, kontrol et, yeniden kullan — bir karbon muhasebesi sorunundan çok bir iş akışı sorunu olduğu ve kendiliğinden bir elektronik tabloda çözülmediği için var.",
          ],
        },
      ],
      faq: [
        {
          q: "CBAM %20 kuralı nedir?",
          a: "Karmaşık bir malda varsayılan değerler, ön maddelerden gelen toplam gömülü emisyonun %20'sinden fazlasını oluşturamaz. Üzerinde beyan kriteri karşılamaz ve tüm ana ürüne tam varsayılan değer uygulanır.",
        },
        {
          q: "Ne ön madde sayılır?",
          a: "İhracatçının malının üretiminde tüketilen, kapsamdaki bir girdi — örneğin alt akım bir çelik ürününe giren pik demir, kütük veya sıcak haddelenmiş rulo.",
        },
        {
          q: "Bir tedarikçi veri vermeyi reddederse ne olur?",
          a: "İhracatçı, o tedarikçinin toplam gömülü emisyondaki payı %20'nin altında kaldığı sürece onu varsayılan bir değerle kapatabilir. Pay büyükse ürünün tamamı varsayılan değerlere düşer.",
        },
        {
          q: "Basit bir mal için ön madde verisi gerekir mi?",
          a: "Hayır. Basit mal kapsamdaki ön madde kullanılmadan üretilir, dolayısıyla devralınacak bir şey ve ihracatçının zincirde üstündeki tedarikçilerden toplayacağı bir veri yoktur.",
        },
      ],
    },

    "cbam-verifier-accreditation": {
      title: "Akredite CBAM doğrulayıcıları: kimler ve sıra neden önemli",
      dek: "İhracatçının emisyon rakamını gerçek değere yalnızca akredite bir doğrulayıcı çevirebilir. Doğrulayıcılar 1 Eylül 2026'dan itibaren EU Login ve CBAM Registry'ye kaydolmaya başladı ve AB dışı ihracatçılardan gelen talep şimdiden arzın önünde.",
      metaTitle: "CBAM doğrulaması: akredite doğrulayıcılar, ulusal akreditasyon kurumları ve süreç",
      metaDescription:
        "CBAM doğrulaması nasıl işliyor — ulusal akreditasyon kurumları üzerinden akreditasyon, üçüncü ülke doğrulayıcıları, izleme planından raporlamaya süreç ve ihracatçıların neden erken yer ayırtması gerektiği.",
      topic: "Doğrulama",
      keyFacts: [
        { label: "Doğrulayıcı kaydı açıldı", value: "1 Eylül 2026" },
        { label: "Akredite eden", value: "AB'deki ulusal akreditasyon kurumları (NAB'lar)" },
        { label: "Üçüncü ülke doğrulayıcıları", value: "Birçok NAB, AB dışında yerleşik doğrulayıcılardan başvuru kabul ediyor" },
        { label: "Platform", value: "EU Login ile CBAM Registry" },
        { label: "CBAM neyi doğrular", value: "Üretim süreçleri ve ön maddeler dâhil, ürün düzeyinde gömülü emisyonlar" },
        { label: "EU ETS neyi doğrular", value: "AB içindeki tesis düzeyinde emisyonlar" },
      ],
      sections: [
        {
          h: "Doğrulama neden kapı",
          p: [
            "CBAM'de AB'li ithalatçıya para kazandıran her şey doğrulamadan geçer. İhracatçının doğrulanmamış bir ölçümü hiç rakam yokmuş gibi işlem görür ve varsayılan değer uygulanır. İyi izleme için kısmi puan yoktur.",
            "Bu da doğrulayıcı kapasitesini, tedarik zincirindeki diğer girdiler gibi bir girdiye çevirir — bir tedarik süresi, bir sıra ve herkes aynı anda istediğinde yükselen bir fiyatla.",
          ],
        },
        {
          h: "Akreditasyon nasıl işliyor",
          p: [
            "Doğrulayıcılar AB'deki ulusal akreditasyon kurumları tarafından akredite edilir. 1 Eylül 2026'dan itibaren CBAM işi yapmak isteyen doğrulayıcılar bir EU Login hesabı açıyor, CBAM Registry'ye kaydoluyor ve bir ulusal akreditasyon kurumuna akreditasyon başvurusu yapıyor.",
            "İhracatçılar açısından kritik nokta: birçok ulusal kurum AB dışında yerleşik doğrulayıcılardan başvuru kabul ediyor; böylece doğrulama kapasitesi yalnızca Avrupa'da değil, doğrulanacak tesislerin yakınında da bulunuyor. Yol şöyle işliyor: doğrulayıcı başvurur → ulusal akreditasyon kurumu değerlendirir → akredite doğrulayıcı, CBAM Registry üzerinden çalışır.",
          ],
        },
        {
          h: "Bir doğrulama gerçekte neleri içerir",
          list: [
            "İzleme planı validasyonu — metodoloji sağlam mı; yıl ölçüldükten sonra değil, önce",
            "Risk değerlendirmesi — bu tesis en çok nerede yanlış yapmaya yatkın",
            "Saha ziyaretleri — tesisin ve ölçüm noktalarının gerçek denetimi",
            "Raporlama — beyan sahibinin dayandığı doğrulama raporu ve görüşü",
          ],
          p: [
            "Bu sürecin ortasına iki teknik soru hâkimdir: bir yanlış beyanın önem kazanması için ne kadar büyük olması gerektiğini belirleyen önemlilik eşikleri ve bir tesisin kayıtları eksik olduğunda doğrulayıcının neyi kabul edeceğini belirleyen veri boşlukları. İkisi de yayımlanmış ölçütlere göre verilen takdir kararlarıdır ve ikisi de altta yatan kanıt hâlihazırda düzenliyse daha iyi sonuçlanır.",
          ],
        },
        {
          h: "CBAM doğrulaması EU ETS doğrulaması değildir",
          p: [
            "ETS deneyimli bir doğrulayıcının aynı yaklaşımı uygulayabileceği yaygın ve pahalı bir varsayımdır. İkisi neye baktıkları bakımından ayrışır.",
            "EU ETS, AB içinde tesis düzeyinde emisyonları doğrular. CBAM ise üçüncü ülkelerdeki tesisler için ürün düzeyinde gömülü emisyonları doğrular — bu da doğrulayıcının sahanın toplam baca emisyonunu değil, belirli bir üretim sürecinin sınırını ve ona giren ön maddeleri takip etmesi demektir.",
          ],
        },
        {
          h: "Neden erken davranmalı",
          p: [
            "Talep sinyali şimdiden net: AB dışı ihracatçıların doğrulamaya ihtiyacı var, akredite doğrulayıcı sayısı sınırlı ve 30 Eylül 2027'deki ilk CBAM beyan tarihi talebi 2027'nin ilk yarısındaki dar bir pencereye sıkıştırıyor.",
            "2026'nın 4. çeyreğinde ya da 2027'nin 1. çeyreğinde anlaşılan bir doğrulayıcının, yıl kapanmadan ihracatçının izleme planını valide edecek vakti olur — bir sorunu bulmanın en ucuz anı budur. 2027 ortasında anlaşılan bir doğrulayıcıdan ise, hakkında hiç söz sahibi olmadığı kayıtlara dayanarak, arkasında sert bir tarihle kapanmış bir yılı denetlemesi istenir.",
          ],
          note: "DG TAXUD rehberliği gidişat konusunda açık sözlü: erken akredite olan doğrulayıcılar daha hazır olacak ve küresel pazarda müşterilere hizmet vermede avantajlı konumda bulunacak. İhracatçı tarafından okunduğunda bu, sıra hakkında bir uyarıdır.",
        },
      ],
      faq: [
        {
          q: "CBAM emisyon verisini kim doğrulayabilir?",
          a: "Yalnızca AB'deki bir ulusal akreditasyon kurumu tarafından akredite edilmiş ve CBAM Registry'ye kayıtlı bir doğrulayıcı. AB dışında yerleşik doğrulayıcılar da akredite olabilir.",
        },
        {
          q: "CBAM doğrulayıcı akreditasyonu ne zaman açıldı?",
          a: "1 Eylül 2026'da; doğrulayıcılar EU Login hesabı açıp CBAM Registry'ye kaydolmaya o tarihte başladı.",
        },
        {
          q: "CBAM doğrulaması EU ETS'ten nasıl farklı?",
          a: "EU ETS, AB içinde tesis düzeyinde emisyonları doğrular. CBAM, üçüncü ülke tesislerinde ürün düzeyinde gömülü emisyonları, üretim süreçlerini ve ön maddeleri takip ederek doğrular.",
        },
        {
          q: "Doğrulama ne kadar sürer?",
          a: "Tesise bağlıdır, ama bunu bir formalite değil tedarik süresi olan bir kalem olarak planlayın — izleme planı validasyonu, risk değerlendirmesi, saha ziyareti ve raporlama ayrı adımlardır ve 2027 tarihine doğru kapasite sınırlıdır.",
        },
      ],
    },

    "cbam-cost-thai-steel": {
      title: "CBAM bir çelik ihracatçısına ton başına gerçekte neye mal oluyor",
      dek: "Ton CO₂ başına €75 ve çelik tonu başına 3 tCO₂'de karbon maliyeti ton başına yaklaşık 9.000 baht — 25.000 bahtlık bir çelik fiyatının yaklaşık %36'sı. Emisyonu yarıya indirin, 4.500 bahta yani yaklaşık %16'ya düşer.",
      metaTitle: "Çelik tonu başına CBAM maliyeti: 3,0 ve 1,5 tCO₂/t için örnek hesap",
      metaDescription:
        "Çelik ihracatçıları için örnek bir CBAM maliyet hesabı — iki emisyon yoğunluğunda ton başına karbon maliyeti, yurt içi çelik fiyatlarıyla karşılaştırma ve rekabet gücü açısından çıkarımlar.",
      topic: "Maliyet",
      keyFacts: [
        { label: "Varsayılan CBAM fiyatı", value: "€75 / tCO₂ ≈ 3.000 baht (~40 baht/€ ile)" },
        { label: "Yüksek yoğunluk senaryosu", value: "SEE 3,0 tCO₂/t → çelik tonu başına 9.000 baht" },
        { label: "25.000 bahtlık çelik fiyatındaki payı", value: "≈ %36" },
        { label: "Düşük yoğunluk senaryosu", value: "SEE 1,5 tCO₂/t → ton başına 4.500 baht" },
        { label: "28.000 bahtlık çelik fiyatındaki payı", value: "≈ %16" },
        { label: "Bu rakam nedir", value: "Benchmark, ücretsiz tahsisat ve CBAM factor öncesi brüt karbon riski" },
      ],
      sections: [
        {
          h: "Aritmetik",
          p: [
            "Hesap bilerek basit: ürün tonu başına karbon maliyeti = CBAM sertifika fiyatı × özgül gömülü emisyon.",
            "Ton CO₂ başına €75'lik bir sertifika fiyatında — euro başına 40 baht civarındaki bir kurla yaklaşık 3.000 baht — sonuç şöyle çıkıyor.",
          ],
          table: {
            head: ["", "Yüksek yoğunluk", "Düşük yoğunluk"],
            rows: [
              ["Özgül gömülü emisyon", "3,0 tCO₂ / t çelik", "1,5 tCO₂ / t çelik"],
              ["Karbon maliyeti", "9.000 baht / t", "4.500 baht / t"],
              ["Referans çelik fiyatı", "≈ 25.000 baht / t", "≈ 28.000 baht / t"],
              ["Karbonla birlikte teslim maliyeti", "34.000 baht / t", "32.500 baht / t"],
              ["Karbonun çelik fiyatındaki payı", "≈ %36", "≈ %16"],
            ],
          },
        },
        {
          h: "Bu karşılaştırma gerçekte ne söylüyor",
          p: [
            "Çelik tonu başına üç ton CO₂'de karbon, ürünün değerinin yaklaşık üçte biridir. Bu, bir idari bütçede soğurulacak bir uyum gideri değildir — malın kendisinin rekabetçi konumunda bir değişikliktir.",
            "Asıl ilginç olan ikinci sütun. Emisyon yoğunluğunu yarıya indirmek toplam teslim maliyetini yarıya indirmez, ama karbonu fiyatın kabaca üçte birinden kabaca altıda birine taşır. Fiziksel olarak aynı çeliği satan iki tesis, aynı Avrupalı alıcıya artık kayda değer biçimde farklı teslim maliyetleri veriyor.",
          ],
        },
        {
          h: "Kayıtları doğru okuyun",
          p: [
            "Bu rakamlar brüt karbon riskidir. CBAM benchmark'ını, ücretsiz tahsisatı veya CBAM factor'ü bilerek düşmezler ve ülkede hâlihazırda ödenmiş bir karbon fiyatını da düşmezler.",
            "Bu indirimler uygulandığında rakam, ücretsiz tahsisat oranının %97,5 olduğu 2026'da düşer. %51,5'lik 2030'da çok daha az düşer, 2034'ten itibaren ise hiç düşmez. Yani brüt rakamı bunun gittiği yer, net rakamı ise bugün bulunduğu yer olarak okuyun.",
          ],
          note: "Burada kullanılan kur yaklaşık 1 euro = 40 baht. Hem sertifika fiyatı hem kur hareket eder; yüksek yoğunluklu bir tesisle düşük yoğunluklu bir tesis arasındaki oran etmez.",
        },
        {
          h: "Cevabı değiştirmenin iki yolu",
          list: [
            "Emisyonu azaltmak — BF-BOF yerine EAF rotası, daha temiz elektrik, daha iyi süreç verimliliği. Gerçek, yavaş ve sermaye yoğun; ve tek kalıcı çözüm.",
            "Tesisin zaten sahip olduğu emisyonu kanıtlamak — izleme, kanıt, doğrulama. Hızlı, kıyasla ucuz ve çoğu ihracatçı için daha büyük ani tasarruf, çünkü alternatif ihracatçının gerçek rakamı değil cezalandırıcı bir varsayılan değerdir.",
          ],
          p: [
            "Çoğu tesis ton başına üç tonda değildir. Ama doğrulanmış veri olmadan alıcının kullanabileceği rakam bu değildir — ve varsayılan, tam da gurur okşamayacak biçimde seçilmiştir.",
          ],
        },
      ],
      faq: [
        {
          q: "CBAM çelik tonu başına ne kadar tutuyor?",
          a: "Ton CO₂ başına €75'te, 3,0 tCO₂/t'de çelik tonu başına yaklaşık 9.000 baht veya 1,5 tCO₂/t'de 4.500 baht — tipik bir çelik fiyatının sırasıyla yaklaşık %36'sı ve %16'sı.",
        },
        {
          q: "Nihai maliyet bu mu?",
          a: "Hayır. Bu, CBAM benchmark'ı, ücretsiz tahsisat, CBAM factor ve menşe ülkede ödenmiş karbon fiyatı düşülmeden önceki brüt karbon riskidir. Bu indirimler her yıl küçülüp 2034'te sıfırlanır.",
        },
        {
          q: "Gerçekte kim ödüyor?",
          a: "Sertifikaları AB'li ithalatçı alır. Pratikte maliyet satın alma fiyatına geri pazarlık edilir ya da siparişin daha düşük emisyonlu bir tedarikçiye gitmesinin nedeni olur.",
        },
      ],
    },

    "cbam-vs-uk-us": {
      title: "EU CBAM, UK CBAM ve ABD önerileri karşılaştırması",
      dek: "AB, Ocak 2026'da başlayan bir sertifika sistemi işletiyor. Birleşik Krallık Ocak 2027'de vergi temelli bir mekanizmaya başlıyor. ABD'de iki kanun tasarısı var. Araçlar farklı, talep ortak: doğrulanabilir bir ürün karbon ayak izi.",
      metaTitle: "EU CBAM vs UK CBAM vs US CCA ve PROVE IT: sınırda karbon önlemleri karşılaştırması",
      metaDescription:
        "Sınırda karbon önlemlerinin karşılaştırması — EU CBAM sertifikaları, 2027'den itibaren vergi temelli UK CBAM, ABD'nin Clean Competition Act ve PROVE IT Act tasarıları, ayrıca Kanada, Tayvan ve Avustralya.",
      topic: "Küresel",
      keyFacts: [
        { label: "EU CBAM", value: "1 Ocak 2026'dan beri kesin dönem; sertifika alımı ve teslimi" },
        { label: "UK CBAM", value: "1 Ocak 2027'de başlıyor; vergi temelli, HMRC yönetiminde" },
        { label: "UK kayıt eşiği", value: "Yılda 50.000 £ kapsamdaki ithalat" },
        { label: "ABD", value: "Clean Competition Act ve PROVE IT Act — ikisi de tasarı" },
        { label: "Kanada", value: "Sınırda karbon düzenlemeleri değerlendiriliyor; 2030'a kadar 170 CAD/tCO₂e karbon fiyatı hedefi" },
        { label: "Ortak payda", value: "Güvenilir, doğrulanabilir bir ürün karbon ayak izi" },
      ],
      sections: [
        {
          h: "Yan yana",
          table: {
            head: ["", "EU CBAM", "UK CBAM", "US CCA (taslak)"],
            rows: [
              ["Başlangıç", "2026", "2027", "Değerlendirme aşamasında"],
              ["Araç", "Sertifika al ve teslim et", "Karbon ithalat vergisi (Tax Rate)", "Benchmark'a göre sınır ücreti"],
              ["Yürüten kurum", "Avrupa Komisyonu / ulusal otoriteler", "HMRC", "ABD Gümrük / Hazine (öneri)"],
              ["Emisyon kapsamı", "Doğrudan (Scope 1) + dolaylı (Scope 2)", "Doğrudan + dolaylı", "Scope 1, 2 ve kısmen Scope 3"],
              ["Doğrulama", "Akredite üçüncü taraf doğrulaması zorunlu", "Doğrulanmış gerçek veri veya devlet varsayılan değerleri", "Kurum standartlarına göre"],
            ],
          },
        },
        {
          h: "EU CBAM",
          p: [
            "2023–2025 geçiş döneminin ardından 1 Ocak 2026'dan beri kesin döneminde. Altı sektör kapsamda, alt akım ürünler 2028 için değerlendiriliyor. İthalatçılar gömülü emisyona karşılık sertifika alıp teslim ediyor; fiyat EU ETS üç aylık ortalamalarını referans alıyor ve haftalığa geçiyor. Menşede ödenmiş karbon düşülebiliyor. Scope 1 ve bazı mallarda Scope 2'nin akredite bir doğrulayıcı tarafından doğrulanması gerekiyor. 2026 için ilk beyan: 30 Eylül 2027.",
          ],
        },
        {
          h: "UK CBAM",
          p: [
            "1 Ocak 2027'de başlıyor ve beş sektörü kapsıyor — demir-çelik, alüminyum, çimento, gübre ve hidrojen. Cam ve seramik ilk kapsamdan çıkarıldı.",
            "Araç bir sertifika piyasası değil vergi: HMRC tarafından yönetilen, UK ETS ile Carbon Price Support'u birlikte referans alan üç aylık bir CBAM oranıyla hesaplanan bir karbon ithalat vergisi. Yılda 50.000 £ kapsamdaki ithalat için bir kayıt eşiği var ve ithalatçılar doğrulanmış gerçek veriyi ya da devletin belirlediği varsayılan değerleri kullanabiliyor.",
          ],
        },
        {
          h: "Amerika Birleşik Devletleri",
          p: [
            "İkisi de yasalaşmamış iki tasarı. Clean Competition Act, bir ithalatın karbon yoğunluğunu bir ABD referansıyla karşılaştırarak ve ithalat daha yüksekse aradaki farkı tahsil ederek bir sınır karbon ücreti getirecek. PROVE IT Act ise önce altyapı veriyi kuracak: ABD malları ile ticaret ortaklarının malları için ürün düzeyinde karbon yoğunluğunun karşılaştırmalı bir çalışması; gelecekteki herhangi bir önlemin olgusal temeli olarak.",
          ],
        },
        {
          h: "Diğer ülkeler",
          list: [
            "Kanada — sınırda karbon düzenlemeleri değerlendiriliyor; yurt içi karbon fiyatı 2030'a doğru 170 CAD/tCO₂e'ye yükseliyor",
            "Tayvan — yurt içi karbon ücreti başladı, sınırda düzenleme mekanizmaları inceleniyor",
            "Avustralya — Safeguard Mechanism'i gözden geçiriyor ve ihracatçılarını bu rejimlere hazırlıyor",
          ],
        },
        {
          h: "İhracatçı için önemli olan nokta",
          p: [
            "Araçlar farklı — burada sertifika, orada vergi, başka yerde bir benchmark'a göre ücret — ve bu fark, uyum sağlamak zorunda olan ithalatçı için son derece önemli. Veriyi sağlayan ihracatçı için çok daha az önemli.",
            "Bu rejimlerin her biri mallara aynı soruyu soruyor: bu ürünün birim başına doğrulanmış karbon ayak izi, güvenilir birinin arkasında duracağı bir standarda göre nedir? Bunu bir kez kuran ihracatçı hepsine cevap vermiş olur. Tek seferlik bir AB uyum alıştırması olarak kuran ihracatçı ise 2027'de Birleşik Krallık için, sonra ABD ne çıkarırsa onun için yeniden kurar.",
          ],
          note: "Ürün düzeyinde karbon verisini evrak işi değil altyapı olarak ele almaya değmesinin nedeni budur. Düzenlemeler biçim değiştirmeye devam edecek; hepsinin istediği alttaki veri seti değişmiyor.",
        },
      ],
      faq: [
        {
          q: "UK CBAM ne zaman başlıyor?",
          a: "1 Ocak 2027. Demir-çelik, alüminyum, çimento, gübre ve hidrojeni kapsıyor ve bir sertifika piyasası değil, HMRC tarafından yönetilen bir vergi olarak işliyor.",
        },
        {
          q: "UK CBAM, EU CBAM'den nasıl farklı?",
          a: "AB, ithalatçıların teslim ettiği sertifikalar satar; Birleşik Krallık üç aylık bir oranla karbon ithalat vergisi alır. Ayrıca Birleşik Krallık'ta AB'de olmayan 50.000 £'luk bir kayıt eşiği var.",
        },
        {
          q: "ABD'nin bir CBAM'i var mı?",
          a: "Henüz yok. Clean Competition Act ve PROVE IT Act tasarı hâlinde — biri sınır karbon ücreti, diğeri bunun dayanağı olacak karşılaştırmalı karbon yoğunluğu verisini öneriyor.",
        },
        {
          q: "Tek bir veri seti hepsini karşılar mı?",
          a: "Düzgün kurulduysa büyük ölçüde evet: belgelenmiş sınırları ve saklanmış kanıtı olan, doğrulanmış ürün düzeyinde bir karbon ayak izi, bugüne kadar duyurulmuş her rejimin ortak gereksinimidir.",
        },
      ],
    },

    "cbam-exporter-action-plan": {
      title: "CBAM'in AB dışı ihracatçı için değiştirdiği beş şey — ve her biri için ne yapmalı",
      dek: "Karbon yoğunluğu bir rekabet unsuru, emisyon verisi bir ticaret koşulu, MRV yinelenen bir maliyet, yurt içi karbon fiyatı bir varlık ve mekanizmayı dolanmak ciddi bir hukuki risk hâline geliyor.",
      metaTitle: "AB dışı ihracatçılar için CBAM: beş etki ve uygulanabilir bir eylem planı",
      metaDescription:
        "CBAM'in AB dışı ihracatçılar için rekabet gücünü, sözleşmeleri, MRV maliyetini, yurt içi karbon fiyatlamasını ve dolanma riskini nasıl yeniden şekillendirdiği — üç somut yanıtla birlikte.",
      topic: "Strateji",
      keyFacts: [
        { label: "Etki 1", value: "Rekabet gücü artık karbon yoğunluğunu izliyor" },
        { label: "Etki 2", value: "Emisyon verisi bir ticaret koşulu hâline geliyor" },
        { label: "Etki 3", value: "MRV ve denetim yinelenen bir maliyet oluyor" },
        { label: "Etki 4", value: "Doğrulanabilir yurt içi karbon fiyatı indirilebiliyor" },
        { label: "Etki 5", value: "Dolanmanın cezası ödenmesi gereken tutarın beş katına çıkabiliyor" },
        { label: "Yanıt", value: "Gerçek emisyon verisi · akredite doğrulama · karbonsuzlaşma planı" },
      ],
      sections: [
        {
          h: "1 — Rekabet karbon yoğunluğuna kayıyor",
          p: [
            "Ton başına daha yüksek CO₂, AB sınırında daha yüksek teslim maliyeti demek ve Avrupalı alıcılar bunu çevresel bir istatistik olarak değil bir fiyat farkı olarak görüyor. Daha düşük karbonlu üretim rotaları — örneğin BF-BOF yerine elektrik ark ocağı — kayda değer biçimde daha düşük CBAM yükü taşıyor ve AB'li ithalatçının ilk tercihi oluyor.",
            "İhracatçı ne yapmalı: ürün hattı bazında emisyon yoğunluğunu ton başına tCO₂e olarak bilmeli ve aynı CN Code için AB varsayılanıyla nasıl karşılaştırıldığını bilmeli. İkisini de söyleyemeyen bir ihracatçı ithalatçıyla fiyat tartışamaz.",
          ],
        },
        {
          h: "2 — Emisyon verisi bir ticaret koşulu oluyor",
          p: [
            "Gerçek veri yoksa AB varsayılanı artı 2026 için %10, sonra %20 ve %30 mark-up demektir. İthalatçılar şimdiden sözleşmelere CBAM maddeleri yazıyor; ürün karbon ayak izinin açıklanmasını şart koşuyor ve veri zamanında teslim edilmezse yeniden fiyatlama veya iptal hakkını saklı tutuyor.",
            "İhracatçı ne yapmalı: imzalamadan önce her yeni AB sözleşmesini CBAM maddesi için okumalı ve içindeki sürenin ihracatçının kendi toplama sürecinin gerçekten yetişebileceği bir süre olduğundan emin olmalı. İhracatçının karşılayamayacağı bir madde, ithalatçıya devredilmiş bir yeniden fiyatlama hakkıdır.",
          ],
        },
        {
          h: "3 — MRV yinelenen bir maliyet oluyor",
          p: [
            "İzleme, raporlama ve doğrulama tek seferlik bir proje değildir. Her yıl ölçüm, kayıt, tedarikçilerden ön madde verisi ve CBAM Registry'ye kayıtlı bir doğrulayıcıdan üçüncü taraf doğrulama raporu gerekir. Bu maliyet tekrarlanır ve kapsam genişledikçe büyür.",
            "Ne yapmalı: yıllık bir telaş yerine tekrarlanabilir aylık bir süreç olarak kurun. MRV maliyetine ne kadarının elle yapıldığı hâkimdir — tedarikçileri e-postayla kovalamak, elektronik tabloları yeniden girmek, aynı raporu her yıl yeniden inşa etmek. Maliyetin gerçekten düştüğü yer bu döngünün otomatikleştirilmesidir.",
          ],
        },
        {
          h: "4 — Yurt içi karbon fiyatı bir varlık oluyor",
          p: [
            "Ülkede fiilen ödenen bir karbon vergisi veya ETS, gerçekten ödenmiş ve doğrulanabilir olması koşuluyla CBAM maliyetinden düşülebilir. Bu, ihracatçı ülkeler için kendi karbon fiyatlamalarını getirmeye doğrudan bir teşviktir — geliri Avrupa'ya göndermek yerine ülkede tutmak.",
            "İhracatçı ne yapmalı: ihracatçı ülkenin hükümetinin ne yaptığını izlemeli ve ödeme kanıtını saklamalı. İndirilebilir bir karbon fiyatı varsa ve ihracatçı ödediğini belgeleyemiyorsa ithalatçı hiçbir indirim alamaz.",
          ],
        },
        {
          h: "5 — Dolanma ciddi bir hukuki risk",
          p: [
            "Dolanmayı önleme kuralları, CN Code'ları yanlış beyan etmeyi veya mekanizmadan kaçmak için malları üçüncü bir ülke üzerinden yönlendirmeyi yasaklar. Dolanma tespit edildiğinde hem ithalatçı hem ihracatçı ağır cezalarla karşılaşır — ödenmesi gereken tutarın beş katına kadar.",
            "Ne yapmalı: hiçbir kurnazlık yok. Doğru sınıflandırın, gerçek üretim rotasını belgeleyin ve yeniden sınıflandırma veya aktarma üzerine kurulu her tavsiyeyi bir tasarruf değil bir yükümlülük olarak görün.",
          ],
          note: "Komisyon, alt akım ürünlere genişlemeyi kısmen tam da bu kapıyı kapatmak için tasarladı. Dolanma stratejilerinin raf ömrü kısa, cezası uzundur.",
        },
        {
          h: "Üç parçalı yanıt",
          list: [
            "Gerçek emisyon verisi kurun — varsayılan değerlere dayanmayı bırakın, AB sistem sınırı içinde ürün birimi başına CO₂'yi doğru hesaplayın ve kanıtı iş ilerledikçe saklayın",
            "Akredite doğrulamaya hazırlanın — doğrulayıcıyla erken anlaşın, yıl kapanmadan izleme planını valide ettirin, tesisi denetletin ve raporu hazır edin",
            "Karbonsuzlaşma yatırımını planlayın — enerji verimliliğini ve malzeme kullanımını iyileştirin, gömülü CO₂'yi azaltın ki CBAM yükü yalnızca belgelenmekle kalmayıp kalıcı olarak düşsün",
          ],
          p: [
            "CBAM yalnızca bir düzenleme değil. Karbonun fiyatlandığı bir çağda ticaretin kendisi ve önce uyum sağlayan ihracatçılar Avrupa pazarını uzun vadede elinde tutanlar olacak.",
          ],
        },
      ],
      faq: [
        {
          q: "Bir ihracatçının CBAM konusunda yapması gereken en önemli tek şey nedir?",
          a: "Ürün bazında doğrulanmış gerçek emisyon verisi üretmek. Diğer her şey — fiyat pazarlığı, sözleşme koşulları, alıcı güveni — bir doğrulayıcının imzaladığı gerçek bir rakama sahip olmaktan doğar.",
        },
        {
          q: "CBAM'i dolanmanın cezası nedir?",
          a: "CN Code'un yanlış beyanı veya aktarma gibi dolanma fiillerinin cezası ödenmesi gereken tutarın beş katına ulaşabilir ve hem ithalatçıya hem ihracatçıya uygulanır.",
        },
        {
          q: "Sırf CBAM için karbonsuzlaşmaya yatırım yapmaya değer mi?",
          a: "CBAM maliyeti emisyonla birlikte düşer ve ücretsiz tahsisat indirimi 2034'te sıfırlanır, dolayısıyla getiri her yıl artar. Ama çoğu ihracatçı için daha hızlı getiri, hâlihazırdaki emisyonlarını doğrulatmaktır; çünkü tek başına bu bile cezalandırıcı bir varsayılan değeri ortadan kaldırır.",
        },
        {
          q: "CBAM'e hazır olmak ne kadar sürer?",
          a: "İzlemenin yapıldığı tam bir raporlama yılı artı doğrulama süresi planlayın. Bir ayın verisi sonradan yeniden oluşturulamaz, dolayısıyla ihracatçının başlangıç tarihi fiilen gerçek değer raporlanabilecek ilk yılı belirler.",
        },
      ],
    },

    /* ═══════════════════════════════════════════════════ 13 */
    "why-cbam-matters": {
      title: "CBAM, AB dışındaki bir ihracatçı için neden önemli — ve Certrace buna nasıl yanıt veriyor",
      dek: "CBAM önemli, çünkü ihracatçının karbon rakamını AB'li alıcının ödediği fiyatın bir parçası haline getiriyor: doğrulanmış veri yoksa alıcı, üzerine ek oran bindirilmiş varsayılan değeri öder ve maliyet 2034'e kadar yayımlanmış bir takvimle yükselir. Certrace bu veriyi ihracatçının tarafında, tedarikçilerden başlayarak üretmek için tasarlandı.",
      metaTitle: "CBAM ihracatçılar için neden önemli (2026) — ve Certrace ihracatçının karbon verisini kanıtlamasına nasıl yardım eder",
      metaDescription:
        "AB'nin CBAM'i AB dışındaki ihracatçılar için neden ticari bir sorun, görmezden gelmenin ton başına maliyeti ne, asıl zorluk nerede — ve Certrace, ihracatçının karbon verisini doğrulamaya hazır hale getirmek için neyi yapıyor, neyi yapmıyor.",
      topic: "Strateji",
      keyFacts: [
        { label: "Neden önemli", value: "Ton başına karbon artık AB sınırındaki teslim maliyetinin bir parçası" },
        { label: "Doğrulanmış veri yoksa", value: "AB varsayılan değeri + %10 (2026), %20 (2027), 2028'den itibaren %30 ek oran" },
        { label: "Yerleşik maliyet baskısı", value: "Ücretsiz tahsisat 2026'da %97,5'ten 2034'te %0'a iner" },
        { label: "İlk bağlayıcı tarih", value: "30 Eylül 2027 — 2026 ithalatı için beyan ve sertifika teslimi" },
        { label: "İhracatçının kontrol ettiği terim", value: "Ton başına doğrulanmış gömülü emisyon" },
        { label: "Certrace ne yapar", value: "Tedarikçi verisini toplar, CBAM hesabını yapar, doğrulamaya hazır rapor paketini güncel tutar" },
        { label: "Certrace ne yapmaz", value: "Beyanı sunmaz, akredite doğrulayıcının yerini almaz" },
      ],
      sections: [
        {
          h: "CBAM neden önemli: karbon artık fiyatın parçası",
          p: [
            "1 Ocak 2026'dan bu yana çelik, alüminyum, çimento, gübre, hidrojen veya elektrik ithal eden AB'li ithalatçı, ithal ettiği her tona gömülü emisyonlar için CBAM sertifikası satın almak zorunda. Komisyon sertifika fiyatını 2026'nın 1. çeyreği için ton CO₂e başına 75,36 €, 2. çeyreği için 75,28 € olarak yayımladı.",
            "Yasal yükümlülük AB'li ithalatçıdadır. Veri ise orada değildir. Fırının ne yaktığını, şebekenin ne sağladığını ve ürüne hangi ön maddelerin girdiğini yalnızca ihracatçı bilir — dolayısıyla ithalatçının karbon faturası ihracatçının rakamlarıyla belirlenir. Bu yüzden CBAM bir vergiden çok bir ticaret koşulu olarak okunmalıdır: ihracatçının Avrupa'ya satmasını engellemez, Avrupa'nın hangi ihracatçıdan almayı tercih edeceğini değiştirir.",
          ],
        },
        {
          h: "Beklenemeyecek dört neden",
          list: [
            "Veri sonradan yeniden üretilemez. Mart 2026'nın sayaç okuması ya Mart 2026'da vardır ya da hiç yoktur ve akredite bir doğrulayıcı hafızadan yeniden kurulmuş bir rakamı kabul etmez. 2026 ithalatı 30 Eylül 2027'de beyan edilir, ama arkasındaki kanıt şu anda üretiliyor — ya da kayboluyor.",
            "Varsayılan değerler cezalandırıcıdır ve her yıl kötüleşir. Doğrulanmış gerçek değer yoksa AB'li ithalatçı, bilerek yüksek emisyonlu tesislerden belirlenmiş AB varsayılan değerini kullanmak zorundadır — üstüne 2026 için %10, 2027 için %20 ve 2028'den itibaren %30 ek oran eklenir.",
            "Düşülen pay bir takvimle küçülür. Ücretsiz tahsisat 2026'da %97,5, 2030'da %51,5 ve 2034'ten itibaren sıfırdır. Sertifika fiyatı hiç değişmese bile aynı emisyon rakamı her yıl daha pahalıya gelir.",
            "Kapsam genişliyor. Komisyon 1 Ocak 2028'den itibaren yaklaşık 180 aşağı akış çelik ve alüminyum ürününün eklenmesini önerdi ve Birleşik Krallık kendi CBAM'ini 1 Ocak 2027'de başlatıyor. Bu rejimlerin hepsi aynı şeyi istiyor: doğrulanabilir bir ürün karbon ayak izi.",
          ],
        },
        {
          h: "Hiçbir şey yapmamanın maliyeti",
          p: [
            "Yayımlanmış Annex I tablosundan, temel varsayılan değeri ton başına 1,190 tCO₂e olan bir Tayland demir-çelik ürününü ele alalım. Doğrulanmış veri yoksa AB'li ithalatçı ürünü ek oranlı varsayılan değerle beyan eder. Tesisin gerçek, doğrulanmış rakamı ton başına 0,9 tCO₂e ise fark şöyle görünür:",
          ],
          table: {
            head: ["Yıl", "Ek oranlı varsayılan", "Doğrulanmış gerçek değer", "Alıcının ton başına fazladan ödediği CO₂"],
            rows: [
              ["2026", "1,309 tCO₂e/t (+%10)", "0,9 tCO₂e/t", "0,409 t"],
              ["2027", "1,428 tCO₂e/t (+%20)", "0,9 tCO₂e/t", "0,528 t"],
              ["2028 ve sonrası", "1,547 tCO₂e/t (+%30)", "0,9 tCO₂e/t", "0,647 t"],
            ],
          },
          note: "Satırlar arasında fabrikada hiçbir şey değişmedi. Rakam, kimse doğrulanmış bir değer sunmadığı için yükseldi — ve yetmişlerin ortasındaki euro sertifika fiyatlarıyla AB'li ithalatçı bu farkı sevk edilen her ton için öder. Bu seçimle karşılaşan bir alıcı, doğrulanmış rakamı bu farkı ortadan kaldıran ihracatçıyı tercih eder.",
        },
        {
          h: "Asıl zorluk nerede",
          p: [
            "CBAM formülü tek satıra sığar. CBAM'i ihracatçı için zorlaştıran, ihracatçının kontrol ettiği tek terimin arkasındaki iş akışıdır:",
          ],
          list: [
            "Ön madde verisi zincirin yukarısındaki tedarikçilerdedir; her biri kendi biçiminde yanıt verir ve Avrupa siparişini kaybedecek olan ihracatçıdan daha az ilgilenmek için nedenleri vardır",
            "Karmaşık bir mal için varsayılan değerler, ön maddelerden gelen toplam gömülü emisyonların en fazla %20'sini karşılayabilir — yanıt vermeyen büyük bir tedarikçi tüm ürünü varsayılan değere geri itebilir",
            "Kanıt her ay, her tesis ve her ürün hattı için toplanmalı ve akredite bir doğrulayıcının kabul edeceği biçimde saklanmalıdır",
            "Doğrulayıcı kapasitesi sınırlıdır ve ilk beyan talebi 2027'nin ilk yarısına yığar",
            "AB'li ithalatçı sonucu AB'nin biçiminde, 2027'den itibaren üç aylık bir ritimle ister — yıl sonunda bir tablo olarak değil",
          ],
        },
        {
          h: "Certrace her parçaya nasıl yanıt veriyor",
          p: [
            "Certrace, bu döngünün ihracatçının tarafında döndüğü çalışma alanıdır — tedarikçinin ilk yanıtından, AB'li ithalatçının ve doğrulayıcının aldığı pakete kadar.",
          ],
          table: {
            head: ["Sorun", "Certrace ne yapar"],
            rows: [
              ["Yanıt vermeyen, her biri kendi biçimini kullanan tedarikçiler", "Smart Link — her tedarikçiye tek bir rehberli bağlantı; Tayca veya İngilizce, her cihazda, hesap gerekmeden ve otomatik hatırlatmalarla"],
              ["Her ay aynı soruların sorulması", "Bir kez doldurulan tedarikçi profili — yanıtlar kaydedilir ve ürünler, dönemler ve alıcılar arasında bir sonraki talepte önceden doldurulur"],
              ["Eksik alanlar, yanlış birimler, imkânsız rakamlar", "Tedarikçi gönderdiği anda otomatik kalite kontrolü ve sade bir özet; yapay zekâ sorunları işaretler, hiçbir rakamı düzenlemez"],
              ["%20 ön madde kuralı ve hesap", "Kesin dönem kurallarının — %20 varsayılan değer sınırı dahil — yerleşik olduğu CBAM hesaplama motoru; her rakamda hesap izi"],
              ["Maruziyetin nerede olduğunu bilmemek", "Ürün hattı bazında varsayılan değerlere karşı karbon kıyaslaması — hangi hatların en çok maliyet taşıdığı ve bir iyileştirmenin ne değerde olduğu"],
              ["Alıcı ya da doğrulayıcı kanıt istiyor", "Her zaman hazır rapor paketi — metodoloji, kanıt sicili, isimli onaylar ve denetim iziyle yaklaşık 24 sayfalık iletişim ve denetim paketi, SHA-256 ile mühürlü, yanında Annex IV XML"],
            ],
          },
        },
        {
          h: "Alıcı için değil, ihracatçı için tasarlandı",
          p: [
            "Bu alandaki karbon platformlarının çoğunu AB'li ithalatçı satın alır ve ihracatçıyı peşine düşülecek bir veri kaynağı olarak görür. Certrace masanın öbür tarafında oturur: tedarikçiler, veri ve kanıt ihracatçıya aittir ve aynı veri seti, her biri için yeniden kurulmadan soran her alıcıya yanıt verebilir.",
            "Bunun önemi AB'nin ötesine geçer. Birleşik Krallık ve ardından gelecek diğerleri de aynı doğrulanmış ürün ayak izini isteyecek. Bunu bir kez altyapı olarak kuran ihracatçı hepsine yanıt vermiş olur; tek seferlik bir beyan olarak kuran ihracatçı ise yeniden kurmak zorunda kalır.",
          ],
        },
        {
          h: "Certrace'in yapmadıkları",
          list: [
            "CBAM beyanını sunmak. Registry'ye yalnızca AB'li ithalatçının authorized CBAM declarant'ı beyan sunabilir; Certrace o beyan sahibine eksiksiz bir veri seti, Annex IV şablonunu ve denetim paketini verir",
            "Akredite doğrulayıcının yerini almak. Doğrulamayı yine bağımsız bir doğrulayıcı yapar; Certrace izleme kanıtını düzenler, böylece doğrulama daha az sorun bulur ve daha hızlı ilerler",
            "Tesisin emisyonlarını kendi başına düşürmek. Karbonsuzlaşma tesisin işidir; Certrace'in ortadan kaldırdığı, kanıtlanmamış bir rakamın maliyetidir — varsayılan değer ile gerçek arasındaki fark",
            "Henüz her sektörü kapsamak. Bugün 67 CN kodlu ürünle demir, çelik ve alüminyum için AB CBAM'ini destekliyor; UK CBAM yol haritasında",
          ],
          note: "Bunu açıkça söylemek meselenin ta kendisi. Bir uyum sitesinde, beyan sahibinin ya da doğrulayıcının işini yaptığını iddia eden bir araç, denetimde kalacak bir araçtır.",
        },
        {
          h: "Bir ihracatçı nereden başlamalı",
          list: [
            "AB'ye gönderilen her ürünün CN kodunu kontrol edin — kapsamı ürün adı değil gümrük kodu belirler",
            "Ön madde tedarikçilerini listeleyin ve gömülü emisyondaki paylarına göre sıralayın; en büyüğü ürünün %20 kuralını geçip geçmeyeceğini belirler",
            "Aylık toplamaya şimdi başlayın; doğrulayıcı istediğinde 2026'nın tam bir yıllık kanıtı hazır olsun",
            "İzleme planı hâlâ ucuza düzeltilebilirken, 2026'nın 4. çeyreğinde veya 2027'nin 1. çeyreğinde akredite bir doğrulayıcıyla çalışmaya başlayın",
            "Tedarikçi döngüsünü bir e-posta kutusundan bir platforma taşıyın — Certrace tam olarak bu yükü ihracatçının masasından almak için tasarlandı",
          ],
        },
      ],
      faq: [
        {
          q: "CBAM, AB dışındaki ihracatçılar için neden önemli?",
          a: "Çünkü AB'li ithalatçı, ihracatçının sattığı ürünlere gömülü emisyonlar için ödeme yapar ve ihracatçıdan doğrulanmış veri gelmezse ek oranlı varsayılan değeri kullanmak zorundadır. Ton başına karbon fiyatın bir parçası olur ve alıcılar daha düşük bir rakamı kanıtlayabilen ihracatçılara yönelir.",
        },
        {
          q: "Certrace akredite doğrulayıcının yerini alır mı?",
          a: "Hayır. Rakamların gerçek değer sayılması için yine akredite bir doğrulayıcı tarafından doğrulanması gerekir. Certrace kanıtı toplar ve düzenler; böylece doğrulama daha hızlı olur ve daha az sorun bulur.",
        },
        {
          q: "Certrace bir ihracatçının CBAM beyanını sunabilir mi?",
          a: "Hayır, hiçbir sağlayıcı sunamaz. Yalnızca AB'li ithalatçının authorized CBAM declarant'ı beyan sunabilir. Certrace o beyan sahibine veri setini, Annex IV şablonunu ve mühürlü denetim paketini verir.",
        },
        {
          q: "Certrace bugün hangi ürünleri destekliyor?",
          a: "Kesin dönem kuralları altında 67 CN kodlu ürünü kapsayan demir, çelik ve alüminyum için AB CBAM'i. UK CBAM yol haritasında.",
        },
        {
          q: "İhracatçının tedarikçilerinin Certrace için hesap açması ya da ücret ödemesi gerekir mi?",
          a: "Hayır. Her tedarikçi tek bir Smart Link alır — her cihazda Tayca veya İngilizce rehberli bir form, hesap ve ücret yok — ve yanıtları kaydedilir, böylece bir sonraki talep önceden doldurulur.",
        },
      ],
    },

    /* ═══════════════════════════════════════════════════ 14 */
    "cbam-supplier-data-request": {
      title: "Müşteri CBAM verisi istedi — bir tedarikçi ne yapmalı",
      dek: "Talep geliyor, çünkü ihracatçının AB'li alıcısı ürüne giren her şeye gömülü emisyonların bedelini ödüyor — tedarikçinin malzemesi de dahil. Tedarikçinin AB'ye karşı bir yükümlülüğü yok, ama kanıtı olan gerçek rakamlarla yanıt vermek, ihracatçının — ve siparişin — pahalı bir varsayılan değer yerine gerçek değer kullanabilmesini sağlayan şeydir.",
      metaTitle: "CBAM veri talebi mi aldınız? Tedarikçi rehberi: ne gönderilmeli ve neden (2026)",
      metaDescription:
        "Bir ihracatçı tedarikçisinden neden CBAM emisyon verisi istiyor, tedarikçinin yanıt vermesi zorunlu mu, tam olarak ne gönderilmeli, hangi kanıt saklanmalı ve rakamlar henüz yoksa ne yapılmalı.",
      topic: "Veri",
      keyFacts: [
        { label: "Talep neden geliyor", value: "İhracatçı, gerçek değer beyan etmek için ön maddelerin gömülü emisyonlarına ihtiyaç duyar" },
        { label: "Tedarikçinin yasal yükümlülüğü", value: "CBAM kapsamında yok — yükümlülük AB'li ithalatçıdadır" },
        { label: "Ticari gerçek", value: "Tedarikçinin rakamı olmadan ürün AB varsayılan değerine düşebilir" },
        { label: "Arkasındaki kural", value: "Varsayılan değerler, karmaşık bir malın ön maddelerden gelen gömülü emisyonlarının en fazla %20'sini karşılayabilir" },
        { label: "Ne gönderilmeli", value: "Malzeme, miktar, ton başına gömülü emisyon, tesis, ülke, kanıt, doğrulama durumu" },
        { label: "Ne gönderilmemeli", value: "Kimsenin ölçmediği bir rakam — akredite doğrulayıcı kabul etmez" },
      ],
      sections: [
        {
          h: "Talep neden tedarikçiye ulaştı",
          p: [
            "1 Ocak 2026'dan bu yana çelik, alüminyum ve diğer CBAM mallarını ithal eden AB'li ithalatçı, ithal edilen her tona gömülü emisyonlar için sertifika satın alıyor. Bu emisyonlar yalnızca ihracatçının kendi tesisinin saldıklarını değil, ihracatçının satın alıp kullandığı kapsamdaki malzemelere gömülü her şeyi içerir — çubuktaki kütük, borudaki rulo.",
            "Bu malzemelere ön madde denir ve emisyon verileri tedarikçidedir. İhracatçı tedarikçinin fırınını ölçemez, bu yüzden sormak zorundadır. Çoğu çelik ve alüminyum üründe ön maddelerden devralınan kısım toplamın büyük kısmıdır; tedarikçi için yasal bir görev olmasa da ihracatçı için talebin neredeyse hiç isteğe bağlı olmamasının nedeni budur.",
          ],
        },
        {
          h: "Tedarikçi yanıt vermek zorunda mı?",
          p: [
            "CBAM'in kendisine göre hayır. Düzenleme, authorized CBAM declarant olması gereken AB'li ithalatçıyı bağlar; AB dışındaki bir tedarikçiye beyan yükümlülüğü getirmez ve bir tedarikçi asla sertifika satın almaz.",
            "Baskı ticaridir ve serttir. Karmaşık bir mal için varsayılan değerler, ön maddelerden gelen toplam gömülü emisyonların en fazla %20'sini karşılayabilir. Büyük bir tedarikçi yanıt vermezse ihracatçı bu sınırı aşabilir ve o zaman AB varsayılan değerinin tamamı ürünün bütününe uygulanır — ihracatçının doğru ölçtüğü her şey dahil. Yanıt veren tedarikçi ihracatçının ürününü rekabetçi tutar; yanıt vermeyen tedarikçi bir sonraki siparişin yanıt verene gittiğini görebilir.",
          ],
          note: "Talebin sözleşmeye dönüşmesini bekleyin. Bu sitedeki rehberler, veri yükümlülüğünün satın alma siparişiyle birlikte ilerlemesi için ihracatçılara tedarik sözleşmelerine bir CBAM maddesi eklemelerini öneriyor. Yanıtı bir kez hazırlayan tedarikçi, o madde geldiğinde hazırdır.",
        },
        {
          h: "İhracatçı neler isteyecek",
          p: [
            "Kullanılabilir bir ön madde kaydı yapılandırılmış veridir, bir cümle değil. \"Kendi tesisimizden kütük\" çarpılamaz, kontrol edilemez; ihracatçının ihtiyacı şunlardır:",
          ],
          list: [
            "Hangi malzeme olduğu — tanımlı bir ürün olarak, tercihen CN koduyla",
            "Dönem içinde teslim edilen miktar, ton olarak",
            "Ton başına tCO₂e cinsinden gömülü emisyonu ve bu rakamın gerçek değer mi varsayılan değer mi olduğu",
            "Onu üreten tesis ve ülke",
            "Üretim rotası — çelik için örneğin elektrik ark ocağı (EAF) ya da yüksek fırın (BF-BOF) rotası",
            "Rakamın doğrulanıp doğrulanmadığı ve kim tarafından",
          ],
        },
        {
          h: "Rakamın arkasında saklanması gereken kanıt",
          p: [
            "CBAM'de gerçek değerler ancak akredite bir doğrulayıcı kontrol ettikten sonra sayılır ve doğrulayıcı güvenceleri değil kanıtı kontrol eder. İhracatçının rakamını doğrulayan kişi, tedarikçinin rakamının arkasında ne olduğunu sorabilir. Ay ay saklayın:",
          ],
          list: [
            "Miktar ve ısıl değerleriyle yakıt faturaları",
            "Gaz, buhar ve diğer enerji girdilerinin sayaç okumaları",
            "Elektrik faturaları",
            "Karbon içeriğinin önemli olduğu malzemelerin laboratuvar analizleri",
            "Üretim kayıtları — ürün ve ay bazında üretilen tonlar",
            "Malzeme test sertifikaları (mill test certificate) veya eşdeğer ürün belgeleri",
          ],
          note: "Kanıt üretildiği anda toplanmalıdır. Mart ayının sayaç okuması ya Mart'ta vardır ya da hiç yoktur ve sonradan hafızadan yeniden kurulan bir rakam, bir doğrulayıcının imzalayacağı bir rakam değildir.",
        },
        {
          h: "Rakamlar henüz yoksa",
          p: [
            "Pek çok tedarikçi daha önce hiç emisyon rakamı hesaplamadı ve bu sessiz kalmak için bir neden değil. İhracatçıya bugün neyin var olduğunu söyleyin ve bir sonraki yanıtın bundan daha iyi olması için aylık izlemeye şimdi başlayın.",
            "Bir tedarikçinin asla yapmaması gereken şey bir rakam uydurmak ya da malzemesini olmadığı bir şey olarak tanımlamaktır. Uydurulmuş bir rakam doğrulamada kalır ve CBAM'den kaçmak için malları yanlış beyan etmek, hem ithalatçı hem ihracatçı için ödenmesi gereken tutarın beş katına kadar cezası olan bir kaçınma olarak değerlendirilir. Dürüst bir \"henüz yok\" yanıtı, ihracatçının o malzeme için %20 sınırı içinde varsayılan değer kullanıp kullanamayacağına karar vermesini sağlar.",
          ],
        },
        {
          h: "İşi ifşa etmeden veri paylaşmak",
          p: [
            "Sık rastlanan bir endişe, yanıt vermenin fiyatları ya da süreçleri müşteriye açacağıdır. Bir CBAM kaydı emisyonlara, miktarlara ve emisyonların kanıtına ihtiyaç duyar — fiyatlara, marjlara ya da müşteri listelerine değil. İhracatçıya veriyi kimin ve ne için göreceğini sorun; makul yanıt ihracatçının ekibi, doğrulayıcısı ve toplu biçimde AB'li ithalatçının declarant'ıdır.",
            "Talep Certrace üzerinden geldiğinde, yalnızca o tedarikçiye özel bir Smart Link olarak gelir: tedarikçi yalnızca kendi formunu görür, diğer tedarikçiler yanıtlarını asla görmez ve her işlem kayda geçer.",
          ],
        },
        {
          h: "Smart Link üzerinden yanıt vermek",
          list: [
            "Tek bir bağlantı; her cihazda açılır, hesap açmak gerekmez, ücret yoktur",
            "Tayca veya İngilizce, yalnızca ürünün gerektirdiğini soran rehberli bir form",
            "Yanıtlar bir profile kaydedilir; gelecek ayın talebi — ya da başka bir ihracatçınınki — önceden doldurulmuş gelir",
            "Eksik alanlar, yanlış birimler ve imkânsız rakamlar, ihracatçı sorularla geri dönmeden önce, gönderim anında işaretlenir",
          ],
          p: [
            "En çok emek ilk yanıttadır. Sonrasında profili güncel tutmak, her müşteriden yeni bir anket yerine her dönem birkaç dakika sürer.",
          ],
        },
      ],
      faq: [
        {
          q: "Bir tedarikçi müşterisine CBAM verisi vermek zorunda mı?",
          a: "Yalnızca AB'li ithalatçıyı bağlayan CBAM mevzuatına göre hayır. Ticari olarak çoğu zaman evet: tedarikçinin rakamı olmadan ihracatçının ürünü ön maddeler için %20 varsayılan değer sınırını aşabilir ve tamamen AB varsayılan değerine düşebilir.",
        },
        {
          q: "Tedarikçi CBAM sertifikaları için ödeme yapmak zorunda kalacak mı?",
          a: "Hayır. Sertifikaları yalnızca authorized CBAM declarant olarak AB'li ithalatçı satın alır ve teslim eder. Maliyet fiyatlar ve sözleşmeler yoluyla tedarik zincirine yansıyabilir, ama hiçbir tedarikçi kendisi sertifika satın almaz.",
        },
        {
          q: "Emisyonlarını hiç ölçmemiş bir tedarikçi ne göndermeli?",
          a: "Elindeki bilgileri — malzeme, miktarlar, tesis, üretim rotası — ve henüz ölçülmüş bir emisyon rakamı olmadığını açıkça belirten bir ifade. Asla ölçüm diye sunulan bir tahmin değil. Ardından aylık izlemeye başlamalı.",
        },
        {
          q: "Tedarikçinin rakamının doğrulanması gerekir mi?",
          a: "Gerçek değer ancak akredite bir doğrulayıcı kontrol ettikten sonra sayılır; bu yüzden ihracatçının rakamı üzerinde çalışan doğrulayıcının, tedarikçinin rakamının arkasındaki kanıtı ya da tedarikçinin tesisinin kendi doğrulaması olup olmadığını sormasını bekleyin.",
        },
        {
          q: "Bir Certrace talebine yanıt vermek için tedarikçinin hesabı olması gerekir mi?",
          a: "Hayır. Smart Link, her cihazda Tayca veya İngilizce rehberli bir form açar; hesap ve ücret yoktur ve yanıtlar kaydedilir, böylece sonraki talepler önceden doldurulmuş gelir.",
        },
      ],
    },

    /* ═══════════════════════════════════════════════════ 15 */
    "how-to-calculate-cbam-emissions": {
      title: "CBAM gömülü emisyonları adım adım nasıl hesaplanır",
      dek: "Ton başına özgül gömülü emisyon = (malın üretimine atfedilen emisyonlar + tüketilen her ön maddeye gömülü emisyonlar) ÷ üretilen ton. Beş adım, ihracatçıyı sayaç okumalarından akredite bir doğrulayıcının imzalayabileceği bir rakama götürür.",
      metaTitle: "CBAM emisyonları nasıl hesaplanır: adım adım SEE, örnekle (2026)",
      metaDescription:
        "İhracatçılar için CBAM gömülü emisyon hesabının uygulamalı anlatımı — sistem sınırı, doğrudan ve dolaylı emisyonlar, ön maddeler ve %20 kuralı, üretime bölme — örnek hesap ve doğrulamadan önce yapılacak kontrollerle.",
      topic: "Veri",
      keyFacts: [
        { label: "Ne hesaplanır", value: "Özgül gömülü emisyon (SEE), malın tonu başına tCO₂e" },
        { label: "Basit mal", value: "Atfedilen emisyonlar ÷ üretilen ton" },
        { label: "Karmaşık mal", value: "(Atfedilen emisyonlar + ön maddelere gömülü emisyonlar) ÷ üretilen ton" },
        { label: "Doğrudan emisyonlar", value: "Sistem sınırı içindeki yakıtlar ve prosesler (Kapsam 1)" },
        { label: "Dolaylı emisyonlar", value: "Tüketilen elektrik (Kapsam 2) — beyan edilen rakama yalnızca bazı mallarda dahil" },
        { label: "Ön maddeler için varsayılan sınırı", value: "Toplam gömülü emisyonların %20'si" },
        { label: "Gerçek değer olduğu an", value: "Yalnızca akredite bir doğrulayıcı doğruladığında" },
      ],
      sections: [
        {
          h: "Bu rakam nedir",
          p: [
            "CBAM bir ton malı özgül gömülü emisyonuna — SEE — göre fiyatlar: o maldan bir ton üretmek için salınan ton CO₂ eşdeğeri. Mal, üretim rotası ve tesis bazında, raporlama dönemi boyunca toplanan verilerden hesaplanır.",
            "Aritmetik kısadır. Emek, altındaki kararlar ve kayıtlardadır; bu yüzden aşağıdaki adımlar formülden daha önemlidir.",
          ],
          note: "Basit mal: SEE = atfedilen emisyonlar ÷ üretim. Karmaşık mal: SEE = (atfedilen emisyonlar + Σ ön madde kütlesi × ön madde SEE'si) ÷ üretim.",
        },
        {
          h: "Adım 1 — Sistem sınırını çizin",
          p: [
            "Hangi proseslerin malın üretimine ait olduğuna karar verin. Sınır o malın üretim prosesidir — tesisin tamamı değil, şirketin tamamı hiç değil. İki üretim rotası işleten ya da aynı ekipmanda kapsam içi ve dışı mallar üreten bir tesis, hangi girdilerin ve emisyonların hangi mala ait olduğunu belirtmek zorundadır.",
          ],
          list: [
            "Fiilen işletilen üretim rotasını adlandırın ve tesisle uyumlu tutun — uyumsuzluk, bir doğrulayıcının ilk kontrol ettiği şeylerden biridir",
            "Sınırı geçen her yakıtı, malzemeyi ve enerji girdisini listeleyin",
            "Paylaşılan altyapı varsa, ürünler arasında nasıl bölündüğünü kaydedin ve bölüşümü aydan aya tutarlı tutun",
          ],
        },
        {
          h: "Adım 2 — Doğrudan emisyonlar",
          p: [
            "Doğrudan emisyonlar prosesin sahada saldıklarıdır: yakılan yakıtlar ve karbonatlar ya da karbon içeren indirgeyiciler gibi malzemelerden kaynaklanan proses emisyonları. Çoğu tesis ölçmek yerine hesaplar — her yakıtın ya da malzemenin miktarı, ısıl değeri ve emisyon faktörüyle çarpılır. Sürekli emisyon izleme sistemi olan bir tesis bunun yerine bacada ölçebilir.",
            "Bu hesaptaki her rakamın arkasında bir kaynak belge olmalıdır: miktar ve ısıl değerli yakıt faturaları, sayaç okumaları ve karbon içeriğinin değiştiği durumlarda laboratuvar analizleri.",
          ],
        },
        {
          h: "Adım 3 — Dolaylı emisyonlar",
          p: [
            "Dolaylı emisyonlar prosesin tükettiği elektrikten gelir: kullanılan megavatsaat, o elektriğin emisyon faktörüyle çarpılır.",
            "Beyan edilen rakama dahil olup olmadıkları mala bağlıdır. Regulation (EU) 2023/956'nın Ek II'si yalnızca doğrudan emisyonların dikkate alındığı malları listeler — demir ve çelik, alüminyum ve hidrojen bunların arasındadır; çimento ve gübre gibi mallarda dolaylı emisyonlar da sayılır. Her iki durumda da elektriği izleyin: fatura doğrulayıcının görmeyi beklediği bir kanıttır, AB varsayılan tabloları dolaylı değerler içerir ve 2027'de başlayan UK CBAM doğrudan ve dolaylı emisyonları sayar.",
          ],
        },
        {
          h: "Adım 4 — Ön maddeleri ekleyin",
          p: [
            "Karmaşık bir mal için, tüketilen her kapsam içi ön maddeye gömülü emisyonları ekleyin: o ön maddeden kullanılan ton, kendi SEE'siyle çarpılır. Bu rakam tedarikçiden gelir — tedarikçi kanıtlayabiliyorsa gerçek değer, değilse varsayılan değer.",
            "Ardından %20 kuralını kontrol edin. Varsayılan değerler, malın ön maddelerden gelen toplam gömülü emisyonlarının en fazla %20'sini karşılayabilir. Bu sınırı aşarsanız beyan kriteri karşılamaz: varsayılan değerin tamamı, doğru ölçülen kısımlar dahil ürünün bütününe uygulanır.",
          ],
        },
        {
          h: "Adım 5 — Üretime bölün",
          p: [
            "Toplamı, aynı sınır içinde ve aynı dönemde üretilen malın tonuna bölün. Üretim rakamının kendi kanıtı olmalıdır — ürün ve ay bazında üretim kayıtları — ve böldüğü emisyonlarla aynı sınırı kullanmalıdır; aksi halde sonuç anlamsızdır.",
          ],
        },
        {
          h: "Örnek bir hesap",
          p: [
            "Varsayımsal bir çelik boru hattı, bir ay boyunca. Rakamlar aritmetiği göstermek için seçilmiş örneklerdir — gerçek bir tesisten ya da bir AB tablosundan alınmamıştır.",
          ],
          table: {
            head: ["Girdi", "Miktar", "Emisyon"],
            rows: [
              ["Üretilen borular (mal)", "1.000 t", "—"],
              ["Tav fırını için doğal gaz (doğrudan)", "Yakıt faturalarından", "120 tCO₂"],
              ["Elektrik (dolaylı)", "400 MWh", "İzleniyor; demir-çelik için eklenmiyor"],
              ["Sıcak haddelenmiş rulo (ön madde)", "1.050 t × 1,8 tCO₂e/t", "1.890 tCO₂e"],
              ["Toplam gömülü emisyon", "", "2.010 tCO₂e"],
              ["Borunun SEE'si", "2.010 ÷ 1.000", "2,01 tCO₂e/t"],
            ],
          },
          note: "Ön madde toplamın %94'ü. Rulo tedarikçisi rakam göndermeseydi, varsayılan değerin ön maddelerden gelen gömülü emisyonların %94'ünü karşılaması gerekirdi — %20 sınırının çok ötesinde — ve borunun tamamı AB varsayılan değerine düşerdi. Tesisin kendi 120 tonu, ne kadar iyi ölçülmüş olursa olsun, onu kurtaramazdı. Tedarikçi verisinin önce gelmesinin nedeni budur.",
        },
        {
          h: "Sonucu doğrulayıcıdan önce kontrol edin",
          list: [
            "Birimler: kilogram ile ton, kilovatsaat ile megavatsaat, tedarikçi verilerindeki en yaygın hatalardır",
            "Sınır: üretim rakamı ve emisyonlar aynı sınırı ve aynı dönemi kullanır",
            "Ön madde payı: varsayılanların karşıladığı kısım %20'nin altında ve pay bırakılmış",
            "Karşılaştırma: sonucu aynı CN kodu için AB varsayılanının yanına koyun — çok üzerindeki bir rakam ikinci bir bakışı hak eder, çok altındakinin kanıtı hazır olmalı",
            "Kanıt: hesaptaki her girdi, bir doğrulayıcının açabileceği bir belgeye işaret eder",
            "Tutarlılık: aydan aya dalgalanmaların açıklanabilir bir nedeni vardır",
          ],
        },
        {
          h: "Certrace nerede devreye girer",
          p: [
            "Certrace bu hesabı ihracatçı için kesin dönem kurallarına göre yapar; %20 varsayılan sınırı yerleşiktir ve her rakama bir hesap izi eklenir. Tedarikçi girdileri Smart Link'lerle toplanır ve geldiği anda kontrol edilir; böylece bir birim hatası doğrulamada değil gönderimde yakalanır. Bugünkü kapsam demir, çelik ve alüminyumdur.",
          ],
        },
      ],
      faq: [
        {
          q: "CBAM'de SEE nedir?",
          a: "Özgül gömülü emisyon (Specific Embedded Emissions): bir ton mal üretmek için salınan ton CO₂ eşdeğeri; karmaşık bir malda tüketilen ön maddelere gömülü emisyonlar da dahil.",
        },
        {
          q: "Demir ve çelik dolaylı emisyonları içerir mi?",
          a: "Beyan edilen rakamda hayır. Regulation (EU) 2023/956'nın Ek II'si demir ve çeliği, alüminyumu ve hidrojeni yalnızca doğrudan emisyonların dikkate alındığı mallar arasında sayar. Elektrik yine de izlenmeli ve kanıtlanmalıdır.",
        },
        {
          q: "Veri ne sıklıkla toplanmalı?",
          a: "Her ay, üretildiği anda. Kanıt sonradan yeniden kurulamaz ve 2027'den itibaren AB'li ithalatçılar sertifika bulundurma kontrollerini karşılamak için üç aylık ritimde rakamlara ihtiyaç duyar.",
        },
        {
          q: "Bir ön madde için varsayılan değer kullanılabilir mi?",
          a: "Evet, varsayılanlar malın ön maddelerden gelen toplam gömülü emisyonlarının %20'sinden fazlasını karşılamadığı sürece. Bunun üzerinde varsayılan değerin tamamı ürünün bütününe uygulanır.",
        },
        {
          q: "Doğru bir hesap gerçek değer sayılmak için yeterli mi?",
          a: "Hayır. Bir rakam ancak akredite bir doğrulayıcı doğruladığında gerçek değer olur. O zamana kadar rakam yokmuş gibi işlem görür ve AB varsayılanı uygulanır.",
        },
      ],
    },
  },
};
