import { Link } from "react-router-dom";
import {
  ArrowRight,
  CarFront,
  ClipboardCheck,
  FileCheck2,
  Headphones,
  IdCard,
  Scale,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import SectionPanel from "@/components/dashboard/SectionPanel";
import StatCard from "@/components/dashboard/StatCard";

const operations = [
  {
    description: "Kiểm tra hồ sơ xe, giấy tờ và trạng thái công khai.",
    href: "/staff/vehicles",
    icon: CarFront,
    label: "Duyệt hồ sơ xe",
  },
  {
    description: "Xác minh GPLX trước khi khách hàng bắt đầu đặt xe.",
    href: "/staff/driver-license-verifications",
    icon: FileCheck2,
    label: "Duyệt GPLX",
  },
  {
    description: "Đối chiếu CCCD/CMND và kết quả AI verification.",
    href: "/staff/national-id-verifications",
    icon: IdCard,
    label: "Duyệt CCCD",
  },
  {
    description: "Tiếp nhận, phân loại và phản hồi yêu cầu hỗ trợ.",
    href: "/staff/support-tickets",
    icon: Headphones,
    label: "Support tickets",
  },
  {
    description: "Theo dõi dispute, bằng chứng và hướng xử lý.",
    href: "/staff/disputes",
    icon: Scale,
    label: "Tranh chấp",
  },
  {
    description: "Hỗ trợ kiểm tra ví, rút tiền và đối soát giao dịch.",
    href: "/staff/withdrawals",
    icon: WalletCards,
    label: "Rút tiền",
  },
];

export default function StaffHomePage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <DashboardHeader
        eyebrow="Staff operations"
        title="Khu vực nhân viên"
        description="Một bảng điều phối cho các tác vụ vận hành: kiểm duyệt, hỗ trợ khách hàng, tranh chấp và đối soát. Mỗi luồng được đặt đúng nơi để nhân viên thao tác nhanh hơn."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={ClipboardCheck}
          label="Luồng kiểm duyệt"
          tone="brand"
          value="3 nhóm"
          description="Xe, giấy phép lái xe, CCCD/CMND"
        />
        <StatCard
          icon={Headphones}
          label="Hỗ trợ khách hàng"
          tone="blue"
          value="Ticket"
          description="Theo dõi và phản hồi yêu cầu từ người dùng"
        />
        <StatCard
          icon={ShieldCheck}
          label="Vận hành an toàn"
          tone="emerald"
          value="Trust ops"
          description="Tranh chấp, đối soát và các trường hợp cần can thiệp"
        />
      </div>

      <SectionPanel
        title="Bàn làm việc"
        description="Chọn một luồng nghiệp vụ để bắt đầu xử lý. Các mục được nhóm theo hành động nhân viên thực sự cần làm trong ca trực."
        contentClassName="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {operations.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="group flex min-h-[128px] flex-col justify-between rounded-md border border-slate-200 bg-slate-50/60 p-4 transition hover:-translate-y-0.5 hover:border-brand-200 hover:bg-white hover:shadow-md hover:shadow-slate-950/10"
          >
            <div className="flex items-start gap-3">
              <span className="rounded-md bg-white p-2 text-brand-700 ring-1 ring-slate-200 transition group-hover:ring-brand-200">
                <item.icon className="h-5 w-5" />
              </span>
              <div>
                <h2 className="font-semibold text-slate-950">{item.label}</h2>
                <p className="mt-1 text-sm leading-5 text-slate-600">{item.description}</p>
              </div>
            </div>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
              Mở tác vụ
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </SectionPanel>
    </div>
  );
}
