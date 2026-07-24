using System;
using System.Threading.Tasks;
using PayOS;

class Program
{
    static async Task Main()
    {
        var payOS = new PayOSClient(
            "3d906be1-e4ec-42eb-9235-65e5a849c5c5",
            "2527c999-a143-44a9-aece-fe85ee386c20",
            "b1f064204fc3d0cc63322f230176b876307c207d8621b8acf399e4d17dc7dfa3"
        );

        long[] orderCodes = { 45260723073349, 45260723072635, 45260723070822 };

        foreach (var code in orderCodes)
        {
            try
            {
                var response = await payOS.PaymentRequests.GetAsync(code);
                Console.WriteLine($"OrderCode: {code}");
                Console.WriteLine($"  Status: {response.Status}");
                Console.WriteLine($"  Amount: {response.Amount}");
                Console.WriteLine($"  AmountPaid: {response.AmountPaid}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"OrderCode: {code} -> Error: {ex.Message}");
            }
        }
    }
}
