using System;
using Microsoft.EntityFrameworkCore;
using MoveVN.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;

class Program
{
    static void Main()
    {
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql("Host=aws-1-ap-southeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.lpvalzjyksmvtplwusqq;Password=Movevnfpt@123456;SSL Mode=Require;Trust Server Certificate=true");
        
        using var context = new AppDbContext(optionsBuilder.Options);
        
        try
        {
            Console.WriteLine("--- RECENT BOOKINGS ---");
            foreach (var b in context.Bookings.OrderByDescending(b => b.Id).Take(5).ToList())
            {
                Console.WriteLine($"ID: {b.Id}, Code: {b.BookingCode}, Status: {b.Status}, Deposit: {b.DepositAmount}, OwnerId: {b.OwnerId}");
            }

            Console.WriteLine("\n--- RECENT PAYMENTS ---");
            foreach (var p in context.Payments.OrderByDescending(p => p.Id).Take(5).ToList())
            {
                Console.WriteLine($"ID: {p.Id}, BookingId: {p.BookingId}, Status: {p.Status}, Amount: {p.Amount}, OrderCode: {p.OrderCode}");
            }

            Console.WriteLine("\n--- WALLETS ---");
            foreach (var w in context.Wallets.ToList())
            {
                Console.WriteLine($"ID: {w.Id}, UserId: {w.UserId}, Balance: {w.Balance}");
            }

            Console.WriteLine("\n--- WALLET TRANSACTIONS ---");
            foreach (var tx in context.WalletTransactions.OrderByDescending(tx => tx.Id).Take(5).ToList())
            {
                Console.WriteLine($"ID: {tx.Id}, WalletId: {tx.WalletId}, Type: {tx.Type}, Amount: {tx.Amount}, BalanceAfter: {tx.BalanceAfter}, Note: {tx.Note}");
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error: " + ex.Message + "\n" + ex.StackTrace);
        }
    }
}
