namespace MoveVN.Application.Common.Security;

public static class DocumentMask
{
    public static string? Mask(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var normalized = value.Trim();
        if (normalized.Length <= 6)
        {
            return new string('*', normalized.Length);
        }

        return normalized[..6] + new string('*', normalized.Length - 6);
    }
}