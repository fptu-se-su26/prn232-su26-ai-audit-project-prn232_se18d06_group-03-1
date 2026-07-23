import StaffUserListPage from "./StaffUserListPage";

export default function StaffCustomerListPage() {
  return (
    <StaffUserListPage
      title="Quản lý khách hàng"
      subtitle="Danh sách tất cả khách hàng trong hệ thống."
      roleFilter="Customer"
      showRoleColumn={false}
    />
  );
}
