import type { Content } from "./content";

/* Turkish copy for the whole marketing site.

   Typed as `Content` (the shape of `en`), so a missing or renamed key is a
   build error rather than a silent English fallback on a Turkish page.

   Same deliberate English as `th` and `vi`, marked where it sits:
   `marquee.rowTwo` (regulations and standards under their registered titles),
   `howItWorks.steps[].view` / `.lines` (mock console output), and
   `footer.copyright` (the registered entity name).

   Casing note: every all-caps string here is written out in caps rather than
   left to a `toUpperCase()` call, because Turkish "i" uppercases to "İ" and a
   locale-blind call produces "I". Where the UI does the casing itself it now
   uses `toLocaleUpperCase`, and CSS `text-transform` follows `<html lang>`.

   Built by a function taking `en` rather than importing it — see the note in
   content-vi.ts; a value import here would be a real initialisation cycle. */
export function buildTr(en: Content): Content {
  return {
    common: {
      bookDemo: "DEMO AYIRTIN",
      getStarted: "BAŞLAYIN",
      seeHowItWorks: "NASIL ÇALIŞTIĞINI GÖRÜN",
      requestPricing: "FİYAT TALEP EDİN",
      allSolutions: "TÜM ÇÖZÜMLER",
      joinWaitlist: "BEKLEME LİSTESİNE KATILIN",
      live: "YAYINDA",
      soon: "YAKINDA",
      comingSoon: "ÇOK YAKINDA",
      back: "GERİ",
      close: "KAPAT",
    },

    nav: {
      login: "GİRİŞ YAP",
      language: "Dil",
      selectLanguage: "Dil seçin",
      openMenu: "Menüyü aç",
      closeMenu: "Menüyü kapat",
      backToTop: "Certrace — başa dön",
      primary: "Birincil",
      mobile: "Mobil",
      platform: {
        label: "Platform",
        items: [
          {
            label: "Smart Link tedarikçi daveti",
            desc: "Tedarikçi başına tek bağlantı. E-posta yok, hesap yok, kovalamaca yok.",
          },
          {
            label: "Bir kez doldurulan tedarikçi profili",
            desc: "Tedarikçi verisi bir kez kaydedilir, sonraki her talepte kendini doldurur.",
          },
          {
            label: "Otomatik kalite kontrolü",
            desc: "Eksik alanlar, yanlış birimler ve imkânsız sayılar daha gelir gelmez yakalanır.",
          },
          {
            label: "CBAM hesaplama motoru",
            desc: "Ham tedarikçi verisi, AB'nin istediği emisyon formatına dönüşür.",
          },
          {
            label: "Karbon kıyaslama paneli",
            desc: "CBAM ceza oranları karşısında nerede durduğunuz, sade bir dille.",
          },
          {
            label: "Her an hazır rapor paketi",
            desc: "Alıcıya ve denetçiye hazır, AB formatında, yeniden kurmadan güncel kalır.",
          },
        ],
        footer: "Tüm özellikleri görün",
      },
      solutions: {
        label: "Çözümler",
        items: [
          {
            label: "İhracatçılar için",
            desc: "Karbon verinizi alıcı sormak zorunda kalmadan kanıtlayın.",
          },
          {
            label: "Tedarikçiler için",
            desc: "Kendi dilinizde, her cihazdan doldurulan ücretsiz bir form.",
          },
          {
            label: "Hukuk ve uyum için",
            desc: "Adı geçen onaylar ve eksiksiz bir denetim izi.",
          },
          {
            label: "İthalatçılar için",
            desc: "CBAM beyanları için AB tarafındaki beyan sahibi çalışma alanı.",
          },
        ],
        footer: "Certrace kimin için kuruldu",
      },
      regulations: {
        label: "Mevzuat",
        items: [
          {
            label: "AB CBAM",
            desc: "Demir, çelik ve alüminyum — CN kodlu 67 ürün, kesin dönem kuralları içeride.",
          },
        ],
        footer: "Yenilikleri görün",
      },
      pricing: "Fiyatlandırma",
      resources: {
        label: "Kaynaklar",
        items: [
          {
            label: "Nasıl çalışır",
            desc: "Tedarikçi davetinden denetime hazır çıktıya dört adım.",
          },
          {
            label: "Sık sorulanlar",
            desc: "Beyanı aslında kim veriyor, yapay zekâ ne yapıyor, veri nasıl korunuyor.",
          },
          {
            label: "CBAM takvimi",
            desc: "Geçiş döneminden ilk beyana kadar her son tarih.",
          },
          {
            label: "Ürün günlüğü",
            desc: "Yayına aldığımız her şey, en yenisi başta.",
          },
        ],
        footer: "Demo ayırtın",
      },
      company: {
        label: "Şirket",
        items: [
          {
            label: "İletişim",
            desc: "Yardımcı olabileceğimiz her konu — bir merhaba yeter.",
          },
          {
            label: "Certrace hakkında",
            desc: "Kimiz ve bunu neden kurduk. Çok yakında.",
          },
          {
            label: "Kariyer",
            desc: "Ne kurmak istediğinizi yazın. Hepsini okuyoruz.",
          },
        ],
        footer: "Demo ayırtın",
      },
    },

    hero: {
      badge: "KARBON UYUM ALTYAPISI",
      headline: "Alıcılar beklemez.\nÖnce kanıtlayanı\nseçerler.",
      intro:
        "Alıcıları, ihracatçıları ve tedarikçileri birbirine bağlayarak CBAM karbon verisi toplamayı otomatikleştiren bir yapay zekâ iş akışı platformu — talepten, alıcılar sormadan hazır duran rapora kadar.",
      /* Four returns, not four market facts. Measured to two lines in the 140px
         caption box at 390 / 640 / 768 / 1440 — the grid squeezes the box to
         ~118px at 640, and a third line pushes the hero block past the fold on
         a short laptop. Turkish words are long enough that this is tight:
         "Tedarikçi kovalamaya giden saat" ran to three lines at every width and
         "Bugün kapsanan CBAM ürünü" at 640. Don't lengthen without
         re-measuring. */
      stats: [
        "Beyan başına uyum maliyeti",
        "Tedarikçi kovalama saati",
        "Kapsanan CBAM ürünü",
        "Kanıta ulaşmada hız",
      ],
      videoTitle: "Certrace ürün tanıtım videosu",
    },

    problem: {
      badge: "SORUN",
      headline: "Dört adım.\nSiparişi kaybetmek\niçin bu kadarı yeter.",
      intro:
        "Alıcınız doğrulanmış karbon verisi ister. Siz kovalamaya başlarsınız. Bir başkasında zaten hazırdır — yani sipariş reddedilmez. Sadece el değiştirir.",
      chain: [
        {
          step: "TALEP",
          title: "Alıcı sorar",
          desc: "AB'deki ithalatçınız bir sonraki siparişten önce doğrulanmış emisyon verisi istiyor.",
        },
        {
          step: "GECİKME",
          title: "Kovalamaya başlarsınız",
          desc: "Her tedarikçi, teker teker e-posta. Haftalar geçer, veri hâlâ eksiktir.",
        },
        {
          step: "ALTERNATİF",
          title: "Başkasını bulurlar",
          desc: "Başka bir ihracatçının temiz sayıları göndermeye hazır bekliyordur.",
        },
        {
          step: "GEÇİŞ",
          title: "Sipariş el değiştirir",
          desc: "Fiyattan değil. Kaliteden değil. Kanıt yalnızca ikinci sırada geldi.",
        },
      ],
      stakes: {
        riskLabel: "BUNU RİSKE ATMAYA HAZIR MISINIZ?",
        riskTitle: "Bir sipariş, gitti.",
        riskFigure: "$670,000",
        riskCaption: {
          before: "Fiyata değil. Kaliteye değil. ",
          highlight: "Eksik karbon verisine.",
        },
        manualLabel: "BUGÜN ELDE YAPMANIN BEDELİ",
        manual: [
          { lead: "9–15 hafta", rest: "her raporlama yılında elde emek" },
          { lead: "$9K–24K", rest: "yılda harcanır — üstelik çoğu zaman hatalı" },
        ],
      },
    },

    whyNow: {
      badge: "NEDEN ŞİMDİ",
      headline: "CBAM gelmiyor.\nSayaç çoktan işliyor.",
      intro:
        "Ocak 2026'dan beri her sevkiyatın gerçek bir bedeli var — ve yalnızca o an ölçtüğünüzü kanıtlayabilirsiniz.",
      milestones: [
        {
          date: "EKİ 2023",
          label: "Geçiş dönemi başlar",
          desc: "Yalnızca raporlama. Henüz sertifika yok.",
        },
        {
          date: "OCA 2026",
          label: "Kesin dönem başlar",
          desc: "Her sevkiyatta tam yükümlülük.",
        },
        {
          date: "ŞUB 2027",
          label: "Sertifika satışı açılır",
          desc: "İthalatçılar 2026 emisyonları için almaya başlar.",
        },
        {
          date: "EYL 2027",
          label: "İlk yıllık beyanın son tarihi",
          desc: "2026 için beyan verilir ve sertifika teslim edilir.",
        },
      ],
      /* The timer rests on 00:00:00:00, so the wording has to read true against
         zeros — zero is the honest answer to "how much of last month can you
         still go back and measure". */
      countdown: {
        eyebrow: "GERİ DÖNÜŞ YOK",
        title: "Geçen ayın emisyonları artık ölçülemez.",
        units: ["GÜN", "SAAT", "DK", "SN"],
      },
      quote:
        "“Doğrulanmış bir karbon raporu sunamayan ihracatçılar AB pazarına erişimlerini kaybetme riski taşıyor — kalıcı olarak.”",
    },

    live: {
      badge: "PLATFORM YAYINDA",
      headline: "Kanıtınız hazır bekliyor.\nDaha sorulmadan.",
      intro:
        "Her tedarikçi, her gönderim, her son tarih — değiştiği anda görünür. Böylece talep geldiğinde cevap çoktan vardır.",
      suppliersSubmitted: "tedarikçi bu çeyrekte\nverisini gönderdi",
      stats: [
        "24 / 30 tedarikçi onaylandı",
        "%94 veri tamamlandı",
        "Son tarihe 6 gün",
      ],
    },

    platform: {
      badge: "PLATFORM",
      headline: "Altı özellik.\nKopmayan tek bir zincir.",
      intro:
        "Birleştirilecek tablo yok, mutabakat için ikinci bir araç yok. Davet edin, yeniden kullanın, kontrol edin, hesaplayın, kıyaslayın, raporlayın — kanıt daha kimse sormadan bitsin diye kuruldu.",
      modules: [
        {
          label: "01 / SMART LINK TEDARİKÇİ DAVETİ",
          title: "E-posta yok, kovalamaca yok, hesap gerekmez.",
          desc: "Tek bir bağlantı gönderin. Tedarikçiniz yalnızca ürününün gerektirdiğini, kendi dilinde doldurur. Kurulacak bir şey yok, eğitilecek kimse yok.",
          tags: [
            "Tedarikçi başına tek bağlantı",
            "Hesap gerekmez",
            "Kendi dillerinde",
            "Otomatik hatırlatma",
          ],
        },
        {
          label: "02 / BİR KEZ DOLDURULAN PROFİL",
          title: "Tedarikçiler aynı veriyi ikinci kez girmez.",
          desc: "Cevaplar bir kez kaydedilir ve sonraki her talepte kendini doldurur — ürünler, dönemler ve alıcılar arasında. İlki bir öğleden sonra sürer. Sonrakiler dakikalar.",
          tags: [
            "Bir kez kaydedilir",
            "Her yerde yeniden kullanılır",
            "Tüm alıcılarda geçerli",
            "Haftalar değil, dakikalar",
          ],
        },
        {
          label: "03 / OTOMATİK KALİTE KONTROLÜ",
          title: "Bozuk veri size ulaşmadan yakalanır.",
          desc: "Eksik alanlar, yanlış birimler, imkânsız sayılar — tedarikçi gönderdiği anda işaretlenir. Karşınıza bilinmeyenlerle dolu bir tablo değil, sade bir özetle temiz bir gönderim gelir.",
          tags: [
            "Eksik alanlar",
            "Yanlış birimler",
            "İmkânsız değerler",
            "Sade dilde özet",
          ],
        },
        {
          label: "04 / CBAM HESAPLAMA MOTORU",
          title: "Elde hesap yok. Tablo hatası yok.",
          desc: "Ham tedarikçi verisi, kesin dönem kurallarına göre AB'nin istediği emisyon formatına otomatik dönüşür — beyan ettiğiniz her rakama hesap izi iliştirilmiş olarak.",
          tags: [
            "AB emisyon formatı",
            "%20 varsayılan üst sınırı",
            "Kapsam 2 kuralları",
            "Eksiksiz hesap izi",
          ],
        },
        {
          label: "05 / KARBON KIYASLAMA PANELİ",
          title: "Nerede durduğunuzu ve bunun bedelini görün.",
          desc: "Karbon rakamlarınız CBAM ceza oranlarının karşısında, sade bir dille: nerede açıktasınız, hangi ürün hattı geriye çekiyor ve neyi düzeltmeli. Uzmanlık gerekmez.",
          tags: [
            "Ceza oranlarına karşı",
            "Ürün bazında risk",
            "Sade dil",
            "Uzmanlık gerekmez",
          ],
        },
        {
          label: "06 / HER AN HAZIR RAPOR PAKETİ",
          title: "Alıcınız daha sormadan hazır.",
          desc: "Tek tıkla tedarikçi verisi, AB formatında mühürlenmiş, alıcıya ve denetçiye hazır bir rapora dönüşür. Veri değiştikçe güncel kalır, yani hiç yeniden kurmazsınız.",
          tags: [
            "Alıcıya hazır",
            "Denetçiye hazır",
            "Ek IV XML",
            "Güncel kalır",
          ],
        },
      ],
    },

    comparison: {
      badge: "NEDEN CERTRACE",
      headline: "Karbon platformları\nalıcınıza satılır.\nBu sizin.",
      intro:
        "Bu alandaki araçları AB'deki ithalatçı satın alır — siz onların veri topladığı kaynaksınız. Certrace sizin tarafınızda durur: sizin tedarikçileriniz, sizin veriniz, sizin kanıtınız, talep gelmeden hazır.",
      colDiy: "Şirket içinde yürütülen",
      colConsultant: "Danışman / alıcı tarafı aracı",
      rows: [
        {
          label: "Kimin tarafı için kurulmuş",
          diy: "Kimsenin — artan saatlerle yürür",
          consultant: "Alıcının. Siz veri kaynağısınız.",
          certrace: "Sizin. İhracatçının.",
        },
        {
          label: "Raporlama yılı başına süre",
          diy: "9–15 hafta",
          consultant: "6–10 hafta",
          certrace: "Haftalar değil, günler",
        },
        {
          label: "Yıllık maliyet",
          diy: "Görünmeyen iç iş gücü",
          consultant: "$9K–24K, kurumsalda $50K–250K",
          certrace: "İkisinin de küçük bir kesri",
        },
        {
          label: "Tedarikçi verisi",
          diy: "200'den fazla tutarsız format",
          consultant: "Elde, bir kez mutabakat",
          certrace: "Tek form, bir kez doldurulur, yeniden kullanılır",
        },
        {
          label: "Kalite kontrolleri",
          diy: "Elde, kaçırması kolay",
          consultant: "İş işten geçtikten sonra fark edilir",
          certrace: "Veri geldiği anda kontrol edilir",
        },
        {
          label: "Alıcı sorduğunda",
          diy: "Tedarikçi kovalamaya başlarsınız",
          consultant: "Bir sonraki raporu ısmarlarsınız",
          certrace: "Cevap çoktan hazırdır",
        },
        {
          label: "Nerede durduğunuzu bilmek",
          diy: "Hiçbir kıyaslama yok",
          consultant: "Bağlamsız bir rakam",
          certrace: "Ceza oranlarıyla kıyaslanmış",
        },
      ],
    },

    howItWorks: {
      badge: "NASIL ÇALIŞIR",
      headline: "Dört basit adım.\nÖğrenme eğrisi yok.",
      /* `view` and `lines` stay English: mock console output, not prose. */
      steps: en.howItWorks.steps.map((s, i) => ({
        ...s,
        title: ["Oluşturun", "Toplayın", "İnceleyin", "Her an hazır"][i]!,
        desc: [
          "Ürünlerinizi seçin. Mevzuatı sihirbaz halleder.",
          "Tedarikçiler tek bir formu doldurur — o da yalnızca bir kez.",
          "Size neye mal olduğunu ve nerede açıkta olduğunuzu görün.",
          "Rapor, alıcı sormadan önce biter.",
        ][i]!,
      })),
    },

    stakeholders: {
      badge: "KİMLER İÇİN",
      headline: "Tek zincir. Her tarafı.\nSizinkinden başlayarak.",
      intro:
        "Alıcıların, ihracatçıların ve tedarikçilerin paylaştığı tek bir veri seti. İhracatçı ve tedarikçi tarafları bugün yayında — gerisi sırayla açılıyor.",
      audiences: [
        {
          title: "İhracatçılar",
          desc: "Karbon verinizi alıcı sormadan kanıtlayın — toplama, kıyaslama ve her an hazır rapor tek bir çalışma alanında.",
          cta: "İhracatçı çözümünü görün",
        },
        {
          title: "Tedarikçiler",
          desc: "Kendi dilinizde, her cihazda tek bir rehberli form. Hesap yok, ücret yok ve aynı soru asla iki kez sorulmaz.",
          cta: "Tedarikçi çözümünü görün",
        },
        {
          title: "Hukuk ve uyum",
          desc: "Adı geçen bir onay olmadan hiçbir şey dışarı çıkmaz. Her karar denetim izine düşer.",
          cta: "Bekleme listesine katılın",
        },
        {
          title: "İthalatçılar",
          desc: "Doğrulanmış ihracatçı verisini toplayın, sertifikaları hesaplayın ve yıllık beyanı AB tarafından verin.",
          cta: "Bekleme listesine katılın",
        },
      ],
    },

    languages: {
      badge: "DİL DESTEĞİ",
      headline: "Tedarikçi ağınızın gerçekte\nnasıl çalıştığına göre kuruldu.",
      intro:
        "Rehberli formlar ve raporlar, tedarikçilerinizin zaten kullandığı dilde — yenileri de yolda.",
      statusLive: "YAYINDA",
      statusSoon: "ÇOK YAKINDA",
    },

    pricing: {
      badge: "FİYATLANDIRMA",
      headline: "Basit, şeffaf fiyatlandırma.\nİşinizin ölçüsüne göre.",
      intro:
        "Her plan, ilk günden maliyetinden fazlasını kazandıracak şekilde tasarlandı. Tedarikçiler her zaman ücretsiz.",
      introPage:
        "Her plan, ilk günden maliyetinden fazlasını kazandıracak şekilde tasarlandı. Tedarikçiler her planda, her zaman ücretsiz.",
      note: "Fiyat, tedarikçi sayınıza ve uyum gereksinimlerinize göre belirlenir · Yıllık abonelik · Tedarikçiler ve alıcılar her zaman ücretsiz · İlk yıldan sonra istediğiniz an iptal",
      questionsBadge: "SORULAR",
      plans: [
        {
          name: "STARTER",
          sub: "20 tedarikçiye kadar",
          features: [
            "Akıllı talep oluşturucu",
            "Tüm AB alıcılarınızda çalışır",
            "Tayca dil desteği",
            "Canlı panel + hatırlatmalar",
            "Denetime hazır dışa aktarma",
          ],
        },
        {
          name: "STANDARD",
          sub: "50 tedarikçiye kadar",
          features: [
            "Starter'daki her şey",
            "Denetçi portalı için bir kullanıcı",
            "Çoklu mevzuat şablonları",
            "Öncelikli destek + kurulum",
          ],
        },
        {
          name: "ENTERPRISE",
          sub: "50+ tedarikçi",
          features: [
            "Standard'daki her şey",
            "Çoklu tüzel kişi / çoklu tesis desteği",
            "Özel müşteri yöneticisi",
            "Hukuk ağı üzerinden onay erişimi",
          ],
        },
      ],
    },

    faq: {
      badge: "SIK SORULANLAR",
      headline: "Sık gelen sorular.\nDolambaçsız cevaplar.",
      items: [
        {
          q: "Herkes ithalatçıya satıyor. Neden ihracatçı için kurdunuz?",
          a: "Çünkü siparişi kaybeden ihracatçıdır. Alıcı tarafı platformlar sizi kovalanacak bir veri kaynağı sayar; biz verinizi bir sonraki sözleşmeyi kazandıran şey sayarız. Aynı mevzuat, masanın öbür ucu.",
        },
        {
          q: "Certrace CBAM beyanını AB'ye bizim adımıza veriyor mu?",
          a: "Hayır — hiçbir sağlayıcı veremez. Kayıt sistemine yalnızca AB'deki alıcınızın Yetkili CBAM Beyan Sahibi beyan verebilir. Certrace ona gereken her şeyi sunar: Ek IV şablonu, mühürlenmiş bir denetim paketi ve O3CI'ye aktarılan tesis verileriniz.",
        },
        {
          q: "Tedarikçilerimin ödeme yapması veya hesap açması gerekir mi?",
          a: "Hayır. Her tedarikçi tek bir Smart Link alır — Tayca veya İngilizce, her cihazda çalışan rehberli bir form. Hesap yok, ücret yok. Cevapları bir profile kaydedilir, böylece sonraki talep önceden doldurulmuş gelir.",
        },
        {
          q: "Yapay zekâ tam olarak ne yapıyor? Sayılarımızı değiştirebilir mi?",
          a: "İnceler, asla düzenlemez. Yapay zekâ boşlukları, aykırılıkları ve zayıf kanıtları işaretler, sonra bir güven puanı ve sade dilde bir özet yazar; ekibiniz böylece daha hızlı inceler. Beyan edilen her rakam, hesap izi iliştirilmiş halde deterministik hesaplama motorundan gelir.",
        },
        {
          q: "Kıyaslama bana aslında ne söylüyor?",
          a: "Rakamlarınızın CBAM ceza oranları karşısında nerede durduğunu, sade bir dille — hangi ürün hattı en çok risk taşıyor ve bir değişiklik ne kazandırır. Karbon verinizi raporlamakla onunla bir şey yapabilmek arasındaki fark budur.",
        },
        {
          q: "Çıktı gerçekten denetime hazır mı?",
          a: "Evet — yaklaşık 24 sayfalık bir CBAM İletişim ve Denetim Paketi: beyan özeti, metodoloji, tedarikçi başına bir bölüm, kanıt kütüğü, onaylar ve eksiksiz denetim izi, SHA-256 özetiyle mühürlenmiş. Ek IV XML de yanında gelir.",
        },
        {
          q: "Certrace bugün hangi mevzuatı destekliyor?",
          a: "AB CBAM, yalnızca AB CBAM — demir, çelik ve alüminyum, 67 gerçek CN kodlu ürün ve içine işlenmiş kesin dönem kurallarıyla. Birleşik Krallık CBAM, EUDR ve CSRD yol haritasında; dördünü yarım yapmaktansa bir mevzuatı düzgün yapmayı tercih ederiz.",
        },
        {
          q: "Kurallar değiştiğinde ne oluyor?",
          a: "Formları, motor kurallarını ve dışa aktarma şablonlarını merkezî olarak güncelliyoruz — 2026 kesin dönem kuralları hâlihazırda kodlanmış durumda. Siz hiçbir şeyi yeniden kurmuyorsunuz.",
        },
        {
          q: "Tedarikçi verimiz ne kadar güvenli?",
          a: "Aktarımda ve saklamada şifrelenir. Her Smart Link tek bir tedarikçiye tanımlıdır, yani tedarikçiler birbirinin verisini görmez ve ekibiniz yalnızca yetkisinin izin verdiğini görür. Her işlem kaydedilir ve son paket özetle mühürlenir, böylece bir oynama yapılırsa belli olur.",
        },
      ],
    },

    cta: {
      headline: "Önce kanıtlayan\nsiz olun.",
      intro:
        "Certrace'i kendi tedarik zincirinizde çalışırken görün. 30 dakikalık bir demo — tedarikçi davetinden alıcınızın harekete geçebileceği bir rapora.",
      note: "Tedarikçiler her zaman ücretsiz · Başlamak için kurulum gerekmez",
    },

    form: {
      firstName: "Ad",
      lastName: "Soyad",
      email: "Kurumsal e-posta",
      phone: "Telefon numarası",
      company: "Şirket",
      companyPlaceholder: "Şirket adı",
      jobTitle: "Unvan",
      sector: "Faaliyet sektörü",
      employees: "Çalışan sayısı",
      dialLabel: "Ülke telefon kodu",
      phonePlaceholder: "81 234 5678",
      selectJobTitle: "Unvan seçin",
      selectSector: "Faaliyet sektörü seçin",
      selectEmployees: "Çalışan sayısı seçin",
      reassurance:
        "Sırada: dört kısa soru, ardından saatinizi seçin. Hiçbir yükümlülük yok ve bilgilerinizi asla paylaşmayız.",
      errors: {
        required: "Zorunlu",
        emailFormat: "Geçerli bir e-posta adresi girin",
        emailPersonal: "Şirket e-posta adresinizi kullanın",
        phoneDigits: "Telefon numaranızı girin",
        phoneLength: "Bu ülke için hane sayısını kontrol edin",
      },
      confirmed: {
        badge: "DEMO ONAYLANDI",
        detail: "30 dakika, çevrim içi",
        inviteTo: "Toplantı bağlantılı takvim daveti şu adrese yolda",
        reschedule: "Ertelemek mi gerekiyor? Davete yanıt verin veya yazın",
      },
      jobTitles: [
        "Diğer",
        "Üst yönetim",
        "Finans",
        "İK/Pazarlama",
        "Satın alma",
        "Satış",
        "Öğrenci / Araştırmacı",
        "Sürdürülebilirlik departmanı",
      ],
      sectors: [
        "İnşaat ve Gayrimenkul",
        "Danışmanlık ve Hizmet",
        "Çevre ve Enerji",
        "Etkinlik ve Turizm",
        "Finans",
        "Gıda ve İçecek",
        "Sağlık",
        "İmalat",
        "Sigorta",
        "Lojistik ve Ulaşım",
        "Medya ve İletişim",
        "Kamu Hizmeti ve Eğitim",
        "Perakende ve E-ticaret",
        "Teknoloji ve BT",
      ],
    },

    booking: {
      stepLabels: ["Birkaç soru", "Saat seçin", "Onay"],
      stepOf: "ADIM {n} / 3",
      yourDemo: "DEMONUZ",
      duration: "30 DK · ÇEVRİM İÇİ",
      close: "Kapat",
      step1Title: "Görüşmeden önce\ndört kısa soru.",
      step1Intro: "O 30 dakikada size ne göstereceğimizi bunlar belirliyor.",
      qDecision: "Bu karar sizde mi?",
      qBudget: "Arkasında bütçe var mı?",
      qTiming: "Ne zaman beyana hazır olmanız gerekiyor?",
      qSource: "Certrace'i nereden duydunuz?",
      decision: [
        "Evet, karar benim",
        "Başkalarıyla birlikte karar veriyorum",
        "Hayır — seçenekleri topluyorum",
      ],
      budget: ["Onaylandı", "Değerlendiriliyor", "Henüz yok"],
      timing: [
        "Bir ay içinde",
        "1–3 ay",
        "3–6 ay",
        "6+ ay",
        "Henüz emin değilim",
      ],
      source: [
        "Kulaktan kulağa",
        "Sosyal medya",
        "Arama motoru",
        "Etkinlik veya web semineri",
        "E-posta",
        "Basın veya makale",
        "İş ortağı veya danışman",
        "Diğer",
      ],
      sourceOtherPlaceholder: "Bizi nerede gördünüz?",
      contextLabel: "Görüşmeyi daha yararlı kılacak bir şey var mı?",
      contextPlaceholder:
        "İlk son tarihiniz, veri isteyen alıcı, bugün kullandığınız araç, başka kimler katılmalı…",
      chooseTime: "SAAT SEÇİN",
      step2Title: "Size uyan bir saat seçin.",
      step2Intro: "30 dakika, çevrim içi.",
      timeZoneLabel: "SAATLERİN GÖSTERİLDİĞİ SAAT DİLİMİ",
      timeZoneHint:
        "Tarayıcınızdan algılandı. Başka bir bölgenin çalışma saatlerine göre planlıyorsanız değiştirin.",
      timeZoneRegions: {
        asiaPacific: "Asya-Pasifik",
        europe: "Avrupa",
        middleEastAfrica: "Orta Doğu ve Afrika",
        americas: "Amerika kıtası",
      },
      chooseDay: "GÜN SEÇİN",
      chooseSlot: "SAAT SEÇİN",
      prevWeek: "Önceki hafta",
      nextWeek: "Sonraki hafta",
      noSlots: "Bu günde boş saat kalmadı. Başka bir gün deneyin — ya da yazın",
      noSlotsTail: "bu saatlerin dışında bir zaman ayarlayalım.",
      confirmPrefix: "ONAYLA",
      selectToConfirm: "ONAYLAMAK İÇİN SAAT SEÇİN",
      bookedTitle: "Kaydınız alındı",
      yourSlot: "SEÇTİĞİNİZ SAAT",
      onlineDetail: "30 dakika, çevrim içi",
      inviteTo: "Toplantı bağlantılı takvim daveti şu adrese yolda",
      reschedule: "Ertelemek mi gerekiyor? Davete yanıt verin veya yazın",
      rescheduleTail: "— form doldurmaya gerek yok.",
    },

    marquee: {
      rowOne: [
        "İhracatçı İçin Kurulmuş Tek Platform",
        "CN Kodlu 67 Gerçek CBAM Ürünü Eşlendi",
        "Demir, Çelik ve Alüminyum — Kesin Döneme Hazır",
        "Tedarikçiler Bir Kez Doldurur, Bir Daha Değil",
        "CBAM Ceza Oranlarıyla Kıyaslanmış",
        "Alıcı Sormadan Kanıt Hazır",
      ],
      /* Regulations and standards under their own registered titles. */
      rowTwo: en.marquee.rowTwo,
      ctaRowOne: [
        "Demo Ayırtın",
        "30 Dakikalık Rehberli Tur",
        "Kendi Tedarik Zinciriniz, Canlı",
        "Tedarikçi Davetinden Denetime Hazır Rapora",
        "Tedarikçiler Her Zaman Ücretsiz",
        "Başlamak İçin Kurulum Gerekmez",
      ],
      ctaRowTwo: [
        "Canlı Görün",
        "Yerinizi Ayırtın",
        "Ekiple Konuşun",
        "Önce Kanıtlayın",
        "Bugün Başlayın",
        "Demo Ayırtın",
      ],
    },

    footer: {
      desc: "Alıcıları, ihracatçıları ve tedarikçileri birbirine bağlayarak CBAM karbon verisi toplamayı otomatikleştiren bir yapay zekâ iş akışı platformu — talepten, alıcılar sormadan hazır duran rapora kadar.",
      location: "Bangkok, Tayland",
      columns: {
        platform: "PLATFORM",
        whoItsFor: "KİMLER İÇİN",
        resources: "KAYNAKLAR",
        company: "ŞİRKET",
      },
      links: {
        smartLink: "Smart Link daveti",
        profile: "Bir kez doldurulan profil",
        aiCheck: "Otomatik kalite kontrolü",
        engine: "CBAM hesaplama motoru",
        benchmark: "Karbon kıyaslaması",
        reports: "Her an hazır raporlar",
        exporters: "İhracatçılar",
        suppliers: "Tedarikçiler",
        legalCompliance: "Hukuk ve uyum — yakında",
        importers: "İthalatçılar — yakında",
        howItWorks: "Nasıl çalışır",
        faq: "Sık sorulanlar",
        timeline: "CBAM takvimi",
        backlog: "Ürün günlüğü",
        pricing: "Fiyatlandırma",
        contact: "İletişim",
        bookDemo: "Demo ayırtın",
        terms: "Hizmet şartları",
        privacy: "Gizlilik politikası",
        cookies: "Çerez politikası",
        reportIssue: "Sorun bildir",
      },
      /* The registered entity name, as filed. */
      copyright: en.footer.copyright,
      contactSubject: "Merhaba Certrace",
      issueSubject: "Bir sorun bildir",
      careersSubject: "Certrace'te kariyer",
    },

    backlog: {
      badge: "ÜRÜN GÜNLÜĞÜ",
      headline: "Yayına aldıklarımız.\nVe ne zaman.",
      intro:
        "CBAM durmuyor, ürün de durmuyor. Bu sayfa kamuya açık kayıttır: aşağıdaki her madde bugün platformda ve yayına girdiği ayla tarihlendirilmiştir.",
      updated: "Son güncelleme 30 Temmuz 2026",
      shippedBadge: "YENİ YAYINLANANLAR",
      shippedHeadline: "Bugün platformda.",
      shippedIntro:
        "En yenisi başta. Buradaki her madde canlı ortamda çalışıyor ve demoya dahil — hangisini isterseniz gösterelim.",
      buildingBadge: "DEVAM EDİYOR",
      buildingHeadline: "Şu anda geliştiriliyor.",
      nextBadge: "LİSTEDE",
      nextHeadline: "Planlandı, tarihi yok.",
      nextIntro:
        "Yöne söz verdik, tarihe değil. Sırayı müşteri talebi belirliyor.",
      chipBuilding: "GELİŞTİRİLİYOR",
      chipNext: "PLANLANDI",
      ctaHeadline: "Bu listede eksik bir şey mi var?",
      ctaIntro:
        "Sırada ne geliştireceğimizi, bir sonraki beyanının gerçekte neye ihtiyacı olduğunu bize söyleyen ihracatçılar belirliyor. Sizinkini anlatın.",
      ctaButton: "ÖZELLİK İSTEYİN",
      ctaSubject: "Ürün günlüğü talebi",
      shipped: [
        {
          month: "TEM 2026",
          title: "Kesin dönem uyum motoru",
          desc: "Ocak 2026'da değişen her kural, yorumlanmak yerine hesaplanıyor: %20 varsayılan değer üst sınırı, Ek II Kapsam 2 işleyişi, yapılandırılmış öncül girdileri, sevkiyat başına € riski ve gönderim öncesi kayıt sistemi ön kontrolü.",
          tag: "UYUM MOTORU",
        },
        {
          month: "TEM 2026",
          title: "Tedarikçi portalı — kullanıcılar, e-imza ve kalite geri bildirimi",
          desc: "Tedarikçiler departmana göre çalışma arkadaşlarını davet edebilir, kendi gönderimlerini onaylayabilir ve göndermeden önce yapay zekâ kalite kontrolünü görebilir. Hâlâ hesap yok, hâlâ ücretsiz, hâlâ Tayca veya İngilizce.",
          tag: "VERİ TOPLAMA",
        },
        {
          month: "HAZ 2026",
          title: "Gerçek CBAM ürün kataloğu — 67 CN kodu",
          desc: "Demir, çelik ve alüminyum ürünleri kendi gerçek CN kodlarına eşlendi; böylece beyan serbest metinle tahmin yerine gerçek ürünlerinizden kuruluyor.",
          tag: "UYUM MOTORU",
        },
        {
          month: "HAZ 2026",
          title: "Mühürlü denetim paketi ve Ek IV dışa aktarımı",
          desc: "SHA-256 mührü taşıyan 24 sayfalık bir rapor, alıcınızın beyan sahibinin ihtiyaç duyduğu Ek IV XML'i ve doğrudan O3CI gönderimi — tek dışa aktarma, üç hedef.",
          tag: "RAPOR VE DEVİR",
        },
        {
          month: "MAY 2026",
          title: "Alıcı veri talepleri",
          desc: "AB'li alıcılardan gelen Kapsam 3 ve CSRD anketleri, ikinci bir e-posta turu yerine CBAM için zaten topladığınız tedarikçi verisinden yanıtlanıyor.",
          tag: "VERİ TOPLAMA",
        },
        {
          month: "MAY 2026",
          title: "Smart Link ile toplama, iki dilli",
          desc: "Tedarikçi başına tek güvenli bağlantı, giriş yok ve eğitim yok, rehberli formun tamamı Tayca ve İngilizce.",
          tag: "VERİ TOPLAMA",
        },
      ],
      building: [
        {
          title: "İthalatçı ve beyan sahibi çalışma alanı",
          desc: "Aynı verinin AB tarafı: ihracatçılarınızın doğrulanmış emisyonlarını toplayın, sertifikaları hesaplayın ve yıllık CBAM beyanını hazırlayın. Şu anda iç testte.",
          when: "HEDEF Ç4 2026",
        },
        {
          title: "Birleşik Krallık CBAM kapsamı",
          desc: "Birleşik Krallık düzeni Ocak 2027'de kendi kuralları ve ürün listesiyle başlıyor. Yayımlanan rehber netleştikçe kapsamı geliştiriyoruz.",
          when: "HEDEF Ç1 2027",
        },
        {
          title: "Doğrulayıcı devri",
          desc: "Üçüncü taraf doğrulayıcılar için salt okunur bir çalışma alanı; böylece bir doğrulama turu e-postayla yollanan PDF klasörüne dönüşmüyor.",
          when: "HEDEF Ç4 2026",
        },
        {
          title: "ERP ve tablo içe aktarma",
          desc: "Tam API'den önce, kendi sütunlarınızı bir kez eşleyip hatırlayan toplu ürün ve sevkiyat içe aktarma.",
          when: "HEDEF Ç4 2026",
        },
      ],
      next: [
        {
          title: "EUDR — ormansızlaşma",
          desc: "Konum ve durum tespiti verileri aynı tedarikçi bağlantılarıyla toplanır.",
        },
        {
          title: "CSRD raporlama modülü",
          desc: "Bugün yanıtladığımız alıcı anketleriyle sınırlı kalmayan, tam sürdürülebilirlik raporlaması.",
        },
        {
          title: "Daha fazla tedarikçi dili",
          desc: "Vietnamca, Türkçe ve Hintçe — Tayland'dan sonraki üç ihracat pazarı.",
        },
        {
          title: "Herkese açık API",
          desc: "Kendi sistemi olan ekipler için beyanlara, gönderimlere ve dışa aktarmalara programatik erişim.",
        },
      ],
    },

    solutionPage: {
      whatYouGet: "NE ELDE EDERSİNİZ",
      closingHeadline: "Kendi tedarik zincirinizde görün.",
      closingIntro:
        "30 dakikalık bir tur — tedarikçi davetinden alıcınızın harekete geçebileceği bir rapora. Tedarikçiler her zaman ücretsiz.",
      closingHeadlineSoon: "Açıldığı gün elinizde olsun mu?",
      closingIntroSoon:
        "Bekleme listesine katılın, yayına girmeden önce size ulaşalım. Bu arada ihracatçı tarafı bugün çalışıyor.",
      waitlist: {
        badge: "ERKEN ERİŞİM",
        headline: "Henüz açık değil.\nSıraya girin.",
        intro:
          "Bilgilerinizi bırakın, platformun bu tarafı açılmadan önce size ulaşalım — bülten yok, otomatik e-posta zinciri yok.",
        submit: "BEKLEME LİSTESİNE KATILIN",
        note: "Açıldığında tek bir e-posta. Başka hiçbir şey, ve asla paylaşılmaz.",
        confirmedBadge: "LİSTEDESİNİZ",
        confirmedTitle: "Listedesiniz.",
        confirmedBody: "Şu adrese yazacağız:",
        confirmedTail:
          "burası açılmadan önce. Bugün çalışan ihracatçı tarafını görmeyi tercih ederseniz, bunun yerine bir demo ayırtın.",
        errors: {
          required: "Zorunlu",
          emailFormat: "Geçerli bir e-posta adresi girin",
          emailPersonal: "Şirket e-posta adresinizi kullanın",
          phoneDigits: "Telefon numaranızı girin",
          phoneLength: "Bu ülke için hane sayısını kontrol edin",
        },
      },
      exporters: {
        eyebrow: "İHRACATÇILAR İÇİN",
        headline: "Önce kanıtlayın.\nSormak zorunda kalmadan.",
        intro:
          "Bu alandaki her rakip sizin alıcınıza satıyor. Certrace sizin tarafınızda kuruldu: tedarikçi verisini bir kez toplayın, AB'nin formatına hesaplayın, size neye mal olduğunu görün ve alıcıya hazır bir raporu bekletin — böylece cevap, talepten önce var olur.",
      },
      suppliers: {
        eyebrow: "TEDARİKÇİLER İÇİN",
        headline: "Bir kez doldurun.\nBir daha doldurmayın.",
        intro:
          "Bir Smart Link alın, her cihazdan kendi dilinizde tek bir rehberli formu doldurun ve göndermeden önce geri bildirim alın. Cevaplarınız bir profile kaydedilir ve sonraki her talebi önceden doldurur — başka bir alıcıdan gelen talepleri bile.",
        benefitsHeadline: "Aslında yapmanız gereken şey.",
        benefitsIntro:
          "Tek form, tek sefer. Aşağıdaki her şey, aynı kutuyu ikinci kez doldurmayasınız diye onun etrafında olup bitenler.",
        benefits: [
          {
            title: "Tek bağlantı, her cihaz",
            desc: "Müşteriniz bir bağlantı gönderir. Cebinizdeki telefondan açıp fırsat bulduğunuzda doldurun — indirilecek bir şey ve açılacak bir hesap yok.",
            points: [
              "Giriş yok, parola yok",
              "Mobilde çalışır",
              "Bırakıp sonra dönün",
            ],
          },
          {
            title: "Kendi dilinizde yazılmış",
            desc: "Bugün Tayca ve İngilizce, açtığımız pazarlarla birlikte yenileri. Her soru sade sözcüklerle sorulur, ne anlama geldiğini ve cevabı nerede bulacağınızı anlatan bir notla.",
            points: [
              "Şimdi Tayca ve İngilizce",
              "Mevzuat dili değil, sade dil",
              "Her soruda bir ipucu",
            ],
          },
          {
            title: "Bir kez doldurulur, sonra yeniden kullanılır",
            desc: "Girdikleriniz kendi profilinize kaydedilir ve bir sonraki talepte kendini doldurur — sonraki raporlama döneminde ve size aynı şeyi soran her müşteride.",
            points: [
              "Dönemler arasında taşınır",
              "Müşteriler arasında taşınır",
              "Bir öğleden sonra yerine dakikalar",
            ],
          },
          {
            title: "Göndermeden önce kontrol edilir",
            desc: "Eksik kanıt, yanlış birim, diğerleriyle uyuşmayan bir rakam — siz daha formu doldururken yakalanır ve yalnızca işaretlenmez, açıklanır.",
            points: [
              "Siz yazarken yakalanır",
              "Neyi düzelteceğiniz söylenir",
              "E-posta gidip gelmesi yok",
            ],
          },
          {
            title: "Yalnızca değişen kısım açılır",
            desc: "Müşteriniz bir düzeltme isterse, doğru yaptığınız her şey kilitli kalır. Hangi kutuların açık olduğunu tam olarak görürsünüz ve başka hiçbir şeye dokunmazsınız.",
            points: [
              "Gerisi gönderilmiş kalır",
              "Talebi görmek için tek yer",
              "Baştan başlamak yok",
            ],
          },
          {
            title: "Ücretsiz ve yalnızca onlar görür",
            desc: "Tedarikçiler hiçbir planda Certrace için ödeme yapmaz. Gönderdiğinizi yalnızca talep eden müşteri görür — ve başka herkesle yeniden kullanmak üzere sizde kalır.",
            points: [
              "Hiçbir zaman ücret yok",
              "Yalnızca talep eden görür",
              "Yeniden kullanmak sizde",
            ],
          },
        ],
      },
      legal: {
        eyebrow: "HUKUK VE UYUM İÇİN",
        headline: "Adı geçen onaylar.\nEksiksiz bir denetim izi.",
        intro:
          "Hukuk ve uyum için ayrı çalışma alanı geliştiriliyor. Açıldığında raporlar yalnızca adı geçen onaylardan sonra çıkacak — motor bir varsayılan değer üst sınırı aşımı ya da bir aykırılık işaretlediğinde hukuk incelemesi otomatik önerilecek ve her karar denetim izine düşecek.",
      },
      importers: {
        eyebrow: "İTHALATÇILAR İÇİN",
        headline: "AB tarafındaki beyan sahibi\nçalışma alanı. Yakında.",
        intro:
          "İhracatçılarınızın zaten gönderdiği emisyon verilerini toplayın, sertifika hesabını çalıştırın ve yıllık CBAM beyanını verin — aynı iş akışının Yetkili CBAM Beyan Sahibi tarafı, tedarikçilerinizin doldurduğu doğrulanmış veri setinin üzerine kurulu.",
      },
    },
  };
}
