import AdminUserListPage from "./AdminUserListPage";

export default function AdminCustomerListPage() {
  return (
    <AdminUserListPage
      title="Quản lý khách hàng"
      subtitle="Danh sách tất cả khách hàng trong hệ thống."
      roleFilter="Customer"
      showRoleColumn={false}
    />
  );
}
