import {
  ArrowLeftFromLine,
  BadgeDollarSign,
  BarChart3,
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
  Megaphone,
  MessageSquare,
  MapPinned,
  Monitor,
  Percent,
  ReceiptText,
  Scale,
  Settings,
  ShieldCheck,
  UserCog,
  UserPlus,
  UserRound,
  Wallet,
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
  Owner: LayoutDashboard,
  Customer: LayoutDashboard,
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
  { to: "/admin/driver-license-verifications", label: "Xác minh GPLX", icon: FileBadge },
  { to: "/admin/national-id-verifications", label: "Xác minh CCCD", icon: IdCard },
  { to: "/admin/disputes", label: "Tranh chấp", icon: Scale },
];

const adminPostMgmtItems = [
  { to: "/admin/posts", label: "Thống kê tin", icon: BarChart3, end: true },
  { to: "/admin/posts/owners", label: "Xe của chủ xe", icon: Car },
];

const staffModerationItems = [
  { to: "/staff/vehicle-documents", label: "Duyệt hồ sơ xe", icon: FileBadge },
  { to: "/staff/vehicle-listings", label: "Duyệt bài đăng xe", icon: ClipboardList },
  { to: "/staff/driver-license-verifications", label: "Duyệt GPLX", icon: FileBadge },
  { to: "/staff/national-id-verifications", label: "Duyệt CCCD", icon: IdCard },
  { to: "/staff/disputes", label: "Tranh chấp", icon: Scale },
];

const ownerVehicleItems = [
  { to: "/owner/vehicles/car", label: "Ô tô", icon: Car },
  { to: "/owner/vehicles/motorbike", label: "Xe máy", icon: Bike },
];

const adminWalletItems = [
  { to: "/admin/wallets", label: "Tài khoản & giao dịch", icon: ReceiptText },
  { to: "/admin/withdrawals", label: "Yêu cầu rút tiền", icon: Landmark },
];

const staffWalletItems = [
  { to: "/staff/wallets", label: "Tài khoản & giao dịch", icon: ReceiptText },
  { to: "/staff/withdrawals", label: "Yêu cầu rút tiền", icon: Landmark },
];

const adminUserManagementItems = [
  { to: "/admin/users/customers", label: "Khách hàng", icon: UserRound },
  { to: "/admin/users/owners", label: "Chủ xe", icon: Car },
  { to: "/admin/users/staffs", label: "Nhân viên", icon: ClipboardList },
];

const staffUserManagementItems = [
  { to: "/staff/users/customers", label: "Khách hàng", icon: UserRound },
  { to: "/staff/users/owners", label: "Chủ xe", icon: Car },
];

const navBaseClass = "flex h-10 items-center rounded-md text-sm font-semibold transition-all duration-150";
const navActiveClass = "bg-gradient-to-r from-brand-100/90 via-white to-fuchsia-50 text-brand-800 shadow-sm ring-1 ring-inset ring-brand-200";
const navInactiveClass = "text-slate-700 hover:bg-slate-50 hover:text-slate-950";
const nestedNavClass = "ml-4 space-y-1 border-l border-brand-100 pl-2";
const expandButtonClass = "inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-700";
const sectionToneClasses = {
  amber: {
    dot: "bg-amber-500 shadow-amber-500/30",
    text: "text-amber-700",
  },
  brand: {
    dot: "bg-brand-500 shadow-brand-500/30",
    text: "text-brand-700",
  },
  emerald: {
    dot: "bg-emerald-500 shadow-emerald-500/30",
    text: "text-emerald-700",
  },
  rose: {
    dot: "bg-rose-500 shadow-rose-500/30",
    text: "text-rose-700",
  },
  sky: {
    dot: "bg-sky-500 shadow-sky-500/30",
    text: "text-sky-700",
  },
} as const;

type SectionTone = keyof typeof sectionToneClasses;

function NavItem({ to, label, icon: Icon, collapsed, end }: { to: string; label: string; icon: React.ComponentType<{ className?: string }>; collapsed: boolean; end?: boolean }) {
  const currentLocation = useLocation();
  const [targetPath, targetQuery] = to.split("?");
  const queryIsActive = targetQuery
    ? currentLocation.pathname === targetPath && [...new URLSearchParams(targetQuery)].every(([key, value]) => new URLSearchParams(currentLocation.search).get(key) === value)
    : null;

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          navBaseClass,
          collapsed ? "justify-center" : "gap-3 px-3",
          (queryIsActive ?? isActive) ? navActiveClass : navInactiveClass,
        ].join(" ")
      }
      title={collapsed ? label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && label}
    </NavLink>
  );
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
  const isAdminUserMgmtPath = location.pathname === "/admin/users" || location.pathname.startsWith("/admin/users/");
  const [adminUserMgmtOpen, setAdminUserMgmtOpen] = useState(isAdminUserMgmtPath);
  const isStaffUserMgmtPath = location.pathname === "/staff/users" || location.pathname.startsWith("/staff/users/");
  const [staffUserMgmtOpen, setStaffUserMgmtOpen] = useState(isStaffUserMgmtPath);
  const walletItems = primaryRole === "Admin" ? adminWalletItems : staffWalletItems;
  const isWalletPath = walletItems.some((item) => location.pathname.startsWith(item.to));
  const [walletOpen, setWalletOpen] = useState(isWalletPath);
  const isPostMgmtPath = location.pathname.startsWith("/admin/posts");
  const [postMgmtOpen, setPostMgmtOpen] = useState(isPostMgmtPath);

  useEffect(() => {
    if (isVehicleCatalogPath) setVehicleCatalogOpen(true);
    if (isVehiclePricingPath) setVehiclePricingOpen(true);
    if (isAdminModerationPath) setAdminModerationOpen(true);
    if (isStaffModerationPath) setStaffModerationOpen(true);
    if (isOwnerVehiclePath) setOwnerVehicleOpen(true);
    if (isAdminUserMgmtPath) setAdminUserMgmtOpen(true);
    if (isStaffUserMgmtPath) setStaffUserMgmtOpen(true);
    if (isWalletPath) setWalletOpen(true);
    if (isPostMgmtPath) setPostMgmtOpen(true);
  }, [isVehicleCatalogPath, isVehiclePricingPath, isAdminModerationPath, isStaffModerationPath, isOwnerVehiclePath, isAdminUserMgmtPath, isStaffUserMgmtPath, isWalletPath, isPostMgmtPath]);

  const mainItems = [
    { to: getDashboardPath([primaryRole]), label: roleLabels[primaryRole] ?? "Khu vực của tôi", icon: RoleIcon },
  ];

  if (primaryRole === "Admin") {
    mainItems.push({ to: "/admin/system-config", label: "Cấu hình hệ thống", icon: Settings });
  }

  if (primaryRole === "Customer") {
    mainItems.push({ to: "/customer/bookings", label: "Lịch sử thuê xe", icon: CalendarCheck });
    mainItems.push({ to: "/chat", label: "Tin nhắn", icon: MessageSquare });
    if (!user?.roles?.includes("Owner")) {
      mainItems.push({ to: "/become-owner", label: "Đăng ký làm chủ xe", icon: UserPlus });
    }
    mainItems.push({ to: "/customer/disputes", label: "Tranh chấp", icon: Scale });
    mainItems.push({ to: "/customer/support-tickets", label: "Hỗ trợ", icon: MessageSquare });
    mainItems.push({ to: "/", label: "Về trang chủ", icon: Home });
  }

  if (primaryRole === "Staff") {
    mainItems.push({ to: "/staff/support-tickets", label: "Hỗ trợ", icon: MessageSquare });
    mainItems.push({ to: "/staff/broadcast", label: "Gửi thông báo", icon: Megaphone });
  }

  if (primaryRole === "Owner") {
    mainItems.push({ to: "/owner/bookings", label: "Yêu cầu thuê", icon: CalendarCheck });
    mainItems.push({ to: "/chat", label: "Tin nhắn", icon: MessageSquare });
    mainItems.push({ to: "/owner/disputes", label: "Tranh chấp", icon: Scale });
    mainItems.push({ to: "/", label: "Về trang chủ", icon: Home });
  }

  const profileGroups = [
    {
      key: "account",
      heading: "Tài khoản",
      icon: UserRound,
      tone: "brand",
      items: [
        { to: "/account", label: "Tổng quan", icon: LayoutDashboard },
        { to: "/account/profile", label: "Hồ sơ cá nhân", icon: UserRound },
      ],
    },
    {
      key: "wallet",
      heading: "Ví tiền",
      icon: Wallet,
      tone: "emerald",
      items: [
        { to: "/account/bank", label: "Tài khoản ngân hàng", icon: Landmark },
        { to: "/account/wallet?tab=transactions", label: "Lịch sử giao dịch", icon: ReceiptText },
        ...(primaryRole === "Owner" ? [{ to: "/account/wallet?tab=withdrawals", label: "Yêu cầu rút tiền", icon: Wallet }] : []),
      ],
    },
    {
      key: "verification",
      heading: "Xác minh",
      icon: ShieldCheck,
      tone: "sky",
      items: [
        { to: "/account/verification", label: "Tổng quan xác minh", icon: ShieldCheck },
        { to: "/account/verification/cccd", label: "CCCD / CMND", icon: IdCard },
        { to: "/account/verification/drivers-license", label: "Giấy phép lái xe", icon: FileBadge },
      ],
    },
    {
      key: "security",
      heading: "Bảo mật",
      icon: KeyRound,
      tone: "amber",
      items: [
        { to: "/account/security/password", label: "Mật khẩu", icon: KeyRound },
        { to: "/account/security/sessions", label: "Phiên đăng nhập", icon: Monitor },
      ],
    },
    {
      key: "system",
      heading: "Hệ thống",
      icon: Home,
      tone: "rose",
      items: [
        { to: "/", label: "Về trang chủ", icon: Home },
        { to: "/logout", label: "Đăng xuất", icon: LogOut },
      ],
    },
  ];

  const activeProfileGroupKey = profileGroups.find((group) =>
    group.items.some((item) => location.pathname === item.to.split("?")[0])
  )?.key;
  const [profileGroupsOpen, setProfileGroupsOpen] = useState<Record<string, boolean>>({});
  const isProfileGroupOpen = (key: string) => profileGroupsOpen[key] ?? key === activeProfileGroupKey;

  const isBecomeOwnerPage = location.pathname.startsWith("/become-owner");
  const isOwnerVerificationSection = isAccountSection || isBecomeOwnerPage;

  const items = isOwnerVerificationSection ? [] : mainItems;

  const backItem = isOwnerVerificationSection
    ? { to: getDashboardPath([primaryRole]), label: roleLabels[primaryRole] ?? "Khu vực của tôi", icon: ArrowLeftFromLine }
    : null;
  const dashboardPath = getDashboardPath([primaryRole]);

  useEffect(() => {
    if (activeProfileGroupKey) {
      setProfileGroupsOpen((prev) => (prev[activeProfileGroupKey] ? prev : { ...prev, [activeProfileGroupKey]: true }));
    }
  }, [activeProfileGroupKey]);

  return (
    <aside
      className={`hidden border-r border-slate-200 bg-gradient-to-b from-white via-white to-brand-50/20 shadow-[10px_0_30px_rgba(15,23,42,0.05)] transition-all duration-200 md:sticky md:top-16 md:flex md:h-[calc(100vh-4rem)] md:flex-col md:self-start ${collapsed ? "w-16" : "w-60"}`}
    >
      <nav className="flex min-h-0 flex-1 flex-col p-3">
        <div className="sidebar-scrollbar -mr-2 min-h-0 flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden pr-2 pb-3">
          {isOwnerVerificationSection && (
            <>
              <NavItem end collapsed={collapsed} to={backItem!.to} label={backItem!.label} icon={backItem!.icon} />

              <div className="mt-2 space-y-1.5">
                {profileGroups.map((group) => {
                  const GroupIcon = group.icon;
                  const toneClass = sectionToneClasses[group.tone as SectionTone];
                  const groupIsOpen = isProfileGroupOpen(group.key);
                  const groupIsActive = group.key === activeProfileGroupKey;

                  return (
                    <div key={group.key}>
                      <button
                        type="button"
                        onClick={() => {
                          if (collapsed) {
                            navigate(group.items[0].to);
                            return;
                          }
                          setProfileGroupsOpen((prev) => ({ ...prev, [group.key]: !groupIsOpen }));
                        }}
                        className={[
                          navBaseClass,
                          "w-full",
                          collapsed ? "justify-center" : "gap-3 px-3",
                          groupIsActive ? navActiveClass : navInactiveClass,
                        ].join(" ")}
                        title={group.heading}
                      >
                        <GroupIcon className={`h-4 w-4 shrink-0 ${groupIsActive ? "" : toneClass.text}`} />
                        {!collapsed && (
                          <>
                            <span className="min-w-0 flex-1 truncate text-left">{group.heading}</span>
                            <span className={expandButtonClass} aria-hidden="true">
                              <ChevronDown className={`h-4 w-4 transition-transform ${groupIsOpen ? "rotate-180" : ""}`} />
                            </span>
                          </>
                        )}
                      </button>

                      {!collapsed && groupIsOpen && (
                        <div className={nestedNavClass}>
                          {group.items.map((item) => (
                            <NavItem key={item.to} end collapsed={collapsed} to={item.to} label={item.label} icon={item.icon} />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {!isOwnerVerificationSection && items.map((item) => (
            <NavItem key={item.to} end={item.to === dashboardPath} collapsed={collapsed} to={item.to} label={item.label} icon={item.icon} />
          ))}

          {(primaryRole === "Admin" || primaryRole === "Staff") && !isOwnerVerificationSection && (
            <>
              {!collapsed && <span className="my-1 block border-t border-slate-100" />}
              <button
                type="button"
                onClick={() => {
                  setWalletOpen(true);
                  navigate(walletItems[0].to);
                }}
                className={[
                  navBaseClass,
                  "w-full",
                  collapsed ? "justify-center" : "gap-3 px-3",
                  isWalletPath ? navActiveClass : navInactiveClass,
                ].join(" ")}
                title="Ví tiền"
              >
                <Wallet className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Ví tiền</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => { event.stopPropagation(); setWalletOpen((prev) => !prev); }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          setWalletOpen((prev) => !prev);
                        }
                      }}
                      className={expandButtonClass}
                      aria-label="Mở mục ví tiền"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${walletOpen ? "rotate-180" : ""}`} />
                    </span>
                  </>
                )}
              </button>
              {!collapsed && walletOpen && (
                <div className={nestedNavClass}>
                  {walletItems.map((item) => <NavItem key={item.to} collapsed={collapsed} {...item} />)}
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
                  setAdminUserMgmtOpen(true);
                  navigate("/admin/users");
                }}
                className={[
                  navBaseClass,
                  "w-full",
                  collapsed ? "justify-center" : "gap-3 px-3",
                  isAdminUserMgmtPath ? navActiveClass : navInactiveClass,
                ].join(" ")}
                title="Người dùng"
              >
                <UserCog className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Người dùng</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        setAdminUserMgmtOpen((prev) => !prev);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          setAdminUserMgmtOpen((prev) => !prev);
                        }
                      }}
                      className={expandButtonClass}
                      aria-label="Mở quản lý người dùng"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${adminUserMgmtOpen ? "rotate-180" : ""}`} />
                    </span>
                  </>
                )}
              </button>
              {!collapsed && adminUserMgmtOpen && (
                <div className={nestedNavClass}>
                  {adminUserManagementItems.map((item) => (
                    <NavItem key={item.to} collapsed={collapsed} to={item.to} label={item.label} icon={item.icon} />
                  ))}
                </div>
              )}
            </>
          )}

          {primaryRole === "Admin" && !isOwnerVerificationSection && (
            <>
              {!collapsed && <span className="my-1 block border-t border-slate-100" />}
              <NavItem collapsed={collapsed} to="/admin/broadcast" label="Gửi thông báo" icon={Megaphone} />
            </>
          )}

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
                  navBaseClass,
                  "w-full",
                  collapsed ? "justify-center" : "gap-3 px-3",
                  isAdminModerationPath ? navActiveClass : navInactiveClass,
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
                      className={expandButtonClass}
                      aria-label="Mở giám sát kiểm duyệt"
                    >
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${adminModerationOpen ? "rotate-180" : ""}`} />
                    </span>
                  </>
                )}
              </button>
              {!collapsed && adminModerationOpen && (
                <div className={nestedNavClass}>
                  {adminModerationItems.map((item) => (
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
                  setPostMgmtOpen(true);
                  navigate("/admin/posts");
                }}
                className={[
                  navBaseClass,
                  "w-full",
                  collapsed ? "justify-center" : "gap-3 px-3",
                  isPostMgmtPath ? navActiveClass : navInactiveClass,
                ].join(" ")}
                title="Quản lý tin"
              >
                <ClipboardList className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Quản lý tin</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        setPostMgmtOpen((prev) => !prev);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          setPostMgmtOpen((prev) => !prev);
                        }
                      }}
                      className={expandButtonClass}
                      aria-label="Mở quản lý tin"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${postMgmtOpen ? "rotate-180" : ""}`} />
                    </span>
                  </>
                )}
              </button>
              {!collapsed && postMgmtOpen && (
                <div className={nestedNavClass}>
                  {adminPostMgmtItems.map((item) => (
                    <NavItem key={item.to} collapsed={collapsed} to={item.to} label={item.label} icon={item.icon} end={(item as any).end} />
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
                  navBaseClass,
                  "w-full",
                  collapsed ? "justify-center" : "gap-3 px-3",
                  isStaffModerationPath ? navActiveClass : navInactiveClass,
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
                      className={expandButtonClass}
                      aria-label="Mở kiểm duyệt"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${staffModerationOpen ? "rotate-180" : ""}`} />
                    </span>
                  </>
                )}
              </button>
              {!collapsed && staffModerationOpen && (
                <div className={nestedNavClass}>
                  {staffModerationItems.map((item) => (
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
                  setStaffUserMgmtOpen(true);
                  navigate("/staff/users/customers");
                }}
                className={[
                  navBaseClass,
                  "w-full",
                  collapsed ? "justify-center" : "gap-3 px-3",
                  isStaffUserMgmtPath ? navActiveClass : navInactiveClass,
                ].join(" ")}
                title="Người dùng"
              >
                <UserCog className="h-4 w-4 shrink-0" />
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left">Người dùng</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        event.stopPropagation();
                        setStaffUserMgmtOpen((prev) => !prev);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          event.stopPropagation();
                          setStaffUserMgmtOpen((prev) => !prev);
                        }
                      }}
                      className={expandButtonClass}
                      aria-label="Mở quản lý người dùng"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${staffUserMgmtOpen ? "rotate-180" : ""}`} />
                    </span>
                  </>
                )}
              </button>
              {!collapsed && staffUserMgmtOpen && (
                <div className={nestedNavClass}>
                  {staffUserManagementItems.map((item) => (
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
                  navBaseClass,
                  "w-full",
                  collapsed ? "justify-center" : "gap-3 px-3",
                  isOwnerVehiclePath ? navActiveClass : navInactiveClass,
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
                      className={expandButtonClass}
                      aria-label="Mở danh mục xe"
                    >
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${ownerVehicleOpen ? "rotate-180" : ""}`} />
                    </span>
                  </>
                )}
              </button>
              {!collapsed && ownerVehicleOpen && (
                <div className={nestedNavClass}>
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
                  navBaseClass,
                  "w-full",
                  collapsed ? "justify-center" : "gap-3 px-3",
                  isVehicleCatalogPath ? navActiveClass : navInactiveClass,
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
                      className={expandButtonClass}
                      aria-label="Mở danh mục phương tiện"
                    >
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${vehicleCatalogOpen ? "rotate-180" : ""}`} />
                    </span>
                  </>
                )}
              </button>
              {!collapsed && vehicleCatalogOpen && (
                <div className={nestedNavClass}>
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
                  navBaseClass,
                  "w-full",
                  collapsed ? "justify-center" : "gap-3 px-3",
                  isVehiclePricingPath ? navActiveClass : navInactiveClass,
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
                      className={expandButtonClass}
                      aria-label="Mở danh mục giá xe"
                    >
                      <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${vehiclePricingOpen ? "rotate-180" : ""}`} />
                    </span>
                  </>
                )}
              </button>
              {!collapsed && vehiclePricingOpen && (
                <div className={nestedNavClass}>
                  {vehiclePricingItems.map((item) => (
                    <NavItem key={item.to} collapsed={collapsed} to={item.to} label={item.label} icon={item.icon} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 pt-2">
          <button
            type="button"
            onClick={onToggle}
            className="flex h-8 w-full items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-brand-50 hover:text-brand-700"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </nav>
    </aside>
  );
}
