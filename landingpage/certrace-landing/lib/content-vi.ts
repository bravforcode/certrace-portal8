import type { Content } from "./content";

/* Vietnamese copy for the whole marketing site.

   Typed as `Content` (the shape of `en`), so a missing or renamed key is a
   build error rather than a silent English fallback on a Vietnamese page.

   The same things stay English here as in `th`, for the same reasons, and each
   is marked where it sits: `marquee.rowTwo` (regulations and standards under
   their registered titles), `howItWorks.steps[].view` / `.lines` (mock console
   output), and `footer.copyright` (the registered entity name).

   Built by a function rather than exported as a value, because those carried-
   over keys read from `en` and `en` lives in content.ts — which imports this
   module. A plain `import { en }` would be a genuine cycle: this module's body
   would run while content.ts was still initialising and `en` was in its
   temporal dead zone, throwing at first render. Taking `en` as an argument
   leaves only a type import here, which the compiler erases. */
export function buildVi(en: Content): Content {
  return {
    common: {
      bookDemo: "ĐẶT LỊCH DEMO",
      getStarted: "BẮT ĐẦU",
      seeHowItWorks: "XEM CÁCH HOẠT ĐỘNG",
      requestPricing: "YÊU CẦU BÁO GIÁ",
      allSolutions: "TẤT CẢ GIẢI PHÁP",
      joinWaitlist: "ĐĂNG KÝ CHỜ",
      live: "ĐANG CHẠY",
      soon: "SẮP CÓ",
      comingSoon: "SẮP RA MẮT",
      back: "QUAY LẠI",
      close: "ĐÓNG",
    },

    nav: {
      login: "ĐĂNG NHẬP",
      language: "Ngôn ngữ",
      selectLanguage: "Chọn ngôn ngữ",
      openMenu: "Mở menu",
      closeMenu: "Đóng menu",
      backToTop: "Certrace — về đầu trang",
      primary: "Chính",
      mobile: "Di động",
      platform: {
        label: "Nền tảng",
        items: [
          {
            label: "Smart Link mời nhà cung cấp",
            desc: "Một liên kết cho mỗi nhà cung cấp. Không email, không tài khoản, không phải nhắc.",
          },
          {
            label: "Hồ sơ nhà cung cấp điền một lần",
            desc: "Dữ liệu lưu một lần và tự dùng lại cho mọi yêu cầu sau đó.",
          },
          {
            label: "Kiểm tra chất lượng tự động",
            desc: "Thiếu trường, sai đơn vị, số liệu vô lý — bắt ngay khi vừa nhận.",
          },
          {
            label: "Bộ máy tính toán CBAM",
            desc: "Dữ liệu thô của nhà cung cấp thành đúng định dạng phát thải EU yêu cầu.",
          },
          {
            label: "Bảng đối chuẩn carbon",
            desc: "Bạn đang đứng ở đâu so với mức phạt CBAM, nói bằng ngôn ngữ dễ hiểu.",
          },
          {
            label: "Gói báo cáo luôn sẵn sàng",
            desc: "Sẵn cho người mua và kiểm toán, theo định dạng EU, luôn cập nhật mà không phải làm lại.",
          },
        ],
        footer: "Xem tất cả tính năng",
      },
      solutions: {
        label: "Giải pháp",
        items: [
          {
            label: "Cho nhà xuất khẩu",
            desc: "Chứng minh dữ liệu carbon trước khi người mua phải hỏi.",
          },
          {
            label: "Cho nhà cung cấp",
            desc: "Một biểu mẫu miễn phí, bằng tiếng của bạn, trên mọi thiết bị.",
          },
          {
            label: "Cho pháp chế & tuân thủ",
            desc: "Phê duyệt có tên người chịu trách nhiệm và nhật ký kiểm toán đầy đủ.",
          },
          {
            label: "Cho nhà nhập khẩu",
            desc: "Không gian làm việc phía EU cho người khai báo CBAM.",
          },
        ],
        footer: "Certrace được xây cho ai",
      },
      regulations: {
        label: "Quy định",
        items: [
          {
            label: "EU CBAM",
            desc: "Sắt, thép và nhôm — 67 mặt hàng theo mã CN, đã tích hợp quy tắc giai đoạn chính thức.",
          },
        ],
        footer: "Xem cái mới",
      },
      pricing: "Bảng giá",
      resources: {
        label: "Tài nguyên",
        items: [
          {
            label: "Cách hoạt động",
            desc: "Bốn bước từ lời mời nhà cung cấp đến bản xuất sẵn sàng kiểm toán.",
          },
          {
            label: "Câu hỏi thường gặp",
            desc: "Ai thực sự nộp hồ sơ, AI làm gì, dữ liệu được bảo vệ ra sao.",
          },
          {
            label: "Lộ trình CBAM",
            desc: "Mọi mốc hạn từ giai đoạn chuyển tiếp đến tờ khai đầu tiên.",
          },
          {
            label: "Nhật ký sản phẩm",
            desc: "Mọi thứ chúng tôi đã phát hành, mới nhất trước.",
          },
        ],
        footer: "Đặt lịch demo",
      },
      company: {
        label: "Công ty",
        items: [
          {
            label: "Liên hệ",
            desc: "Bất cứ điều gì chúng tôi giúp được — cứ nhắn một câu.",
          },
          {
            label: "Về Certrace",
            desc: "Chúng tôi là ai và vì sao làm điều này. Sắp có.",
          },
          {
            label: "Tuyển dụng",
            desc: "Hãy nói bạn muốn xây gì. Chúng tôi đọc từng thư một.",
          },
        ],
        footer: "Đặt lịch demo",
      },
    },

    hero: {
      badge: "HẠ TẦNG TUÂN THỦ CARBON",
      headline: "Người mua không chờ.\nHọ chọn ai\nchứng minh trước.",
      intro:
        "Nền tảng quy trình AI kết nối người mua, nhà xuất khẩu và nhà cung cấp để tự động hoá việc thu thập dữ liệu carbon CBAM — từ yêu cầu đến báo cáo sẵn sàng kiểm toán.",
      /* Four returns, not four facts about the market. Measured to two lines in
         the 140px caption box at 390 / 640 / 768 / 1440 — the grid squeezes the
         box to ~118px at 640, and a third line pushes the hero block past the
         fold on a short laptop. "Giờ công phải chạy theo nhà cung cấp" and
         "Nhanh hơn đến khi có bằng chứng" both ran to three; don't lengthen
         these without re-measuring. */
      stats: [
        "Chi phí tuân thủ mỗi kỳ nộp",
        "Giờ chạy theo nhà cung cấp",
        "Mặt hàng CBAM đã hỗ trợ",
        "Chứng minh nhanh hơn",
      ],
      videoTitle: "Video giới thiệu sản phẩm Certrace",
    },

    problem: {
      badge: "VẤN ĐỀ",
      headline: "Bốn bước.\nChỉ vậy thôi\nlà mất đơn hàng.",
      intro:
        "Người mua yêu cầu dữ liệu carbon đã kiểm chứng. Bạn bắt đầu đi hỏi. Người khác đã có sẵn — nên đơn hàng không bị từ chối. Nó chỉ đơn giản là chuyển đi.",
      chain: [
        {
          step: "HỎI",
          title: "Người mua hỏi",
          desc: "Nhà nhập khẩu EU cần dữ liệu phát thải đã kiểm chứng trước đơn hàng tới.",
        },
        {
          step: "CHẬM",
          title: "Bạn bắt đầu đi hỏi",
          desc: "Từng nhà cung cấp, từng email. Vài tuần trôi qua, vẫn chưa đủ.",
        },
        {
          step: "THAY THẾ",
          title: "Họ tìm được người khác",
          desc: "Một nhà xuất khẩu khác đã có sẵn số liệu sạch để gửi đi.",
        },
        {
          step: "CHUYỂN",
          title: "Đơn hàng chuyển đi",
          desc: "Không vì giá. Không vì chất lượng. Bằng chứng chỉ đến sau một bước.",
        },
      ],
      stakes: {
        riskLabel: "BẠN CÓ SẴN SÀNG ĐÁNH ĐỔI?",
        riskTitle: "Một đơn hàng, mất trắng.",
        riskFigure: "$670,000",
        riskCaption: {
          before: "Không phải vì giá. Không phải vì chất lượng. Mà vì ",
          highlight: "thiếu dữ liệu carbon.",
        },
        manualLabel: "LÀM THỦ CÔNG NHƯ HIỆN NAY",
        manual: [
          { lead: "9–15 tuần", rest: "làm thủ công, mỗi năm báo cáo" },
          { lead: "$9K–24K", rest: "chi mỗi năm — và vẫn thường sai" },
        ],
      },
    },

    whyNow: {
      badge: "VÌ SAO LÀ LÚC NÀY",
      headline: "CBAM không phải sắp tới.\nNó đã bắt đầu tính.",
      intro:
        "Từ tháng 1/2026, mỗi lô hàng đều mang một chi phí thật — và bạn chỉ chứng minh được những gì đã đo vào lúc đó.",
      milestones: [
        {
          date: "T10 2023",
          label: "Bắt đầu giai đoạn chuyển tiếp",
          desc: "Chỉ báo cáo. Chưa có chứng chỉ.",
        },
        {
          date: "T1 2026",
          label: "Bắt đầu giai đoạn chính thức",
          desc: "Nghĩa vụ đầy đủ trên mọi lô hàng.",
        },
        {
          date: "T2 2027",
          label: "Mở bán chứng chỉ",
          desc: "Nhà nhập khẩu bắt đầu mua cho phát thải năm 2026.",
        },
        {
          date: "T9 2027",
          label: "Hạn nộp tờ khai năm đầu tiên",
          desc: "Khai báo và nộp lại chứng chỉ cho năm 2026.",
        },
      ],
      /* The timer rests on 00:00:00:00, so the wording has to read true against
         zeros — zero is the honest answer to "how much of last month can you
         still go back and measure". */
      countdown: {
        eyebrow: "KHÔNG QUAY LẠI ĐƯỢC",
        title: "Phát thải của tháng trước thì không còn đo được nữa.",
        units: ["NGÀY", "GIỜ", "PHÚT", "GIÂY"],
      },
      quote:
        "“Nhà xuất khẩu không đưa ra được báo cáo carbon đã kiểm chứng có nguy cơ mất quyền tiếp cận thị trường EU — vĩnh viễn.”",
    },

    live: {
      badge: "NỀN TẢNG ĐANG CHẠY",
      headline: "Bằng chứng của bạn,\nsẵn sàng trước khi\nhọ hỏi đến.",
      intro:
        "Mọi nhà cung cấp, mọi lần gửi, mọi hạn chót — thấy ngay khi có thay đổi. Nên khi yêu cầu đến, câu trả lời đã có sẵn.",
      suppliersSubmitted: "nhà cung cấp đã gửi\ntrong quý này",
      stats: [
        "24 / 30 nhà cung cấp đã duyệt",
        "94% dữ liệu hoàn tất",
        "Còn 6 ngày đến hạn",
      ],
    },

    platform: {
      badge: "NỀN TẢNG",
      headline: "Sáu tính năng.\nMột chuỗi liền mạch.",
      intro:
        "Không phải ghép bảng tính, không cần công cụ thứ hai để đối soát. Mời, dùng lại, kiểm tra, tính toán, đối chuẩn, báo cáo — dựng sao cho bằng chứng xong trước khi ai đó hỏi tới.",
      modules: [
        {
          label: "01 / SMART LINK MỜI NHÀ CUNG CẤP",
          title: "Không email, không phải nhắc, không cần tài khoản.",
          desc: "Gửi một liên kết. Nhà cung cấp chỉ điền đúng phần sản phẩm của họ cần, bằng ngôn ngữ của họ. Không cài đặt gì, không phải đào tạo ai.",
          tags: [
            "Một liên kết mỗi nhà cung cấp",
            "Không cần tài khoản",
            "Ngôn ngữ của họ",
            "Tự động nhắc",
          ],
        },
        {
          label: "02 / HỒ SƠ ĐIỀN MỘT LẦN",
          title: "Nhà cung cấp không bao giờ nhập lại cùng một dữ liệu.",
          desc: "Câu trả lời lưu một lần và tự điền vào mọi yêu cầu sau — qua các sản phẩm, các kỳ và các người mua. Lần đầu mất một buổi chiều. Lần sau mất vài phút.",
          tags: [
            "Lưu một lần",
            "Dùng lại khắp nơi",
            "Dùng được với mọi người mua",
            "Vài phút, không phải vài tuần",
          ],
        },
        {
          label: "03 / KIỂM TRA CHẤT LƯỢNG TỰ ĐỘNG",
          title: "Dữ liệu xấu bị chặn trước khi đến tay bạn.",
          desc: "Thiếu trường, sai đơn vị, con số vô lý — đánh dấu ngay khi nhà cung cấp gửi. Bạn duyệt một hồ sơ sạch kèm bản tóm tắt dễ hiểu, không phải một bảng tính đầy dấu hỏi.",
          tags: [
            "Trường còn thiếu",
            "Sai đơn vị",
            "Giá trị vô lý",
            "Tóm tắt dễ hiểu",
          ],
        },
        {
          label: "04 / BỘ MÁY TÍNH TOÁN CBAM",
          title: "Không tính tay. Không lỗi bảng tính.",
          desc: "Dữ liệu thô của nhà cung cấp tự động thành định dạng phát thải EU yêu cầu, theo quy tắc giai đoạn chính thức — kèm dấu vết tính toán gắn với từng con số bạn nộp.",
          tags: [
            "Định dạng phát thải EU",
            "Trần giá trị mặc định 20%",
            "Quy tắc Scope 2",
            "Dấu vết tính toán đầy đủ",
          ],
        },
        {
          label: "05 / BẢNG ĐỐI CHUẨN CARBON",
          title: "Thấy bạn đang ở đâu, và điều đó tốn của bạn bao nhiêu.",
          desc: "Số liệu carbon của bạn đặt cạnh mức phạt CBAM, nói dễ hiểu: bạn hở ở đâu, dòng sản phẩm nào đang kéo xuống, và cần sửa gì. Không cần chuyên môn.",
          tags: [
            "So với mức phạt",
            "Rủi ro theo sản phẩm",
            "Ngôn ngữ dễ hiểu",
            "Không cần chuyên môn",
          ],
        },
        {
          label: "06 / GÓI BÁO CÁO LUÔN SẴN SÀNG",
          title: "Sẵn sàng trước cả khi người mua hỏi.",
          desc: "Một cú nhấp biến dữ liệu nhà cung cấp thành báo cáo đã niêm phong, sẵn cho người mua và kiểm toán, theo định dạng EU. Nó tự cập nhật khi dữ liệu đổi, nên bạn không phải dựng lại.",
          tags: [
            "Sẵn cho người mua",
            "Sẵn cho kiểm toán",
            "XML Phụ lục IV",
            "Luôn cập nhật",
          ],
        },
      ],
    },

    comparison: {
      badge: "VÌ SAO CHỌN CERTRACE",
      headline: "Các nền tảng carbon\nbán cho người mua.\nCái này là của bạn.",
      intro:
        "Công cụ trong lĩnh vực này do nhà nhập khẩu EU mua — bạn là nguồn dữ liệu mà họ đi thu. Certrace đứng về phía bạn: nhà cung cấp của bạn, dữ liệu của bạn, bằng chứng của bạn, sẵn sàng trước khi có yêu cầu.",
      colDiy: "Tự làm nội bộ",
      colConsultant: "Tư vấn / công cụ phía người mua",
      rows: [
        {
          label: "Được xây cho ai",
          diy: "Không cho ai — chạy bằng giờ rảnh",
          consultant: "Cho người mua. Bạn là nguồn dữ liệu.",
          certrace: "Cho bạn. Cho nhà xuất khẩu.",
        },
        {
          label: "Thời gian mỗi năm báo cáo",
          diy: "9–15 tuần",
          consultant: "6–10 tuần",
          certrace: "Vài ngày, không phải vài tuần",
        },
        {
          label: "Chi phí mỗi năm",
          diy: "Giờ công nội bộ ẩn",
          consultant: "$9K–24K, hoặc $50K–250K bản doanh nghiệp",
          certrace: "Một phần nhỏ của cả hai",
        },
        {
          label: "Dữ liệu nhà cung cấp",
          diy: "Hơn 200 định dạng không đồng nhất",
          consultant: "Đối soát tay, một lần",
          certrace: "Một biểu mẫu, điền một lần, dùng lại",
        },
        {
          label: "Kiểm tra chất lượng",
          diy: "Thủ công, dễ bỏ sót",
          consultant: "Phát hiện sau khi đã xong",
          certrace: "Kiểm ngay lúc dữ liệu về",
        },
        {
          label: "Khi người mua hỏi",
          diy: "Bạn bắt đầu chạy theo nhà cung cấp",
          consultant: "Bạn đặt làm báo cáo tiếp theo",
          certrace: "Câu trả lời đã có sẵn",
        },
        {
          label: "Biết mình đang ở đâu",
          diy: "Không có đối chuẩn nào",
          consultant: "Một con số, không có bối cảnh",
          certrace: "Đối chuẩn với mức phạt",
        },
      ],
    },

    howItWorks: {
      badge: "CÁCH HOẠT ĐỘNG",
      headline: "Bốn bước đơn giản.\nKhông phải học lại.",
      /* `view` and `lines` stay English: they are mock console output, not prose. */
      steps: en.howItWorks.steps.map((s, i) => ({
        ...s,
        title: ["Tạo", "Thu thập", "Rà soát", "Luôn sẵn sàng"][i]!,
        desc: [
          "Chọn sản phẩm của bạn. Trình hướng dẫn lo phần quy định.",
          "Nhà cung cấp điền một biểu mẫu — và chỉ một lần duy nhất.",
          "Xem nó tốn của bạn bao nhiêu, và bạn hở ở đâu.",
          "Báo cáo xong trước khi người mua hỏi.",
        ][i]!,
      })),
    },

    stakeholders: {
      badge: "DÀNH CHO AI",
      headline: "Một chuỗi. Đủ mọi phía.\nBắt đầu từ phía bạn.",
      intro:
        "Một bộ dữ liệu, dùng chung giữa người mua, nhà xuất khẩu và nhà cung cấp. Phía nhà xuất khẩu và nhà cung cấp đã chạy hôm nay — phần còn lại mở lần lượt.",
      audiences: [
        {
          title: "Nhà xuất khẩu",
          desc: "Chứng minh dữ liệu carbon trước khi người mua hỏi — thu thập, đối chuẩn và một báo cáo luôn sẵn sàng trong cùng một nơi.",
          cta: "Xem giải pháp cho nhà xuất khẩu",
        },
        {
          title: "Nhà cung cấp",
          desc: "Một biểu mẫu có hướng dẫn bằng tiếng của bạn, trên mọi thiết bị. Không tài khoản, không phí, và không hỏi lại câu đã hỏi.",
          cta: "Xem giải pháp cho nhà cung cấp",
        },
        {
          title: "Pháp chế & tuân thủ",
          desc: "Không gì gửi đi mà thiếu người phê duyệt đứng tên. Mọi quyết định đều vào nhật ký kiểm toán.",
          cta: "Đăng ký chờ",
        },
        {
          title: "Nhà nhập khẩu",
          desc: "Tổng hợp dữ liệu đã kiểm chứng của nhà xuất khẩu, tính chứng chỉ và nộp tờ khai năm từ phía EU.",
          cta: "Đăng ký chờ",
        },
      ],
    },

    languages: {
      badge: "HỖ TRỢ NGÔN NGỮ",
      headline: "Dựng theo đúng cách\nmạng lưới của bạn vận hành.",
      intro:
        "Biểu mẫu có hướng dẫn và báo cáo bằng đúng ngôn ngữ nhà cung cấp của bạn đang dùng — và sẽ còn thêm nữa.",
      statusLive: "ĐANG CHẠY",
      statusSoon: "SẮP CÓ",
    },

    pricing: {
      badge: "BẢNG GIÁ",
      headline: "Giá đơn giản, minh bạch.\nTheo quy mô của bạn.",
      intro:
        "Mọi gói đều được thiết kế để tiết kiệm nhiều hơn chi phí bỏ ra, ngay từ ngày đầu. Nhà cung cấp luôn miễn phí.",
      introPage:
        "Mọi gói đều được thiết kế để tiết kiệm nhiều hơn chi phí bỏ ra, ngay từ ngày đầu. Nhà cung cấp luôn miễn phí, ở mọi gói.",
      note: "Giá tuỳ theo số nhà cung cấp và yêu cầu tuân thủ của bạn · Thuê bao theo năm · Nhà cung cấp luôn miễn phí · Huỷ bất cứ lúc nào sau năm đầu",
      questionsBadge: "CÂU HỎI",
      plans: [
        {
          name: "STARTER",
          sub: "Tối đa 20 nhà cung cấp",
          features: [
            "Trình tạo yêu cầu thông minh",
            "Dùng được với mọi người mua EU của bạn",
            "Hỗ trợ tiếng Thái",
            "Bảng theo dõi trực tiếp + nhắc hạn",
            "Bản xuất sẵn sàng kiểm toán",
          ],
        },
        {
          name: "STANDARD",
          sub: "Tối đa 50 nhà cung cấp",
          features: [
            "Toàn bộ gói Starter",
            "Một chỗ cho cổng kiểm toán viên",
            "Mẫu cho nhiều quy định",
            "Hỗ trợ ưu tiên + hướng dẫn khởi tạo",
          ],
        },
        {
          name: "ENTERPRISE",
          sub: "Trên 50 nhà cung cấp",
          features: [
            "Toàn bộ gói Standard",
            "Hỗ trợ nhiều pháp nhân / nhiều nhà máy",
            "Quản lý tài khoản riêng",
            "Quyền phê duyệt qua mạng lưới pháp lý",
          ],
        },
      ],
    },

    faq: {
      badge: "CÂU HỎI THƯỜNG GẶP",
      headline: "Câu hỏi quen thuộc.\nTrả lời thẳng.",
      items: [
        {
          q: "Ai cũng bán cho nhà nhập khẩu. Vì sao lại xây cho nhà xuất khẩu?",
          a: "Vì nhà xuất khẩu mới là người mất đơn hàng. Nền tảng phía người mua xem bạn là nguồn dữ liệu để đi đòi; chúng tôi xem dữ liệu của bạn là thứ giành được hợp đồng tiếp theo. Cùng một quy định, ngồi ở đầu bàn bên kia.",
        },
        {
          q: "Certrace có nộp hồ sơ CBAM với EU thay chúng tôi không?",
          a: "Không — không nhà cung cấp phần mềm nào làm được. Chỉ Người khai báo CBAM được uỷ quyền của người mua EU mới nộp được vào Registry. Certrace đưa cho họ mọi thứ cần: mẫu Phụ lục IV, gói kiểm toán đã niêm phong, và dữ liệu cơ sở của bạn đẩy sang O3CI.",
        },
        {
          q: "Nhà cung cấp của tôi có phải trả tiền hay tạo tài khoản không?",
          a: "Không. Mỗi nhà cung cấp nhận một Smart Link — biểu mẫu có hướng dẫn bằng tiếng Thái hoặc tiếng Anh, trên mọi thiết bị. Không tài khoản, không phí. Câu trả lời của họ lưu vào hồ sơ, nên yêu cầu sau đã được điền sẵn.",
        },
        {
          q: "AI thực sự làm gì? Nó có sửa số của chúng tôi không?",
          a: "Nó rà soát, không bao giờ sửa. AI đánh dấu chỗ thiếu, điểm bất thường và bằng chứng yếu, rồi viết điểm tin cậy kèm bản tóm tắt dễ hiểu để đội của bạn duyệt nhanh hơn. Mọi con số được nộp đều đến từ bộ máy tính toán tất định, kèm dấu vết tính toán.",
        },
        {
          q: "Đối chuẩn thực ra cho tôi biết điều gì?",
          a: "Số liệu của bạn nằm ở đâu so với mức phạt CBAM, nói dễ hiểu — dòng sản phẩm nào rủi ro nhất, và một thay đổi sẽ đáng giá bao nhiêu. Đó là khác biệt giữa báo cáo dữ liệu carbon và thực sự hành động được với nó.",
        },
        {
          q: "Bản xuất có thật sự sẵn sàng cho kiểm toán không?",
          a: "Có — một Gói Truyền đạt & Kiểm toán CBAM khoảng 24 trang: tóm tắt kê khai, phương pháp luận, một chương cho mỗi nhà cung cấp, sổ bằng chứng, các phê duyệt và toàn bộ nhật ký kiểm toán, niêm phong bằng mã băm SHA-256. XML Phụ lục IV đi kèm.",
        },
        {
          q: "Hiện Certrace hỗ trợ những quy định nào?",
          a: "EU CBAM, và chỉ EU CBAM — sắt, thép và nhôm, với 67 mặt hàng mã CN thật cùng quy tắc giai đoạn chính thức đã tích hợp. UK CBAM, EUDR và CSRD nằm trong lộ trình; chúng tôi thà làm tốt một quy định còn hơn làm nửa vời bốn cái.",
        },
        {
          q: "Chuyện gì xảy ra khi quy định thay đổi?",
          a: "Chúng tôi cập nhật biểu mẫu, quy tắc tính toán và mẫu xuất ở một chỗ — quy tắc giai đoạn chính thức 2026 đã được mã hoá sẵn. Bạn không phải dựng lại gì cả.",
        },
        {
          q: "Dữ liệu nhà cung cấp của chúng tôi an toàn tới đâu?",
          a: "Mã hoá khi truyền và khi lưu. Mỗi Smart Link chỉ gắn với một nhà cung cấp, nên các nhà cung cấp không thấy dữ liệu của nhau và đội của bạn chỉ thấy đúng phần quyền của mình. Mọi thao tác đều được ghi lại, và gói cuối được niêm phong bằng mã băm nên mọi can thiệp đều lộ ra.",
        },
      ],
    },

    cta: {
      headline: "Hãy là người\nchứng minh trước.",
      intro:
        "Xem Certrace chạy trên chính chuỗi cung ứng của bạn. Demo 30 phút — từ lời mời nhà cung cấp đến báo cáo mà người mua dùng được ngay.",
      note: "Nhà cung cấp luôn miễn phí · Không cần thiết lập gì để bắt đầu",
    },

    form: {
      firstName: "Tên",
      lastName: "Họ",
      email: "Email công việc",
      phone: "Số điện thoại",
      company: "Công ty",
      companyPlaceholder: "Tên công ty",
      jobTitle: "Chức danh",
      sector: "Lĩnh vực hoạt động",
      employees: "Số nhân viên",
      dialLabel: "Mã vùng quốc gia",
      phonePlaceholder: "81 234 5678",
      selectJobTitle: "Chọn chức danh",
      selectSector: "Chọn lĩnh vực hoạt động",
      selectEmployees: "Chọn số nhân viên",
      reassurance:
        "Tiếp theo: bốn câu hỏi ngắn, rồi chọn khung giờ của bạn. Không ràng buộc, và chúng tôi không bao giờ chia sẻ thông tin của bạn.",
      errors: {
        required: "Bắt buộc",
        emailFormat: "Nhập một địa chỉ email hợp lệ",
        emailPersonal: "Hãy dùng email công ty của bạn",
        phoneDigits: "Nhập số điện thoại của bạn",
        phoneLength: "Kiểm tra lại số chữ số cho quốc gia này",
      },
      confirmed: {
        badge: "ĐÃ XÁC NHẬN DEMO",
        detail: "30 phút, trực tuyến",
        inviteTo: "Thư mời lịch kèm liên kết cuộc họp đang được gửi tới",
        reschedule: "Cần đổi giờ? Trả lời thư mời, hoặc email tới",
      },
      jobTitles: [
        "Khác",
        "Ban lãnh đạo",
        "Tài chính",
        "Nhân sự/Marketing",
        "Thu mua",
        "Kinh doanh",
        "Sinh viên / Nghiên cứu",
        "Bộ phận phát triển bền vững",
      ],
      sectors: [
        "Xây dựng & Bất động sản",
        "Tư vấn & Dịch vụ",
        "Môi trường & Năng lượng",
        "Sự kiện & Du lịch",
        "Tài chính",
        "Thực phẩm & Đồ uống",
        "Y tế",
        "Sản xuất",
        "Bảo hiểm",
        "Logistics & Vận tải",
        "Truyền thông",
        "Dịch vụ công & Giáo dục",
        "Bán lẻ & Thương mại điện tử",
        "Công nghệ & CNTT",
      ],
    },

    booking: {
      stepLabels: ["Vài câu hỏi", "Chọn giờ", "Xác nhận"],
      stepOf: "BƯỚC {n} / 3",
      yourDemo: "DEMO CỦA BẠN",
      duration: "30 PHÚT · TRỰC TUYẾN",
      close: "Đóng",
      step1Title: "Bốn câu hỏi nhanh\ntrước khi gặp nhau.",
      step1Intro: "Chúng quyết định chúng tôi sẽ cho bạn xem gì trong 30 phút đó.",
      qDecision: "Quyết định này có thuộc về bạn không?",
      qBudget: "Đã có ngân sách cho việc này chưa?",
      qTiming: "Khi nào bạn cần sẵn sàng nộp hồ sơ?",
      qSource: "Bạn biết Certrace từ đâu?",
      decision: [
        "Có, tôi quyết",
        "Tôi quyết cùng người khác",
        "Chưa — tôi đang tìm hiểu",
      ],
      budget: ["Đã duyệt", "Đang xem xét", "Chưa có"],
      timing: [
        "Trong vòng một tháng",
        "1–3 tháng",
        "3–6 tháng",
        "Trên 6 tháng",
        "Chưa chắc",
      ],
      source: [
        "Người quen giới thiệu",
        "Mạng xã hội",
        "Công cụ tìm kiếm",
        "Sự kiện hoặc hội thảo",
        "Email",
        "Báo chí hoặc bài viết",
        "Đối tác hoặc tư vấn",
        "Khác",
      ],
      sourceOtherPlaceholder: "Bạn biết đến chúng tôi ở đâu?",
      contextLabel: "Có điều gì giúp buổi trao đổi hữu ích hơn không?",
      contextPlaceholder:
        "Hạn chót đầu tiên của bạn, người mua đang đòi dữ liệu, công cụ bạn dùng hiện nay, ai nên tham gia cùng…",
      chooseTime: "CHỌN GIỜ",
      step2Title: "Chọn giờ phù hợp với bạn.",
      step2Intro: "30 phút, trực tuyến.",
      timeZoneLabel: "GIỜ HIỂN THỊ THEO",
      timeZoneHint:
        "Nhận từ trình duyệt của bạn. Đổi lại nếu bạn đặt lịch theo giờ làm việc của khu vực khác.",
      timeZoneRegions: {
        asiaPacific: "Châu Á – Thái Bình Dương",
        europe: "Châu Âu",
        middleEastAfrica: "Trung Đông & Châu Phi",
        americas: "Châu Mỹ",
      },
      chooseDay: "CHỌN NGÀY",
      chooseSlot: "CHỌN GIỜ",
      prevWeek: "Tuần trước",
      nextWeek: "Tuần sau",
      noSlots: "Ngày này không còn giờ trống. Thử ngày khác — hoặc email tới",
      noSlotsTail: "và chúng tôi sẽ tìm giờ ngoài khung này.",
      confirmPrefix: "XÁC NHẬN",
      selectToConfirm: "CHỌN GIỜ ĐỂ XÁC NHẬN",
      bookedTitle: "Đã đặt lịch xong",
      yourSlot: "GIỜ CỦA BẠN",
      onlineDetail: "30 phút, trực tuyến",
      inviteTo: "Thư mời lịch kèm liên kết cuộc họp đang được gửi tới",
      reschedule: "Cần đổi giờ? Trả lời thư mời, hoặc email tới",
      rescheduleTail: "— không cần điền biểu mẫu nào.",
    },

    marquee: {
      rowOne: [
        "Nền Tảng Duy Nhất Xây Cho Nhà Xuất Khẩu",
        "67 Mặt Hàng CBAM Mã CN Thật Đã Ánh Xạ",
        "Sắt, Thép & Nhôm — Sẵn Cho Giai Đoạn Chính Thức",
        "Nhà Cung Cấp Điền Một Lần, Không Lặp Lại",
        "Đối Chuẩn Với Mức Phạt CBAM",
        "Bằng Chứng Sẵn Trước Khi Người Mua Hỏi",
      ],
      /* Regulations and standards under their own registered titles. */
      rowTwo: en.marquee.rowTwo,
      ctaRowOne: [
        "Đặt Lịch Demo",
        "Hướng Dẫn 30 Phút",
        "Chính Chuỗi Cung Ứng Của Bạn, Trực Tiếp",
        "Từ Lời Mời Nhà Cung Cấp Đến Báo Cáo Sẵn Kiểm Toán",
        "Nhà Cung Cấp Luôn Miễn Phí",
        "Không Cần Thiết Lập Gì",
      ],
      ctaRowTwo: [
        "Xem Trực Tiếp",
        "Giữ Chỗ Của Bạn",
        "Nói Chuyện Với Đội Ngũ",
        "Chứng Minh Trước",
        "Bắt Đầu Hôm Nay",
        "Đặt Lịch Demo",
      ],
    },

    footer: {
      desc: "Nền tảng quy trình AI kết nối người mua, nhà xuất khẩu và nhà cung cấp để tự động hoá việc thu thập dữ liệu carbon CBAM — từ yêu cầu đến báo cáo sẵn sàng kiểm toán.",
      location: "Bangkok, Thái Lan",
      columns: {
        platform: "NỀN TẢNG",
        whoItsFor: "DÀNH CHO AI",
        resources: "TÀI NGUYÊN",
        company: "CÔNG TY",
      },
      links: {
        smartLink: "Smart Link mời",
        profile: "Hồ sơ điền một lần",
        aiCheck: "Kiểm tra chất lượng tự động",
        engine: "Bộ máy tính toán CBAM",
        benchmark: "Đối chuẩn carbon",
        reports: "Báo cáo luôn sẵn sàng",
        exporters: "Nhà xuất khẩu",
        suppliers: "Nhà cung cấp",
        legalCompliance: "Pháp chế & tuân thủ — sắp có",
        importers: "Nhà nhập khẩu — sắp có",
        howItWorks: "Cách hoạt động",
        faq: "Câu hỏi thường gặp",
        timeline: "Lộ trình CBAM",
        backlog: "Nhật ký sản phẩm",
        pricing: "Bảng giá",
        contact: "Liên hệ",
        bookDemo: "Đặt lịch demo",
        terms: "Điều khoản dịch vụ",
        privacy: "Chính sách quyền riêng tư",
        cookies: "Chính sách cookie",
        reportIssue: "Báo lỗi",
      },
      /* The registered entity name, as filed. */
      copyright: en.footer.copyright,
      contactSubject: "Xin chào Certrace",
      issueSubject: "Báo một lỗi",
      careersSubject: "Tuyển dụng tại Certrace",
    },

    backlog: {
      badge: "NHẬT KÝ SẢN PHẨM",
      headline: "Những gì đã phát hành.\nVà khi nào.",
      intro:
        "CBAM luôn thay đổi, nên sản phẩm cũng vậy. Trang này là hồ sơ công khai: mọi mục dưới đây đều đang có trong nền tảng hôm nay, ghi theo tháng bắt đầu chạy.",
      updated: "Cập nhật lần cuối 30 tháng 7, 2026",
      shippedBadge: "MỚI PHÁT HÀNH",
      shippedHeadline: "Đang có trong nền tảng.",
      shippedIntro:
        "Mới nhất trước. Mọi mục ở đây đều đang chạy thật và nằm trong buổi demo — cứ hỏi để xem bất kỳ mục nào.",
      buildingBadge: "ĐANG LÀM",
      buildingHeadline: "Đang được xây ngay lúc này.",
      nextBadge: "TRONG DANH SÁCH",
      nextHeadline: "Đã định hướng, chưa định ngày.",
      nextIntro:
        "Cam kết về hướng đi, chưa cam kết về thời điểm. Nhu cầu khách hàng quyết định thứ tự.",
      chipBuilding: "ĐANG XÂY",
      chipNext: "DỰ KIẾN",
      ctaHeadline: "Thiếu thứ gì trong danh sách này?",
      ctaIntro:
        "Thứ chúng tôi làm tiếp do chính các nhà xuất khẩu quyết định, bằng cách nói cho chúng tôi kỳ nộp hồ sơ tới của họ thực sự cần gì. Hãy nói cho chúng tôi biết của bạn.",
      ctaButton: "ĐỀ XUẤT TÍNH NĂNG",
      ctaSubject: "Đề xuất cho backlog",
      shipped: [
        {
          month: "T7 2026",
          title: "Bộ máy tuân thủ giai đoạn chính thức",
          desc: "Mọi quy tắc đã đổi từ tháng 1/2026, được tính toán thay vì diễn giải: trần giá trị mặc định 20%, xử lý Scope 2 theo Phụ lục II, đầu vào tiền chất có cấu trúc, mức rủi ro € theo lô hàng, và bước tiền kiểm registry trước khi gửi đi.",
          tag: "BỘ MÁY TUÂN THỦ",
        },
        {
          month: "T7 2026",
          title: "Cổng nhà cung cấp — chỗ ngồi, ký điện tử và phản hồi chất lượng",
          desc: "Nhà cung cấp có thể mời đồng nghiệp theo phòng ban, tự phê duyệt hồ sơ của mình và xem kết quả kiểm tra chất lượng của AI trước khi gửi. Vẫn không cần tài khoản, vẫn miễn phí, vẫn tiếng Thái hoặc tiếng Anh.",
          tag: "THU THẬP DỮ LIỆU",
        },
        {
          month: "T6 2026",
          title: "Danh mục hàng hoá CBAM thật — 67 mã CN",
          desc: "Hàng sắt, thép và nhôm được ánh xạ tới đúng mã CN của chúng, nên tờ khai dựng từ sản phẩm thật của bạn thay vì một dòng chữ đoán chừng.",
          tag: "BỘ MÁY TUÂN THỦ",
        },
        {
          month: "T6 2026",
          title: "Gói kiểm toán niêm phong và bản xuất Phụ lục IV",
          desc: "Báo cáo 24 trang có niêm phong SHA-256, tệp XML Phụ lục IV mà người khai báo của người mua cần, và một lệnh gửi thẳng O3CI — một lần xuất, ba đích đến.",
          tag: "BÁO CÁO & BÀN GIAO",
        },
        {
          month: "T5 2026",
          title: "Yêu cầu dữ liệu từ người mua",
          desc: "Bảng hỏi Scope 3 và CSRD từ người mua EU được trả lời từ chính dữ liệu nhà cung cấp bạn đã thu cho CBAM, thay vì một vòng email thứ hai.",
          tag: "THU THẬP DỮ LIỆU",
        },
        {
          month: "T5 2026",
          title: "Thu thập qua Smart Link, song ngữ",
          desc: "Một liên kết an toàn cho mỗi nhà cung cấp, không đăng nhập và không cần đào tạo, với toàn bộ biểu mẫu có hướng dẫn bằng tiếng Thái và tiếng Anh.",
          tag: "THU THẬP DỮ LIỆU",
        },
      ],
      building: [
        {
          title: "Không gian cho nhà nhập khẩu & người khai báo",
          desc: "Phía EU của cùng bộ dữ liệu: tổng hợp phát thải đã kiểm chứng của các nhà xuất khẩu, tính chứng chỉ và chuẩn bị tờ khai CBAM năm. Đang thử nghiệm nội bộ.",
          when: "MỤC TIÊU Q4 2026",
        },
        {
          title: "Hỗ trợ UK CBAM",
          desc: "Cơ chế của Anh bắt đầu từ tháng 1/2027 với bộ quy tắc và danh mục hàng riêng. Chúng tôi đang xây theo hướng dẫn đã công bố khi nó rõ dần.",
          when: "MỤC TIÊU Q1 2027",
        },
        {
          title: "Bàn giao cho đơn vị thẩm định",
          desc: "Một không gian chỉ đọc cho đơn vị thẩm định bên thứ ba, để một đợt thẩm định không biến thành một thư mục PDF gửi qua email.",
          when: "MỤC TIÊU Q4 2026",
        },
        {
          title: "Nhập từ ERP & bảng tính",
          desc: "Nhập hàng loạt sản phẩm và lô hàng, ánh xạ cột của bạn một lần rồi nhớ luôn, trước khi có API đầy đủ.",
          when: "MỤC TIÊU Q4 2026",
        },
      ],
      next: [
        {
          title: "EUDR — chống phá rừng",
          desc: "Dữ liệu định vị và thẩm định thu qua chính các liên kết nhà cung cấp.",
        },
        {
          title: "Mô-đun báo cáo CSRD",
          desc: "Báo cáo bền vững đầy đủ, không chỉ các bảng hỏi của người mua như hôm nay.",
        },
        {
          title: "Thêm ngôn ngữ cho nhà cung cấp",
          desc: "Tiếng Việt, tiếng Thổ Nhĩ Kỳ và tiếng Hindi — ba thị trường xuất khẩu tiếp theo sau Thái Lan.",
        },
        {
          title: "API công khai",
          desc: "Truy cập bằng chương trình tới tờ khai, hồ sơ gửi và bản xuất, cho đội có hệ thống riêng.",
        },
      ],
    },

    solutionPage: {
      whatYouGet: "BẠN NHẬN ĐƯỢC GÌ",
      closingHeadline: "Xem nó chạy trên chuỗi cung ứng của bạn.",
      closingIntro:
        "Buổi hướng dẫn 30 phút — từ lời mời nhà cung cấp đến báo cáo mà người mua dùng được ngay. Nhà cung cấp luôn miễn phí.",
      closingHeadlineSoon: "Muốn có ngay ngày nó mở?",
      closingIntroSoon:
        "Đăng ký chờ và chúng tôi sẽ liên hệ trước khi phần này chạy. Trong lúc đó, phía nhà xuất khẩu đã hoạt động hôm nay.",
      waitlist: {
        badge: "TRUY CẬP SỚM",
        headline: "Chưa mở.\nXếp hàng trước đi.",
        intro:
          "Để lại thông tin và chúng tôi sẽ liên hệ trước khi phần này của nền tảng mở — không bản tin, không chuỗi email tự động.",
        submit: "ĐĂNG KÝ CHỜ",
        note: "Một email khi nó mở. Không gì khác, và không bao giờ chia sẻ.",
        confirmedBadge: "BẠN ĐÃ TRONG DANH SÁCH",
        confirmedTitle: "Bạn đã trong danh sách.",
        confirmedBody: "Chúng tôi sẽ viết thư tới",
        confirmedTail:
          "trước khi phần này mở. Nếu bạn muốn xem phía nhà xuất khẩu đang chạy hôm nay, hãy đặt lịch demo.",
        errors: {
          required: "Bắt buộc",
          emailFormat: "Nhập một địa chỉ email hợp lệ",
          emailPersonal: "Hãy dùng email công ty của bạn",
          phoneDigits: "Nhập số điện thoại của bạn",
          phoneLength: "Kiểm tra lại số chữ số cho quốc gia này",
        },
      },
      exporters: {
        eyebrow: "CHO NHÀ XUẤT KHẨU",
        headline: "Chứng minh trước.\nTrước khi họ phải hỏi.",
        intro:
          "Mọi đối thủ trong lĩnh vực này đều bán cho người mua của bạn. Certrace được xây về phía bạn: thu dữ liệu nhà cung cấp một lần, tính ra định dạng EU yêu cầu, thấy nó tốn của bạn bao nhiêu, và giữ sẵn một báo cáo cho người mua — để câu trả lời có trước cả yêu cầu.",
      },
      suppliers: {
        eyebrow: "CHO NHÀ CUNG CẤP",
        headline: "Điền một lần.\nKhông phải điền lại.",
        intro:
          "Nhận một Smart Link, điền một biểu mẫu có hướng dẫn bằng tiếng của bạn trên mọi thiết bị, và được góp ý trước khi gửi. Câu trả lời lưu vào hồ sơ và điền sẵn cho mọi yêu cầu sau — kể cả yêu cầu từ một người mua khác.",
        benefitsHeadline: "Bạn thực sự phải làm gì.",
        benefitsIntro:
          "Một biểu mẫu, một lần. Mọi thứ bên dưới là những gì diễn ra quanh nó để bạn không bao giờ điền lại cùng một ô.",
        benefits: [
          {
            title: "Một liên kết, mọi thiết bị",
            desc: "Khách hàng gửi bạn một liên kết. Mở trên điện thoại trong túi và điền khi bạn rảnh — không có gì để tải, không có tài khoản nào phải tạo.",
            points: [
              "Không đăng nhập, không mật khẩu",
              "Dùng được trên điện thoại",
              "Dừng lại rồi quay lại sau",
            ],
          },
          {
            title: "Viết bằng ngôn ngữ của bạn",
            desc: "Tiếng Thái và tiếng Anh hôm nay, thêm nữa theo các thị trường chúng tôi mở. Mọi câu hỏi đều nói bằng lời dễ hiểu, kèm ghi chú giải thích ý nghĩa và tìm câu trả lời ở đâu.",
            points: [
              "Tiếng Thái và tiếng Anh ngay bây giờ",
              "Lời dễ hiểu, không phải văn quy định",
              "Mỗi câu hỏi có một gợi ý",
            ],
          },
          {
            title: "Điền một lần, dùng lại sau",
            desc: "Những gì bạn nhập lưu vào hồ sơ riêng và tự điền vào yêu cầu tiếp theo — kỳ báo cáo sau, và mọi khách hàng khác hỏi bạn cùng một điều.",
            points: [
              "Dùng lại qua các kỳ",
              "Dùng lại với khách hàng khác",
              "Vài phút thay vì cả buổi chiều",
            ],
          },
          {
            title: "Kiểm tra trước khi bạn gửi",
            desc: "Thiếu bằng chứng, sai đơn vị, một con số không khớp với phần còn lại — bắt được khi bạn còn đang điền, và được giải thích chứ không chỉ đánh dấu.",
            points: [
              "Bắt ngay khi bạn gõ",
              "Nói rõ phải sửa gì",
              "Không email qua lại",
            ],
          },
          {
            title: "Chỉ phần thay đổi mới mở lại",
            desc: "Nếu khách hàng yêu cầu chỉnh sửa, mọi thứ bạn đã làm đúng vẫn khoá nguyên. Bạn thấy đúng những ô nào đang mở và không phải động vào phần nào khác.",
            points: [
              "Phần còn lại vẫn đã gửi",
              "Một chỗ để xem yêu cầu",
              "Không bao giờ làm lại từ đầu",
            ],
          },
          {
            title: "Miễn phí, và chỉ họ thấy",
            desc: "Nhà cung cấp không bao giờ trả tiền cho Certrace, ở bất kỳ gói nào. Những gì bạn gửi chỉ khách hàng đã yêu cầu mới thấy — và vẫn là của bạn để dùng lại với bất kỳ ai khác.",
            points: [
              "Không tốn phí, không bao giờ",
              "Chỉ bên yêu cầu thấy được",
              "Của bạn để dùng lại",
            ],
          },
        ],
      },
      legal: {
        eyebrow: "CHO PHÁP CHẾ & TUÂN THỦ",
        headline: "Phê duyệt có tên.\nNhật ký kiểm toán đầy đủ.",
        intro:
          "Không gian riêng cho pháp chế và tuân thủ đang được xây. Khi mở, báo cáo chỉ gửi đi sau khi có người đứng tên phê duyệt — với đề xuất rà soát pháp lý tự động mỗi khi bộ máy phát hiện vượt trần giá trị mặc định hoặc một điểm bất thường, và mọi quyết định đều vào nhật ký kiểm toán.",
      },
      importers: {
        eyebrow: "CHO NHÀ NHẬP KHẨU",
        headline: "Không gian người khai báo\nphía EU. Sắp có.",
        intro:
          "Tổng hợp dữ liệu phát thải mà các nhà xuất khẩu của bạn đã gửi, chạy tính toán chứng chỉ, và nộp tờ khai CBAM năm — phía Người khai báo CBAM được uỷ quyền của cùng một quy trình, dựng trên chính bộ dữ liệu đã kiểm chứng mà nhà cung cấp điền vào.",
      },
    },
  };
}
