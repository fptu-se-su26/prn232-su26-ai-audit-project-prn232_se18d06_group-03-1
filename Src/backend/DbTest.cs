using System;
using Microsoft.EntityFrameworkCore;
using MoveVN.Infrastructure.Persistence;
using Microsoft.Extensions.Configuration;

class Program
{
    static void Main()
    {
        var builder = new ConfigurationBuilder().AddEnvironmentVariables();
        var config = builder.Build();
        
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseNpgsql("Host=aws-1-ap-southeast-1.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.lpvalzjyksmvtplwusqq;Password=Movevnfpt@123456");
        
        using var context = new AppDbContext(optionsBuilder.Options);
        
        try
        {
            var canConnect = context.Database.CanConnect();
            Console.WriteLine("Can Connect: " + canConnect);
            
            var cmd = context.Database.GetDbConnection().CreateCommand();
            cmd.CommandText = "SELECT count(*) FROM \"Wallets\"";
            context.Database.OpenConnection();
            var count = cmd.ExecuteScalar();
            Console.WriteLine("Wallets count: " + count);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error: " + ex.Message);
        }
    }
}
