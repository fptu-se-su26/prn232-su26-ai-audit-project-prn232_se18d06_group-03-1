namespace MoveVN.Application.Common.Helpers;

public static class BankBinResolver
{
    private static readonly Dictionary<string, string> BankNameToBin = new(StringComparer.OrdinalIgnoreCase)
    {
        { "vcb", "970436" }, { "vietcombank", "970436" },
        { "bidv", "970418" },
        { "icb", "970415" }, { "vietinbank", "970415" }, { "ctg", "970415" },
        { "vba", "970405" }, { "agribank", "970405" }, { "agr", "970405" },
        { "mb", "970422" }, { "mb bank", "970422" }, { "mbbank", "970422" },
        { "tcb", "970407" }, { "techcombank", "970407" },
        { "acb", "970416" },
        { "vpb", "970432" }, { "vpbank", "970432" },
        { "tpb", "970423" }, { "tpbank", "970423" },
        { "stb", "970403" }, { "sacombank", "970403" },
        { "hdb", "970437" }, { "hdbank", "970437" },
        { "shb", "970443" },
        { "vib", "970441" },
        { "lpb", "970449" }, { "lienVietPostBank", "970449" },
        { "msb", "970426" },
        { "scb", "970429" },
        { "ocb", "970448" },
        { "seab", "970440" }, { "seabank", "970440" }, { "ssb", "970440" },
        { "klb", "970452" }, { "kienlongbank", "970452" },
        { "abb", "970425" }, { "abbank", "970425" },
        { "vab", "970427" }, { "vietabank", "970427" },
        { "nab", "970428" }, { "namabank", "970428" },
        { "pvcb", "970412" }, { "pvcombank", "970412" },
        { "eib", "970431" }, { "eximbank", "970431" },
        { "bab", "970409" }, { "bac a bank", "970409" },
        { "vrb", "970421" },
        { "cimb", "422589" },
        { "hsbc", "458761" },
        { "bvb", "970438" },
        { "ncb", "970419" },
        { "sgb", "970400" }, { "saigonbank", "970400" }, { "sgicb", "970400" },
    };

    public static string Resolve(string? bankBin, string? bankName)
    {
        if (!string.IsNullOrWhiteSpace(bankBin) && System.Text.RegularExpressions.Regex.IsMatch(bankBin, @"^\d{6}$"))
            return bankBin;

        if (!string.IsNullOrWhiteSpace(bankBin))
        {
            var binUpper = bankBin.Trim().ToUpperInvariant();
            foreach (var kv in BankNameToBin)
            {
                if (binUpper == kv.Key.ToUpperInvariant())
                    return kv.Value;
            }
        }

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
