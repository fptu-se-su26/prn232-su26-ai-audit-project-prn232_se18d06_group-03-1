namespace MoveVN.Application.Modules.Locations.DTOs;

public class GoongPlaceAutocompleteResponse
{
    public List<GoongPlacePrediction> Predictions { get; set; } = [];
}

public class GoongPlacePrediction
{
    public string Description { get; set; } = string.Empty;
    public string PlaceId { get; set; } = string.Empty;
    public GoongStructuredFormatting? StructuredFormatting { get; set; }
    public GoongCompound? Compound { get; set; }
}

public class GoongStructuredFormatting
{
    public string MainText { get; set; } = string.Empty;
    public string SecondaryText { get; set; } = string.Empty;
}

public class GoongCompound
{
    public string? Commune { get; set; }
    public string? Province { get; set; }
}

public class GoongPlaceDetailResponse
{
    public string PlaceId { get; set; } = string.Empty;
    public string FormattedAddress { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public decimal Latitude { get; set; }
    public decimal Longitude { get; set; }
}
