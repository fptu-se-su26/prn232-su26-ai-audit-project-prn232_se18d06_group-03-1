import AdminUserListPage from "./AdminUserListPage";

export default function AdminOwnerListPage() {
  return (
    <AdminUserListPage
      title="Quản lý chủ xe"
      subtitle="Danh sách chủ xe. Chủ xe có thể đồng thời là khách hàng hoặc nhân viên."
      roleFilter="Owner"
      showRoleColumn={true}
    />
  );
}
