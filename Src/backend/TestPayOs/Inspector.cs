using System;
using System.Reflection;
using PayOS.Models.V1.Payouts;

class Program {
    static void Main() {
        Console.WriteLine("=== PayoutRequest Properties ===");
        foreach (var p in typeof(PayoutRequest).GetProperties()) {
            Console.WriteLine($"  {p.Name}: {p.PropertyType.Name}");
        }
        
        Console.WriteLine("\n=== PayoutAccountInfo Properties ===");
        var payoutAccountInfoType = Type.GetType("PayOS.Models.V1.PayoutsAccount.PayoutAccountInfo, PayOS");
        if (payoutAccountInfoType != null) {
            foreach (var p in payoutAccountInfoType.GetProperties()) {
                Console.WriteLine($"  {p.Name}: {p.PropertyType.Name}");
            }
        }
        
        Console.WriteLine("\n=== Payout Properties ===");
        foreach (var p in typeof(Payout).GetProperties()) {
            Console.WriteLine($"  {p.Name}: {p.PropertyType.Name}");
        }
    }
}
