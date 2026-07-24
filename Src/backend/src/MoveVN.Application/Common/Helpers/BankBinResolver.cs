namespace MoveVN.Application.Common.Helpers;

public static class BankBinResolver
{
    private static readonly Dictionary<string, string> BankNameToBin = new(StringComparer.OrdinalIgnoreCase)
    {
        { "bidv", "970418" },
        { "vietcombank", "970432" },
        { "vcb", "970432" },
        { "vietinbank", "970435" },
        { "ctg", "970435" },
        { "agribank", "970405" },
        { "agr", "970405" },
        { "mb bank", "970422" },
        { "mbbank", "970422" },
        { "mb ", "970422" },
        { "techcombank", "970457" },
        { "tcb", "970457" },
        { "acb", "970429" },
        { "vpbank", "970432" },
        { "vpb", "970432" },
        { "hdbank", "970437" },
        { "hdb", "970437" },
        { "sacombank", "970403" },
        { "stb", "970403" },
        { "shb", "970443" },
        { "vib", "970441" },
        { "lienVietPostBank", "970449" },
        { "lpb", "970449" },
        { "msb", "970426" },
        { "tpbank", "970431" },
        { "tpb", "970431" },
        { "scb", "970429" },
        { "ocb", "970448" },
        { "seabank", "970440" },
        { "ssb", "970440" },
        { "kienlongbank", "970452" },
        { "klb", "970452" },
        { "pvcombank", "970412" },
        { "pvb", "970412" },
        { "vietabank", "970454" },
        { "baocomBank", "970438" },
        { "ncb", "970441" },
        { "vietbank", "970433" },
        { "gpbank", "970408" },
        { "namabank", "970459" },
    };

    public static string Resolve(string? bankBin, string? bankName)
    {
        if (!string.IsNullOrWhiteSpace(bankBin))
            return bankBin;

        if (string.IsNullOrWhiteSpace(bankName))
            return "";

        var nameLower = bankName.ToLowerInvariant();
        foreach (var kv in BankNameToBin)
        {
            if (nameLower.Contains(kv.Key))
                return kv.Value;
        }
        return "";
    }
}
