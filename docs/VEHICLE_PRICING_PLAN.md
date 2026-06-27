# Vehicle Pricing Plan

## 1. Muc tieu

Xay dung chuc nang quan ly gia xe cho MoveVN theo dung cau truc hien tai cua backend va frontend.

Plan nay bao gom:

- Them `AreaId` vao `Vehicle`.
- Dung `Area` va `PricingRegion` de xac dinh vung gia.
- Dung `VehicleModelPricing` lam khung gia goi y theo dong xe va vung gia.
- Bo `YearFrom` va `YearTo` khoi `VehicleModelPricing`.
- Admin quan ly day du du lieu gia.
- Owner chon che do gia `Fixed` hoac `Auto`.
- Owner thay gia goi y va khong duoc nhap vuot min/max.
- Auto price cung bi gioi han trong min/max.
- PostgreSQL la source of truth.
- Redis dung cache gia/rule.
- MongoDB dung log ket qua tinh gia.
- Them validator day du o backend va frontend.

## 2. Ly do tach VehicleModel va VehicleModelPricing

### 2.1 VehicleModel la gi

`VehicleModel` la dong xe trong catalog.

Vi du:

- Honda Vision
- Honda Air Blade
- Toyota Vios
- Toyota Fortuner
- Mazda 3

`VehicleModel` tra loi cau hoi:

- Xe nay thuoc dong xe nao?
- Dong xe nay thuoc hang nao?
- Dong xe nay co active khong?

`VehicleModel` khong nen chua gia vi gia phu thuoc vao khu vuc.

### 2.2 VehicleModelPricing la gi

`VehicleModelPricing` la khung gia goi y cho mot dong xe theo vung gia.

Vi du:

- Honda Vision o `HCM_CENTER`: min 120000, base 150000, max 180000.
- Honda Vision o `HCM_SUBURB`: min 90000, base 120000, max 150000.
- Toyota Vios o `HCM_CENTER`: min 600000, base 750000, max 900000.

`VehicleModelPricing` tra loi cau hoi:

- Dong xe nay o khu vuc nay nen cho thue khoang bao nhieu?
- Gia owner nhap co nam trong khung hop ly khong?
- Auto price cua xe co duoc vuot khung gia khong?

### 2.3 Ket luan

Nen giu `VehicleModelPricing`.

Khong nen gop vao `VehicleModel`.

Ly do:

- Mot model co nhieu gia theo nhieu pricing region.
- Admin co the sua khung gia ma khong anh huong catalog xe.
- Sau nay co the mo rong dynamic pricing.
- Owner co gia goi y ro rang khi them xe.

## 3. Quyet dinh bo YearFrom va YearTo

Hien tai chua phan loai gia theo nam san xuat xe.

Vi vay bo:

- `YearFrom`
- `YearTo`

khoi `VehicleModelPricing`.

Schema moi cua `VehicleModelPricing`:

```csharp
public class VehicleModelPricing
{
    public int Id { get; set; }
    public int ModelId { get; set; }
    public int PricingRegionId { get; set; }
    public decimal BasePrice { get; set; }
    public decimal SuggestedMinPrice { get; set; }
    public decimal SuggestedMaxPrice { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
```

`Vehicle.Year` van giu trong bang `Vehicles`.

Nhung phase nay khong dung `Vehicle.Year` de tinh khung gia.

## 4. Quan he bang du lieu

Quan he chinh:

```text
VehicleBrand 1 --- n VehicleModel
VehicleModel 1 --- n VehicleModelVariant

PricingRegion 1 --- n Area
PricingRegion 1 --- n VehicleModelPricing
VehicleModel 1 --- n VehicleModelPricing

Area 1 --- n Vehicle
Vehicle 1 --- 1 VehiclePricing
Vehicle 1 --- n PricingRules
```

Giai thich:

- `PricingRegion` la vung gia.
- `Area` la tinh/quan/huyen va tro ve mot `PricingRegion`.
- `VehicleModelPricing` map `VehicleModel + PricingRegion` thanh khung gia.
- `Vehicle.AreaId` cho biet xe nam o khu vuc nao.
- `VehiclePricing` la cau hinh gia cua xe cu the.
- `PricingRules` la rule dieu chinh gia theo xe.

## 5. Data source theo 3 noi luu tru

### 5.1 PostgreSQL

PostgreSQL la source of truth.

Bang lien quan:

- `Vehicles`
- `VehiclePricing`
- `VehicleModelPricing`
- `PricingRules`
- `PricingRegion`
- `Area`

Tat ca nghiep vu quan trong phai doc/ghi tu PostgreSQL truoc.

### 5.2 Redis

Redis chi la cache.

Keys lien quan:

- `price:{vehicleId}`
- `pricing_rules`

Redis khong duoc la source of truth.

Neu Redis loi:

- request van chay tiep bang PostgreSQL.
- log warning.
- khong fail nghiep vu chinh.

### 5.3 MongoDB

MongoDB dung de log va document linh hoat.

Collections lien quan:

- `pricing_rules`
- `pricing_calculation_logs`
- `weather_snapshots`
- `demand_snapshots`

Phase nay:

- ghi log tinh gia vao `pricing_calculation_logs`.
- chua bat buoc dung weather/demand de tinh gia.
- khong fail request neu MongoDB loi.

## 6. Backend - Domain changes

### 6.1 Vehicle

Sua `MoveVN.Domain/Entities/Vehicle.cs`.

Them:

```csharp
public int? AreaId { get; set; }
```

Y nghia:

- `AreaId` cho biet xe dang nam o khu vuc nao.
- tu `AreaId` suy ra `PricingRegionId`.
- tu `PricingRegionId` tim khung gia trong `VehicleModelPricing`.

### 6.2 VehicleModelPricing

Sua `MoveVN.Domain/Entities/VehicleModelPricing.cs`.

Bo:

```csharp
public short YearFrom { get; set; }
public short YearTo { get; set; }
```

Giu:

```csharp
public int ModelId { get; set; }
public int PricingRegionId { get; set; }
public decimal BasePrice { get; set; }
public decimal SuggestedMinPrice { get; set; }
public decimal SuggestedMaxPrice { get; set; }
```

### 6.3 VehiclePricing

Giu entity hien tai.

Chuan hoa `PricingMode`:

- `Fixed`
- `Auto`

Y nghia:

- `Fixed`: owner tu nhap gia co dinh moi ngay.
- `Auto`: he thong tinh `CurrentPricePerDay` dua tren base price va rule, nhung bi gioi han trong auto min/max.

### 6.4 PricingRule

Giu entity hien tai.

Chuan hoa `RuleType`:

- `Multiplier`
- `FixedPrice`

Y nghia:

- `Multiplier`: nhan gia hien tai voi he so.
- `FixedPrice`: set gia truc tiep.

## 7. Backend - EF Core changes

Sua `AppDbContext`.

Them relation:

```csharp
builder.Entity<Vehicle>()
    .HasOne<Area>()
    .WithMany()
    .HasForeignKey(entity => entity.AreaId)
    .OnDelete(DeleteBehavior.SetNull);
```

Them unique/index:

- `PricingRegion.Code` unique.
- `Area.Province + Area.District` unique.
- `VehicleModelPricing.ModelId + VehicleModelPricing.PricingRegionId` unique.
- `VehiclePricing.VehicleId` unique da co, giu lai.
- `PricingRules.VehicleId + IsActive` da co, giu lai.
- `Vehicles.AreaId` index.

Luu y:

- Neu unique index da ton tai thi khong tao trung.
- Migration can kiem tra snapshot hien tai truoc khi add index.

## 8. Backend - Migration

Tao migration moi:

Ten de xuat:

```text
AddVehicleAreaAndSimplifyModelPricing
```

Migration `Up`:

- Add column `area_id` nullable vao `Vehicles`.
- Add FK `Vehicles.area_id -> Area.id`.
- Add index `IX_Vehicles_area_id`.
- Drop column `year_from` khoi `VehicleModelPricing`.
- Drop column `year_to` khoi `VehicleModelPricing`.
- Drop index cu cua `VehicleModelPricing` neu dang gom `year_from/year_to`.
- Add unique index moi cho `VehicleModelPricing(model_id, pricing_region_id)`.

Migration `Down`:

- Drop FK/index `Vehicles.area_id`.
- Drop column `area_id`.
- Add lai `year_from` va `year_to` voi default an toan.
- Drop unique index moi.
- Add lai index cu neu can.

Compatibility:

- Existing vehicles co `area_id = null`.
- Existing `VehicleModelPricing` neu co nhieu row cung `model_id + pricing_region_id` se gay loi khi add unique index.
- Truoc migration can kiem tra data duplicate.
- Neu duplicate ton tai, can resolve bang script/manual seed truoc.

## 9. Backend - Repository updates

Sua `IVehicleCatalogRepository`.

Them queryables:

```csharp
IQueryable<Area> Areas { get; }
IQueryable<PricingRegion> PricingRegions { get; }
IQueryable<VehiclePricing> VehiclePricings { get; }
IQueryable<VehicleModelPricing> VehicleModelPricings { get; }
IQueryable<PricingRule> PricingRules { get; }
```

Them methods:

```csharp
Task<Area?> GetAreaByIdAsync(int id, CancellationToken cancellationToken = default);
Task<PricingRegion?> GetPricingRegionByIdAsync(int id, CancellationToken cancellationToken = default);
Task<VehiclePricing?> GetVehiclePricingByVehicleIdAsync(long vehicleId, CancellationToken cancellationToken = default);
Task<VehicleModelPricing?> GetVehicleModelPricingByIdAsync(int id, CancellationToken cancellationToken = default);
Task<PricingRule?> GetPricingRuleByIdAsync(long id, CancellationToken cancellationToken = default);
```

Implement trong `VehicleCatalogRepository`.

## 10. Backend - ErrorCode

Sua `MoveVN.Application/Common/Errors/ErrorCode.cs`.

Them:

```csharp
public static readonly ErrorCode PRICING_REGION_NOT_FOUND = new("PRICE_8501", "Pricing region not found.", HttpStatusCode.NotFound);
public static readonly ErrorCode AREA_NOT_FOUND = new("PRICE_8502", "Area not found.", HttpStatusCode.NotFound);
public static readonly ErrorCode VEHICLE_MODEL_PRICING_NOT_FOUND = new("PRICE_8503", "Vehicle model pricing not found.", HttpStatusCode.NotFound);
public static readonly ErrorCode VEHICLE_PRICING_NOT_FOUND = new("PRICE_8504", "Vehicle pricing not found.", HttpStatusCode.NotFound);
public static readonly ErrorCode PRICING_RULE_NOT_FOUND = new("PRICE_8505", "Pricing rule not found.", HttpStatusCode.NotFound);
public static readonly ErrorCode PRICING_MODE_INVALID = new("PRICE_8506", "Pricing mode is invalid.", HttpStatusCode.BadRequest);
public static readonly ErrorCode PRICING_INVALID_RANGE = new("PRICE_8507", "Pricing range is invalid.", HttpStatusCode.BadRequest);
public static readonly ErrorCode PRICING_OUT_OF_SUGGESTED_RANGE = new("PRICE_8508", "Price is outside suggested range.", HttpStatusCode.BadRequest);
public static readonly ErrorCode PRICING_DUPLICATED = new("PRICE_8509", "Pricing data already exists.", HttpStatusCode.BadRequest);
public static readonly ErrorCode PRICING_RULE_INVALID = new("PRICE_8510", "Pricing rule is invalid.", HttpStatusCode.BadRequest);
```

Dung `AppException` theo pattern hien tai.

## 11. Backend - New Application modules

Tao cac module moi trong `MoveVN.Application/Modules`.

### 11.1 PricingRegions

Files:

- `Modules/PricingRegions/DTOs/PricingRegionResponse.cs`
- `Modules/PricingRegions/DTOs/CreatePricingRegionRequest.cs`
- `Modules/PricingRegions/DTOs/UpdatePricingRegionRequest.cs`
- `Modules/PricingRegions/Interfaces/IPricingRegionService.cs`
- `Modules/PricingRegions/Services/PricingRegionService.cs`
- `Modules/PricingRegions/Validators/CreatePricingRegionRequestValidator.cs`
- `Modules/PricingRegions/Validators/UpdatePricingRegionRequestValidator.cs`

### 11.2 Areas

Files:

- `Modules/Areas/DTOs/AreaResponse.cs`
- `Modules/Areas/DTOs/CreateAreaRequest.cs`
- `Modules/Areas/DTOs/UpdateAreaRequest.cs`
- `Modules/Areas/Interfaces/IAreaService.cs`
- `Modules/Areas/Services/AreaService.cs`
- `Modules/Areas/Validators/CreateAreaRequestValidator.cs`
- `Modules/Areas/Validators/UpdateAreaRequestValidator.cs`

### 11.3 VehicleModelPricings

Files:

- `Modules/VehicleModelPricings/DTOs/VehicleModelPricingResponse.cs`
- `Modules/VehicleModelPricings/DTOs/CreateVehicleModelPricingRequest.cs`
- `Modules/VehicleModelPricings/DTOs/UpdateVehicleModelPricingRequest.cs`
- `Modules/VehicleModelPricings/Interfaces/IVehicleModelPricingService.cs`
- `Modules/VehicleModelPricings/Services/VehicleModelPricingService.cs`
- `Modules/VehicleModelPricings/Validators/CreateVehicleModelPricingRequestValidator.cs`
- `Modules/VehicleModelPricings/Validators/UpdateVehicleModelPricingRequestValidator.cs`

### 11.4 PricingRules

Files:

- `Modules/PricingRules/DTOs/PricingRuleResponse.cs`
- `Modules/PricingRules/DTOs/CreatePricingRuleRequest.cs`
- `Modules/PricingRules/DTOs/UpdatePricingRuleRequest.cs`
- `Modules/PricingRules/Interfaces/IPricingRuleService.cs`
- `Modules/PricingRules/Services/PricingRuleService.cs`
- `Modules/PricingRules/Validators/CreatePricingRuleRequestValidator.cs`
- `Modules/PricingRules/Validators/UpdatePricingRuleRequestValidator.cs`

### 11.5 VehiclePricings

Files:

- `Modules/VehiclePricings/DTOs/VehiclePricingResponse.cs`
- `Modules/VehiclePricings/DTOs/UpdateVehiclePricingRequest.cs`
- `Modules/VehiclePricings/DTOs/PricingSuggestionResponse.cs`
- `Modules/VehiclePricings/Interfaces/IVehiclePricingService.cs`
- `Modules/VehiclePricings/Interfaces/IPricingCalculatorService.cs`
- `Modules/VehiclePricings/Services/VehiclePricingService.cs`
- `Modules/VehiclePricings/Services/PricingCalculatorService.cs`
- `Modules/VehiclePricings/Validators/UpdateVehiclePricingRequestValidator.cs`

## 12. Backend - DTO contracts

### 12.1 PricingRegion DTOs

`PricingRegionResponse`:

```csharp
public class PricingRegionResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}
```

`CreatePricingRegionRequest`:

```csharp
public class CreatePricingRegionRequest
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
}
```

`UpdatePricingRegionRequest`:

```csharp
public class UpdatePricingRegionRequest
{
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}
```

### 12.2 Area DTOs

`AreaResponse`:

```csharp
public class AreaResponse
{
    public int Id { get; set; }
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public int PricingRegionId { get; set; }
    public string PricingRegionCode { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
```

`CreateAreaRequest`:

```csharp
public class CreateAreaRequest
{
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public int PricingRegionId { get; set; }
}
```

`UpdateAreaRequest`:

```csharp
public class UpdateAreaRequest
{
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public int PricingRegionId { get; set; }
    public bool IsActive { get; set; }
}
```

### 12.3 VehicleModelPricing DTOs

`VehicleModelPricingResponse`:

```csharp
public class VehicleModelPricingResponse
{
    public int Id { get; set; }
    public int ModelId { get; set; }
    public string ModelName { get; set; } = string.Empty;
    public int BrandId { get; set; }
    public string BrandName { get; set; } = string.Empty;
    public string VehicleType { get; set; } = string.Empty;
    public int PricingRegionId { get; set; }
    public string PricingRegionCode { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public decimal SuggestedMinPrice { get; set; }
    public decimal SuggestedMaxPrice { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
```

`CreateVehicleModelPricingRequest`:

```csharp
public class CreateVehicleModelPricingRequest
{
    public int ModelId { get; set; }
    public int PricingRegionId { get; set; }
    public decimal BasePrice { get; set; }
    public decimal SuggestedMinPrice { get; set; }
    public decimal SuggestedMaxPrice { get; set; }
}
```

`UpdateVehicleModelPricingRequest`:

```csharp
public class UpdateVehicleModelPricingRequest
{
    public int ModelId { get; set; }
    public int PricingRegionId { get; set; }
    public decimal BasePrice { get; set; }
    public decimal SuggestedMinPrice { get; set; }
    public decimal SuggestedMaxPrice { get; set; }
    public bool IsActive { get; set; }
}
```

### 12.4 PricingRule DTOs

`PricingRuleResponse`:

```csharp
public class PricingRuleResponse
{
    public long Id { get; set; }
    public long VehicleId { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public string RuleType { get; set; } = string.Empty;
    public decimal? Multiplier { get; set; }
    public decimal? FixedPrice { get; set; }
    public int Priority { get; set; }
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsActive { get; set; }
}
```

`CreatePricingRuleRequest`:

```csharp
public class CreatePricingRuleRequest
{
    public long VehicleId { get; set; }
    public string RuleType { get; set; } = string.Empty;
    public decimal? Multiplier { get; set; }
    public decimal? FixedPrice { get; set; }
    public int Priority { get; set; } = 100;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
}
```

`UpdatePricingRuleRequest`:

```csharp
public class UpdatePricingRuleRequest
{
    public long VehicleId { get; set; }
    public string RuleType { get; set; } = string.Empty;
    public decimal? Multiplier { get; set; }
    public decimal? FixedPrice { get; set; }
    public int Priority { get; set; } = 100;
    public DateOnly? StartDate { get; set; }
    public DateOnly? EndDate { get; set; }
    public bool IsActive { get; set; }
}
```

### 12.5 VehiclePricing DTOs

`PricingSuggestionResponse`:

```csharp
public class PricingSuggestionResponse
{
    public bool HasSuggestion { get; set; }
    public int ModelId { get; set; }
    public int? AreaId { get; set; }
    public int? PricingRegionId { get; set; }
    public string? PricingRegionCode { get; set; }
    public decimal? BasePrice { get; set; }
    public decimal? SuggestedMinPrice { get; set; }
    public decimal? SuggestedMaxPrice { get; set; }
}
```

`VehiclePricingResponse`:

```csharp
public class VehiclePricingResponse
{
    public long VehicleId { get; set; }
    public string PricingMode { get; set; } = string.Empty;
    public decimal? FixedPricePerDay { get; set; }
    public decimal? AutoMinPrice { get; set; }
    public decimal? AutoMaxPrice { get; set; }
    public decimal CurrentPricePerDay { get; set; }
    public DateTime? LastCalculatedAt { get; set; }
    public DateTime LastUpdatedAt { get; set; }
    public PricingSuggestionResponse? Suggestion { get; set; }
}
```

`UpdateVehiclePricingRequest`:

```csharp
public class UpdateVehiclePricingRequest
{
    public string PricingMode { get; set; } = string.Empty;
    public decimal? FixedPricePerDay { get; set; }
    public decimal? AutoMinPrice { get; set; }
    public decimal? AutoMaxPrice { get; set; }
}
```

## 13. Backend - Validators

Tat ca validators dat trong folder `Validators` cua module tuong ung.

Dung `FluentValidation`.

### 13.1 CreatePricingRegionRequestValidator

Rules:

- `Code`
  - not empty.
  - max length 50.
  - trim khong duoc rong.
  - chi cho chu, so, `_`, `-`.
- `Description`
  - max length 255.

Service-level validation:

- `Code` khong trung voi region khac.
- So sanh duplicate case-insensitive.

### 13.2 UpdatePricingRegionRequestValidator

Rules:

- `Code`
  - not empty.
  - max length 50.
  - trim khong duoc rong.
  - chi cho chu, so, `_`, `-`.
- `Description`
  - max length 255.
- `IsActive`
  - required.

Service-level validation:

- id phai ton tai.
- `Code` khong trung voi region khac.
- Neu deactivate region:
  - cho phep deactivate.
  - khong xoa cascade.
  - cac area/model pricing cu van con nhung UI se filter inactive neu can.

### 13.3 CreateAreaRequestValidator

Rules:

- `Province`
  - not empty.
  - max length 100.
  - trim khong duoc rong.
- `District`
  - not empty.
  - max length 100.
  - trim khong duoc rong.
- `PricingRegionId`
  - greater than 0.

Service-level validation:

- pricing region phai ton tai.
- pricing region phai active.
- `Province + District` khong trung voi active area khac.
- normalize trim province/district truoc khi luu.

### 13.4 UpdateAreaRequestValidator

Rules:

- `Province`
  - not empty.
  - max length 100.
- `District`
  - not empty.
  - max length 100.
- `PricingRegionId`
  - greater than 0.
- `IsActive`
  - required.

Service-level validation:

- area id phai ton tai.
- pricing region phai ton tai.
- neu request `IsActive = true` thi pricing region phai active.
- `Province + District` khong trung voi area khac.

### 13.5 CreateVehicleModelPricingRequestValidator

Rules:

- `ModelId`
  - greater than 0.
- `PricingRegionId`
  - greater than 0.
- `BasePrice`
  - greater than 0.
  - precision toi da 15, scale 2.
- `SuggestedMinPrice`
  - greater than 0.
  - precision toi da 15, scale 2.
- `SuggestedMaxPrice`
  - greater than 0.
  - precision toi da 15, scale 2.
- `SuggestedMinPrice <= BasePrice`.
- `BasePrice <= SuggestedMaxPrice`.

Service-level validation:

- model phai ton tai.
- model phai active.
- pricing region phai ton tai.
- pricing region phai active.
- khong duoc co active record khac cung `ModelId + PricingRegionId`.

### 13.6 UpdateVehicleModelPricingRequestValidator

Rules:

- giong create.
- `IsActive`
  - required.

Service-level validation:

- record id phai ton tai.
- model phai ton tai.
- pricing region phai ton tai.
- neu request `IsActive = true`:
  - model phai active.
  - pricing region phai active.
  - khong duoc trung active record khac cung `ModelId + PricingRegionId`.

### 13.7 CreatePricingRuleRequestValidator

Rules:

- `VehicleId`
  - greater than 0.
- `RuleType`
  - not empty.
  - must be `Multiplier` hoac `FixedPrice`.
- `Priority`
  - greater than or equal 0.
  - less than or equal 10000.
- Neu `RuleType = Multiplier`:
  - `Multiplier` required.
  - `Multiplier > 0`.
  - `FixedPrice` must be null.
- Neu `RuleType = FixedPrice`:
  - `FixedPrice` required.
  - `FixedPrice > 0`.
  - `Multiplier` must be null.
- Neu co ca `StartDate` va `EndDate`:
  - `StartDate <= EndDate`.

Service-level validation:

- vehicle phai ton tai.
- khong bat buoc vehicle active.
- date range co the null ca hai de ap dung tat ca ngay.
- neu chi co `StartDate`, rule ap dung tu ngay do tro di.
- neu chi co `EndDate`, rule ap dung den ngay do.

### 13.8 UpdatePricingRuleRequestValidator

Rules:

- giong create.
- `IsActive`
  - required.

Service-level validation:

- rule id phai ton tai.
- vehicle phai ton tai.
- khi update active rule thi invalidate cache price cua vehicle.

### 13.9 UpdateVehiclePricingRequestValidator

Rules:

- `PricingMode`
  - not empty.
  - must be `Fixed` hoac `Auto`.
- Neu `PricingMode = Fixed`:
  - `FixedPricePerDay` required.
  - `FixedPricePerDay > 0`.
  - `AutoMinPrice` must be null.
  - `AutoMaxPrice` must be null.
- Neu `PricingMode = Auto`:
  - `AutoMinPrice` required.
  - `AutoMaxPrice` required.
  - `AutoMinPrice > 0`.
  - `AutoMaxPrice > 0`.
  - `AutoMinPrice <= AutoMaxPrice`.
  - `FixedPricePerDay` must be null.

Service-level validation:

- vehicle phai ton tai.
- vehicle phai thuoc owner hien tai neu owner endpoint.
- neu co pricing suggestion:
  - fixed price phai nam trong suggested min/max.
  - auto min phai nam trong suggested min/max.
  - auto max phai nam trong suggested min/max.
- neu khong co pricing suggestion:
  - chi validate price > 0 va range hop le.
- sau khi update:
  - update `VehiclePricing`.
  - update `Vehicle.PricePerDay`.
  - invalidate Redis cache.

### 13.10 CreateVehicleRequest validation update

Them rules cho request them xe:

- `AreaId`
  - required for new vehicle registration.
  - greater than 0.
- `PricingMode`
  - required.
  - must be `Fixed` hoac `Auto`.
- Neu fixed:
  - `FixedPricePerDay` required.
  - price > 0.
  - price trong suggested min/max neu co suggestion.
- Neu auto:
  - `AutoMinPrice` required.
  - `AutoMaxPrice` required.
  - auto min <= auto max.
  - auto min/max trong suggested min/max neu co suggestion.
- `PricePerDay`
  - co the giu de backward compatibility.
  - khong dung lam source of truth neu co pricing request moi.

Service-level validation:

- area phai ton tai va active.
- model phai ton tai va active.
- brand/model/vehicleType phai match.
- variant neu co phai match model va vehicleType.

### 13.11 UpdateVehicleRequest validation update

Them:

- `AreaId`
  - optional hoac required tuy UI.
  - de xuat required khi edit vehicle info.

Rules:

- neu `AreaId` co value:
  - area phai ton tai.
  - area phai active.
- khong nen update pricing trong general update nua.
- neu van giu `PricePerDay` trong DTO cu:
  - validate > 0.
  - sync sang `VehiclePricing` de tranh lech du lieu.

## 14. Backend - Pricing calculator

Tao `IPricingCalculatorService`.

Methods:

```csharp
Task<PricingSuggestionResponse> GetSuggestionAsync(int modelId, int areaId, CancellationToken cancellationToken = default);
Task<decimal> CalculateCurrentPriceAsync(long vehicleId, DateOnly date, CancellationToken cancellationToken = default);
Task ValidatePricingAgainstSuggestionAsync(Vehicle vehicle, UpdateVehiclePricingRequest request, CancellationToken cancellationToken = default);
```

### 14.1 GetSuggestionAsync

Flow:

```text
modelId + areaId
    -> find Area
    -> Area.PricingRegionId
    -> find active VehicleModelPricing by ModelId + PricingRegionId
    -> return base/min/max
```

Neu khong tim thay:

- return `HasSuggestion = false`.
- khong throw error.

Neu area khong ton tai:

- throw `AREA_NOT_FOUND`.

Neu model khong ton tai:

- throw `VEHICLE_MODEL_NOT_FOUND`.

### 14.2 CalculateCurrentPriceAsync

Flow:

```text
vehicle
    -> vehicle pricing
    -> if Fixed: return fixed price
    -> if Auto:
        -> start from suggestion base price
        -> apply active PricingRules
        -> clamp in AutoMinPrice/AutoMaxPrice
        -> update VehiclePricing.CurrentPricePerDay
        -> update Vehicle.PricePerDay
        -> cache Redis
        -> log Mongo
```

Neu khong co suggestion va mode Auto:

- start from `AutoMinPrice`.
- apply rules neu co.
- clamp min/max.

### 14.3 Rule application

Active rule duoc ap dung neu:

- `IsActive = true`.
- `StartDate == null || StartDate <= date`.
- `EndDate == null || EndDate >= date`.

Thu tu:

- sort by `Priority` tang dan.
- sau do sort by `Id` tang dan de deterministic.

Rule:

- `Multiplier`: `price = price * Multiplier`.
- `FixedPrice`: `price = FixedPrice`.

Sau tat ca rule:

- clamp theo auto min/max.
- lam tron 2 chu so thap phan.

## 15. Backend - Admin APIs

### 15.1 PricingRegionsController

Path:

```text
/api/admin/pricing-regions
```

Methods:

- `GET`
- `GET /{id}`
- `POST`
- `PUT /{id}`
- `DELETE /{id}`

Authorize:

```csharp
[Authorize(Roles = "Admin")]
```

### 15.2 AreasController

Path:

```text
/api/admin/areas
```

Methods:

- `GET`
- `GET /{id}`
- `POST`
- `PUT /{id}`
- `DELETE /{id}`

Query for `GET`:

- `keyword`
- `province`
- `pricingRegionId`
- `isActive`
- `page`
- `pageSize`

### 15.3 VehicleModelPricingsController

Path:

```text
/api/admin/vehicle-model-pricings
```

Methods:

- `GET`
- `GET /{id}`
- `POST`
- `PUT /{id}`
- `DELETE /{id}`

Query for `GET`:

- `keyword`
- `vehicleType`
- `brandId`
- `modelId`
- `pricingRegionId`
- `isActive`
- `page`
- `pageSize`

### 15.4 PricingRulesController

Path:

```text
/api/admin/pricing-rules
```

Methods:

- `GET`
- `GET /{id}`
- `POST`
- `PUT /{id}`
- `DELETE /{id}`

Query for `GET`:

- `keyword`
- `vehicleId`
- `ruleType`
- `isActive`
- `page`
- `pageSize`

## 16. Backend - Owner APIs

Mo rong `VehiclesController`.

### 16.1 Get pricing suggestion

```text
GET /api/vehicles/pricing/suggestion?modelId=1&areaId=2
```

Response:

```json
{
  "hasSuggestion": true,
  "modelId": 1,
  "areaId": 2,
  "pricingRegionId": 3,
  "pricingRegionCode": "HCM_CENTER",
  "basePrice": 150000,
  "suggestedMinPrice": 120000,
  "suggestedMaxPrice": 180000
}
```

Khong co suggestion:

```json
{
  "hasSuggestion": false,
  "modelId": 1,
  "areaId": 2,
  "pricingRegionId": 3,
  "pricingRegionCode": "HCM_CENTER",
  "basePrice": null,
  "suggestedMinPrice": null,
  "suggestedMaxPrice": null
}
```

### 16.2 Get vehicle pricing

```text
GET /api/vehicles/{id}/pricing
```

Yeu cau:

- user role Owner.
- xe phai thuoc owner hien tai.

### 16.3 Update vehicle pricing

```text
PUT /api/vehicles/{id}/pricing
```

Body fixed:

```json
{
  "pricingMode": "Fixed",
  "fixedPricePerDay": 150000,
  "autoMinPrice": null,
  "autoMaxPrice": null
}
```

Body auto:

```json
{
  "pricingMode": "Auto",
  "fixedPricePerDay": null,
  "autoMinPrice": 120000,
  "autoMaxPrice": 180000
}
```

Sau update:

- update `VehiclePricing`.
- update `Vehicle.PricePerDay`.
- invalidate Redis `price:{vehicleId}`.
- return `VehiclePricingResponse`.

## 17. Backend - Catalog APIs

Mo rong `VehicleCatalogController`.

### 17.1 Get active areas

```text
GET /api/catalog/areas
```

Query:

- `province`
- `pricingRegionId`

Response:

```csharp
public class CatalogAreaResponse
{
    public int Id { get; set; }
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public int PricingRegionId { get; set; }
    public string PricingRegionCode { get; set; } = string.Empty;
}
```

### 17.2 Get active pricing regions

```text
GET /api/catalog/pricing-regions
```

Response:

```csharp
public class CatalogPricingRegionResponse
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
}
```

## 18. Backend - VehicleService updates

### 18.1 Create vehicle

Sua `CreateAsync`.

Flow moi:

```text
validate brand/model/variant/area
validate features
validate pricing request
create Vehicle with AreaId
save Vehicle
create feature mappings
create images
create documents
create VehiclePricing
sync Vehicle.PricePerDay
return detail
```

Feature validation can them:

- moi `FeatureId` phai ton tai.
- feature phai active.
- feature vehicle type phai match vehicle type.
- khong duplicate feature id.

### 18.2 Update vehicle

Sua `UpdateAsync`.

Flow:

```text
validate vehicle ownership
validate area if changed
update general fields
update features
do not change pricing here unless backward compatibility needs it
return detail
```

### 18.3 Get vehicle detail

Them vao response:

- `AreaId`
- `AreaName`
- `PricingRegionId`
- `PricingRegionCode`
- `PricingMode`
- `FixedPricePerDay`
- `AutoMinPrice`
- `AutoMaxPrice`
- `CurrentPricePerDay`
- `SuggestedMinPrice`
- `SuggestedMaxPrice`
- `SuggestedBasePrice`

Neu vehicle chua co `VehiclePricing`:

- tao response fallback tu `Vehicle.PricePerDay`.
- khong bat buoc auto-create trong get detail.
- auto-create chi nen lam khi owner update pricing.

## 19. Backend - Dependency Injection

Sua `MoveVN.Application/DependencyInjection.cs`.

Register:

```csharp
services.AddScoped<IPricingRegionService, PricingRegionService>();
services.AddScoped<IAreaService, AreaService>();
services.AddScoped<IVehicleModelPricingService, VehicleModelPricingService>();
services.AddScoped<IPricingRuleService, PricingRuleService>();
services.AddScoped<IVehiclePricingService, VehiclePricingService>();
services.AddScoped<IPricingCalculatorService, PricingCalculatorService>();
```

Neu them Redis/Mongo wrapper:

Register trong Infrastructure:

```csharp
services.AddSingleton<IPricingCacheService, RedisPricingCacheService>();
services.AddSingleton<IPricingCalculationLogger, MongoPricingCalculationLogger>();
```

Neu Mongo khong configured:

- dung no-op logger.

## 20. Frontend - Endpoints

Sua `src/services/endpoints.ts`.

Them:

```ts
admin: {
  pricingRegions: "/api/admin/pricing-regions",
  areas: "/api/admin/areas",
  vehicleModelPricings: "/api/admin/vehicle-model-pricings",
  pricingRules: "/api/admin/pricing-rules",
}
```

Them:

```ts
vehicles: {
  pricing: (id: number) => `/api/vehicles/${id}/pricing`,
  pricingSuggestion: "/api/vehicles/pricing/suggestion",
}
```

Them:

```ts
catalog: {
  areas: "/api/catalog/areas",
  pricingRegions: "/api/catalog/pricing-regions",
}
```

## 21. Frontend - Admin features

### 21.1 Pricing regions

Tao:

- `src/features/pricingRegions/types.ts`
- `src/features/pricingRegions/services/pricingRegionService.ts`
- `src/pages/admin/AdminPricingRegionsPage.tsx`

UI:

- table code, description, active.
- search.
- active filter.
- create/edit modal.
- active toggle.
- pagination.

FE validators:

- code required.
- code max 50.
- code chi gom chu/so/_/-.
- description max 255.

### 21.2 Areas

Tao:

- `src/features/areas/types.ts`
- `src/features/areas/services/areaService.ts`
- `src/pages/admin/AdminAreasPage.tsx`

UI:

- table province, district, pricing region, active.
- filter province.
- filter pricing region.
- create/edit modal.
- active toggle.
- pagination.

FE validators:

- province required.
- district required.
- pricing region required.
- province/district max 100.

### 21.3 Vehicle model pricings

Tao:

- `src/features/vehicleModelPricings/types.ts`
- `src/features/vehicleModelPricings/services/vehicleModelPricingService.ts`
- `src/pages/admin/AdminVehicleModelPricingsPage.tsx`

UI:

- table brand, model, vehicle type, pricing region, min, base, max, active.
- filters:
  - vehicle type.
  - brand.
  - model.
  - pricing region.
  - active.
- create/edit modal.

FE validators:

- model required.
- pricing region required.
- min/base/max required.
- min/base/max > 0.
- min <= base.
- base <= max.

### 21.4 Pricing rules

Tao:

- `src/features/pricingRules/types.ts`
- `src/features/pricingRules/services/pricingRuleService.ts`
- `src/pages/admin/AdminPricingRulesPage.tsx`

UI:

- table vehicle, license plate, rule type, value, priority, date range, active.
- filters:
  - keyword.
  - vehicle id.
  - rule type.
  - active.
- create/edit modal.

FE validators:

- vehicle required.
- rule type required.
- if multiplier:
  - multiplier required.
  - multiplier > 0.
  - fixed price empty.
- if fixed price:
  - fixed price required.
  - fixed price > 0.
  - multiplier empty.
- priority >= 0.
- start date <= end date if both present.

## 22. Frontend - Routes and sidebar

Sua `src/routes/AppRoutes.tsx`.

Them routes admin:

```tsx
<Route path="/admin/pricing-regions" element={<AdminPricingRegionsPage />} />
<Route path="/admin/areas" element={<AdminAreasPage />} />
<Route path="/admin/vehicle-model-pricings" element={<AdminVehicleModelPricingsPage />} />
<Route path="/admin/pricing-rules" element={<AdminPricingRulesPage />} />
```

Sua `src/components/layout/Sidebar.tsx`.

Them admin menu items:

- Vung gia
- Khu vuc
- Khung gia dong xe
- Quy tac gia

Giu style hien tai:

- item trong group `Phuong tien`.
- icon lucide.
- active route theo path.

## 23. Frontend - Vehicle types

Sua `src/features/vehicles/types.ts`.

Them vao `VehicleResponse`:

```ts
areaId: number | null;
areaName: string | null;
pricingRegionId: number | null;
pricingRegionCode: string | null;
pricingMode: "Fixed" | "Auto" | null;
fixedPricePerDay: number | null;
autoMinPrice: number | null;
autoMaxPrice: number | null;
currentPricePerDay: number | null;
suggestedBasePrice: number | null;
suggestedMinPrice: number | null;
suggestedMaxPrice: number | null;
```

Them type:

```ts
export type PricingSuggestionResponse = {
  hasSuggestion: boolean;
  modelId: number;
  areaId: number | null;
  pricingRegionId: number | null;
  pricingRegionCode: string | null;
  basePrice: number | null;
  suggestedMinPrice: number | null;
  suggestedMaxPrice: number | null;
};
```

Them type:

```ts
export type VehiclePricingResponse = {
  vehicleId: number;
  pricingMode: "Fixed" | "Auto";
  fixedPricePerDay: number | null;
  autoMinPrice: number | null;
  autoMaxPrice: number | null;
  currentPricePerDay: number;
  lastCalculatedAt: string | null;
  lastUpdatedAt: string;
  suggestion: PricingSuggestionResponse | null;
};
```

Update `CreateVehicleRequest`:

```ts
areaId: number;
pricingMode: "Fixed" | "Auto";
fixedPricePerDay?: number | null;
autoMinPrice?: number | null;
autoMaxPrice?: number | null;
```

Update `UpdateVehicleRequest`:

```ts
areaId?: number | null;
```

## 24. Frontend - Vehicle service

Sua `src/features/vehicles/services/vehicleService.ts`.

Them:

```ts
export async function getCatalogAreas(params?: Record<string, string | number | undefined>) {}
export async function getCatalogPricingRegions() {}
export async function getPricingSuggestion(modelId: number, areaId: number) {}
export async function getVehiclePricing(id: number) {}
export async function updateVehiclePricing(id: number, data: UpdateVehiclePricingRequest) {}
```

Pattern theo service hien tai:

- dung `apiClient`.
- return `res.data.data`.
- fallback empty array neu catalog.

## 25. Frontend - Owner add vehicle

Sua `OwnerVehicleAddPage.tsx`.

Them state:

- `areaId`
- `areas`
- `pricingMode`
- `fixedPricePerDay`
- `autoMinPrice`
- `autoMaxPrice`
- `pricingSuggestion`
- `pricingError`

Load:

- khi page mount: load catalog areas.
- khi `modelId + areaId` thay doi: call pricing suggestion.

Gia & dia chi step:

- address input.
- area dropdown.
- pricing mode segmented control:
  - Fixed.
  - Auto.
- suggestion panel:
  - base price.
  - min price.
  - max price.
  - warning neu chua co suggestion.

Fixed UI:

- one input `fixedPricePerDay`.
- validate min/max neu co suggestion.

Auto UI:

- input `autoMinPrice`.
- input `autoMaxPrice`.
- validate:
  - min <= max.
  - both inside suggestion min/max.

Can proceed rule:

- area selected.
- address not empty.
- pricing mode selected.
- fixed valid neu fixed.
- auto valid neu auto.

Submit:

- gui `areaId`.
- gui `pricingMode`.
- gui fixed/auto fields.
- khong rely vao `pricePerDay` nua.

## 26. Frontend - Owner edit vehicle

Sua `OwnerVehicleEditPage.tsx`.

Tach UI:

- section thong tin chung.
- section gia xe.

Load:

- vehicle detail.
- catalog areas.
- vehicle pricing.
- pricing suggestion theo model + area.

Save general info:

- update vehicle year/license/odometer/address/area/features.

Save pricing:

- call `PUT /api/vehicles/{id}/pricing`.

FE validators:

- fixed price required and > 0.
- auto min/max required and > 0.
- auto min <= auto max.
- price inside suggestion range if suggestion exists.

## 27. Frontend - Owner detail and list

Sua `OwnerVehicleDetailPage.tsx`.

Hien thi:

- area.
- pricing region.
- pricing mode.
- current price.
- fixed price neu mode fixed.
- auto min/max neu mode auto.
- suggested min/max neu response co.

Sua `OwnerVehicleListPage.tsx` neu can:

- hien pricing mode badge.
- van sort theo `pricePerDay`.

## 28. Redis cache plan

Cache current price:

Key:

```text
price:{vehicleId}
```

Value:

```json
{
  "vehicleId": 1,
  "currentPricePerDay": 150000,
  "pricingMode": "Auto",
  "calculatedAt": "2026-06-27T00:00:00Z"
}
```

TTL:

- 10 minutes.

Invalidate khi:

- owner update vehicle pricing.
- admin update pricing rule for vehicle.
- admin deactivate pricing rule for vehicle.
- admin update model pricing related to vehicle model and region.
- vehicle area changes.

Cache rules:

Key:

```text
pricing_rules
```

TTL:

- 30 minutes.

Phase v1 co the invalidate-only, chua bat buoc optimize read from cache.

## 29. Mongo log plan

Collection:

```text
pricing_calculation_logs
```

Log khi:

- calculate current price for auto.
- update owner pricing auto.
- optional: nightly recalculation sau nay.

Input log:

- vehicle id.
- date.
- pricing mode.
- model id.
- area id.
- pricing region id.
- base price.
- auto min.
- auto max.
- rules applied.

Output log:

- raw calculated price.
- clamped price.
- current price.

Mongo failure:

- log warning.
- do not throw to user.

## 30. Test plan

### 30.1 Backend build

Run:

```powershell
dotnet build MoveVN.sln
```

Neu API dang chay lock dll:

- stop `MoveVN.Api` process truoc.

### 30.2 EF migration check

Run:

```powershell
dotnet ef migrations add AddVehicleAreaAndSimplifyModelPricing --project src/MoveVN.Infrastructure --startup-project src/MoveVN.Api
dotnet ef migrations list --project src/MoveVN.Infrastructure --startup-project src/MoveVN.Api
```

### 30.3 Backend validator tests

Test cases:

- pricing region code empty -> invalid.
- pricing region duplicate code -> invalid.
- area missing province -> invalid.
- area missing district -> invalid.
- area invalid region -> invalid.
- area duplicate province/district -> invalid.
- model pricing min > base -> invalid.
- model pricing base > max -> invalid.
- model pricing duplicate model/region -> invalid.
- fixed pricing missing fixed price -> invalid.
- fixed pricing outside suggestion -> invalid.
- auto pricing missing min/max -> invalid.
- auto pricing min > max -> invalid.
- auto pricing outside suggestion -> invalid.
- multiplier rule without multiplier -> invalid.
- fixed rule without fixed price -> invalid.
- pricing rule start date > end date -> invalid.

### 30.4 Backend service tests

Test cases:

- admin creates pricing region.
- admin creates area.
- admin creates model pricing.
- owner gets pricing suggestion.
- owner creates fixed vehicle inside range.
- owner creates auto vehicle inside range.
- owner fixed price below min rejected.
- owner fixed price above max rejected.
- owner auto min below min rejected.
- owner auto max above max rejected.
- owner updates pricing and vehicle price syncs.
- pricing rule updates invalidate cache.
- auto calculation applies multiplier rule.
- auto calculation applies fixed price rule.
- auto calculation clamps in min/max.

### 30.5 Frontend manual tests

Admin:

- open pricing regions page.
- create region.
- edit region.
- deactivate region.
- open areas page.
- create area linked to region.
- open model pricing page.
- create model pricing.
- validation catches min/base/max wrong.
- open pricing rules page.
- create multiplier rule.
- create fixed price rule.

Owner:

- add vehicle.
- select area.
- see suggestion.
- fixed valid submit works.
- fixed below min blocked.
- fixed above max blocked.
- auto valid submit works.
- auto min > max blocked.
- auto outside suggestion blocked.
- edit pricing from fixed to auto.
- detail page shows new pricing mode.

## 31. Acceptance criteria

Backend:

- `Vehicle` has nullable `AreaId`.
- `VehicleModelPricing` no longer uses `YearFrom/YearTo`.
- Admin can CRUD pricing regions.
- Admin can CRUD areas.
- Admin can CRUD model pricing.
- Admin can CRUD pricing rules.
- Owner can get price suggestion by model and area.
- Owner can set fixed price.
- Owner can set auto price range.
- BE rejects invalid price even if FE is bypassed.
- `Vehicles.price_per_day` and `VehiclePricing.current_price_per_day` stay synced.
- Redis is cache only.
- Mongo log is best effort.

Frontend:

- Admin pages follow current table/modal/pagination style.
- Sidebar has pricing management links.
- Owner add vehicle has area and pricing mode.
- Owner edit vehicle can update pricing separately.
- UI blocks invalid min/max before submit.
- API error still shown if BE rejects.

## 32. Implementation order

Recommended order:

1. Update domain entities.
2. Update DbContext mappings.
3. Update repository interface and implementation.
4. Add migration.
5. Add backend DTOs.
6. Add validators.
7. Add services.
8. Add controllers.
9. Update vehicle create/update/detail APIs.
10. Add catalog area/pricing region APIs.
11. Add frontend endpoints.
12. Add frontend admin feature services/types.
13. Add admin pages.
14. Add routes/sidebar.
15. Update owner add page.
16. Update owner edit page.
17. Update owner detail/list.
18. Add tests.
19. Run build.
20. Manual QA.

## 33. Notes

- Khong xoa `Vehicles.price_per_day` trong phase nay.
- Khong dung `Vehicle.Year` de tinh gia trong phase nay.
- Khong bat buoc owner co pricing suggestion neu admin chua tao model pricing, nhung neu co suggestion thi phai enforce min/max.
- Khong cho FE la source of truth cua validation.
- Khong fail main flow neu Redis hoac Mongo loi.
- Tat ca tien nen dung decimal.
- FE format tien bang `toLocaleString("vi-VN")`.
- API payload van dung camelCase khi len frontend do ASP.NET default JSON policy.
