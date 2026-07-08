import {
  ArrowLeftFromLine,
  BadgeDollarSign,
  Bike,
  Building2,
  CalendarCheck,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileBadge,
  FolderTree,
  Home,
  IdCard,
  KeyRound,
  Landmark,
  Layers,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Map,
  MapPinned,
  Monitor,
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

const vehicleCatalogItems = [
  { to: "/admin/vehicle-brands", label: "Hãng xe", icon: Building2 },
  { to: "/admin/vehicle-models", label: "Dòng xe", icon: Layers },
  { to: "/admin/car-variants", label: "Phiên bản ô tô", icon: Car },
  { to: "/admin/motorbike-variants", label: "Phiên bản xe máy", icon: Bike },
  { to: "/admin/vehicle-features", label: "Tính năng xe", icon: ListChecks },
  { to: "/admin/driver-license-classes", label: "Giấy phép lái xe", icon: FileBadge },
];

const vehiclePricingItems = [
  { to: "/admin/pricing-regions", label: "Vùng giá", icon: Map },
  { to: "/admin/vehicle-model-pricings", label: "Khung giá", icon: BadgeDollarSign },
  { to: "/admin/pricing-rules", label: "Quy tắc giá", icon: ReceiptText },
  { to: "/admin/platform-fee-rules", label: "Phí nền tảng", icon: Percent },
  { to: "/admin/areas", label: "Khu vực", icon: MapPinned },
];

const adminModerationItems = [
  { to: "/admin/vehicle-documents", label: "Giấy tờ xe", icon: FileBadge },
  { to: "/admin/vehicle-listings", label: "Tin đăng xe", icon: ClipboardList },
];

const staffModerationItems = [
  { to: "/staff/vehicle-documents", label: "Duyệt hồ sơ xe", icon: FileBadge },
  { to: "/staff/vehicle-listings", label: "Duyệt bài đăng xe", icon: ClipboardList },
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
  const isAccountSection = location.pathname.startsWith("/account") || location.pathname === "/change-password";
  const isVehicleCatalogPath = location.pathname === "/admin/vehicle-catalog" || vehicleCatalogItems.some((item) => location.pathname.startsWith(item.to));
  const [vehicleCatalogOpen, setVehicleCatalogOpen] = useState(isVehicleCatalogPath);
  const isVehiclePricingPath = vehiclePricingItems.some((item) => location.pathname.startsWith(item.to));
  const [vehiclePricingOpen, setVehiclePricingOpen] = useState(isVehiclePricingPath);
  const isAdminModerationPath = location.pathname.startsWith("/admin/moderation") || adminModerationItems.some((item) => location.pathname.startsWith(item.to));
  const [adminModerationOpen, setAdminModerationOpen] = useState(isAdminModerationPath);
  const isStaffModerationPath = location.pathname.startsWith("/staff/moderation") || staffModerationItems.some((item) => location.pathname.startsWith(item.to));
  const [staffModerationOpen, setStaffModerationOpen] = useState(isStaffModerationPath);
  const isOwnerVehiclePath = ownerVehicleItems.some((item) => location.pathname.startsWith(item.to));
  const [ownerVehicleOpen, setOwnerVehicleOpen] = useState(isOwnerVehiclePath);

  useEffect(() => {
    if (isVehicleCatalogPath) setVehicleCatalogOpen(true);
    if (isVehiclePricingPath) setVehiclePricingOpen(true);
    if (isAdminModerationPath) setAdminModerationOpen(true);
    if (isStaffModerationPath) setStaffModerationOpen(true);
    if (isOwnerVehiclePath) setOwnerVehicleOpen(true);
  }, [isVehicleCatalogPath, isVehiclePricingPath, isAdminModerationPath, isStaffModerationPath, isOwnerVehiclePath]);

  const mainItems = [
    { to: getDashboardPath([primaryRole]), label: roleLabels[primaryRole] ?? "Khu vực của tôi", icon: RoleIcon },
  ];

  if (primaryRole === "Customer") {
    mainItems.push({ to: "/xe", label: "Thuê xe", icon: Car });
    mainItems.push({ to: "/customer/bookings", label: "Lịch sử thuê xe", icon: CalendarCheck });
  }

  if (primaryRole === "Admin") {
    mainItems.push({ to: "/admin/users", label: "Người dùng", icon: UsersRound });
  }

  if (primaryRole === "Owner") {
    mainItems.push({ to: "/xe", label: "Thuê xe", icon: Car });
    mainItems.push({ to: "/owner/bookings", label: "Yêu cầu thuê", icon: CalendarCheck });
  }

  const profileGroups = [
    {
      heading: "Tài khoản",
      items: [
        { to: "/account", label: "Tổng quan", icon: LayoutDashboard },
        { to: "/account/profile", label: "Hồ sơ cá nhân", icon: UserRound },
      ],
    },
    {
      heading: "Ví tiền",
      items: [
        { to: "/account/bank", label: "Ngân hàng", icon: Landmark },
      ],
    },
    {
      heading: "Xác minh",
      items: [
        { to: "/account/verification", label: "Tổng quan xác minh", icon: ShieldCheck },
        { to: "/account/verification/cccd", label: "CCCD / CMND", icon: IdCard },
        { to: "/account/verification/drivers-license", label: "Giấy phép lái xe", icon: FileBadge },
      ],
    },
    {
      heading: "Bảo mật",
      items: [
        { to: "/account/security/password", label: "Mật khẩu", icon: KeyRound },
        { to: "/account/security/sessions", label: "Phiên đăng nhập", icon: Monitor },
      ],
    },
    {
      heading: "Hệ thống",
      items: [
        { to: "/logout", label: "Đăng xuất", icon: LogOut },
      ],
    },
  ];

  const isBecomeOwnerPage = location.pathname.startsWith("/become-owner");
  const isOwnerVerificationSection = isAccountSection || isBecomeOwnerPage;

  let items = isOwnerVerificationSection ? [] : mainItems;

  const backItem = isOwnerVerificationSection
    ? { to: getDashboardPath([primaryRole]), label: roleLabels[primaryRole] ?? "Khu vực của tôi", icon: ArrowLeftFromLine }
    : null;
  const dashboardPath = getDashboardPath([primaryRole]);

  return (
    <aside
      className={`hidden border-r border-slate-200 bg-white transition-all duration-200 md:sticky md:top-14 md:flex md:h-[calc(100vh-3.5rem)] md:flex-col md:self-start ${collapsed ? "w-16" : "w-60"}`}
    >
      <nav className="flex min-h-0 flex-1 flex-col p-3">
        <div className="sidebar-scrollbar -mr-2 min-h-0 flex-1 space-y-1 overflow-y-auto overflow-x-hidden pr-2 pb-3">
          {isOwnerVerificationSection && (
            <>
              <NavItem end collapsed={collapsed} to={backItem!.to} label={backItem!.label} icon={backItem!.icon} />

              {!collapsed && (
                <div className="mt-2 space-y-4">
                  {profileGroups.map((group) => (
                    <div key={group.heading}>
                      <SectionHeading collapsed={false}>{group.heading}</SectionHeading>
                      <div className="mt-1 space-y-0.5">
                        {group.items.map((item) => (
                          <NavItem key={item.to} end collapsed={collapsed} to={item.to} label={item.label} icon={item.icon} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {collapsed && (
                <div className="mt-2 space-y-0.5">
                  {profileGroups.flatMap((g) => g.items).map((item) => (
                    <NavItem key={item.to} end collapsed={collapsed} to={item.to} label={item.label} icon={item.icon} />
                  ))}
                </div>
              )}
            </>
          )}

          {!isOwnerVerificationSection && items.map((item) => (
            <NavItem key={item.to} end={item.to === dashboardPath} collapsed={collapsed} to={item.to} label={item.label} icon={item.icon} />
          ))}

          {primaryRole === "Admin" && !isOwnerVerificationSection && (
            <>
              {!collapsed && <span className="my-1 block border-t border-slate-100" />}
              <button
                type="button"
                onClick={() => {
                  setAdminModerationOpen(true);
                  navigate("/admin/moderation");
                }}
                className={[
                  "flex h-10 w-full items-center rounded-md text-sm font-medium transition-colors",
                  collapsed ? "justify-center" : "gap-3 px-3",
                  isAdminModerationPath ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-brand-50 hover:text-brand-700",
                ].join(" ")}
                title="Giám sát kiểm duyệt"
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Giám sát kiểm duyệt</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        setAdminModerationOpen((prev) => !prev);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          setAdminModerationOpen((prev) => !prev);
                        }
                      }}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Mở giám sát kiểm duyệt"
                    >
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${adminModerationOpen ? "rotate-180" : ""}`} />
                    </span>
                  </>
                )}
              </button>
              {!collapsed && adminModerationOpen && (
                <div className="ml-4 space-y-1 border-l border-slate-200 pl-2">
                  {adminModerationItems.map((item) => (
                    <NavItem key={item.to} collapsed={collapsed} to={item.to} label={item.label} icon={item.icon} />
                  ))}
                </div>
              )}
            </>
          )}

          {primaryRole === "Staff" && !isOwnerVerificationSection && (
            <>
              {!collapsed && <span className="my-1 block border-t border-slate-100" />}
              <button
                type="button"
                onClick={() => {
                  setStaffModerationOpen(true);
                  navigate("/staff/moderation");
                }}
                className={[
                  "flex h-10 w-full items-center rounded-md text-sm font-medium transition-colors",
                  collapsed ? "justify-center" : "gap-3 px-3",
                  isStaffModerationPath ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-brand-50 hover:text-brand-700",
                ].join(" ")}
                title="Kiểm duyệt"
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Kiểm duyệt</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        setStaffModerationOpen((prev) => !prev);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          setStaffModerationOpen((prev) => !prev);
                        }
                      }}
                      className="inline-flex h-6 w-6 items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      aria-label="Mở kiểm duyệt"
                    >
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${staffModerationOpen ? "rotate-180" : ""}`} />
                    </span>
                  </>
                )}
              </button>
              {!collapsed && staffModerationOpen && (
                <div className="ml-4 space-y-1 border-l border-slate-200 pl-2">
                  {staffModerationItems.map((item) => (
                    <NavItem key={item.to} collapsed={collapsed} to={item.to} label={item.label} icon={item.icon} />
                  ))}
                </div>
              )}
            </>
          )}

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

        <div className="shrink-0 border-t border-slate-100 bg-white pt-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex h-8 w-full items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </nav>
    </aside>
  );
}
