using System;
using System.Reflection;
using PayOS;
using PayOS.Resources.V1.Payouts;

class Program
{
    static void Main()
    {
        var method = typeof(Payouts).GetMethod("CreateAsync");
        if (method != null)
        {
            Console.WriteLine($"Method: {method.Name}");
            foreach (var p in method.GetParameters())
            {
                Console.WriteLine($"  Parameter: {p.Name}, Type: {p.ParameterType.Name}, HasDefault: {p.HasDefaultValue}, DefaultValue: {p.DefaultValue ?? "null"}");
            }
        }

        var getMethod = typeof(Payouts).GetMethod("GetAsync");
        if (getMethod != null)
        {
            Console.WriteLine($"Method: {getMethod.Name}");
            foreach (var p in getMethod.GetParameters())
            {
                Console.WriteLine($"  Parameter: {p.Name}, Type: {p.ParameterType.Name}, HasDefault: {p.HasDefaultValue}, DefaultValue: {p.DefaultValue ?? "null"}");
            }
        }

        var getBalanceMethod = typeof(PayOS.Resources.V1.PayoutsAccount.PayoutsAccount).GetMethod("GetBalanceAsync");
        if (getBalanceMethod != null)
        {
            Console.WriteLine($"Method: {getBalanceMethod.Name}");
            foreach (var p in getBalanceMethod.GetParameters())
            {
                Console.WriteLine($"  Parameter: {p.Name}, Type: {p.ParameterType.Name}, HasDefault: {p.HasDefaultValue}, DefaultValue: {p.DefaultValue ?? "null"}");
            }
        }
    }
}
