import AdminUserListPage from "./AdminUserListPage";

export default function AdminStaffListPage() {
  return (
    <AdminUserListPage
      title="Quản lý nhân viên"
      subtitle="Danh sách nhân viên trong hệ thống."
      roleFilter="Staff"
      showRoleColumn={false}
    />
  );
}
