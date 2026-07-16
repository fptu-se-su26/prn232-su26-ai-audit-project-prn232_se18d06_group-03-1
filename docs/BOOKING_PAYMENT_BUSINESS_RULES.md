# MoveVN — Business Rules cho Booking và Thanh toán

> Trạng thái tài liệu: mô tả **hành vi thực tế của mã nguồn hiện tại (as-is)** sau đợt audit ngày 15/07/2026.  
> Phạm vi: booking, định giá, tiền cọc, PayOS, escrow, hủy/hoàn tiền, check-in/check-out, tranh chấp, ví, tài khoản ngân hàng và rút tiền.

## 1. Cách đọc tài liệu

| Ký hiệu | Ý nghĩa |
|---|---|
| ✅ | Rule đã được backend thực thi tương đối đầy đủ |
| ⚠️ | Rule có thực thi nhưng còn điểm không nhất quán hoặc thiếu chốt chặn |
| ❌ | Chưa có hoặc đang sai so với business rule mục tiêu |

Backend và dữ liệu database là nguồn quyết định cuối cùng. Giá hoặc trạng thái được frontend tính trước chỉ mang tính preview.

Các thời điểm trong backend được xử lý bằng UTC. Tiền tệ mặc định là VND và các phép tính booking làm tròn đến đơn vị đồng.

## 2. Thuật ngữ tài chính

| Thuật ngữ | Định nghĩa |
|---|---|
| `BasePrice` | Giá ngày của xe nhân tổng số ngày thuê, chưa trừ chiết khấu |
| `TotalAmount` | Tổng giá thuê khách phải trả sau chiết khấu; giá này đã bao gồm phí nền tảng |
| `PlatformFee` | Phần doanh thu của nền tảng, được tách nội bộ từ `TotalAmount` |
| `DepositAmount` | Khoản khách trả trước qua PayOS, là một phần của `TotalAmount` |
| Số tiền còn lại | `TotalAmount - DepositAmount`, khách trả cho chủ xe khi nhận xe |
| Escrow | Khoản cọc đã thu nhưng chưa thuộc số dư khả dụng của chủ xe hoặc nền tảng |
| Wallet | Sổ cái nội bộ dùng ghi nhận nạp tiền, chi booking, hoàn tiền, doanh thu và rút tiền |

Tiền cọc trong mô hình mục tiêu là **khoản trả trước tiền thuê**, không phải khoản ký quỹ được mặc định hoàn lại khi chuyến đi kết thúc bình thường.

## 3. Vai trò và quyền nghiệp vụ

| Vai trò | Quyền chính |
|---|---|
| Customer | Tạo booking, thanh toán cọc, xem báo giá hủy, hủy booking, xác nhận check-in/check-out, xác nhận hoàn tất |
| Owner | Duyệt/từ chối booking, lập biên bản check-in/check-out, xác nhận hoàn tất, nhận tiền escrow/bồi hoàn, rút tiền |
| Staff | Xử lý tranh chấp theo quyền được cấp, xem và xử lý yêu cầu rút tiền |
| Admin | Quản lý rule phí, ví, tranh chấp cấp cao, xử lý rút tiền và điều chỉnh số dư |
| System | Từ chối booking quá 24 giờ chưa duyệt, hủy booking quá hạn cọc, xử lý webhook PayOS |

## 4. Vòng đời Booking

```text
Pending
 ├─ Owner duyệt ───────────────> Approved
 │                                ├─ PayOS xác nhận cọc ──> DepositPaid
 │                                │                         ├─ Customer xác nhận check-in ─> InProgress
 │                                │                         │                                  └─ check-out/complete ─> Completed
 │                                │                         └─ Customer complete trực tiếp ─> Completed  [còn lỏng]
 │                                ├─ Quá hạn thanh toán ──> Cancelled
 │                                └─ Customer hủy ─────────> Cancelled
 ├─ Owner từ chối ─────────────> Rejected
 ├─ Quá 24 giờ chưa xử lý ─────> Rejected
 └─ Customer hủy ──────────────> Cancelled
```

`Confirmed` vẫn được một số service chấp nhận như trạng thái tương thích cũ, nhưng mã hiện tại không có transition chính nào tạo ra trạng thái này.

### 4.1. Danh mục trạng thái Booking

| Trạng thái | Ý nghĩa | Có khóa lịch xe |
|---|---|---|
| `Pending` | Chờ chủ xe duyệt | Không |
| `Approved` | Đã duyệt, chờ cọc | Có |
| `DepositPaid` | Cọc đã được webhook xác nhận và đang giữ escrow | Có |
| `Confirmed` | Trạng thái tương thích cũ | Có |
| `InProgress` | Khách đã xác nhận nhận xe | Có |
| `Completed` | Chuyến đi được đánh dấu hoàn tất | Không |
| `Rejected` | Chủ xe hoặc hệ thống từ chối | Không |
| `Cancelled` | Khách/hệ thống hủy | Không |

## 5. Tạo Booking

### 5.1. Điều kiện bắt buộc

Customer chỉ được tạo booking khi:

1. Ngày nhận không trước ngày UTC hiện tại.
2. Thời điểm trả xe phải sau thời điểm nhận xe.
3. Xe tồn tại và có `Vehicle.Status = Approved`.
4. Customer đã xác thực CCCD.
5. Customer đã xác thực giấy phép lái xe.
6. Có giấy phép phù hợp với loại xe.
7. Nếu biến thể xe yêu cầu hạng bằng cụ thể, hạng bằng của khách phải tương thích.
8. Khoảng thuê không trùng booking đang khóa lịch hoặc ngày chủ xe đã block.
9. Có rule phí nền tảng đang hoạt động áp dụng cho chủ xe hoặc rule global.

⚠️ Backend hiện chỉ chặn `StartDate.Date < today`; vì vậy có thể tạo booking cùng ngày nhưng thời điểm nhận đã qua. Booking đó sẽ không thể được chủ xe duyệt.

### 5.2. Chống race condition

- Khi tạo booking, hệ thống lấy Redis lock theo `booking:create:{vehicleId}` trong 30 giây.
- Nếu không lấy được lock, request thất bại.
- Lock được giải phóng trong `finally`.

### 5.3. Chồng lịch

Hai khoảng thời gian chồng nhau khi:

```text
existing.StartDate < requested.EndDate
AND existing.EndDate > requested.StartDate
```

Các trạng thái khóa lịch: `Approved`, `DepositPaid`, `Confirmed`, `InProgress`.

`Pending` không khóa lịch. Nhiều khách có thể gửi yêu cầu cùng khoảng thời gian; chỉ một yêu cầu có thể được duyệt. Khi một booking thanh toán cọc thành công, hệ thống hủy các booking `Pending` hoặc `Approved` còn trùng lịch.

Ngày block của chủ xe được so sánh theo `DateOnly` và có tính cả hai đầu ngày.

⚠️ Hàm gợi ý “ngày khả dụng tiếp theo” hiện vẫn tính cả booking `Pending`, khác với rule khóa lịch chính.

## 6. Định giá

### 6.1. Số ngày thuê

```text
TotalDays = max(1, ceil((EndDate - StartDate).TotalDays))
```

Mọi phần ngày đều được làm tròn thành một ngày thuê.

### 6.2. Chiết khấu theo thời lượng

| Số ngày | Chiết khấu |
|---:|---:|
| 1–2 ngày | 0% |
| 3 ngày | 5% |
| 4 ngày | 0% |
| 5–6 ngày | 10% |
| 7–29 ngày | 15% |
| Từ 30 ngày | 25% |

⚠️ Khoảng 4 ngày không thuộc tier nào nên hiện nhận 0%. Cần xác nhận đây là chủ ý hay thiếu tier.

### 6.3. Công thức tổng tiền

```text
BasePrice      = Vehicle.PricePerDay × TotalDays
DiscountAmount = round(BasePrice × DiscountPercent / 100)
TotalAmount    = BasePrice - DiscountAmount
```

`TotalAmount` là giá cuối khách nhìn thấy và **đã bao gồm phí nền tảng**.

### 6.4. Phí nền tảng

Rule được chọn theo thứ tự:

1. Rule `TargetType = Owner` đúng `OwnerId`.
2. Nếu không có, dùng rule `All` hoặc `Global`.
3. Trong cùng nhóm, ưu tiên `Priority` nhỏ hơn rồi `Id` nhỏ hơn.
4. Rule phải active và nằm trong thời gian `StartAt/EndAt`.

Kiểu phí:

```text
Percentage: fee = round(TotalAmount × FeeValue / 100)
Fixed:      fee = FeeValue
```

Sau đó áp dụng `MinFee`, `MaxFee` nếu có và clamp trong khoảng `0..TotalAmount`.

Booking snapshot các trường `PlatformFeeRuleId`, `PlatformFeeType`, `PlatformFeeValue`, `PlatformFee`. Việc admin sửa rule sau đó không làm thay đổi booking cũ.

❌ Hai màn hình tạo booking frontend hiện preview `fee = TotalAmount × 10%` cố định. Backend vẫn tính đúng rule cấu hình, nhưng số phí preview có thể sai. Tổng tiền và tiền cọc không bị cộng thêm phí nên số khách trả vẫn có thể đúng.

### 6.5. Tiền cọc

Owner chỉ được cấu hình `DepositPercent` từ 20% đến 50% khi tạo/cập nhật xe.

Khi tạo booking, backend phòng thủ bằng:

```text
EffectiveDepositPercent = clamp(Vehicle.DepositPercent, 20, 100)
DepositAmount           = round(TotalAmount × EffectiveDepositPercent / 100)
RemainingAmount         = TotalAmount - DepositAmount
```

Lưu ý: validation xe giới hạn 50%, nhưng booking clamp tối đa 100% để chịu được dữ liệu legacy.

Ví dụ:

```text
Tổng tiền:       180.000đ
Tiền cọc:         50.000đ
Còn lại trả chủ: 130.000đ khi nhận xe
```

## 7. Risk Score

Risk score chỉ hỗ trợ chủ xe quyết định, không tự động từ chối booking.

- Điểm nằm trong `0..100`.
- `Low`: 0–30.
- `Medium`: 31–60.
- `High`: 61–100.
- Điểm nền: 8.

Nhóm yếu tố gồm: xác thực danh tính, tuổi tài khoản, số chuyến hoàn tất, số lần hủy/report, trust score, đánh giá của chủ xe, số booking hoạt động, tần suất booking 7 ngày, thời gian từ lúc đặt đến lúc nhận xe, giá trị booking, thời lượng thuê và tiền cọc.

## 8. Duyệt và từ chối Booking

### 8.1. Owner duyệt

✅ Chỉ đúng owner của xe được duyệt. Booking phải là `Pending`, chưa đến giờ nhận xe và không trùng booking đang khóa lịch.

Khi duyệt:

```text
Status       = Approved
PaymentDueAt = min(now + 2 giờ, StartDate)
```

Hệ thống lưu status history, gửi email yêu cầu cọc nếu có và tạo notification cho khách. Lỗi gửi email không rollback việc duyệt.

### 8.2. Owner từ chối

- Chỉ áp dụng cho `Pending`.
- Bắt buộc có lý do.
- Chuyển sang `Rejected`, lưu `CancelReason`, `CancelledAt` và status history.

### 8.3. Tự động từ chối sau 24 giờ

Background service quét mặc định mỗi 5 phút:

- `Pending` có `CreatedAt < now - 24 giờ` được chuyển sang `Rejected`.
- Gửi notification cho customer và owner.
- Mỗi batch mặc định tối đa 50 booking.

Cấu hình:

| Biến | Mặc định |
|---|---:|
| `BOOKING_AUTO_CANCEL_ENABLED` | `true` |
| `BOOKING_AUTO_CANCEL_PENDING_MINUTES` | `1440` |
| `BOOKING_AUTO_CANCEL_INTERVAL_SECONDS` | `300` |
| `BOOKING_AUTO_CANCEL_BATCH_SIZE` | `50` |

## 9. Thanh toán cọc qua PayOS

### 9.1. Tạo link thanh toán

Chỉ Customer của booking được tạo link khi:

- Booking đang `Approved`.
- Chưa quá `PaymentDueAt`.
- Chưa đến `StartDate`.

Số tiền link là `DepositAmount`. Link PayOS hết hạn sau 30 phút; booking vẫn có thể tạo link mới cho đến deadline 2 giờ. Nếu tồn tại link pending, hệ thống cố hủy link cũ rồi tạo order mới.

### 9.2. Nguồn xác nhận duy nhất

✅ Frontend redirect về trang booking không được phép tự xác nhận thanh toán.

Chỉ `POST /api/webhooks/payos` có thể đổi payment sang `Paid`, và chỉ khi:

1. Payload đọc được.
2. PayOS trả `Code = 00`.
3. Chữ ký webhook hợp lệ.
4. Tìm thấy payment theo `OrderCode`.
5. Số tiền webhook bằng chính xác `Payment.Amount`.
6. Với cọc booking: booking vẫn `Approved`, chưa quá deadline và chưa đến giờ nhận xe.

Nếu số tiền lệch hoặc booking không còn hợp lệ, payment được đánh dấu `Failed` và cần đối soát thủ công nếu tiền thực tế đã vào tài khoản PayOS.

### 9.3. Ghi nhận vào ví và escrow

Khi webhook hợp lệ:

1. Payment chuyển `Paid`, lưu `PaidAt` và mã giao dịch PayOS.
2. Tạo giao dịch `TopUp` dương cho ví customer.
3. Tạo giao dịch `BookingPayment` âm cùng số tiền.
4. Số dư ròng ví customer không đổi, nhưng `TotalEarned` và `TotalSpent` cùng tăng.
5. Booking chuyển `DepositPaid`.
6. `EscrowAmount = số tiền webhook`.
7. `EscrowStatus = Held`, lưu `EscrowHeldAt`.
8. Không cộng tiền vào ví owner tại thời điểm này.
9. Hủy các booking pending/approved trùng lịch và gửi notification.

Redis lock `payment_webhook:{orderCode}` và idempotency key của wallet transaction được dùng để giảm xử lý trùng.

⚠️ Webhook chỉ short-circuit khi payment đang `Paid`. Nếu PayOS retry sau khi payment đã chuyển `Refunded` hoặc `PartiallyRefunded`, code có thể đổi payment thành `Failed` vì booking lúc đó đã cancelled.

⚠️ Toàn bộ xử lý webhook chưa được bọc trong một database transaction duy nhất. Nếu lỗi ở giữa, payment, wallet và booking có nguy cơ lệch trạng thái.

## 10. Quá hạn thanh toán cọc

Background service chuyển booking `Approved` sang `Cancelled` khi:

```text
PaymentDueAt <= now OR StartDate <= now
```

Booking ghi `CancellationSource = PaymentTimeout`, không phát sinh hoàn tiền vì chưa có payment thành công.

⚠️ Job không chủ động hủy link PayOS pending. Webhook đến muộn sẽ bị đánh dấu `Failed` và phải đối soát nếu khách thực sự đã chuyển tiền sát deadline.

## 11. Khách hủy Booking

### 11.1. Điều kiện hủy

Chỉ chính customer được hủy. Booking phải thuộc một trong các trạng thái:

- `Pending`
- `Approved`
- `DepositPaid`
- `Confirmed`

Và phải hủy trước `StartDate`. `InProgress` hoặc `Completed` không được dùng luồng hủy thông thường.

Hệ thống dùng Redis lock `booking:cancel:{bookingId}` và transaction database cho phần settlement.

### 11.2. Chính sách hoàn cọc

| Thời điểm hủy so với giờ nhận xe | Hoàn khách | Cọc bị giữ |
|---|---:|---:|
| Từ 7 ngày trở lên | 100% | 0% |
| Từ 3 ngày đến dưới 7 ngày | 50% | 50% |
| Dưới 3 ngày | 0% | 100% |
| Chưa thanh toán cọc | Miễn phí | 0đ |

Các mốc được tính theo thời điểm chính xác, không phải chỉ theo ngày lịch.

### 11.3. Phân bổ phần cọc bị giữ

```text
RefundAmount      = round(PaidDeposit × RefundPercent / 100)
ForfeitedAmount   = PaidDeposit - RefundAmount
CancellationFee   = round(ForfeitedAmount × 10%)
OwnerCompensation = ForfeitedAmount - CancellationFee
```

- Refund được cộng vào ví customer.
- Owner compensation được cộng vào ví owner.
- Cancellation fee được cộng vào ví admin.
- Payment chuyển `Refunded` nếu hoàn đủ, `PartiallyRefunded` nếu hoàn một phần, hoặc giữ `Paid` nếu hoàn 0%.
- Booking lưu snapshot đầy đủ số hoàn, số mất, bồi hoàn owner, phí nền tảng, policy tier và thời điểm settlement.

`EscrowStatus` sau hủy:

| Kết quả | EscrowStatus |
|---|---|
| Hoàn 100% | `Refunded` |
| Hoàn một phần | `PartiallyForfeited` |
| Không hoàn | `Forfeited` |

Hệ thống còn có logic thu hồi `booking_earning_*` legacy nếu dữ liệu cũ từng cộng cọc sớm cho owner.

### 11.4. Ảnh hưởng trust score

Mỗi lần customer hủy thành công, `TrustScore.CancellationCount` tăng 1 nếu hồ sơ trust score tồn tại.

## 12. Check-in, Check-out và hoàn tất

### 12.1. Owner lập biên bản check-in

- Booking phải `DepositPaid` hoặc `Confirmed`.
- Chỉ đúng owner được lập.
- Mỗi booking chỉ có một report `CheckIn`.
- Bắt buộc 1–12 ảnh.
- Định dạng: `.jpg`, `.jpeg`, `.png`, `.webp`.
- Mỗi ảnh tối đa 5 MB.

### 12.2. Customer xác nhận check-in

- Chỉ đúng customer.
- Booking phải `DepositPaid` hoặc `Confirmed`.
- Phải có report `CheckIn`.
- Chuyển booking sang `InProgress` và đánh dấu report được customer xác nhận.

### 12.3. Owner lập biên bản check-out

- Booking phải `InProgress`.
- Chỉ đúng owner.
- Phải có check-in trước đó.
- Mỗi booking chỉ có một report `CheckOut`.
- Quy tắc ảnh giống check-in.

### 12.4. Customer xác nhận check-out

- Booking phải `InProgress`.
- Phải có report `CheckOut`.
- Chuyển booking sang `Completed`.

### 12.5. Quyết toán escrow khi hoàn tất

Escrow chỉ được giải ngân trong `OwnerCompleteAsync`:

```text
PlatformAmount = min(Booking.PlatformFee, EscrowAmount)
OwnerAmount    = EscrowAmount - PlatformAmount
OwnerRelease   = max(OwnerAmount - dispute payouts - prior deposit refunds, 0)
```

- Admin nhận `PlatformAmount`.
- Owner nhận `OwnerRelease`.
- Customer không được hoàn cọc trong chuyến đi bình thường.
- Booking chuyển `EscrowStatus = Released` và lưu `EscrowSettledAt`.
- Các idempotency key ngăn giải ngân lặp.

Nếu có tranh chấp đang mở, owner không thể complete. Nếu có report check-out nhưng chưa qua 48 giờ và chưa có settlement tranh chấp, escrow tiếp tục được giữ.

❌ API `Customer Complete` hiện cho phép chuyển từ `DepositPaid`, `Confirmed` hoặc `InProgress` sang `Completed` mà không bắt buộc check-in, check-out, chưa kiểm tra thời gian và chưa giải ngân escrow.

❌ API `Owner Complete` cũng cho phép hoàn tất từ `DepositPaid` dù chưa check-in/check-out. Chốt 48 giờ chỉ chạy nếu đã có report check-out.

Business rule mục tiêu nên là:

1. Bắt buộc check-in đã được customer xác nhận.
2. Bắt buộc check-out đã được customer xác nhận hoặc có cơ chế auto-confirm rõ ràng.
3. `Completed` và `Escrow Released` phải được điều phối bởi một luồng settlement thống nhất.

## 13. Tranh chấp liên quan Booking

### 13.1. Cửa sổ tranh chấp

- Tranh chấp thiệt hại dựa trên report `CheckOut`.
- Thời hạn mở tranh chấp là 48 giờ từ lúc customer xác nhận check-out; nếu chưa xác nhận thì tính từ lúc report được tạo.
- Booking không được có nhiều tranh chấp active cùng lúc.

### 13.2. Settlement hiện tại

Hệ thống hỗ trợ:

- `ExternalOnly`: toàn bộ số quyết định được thanh toán bên ngoài nền tảng.
- `DepositThenExternal`: dùng phần cọc khả dụng trước, thiếu bao nhiêu thanh toán bên ngoài.

Phần cọc được coi là khả dụng theo công thức legacy:

```text
Available = max(DepositAmount - PlatformFee - completed payouts - completed refunds, 0)
```

❌ Đây là điểm xung đột với mô hình mới “cọc là khoản trả trước tiền thuê”. `DisputeService` hiện vẫn có thể:

- Dùng cọc để bồi thường thiệt hại.
- Hoàn “phần cọc còn dư” về customer.
- Ghi doanh thu platform fee trong luồng tranh chấp.

Trong khi completion bình thường coi cọc là doanh thu thuê phải trả owner/admin. Cần chọn một trong hai mô hình chính thức:

1. **Advance-payment escrow**: cọc là tiền thuê trả trước; bồi thường thiệt hại là khoản riêng.
2. **Security-deposit escrow**: cọc bảo đảm được hoàn phần dư; khi đó “số còn lại trả chủ xe” và quyết toán completion phải thiết kế lại.

Theo yêu cầu nghiệp vụ hiện tại, phương án 1 là mô hình mục tiêu; do đó luồng dispute còn cần refactor.

## 14. Ví và sổ giao dịch

### 14.1. Tạo ví

Nếu user chưa có ví, ví được tự tạo với số dư, tổng thu và tổng chi bằng 0 khi user mở ví hoặc phát sinh payment cần ví.

### 14.2. Loại giao dịch liên quan

| Type | Dấu tiền | Ý nghĩa |
|---|---:|---|
| `TopUp` | + | Nạp qua PayOS hoặc bước ghi nhận tiền vào trước khi chi booking |
| `BookingPayment` | - | Customer dùng khoản vừa nạp để trả cọc |
| `BookingEarning` | + | Owner nhận escrow hoặc bồi hoàn hủy |
| `BookingEarningReversal` | - | Thu hồi earning legacy |
| `Refund` | + | Hoàn tiền cho customer |
| `PlatformFeeRevenue` | + | Admin nhận phí nền tảng |
| `DisputeCompensation` | + | Bồi thường qua tranh chấp |
| `Withdrawal` | - | Đóng băng tiền khi yêu cầu rút |
| `PayoutReversal` | + | Hoàn lại tiền khi rút bị từ chối |
| `AdminAdjustment` | +/- | Admin điều chỉnh thủ công |

Lịch sử ví có phân trang và lọc theo type. Số dư được cập nhật cùng với `BalanceAfter` trên từng transaction.

### 14.3. Nạp ví độc lập

- User đã đăng nhập có thể tạo link top-up PayOS.
- Link hết hạn sau 30 phút.
- Webhook hợp lệ tạo transaction `TopUp` và cộng số dư.

❌ Backend hiện không validate số tiền top-up phải lớn hơn 0, giới hạn tối thiểu/tối đa hoặc bội số VND trước khi gọi PayOS.

## 15. Tài khoản ngân hàng và rút tiền

### 15.1. Cập nhật tài khoản ngân hàng

- Chỉ Owner.
- Owner yêu cầu OTP gửi về email.
- Sau khi OTP hợp lệ, hệ thống cập nhật số tài khoản, ngân hàng, chủ tài khoản và BIN.
- Thay đổi được ghi audit log.

⚠️ Service chưa validate định dạng số tài khoản, BIN, tên ngân hàng/chủ tài khoản hoặc đối chiếu chủ tài khoản với PayOS/ngân hàng.

### 15.2. Tạo yêu cầu rút

Owner chỉ được tạo khi:

1. Số tiền từ 50.000đ.
2. Có OwnerProfile.
3. Có tài khoản ngân hàng và tên ngân hàng.
4. Không có withdrawal `Pending` hoặc `Approved` khác.
5. Ví đủ số dư.

Khi tạo, tiền bị trừ ngay khỏi số dư khả dụng và transaction `Withdrawal` có status `Pending` được tạo. Sau đó mới tạo `WithdrawalRequest`.

⚠️ Hai lần save này không nằm trong một transaction chung. Nếu tạo request thất bại sau khi trừ ví, tiền có thể bị đóng băng nhưng không có withdrawal tương ứng.

### 15.3. Vòng đời rút tiền

```text
Pending ── Staff/Admin approve + tạo PayOS payout ──> Approved
   │                                                   ├─ Complete ─> Completed
   └─ Reject ─> Rejected + hoàn ví                     └─ Reject ───> Rejected + hoàn ví
```

- Approve gọi PayOS payout trước rồi mới lưu `Approved`.
- Complete xác nhận đã chuyển khoản; tiền đã trừ vẫn giữ nguyên.
- Reject hoàn toàn bộ tiền vào ví bằng `PayoutReversal`.

❌ Nếu PayOS payout đã được tạo ở bước approve nhưng staff/admin sau đó reject, hệ thống vẫn hoàn ví mà không kiểm tra payout đã chuyển ra ngân hàng hay chưa. Có rủi ro trả tiền hai lần.

❌ Nếu PayOS tạo payout thành công nhưng lưu database thất bại, request có thể vẫn `Pending`; approve lại có nguy cơ tạo payout lần hai.

⚠️ `CompleteAsync` hiện không thực sự cập nhật status của wallet transaction đóng băng dù comment trong code nói có.

## 16. Trạng thái Payment, Escrow và Withdrawal

### 16.1. PaymentStatus

`Pending`, `Paid`, `Expired`, `Cancelled`, `Refunded`, `PartiallyRefunded`, `Failed`.

### 16.2. EscrowStatus

`None`, `Held`, `Released`, `Refunded`, `PartiallyForfeited`, `Forfeited`.

### 16.3. WithdrawalStatus

`Pending`, `Approved`, `Completed`, `Rejected`.

## 17. Audit và idempotency

Hệ thống lưu:

- `BookingStatusHistory` cho hầu hết transition.
- Snapshot phí nền tảng trên booking.
- Snapshot kết quả hủy trên booking.
- `Payment.OrderCode`, gateway reference, thời điểm paid/refunded.
- `WalletTransaction.IdempotencyKey` cho các khoản tài chính.
- Audit log cho xử lý withdrawal, tài khoản ngân hàng và admin adjustment.

Idempotency key quan trọng:

| Nghiệp vụ | Mẫu key |
|---|---|
| Customer top-up | `topup_{paymentId}` |
| Booking payment | `bookingpayment_{paymentId}` |
| Owner release | `booking_escrow_owner_release_{bookingId}` |
| Customer cancellation refund | `booking_cancellation_refund_{bookingId}` |
| Owner cancellation compensation | `booking_cancel_compensation_{bookingId}` |
| Platform revenue | `booking_platform_fee_{bookingId}` |
| Withdrawal refund | `withdrawal_refund_{withdrawalId}` |

## 18. Phân trang và lọc

Danh sách booking customer/owner hỗ trợ:

- `status`
- `keyword`
- `fromDate`
- `toDate`
- `page`
- `pageSize`

Backend ép `page >= 1`, `pageSize` trong `5..50`, và từ chối nếu `fromDate > toDate`.

Lịch sử ví và yêu cầu rút tiền cũng hỗ trợ phân trang; withdrawal hỗ trợ lọc status.

## 19. Ma trận API và quyền

| Nghiệp vụ | Quyền |
|---|---|
| Tạo booking | Customer |
| Xem booking theo ID | Bất kỳ user đã đăng nhập |
| Xem booking của customer | User hiện tại, service hiểu user đó là customer |
| Xem booking của owner | Owner |
| Duyệt/từ chối/check-in/check-out/owner-complete | Owner đúng booking |
| Báo giá hủy/hủy/customer-complete/xác nhận inspection | Customer đúng booking |
| Tạo link cọc | Customer đúng booking |
| Webhook PayOS | Public endpoint + kiểm tra chữ ký |
| Xem ví/lịch sử ví | User hiện tại |
| Rút tiền/tài khoản ngân hàng | Owner |
| Xử lý rút tiền | Staff hoặc Admin |

❌ `GET /api/bookings/{id}` chỉ yêu cầu đăng nhập; service không kiểm tra user có phải customer, owner, staff hoặc admin liên quan. User bất kỳ có thể đọc chi tiết booking nếu đoán được ID.

⚠️ `GET /api/bookings/my-bookings` không giới hạn role Customer nhưng luôn query theo `CustomerId`. Đây không phải lộ dữ liệu nhưng quyền API chưa rõ ràng.

## 20. Các vấn đề audit cần ưu tiên

### P0 — Tài chính và bảo mật

1. Refactor dispute để thống nhất cọc là advance payment; không tự hoàn “cọc còn dư” như security deposit.
2. Bọc webhook payment và tạo withdrawal trong database transaction đầy đủ.
3. Đồng bộ payout PayOS bằng trạng thái callback/idempotency; không cho reject-refund sau khi tiền đã chuyển.
4. Bổ sung authorization cho `GET booking by id`.

### P1 — Sai lệch nghiệp vụ

1. Bắt buộc đúng chuỗi check-in → check-out → complete trước khi release escrow.
2. Sửa frontend lấy fee preview từ backend/rule thay vì 10% cố định.
3. Xử lý webhook retry khi payment đã refunded/partially refunded.
4. Hủy hoặc đóng payment link khi booking hết hạn.
5. Xác nhận lại discount cho booking 4 ngày.

### P2 — Validation và vận hành

1. Chặn thời điểm nhận xe đã qua, kể cả cùng ngày.
2. Validate min/max top-up.
3. Validate và xác minh thông tin ngân hàng.
4. Đồng bộ hàm gợi ý ngày khả dụng với rule overlap.
5. Thêm reconciliation job/dashboard cho payment `Failed`, payout đang xử lý và escrow lệch sổ.

## 21. Kịch bản kiểm thử chấp nhận chính

1. Booking 180.000đ, cọc 50.000đ: UI/API phải ghi còn lại 130.000đ.
2. PayOS redirect không làm booking `DepositPaid`; chỉ webhook chữ ký đúng mới làm được.
3. Webhook sai amount không được giữ escrow.
4. Sau webhook đúng, ví owner chưa tăng; escrow là `Held`.
5. Hoàn tất không tranh chấp: admin nhận fee snapshot, owner nhận phần escrow còn lại, customer không được hoàn cọc.
6. Hủy trước 7 ngày với cọc 50.000đ: customer nhận 50.000đ, owner/admin nhận 0đ.
7. Hủy trước 5 ngày: customer 25.000đ, admin 2.500đ, owner 22.500đ.
8. Hủy trước 1 ngày: customer 0đ, admin 5.000đ, owner 45.000đ.
9. Pending quá 24 giờ chuyển `Rejected`.
10. Approved quá 2 giờ chưa cọc chuyển `Cancelled`.
11. Hai booking pending trùng lịch được tạo; chỉ một booking được duyệt/thanh toán.
12. Owner không rút được dưới 50.000đ, vượt số dư hoặc khi còn request pending/approved.
13. Withdrawal bị từ chối phải hoàn đúng một lần.
14. User không liên quan không được đọc booking theo ID sau khi authorization được sửa.

## 22. Nguồn mã đã đối chiếu

- `BookingService.cs`, `BookingCancellationPolicy.cs`, `EscrowSettlementCalculator.cs`
- `BookingRepository.cs`, `BookingAutoCancelBackgroundService.cs`
- `PaymentService.cs`, `WebhookController.cs`, `PayOsService.cs`
- `DisputeService.cs`, `DisputeDepositCalculator.cs`, `DisputeSettlementCalculator.cs`
- `WalletService.cs`, `AdminWalletService.cs`
- `WithdrawalService.cs`, `WithdrawalsController.cs`
- `Booking.cs`, `Payment.cs`, `Wallet.cs`, `WalletTransaction.cs`, `WithdrawalRequest.cs`
- Các trang tạo/chi tiết booking, wallet và withdrawal trong frontend

