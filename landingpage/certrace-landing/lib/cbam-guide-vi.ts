import type { CbamGuide } from "./cbam-guide";

/* Vietnamese text for the CBAM knowledge hub.

   Registered names stay in English for the same reason they do in the Thai
   file — CBAM, EU ETS, CN Code, TARIC, Annex, SEE, Scope 1/2, EU Login are
   what Vietnamese exporters read in circulars and what they search for. */

export const CBAM_VI: CbamGuide = {
  hub: {
    eyebrow: "VỀ CBAM",
    headline: "Mọi điều CBAM đòi hỏi\nở nhà xuất khẩu, giải thích rõ.",
    intro:
      "Cơ chế điều chỉnh biên giới carbon của EU bước vào giai đoạn chính thức từ ngày 1 tháng 1 năm 2026. Mười hai hướng dẫn này nói rõ CBAM hiện yêu cầu gì, tốn bao nhiêu, và nhà xuất khẩu ngoài EU phải chứng minh những gì — viết cho nhà xuất khẩu là người tạo ra dữ liệu carbon, không phải nhà nhập khẩu EU là người nộp tờ khai.",
    searchLabel: "Tìm trong hướng dẫn",
    searchPlaceholder: "Tìm hướng dẫn CBAM…",
    allTopics: "Tất cả chủ đề",
    noResults: "Chưa có nội dung nào khớp với tìm kiếm này.",
    clear: "Xoá",
    readTime: "phút đọc",
    pillarLabel: "BẮT ĐẦU TỪ ĐÂY",
    updatedLabel: "Cập nhật",
  },
  article: {
    backToHub: "TẤT CẢ HƯỚNG DẪN CBAM",
    keyFacts: "Câu trả lời ngắn",
    onThisPage: "TRONG TRANG NÀY",
    faqHeading: "Những câu người ta thực sự hỏi",
    relatedHeading: "Đọc tiếp",
    updatedPrefix: "Cập nhật",
    readPrefix: "",
    ctaEyebrow: "ĐƯA VÀO THỰC TẾ",
    ctaHeadline: "Biết luật mới là nửa dễ.",
    ctaBody:
      "Nửa khó là biến cả chuỗi cung ứng thành dữ liệu carbon đã kiểm chứng, đầy đủ và đúng hạn mà người mua EU chấp nhận. Đó chính là toàn bộ công việc Certrace làm — một liên kết cho mỗi nhà cung cấp, phép tính CBAM chạy sẵn, và báo cáo sẵn sàng cho kiểm chứng viên hoàn tất trước khi có ai hỏi tới.",
    ctaPrimary: "DÙNG THỬ MIỄN PHÍ",
    ctaSecondary: "ĐẶT LỊCH DEMO",
  },

  articles: {
    "what-is-cbam": {
      title: "CBAM là gì, và điều gì đã thay đổi từ 1 tháng 1 năm 2026?",
      dek: "CBAM là giá carbon EU áp lên hàng nhập khẩu. Từ 1 tháng 1 năm 2026 nó không còn là bài tập báo cáo — nhà nhập khẩu EU nay phải mua và nộp lại chứng chỉ CBAM tương ứng với lượng phát thải hàm chứa trong hàng mà nhà xuất khẩu ngoài EU bán cho họ.",
      metaTitle: "CBAM là gì? Cơ chế điều chỉnh biên giới carbon của EU giải thích cho nhà xuất khẩu (2026)",
      metaDescription:
        "CBAM bước vào giai đoạn chính thức ngày 1/1/2026. Hướng dẫn dễ hiểu cho nhà xuất khẩu ngoài EU: CBAM là gì, bao gồm hàng nào, ai trả tiền, phải chứng minh gì, và các mốc thời gian đã có hiệu lực.",
      topic: "Cơ bản",
      keyFacts: [
        { label: "Tên đầy đủ", value: "Carbon Border Adjustment Mechanism" },
        { label: "Cơ sở pháp lý", value: "Regulation (EU) 2023/956" },
        { label: "Giai đoạn chính thức bắt đầu", value: "1 tháng 1 năm 2026" },
        { label: "Ngành trong phạm vi", value: "Sắt thép, nhôm, xi măng, phân bón, hydro, điện" },
        { label: "Ai mua chứng chỉ", value: "Nhà nhập khẩu EU (authorized CBAM declarant)" },
        { label: "Ai tạo ra dữ liệu", value: "Nhà sản xuất và xuất khẩu ngoài EU" },
        { label: "Hạn nộp tờ khai đầu tiên", value: "30 tháng 9 năm 2027, cho hàng nhập năm 2026" },
      ],
      sections: [
        {
          h: "Bản rút gọn một đoạn",
          p: [
            "CBAM buộc nhà nhập khẩu đưa một số mặt hàng vào Liên minh châu Âu phải trả đúng mức giá carbon mà một nhà máy châu Âu đã phải trả để làm ra chúng. Nhà nhập khẩu tính lượng khí nhà kính hàm chứa trong mỗi tấn hàng nhập, mua chứng chỉ CBAM để bù đắp, và nộp lại chứng chỉ mỗi năm một lần. Giá chứng chỉ bám theo Hệ thống mua bán phát thải EU (EU ETS).",
            "Cơ chế nhắm vào rò rỉ carbon — nguy cơ chính sách khí hậu châu Âu chỉ đơn giản đẩy sản xuất, và phát thải kèm theo, ra ngoài châu Âu. Dù nhà xuất khẩu ngoài EU có đồng tình với thiết kế đó hay không, tác động thực tế lên nhà xuất khẩu rất hẹp và rất cụ thể: con số phát thải của nhà xuất khẩu nay là một khoản mục chi phí trong bài toán mua hàng của nhà nhập khẩu EU.",
          ],
        },
        {
          h: "Điều gì thực sự thay đổi năm 2026",
          p: [
            "Từ tháng 10/2023 đến hết 2025, CBAM chạy giai đoạn chuyển tiếp. Nhà nhập khẩu báo cáo phát thải hàm chứa theo quý và không phải mua gì cả. Thiếu dữ liệu thì khó chịu nhưng vẫn qua được, và giá trị mặc định dùng thoải mái.",
            "Ngày 1/1/2026 giai đoạn chính thức bắt đầu. Ba thứ thay đổi cùng lúc:",
          ],
          list: [
            "Chứng chỉ trở thành thật. Phát thải hàm chứa trong hàng nhập từ 2026 trở đi phải được bù bằng chứng chỉ đã mua, nộp lại hằng năm.",
            "Kiểm chứng trở thành bắt buộc. Một con số phát thải thực chỉ có giá trị khi kiểm chứng viên được công nhận đã kiểm tra. Không kiểm chứng nghĩa là dùng giá trị mặc định.",
            "Giá trị mặc định trở nên đắt đỏ. EU cố ý đặt giá trị mặc định từ các cơ sở phát thải cao, nên rơi vào đó khiến nhà nhập khẩu EU tốn tiền — số tiền nhà nhập khẩu sẽ cố không tiêu với nhà xuất khẩu đã không để lại lựa chọn nào khác.",
          ],
          note: "Năm 2026 có một khoảng ân hạn: nhà nhập khẩu báo cáo hàng nhập 2026 nhưng chưa phải giữ chứng chỉ trong chính năm 2026. Việc mua mở từ tháng 2/2027 và lần nộp lại đầu tiên rơi vào 30/9/2027.",
        },
        {
          h: "Những mặt hàng nào trong phạm vi",
          p: [
            "Hiện có sáu ngành, xác định bằng CN Code chứ không phải tên sản phẩm — điều này quan trọng, vì hai mặt hàng nghe giống nhau có thể nằm hai bên ranh giới:",
          ],
          list: [
            "Sắt và thép — nhóm lớn nhất, và là nhóm mà phần lớn nhà xuất khẩu Đông Nam Á gặp đầu tiên",
            "Nhôm",
            "Xi măng",
            "Phân bón",
            "Hydro",
            "Điện",
          ],
        },
        {
          h: "Ai làm gì",
          p: [
            "Nghĩa vụ pháp lý thuộc về nhà nhập khẩu EU, và họ phải là authorized CBAM declarant thì mới nhập được hàng trong phạm vi. Họ đăng ký trong CBAM Registry, nộp tờ khai hằng năm, mua chứng chỉ và nộp lại.",
            "Nhưng dữ liệu không nằm ở phía nhà nhập khẩu. Chỉ nhà xuất khẩu biết lò của mình đốt bao nhiêu khí, điện dùng mang hệ số lưới nào, và những tiền chất nào đã đi vào phôi thép. Nên trên thực tế nghĩa vụ rơi xuống nhà xuất khẩu về mặt thương mại dù nó ràng buộc nhà nhập khẩu EU về mặt pháp lý: không có dữ liệu từ nhà xuất khẩu thì không có giá trị thực cho nhà nhập khẩu, và một giá trị mặc định đắt hơn con số đã kiểm chứng của nhà xuất khẩu đối thủ.",
            "Vì vậy nên đọc CBAM như một điều kiện thương mại hơn là một sắc thuế. Nó không cấm nhà xuất khẩu ngoài EU bán vào châu Âu. Nó thay đổi việc châu Âu muốn mua của nhà xuất khẩu nào hơn.",
          ],
        },
        {
          h: "Những gì nhà xuất khẩu phải tạo ra được",
          list: [
            "Giá trị phát thải hàm chứa riêng (SEE) trên mỗi tấn của từng mặt hàng, tách thành phát thải trực tiếp và — khi quy định yêu cầu — gián tiếp",
            "Lộ trình sản xuất đã dùng để làm ra hàng, và ranh giới hệ thống mà nhà xuất khẩu đã đo trong đó",
            "Mọi tiền chất đi vào một hàng hoá phức hợp, kèm khối lượng và phát thải hàm chứa của chính nó",
            "Bằng chứng giám sát: số công tơ, hoá đơn nhiên liệu, kết quả phân tích phòng thí nghiệm, hoá đơn điện, chứng chỉ kiểm định nhà máy",
            "Báo cáo kiểm chứng từ một kiểm chứng viên được công nhận",
            "Giá carbon nhà xuất khẩu đã trả trong nước, nếu muốn được khấu trừ",
          ],
          p: [
            "Không có mục nào kỳ lạ cả. Cái làm CBAM khó không phải bất kỳ mục đơn lẻ nào — mà là tạo ra tất cả, mỗi tháng, cho mọi nhà máy và mọi nhà cung cấp phía trên nhà xuất khẩu trong chuỗi, theo định dạng một kiểm chứng viên châu Âu được công nhận chấp nhận, trước khi nhà nhập khẩu EU hỏi.",
          ],
        },
      ],
      faq: [
        {
          q: "Nhà xuất khẩu có phải đăng ký với EU không?",
          a: "Không. Việc đăng ký trong CBAM Registry dành cho nhà nhập khẩu EU, những người phải là authorized CBAM declarant. Nhà sản xuất ngoài EU có thể được ghi nhận là đơn vị vận hành cơ sở và chia sẻ dữ liệu qua hệ thống, nhưng nghĩa vụ nộp hồ sơ vẫn thuộc về nhà nhập khẩu.",
        },
        {
          q: "Certrace hay bất kỳ nhà cung cấp nào có thể nộp tờ khai CBAM thay không?",
          a: "Không — và không nhà cung cấp nào có thể. Chỉ authorized CBAM declarant của người mua mới nộp được với Registry. Điều một nền tảng làm được là trao cho họ bộ dữ liệu đầy đủ, đã kiểm chứng, đúng định dạng để việc nộp là khả thi.",
        },
        {
          q: "Nếu nhà xuất khẩu đơn giản là không cung cấp dữ liệu thì sao?",
          a: "Về mặt pháp lý không có gì xảy ra với nhà xuất khẩu. Nhà nhập khẩu EU áp giá trị mặc định của EU, vốn được đặt cao có chủ ý, và trả nhiều hơn trên mỗi tấn khi mua của nhà xuất khẩu đó so với mua của đối thủ đã nộp số liệu kiểm chứng. Chênh lệch giá đó chính là cơ chế cưỡng chế.",
        },
        {
          q: "CBAM có áp lên hàng chỉ chứa ít thép không?",
          a: "Chưa. Hiện phạm vi là hàng hoá của sáu ngành. Từ 1/1/2028 Uỷ ban châu Âu đề xuất mở rộng sang khoảng 180 sản phẩm chế tạo hạ nguồn có tỷ lệ thép hoặc nhôm cao.",
        },
      ],
    },

    "cbam-key-dates": {
      title: "Mọi mốc thời gian CBAM từ nay đến tháng 9 năm 2027",
      dek: "Bán chứng chỉ mở từ tháng 2/2027, bốn đợt kiểm tra nắm giữ chạy suốt 2027, và tờ khai đầu tiên kèm nộp lại chứng chỉ rơi vào 30/9/2027 cho hàng nhập năm 2026.",
      metaTitle: "Thời hạn CBAM 2026–2027: các mốc chính, kiểm tra nắm giữ và tờ khai đầu tiên",
      metaDescription:
        "Toàn bộ dòng thời gian giai đoạn chính thức của CBAM: công bố giá theo quý năm 2026, mở bán chứng chỉ tháng 2/2027, các đợt kiểm tra nắm giữ 50% theo quý, và hạn 30/9/2027.",
      topic: "Thời hạn",
      keyFacts: [
        { label: "Giai đoạn chính thức bắt đầu", value: "1 tháng 1 năm 2026" },
        { label: "Mở bán chứng chỉ", value: "Tháng 2/2027, cho hàng nhập năm 2026" },
        { label: "Yêu cầu nắm giữ theo quý", value: "≥ 50% phát thải hàm chứa luỹ kế từ đầu năm" },
        { label: "Tờ khai + nộp lại đầu tiên", value: "30 tháng 9 năm 2027" },
        { label: "Năm báo cáo được bao gồm", value: "Năm dương lịch 2026" },
        { label: "Công bố giá năm 2026", value: "Theo quý · từ 2027 theo tuần" },
      ],
      sections: [
        {
          h: "Dòng thời gian theo thứ tự",
          table: {
            head: ["Khi nào", "Điều gì xảy ra"],
            rows: [
              ["1/1/2026", "Giai đoạn chính thức bắt đầu. Hàng nhập 2026 trong phạm vi, nhưng chưa phải giữ chứng chỉ trong năm 2026."],
              ["7/4/2026", "Công bố giá chứng chỉ CBAM quý 1/2026 — €75,36 mỗi tấn CO₂e."],
              ["6/7/2026", "Công bố giá quý 2/2026 — €75,28 mỗi tấn CO₂e."],
              ["5/10/2026", "Công bố giá quý 3/2026."],
              ["4/1/2027", "Công bố giá quý 4/2026."],
              ["Tháng 2/2027", "Mở bán chứng chỉ trên Common Central Platform cho authorized CBAM declarants, cho hàng nhập 2026."],
              ["Suốt 2027", "Công bố giá theo tuần thay cho theo quý."],
              ["Cuối quý 1/2027", "Kiểm tra nắm giữ lần đầu: phải bù ít nhất 50% phát thải hàm chứa luỹ kế của năm 2027."],
              ["Cuối quý 2/2027", "Kiểm tra lần hai, cùng ngưỡng 50%."],
              ["30/6/2027", "Mốc giữa năm trong lịch Uỷ ban đã công bố."],
              ["30/9/2027", "Nộp tờ khai CBAM và nộp lại chứng chỉ lần đầu, cho năm 2026. Cũng là kết thúc đợt kiểm tra nắm giữ quý 3/2027."],
              ["Cuối quý 4/2027", "Kiểm tra nắm giữ lần thứ tư."],
            ],
          },
        },
        {
          h: "Các đợt kiểm tra nắm giữ có ý nghĩa gì với nhà xuất khẩu",
          p: [
            "Kiểm tra nắm giữ theo quý là nghĩa vụ của nhà nhập khẩu EU, không phải của nhà xuất khẩu — nhưng nó thay đổi thời điểm nhà nhập khẩu cần số liệu của nhà xuất khẩu, và như thế trên thực tế nó thành việc của nhà xuất khẩu.",
            "Để giữ 50% phát thải luỹ kế vào cuối một quý, declarant phải biết con số đó là bao nhiêu. Họ không thể đợi đối chiếu cuối năm. Hãy chuẩn bị cho nhịp yêu cầu dữ liệu theo quý từ đầu 2027, và yêu cầu nghiêm túc đầu tiên sẽ đến vào quý 1/2027 chứ không phải sát hạn tháng 9.",
          ],
          note: "Đọc theo cách thực tế: một nhà nhập khẩu EU đến tháng 8/2027 mới phát hiện số liệu 2026 của nhà xuất khẩu chưa từng được kiểm chứng thì không còn thời gian sửa. Cuộc trao đổi quyết định dữ liệu của nhà xuất khẩu có dùng được hay không diễn ra trước hạn chót một năm.",
        },
        {
          h: "Vì sao 2026 có vẻ yên ắng mà thật ra không",
          p: [
            "Hàng nhập 2026 không kèm yêu cầu nắm giữ chứng chỉ trong năm 2026. Đó là sự nhẹ nhõm thật về dòng tiền của nhà nhập khẩu EU, và không hơn thế. Phát thải hàm chứa trong mọi lô nhà xuất khẩu giao năm nay vẫn đang được đếm, và nhà nhập khẩu sẽ trả vào 2027 ở mức giá không ai chiết khấu hồi tố được.",
            "Dữ liệu nhà xuất khẩu không thu năm 2026 thì không tạo lại được năm 2027. Số công tơ khí tháng 3/2026 hoặc tồn tại trong tháng 3/2026, hoặc không tồn tại — và kiểm chứng viên được công nhận sẽ không chấp nhận con số dựng lại từ trí nhớ. Năm yên ắng chính là năm nhà xuất khẩu phải thu thập.",
          ],
        },
        {
          h: "Cần sẵn sàng những gì, và khi nào",
          list: [
            "Ngay bây giờ — giám sát hằng tháng chạy cho mọi nhà máy và mọi mặt hàng trong phạm vi, lưu bằng chứng ngay khi phát sinh",
            "Ngay bây giờ — xác định đủ mọi nhà cung cấp tiền chất, đã gửi yêu cầu, và có đầu mối thực sự trả lời",
            "Quý 4/2026 — chốt trọn dữ liệu năm 2026 và ký duyệt nội bộ",
            "Quý 1/2027 — ký hợp đồng với kiểm chứng viên được công nhận; hàng đợi là có thật (xem hướng dẫn về kiểm chứng viên)",
            "Nửa đầu 2027 — hoàn tất kiểm chứng, để người mua vượt kiểm tra nắm giữ quý 1 và quý 2 bằng giá trị thực",
            "Trước 30/9/2027 — nhà nhập khẩu EU nộp hồ sơ bằng số liệu đã kiểm chứng của nhà xuất khẩu, thay vì giá trị mặc định của EU",
          ],
        },
      ],
      faq: [
        {
          q: "Tờ khai CBAM đầu tiên đến hạn khi nào?",
          a: "30 tháng 9 năm 2027, cho hàng nhập trong năm dương lịch 2026. Chứng chỉ cho lô hàng đó phải nộp lại cùng thời điểm.",
        },
        {
          q: "Năm 2026 có cần chứng chỉ không?",
          a: "Nhà xuất khẩu ngoài EU không bao giờ cần chứng chỉ — nhà nhập khẩu EU mới cần. Với hàng nhập 2026, nhà nhập khẩu không phải giữ trong năm 2026; việc mua mở từ tháng 2/2027.",
        },
        {
          q: "Quy tắc nắm giữ 50% là gì?",
          a: "Từ 2027, vào cuối mỗi quý một authorized CBAM declarant phải nắm giữ chứng chỉ CBAM bù ít nhất 50% phát thải hàm chứa của hàng đã nhập từ đầu năm đó.",
        },
        {
          q: "Giá chứng chỉ được công bố bao lâu một lần?",
          a: "Theo quý trong năm 2026, theo lịch đã công bố. Từ 2027 Uỷ ban chuyển sang giá trung bình theo tuần.",
        },
      ],
    },

    "cbam-certificate-price": {
      title: "Một chứng chỉ CBAM giá bao nhiêu, và ai định giá?",
      dek: "Một chứng chỉ bù một tấn CO₂e. Uỷ ban công bố €75,36 cho quý 1/2026 và €75,28 cho quý 2/2026, cả hai bám theo giá đấu giá EU ETS; quý 3 và quý 4/2026 được công bố ngày 5/10/2026 và 4/1/2027.",
      metaTitle: "Giá chứng chỉ CBAM 2026: €75,36 quý 1, €75,28 quý 2 và cách tính giá",
      metaDescription:
        "Chứng chỉ CBAM giá bao nhiêu năm 2026, Uỷ ban châu Âu tính từ giá đấu giá EU ETS ra sao, lịch công bố theo quý, và bước chuyển sang định giá theo tuần từ 2027.",
      topic: "Chi phí",
      keyFacts: [
        { label: "Một chứng chỉ bù gì", value: "1 tấn CO₂e phát thải hàm chứa" },
        { label: "Giá quý 1/2026", value: "€75,36 / tCO₂e (công bố 7/4/2026)" },
        { label: "Giá quý 2/2026", value: "€75,28 / tCO₂e (công bố 6/7/2026)" },
        { label: "Giá quý 3/2026", value: "Công bố ngày 5/10/2026" },
        { label: "Giá quý 4/2026", value: "Công bố ngày 4/1/2027" },
        { label: "Cơ sở tính", value: "Giá thanh toán đấu giá trung bình của EU ETS" },
        { label: "Từ năm 2027", value: "Giá trung bình theo tuần" },
      ],
      sections: [
        {
          h: "Lịch giá đã công bố năm 2026",
          table: {
            head: ["Quý", "Giá (€/tCO₂e)", "Công bố"],
            rows: [
              ["Quý 1/2026", "€75,36", "7/4/2026"],
              ["Quý 2/2026", "€75,28", "6/7/2026"],
              ["Quý 3/2026", "Chưa công bố", "5/10/2026"],
              ["Quý 4/2026", "Chưa công bố", "4/1/2027"],
            ],
          },
          note: "Quý 3 và quý 4/2026 chưa được công bố tại thời điểm viết. Bất kỳ con số nào được trích cho hai quý đó — với nhà xuất khẩu hay nhà nhập khẩu — đều là dự báo của ai đó, không phải giá của Uỷ ban.",
        },
        {
          h: "Con số này từ đâu ra",
          p: [
            "Chứng chỉ CBAM được định giá bằng đúng mức một nhà sản xuất châu Âu phải trả cho cùng một tấn CO₂. Cái neo đó là EU ETS: Uỷ ban lấy giá thanh toán trung bình của hạn ngạch EU ETS tại đấu giá và công bố thành giá chứng chỉ CBAM.",
            "Năm 2026 mức trung bình đó tính theo quý. Từ 2027 chuyển sang trung bình theo tuần, khiến chi phí nhập khẩu dịch chuyển theo thị trường carbon thay vì đứng yên ba tháng một lần.",
          ],
        },
        {
          h: "Theo quý rồi theo tuần — vì sao thay đổi này quan trọng",
          p: [
            "Với giá theo quý, người mua biết trước chi phí carbon mỗi tấn ba tháng và đưa được vào hợp đồng. Với giá theo tuần thì không, và họ sẽ đẩy sự biến động ấy đi đâu đó — thường là vào một điều khoản CBAM chuyển chênh lệch sang nhà cung cấp, hoặc vào việc ưu tiên nhà cung cấp có phát thải đã kiểm chứng thấp đến mức biến động thành nhỏ về giá trị tuyệt đối.",
            "Cả hai phản ứng đều tưởng thưởng cùng một thứ. Nếu SEE của một nhà xuất khẩu bằng một nửa nhà xuất khẩu đối thủ, mỗi lần giá dịch chuyển nhà nhập khẩu EU chỉ tốn một nửa khi mua của nhà xuất khẩu đó.",
          ],
        },
        {
          h: "Điều giá cả không nói ra",
          p: [
            "Giá chứng chỉ chỉ là một số hạng của chi phí. Số lượng chứng chỉ là số hạng còn lại, và đó là số hạng nhà xuất khẩu kiểm soát được. Trước khi đếm chứng chỉ, phép tính trừ đi phần phân bổ miễn phí mà một nhà sản xuất châu Âu được nhận và giá carbon nhà xuất khẩu đã trả trong nước.",
            "Vậy nên giá chứng chỉ tăng và tỷ lệ phân bổ miễn phí giảm đều nhân với cùng một thứ: phát thải trên mỗi tấn của nhà xuất khẩu. Đó mới là số hạng đáng đầu tư công sức, và là số hạng duy nhất thực sự nằm trong tay nhà xuất khẩu.",
          ],
        },
      ],
      faq: [
        {
          q: "Giá chứng chỉ CBAM năm 2026 là bao nhiêu?",
          a: "€75,36 mỗi tấn CO₂e cho quý 1/2026 và €75,28 cho quý 2/2026. Quý 3 công bố ngày 5/10/2026 và quý 4 ngày 4/1/2027.",
        },
        {
          q: "Ai trả tiền chứng chỉ CBAM?",
          a: "Nhà nhập khẩu EU, với tư cách authorized CBAM declarant. Chi phí thường về đến nhà xuất khẩu qua đàm phán giá hoặc một điều khoản CBAM trong hợp đồng.",
        },
        {
          q: "Nhà xuất khẩu ngoài EU có mua được chứng chỉ CBAM không?",
          a: "Không. Chứng chỉ chỉ bán qua Common Central Platform cho authorized CBAM declarants. Việc bán mở từ tháng 2/2027 cho hàng nhập 2026.",
        },
        {
          q: "Giá có tiếp tục tăng không?",
          a: "Nó theo thị trường đấu giá EU ETS nên dịch chuyển theo thị trường hơn là theo lịch. Cái có lịch là tỷ lệ phân bổ miễn phí, giảm hằng năm về 0% vào 2034 — điều đó làm chi phí thực tăng ngay cả khi giá chứng chỉ đứng yên.",
        },
      ],
    },

    "cbam-cost-formula": {
      title: "Công thức chi phí CBAM, từng số hạng một",
      dek: "Chi phí CBAM = giá chứng chỉ × (tổng phát thải hàm chứa − phân bổ miễn phí − giá carbon đã trả tại nước xuất xứ). Chỉ một trong các số hạng đó là thứ nhà xuất khẩu dịch chuyển được.",
      metaTitle: "Cách tính chi phí CBAM: giải thích công thức từng số hạng",
      metaDescription:
        "Phương trình chi phí CBAM bằng ngôn ngữ dễ hiểu — giá chứng chỉ, tổng phát thải hàm chứa, phân bổ miễn phí EU ETS (Benchmark × Free Allocation Rate × Cross-sectoral Correction Factor), và khoản khấu trừ giá carbon đã trả tại nước xuất xứ.",
      topic: "Chi phí",
      keyFacts: [
        { label: "Công thức", value: "Giá chứng chỉ × (Phát thải hàm chứa − Phân bổ miễn phí − Giá carbon đã trả)" },
        { label: "Phân bổ miễn phí", value: "Benchmark × Free Allocation Rate × Cross-sectoral Correction Factor" },
        { label: "Free Allocation Rate 2026", value: "97,5%, giảm về 0% vào năm 2034" },
        { label: "Cross-sectoral Correction Factor", value: "Do Uỷ ban công bố; thường bằng 1" },
        { label: "Giá carbon xuất xứ", value: "Chỉ khấu trừ nếu đã trả thật và kiểm chứng được" },
        { label: "Số hạng nhà xuất khẩu kiểm soát", value: "Phát thải hàm chứa trên mỗi tấn" },
      ],
      sections: [
        {
          h: "Phương trình",
          p: ["Rút về phần cốt lõi, chi phí nhà nhập khẩu EU gánh cho một tấn hàng của nhà xuất khẩu là:"],
          note: "Chi phí CBAM = Giá chứng chỉ CBAM (€/tCO₂e) × [ tổng phát thải hàm chứa (tCO₂) − phân bổ miễn phí hạn ngạch EU ETS (tCO₂) − giá carbon đã trả tại nước xuất xứ (tCO₂) ]",
        },
        {
          h: "Số hạng 1 — giá chứng chỉ",
          p: [
            "Do Uỷ ban châu Âu ấn định từ giá đấu giá EU ETS: €75,36 quý 1/2026, €75,28 quý 2/2026, theo quý suốt 2026 và theo tuần từ 2027. Không ai trong chuỗi cung ứng tác động được lên nó.",
          ],
        },
        {
          h: "Số hạng 2 — tổng phát thải hàm chứa",
          p: [
            "Lượng khí nhà kính hàm chứa trong một tấn hàng. Đây là con số đến từ cơ sở của nhà xuất khẩu, và là số hạng duy nhất trong phương trình nhà xuất khẩu thay đổi được.",
            "Nó có thể là giá trị thực — được đo, giám sát và kiểm chứng bởi kiểm chứng viên được công nhận — hoặc giá trị mặc định do EU công bố. Giá trị thực gần như luôn thấp hơn, vì các mặc định được đặt từ các cơ sở phát thải cao theo thiết kế.",
          ],
        },
        {
          h: "Số hạng 3 — phân bổ miễn phí",
          p: [
            "Nhà sản xuất châu Âu không trả giá ETS đầy đủ cho từng tấn; họ nhận một phần hạn ngạch miễn phí. CBAM khấu trừ phần tương đương, để nhà nhập khẩu không bị tính nhiều hơn mức nhà sản xuất trong nước thực trả. Được tính như sau:",
          ],
          list: [
            "Benchmark — giá trị tham chiếu của EU cho mặt hàng đó, thay đổi theo sản phẩm và theo việc nhà xuất khẩu dùng giá trị thực hay mặc định",
            "Free Allocation Rate — 97,5% năm 2026, giảm mỗi năm về 0% vào 2034",
            "Cross-sectoral Correction Factor — do Uỷ ban công bố, thường bằng 1",
          ],
          note: "Vì tỷ lệ phân bổ miễn phí giảm hằng năm theo lịch đã công bố, cùng một con số phát thải sẽ tốn nhiều hơn mỗi năm ngay cả khi giá chứng chỉ không nhúc nhích. Lịch đó là áp lực dự đoán được rõ nhất trong toàn bộ cơ chế.",
        },
        {
          h: "Số hạng 4 — giá carbon đã trả tại nước xuất xứ",
          p: [
            "Nếu nhà xuất khẩu thực sự đã trả một mức giá carbon trong nước — thuế carbon, hoặc một hệ thống mua bán phát thải — khoản đó được khấu trừ, để cùng một tấn không bị tính phí hai lần.",
            "Hai điều kiện rất chặt. Phải trả thật, không chỉ có luật, và phải kiểm chứng được. Một cơ chế tồn tại trên giấy, hay một khoản thu nhà xuất khẩu được miễn, khấu trừ bằng không.",
          ],
        },
        {
          h: "Công thức nói gì về chiến lược",
          p: [
            "Ba trong bốn số hạng được quyết ở Brussels. Giá chứng chỉ theo một thị trường nhà xuất khẩu không giao dịch, tỷ lệ phân bổ miễn phí theo một lịch không nhà xuất khẩu nào kháng nghị được, và khoản khấu trừ carbon xuất xứ phụ thuộc chính phủ nước xuất khẩu hơn là bản thân nhà xuất khẩu.",
            "Số hạng thứ tư là lò của nhà xuất khẩu, cơ cấu điện lưới, lộ trình sản xuất và tiền chất — và nó được nhân với tất cả phần còn lại. Giảm phát thải trên mỗi tấn, hoặc đơn giản là chứng minh con số thấp hơn mà nhà máy vốn đã đạt được, là toàn bộ chiến lược khả dụng của một nhà xuất khẩu.",
          ],
        },
      ],
      faq: [
        {
          q: "Chi phí CBAM được tính thế nào?",
          a: "Nhân giá chứng chỉ CBAM với phát thải hàm chứa của hàng hoá, sau khi trừ phân bổ miễn phí EU ETS và giá carbon đã trả tại nước xuất xứ.",
        },
        {
          q: "Tỷ lệ phân bổ miễn phí năm 2026 là bao nhiêu?",
          a: "97,5%. Giảm hằng năm theo lịch đã công bố — 95% năm 2027, 90% năm 2028, 77,5% năm 2029, 51,5% năm 2030, 39% năm 2031, 26,5% năm 2032, 14% năm 2033 và 0% từ 2034.",
        },
        {
          q: "Giá carbon trong nước có được khấu trừ không?",
          a: "Chỉ trong phạm vi giá carbon đã thực trả cho lượng phát thải đó và kiểm chứng được. Cơ chế tự nguyện, việc được miễn, hay luật chưa thi hành đều khấu trừ bằng không.",
        },
        {
          q: "Con số phát thải thấp hơn có giảm chi phí tương ứng không?",
          a: "Về cơ bản có, trong cùng cấu trúc khấu trừ — số hạng phát thải được nhân với giá chứng chỉ, nên giảm một nửa phát thải đã kiểm chứng trên mỗi tấn sẽ giảm khoảng một nửa chi phí chứng chỉ mà tấn đó gánh.",
        },
      ],
    },

    "cbam-free-allocation-phase-down": {
      title: "CBAM factor: phân bổ miễn phí từ 97,5% về 0",
      dek: "Tỷ lệ hạn ngạch EU ETS miễn phí được khấu trừ khỏi chi phí CBAM giảm hằng năm — 97,5% năm 2026, 51,5% năm 2030, 14% năm 2033 và không còn gì từ 2034. Chi phí carbon của nhà xuất khẩu tăng theo lịch đó dù giá chứng chỉ có dịch chuyển hay không.",
      metaTitle: "CBAM factor và lộ trình xoá phân bổ miễn phí 2026–2034: lịch đầy đủ",
      metaDescription:
        "CBAM factor quyết định bao nhiêu phần phân bổ miễn phí EU ETS được trừ khỏi chi phí CBAM. Lịch công bố chạy từ 97,5% năm 2026 đến 0% năm 2034 — ý nghĩa với nhà xuất khẩu khi lập hợp đồng và kế hoạch giảm phát thải.",
      topic: "Chi phí",
      keyFacts: [
        { label: "CBAM factor là gì", value: "Tỷ lệ phân bổ miễn phí EU ETS còn được khấu trừ, theo từng năm" },
        { label: "2026", value: "97,5%" },
        { label: "2030", value: "51,5%" },
        { label: "2033", value: "14%" },
        { label: "Từ 2034", value: "0% — không còn phân bổ miễn phí" },
        { label: "Cơ sở pháp lý", value: "Directive (EU) 2023/959, Điều 10a" },
      ],
      sections: [
        {
          h: "Lịch đã công bố",
          table: {
            head: ["Năm", "Phân bổ miễn phí / CBAM factor"],
            rows: [
              ["2026", "97,5%"],
              ["2027", "95%"],
              ["2028", "90%"],
              ["2029", "77,5%"],
              ["2030", "51,5%"],
              ["2031", "39%"],
              ["2032", "26,5%"],
              ["2033", "14%"],
              ["Từ 2034", "0%"],
            ],
          },
        },
        {
          h: "Nó thực sự làm gì",
          p: [
            "CBAM không tính tiền nhà nhập khẩu cho từng tấn phát thải hàm chứa. Nó trừ trước phần mà một nhà sản xuất châu Âu được nhận miễn phí theo EU ETS, để hai bên được đối xử như nhau. CBAM factor là tỷ lệ phần phân bổ miễn phí đó còn đang được khấu trừ trong một năm nhất định.",
            "Khi EU rút phân bổ miễn phí khỏi chính ngành của mình, họ rút khoản khấu trừ tương đương khỏi hàng nhập với cùng nhịp. Đến 2034 không còn phân bổ miễn phí ở cả hai phía và hàng nhập gánh trọn giá carbon.",
          ],
        },
        {
          h: "Hãy đọc đường cong, đừng chỉ đọc điểm cuối",
          p: [
            "Chỗ nguy hiểm nằm ở giữa. Từ 2029 đến 2031 hệ số rơi từ 77,5% xuống 39% — giảm khoảng một nửa trong hai năm. Một nhà xuất khẩu có biên lợi nhuận hấp thụ CBAM thoải mái năm 2026 có thể thấy không còn hấp thụ nổi vào 2030, trên đúng con số phát thải đó và đúng giá chứng chỉ đó.",
            "Đây là phần thực sự dự đoán được của CBAM, nên là phần thuộc về kế hoạch năm năm hơn là lịch tuân thủ. Hợp đồng ký bây giờ và kéo dài đến 2029 nên nói rõ ai gánh phần tăng thêm.",
          ],
          note: "Phép thử thực tế: nhà xuất khẩu nên chạy mức rủi ro chi phí hiện tại với hệ số 51,5%. Đó là năm 2030 trên phát thải hôm nay. Nếu câu trả lời làm thay đổi một quyết định thương mại, quyết định đó thuộc về kế hoạch năm nay, không phải năm đó.",
        },
        {
          h: "Hai đòn bẩy, và mỗi cái đáng giá bao nhiêu",
          list: [
            "Giảm phát thải — cắt số hạng mà hệ số được áp lên. Lãi kép mỗi năm, và càng có giá trị khi hệ số giảm.",
            "Dùng dữ liệu thực đã kiểm chứng thay cho giá trị mặc định — thường là thắng lợi lớn hơn và nhanh hơn, vì giá trị mặc định mang tính trừng phạt theo thiết kế, và chuyển sang con số đã kiểm chứng không cần chi đầu tư nào cả.",
          ],
          p: [
            "Phần lớn nhà xuất khẩu đã có sẵn đòn bẩy thứ hai trong tay mà chưa từng kéo. Phát thải vốn đã thấp hơn giá trị mặc định của EU; cái thiếu là giám sát, bằng chứng và kiểm chứng để biến một con số đúng thành một con số được chấp nhận.",
          ],
        },
      ],
      faq: [
        {
          q: "CBAM factor là gì?",
          a: "Tỷ lệ phân bổ miễn phí EU ETS còn được khấu trừ khi tính chi phí CBAM. Là 97,5% năm 2026 và giảm mỗi năm về 0% vào 2034.",
        },
        {
          q: "Khi nào phân bổ miễn phí biến mất hoàn toàn?",
          a: "Năm 2034. Từ năm đó hàng nhập trong phạm vi gánh trọn giá carbon mà không có khoản khấu trừ phân bổ miễn phí nào.",
        },
        {
          q: "Lộ trình giảm này ảnh hưởng nhà xuất khẩu hay chỉ nhà nhập khẩu?",
          a: "Về pháp lý nó thay đổi hoá đơn của nhà nhập khẩu. Về thương mại nó đến với nhà xuất khẩu, vì chi phí mua một tấn phát thải cao ngày càng tăng chính là thứ đẩy người mua đổi nhà cung cấp hoặc đàm phán lại.",
        },
      ],
    },

    "cbam-scope-2028-extension": {
      title: "CBAM bao gồm gì hôm nay — và 180 sản phẩm hạ nguồn sắp vào năm 2028",
      dek: "Sáu ngành đang trong phạm vi. Uỷ ban đề xuất mở rộng CBAM từ 1/1/2028 sang khoảng 180 hàng hoá chế tạo hạ nguồn có tỷ lệ thép hoặc nhôm cao — bu lông, bánh xe, lò sưởi, ống, cấu kiện kết cấu.",
      metaTitle: "Phạm vi CBAM 2026 và mở rộng hạ nguồn 2028: ngành, CN Code và 180 sản phẩm mới",
      metaDescription:
        "CBAM bao gồm hàng hoá nào trong giai đoạn chính thức, và đề xuất mở rộng năm 2028 sang khoảng 180 sản phẩm hạ nguồn có trung bình 79% thép hoặc nhôm. Nhà sản xuất nên làm gì ngay bây giờ.",
      topic: "Phạm vi",
      keyFacts: [
        { label: "Ngành trong phạm vi từ 1/1/2026", value: "Sắt thép, nhôm, xi măng, phân bón, hydro, điện" },
        { label: "Ngày mở rộng đề xuất", value: "1 tháng 1 năm 2028" },
        { label: "Sản phẩm sẽ thêm vào", value: "≈ 180 hàng hoá hạ nguồn" },
        { label: "Tỷ lệ thép hoặc nhôm trung bình", value: "≈ 79%" },
        { label: "Phạm vi xác định bằng", value: "CN Code — và với một số sản phẩm xi măng là TARIC Code 10 chữ số" },
      ],
      sections: [
        {
          h: "Phạm vi hiện tại",
          p: [
            "Từ khi giai đoạn chính thức bắt đầu ngày 1/1/2026, nhà nhập khẩu nguyên liệu thô và bán thành phẩm thuộc sáu ngành phải báo cáo phát thải hàm chứa và nộp lại chứng chỉ tương ứng:",
          ],
          list: ["Sắt và thép", "Nhôm", "Xi măng", "Phân bón", "Hydro", "Điện"],
          note: "Phạm vi được đặt theo mã hải quan, không phải mô tả. Nhà xuất khẩu nên kiểm tra CN Code trên chính hoá đơn thương mại của mình trước khi kết luận một mặt hàng nằm ngoài phạm vi — các mặt hàng gần nhau trong cùng họ sản phẩm thường nằm hai bên ranh giới.",
        },
        {
          h: "Đề xuất mở rộng năm 2028",
          p: [
            "Ranh giới hiện tại có một điểm yếu rõ ràng: nó bắt được cuộn thép nhưng không bắt được con bu lông làm từ cuộn thép ấy. Đó là lời mời chuyển một công đoạn gia công ra ngoài EU rồi nhập chi tiết thành phẩm về — tức là rò rỉ carbon đi vào bằng cửa hông.",
            "Vì vậy Uỷ ban đề xuất mở rộng CBAM từ 1/1/2028 sang khoảng 180 sản phẩm chế tạo hạ nguồn có tỷ lệ thép hoặc nhôm cao — trung bình khoảng 79% theo hàm lượng. Các ví dụ được nêu tên gồm:",
          ],
          list: [
            "Bu lông, đai ốc và vít",
            "Bánh xe và chi tiết",
            "Cửa đi và cửa sổ",
            "Lò sưởi (radiators)",
            "Cấu kiện kết cấu",
            "Ống và ống dẫn",
          ],
        },
        {
          h: "Vì sao đây mới là thay đổi lớn hơn với Đông Nam Á",
          p: [
            "Sáu ngành hiện tại tập trung ở một số tương đối ít các cơ sở lớn. Chế tạo hạ nguồn thì không: đó là hàng nghìn nhà gia công quy mô vừa, nhiều đơn vị chưa từng tính một con số phát thải và không tự coi mình là ngành thâm dụng carbon.",
            "Với những doanh nghiệp đó, mở rộng 2028 là một bước nhảy, và nó đến kèm một vấn đề thứ hai. Sản phẩm hạ nguồn là hàng hoá phức hợp: phát thải hàm chứa của nó phần lớn thừa hưởng từ thép hoặc nhôm đi vào. Lò của nhà gia công là phần nhỏ của câu trả lời, còn phần lớn phải thu từ nhà cung cấp — đúng bài toán dữ liệu mà các ngành thượng nguồn đang vật lộn hiện nay.",
          ],
        },
        {
          h: "Nên làm gì trước 2028",
          list: [
            "Đối chiếu CN Code của chính nhà xuất khẩu với danh mục đề xuất, và cả của khách hàng EU nữa — nhà xuất khẩu có thể ngoài phạm vi trong khi chi tiết thành phẩm họ giao vào lại nằm trong",
            "Bắt đầu ghi nhận dữ liệu phát thải của nhà cung cấp ngay bây giờ, kể cả không chính thức; nghĩa vụ 2028 cần một nền dữ liệu 2027",
            "Làm cho một nhà cung cấp thép hoặc nhôm trả lời đúng cách, như một thử nghiệm, trước khi nhà xuất khẩu cần hai mươi nhà cung cấp cùng làm",
            "Đưa điều khoản CBAM vào hợp đồng cung ứng mới để nghĩa vụ dữ liệu đi ngược lên chuỗi cùng đơn hàng",
          ],
        },
      ],
      faq: [
        {
          q: "CBAM bao gồm những ngành nào?",
          a: "Sắt thép, nhôm, xi măng, phân bón, hydro và điện, xác định theo CN Code.",
        },
        {
          q: "CBAM có mở rộng sang sản phẩm hạ nguồn không?",
          a: "Uỷ ban đề xuất mở rộng từ 1/1/2028 sang khoảng 180 hàng hoá chế tạo hạ nguồn có tỷ lệ thép hoặc nhôm cao, trung bình khoảng 79%.",
        },
        {
          q: "Làm sao nhà xuất khẩu biết sản phẩm có trong phạm vi?",
          a: "Theo CN Code, không phải theo tên. Một số sản phẩm xi măng đã chuyển sang TARIC Code 10 chữ số để phân biệt clinker trắng và clinker xám — cho thấy ranh giới có thể tinh đến mức nào.",
        },
      ],
    },
    "actual-vs-default-values": {
      title: "Giá trị thực và giá trị mặc định — và vì sao mặc định lại đắt",
      dek: "Một giá trị thực phải được đo và kiểm chứng bởi kiểm chứng viên được công nhận. Nếu nhà xuất khẩu không cung cấp được, nhà nhập khẩu EU phải dùng giá trị mặc định của EU — vốn được đặt từ những cơ sở kém nhất và còn cộng thêm mark-up.",
      metaTitle: "CBAM giá trị thực và giá trị mặc định: kiểm chứng, mark-up và cái giá của việc không có dữ liệu",
      metaDescription:
        "Vì sao giá trị mặc định CBAM mang tính trừng phạt theo thiết kế, cấu trúc giá trị mặc định Annex I–IV hoạt động ra sao, lịch mark-up 10%/20%/30%, và điều nhà xuất khẩu cần để đạt giá trị thực.",
      topic: "Dữ liệu",
      keyFacts: [
        { label: "Giá trị thực đòi hỏi", value: "Giám sát, bằng chứng và kiểm chứng bởi kiểm chứng viên được công nhận" },
        { label: "Nếu không có giá trị thực", value: "Áp dụng giá trị mặc định của EU" },
        { label: "Mặc định được đặt thế nào", value: "Từ các cơ sở phát thải cao hoặc kém nhất, theo thiết kế" },
        { label: "Mark-up trên giá trị mặc định", value: "10% cho 2026, 20% cho 2027, 30% từ 2028" },
        { label: "Ai cộng mark-up", value: "Hệ thống CBAM Registry, không phải bảng đã công bố" },
        { label: "Bảng giá trị mặc định", value: "Phụ lục I–IV của văn bản thi hành" },
      ],
      sections: [
        {
          h: "Nguyên tắc",
          p: [
            "Lập trường của CBAM rất rõ: phát thải phải được báo cáo bằng dữ liệu thực, đo được, đã kiểm chứng. Giá trị mặc định tồn tại như phương án dự phòng khi thực sự không lấy được dữ liệu đó — không phải một lựa chọn ngang hàng.",
            "Thiết kế khiến lập trường ấy có răng. Giá trị mặc định được lấy từ các cơ sở phát thải cao một cách có chủ ý, nên dùng nó không hề trung tính. Nó thổi phồng phát thải của nhà xuất khẩu một cách hệ thống, và do đó thổi phồng số chứng chỉ nhà nhập khẩu EU phải mua.",
          ],
          note: "Quy tắc trong một dòng: không có dữ liệu đã kiểm chứng nghĩa là dùng giá trị mặc định, và giá trị mặc định được thiết kế để tệ hơn sự thật với bất kỳ ai không nằm sẵn trong nhóm bẩn nhất ngành.",
        },
        {
          h: "Thế nào là một giá trị thực",
          list: [
            "Phát thải được giám sát theo một phương pháp có tài liệu, với ranh giới hệ thống xác định",
            "Lưu bằng chứng gốc cho từng con số — số công tơ, hoá đơn nhiên liệu và nhiệt trị, phân tích phòng thí nghiệm, hoá đơn điện",
            "Lộ trình sản xuất được khai báo và khớp với thứ nhà máy thực sự chạy",
            "Kiểm chứng bởi kiểm chứng viên được công nhận, đã đăng ký và được thừa nhận cho công việc CBAM",
          ],
          p: [
            "Yêu cầu kiểm chứng là chỗ vấp của phần lớn nhà xuất khẩu. Một con số tính đúng nội bộ, với đủ mọi chứng từ, vẫn là trường hợp giá trị mặc định cho tới khi một bên thứ ba được công nhận ký vào. Kiểm chứng không phải giấy tờ đính kèm con số — nó là thứ biến con số thành một giá trị thực.",
          ],
        },
        {
          h: "Giá trị mặc định đến từ đâu",
          p: ["EU công bố giá trị mặc định trong bốn phụ lục, mỗi phụ lục cho một trường hợp:"],
          table: {
            head: ["Phụ lục", "Bao gồm"],
            rows: [
              ["ANNEX I", "Hàng nhập vào lãnh thổ hải quan Liên minh, trừ điện"],
              ["ANNEX II", "Phát thải gián tiếp của hàng thuộc Phụ lục I của Regulation (EU) 2023/956 và không thuộc Phụ lục II của văn bản đó"],
              ["ANNEX III", "Điện nhập vào lãnh thổ hải quan Liên minh"],
              ["ANNEX IV", "Tiền chất không xác định được nước sản xuất"],
            ],
          },
        },
        {
          h: "Corrected Default Values và mark-up",
          p: [
            "EU đã hiệu chỉnh giá trị mặc định để sát thực tế hơn, và lần sửa này thay đổi hai điều đáng biết.",
            "Thứ nhất, độ chi tiết. Một số sản phẩm chuyển từ CN Code 8 chữ số sang TARIC Code 10 chữ số để tách những mặt hàng trước đây gộp chung — ví dụ clinker trắng và clinker xám, vốn dùng chung một CN Code dù phát thải khác nhau đáng kể.",
            "Thứ hai, cách trình bày. Bảng công bố nay chỉ đưa base default values. Mark-up không còn được tính sẵn vào bảng; hệ thống CBAM Registry cộng vào lúc nộp tờ khai, theo lịch tăng dần: 10% cho 2026, 20% cho 2027, 30% từ 2028 trở đi.",
          ],
          note: "Lịch đó cộng dồn với lộ trình giảm phân bổ miễn phí. Một giá trị mặc định năm 2028 mang mark-up 30% trong năm chỉ còn khấu trừ 90% phân bổ miễn phí — khoảng cách giữa con số đã kiểm chứng và giá trị mặc định rộng ra mỗi năm.",
        },
        {
          h: "Một ví dụ tính toán",
          p: [
            "Lấy một dòng sắt thép Thái Lan từ bảng ANNEX I đã công bố. Một mặt hàng có base total default value 1,190 tCO₂e mỗi tấn sẽ được khai ở 1,309 năm 2026 (mark-up 10%), 1,428 năm 2027 (20%) và 1,547 từ 2028 (30%). Không có gì trong nhà máy thay đổi cả; con số tăng 30% chỉ vì không có số liệu kiểm chứng nào được nộp.",
            "Nếu con số thực đã kiểm chứng của nhà máy là 0,9 tCO₂e mỗi tấn, chênh lệch đến 2028 là 0,647 tấn CO₂ trên mỗi tấn sản phẩm — mua ở mức giá chứng chỉ khoảng bảy mươi mấy euro, trên mọi tấn xuất đi.",
          ],
        },
        {
          h: "Ý nghĩa thực tế",
          list: [
            "Kiểm tra xem hàng hoá và quốc gia sản xuất của nhà xuất khẩu có xuất hiện trong bảng giá trị mặc định đã hiệu chỉnh không — một số lộ trình đã thay đổi",
            "Xác nhận lộ trình sản xuất ghi cho hàng của nhà xuất khẩu vẫn khớp với thứ nhà máy đang chạy",
            "Nếu một hợp đồng trích giá trị mặc định, hãy kiểm tra nó giả định mark-up của năm nào",
            "Coi kiểm chứng là thời gian chờ trong mua sắm, không phải thủ tục — đó là bước biến con số thật của nhà xuất khẩu thành con số nhà nhập khẩu EU dùng được",
          ],
        },
      ],
      faq: [
        {
          q: "Giá trị thực và giá trị mặc định trong CBAM khác nhau thế nào?",
          a: "Giá trị thực là con số phát thải ở cấp cơ sở của nhà xuất khẩu, đã được đo, giám sát và kiểm chứng độc lập bởi một kiểm chứng viên được công nhận. Giá trị mặc định là ước tính do EU công bố, nhà nhập khẩu dùng khi không có giá trị thực đã kiểm chứng — và được đặt cao có chủ ý.",
        },
        {
          q: "Mark-up giá trị mặc định CBAM là bao nhiêu?",
          a: "10% cho 2026, 20% cho 2027 và 30% từ 2028. Bảng công bố chỉ có giá trị gốc; hệ thống CBAM Registry cộng mark-up khi nộp tờ khai.",
        },
        {
          q: "Nhà xuất khẩu dùng tính toán của chính mình mà không cần kiểm chứng viên được không?",
          a: "Không, không với tư cách giá trị thực. Không có kiểm chứng bởi kiểm chứng viên được công nhận thì con số không đủ điều kiện, và giá trị mặc định được áp dụng.",
        },
        {
          q: "Giá trị mặc định có giống nhau ở mọi quốc gia không?",
          a: "Không. Bảng chia theo quốc gia và theo CN Code, và lần hiệu chỉnh còn chuyển một số sản phẩm sang TARIC Code 10 chữ số để tách những mặt hàng trước dùng chung một mã.",
        },
      ],
    },

    "precursors-20-percent-rule": {
      title: "Hàng hoá phức hợp, tiền chất và quy tắc 20% giá trị mặc định",
      dek: "Với một hàng hoá phức hợp, giá trị mặc định chỉ được chiếm tối đa 20% tổng phát thải hàm chứa từ tiền chất. Vượt ngưỡng là cả tờ khai không đạt tiêu chí — và giá trị mặc định đầy đủ áp lên toàn bộ sản phẩm chính.",
      metaTitle: "Tiền chất CBAM và quy tắc 20%: hàng hoá phức hợp, chuỗi cung ứng và vách đá",
      metaDescription:
        "CBAM xử lý hàng hoá phức hợp và tiền chất ra sao, trần 20% cho giá trị mặc định của phát thải tiền chất, điều gì xảy ra khi vượt trần, và cách thu dữ liệu tiền chất đã kiểm chứng ngược lên chuỗi.",
      topic: "Dữ liệu",
      keyFacts: [
        { label: "Hàng hoá phức hợp", value: "Hàng được sản xuất có dùng tiền chất trong phạm vi CBAM" },
        { label: "Giá trị mặc định cho tiền chất", value: "Tối đa 20% tổng phát thải hàm chứa" },
        { label: "Nếu vượt 20%", value: "Tờ khai không đạt tiêu chí và giá trị mặc định đầy đủ áp lên hàng chính" },
        { label: "Mục đích của khoản cho phép", value: "Cho các tiền chất nhỏ mà thực sự không lấy được dữ liệu nhà cung cấp" },
        { label: "Hệ quả thực tế", value: "Một nhà cung cấp lớn không trả lời có thể vô hiệu hoá giá trị thực của cả sản phẩm" },
      ],
      sections: [
        {
          h: "Hàng hoá phức hợp là gì",
          p: [
            "Hàng hoá đơn giản được làm ra không dùng tiền chất trong phạm vi. Hàng hoá phức hợp thì có dùng — phôi thép thành cuộn cán nóng, cuộn thành ống, và mỗi bước thừa hưởng phát thải hàm chứa của mọi thứ phía trên nó.",
            "Với hàng hoá phức hợp, phát thải hàm chứa không chỉ là thứ lò của nhà xuất khẩu thải ra. Nó là phát thải quá trình của chính nhà xuất khẩu cộng phát thải hàm chứa trong mọi tiền chất trong phạm vi mua từ nhà cung cấp và đưa vào tiêu thụ. Trong hầu hết chuỗi thép và nhôm, phần thừa hưởng chiếm ưu thế.",
          ],
        },
        {
          h: "Khoản cho phép 20%, và cách nó được dự định dùng",
          p: [
            "Quy định thừa nhận rằng nhà sản xuất không phải lúc nào cũng lấy được số liệu đã kiểm chứng từ mọi nhà cung cấp. Nên nó cho phép dùng giá trị mặc định cho tiền chất — tối đa 20% tổng phát thải hàm chứa của hàng hoá.",
            "Khoản cho phép này được thiết kế rõ ràng cho các tiền chất nhỏ: đầu vào lượng ít, từ nhà cung cấp quá xa trên chuỗi hoặc quá nhỏ để tạo dữ liệu kiểm chứng, nơi chi phí đeo bám lớn hơn giá trị của độ chính xác thu được. Nó không được thiết kế làm chất trám khe hở đa dụng.",
          ],
        },
        {
          h: "Vách đá",
          p: [
            "Đây là phần khiến nhà xuất khẩu bất ngờ. Vượt 20% không có nghĩa 25% phát thải là ước tính còn phần còn lại là thực. Nó có nghĩa tờ khai không còn thoả tiêu chí, và giá trị mặc định đầy đủ được áp cho toàn bộ sản phẩm chính — kể cả những phần nhà xuất khẩu đã đo đúng và kiểm chứng.",
            "Một nhà cung cấp lớn không trả lời vì thế có thể phá huỷ giá trị của cả một năm giám sát trên mọi thứ khác. Đây là quy tắc ngưỡng, không phải thang trượt, và không có điểm bán phần.",
          ],
          note: "Hãy thiết kế việc thu thập quanh cái ngưỡng, đừng quanh giá trị trung bình. Xếp hạng tiền chất theo tỷ trọng trong tổng phát thải hàm chứa và đeo bám theo thứ tự đó — bên đóng góp lớn nhất là bên quyết định cả sản phẩm có đạt hay không.",
        },
        {
          h: "Một bản ghi tiền chất thực sự cần gì",
          list: [
            "Nó là tiền chất nào, với tư cách một vật liệu, không phải một ghi chú văn bản tự do",
            "Lượng tiêu thụ trên mỗi tấn thành phẩm của nhà xuất khẩu",
            "Giá trị SEE của chính nó, và là giá trị thực hay mặc định",
            "Cơ sở đã sản xuất ra nó, và quốc gia",
            "Con số đó đã được kiểm chứng chưa, và bởi ai",
          ],
          p: [
            "Mô tả tiền chất bằng văn bản tự do là một trong những lý do phổ biến nhất khiến một bộ dữ liệu không dùng được. “Phôi từ nhà máy địa phương” là một câu; CBAM cần một dòng dữ liệu có cấu trúc, nhân được, cộng được và kiểm được.",
          ],
        },
        {
          h: "Thu thập ngược lên chuỗi",
          p: [
            "Điều khó nhất về tiền chất là nhà cung cấp của nhà xuất khẩu cũng có đúng vấn đề như nhà xuất khẩu, chỉ cao hơn một bậc — và nhà cung cấp có ít lý do hơn để giải quyết, vì họ không phải người sắp mất đơn hàng châu Âu.",
            "Ba điều làm nó chạy được trên thực tế. Hỏi bằng chính ngôn ngữ của nhà cung cấp, trong một biểu mẫu đủ ngắn để điền xong. Hỏi một lần rồi dùng lại câu trả lời, để người đã điền cho tháng Giêng không bị hỏi lại đúng câu đó vào tháng Hai. Và làm cho yêu cầu ấy có hiệu lực hợp đồng, để nó đi cùng đơn đặt hàng chứ không phụ thuộc thiện chí.",
            "Certrace tồn tại vì vòng lặp đó — hỏi, đeo bám, kiểm, dùng lại — là bài toán quy trình hơn là bài toán kế toán carbon, và nó không tự giải trong bảng tính.",
          ],
        },
      ],
      faq: [
        {
          q: "Quy tắc 20% của CBAM là gì?",
          a: "Với một hàng hoá phức hợp, giá trị mặc định không được chiếm quá 20% tổng phát thải hàm chứa từ tiền chất. Vượt ngưỡng thì tờ khai không đạt tiêu chí và giá trị mặc định đầy đủ áp lên toàn bộ sản phẩm chính.",
        },
        {
          q: "Cái gì được tính là tiền chất?",
          a: "Một đầu vào trong phạm vi được tiêu thụ để sản xuất hàng của nhà xuất khẩu — ví dụ gang, phôi hay cuộn cán nóng đi vào một sản phẩm thép hạ nguồn.",
        },
        {
          q: "Nếu một nhà cung cấp từ chối cung cấp dữ liệu thì sao?",
          a: "Nhà xuất khẩu có thể phủ họ bằng một giá trị mặc định nếu tỷ trọng của nhà cung cấp đó trong tổng phát thải hàm chứa vẫn ở dưới 20%. Nếu tỷ trọng lớn, cả sản phẩm rơi về giá trị mặc định.",
        },
        {
          q: "Hàng hoá đơn giản có cần dữ liệu tiền chất không?",
          a: "Không. Hàng hoá đơn giản được sản xuất không dùng tiền chất trong phạm vi, nên không có gì để thừa hưởng và không có gì phải thu ở phía trên.",
        },
      ],
    },

    "cbam-verifier-accreditation": {
      title: "Kiểm chứng viên CBAM được công nhận: họ là ai, và vì sao hàng đợi lại quan trọng",
      dek: "Chỉ kiểm chứng viên được công nhận mới biến con số phát thải của nhà xuất khẩu thành giá trị thực. Kiểm chứng viên bắt đầu đăng ký EU Login và CBAM Registry từ 1/9/2026, và nhu cầu từ nhà xuất khẩu ngoài EU đã vượt nguồn cung.",
      metaTitle: "Kiểm chứng CBAM: kiểm chứng viên được công nhận, cơ quan công nhận quốc gia và quy trình",
      metaDescription:
        "Kiểm chứng CBAM vận hành ra sao — công nhận qua các cơ quan công nhận quốc gia, kiểm chứng viên ngoài EU, quy trình từ kế hoạch giám sát đến báo cáo, và vì sao nhà xuất khẩu nên đặt chỗ sớm.",
      topic: "Kiểm chứng",
      keyFacts: [
        { label: "Đăng ký kiểm chứng viên mở", value: "1 tháng 9 năm 2026" },
        { label: "Được công nhận bởi", value: "Các cơ quan công nhận quốc gia (NABs) trong EU" },
        { label: "Kiểm chứng viên ngoài EU", value: "Nhiều NAB nhận hồ sơ từ kiểm chứng viên đặt ngoài EU" },
        { label: "Nền tảng", value: "CBAM Registry, dùng EU Login" },
        { label: "CBAM kiểm chứng gì", value: "Phát thải hàm chứa cấp sản phẩm, gồm quá trình sản xuất và tiền chất" },
        { label: "EU ETS kiểm chứng gì", value: "Phát thải cấp cơ sở bên trong EU" },
      ],
      sections: [
        {
          h: "Vì sao kiểm chứng là cửa ải",
          p: [
            "Mọi thứ trong CBAM giúp người mua tiết kiệm tiền đều đi qua kiểm chứng. Một con số đã đo mà chưa kiểm chứng bị coi như không có con số nào, và giá trị mặc định được áp. Không có điểm bán phần cho việc giám sát tốt.",
            "Điều đó biến năng lực kiểm chứng viên thành một đầu vào chuỗi cung ứng như mọi đầu vào khác — có thời gian chờ, có hàng đợi, và có mức giá tăng khi ai cũng cần cùng lúc.",
          ],
        },
        {
          h: "Công nhận vận hành thế nào",
          p: [
            "Kiểm chứng viên được công nhận bởi các cơ quan công nhận quốc gia trong EU. Từ 1/9/2026, kiểm chứng viên muốn làm công việc CBAM tạo tài khoản EU Login, đăng ký trong CBAM Registry, và nộp hồ sơ xin công nhận tới một cơ quan công nhận quốc gia.",
            "Điểm then chốt với nhà xuất khẩu: nhiều cơ quan quốc gia nhận hồ sơ từ kiểm chứng viên đặt ngoài EU, để năng lực kiểm chứng nằm gần các cơ sở cần kiểm chứng thay vì chỉ ở châu Âu. Lộ trình là: kiểm chứng viên nộp hồ sơ → cơ quan công nhận quốc gia đánh giá → được công nhận, làm việc qua CBAM Registry.",
          ],
        },
        {
          h: "Một cuộc kiểm chứng thực sự gồm những gì",
          list: [
            "Thẩm định kế hoạch giám sát — phương pháp có vững không, trước khi đo cả năm chứ không phải sau",
            "Đánh giá rủi ro — cơ sở này dễ sai ở đâu nhất",
            "Kiểm tra hiện trường — thanh tra thực tế nhà máy và các điểm đo",
            "Báo cáo — báo cáo và ý kiến kiểm chứng mà declarant dựa vào",
          ],
          p: [
            "Hai câu hỏi kỹ thuật chi phối phần giữa quy trình ấy: ngưỡng trọng yếu, quyết định một sai lệch phải lớn đến đâu mới đáng kể, và khoảng trống dữ liệu, quyết định kiểm chứng viên chấp nhận gì khi hồ sơ nhà máy không đầy đủ. Cả hai đều là phán đoán theo tiêu chí đã công bố, và cả hai đều thuận lợi hơn khi bằng chứng nền đã được sắp xếp.",
          ],
        },
        {
          h: "Kiểm chứng CBAM không phải kiểm chứng EU ETS",
          p: [
            "Một giả định phổ biến và tốn kém là kiểm chứng viên có kinh nghiệm ETS chỉ việc áp dụng cùng cách làm. Hai thứ khác nhau ở chỗ nhìn vào cái gì.",
            "EU ETS kiểm chứng phát thải cấp cơ sở, bên trong EU. CBAM kiểm chứng phát thải hàm chứa cấp sản phẩm cho các cơ sở ở nước thứ ba — nghĩa là kiểm chứng viên phải đi theo ranh giới của một quá trình sản xuất cụ thể và các tiền chất đi vào nó, chứ không chỉ tổng phát thải ống khói của nhà máy.",
          ],
        },
        {
          h: "Vì sao nên đi sớm",
          p: [
            "Tín hiệu nhu cầu đã rõ: nhà xuất khẩu ngoài EU cần kiểm chứng, số kiểm chứng viên được công nhận là hữu hạn, và hạn nộp tờ khai CBAM đầu tiên 30/9/2027 dồn nhu cầu vào một cửa sổ hẹp trong nửa đầu 2027.",
            "Một kiểm chứng viên ký hợp đồng vào quý 4/2026 hay quý 1/2027 có thời gian thẩm định kế hoạch giám sát trước khi năm khép lại — thời điểm rẻ nhất để phát hiện vấn đề. Một kiểm chứng viên ký giữa 2027 đang bị yêu cầu kiểm toán một năm đã đóng, dựa trên hồ sơ họ không có tiếng nói gì, với hạn chót ngay sau lưng.",
          ],
          note: "Hướng dẫn của DG TAXUD nói thẳng về xu hướng này: kiểm chứng viên xin công nhận sớm sẽ sẵn sàng hơn và có lợi thế phục vụ khách hàng trên thị trường toàn cầu. Đọc từ phía nhà xuất khẩu, đó là một lời cảnh báo về hàng đợi.",
        },
      ],
      faq: [
        {
          q: "Ai được kiểm chứng dữ liệu phát thải CBAM?",
          a: "Chỉ kiểm chứng viên được một cơ quan công nhận quốc gia trong EU công nhận và đã đăng ký trong CBAM Registry. Kiểm chứng viên đặt ngoài EU cũng có thể được công nhận.",
        },
        {
          q: "Công nhận kiểm chứng viên CBAM mở khi nào?",
          a: "Ngày 1/9/2026, khi kiểm chứng viên bắt đầu tạo tài khoản EU Login và đăng ký trong CBAM Registry.",
        },
        {
          q: "Kiểm chứng CBAM khác EU ETS thế nào?",
          a: "EU ETS kiểm chứng phát thải cấp cơ sở trong EU. CBAM kiểm chứng phát thải hàm chứa cấp sản phẩm tại các cơ sở nước thứ ba, đi theo quá trình sản xuất và tiền chất.",
        },
        {
          q: "Kiểm chứng mất bao lâu?",
          a: "Tuỳ cơ sở, nhưng hãy coi đó là hạng mục có thời gian chờ chứ không phải thủ tục — thẩm định kế hoạch giám sát, đánh giá rủi ro, kiểm tra hiện trường và báo cáo là các bước riêng, và năng lực có hạn khi tiến gần hạn 2027.",
        },
      ],
    },

    "cbam-cost-thai-steel": {
      title: "CBAM thực sự tốn bao nhiêu trên mỗi tấn thép",
      dek: "Ở mức €75 mỗi tấn CO₂ và 3 tCO₂ mỗi tấn thép, chi phí carbon vào khoảng 9.000 baht một tấn — chừng 36% của mức giá thép 25.000 baht. Giảm một nửa phát thải thì còn 4.500 baht, khoảng 16%.",
      metaTitle: "Chi phí CBAM trên mỗi tấn thép: ví dụ tính toán ở 3,0 và 1,5 tCO₂/tấn",
      metaDescription:
        "Một ví dụ tính chi phí CBAM cho nhà xuất khẩu thép — chi phí carbon mỗi tấn ở hai mức cường độ phát thải, đặt cạnh giá thép nội địa, và hàm ý cho năng lực cạnh tranh.",
      topic: "Chi phí",
      keyFacts: [
        { label: "Giá CBAM giả định", value: "€75 / tCO₂ ≈ 3.000 baht (ở mức ~40 baht mỗi euro)" },
        { label: "Trường hợp cường độ cao", value: "SEE 3,0 tCO₂/tấn → 9.000 baht mỗi tấn thép" },
        { label: "So với giá thép 25.000 baht", value: "≈ 36%" },
        { label: "Trường hợp cường độ thấp hơn", value: "SEE 1,5 tCO₂/tấn → 4.500 baht mỗi tấn" },
        { label: "So với giá thép 28.000 baht", value: "≈ 16%" },
        { label: "Con số này là gì", value: "Gross Carbon Exposure, trước Benchmark, phân bổ miễn phí và CBAM factor" },
      ],
      sections: [
        {
          h: "Phép tính",
          p: [
            "Phép tính cố ý đơn giản: chi phí carbon mỗi tấn sản phẩm = giá chứng chỉ CBAM × phát thải hàm chứa riêng.",
            "Ở giá chứng chỉ €75 mỗi tấn CO₂ — khoảng 3.000 baht ở tỷ giá gần 40 baht một euro — kết quả như sau.",
          ],
          table: {
            head: ["", "Cường độ cao", "Cường độ thấp hơn"],
            rows: [
              ["Phát thải hàm chứa riêng", "3,0 tCO₂ / tấn thép", "1,5 tCO₂ / tấn thép"],
              ["Chi phí carbon", "9.000 baht / tấn", "4.500 baht / tấn"],
              ["Giá thép tham chiếu", "≈ 25.000 baht / tấn", "≈ 28.000 baht / tấn"],
              ["Giá đã gồm carbon", "34.000 baht / tấn", "32.500 baht / tấn"],
              ["Carbon chiếm bao nhiêu trong giá thép", "≈ 36%", "≈ 16%"],
            ],
          },
        },
        {
          h: "So sánh đó thực sự nói gì",
          p: [
            "Ở ba tấn CO₂ mỗi tấn thép, carbon chiếm khoảng một phần ba giá trị sản phẩm. Đó không phải chi phí tuân thủ để nuốt vào ngân sách hành chính — đó là thay đổi vị thế cạnh tranh của chính hàng hoá.",
            "Cột thứ hai mới thú vị. Giảm một nửa cường độ phát thải không giảm một nửa tổng chi phí giao hàng, nhưng đưa carbon từ khoảng một phần ba giá xuống khoảng một phần sáu. Hai nhà máy bán thép giống hệt nhau về vật lý nay chào hai mức giá đến tay khác nhau đáng kể cho cùng một người mua châu Âu.",
          ],
        },
        {
          h: "Đọc kỹ các lưu ý",
          p: [
            "Những con số này là Gross Carbon Exposure. Chúng cố ý không trừ CBAM Benchmark, phân bổ miễn phí hay CBAM factor, và không trừ bất kỳ giá carbon nào đã trả trong nước.",
            "Áp các khoản khấu trừ đó làm con số thấp xuống trong năm 2026, khi tỷ lệ phân bổ miễn phí là 97,5%. Nó giảm ít hơn nhiều vào 2030 ở mức 51,5%, và không giảm chút nào từ 2034. Vậy hãy coi con số gross là nơi việc này đang đi tới, và con số ròng là nơi nó đang đứng hôm nay.",
          ],
          note: "Tỷ giá dùng ở đây là khoảng 40 baht một euro. Cả giá chứng chỉ lẫn tỷ giá đều dịch chuyển; tỷ lệ giữa một nhà máy cường độ cao và một nhà máy cường độ thấp thì không.",
        },
        {
          h: "Hai cách thay đổi câu trả lời",
          list: [
            "Giảm phát thải — lộ trình EAF thay vì BF-BOF, điện sạch hơn, hiệu suất quá trình tốt hơn. Thật, chậm, cần vốn, và là cách sửa vĩnh viễn duy nhất.",
            "Chứng minh mức phát thải nhà máy vốn đã có — giám sát, bằng chứng, kiểm chứng. Nhanh, rẻ hơn nhiều khi so sánh, và với phần lớn nhà xuất khẩu là khoản tiết kiệm tức thời lớn hơn, vì phương án thay thế không phải con số thật của nhà xuất khẩu mà là một giá trị mặc định mang tính trừng phạt.",
          ],
          p: [
            "Phần lớn nhà máy không ở mức ba tấn trên mỗi tấn. Nhưng không có dữ liệu đã kiểm chứng thì đó không phải con số mà người mua được dùng — và giá trị mặc định được chọn chính xác để không hề đẹp đẽ.",
          ],
        },
      ],
      faq: [
        {
          q: "CBAM tốn bao nhiêu trên mỗi tấn thép?",
          a: "Ở €75 mỗi tấn CO₂, khoảng 9.000 baht mỗi tấn thép ở mức 3,0 tCO₂/tấn, hoặc 4.500 baht ở mức 1,5 tCO₂/tấn — tương ứng khoảng 36% và 16% của một mức giá thép điển hình.",
        },
        {
          q: "Đó có phải chi phí cuối cùng không?",
          a: "Không. Đó là Gross Carbon Exposure trước khi trừ CBAM Benchmark, phân bổ miễn phí, CBAM factor và giá carbon đã trả tại nước xuất xứ. Các khoản khấu trừ đó thu hẹp hằng năm đến khi biến mất vào 2034.",
        },
        {
          q: "Thực tế ai trả?",
          a: "Nhà nhập khẩu EU mua chứng chỉ. Trên thực tế chi phí được đàm phán trở lại vào giá mua, hoặc là lý do đơn hàng chuyển sang một nhà cung cấp phát thải thấp hơn.",
        },
      ],
    },

    "cbam-vs-uk-us": {
      title: "So sánh EU CBAM, UK CBAM và các đề xuất của Mỹ",
      dek: "EU vận hành hệ thống chứng chỉ bắt đầu từ tháng 1/2026. Anh khởi động cơ chế dạng thuế vào tháng 1/2027. Mỹ có hai dự luật. Công cụ khác nhau, nhưng cùng một đòi hỏi: dấu chân carbon sản phẩm kiểm chứng được.",
      metaTitle: "EU CBAM vs UK CBAM vs US CCA và PROVE IT: so sánh các biện pháp carbon biên giới",
      metaDescription:
        "So sánh các biện pháp điều chỉnh carbon biên giới — chứng chỉ EU CBAM, UK CBAM dạng thuế từ 2027, Clean Competition Act và PROVE IT Act của Mỹ, cùng Canada, Đài Loan và Úc.",
      topic: "Quốc tế",
      keyFacts: [
        { label: "EU CBAM", value: "Giai đoạn chính thức từ 1/1/2026; mua và nộp lại chứng chỉ" },
        { label: "UK CBAM", value: "Bắt đầu 1/1/2027; dạng thuế, do HMRC quản lý" },
        { label: "Ngưỡng đăng ký của Anh", value: "50.000 bảng hàng nhập trong phạm vi mỗi năm" },
        { label: "Mỹ", value: "Clean Competition Act và PROVE IT Act — đều còn là dự luật" },
        { label: "Canada", value: "Đang xem xét điều chỉnh carbon biên giới; mục tiêu giá carbon 170 CAD/tCO₂e vào 2030" },
        { label: "Mẫu số chung", value: "Một dấu chân carbon sản phẩm đáng tin và kiểm chứng được" },
      ],
      sections: [
        {
          h: "Đặt cạnh nhau",
          table: {
            head: ["", "EU CBAM", "UK CBAM", "US CCA (dự thảo)"],
            rows: [
              ["Năm bắt đầu", "2026", "2027", "Đang xem xét"],
              ["Hình thức", "Mua và nộp lại chứng chỉ", "Thuế nhập khẩu carbon (Tax Rate)", "Phí biên giới so với Benchmark"],
              ["Cơ quan quản lý", "Uỷ ban châu Âu / cơ quan quốc gia", "HMRC", "Hải quan / Bộ Tài chính Mỹ (đề xuất)"],
              ["Phạm vi phát thải", "Trực tiếp (Scope 1) + gián tiếp (Scope 2)", "Trực tiếp + gián tiếp", "Scope 1, 2 và một phần Scope 3"],
              ["Kiểm chứng", "Bắt buộc bên thứ ba được công nhận", "Dữ liệu thực đã kiểm chứng hoặc giá trị mặc định của nhà nước", "Theo chuẩn cơ quan nhà nước"],
            ],
          },
        },
        {
          h: "EU CBAM",
          p: [
            "Ở giai đoạn chính thức từ 1/1/2026, sau giai đoạn chuyển tiếp 2023–2025. Sáu ngành trong phạm vi, với sản phẩm hạ nguồn đang được cân nhắc cho 2028. Nhà nhập khẩu mua và nộp lại chứng chỉ theo phát thải hàm chứa; giá tham chiếu trung bình quý của EU ETS, chuyển sang theo tuần. Giá carbon đã trả tại nước xuất xứ được khấu trừ. Scope 1 và, với một số hàng, Scope 2 phải được kiểm chứng bởi kiểm chứng viên được công nhận. Tờ khai đầu tiên cho 2026: 30/9/2027.",
          ],
        },
        {
          h: "UK CBAM",
          p: [
            "Bắt đầu 1/1/2027, bao gồm năm ngành — sắt thép, nhôm, xi măng, phân bón và hydro. Thuỷ tinh và gốm sứ được đưa ra khỏi phạm vi ban đầu.",
            "Hình thức là thuế chứ không phải thị trường chứng chỉ: một khoản thuế nhập khẩu carbon do HMRC quản lý, với mức CBAM theo quý tham chiếu UK ETS cùng Carbon Price Support. Có ngưỡng đăng ký 50.000 bảng hàng nhập trong phạm vi mỗi năm, và nhà nhập khẩu được dùng dữ liệu thực đã kiểm chứng hoặc giá trị mặc định do chính phủ ấn định.",
          ],
        },
        {
          h: "Hoa Kỳ",
          p: [
            "Hai dự luật, chưa cái nào được ban hành. Clean Competition Act sẽ áp một khoản phí carbon biên giới bằng cách so cường độ carbon của hàng nhập với một mức nền của Mỹ, thu phần chênh khi hàng nhập cao hơn. PROVE IT Act trước hết xây dựng dữ liệu nền: một nghiên cứu so sánh cường độ carbon cấp sản phẩm giữa hàng Mỹ và hàng của các đối tác thương mại, làm cơ sở thực tế cho bất kỳ biện pháp nào trong tương lai.",
          ],
        },
        {
          h: "Những nơi khác",
          list: [
            "Canada — đang cân nhắc điều chỉnh carbon biên giới, cùng giá carbon nội địa tăng dần tới 170 CAD/tCO₂e vào 2030",
            "Đài Loan — đã bắt đầu thu phí carbon nội địa, đang nghiên cứu cơ chế điều chỉnh biên giới",
            "Úc — đang rà soát Safeguard Mechanism và chuẩn bị cho nhà xuất khẩu",
          ],
        },
        {
          h: "Điều quan trọng với nhà xuất khẩu",
          p: [
            "Các công cụ khác nhau — chứng chỉ ở đây, thuế ở kia, phí so với benchmark ở chỗ khác — và khác biệt đó cực kỳ quan trọng với nhà nhập khẩu phải tuân thủ. Nó ít quan trọng hơn nhiều với nhà xuất khẩu là bên cung cấp dữ liệu.",
            "Mọi cơ chế trong số này đều hỏi hàng hoá cùng một câu: dấu chân carbon đã kiểm chứng của sản phẩm này trên mỗi đơn vị là bao nhiêu, theo một chuẩn mà ai đó đáng tin sẽ đứng ra bảo đảm? Nhà xuất khẩu xây một lần là trả lời được tất cả. Nhà xuất khẩu xây như một việc tuân thủ EU làm một lần rồi thôi sẽ phải xây lại cho Anh vào 2027, và lại lần nữa cho bất cứ điều gì Mỹ ban hành.",
          ],
          note: "Đây là lý do nên coi dữ liệu carbon cấp sản phẩm là hạ tầng chứ không phải giấy tờ. Quy định sẽ liên tục đổi hình; bộ dữ liệu nền mà tất cả đều muốn thì không.",
        },
      ],
      faq: [
        {
          q: "UK CBAM bắt đầu khi nào?",
          a: "1/1/2027. Bao gồm sắt thép, nhôm, xi măng, phân bón và hydro, vận hành như một sắc thuế do HMRC quản lý chứ không phải thị trường chứng chỉ.",
        },
        {
          q: "UK CBAM khác EU CBAM thế nào?",
          a: "EU bán chứng chỉ để nhà nhập khẩu nộp lại; Anh thu thuế nhập khẩu carbon theo mức quý. Anh còn đặt ngưỡng đăng ký 50.000 bảng, điều EU không có.",
        },
        {
          q: "Mỹ đã có CBAM chưa?",
          a: "Chưa. Clean Competition Act và PROVE IT Act đều là dự luật — một đề xuất phí carbon biên giới, một đề xuất bộ dữ liệu so sánh cường độ carbon làm nền cho nó.",
        },
        {
          q: "Một bộ dữ liệu có đáp ứng được tất cả không?",
          a: "Phần lớn là có, nếu xây đúng cách: một dấu chân carbon cấp sản phẩm đã kiểm chứng, có ranh giới ghi chép rõ và bằng chứng được lưu, là yêu cầu chung của mọi cơ chế công bố tới nay.",
        },
      ],
    },

    "cbam-exporter-action-plan": {
      title: "Năm cách CBAM thay đổi cuộc chơi của nhà xuất khẩu ngoài EU — và làm gì với từng cái",
      dek: "Cường độ carbon thành yếu tố cạnh tranh, dữ liệu phát thải thành điều kiện thương mại, MRV thành chi phí thường xuyên, giá carbon trong nước thành tài sản, và lách luật thành rủi ro pháp lý nghiêm trọng.",
      metaTitle: "CBAM cho nhà xuất khẩu ngoài EU: năm tác động và kế hoạch hành động thực tế",
      metaDescription:
        "CBAM định hình lại năng lực cạnh tranh, hợp đồng, chi phí MRV, giá carbon nội địa và rủi ro lách luật đối với nhà xuất khẩu ngoài EU — kèm ba hướng ứng phó cụ thể.",
      topic: "Chiến lược",
      keyFacts: [
        { label: "Tác động 1", value: "Năng lực cạnh tranh nay bám theo cường độ carbon" },
        { label: "Tác động 2", value: "Dữ liệu phát thải thành điều kiện thương mại" },
        { label: "Tác động 3", value: "MRV và kiểm toán thành chi phí thường xuyên" },
        { label: "Tác động 4", value: "Giá carbon nội địa kiểm chứng được thì khấu trừ được" },
        { label: "Tác động 5", value: "Lách luật bị phạt tới năm lần số phải nộp" },
        { label: "Hướng ứng phó", value: "Dữ liệu phát thải thực · kiểm chứng được công nhận · kế hoạch giảm phát thải" },
      ],
      sections: [
        {
          h: "1 — Cạnh tranh chuyển sang cường độ carbon",
          p: [
            "CO₂ trên mỗi tấn cao hơn nghĩa là chi phí tới cửa khẩu EU cao hơn, và người mua châu Âu nhìn nó như chênh lệch giá chứ không phải một thống kê môi trường. Lộ trình sản xuất phát thải thấp hơn — ví dụ lò hồ quang điện thay cho BF-BOF — mang gánh nặng CBAM thấp hơn đáng kể và trở thành lựa chọn đầu tiên của nhà nhập khẩu EU.",
            "Nhà xuất khẩu nên làm gì: biết cường độ phát thải theo từng dòng sản phẩm, tính bằng tCO₂e mỗi tấn, và biết nó so ra sao với giá trị mặc định EU cho cùng CN Code. Nhà xuất khẩu không nói được cả hai thì không đàm phán giá với nhà nhập khẩu được.",
          ],
        },
        {
          h: "2 — Dữ liệu phát thải thành điều kiện thương mại",
          p: [
            "Không có dữ liệu thực nghĩa là dùng giá trị mặc định EU cộng mark-up 10% cho 2026, tăng lên 20% rồi 30%. Nhà nhập khẩu đã bắt đầu viết điều khoản CBAM vào hợp đồng, buộc công bố dấu chân carbon sản phẩm và giữ quyền định giá lại hoặc huỷ nếu dữ liệu không về đúng hạn.",
            "Nhà xuất khẩu nên làm gì: đọc kỹ mọi hợp đồng EU mới để tìm điều khoản CBAM trước khi ký, và bảo đảm hạn ghi trong đó là hạn quy trình thu thập của chính nhà xuất khẩu thực sự đáp ứng được. Một điều khoản nhà xuất khẩu không đáp ứng nổi là một quyền định giá lại đã trao cho nhà nhập khẩu.",
          ],
        },
        {
          h: "3 — MRV thành chi phí thường xuyên",
          p: [
            "Giám sát, báo cáo và kiểm chứng (MRV) không phải dự án một lần. Mỗi năm đều cần đo đạc, hồ sơ, dữ liệu tiền chất từ nhà cung cấp, và một báo cáo kiểm chứng từ đơn vị đã đăng ký trong CBAM Registry. Chi phí đó lặp lại và sẽ lớn lên khi phạm vi mở rộng.",
            "Nên làm gì: xây nó thành quy trình hằng tháng lặp lại được thay vì một đợt chạy nước rút mỗi năm. Chi phí MRV bị chi phối bởi tỷ lệ công việc còn làm tay — đeo bám nhà cung cấp qua email, gõ lại bảng tính, dựng lại cùng một báo cáo mỗi năm. Tự động hoá vòng lặp đó mới là nơi chi phí thực sự giảm.",
          ],
        },
        {
          h: "4 — Giá carbon nội địa thành tài sản",
          p: [
            "Thuế carbon hay ETS thực trả trong nước được khấu trừ khỏi chi phí CBAM, miễn là đã trả thật và kiểm chứng được. Đó là động lực trực tiếp để nước xuất khẩu đưa ra định giá carbon của riêng mình — giữ nguồn thu trong nước thay vì gửi sang châu Âu.",
            "Nhà xuất khẩu nên làm gì: theo dõi chính phủ nước xuất khẩu đang làm gì, và giữ bằng chứng thanh toán. Nếu có một mức giá carbon khấu trừ được mà nhà xuất khẩu không chứng minh được đã trả, nhà nhập khẩu không được khấu trừ.",
          ],
        },
        {
          h: "5 — Lách luật là rủi ro pháp lý nghiêm trọng",
          p: [
            "Quy định chống lách luật cấm khai sai CN Code hoặc chuyển hàng qua nước thứ ba để né cơ chế. Khi bị phát hiện, cả nhà nhập khẩu lẫn nhà xuất khẩu đối mặt mức phạt nặng — tới năm lần số phải nộp.",
            "Nên làm gì: không mánh khoé. Phân loại đúng, ghi lại lộ trình sản xuất thật, và coi mọi lời khuyên dựa trên phân loại lại hay chuyển tải là một khoản nợ chứ không phải khoản tiết kiệm.",
          ],
          note: "Uỷ ban thiết kế việc mở rộng sang sản phẩm hạ nguồn một phần chính là để đóng cánh cửa này. Chiến lược lách luật có hạn dùng ngắn và hình phạt dài.",
        },
        {
          h: "Ba hướng ứng phó",
          list: [
            "Xây dữ liệu phát thải thực — thôi dựa vào giá trị mặc định, tính CO₂ trên mỗi đơn vị sản phẩm cho đúng trong ranh giới hệ thống của EU, và lưu bằng chứng ngay khi làm",
            "Chuẩn bị cho kiểm chứng được công nhận — ký hợp đồng sớm, thẩm định kế hoạch giám sát trước khi năm khép lại, kiểm tra nhà máy, và có sẵn báo cáo",
            "Lập kế hoạch đầu tư giảm phát thải — cải thiện hiệu suất năng lượng và sử dụng vật liệu, giảm CO₂ hàm chứa để gánh nặng CBAM giảm bền vững chứ không chỉ được ghi chép đầy đủ",
          ],
          p: [
            "CBAM không chỉ là một quy định. Đó là thương mại trong kỷ nguyên carbon có giá, và những nhà xuất khẩu điều chỉnh trước là những người giữ được thị trường châu Âu về lâu dài.",
          ],
        },
      ],
      faq: [
        {
          q: "Điều quan trọng nhất một nhà xuất khẩu nên làm với CBAM là gì?",
          a: "Tạo ra dữ liệu phát thải thực đã kiểm chứng theo từng sản phẩm. Mọi thứ khác — đàm phán giá, điều khoản hợp đồng, niềm tin của người mua — đều theo sau việc có một con số thật đã được kiểm chứng viên ký.",
        },
        {
          q: "Mức phạt cho việc lách CBAM là bao nhiêu?",
          a: "Mức phạt cho hành vi lách như khai sai CN Code hay chuyển tải có thể lên tới năm lần số phải nộp, và áp cho cả nhà nhập khẩu lẫn nhà xuất khẩu.",
        },
        {
          q: "Có đáng đầu tư giảm phát thải chỉ vì CBAM không?",
          a: "Chi phí CBAM giảm theo phát thải, và khoản khấu trừ phân bổ miễn phí về 0 vào 2034, nên lợi tức tăng lên mỗi năm. Nhưng lợi tức nhanh hơn với phần lớn nhà xuất khẩu là kiểm chứng mức phát thải họ đã có, vì riêng việc đó đã loại bỏ một giá trị mặc định mang tính trừng phạt.",
        },
        {
          q: "Mất bao lâu để sẵn sàng cho CBAM?",
          a: "Hãy tính trọn một năm báo cáo có giám sát cộng thời gian chờ kiểm chứng. Dữ liệu của một tháng không dựng lại được sau đó, nên ngày nhà xuất khẩu bắt đầu trên thực tế quyết định năm đầu tiên có thể báo cáo giá trị thực.",
        },
      ],
    },

  },
};
