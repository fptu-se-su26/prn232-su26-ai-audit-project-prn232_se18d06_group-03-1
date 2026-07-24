using System.Text.Json;
using MoveVN.Application.Common.Errors;
using MoveVN.Application.Common.Exceptions;
using MoveVN.Application.Modules.Auth.Interfaces;
using MoveVN.Domain.Entities;
using MoveVN.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace MoveVN.Infrastructure.Persistence;

public class DbInitializer
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly IPasswordHasherService _passwordHasherService;

    public DbInitializer(
        AppDbContext context,
        IConfiguration configuration,
        IPasswordHasherService passwordHasherService)
    {
        _context = context;
        _configuration = configuration;
        _passwordHasherService = passwordHasherService;
    }

    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await SeedRolesAsync(cancellationToken);
        await SeedDriverLicenseClassesAsync(cancellationToken);
        await SeedAdminAsync(cancellationToken);
        await SeedCmsPagesAsync(cancellationToken);
    }

    private async Task SeedRolesAsync(CancellationToken cancellationToken)
    {
        foreach (var roleType in Enum.GetValues<UserRoleType>())
        {
            var roleName = roleType.ToString();
            if (!await _context.Roles.AnyAsync(x => x.Name == roleName, cancellationToken))
            {
                await _context.Roles.AddAsync(new Role
                {
                    Name = roleName,
                    Description = $"{roleName} role"
                }, cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task SeedDriverLicenseClassesAsync(CancellationToken cancellationToken)
    {
        var classes = new[]
        {
            new LicenseClassSeed("A1_LEGACY", "A1 cũ", "Xe mô tô 2 bánh đến 175 cm3.", "LegacyBefore2025"),
            new LicenseClassSeed("A2_LEGACY", "A2 cũ", "Xe mô tô 2 bánh trên 175 cm3.", "LegacyBefore2025"),
            new LicenseClassSeed("A3_LEGACY", "A3 cũ", "Xe mô tô 3 bánh.", "LegacyBefore2025"),
            new LicenseClassSeed("A4_LEGACY", "A4 cũ", "Máy kéo có trọng tải đến 1.000 kg.", "LegacyBefore2025"),
            new LicenseClassSeed("B1_AUTO_LEGACY", "B1 số tự động cũ", "Ô tô số tự động đến 9 chỗ, không hành nghề lái xe.", "LegacyBefore2025"),
            new LicenseClassSeed("B1_LEGACY", "B1 cũ", "Ô tô đến 9 chỗ, không hành nghề lái xe.", "LegacyBefore2025"),
            new LicenseClassSeed("B2_LEGACY", "B2 cũ", "Ô tô đến 9 chỗ, hành nghề lái xe.", "LegacyBefore2025"),
            new LicenseClassSeed("C_LEGACY", "C cũ", "Xe tải trên 3.500 kg.", "LegacyBefore2025"),
            new LicenseClassSeed("D_LEGACY", "D cũ", "Xe chở người từ 10 đến 30 chỗ.", "LegacyBefore2025"),
            new LicenseClassSeed("E_LEGACY", "E cũ", "Xe chở người trên 30 chỗ.", "LegacyBefore2025"),
            new LicenseClassSeed("FB2_LEGACY", "FB2 cũ", "Xe hạng B2 kéo rơ-moóc.", "LegacyBefore2025"),
            new LicenseClassSeed("FC_LEGACY", "FC cũ", "Xe hạng C kéo rơ-moóc.", "LegacyBefore2025"),
            new LicenseClassSeed("FD_LEGACY", "FD cũ", "Xe hạng D kéo rơ-moóc.", "LegacyBefore2025"),
            new LicenseClassSeed("FE_LEGACY", "FE cũ", "Xe hạng E kéo rơ-moóc.", "LegacyBefore2025"),

            new LicenseClassSeed("A1", "A1", "Xe mô tô 2 bánh đến 125 cm3 hoặc động cơ điện đến 11 kW.", "Current"),
            new LicenseClassSeed("A", "A", "Xe mô tô trên 125 cm3 hoặc động cơ điện trên 11 kW.", "Current"),
            new LicenseClassSeed("B1", "B1", "Xe mô tô 3 bánh và các loại xe quy định cho hạng A1.", "Current"),
            new LicenseClassSeed("B", "B", "Ô tô đến 8 chỗ, xe tải đến 3.500 kg.", "Current"),
            new LicenseClassSeed("C1", "C1", "Xe tải trên 3.500 kg đến 7.500 kg.", "Current"),
            new LicenseClassSeed("C", "C", "Xe tải trên 7.500 kg.", "Current"),
            new LicenseClassSeed("D1", "D1", "Xe chở người từ 9 đến 16 chỗ.", "Current"),
            new LicenseClassSeed("D2", "D2", "Xe chở người từ 17 đến 29 chỗ.", "Current"),
            new LicenseClassSeed("D", "D", "Xe chở người trên 29 chỗ.", "Current"),
            new LicenseClassSeed("BE", "BE", "Xe hạng B kéo rơ-moóc.", "Current"),
            new LicenseClassSeed("C1E", "C1E", "Xe hạng C1 kéo rơ-moóc.", "Current"),
            new LicenseClassSeed("CE", "CE", "Xe hạng C kéo rơ-moóc.", "Current"),
            new LicenseClassSeed("D1E", "D1E", "Xe hạng D1 kéo rơ-moóc.", "Current"),
            new LicenseClassSeed("D2E", "D2E", "Xe hạng D2 kéo rơ-moóc.", "Current"),
            new LicenseClassSeed("DE", "DE", "Xe hạng D kéo rơ-moóc.", "Current")
        };

        var existingCodes = await _context.DriverLicenseClasses
            .Select(entity => entity.Code)
            .ToListAsync(cancellationToken);
        var existingCodeSet = existingCodes.ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var licenseClass in classes)
        {
            if (existingCodeSet.Contains(licenseClass.Code))
            {
                continue;
            }

            await _context.DriverLicenseClasses.AddAsync(new DriverLicenseClass
            {
                Code = licenseClass.Code,
                DisplayName = licenseClass.DisplayName,
                Description = licenseClass.Description,
                SystemVersion = licenseClass.SystemVersion,
                IsActive = true
            }, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);

        var classIdsByCode = await _context.DriverLicenseClasses
            .ToDictionaryAsync(entity => entity.Code, entity => entity.Id, StringComparer.OrdinalIgnoreCase, cancellationToken);

        var compatibilityPairs = BuildDriverLicenseCompatibilityPairs(classes.Select(item => item.Code));
        var existingPairs = await _context.DriverLicenseClassCompatibility
            .Select(entity => new { entity.LicenseClassId, entity.AllowedRequiredLicenseClassId })
            .ToListAsync(cancellationToken);
        var existingPairSet = existingPairs
            .Select(pair => $"{pair.LicenseClassId}:{pair.AllowedRequiredLicenseClassId}")
            .ToHashSet(StringComparer.Ordinal);

        foreach (var (licenseCode, allowedRequiredCode) in compatibilityPairs)
        {
            if (!classIdsByCode.TryGetValue(licenseCode, out var licenseClassId)
                || !classIdsByCode.TryGetValue(allowedRequiredCode, out var allowedRequiredLicenseClassId))
            {
                continue;
            }

            var key = $"{licenseClassId}:{allowedRequiredLicenseClassId}";
            if (existingPairSet.Contains(key))
            {
                continue;
            }

            await _context.DriverLicenseClassCompatibility.AddAsync(new DriverLicenseClassCompatibility
            {
                LicenseClassId = licenseClassId,
                AllowedRequiredLicenseClassId = allowedRequiredLicenseClassId
            }, cancellationToken);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private static HashSet<(string LicenseCode, string AllowedRequiredCode)> BuildDriverLicenseCompatibilityPairs(IEnumerable<string> licenseCodes)
    {
        var pairs = licenseCodes
            .Select(code => (LicenseCode: code, AllowedRequiredCode: code))
            .ToHashSet();

        AddAllowed(pairs, "A1_LEGACY", "A1");
        AddAllowed(pairs, "A2_LEGACY", "A1_LEGACY", "A1", "A2_LEGACY");
        AddAllowed(pairs, "A3_LEGACY", "A3_LEGACY", "B1");
        AddAllowed(pairs, "B1_AUTO_LEGACY", "B1_AUTO_LEGACY");
        AddAllowed(pairs, "B1_LEGACY", "B1_AUTO_LEGACY", "B1_LEGACY", "B");
        AddAllowed(pairs, "B2_LEGACY", "B1_AUTO_LEGACY", "B1_LEGACY", "B2_LEGACY", "B");
        AddAllowed(pairs, "C_LEGACY", "B", "C1", "C_LEGACY", "C");
        AddAllowed(pairs, "D_LEGACY", "B", "D1", "D2", "D_LEGACY", "D");
        AddAllowed(pairs, "E_LEGACY", "B", "D1", "D2", "D", "E_LEGACY");
        AddAllowed(pairs, "FB2_LEGACY", "B", "B2_LEGACY", "FB2_LEGACY", "BE");
        AddAllowed(pairs, "FC_LEGACY", "B", "C1", "C", "C_LEGACY", "FC_LEGACY", "C1E", "CE");
        AddAllowed(pairs, "FD_LEGACY", "B", "D1", "D2", "D", "D_LEGACY", "FD_LEGACY", "D1E", "D2E", "DE");
        AddAllowed(pairs, "FE_LEGACY", "B", "D1", "D2", "D", "E_LEGACY", "FE_LEGACY", "D1E", "D2E", "DE");

        AddAllowed(pairs, "A", "A1");
        AddAllowed(pairs, "B1", "A1");
        AddAllowed(pairs, "B", "B1");
        AddAllowed(pairs, "C1", "B");
        AddAllowed(pairs, "C", "B", "C1");
        AddAllowed(pairs, "D1", "B");
        AddAllowed(pairs, "D2", "B", "D1");
        AddAllowed(pairs, "D", "B", "D1", "D2");
        AddAllowed(pairs, "BE", "B");
        AddAllowed(pairs, "C1E", "B", "C1", "BE");
        AddAllowed(pairs, "CE", "B", "C1", "C", "BE", "C1E");
        AddAllowed(pairs, "D1E", "B", "D1", "BE");
        AddAllowed(pairs, "D2E", "B", "D1", "D2", "BE", "D1E");
        AddAllowed(pairs, "DE", "B", "D1", "D2", "D", "BE", "D1E", "D2E");

        return pairs;
    }

    private static void AddAllowed(HashSet<(string LicenseCode, string AllowedRequiredCode)> pairs, string licenseCode, params string[] allowedRequiredCodes)
    {
        foreach (var allowedRequiredCode in allowedRequiredCodes)
        {
            pairs.Add((licenseCode, allowedRequiredCode));
        }
    }

    private async Task SeedAdminAsync(CancellationToken cancellationToken)
    {
        var email = _configuration["ADMIN_EMAIL"];
        var password = _configuration["ADMIN_PASSWORD"];
        var fullName = _configuration["ADMIN_FULL_NAME"] ?? "System Admin";

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return;
        }

        var normalizedEmail = email.Trim().ToLowerInvariant();
        if (await _context.Users.AnyAsync(x => x.Email == normalizedEmail, cancellationToken))
        {
            return;
        }

        var adminRole = await _context.Roles.FirstOrDefaultAsync(x => x.Name == UserRoleType.Admin.ToString(), cancellationToken)
            ?? throw new AppException(ErrorCode.ADMIN_SEED_FAILED);

        var admin = new User
        {
            Email = normalizedEmail,
            FullName = fullName,
            PasswordHash = _passwordHasherService.Hash(password),
            Status = UserStatus.Active.ToString(),
            IsEmailVerified = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _context.Users.AddAsync(admin, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);

        await _context.UserRoles.AddAsync(new UserRole
        {
            UserId = admin.Id,
            RoleId = adminRole.Id,
            AssignedAt = DateTime.UtcNow
        }, cancellationToken);

        await _context.SaveChangesAsync(cancellationToken);
    }

    private async Task SeedCmsPagesAsync(CancellationToken cancellationToken)
    {
        var privacyContent = JsonSerializer.Serialize(PrivacySections());
        var termsContent = JsonSerializer.Serialize(TermsSections());

        var pages = new[]
        {
            new { Slug = "privacy-policy", Title = "Chính sách bảo mật", Content = privacyContent },
            new { Slug = "terms-of-service", Title = "Điều khoản sử dụng", Content = termsContent }
        };

        foreach (var page in pages)
        {
            var existing = await _context.CmsPages.FirstOrDefaultAsync(x => x.Slug == page.Slug, cancellationToken);
            if (existing != null)
            {
                existing.Content = page.Content;
                existing.Version += 1;
                existing.UpdatedAt = DateTime.UtcNow;
            }
            else
            {
                await _context.CmsPages.AddAsync(new Domain.Entities.CmsPage
                {
                    Slug = page.Slug,
                    Title = page.Title,
                    Content = page.Content,
                    Version = 1,
                    IsActive = true,
                    UpdatedBy = 0,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                }, cancellationToken);
            }
        }

        await _context.SaveChangesAsync(cancellationToken);
    }

    private sealed record CmsSection(string Id, string Title, string[] Content);

    private static CmsSection[] PrivacySections() => new[]
    {
        new CmsSection("gioi-thieu", "Giới thiệu", new[]
        {
            "MoveVN và các bên liên kết của MoveVN (gọi chung là \"MoveVN\" hoặc \"chúng tôi\") rất tôn trọng quyền riêng tư của bạn. Pháp nhân giữ vai trò là Bên Kiểm soát và xử lý dữ liệu cá nhân của bạn là Công Ty TNHH MOVEVN.",
            "Trong quá trình bạn sử dụng Nền Tảng MoveVN (website) và các dịch vụ do MoveVN cung cấp, chúng tôi sẽ thu thập, sử dụng, tiết lộ, lưu trữ và xử lý dữ liệu cá nhân của bạn, bao gồm cả dữ liệu cá nhân nhạy cảm.",
            "Chính sách này thiết lập để giúp bạn biết được cách thức chúng tôi thu thập, sử dụng, tiết lộ, lưu trữ và xử lý dữ liệu mà chúng tôi thu thập trong quá trình cung cấp dịch vụ cho bạn, cho dù bạn đã đăng ký sử dụng Nền Tảng với tư cách là Khách Hàng, Chủ Xe hay chưa.",
            "Cập nhật chính sách: Chúng tôi có thể cập nhật Chính sách này theo từng thời điểm để phù hợp với hoạt động kinh doanh và quy định pháp luật. Khi có thay đổi quan trọng, chúng tôi sẽ thông báo cho bạn thông qua một hoặc nhiều hình thức sau: banner thông báo trong ứng dụng, email đến địa chỉ bạn đã đăng ký, hoặc thông báo đẩy (push notification), tối thiểu 07 ngày trước khi thay đổi có hiệu lực, trừ trường hợp thay đổi là bắt buộc theo yêu cầu pháp luật. Việc bạn tiếp tục sử dụng dịch vụ sau thời điểm đó cấu thành sự chấp thuận của bạn đối với các thay đổi này. Phiên bản chính sách hiện hành luôn được đăng tại địa chỉ này, kèm ngày cập nhật gần nhất.",
            "Chính sách này được áp dụng cùng với các điều khoản hợp đồng và Điều khoản sử dụng khác, không nhằm mục đích thay thế các văn bản đó trừ khi được chúng tôi tuyên bố rõ ràng.",
        }),
        new CmsSection("du-lieu-thu-thap", "Dữ liệu thu thập", new[]
        {
            "2.1. Chúng tôi thu thập dữ liệu cá nhân phù hợp với pháp luật Việt Nam (bao gồm Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân) và sau khi nhận được sự đồng ý của bạn nếu pháp luật có yêu cầu.",
            "",
            "2.2. Dữ liệu cá nhân cơ bản:",
            "– Dữ liệu định danh: họ tên, ngày sinh, giới tính, email, số điện thoại, tên đăng nhập, mật khẩu (được mã hóa), ảnh đại diện.",
            "– Dữ liệu sử dụng: thông tin về thời gian và cách thức bạn sử dụng Nền Tảng, lịch sử đặt xe, lịch sử thanh toán, lịch sử giao dịch ví, các trang bạn truy cập.",
            "– Dữ liệu tiếp thị và truyền thông: sở thích của bạn, kết quả khảo sát, lựa chọn nhận thông tin tiếp thị, lịch sử chat, email và cuộc gọi hỗ trợ.",
            "– Dữ liệu thiết bị: địa chỉ IP, loại thiết bị, trình duyệt, hệ điều hành, thông tin session.",
            "",
            "2.3. Dữ liệu cá nhân nhạy cảm:",
            "– Dữ liệu tài khoản và giao dịch: thông tin tài khoản ngân hàng (tên chủ tài khoản, số tài khoản, tên ngân hàng), lịch sử thanh toán qua PayOS, lịch sử nạp/rút tiền từ ví điện tử.",
            "– Dữ liệu giấy tờ tùy thân: số CCCD/CMND (được hash và che giấu một phần), hình ảnh CCCD (mặt trước, mặt sau), hình ảnh giấy phép lái xe, số bằng lái, hạng bằng lái.",
            "– Dữ liệu sinh trắc học: ảnh khuôn mặt (selfie) phục vụ mục đích xác thực danh tính.",
            "– Dữ liệu giấy tờ xe: hình ảnh đăng ký xe (cavet), biển số xe, số khung, số máy.",
            "– Dữ liệu vị trí: tọa độ địa lý của xe, địa chỉ nhận/trả xe.",
        }),
        new CmsSection("cach-thuc-thu-thap", "Cách thức thu thập", new[]
        {
            "Chúng tôi thu thập dữ liệu cá nhân của bạn trong các trường hợp sau:",
            "– Khi bạn truy cập Nền Tảng MoveVN.",
            "– Khi bạn tạo tài khoản, đăng ký hoặc đăng nhập (bao gồm đăng nhập qua Google).",
            "– Khi bạn đăng ký trở thành Chủ Xe, gửi yêu cầu xác thực CCCD, bằng lái, giấy tờ xe.",
            "– Khi bạn đặt xe, thanh toán, nạp tiền vào ví hoặc rút tiền.",
            "– Khi bạn sử dụng chức năng chat, gửi ticket hỗ trợ, hoặc khiếu nại.",
            "– Khi bạn đánh giá, nhận xét về Chủ Xe, Khách Hàng hoặc xe.",
            "– Khi bạn tham gia khảo sát, chương trình khuyến mại hoặc chiến dịch tiếp thị.",
            "– Khi bạn mở tranh chấp (dispute) hoặc gửi báo cáo.",
            "– Khi bạn tương tác với nhân viên hỗ trợ khách hàng của MoveVN.",
            "– Từ các đối tác cung cấp dịch vụ được chúng tôi ủy quyền, bao gồm: đối tác đăng nhập bằng tài khoản mạng xã hội, đối tác cổng thanh toán được cấp phép, đối tác lưu trữ dữ liệu/hình ảnh, đối tác bản đồ và định vị, đối tác xác thực giấy tờ bằng công nghệ AI (OCR).",
            "– Tự động thu thập qua cookie và công nghệ tương tự khi bạn truy cập Nền Tảng.",
        }),
        new CmsSection("muc-dich-xu-ly", "Mục đích xử lý", new[]
        {
            "Chúng tôi chỉ xử lý dữ liệu cá nhân của bạn khi có ít nhất một trong các cơ sở pháp lý sau: (i) sự đồng ý của bạn; (ii) cần thiết để thực hiện hợp đồng/dịch vụ mà bạn là một bên; (iii) tuân thủ nghĩa vụ pháp luật; hoặc (iv) lợi ích hợp pháp của chúng tôi trong việc vận hành và bảo vệ an toàn Nền Tảng, với điều kiện không xâm phạm quá mức đến quyền của bạn.",
            "",
            "4.1. Cung cấp và vận hành dịch vụ (cơ sở: thực hiện hợp đồng):",
            "– Xử lý đăng ký tài khoản, xác thực danh tính và quản lý tài khoản.",
            "– Xử lý yêu cầu đặt xe, thanh toán cọc, giải ngân tiền thuê.",
            "– Xác thực CCCD/CMND, giấy phép lái xe, giấy tờ xe qua AI OCR và kiểm duyệt.",
            "– Hỗ trợ khách hàng qua chat, email, hotline và ticket hỗ trợ.",
            "– Xử lý khiếu nại, tranh chấp và yêu cầu bồi thường.",
            "– Vận hành ví điện tử (nạp tiền, rút tiền, thanh toán).",
            "– Gửi thông báo về trạng thái đặt xe, thanh toán, xác thực.",
            "",
            "4.2. Cải thiện và phát triển dịch vụ (cơ sở: lợi ích hợp pháp):",
            "– Phân tích dữ liệu sử dụng để cải thiện trải nghiệm người dùng.",
            "– Phát triển các tính năng mới, cải tiến giao diện và quy trình.",
            "– Thực hiện khảo sát và nghiên cứu thị trường.",
            "– Tính toán điểm tin cậy (trust score) và đề xuất giá thuê (dynamic pricing).",
            "",
            "Về xử lý tự động: Điểm tin cậy (trust score) và giá đề xuất (dynamic pricing) được tính toán một phần bằng thuật toán tự động dựa trên lịch sử sử dụng, đánh giá và dữ liệu giao dịch của bạn. Kết quả này chỉ mang tính tham khảo/hỗ trợ và không tự động dẫn đến việc từ chối dịch vụ hoặc chấm dứt tài khoản mà không có sự xem xét của con người. Nếu bạn cho rằng một quyết định liên quan đến trust score hoặc giá đề xuất là không chính xác hoặc bất hợp lý, bạn có quyền yêu cầu nhân viên MoveVN xem xét lại bằng cách liên hệ qua kênh hỗ trợ tại Mục 14.",
            "",
            "4.3. Tuân thủ pháp luật và bảo vệ an toàn (cơ sở: nghĩa vụ pháp luật, lợi ích hợp pháp):",
            "– Phát hiện và ngăn chặn gian lận, lừa đảo, hành vi vi phạm pháp luật.",
            "– Tuân thủ yêu cầu của cơ quan nhà nước có thẩm quyền.",
            "– Lưu trữ hồ sơ, audit log theo quy định pháp luật.",
            "– Bảo vệ an toàn của người dùng, nhân viên và cộng đồng.",
            "– Đối với các trường hợp mua bán, sáp nhập, tái cơ cấu hoặc chuyển nhượng một phần hoặc toàn bộ hoạt động kinh doanh của MoveVN, dữ liệu cá nhân của bạn có thể được chia sẻ với bên nhận chuyển nhượng, với điều kiện bên đó cam kết tuân thủ các nghĩa vụ bảo vệ dữ liệu tương đương như trong chính sách này.",
            "",
            "4.4. Tiếp thị và truyền thông (cơ sở: sự đồng ý):",
            "– Gửi thông tin về chương trình khuyến mại, ưu đãi và dịch vụ mới.",
            "– Cá nhân hóa nội dung quảng cáo và đề xuất trên Nền Tảng.",
            "– Bạn có thể từ chối nhận thông tin tiếp thị bất kỳ lúc nào mà không ảnh hưởng đến khả năng sử dụng các dịch vụ cốt lõi khác của Nền Tảng.",
        }),
        new CmsSection("chia-se-du-lieu", "Chia sẻ dữ liệu", new[]
        {
            "Nhân viên MoveVN: Admin có quyền truy cập toàn bộ dữ liệu; Staff có quyền truy cập dữ liệu phục vụ công việc (xác thực, ticket, dispute, withdrawal), theo cơ chế phân quyền tại Mục 7.",
            "Chủ Xe: được xem tên và số điện thoại của Khách Hàng đã đặt xe của mình, cũng như ảnh CCCD/bằng lái đã được che giấu một phần.",
            "Khách Hàng: được xem tên, đánh giá của Chủ Xe và thông tin xe.",
            "Bên thứ ba cung cấp dịch vụ: PayOS, Cloudinary, Goong.io, Google, FPT AI / Python AI Service.",
            "Cơ quan nhà nước có thẩm quyền khi có yêu cầu theo quy định pháp luật.",
        }),
        new CmsSection("quyen-cua-ban", "Quyền của bạn", new[]
        {
            "Theo quy định pháp luật Việt Nam, bạn có các quyền sau đối với dữ liệu cá nhân của mình:",
            "– Quyền được biết",
            "– Quyền đồng ý/thu hồi sự đồng ý",
            "– Quyền truy cập",
            "– Quyền chỉnh sửa",
            "– Quyền xóa dữ liệu",
            "– Quyền phản đối xử lý",
            "– Quyền hạn chế xử lý",
            "– Quyền yêu cầu cung cấp dữ liệu",
            "– Quyền khiếu nại, tố cáo, khởi kiện",
            "– Quyền yêu cầu bồi thường thiệt hại",
            "Để thực hiện các quyền này, vui lòng liên hệ với chúng tôi qua email support@movevn.com.",
        }),
        new CmsSection("lien-he", "Liên hệ", new[]
        {
            "Bộ phận Bảo vệ Dữ liệu Cá nhân — Công Ty TNHH MOVEVN",
            "Email hỗ trợ: support@movevn.com",
            "Hotline: 1900 6868",
            "Ticket hỗ trợ: Đăng nhập tài khoản và tạo ticket tại mục Hỗ trợ",
            "Địa chỉ trụ sở chính: Khu công nghiệp Đại học FPT",
        }),
    };

    private static CmsSection[] TermsSections() => new[]
    {
        new CmsSection("gioi-thieu", "Giới thiệu", new[]
        {
            "Chào mừng bạn đến với Nền Tảng MoveVN được vận hành bởi Công Ty TNHH MOVEVN. Vui lòng đọc kỹ các Điều khoản sử dụng dưới đây để hiểu rõ quyền và nghĩa vụ của mình.",
            "Bằng việc sử dụng Nền Tảng MoveVN và/hoặc tạo tài khoản trên Nền Tảng MoveVN, Khách Hàng đã chấp nhận và đồng ý với Điều khoản sử dụng và các chính sách bổ sung được dẫn chiếu tại Điều khoản này.",
            "Nền Tảng MoveVN là nền tảng kết nối chủ xe và người có nhu cầu thuê xe để thực hiện các giao dịch cho thuê xe tự lái giữa các cá nhân với nhau (P2P). MoveVN đóng vai trò trung gian cung cấp nền tảng, hỗ trợ thanh toán, xác thực và các dịch vụ liên quan.",
            "MoveVN bảo lưu quyền thay đổi, chỉnh sửa, tạm ngưng hoặc chấm dứt bất kỳ điều khoản và điều kiện nào của Điều khoản sử dụng này. Mọi thay đổi sẽ được cập nhật trên Nền Tảng và có hiệu lực ngay khi được đăng tải.",
        }),
        new CmsSection("tai-khoan", "Tài khoản", new[]
        {
            "Để sử dụng các tính năng của Nền Tảng MoveVN, Khách Hàng cần đăng ký một tài khoản bằng số điện thoại hoặc email, tạo mật khẩu và cung cấp các thông tin cá nhân cần thiết.",
            "Khách Hàng đồng ý giữ bí mật mật khẩu và không chia sẻ thông tin đăng nhập cho bất kỳ bên thứ ba nào.",
            "MoveVN có quyền khóa, tạm ngưng hoặc chấm dứt tài khoản nếu vi phạm Điều khoản sử dụng hoặc có hành vi gian lận.",
        }),
        new CmsSection("khach-hang", "Khách hàng", new[]
        {
            "Quyền của Khách Hàng:",
            "– Được đăng ký tài khoản và sử dụng dịch vụ trên Nền Tảng MoveVN",
            "– Được tìm kiếm, xem thông tin và đặt thuê xe theo nhu cầu",
            "– Được hủy đặt xe theo chính sách hủy được công bố",
            "– Được đánh giá Chủ Xe và xe sau khi hoàn tất giao dịch",
            "– Được khiếu nại, mở tranh chấp khi có vấn đề phát sinh",
            "",
            "Nghĩa vụ của Khách Hàng:",
            "– Cung cấp thông tin chính xác, trung thực khi đăng ký và sử dụng dịch vụ",
            "– Tự chịu trách nhiệm bảo mật thông tin tài khoản",
            "– Tuân thủ quy trình nhận xe, sử dụng xe và trả xe",
            "– Không sử dụng Nền Tảng vào mục đích bất hợp pháp, gian lận",
        }),
        new CmsSection("chu-xe", "Chủ xe", new[]
        {
            "Để trở thành Chủ Xe, người dùng cần hoàn tất quy trình đăng ký bao gồm xác thực CCCD/CMND qua AI, cung cấp thông tin tài khoản ngân hàng và xác thực OTP, đăng ký thông tin xe và giấy tờ xe để kiểm duyệt.",
            "Chủ Xe có quyền: Quản lý danh sách xe, giá thuê, lịch trình; phê duyệt/từ chối yêu cầu đặt xe; nhận tiền thanh toán qua ví và rút về tài khoản ngân hàng.",
            "Chủ Xe có nghĩa vụ: Cung cấp thông tin xe chính xác; bảo đảm xe đủ điều kiện lưu thông, có bảo hiểm; giao xe đúng thời gian, địa điểm, tình trạng cam kết.",
        }),
        new CmsSection("thanh-toan", "Thanh toán", new[]
        {
            "Các loại phí: Tiền thuê xe theo ngày (Chủ Xe niêm yết); tiền cọc theo tỷ lệ phần trăm (Chủ Xe quy định); phí nền tảng (MoveVN quy định).",
            "Cổng thanh toán: MoveVN sử dụng đối tác cổng thanh toán được cấp phép. Mọi giao dịch thanh toán, nạp/rút tiền đều qua đối tác này.",
            "Ví điện tử: Mỗi người dùng được cấp ví trên Nền Tảng. Khách Hàng nạp tiền để thanh toán. Chủ Xe nhận tiền vào ví và rút về tài khoản ngân hàng.",
        }),
        new CmsSection("tranh-chap", "Tranh chấp", new[]
        {
            "Khi phát sinh tranh chấp, các bên có thể mở yêu cầu giải quyết trên Nền Tảng, cung cấp bằng chứng và mô tả chi tiết.",
            "Quy trình: Tiếp nhận → Điều tra → Yêu cầu bằng chứng → Giải quyết → Thanh toán → Đóng.",
            "Các bên có nghĩa vụ hợp tác, cung cấp đầy đủ thông tin và bằng chứng.",
        }),
        new CmsSection("lien-he", "Liên hệ", new[]
        {
            "Mọi thắc mắc, phản hồi hoặc yêu cầu hỗ trợ, vui lòng liên hệ:",
            "– Email: support@movevn.com",
            "– Hotline: 1900 6868",
            "– Ticket hỗ trợ: Đăng nhập và tạo ticket tại mục Hỗ trợ",
            "– Địa chỉ: Khu công nghiệp Đại học FPT",
        }),
    };

    private sealed record LicenseClassSeed(string Code, string DisplayName, string Description, string SystemVersion);
}
