export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
  image?: string;
  imageAlt?: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  publishedAt: string;
  readTime: number;
  heroImage: string;
  heroAlt: string;
  sections: BlogSection[];
};

const imageUrl = (id: string, width = 1400) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${width}&q=85`;

export const blogPosts: BlogPost[] = [
  {
    slug: "xu-huong-thue-xe-tu-lai-cho-gia-dinh",
    title: "Xu hướng thuê xe tự lái của các gia đình trong dịp lễ",
    excerpt:
      "Vì sao nhiều gia đình chọn thuê xe thay vì sử dụng phương tiện cá nhân, và cần chuẩn bị gì để chuyến đi thật nhẹ nhàng?",
    category: "Kinh nghiệm",
    publishedAt: "25/07/2026",
    readTime: 7,
    heroImage: imageUrl("1549317661-bd32c8ce0db2"),
    heroAlt: "Xe gia đình chuẩn bị cho chuyến đi",
    sections: [
      {
        heading: "Vì sao thuê xe tự lái ngày càng được ưa chuộng?",
        paragraphs: [
          "Thuê xe tự lái giúp gia đình chủ động giờ khởi hành, điểm dừng và lượng hành lý mang theo. Thay vì phụ thuộc vào lịch trình cố định, cả nhà có thể điều chỉnh chuyến đi theo sức khỏe của trẻ nhỏ hoặc người lớn tuổi.",
          "Chi phí cũng dễ kiểm soát hơn khi đi theo nhóm. Một mức giá thuê rõ ràng, cộng với nhiên liệu và phí cầu đường, thường thuận tiện hơn việc mua nhiều vé riêng lẻ.",
        ],
        image: imageUrl("1503376780353-7e6692767b70"),
        imageAlt: "Xe di chuyển trên cung đường dài",
      },
      {
        heading: "Chọn xe theo đúng số người và hành lý",
        paragraphs: [
          "Đừng chỉ tính số ghế. Một gia đình bốn người nhưng có xe đẩy em bé và nhiều vali sẽ cần khoang hành lý lớn hơn một nhóm bốn người đi ngắn ngày.",
        ],
        bullets: [
          "Sedan phù hợp chuyến đi ngắn, hành lý gọn.",
          "SUV gầm cao phù hợp cung đường hỗn hợp và nhiều hành lý.",
          "MPV phù hợp gia đình đông người hoặc có trẻ nhỏ.",
        ],
      },
      {
        heading: "Đặt sớm để có nhiều lựa chọn",
        paragraphs: [
          "Trong dịp lễ, các dòng xe gia đình thường hết nhanh. Nên đặt trước, đọc kỹ chính sách hủy và xác nhận thời gian nhận trả xe. Trên MoveVN, bạn có thể lọc theo khu vực, loại xe và khoảng thời gian để tránh chọn nhầm xe đã kín lịch.",
        ],
      },
    ],
  },
  {
    slug: "checklist-kiem-tra-xe-truoc-khi-nhan",
    title: "Checklist kiểm tra xe trước khi nhận dành cho người mới",
    excerpt:
      "Một quy trình kiểm tra ngắn giúp bạn ghi nhận đúng hiện trạng xe và tự tin hơn trước khi bắt đầu hành trình.",
    category: "An toàn",
    publishedAt: "23/07/2026",
    readTime: 6,
    heroImage: imageUrl("1489824904134-891ab64532f1"),
    heroAlt: "Kiểm tra xe trước khi nhận",
    sections: [
      {
        heading: "Bắt đầu từ ngoại thất",
        paragraphs: [
          "Hãy đi một vòng quanh xe trong điều kiện đủ sáng. Chụp lại các vết xước, móp hoặc chi tiết bất thường và đối chiếu với biên bản bàn giao trước khi ký xác nhận.",
        ],
        bullets: [
          "Kiểm tra kính, đèn, gương và lốp.",
          "Chụp bốn góc xe và đồng hồ công-tơ-mét.",
          "Xác nhận mức nhiên liệu hoặc mức pin hiện tại.",
        ],
        image: imageUrl("1493238792000-8113da705763"),
        imageAlt: "Chi tiết ngoại thất ô tô",
      },
      {
        heading: "Kiểm tra khoang lái và giấy tờ",
        paragraphs: [
          "Khởi động xe, thử điều hòa, đèn báo, phanh tay và các chức năng cơ bản. Đảm bảo giấy đăng ký, đăng kiểm và thông tin bảo hiểm được cung cấp đúng theo thỏa thuận.",
        ],
      },
      {
        heading: "Chỉ xác nhận khi thông tin đã đầy đủ",
        paragraphs: [
          "Nếu có điểm chưa rõ, hãy trao đổi ngay trên kênh chat của booking để lưu lại nội dung. Việc này giúp cả khách thuê và chủ xe có cùng một nguồn thông tin khi cần đối chiếu.",
        ],
      },
    ],
  },
  {
    slug: "kinh-nghiem-roadtrip-cung-duong-dai",
    title: "Kinh nghiệm chuẩn bị cho chuyến roadtrip đường dài",
    excerpt:
      "Từ lựa chọn xe, lịch nghỉ đến dự phòng thời tiết: những bước nhỏ tạo nên một chuyến đi đường dài an toàn.",
    category: "Hành trình",
    publishedAt: "20/07/2026",
    readTime: 8,
    heroImage: imageUrl("1500530855697-b586d89ba3ee"),
    heroAlt: "Xe trên cung đường roadtrip",
    sections: [
      {
        heading: "Lập lịch trình có khoảng nghỉ",
        paragraphs: [
          "Một lịch trình tốt không nên chỉ có điểm đi và điểm đến. Hãy chia quãng đường thành các chặng phù hợp, ưu tiên điểm dừng có chỗ nghỉ, ăn uống và tiếp nhiên liệu.",
          "Với người lái chưa quen đường dài, nên nghỉ sau mỗi hai giờ và tránh cố chạy khi đã buồn ngủ.",
        ],
        image: imageUrl("1519641471654-76ce0107ad1b"),
        imageAlt: "Cung đường qua thiên nhiên",
      },
      {
        heading: "Chuẩn bị phương án dự phòng",
        paragraphs: [
          "Kiểm tra dự báo thời tiết, lưu bản đồ ngoại tuyến và mang theo sạc dự phòng. Nếu hành trình đi qua đèo hoặc khu vực ít dịch vụ, hãy chủ động bổ sung nhiên liệu sớm.",
        ],
        bullets: [
          "Lưu số hỗ trợ của chủ xe và MoveVN.",
          "Mang nước uống, bộ sơ cứu và dụng cụ cảnh báo.",
          "Không thay đổi cung đường lớn mà không báo cho người đồng hành.",
        ],
      },
      {
        heading: "Chọn chiếc xe khiến bạn thoải mái",
        paragraphs: [
          "Tư thế lái, khả năng quan sát và khoang hành lý quan trọng hơn vẻ ngoài. Hãy ưu tiên mẫu xe quen thuộc, có đủ tính năng an toàn và phù hợp điều kiện đường dự kiến.",
        ],
      },
    ],
  },
  {
    slug: "thue-xe-may-kham-pha-thanh-pho",
    title: "Thuê xe máy khám phá thành phố: linh hoạt nhưng vẫn an toàn",
    excerpt:
      "Xe máy giúp bạn đi sâu hơn vào từng khu phố, nhưng một vài nguyên tắc cơ bản sẽ khiến chuyến khám phá dễ chịu hơn.",
    category: "Xe máy",
    publishedAt: "17/07/2026",
    readTime: 5,
    heroImage: imageUrl("1558981806-ec527fa84c39"),
    heroAlt: "Xe máy dành cho chuyến khám phá thành phố",
    sections: [
      {
        heading: "Chọn xe theo quãng đường",
        paragraphs: [
          "Xe tay ga thuận tiện trong đô thị, cốp rộng và dễ điều khiển. Xe số tiết kiệm nhiên liệu, phù hợp những hành trình dài hơn hoặc địa hình có độ dốc vừa phải.",
        ],
        image: imageUrl("1524591652733-73fa1ae7b5ee"),
        imageAlt: "Xe máy di chuyển trong thành phố",
      },
      {
        heading: "Kiểm tra trang bị an toàn",
        paragraphs: [
          "Mũ bảo hiểm phải vừa đầu và có khóa hoạt động tốt. Kiểm tra phanh, lốp, đèn xi-nhan, còi và gương trước khi rời điểm nhận xe.",
        ],
      },
      {
        heading: "Tôn trọng nhịp giao thông địa phương",
        paragraphs: [
          "Không nên vừa lái vừa xem bản đồ. Hãy dừng xe ở vị trí an toàn để kiểm tra đường, đi đúng làn và giảm tốc tại các giao lộ đông người.",
        ],
      },
    ],
  },
  {
    slug: "cach-tinh-chi-phi-thue-xe-minh-bach",
    title: "Cách dự tính chi phí thuê xe rõ ràng trước chuyến đi",
    excerpt:
      "Giá theo ngày chỉ là một phần của kế hoạch. Đây là cách tổng hợp nhiên liệu, cầu đường và các khoản phát sinh hợp lý.",
    category: "Chi phí",
    publishedAt: "14/07/2026",
    readTime: 6,
    heroImage: imageUrl("1494976388531-d1058494cdd8"),
    heroAlt: "Xe phục vụ kế hoạch di chuyển",
    sections: [
      {
        heading: "Tách chi phí cố định và biến đổi",
        paragraphs: [
          "Chi phí cố định thường gồm tiền thuê và dịch vụ đã chọn. Chi phí biến đổi phụ thuộc quãng đường, mức tiêu hao nhiên liệu, phí cầu đường và nơi đỗ xe.",
        ],
        bullets: [
          "Tiền thuê theo ngày hoặc theo gói.",
          "Nhiên liệu hoặc chi phí sạc.",
          "Cầu đường, bãi xe và giao nhận tận nơi.",
        ],
      },
      {
        heading: "Đọc kỹ giới hạn sử dụng",
        paragraphs: [
          "Một số xe có giới hạn số kilomet trong ngày hoặc quy định khu vực hoạt động. Hãy xem điều kiện trước khi đặt để dự tính đúng chi phí nếu hành trình dài.",
        ],
        image: imageUrl("1449965408869-eaa3f722e40d"),
        imageAlt: "Lái xe và quản lý chi phí hành trình",
      },
      {
        heading: "Giữ mọi thỏa thuận trong booking",
        paragraphs: [
          "Các lựa chọn bổ sung và thay đổi lịch nên được xác nhận trên hệ thống. Điều này giúp hóa đơn rõ ràng và hạn chế hiểu nhầm khi hoàn tất chuyến đi.",
        ],
      },
    ],
  },
  {
    slug: "nhan-xe-tai-san-bay-can-chuan-bi-gi",
    title: "Nhận xe tại sân bay: cần chuẩn bị gì để không mất thời gian?",
    excerpt:
      "Một điểm hẹn rõ ràng và lịch bay được cập nhật sẽ giúp quá trình giao xe tại sân bay diễn ra nhanh hơn.",
    category: "Hướng dẫn",
    publishedAt: "10/07/2026",
    readTime: 5,
    heroImage: imageUrl("1542296332-2e4473faf563"),
    heroAlt: "Xe đón khách tại khu vực sân bay",
    sections: [
      {
        heading: "Gửi đúng thông tin chuyến bay",
        paragraphs: [
          "Hãy cung cấp mã chuyến bay, giờ hạ cánh dự kiến và số điện thoại có thể liên lạc. Nếu chuyến bay thay đổi, cập nhật sớm giúp chủ xe điều chỉnh thời gian giao nhận.",
        ],
      },
      {
        heading: "Thống nhất điểm gặp cụ thể",
        paragraphs: [
          "Sân bay thường có nhiều sảnh và tầng đón khách. Thay vì chỉ ghi tên sân bay, hãy thống nhất cột, cửa hoặc khu vực đỗ ngắn hạn cụ thể.",
        ],
        image: imageUrl("1436491865332-7a61a109cc05"),
        imageAlt: "Khu vực nhà ga sân bay",
      },
      {
        heading: "Chuẩn bị giấy tờ trước khi gặp",
        paragraphs: [
          "Mở sẵn booking, căn cước công dân và giấy phép lái xe để đối chiếu. Sau khi kiểm tra xe, xác nhận biên bản bàn giao ngay trên hệ thống.",
        ],
      },
    ],
  },
];

export function findBlogPost(slug?: string) {
  return blogPosts.find((post) => post.slug === slug);
}
