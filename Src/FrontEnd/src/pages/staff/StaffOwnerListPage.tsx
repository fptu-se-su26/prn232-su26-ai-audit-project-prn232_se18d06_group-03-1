import StaffUserListPage from "./StaffUserListPage";

export default function StaffOwnerListPage() {
  return (
    <StaffUserListPage
      title="Quản lý chủ xe"
      subtitle="Danh sách chủ xe. Chủ xe có thể đồng thời là khách hàng."
      roleFilter="Owner"
      showRoleColumn={true}
    />
  );
}
