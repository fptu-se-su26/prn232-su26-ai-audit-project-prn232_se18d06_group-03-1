# Chính Sách Đánh Giá Rủi Ro Booking

## Rủi ro thấp
Booking được xem là rủi ro thấp khi người thuê có điểm uy tín cao, không có lịch sử hủy chuyến, thời gian thuê ngắn và giá trị xe ở mức thấp hoặc trung bình. Nhân viên có thể duyệt nếu định danh và thanh toán đã hợp lệ.

## Rủi ro trung bình
Booking được xem là rủi ro trung bình khi người thuê có trust score từ 40 đến 60, có một hoặc hai lần hủy, thời gian thuê từ 7 đến 21 ngày, hoặc giá trị xe trên 1.000.000.000 VND. Nhân viên cần kiểm tra lịch sử người thuê, trạng thái thanh toán và ghi chú của chủ xe trước khi duyệt.

## Rủi ro cao
Booking được xem là rủi ro cao khi trust score dưới 30 hoặc cancel count lớn hơn 2. Nhân viên nên từ chối hoặc chuyển cấp xử lý, trừ khi khách hàng cung cấp bằng chứng bổ sung mạnh và quyết định duyệt thủ công được ghi log.

## Thời gian thuê dài
Thời gian thuê dài làm tăng rủi ro vận hành vì xe nằm ngoài kiểm soát của chủ xe lâu hơn. Booking trên 14 ngày cần kiểm tra chặt hơn về cọc, định danh và xác nhận liên hệ.

## Giá trị xe cao
Xe có giá trị cao cần quy trình kiểm tra nghiêm ngặt hơn. Xe trên 1.000.000.000 VND cần người thuê đã xác minh danh tính, thanh toán hoặc cọc rõ ràng và có sự chấp thuận của chủ xe.
