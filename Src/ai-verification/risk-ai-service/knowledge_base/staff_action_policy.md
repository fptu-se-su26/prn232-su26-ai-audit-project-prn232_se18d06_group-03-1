# Chính Sách Hành Động Của Nhân Viên

## Nên duyệt
Nên duyệt khi risk level là Low, hồ sơ người thuê ổn định, thanh toán hợp lệ và không có tranh chấp đang mở hoặc mẫu hủy chuyến đáng ngờ.

## Cân nhắc
Cần kiểm tra thủ công khi risk level là Medium. Nhân viên nên xem các yếu tố rủi ro chính, đối chiếu với yêu cầu của chủ xe và yêu cầu xác nhận bổ sung nếu cần.

## Nên từ chối
Nên từ chối khi risk level là High do trust score dưới 30, cancel count lớn hơn 2, hành vi thanh toán đáng ngờ, tranh chấp chưa xử lý hoặc thông tin người thuê không phù hợp yêu cầu booking.

## Ghi log kiểm toán
Mỗi quyết định ML risk cần được lưu với bookingId, input features, model version, điểm rủi ro, policy context được truy xuất và gợi ý cuối cùng. Log giúp nhân viên giải thích vì sao booking được duyệt, cân nhắc hoặc từ chối.
