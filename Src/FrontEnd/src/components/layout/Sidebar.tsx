import {
  ArrowLeftFromLine,
  BadgeCheck,
  BadgeDollarSign,
  Bike,
  Building2,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileBadge,
  FolderTree,
  Home,
  KeyRound,
  Landmark,
  Layers,
  Map,
  MapPinned,
  Percent,
  ReceiptText,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/features/auth/hooks/useAuth";
import { getDashboardPath } from "@/features/auth/utils/roleRedirect";
import type { UserRole } from "@/features/auth/types";

const roleLabels: Record<UserRole, string> = {
  Admin: "Quản trị",
  Staff: "Nhân viên",
  Owner: "Chủ xe",
  Customer: "Khách hàng",
};

const roleIcons = {
  Admin: ShieldCheck,
  Staff: ClipboardList,
  Owner: Car,
  Customer: Home,
};

const ownerVerificationItems = [
  { to: "/become-owner/cccd", label: "Xác thực CCCD", icon: BadgeCheck },
  { to: "/become-owner/bank", label: "Thông tin ngân hàng", icon: Landmark },
];

const vehicleCatalogItems = [
  { to: "/admin/vehicle-brands", label: "Hãng xe", icon: Building2 },
  { to: "/admin/vehicle-models", label: "Dòng xe", icon: Layers },
  { to: "/admin/car-variants", label: "Phiên bản ô tô", icon: Car },
  { to: "/admin/motorbike-variants", label: "Phiên bản xe máy", icon: Bike },
  { to: "/admin/driver-license-classes", label: "Giấy phép lái xe", icon: FileBadge },
  { to: "/admin/areas", label: "Khu vực", icon: MapPinned },
];

const vehiclePricingItems = [
  { to: "/admin/pricing-regions", label: "Vùng giá", icon: Map },
  { to: "/admin/vehicle-model-pricings", label: "Khung giá", icon: BadgeDollarSign },
  { to: "/admin/pricing-rules", label: "Quy tắc giá", icon: ReceiptText },
  { to: "/admin/platform-fee-rules", label: "Phí nền tảng", icon: Percent },
];

const ownerVehicleItems = [
  { to: "/owner/vehicles/car", label: "Ô tô", icon: Car },
  { to: "/owner/vehicles/motorbike", label: "Xe máy", icon: Bike },
];

function NavItem({ to, label, icon: Icon, collapsed, end }: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; collapsed: boolean; end?: boolean }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          "flex h-10 items-center rounded-md text-sm font-medium transition-colors",
          collapsed ? "justify-center" : "gap-3 px-3",
          isActive ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:bg-brand-50 hover:text-brand-700",
        ].join(" ")
      }
      title={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && label}
    </NavLink>
  );
}

function SectionHeading({ children, collapsed }: { children: React.ReactNode; collapsed: boolean }) {
  return collapsed ? null : <span className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</span>;
}

export default function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const user = useAuthStore((state) => state.user);
  const activeRole = useAuthStore((state) => state.activeRole);
  const location = useLocation();
  const navigate = useNavigate();
  const primaryRole = activeRole ?? user?.roles[0] ?? "Customer";
  const RoleIcon = roleIcons[primaryRole] ?? Home;
  const isProfileSection = location.pathname === "/account" || location.pathname === "/change-password";
  const isVehicleCatalogPath = location.pathname === "/admin/vehicle-catalog" || vehicleCatalogItems.some((item) => location.pathname.startsWith(item.to));
  const [vehicleCatalogOpen, setVehicleCatalogOpen] = useState(isVehicleCatalogPath);
  const isVehiclePricingPath = vehiclePricingItems.some((item) => location.pathname.startsWith(item.to));
  const [vehiclePricingOpen, setVehiclePricingOpen] = useState(isVehiclePricingPath);
  const isOwnerVehiclePath = ownerVehicleItems.some((item) => location.pathname.startsWith(item.to));
  const [ownerVehicleOpen, setOwnerVehicleOpen] = useState(isOwnerVehiclePath);

  useEffect(() => {
    if (isVehicleCatalogPath) setVehicleCatalogOpen(true);
    if (isVehiclePricingPath) setVehiclePricingOpen(true);
    if (isOwnerVehiclePath) setOwnerVehicleOpen(true);
  }, [isVehicleCatalogPath, isVehiclePricingPath, isOwnerVehiclePath]);

  const mainItems = [
    { to: getDashboardPath([primaryRole]), label: roleLabels[primaryRole] ?? "Khu vực của tôi", icon: RoleIcon },
  ];

  if (primaryRole === "Admin") {
    mainItems.push({ to: "/admin/users", label: "Người dùng", icon: UsersRound });
    mainItems.push({ to: "/admin/vehicle-documents", label: "Duyệt hồ sơ xe", icon: FileBadge });
    mainItems.push({ to: "/admin/vehicle-listings", label: "Duyệt bài đăng xe", icon: ClipboardList });
  }

  if (primaryRole === "Staff") {
    mainItems.push({ to: "/staff/vehicle-documents", label: "Duyệt hồ sơ xe", icon: FileBadge });
    mainItems.push({ to: "/staff/vehicle-listings", label: "Duyệt bài đăng xe", icon: ClipboardList });
  }

  const profileItems = [
    { to: "/account", label: "Tài khoản", icon: UserRound },
    { to: "/change-password", label: "Đổi mật khẩu", icon: KeyRound },
  ];

  const showOwnerVerification = user?.roles.some((r) => r === "Customer" || r === "Owner") ?? false;
  const isBecomeOwnerPage = location.pathname.startsWith("/become-owner");
  const isOwnerVerificationSection = isProfileSection || isBecomeOwnerPage;

  let items = isOwnerVerificationSection ? profileItems : mainItems;
  if (isOwnerVerificationSection && showOwnerVerification) {
    items = [...items, ...ownerVerificationItems];
  }

  const backItem = isOwnerVerificationSection
    ? { to: getDashboardPath([primaryRole]), label: roleLabels[primaryRole] ?? "Khu vực của tôi", icon: ArrowLeftFromLine }
    : null;
  const dashboardPath = getDashboardPath([primaryRole]);

  return (
    <aside
      className={`hidden border-r border-slate-200 bg-white transition-all duration-200 md:sticky md:top-14 md:flex md:h-[calc(100vh-3.5rem)] md:flex-col md:self-start ${collapsed ? "w-16" : "w-56"}`}
    >
      <nav className="flex flex-1 flex-col gap-1 p-3">
        <div className="flex-1 space-y-1">
          {isOwnerVerificationSection && (
            <>
              <NavItem end collapsed={collapsed} to={backItem!.to} label={backItem!.label} icon={backItem!.icon} />
              {!collapsed && <span className="my-1 block border-t border-slate-100" />}
              {!collapsed && <SectionHeading collapsed={collapsed}>Hồ sơ</SectionHeading>}
            </>
          )}

          {items.map((item) => (
            <NavItem key={item.to} end={item.to === dashboardPath} collapsed={collapsed} to={item.to} label={item.label} icon={item.icon} />
          ))}

          {primaryRole === "Owner" && !isOwnerVerificationSection && (
            <>
              {!collapsed && <span className="my-1 block border-t border-slate-100" />}
              <button
                type="button"
                onClick={() => {
                  setOwnerVehicleOpen(true);
                  navigate("/owner/vehicles");
                }}
                className={[
                  "flex h-10 w-full items-center rounded-md text-sm font-medium transition-colors",
                  collapsed ? "justify-center" : "gap-3 px-3",
                  isOwnerVehiclePath ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-brand-50 hover:text-brand-700",
                ].join(" ")}
                title="Quản lý xe"
              >
                <FolderTree className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Quản lý xe</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        setOwnerVehicleOpen((prev) => !prev);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          setOwnerVehicleOpen((prev) => !prev);
                        }
                      }}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Mở danh mục xe"
                    >
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${ownerVehicleOpen ? "rotate-180" : ""}`} />
                    </span>
                  </>
                )}
              </button>
              {!collapsed && ownerVehicleOpen && (
                <div className="ml-4 space-y-1 border-l border-slate-200 pl-2">
                  {ownerVehicleItems.map((item) => (
                    <NavItem key={item.to} collapsed={collapsed} to={item.to} label={item.label} icon={item.icon} />
                  ))}
                </div>
              )}
            </>
          )}

          {primaryRole === "Admin" && !isOwnerVerificationSection && (
            <>
              {!collapsed && <span className="my-1 block border-t border-slate-100" />}
              <button
                type="button"
                onClick={() => {
                  setVehicleCatalogOpen(true);
                  navigate("/admin/vehicle-catalog");
                }}
                className={[
                  "flex h-10 w-full items-center rounded-md text-sm font-medium transition-colors",
                  collapsed ? "justify-center" : "gap-3 px-3",
                  isVehicleCatalogPath ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-brand-50 hover:text-brand-700",
                ].join(" ")}
                title="Phương tiện"
              >
                <FolderTree className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Phương tiện</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        setVehicleCatalogOpen((prev) => !prev);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          setVehicleCatalogOpen((prev) => !prev);
                        }
                      }}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Mở danh mục phương tiện"
                    >
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${vehicleCatalogOpen ? "rotate-180" : ""}`} />
                    </span>
                  </>
                )}
              </button>
              {!collapsed && vehicleCatalogOpen && (
                <div className="ml-4 space-y-1 border-l border-slate-200 pl-2">
                  {vehicleCatalogItems.map((item) => (
                    <NavItem key={item.to} collapsed={collapsed} to={item.to} label={item.label} icon={item.icon} />
                  ))}
                </div>
              )}

              {!collapsed && <span className="my-1 block border-t border-slate-100" />}
              <button
                type="button"
                onClick={() => {
                  setVehiclePricingOpen(true);
                  navigate("/admin/pricing-regions");
                }}
                className={[
                  "flex h-10 w-full items-center rounded-md text-sm font-medium transition-colors",
                  collapsed ? "justify-center" : "gap-3 px-3",
                  isVehiclePricingPath ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-brand-50 hover:text-brand-700",
                ].join(" ")}
                title="Giá xe"
              >
                <BadgeDollarSign className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Giá xe</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        setVehiclePricingOpen((prev) => !prev);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          setVehiclePricingOpen((prev) => !prev);
                        }
                      }}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Mở danh mục giá xe"
                    >
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${vehiclePricingOpen ? "rotate-180" : ""}`} />
                    </span>
                  </>
                )}
              </button>
              {!collapsed && vehiclePricingOpen && (
                <div className="ml-4 space-y-1 border-l border-slate-200 pl-2">
                  {vehiclePricingItems.map((item) => (
                    <NavItem key={item.to} collapsed={collapsed} to={item.to} label={item.label} icon={item.icon} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <button
          type="button"
          onClick={onToggle}
          className="flex h-8 w-full items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </nav>
    </aside>
  );
}
