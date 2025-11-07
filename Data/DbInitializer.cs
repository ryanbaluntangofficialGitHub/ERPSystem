using ERPSystem.Models;
using System.Security.Cryptography;

namespace ERPSystem.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
            // Ensure the database is created
            context.Database.EnsureCreated();

            // Seed Roles
            if (!context.Roles.Any())
            {
                context.Roles.AddRange(
                    new Role { Name = "Admin" },
                    new Role { Name = "HR" },
                    new Role { Name = "Sales" },
                    new Role { Name = "Purchase" },
                    new Role { Name = "Accounting" },
                    new Role { Name = "Production" }
                );
                context.SaveChanges();
            }

            // Seed Admin User
            if (!context.Users.Any())
            {
                var adminRole = context.Roles.First(r => r.Name == "Admin");

                context.Users.Add(new User
                {
                    Username = "admin",
                    PasswordHash = HashPassword("password123"), // hashed password
                    RoleId = adminRole.Id
                });

                context.SaveChanges();
            }
        }

        // Hash password using SHA256
        public static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = System.Text.Encoding.UTF8.GetBytes(password);
            var hash = sha256.ComputeHash(bytes);
            return Convert.ToBase64String(hash);
        }
    }
}
