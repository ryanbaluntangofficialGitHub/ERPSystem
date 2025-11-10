using ERPSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace ERPSystem.Data
{
    public static class DbInitializer
    {
        public static void Initialize(AppDbContext context)
        {
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

            // Check if we need to migrate old passwords
            var users = context.Users.Include(u => u.Role).ToList();
            if (users.Any())
            {
                var firstUser = users.First();
                // Check if using old SHA256 hash (base64, length ~44) vs BCrypt (starts with $2, length ~60)
                if (!firstUser.PasswordHash.StartsWith("$2"))
                {
                    Console.WriteLine("Migrating passwords to BCrypt...");

                    foreach (var user in users)
                    {
                        // Update passwords based on role
                        string newPassword = user.Role?.Name switch
                        {
                            "Admin" => "Admin@123!",
                            "Sales" => "Sales@123!",
                            "Purchase" => "Purchase@123!",
                            "HR" => "HR@123!",
                            "Accounting" => "Accounting@123!",
                            "Production" => "Production@123!",
                            _ => "Default@123!"
                        };

                        // Update username to be more professional (if needed)
                        if (user.Username == "sales") user.Username = "sales_user";
                        else if (user.Username == "purchase") user.Username = "purchase_user";
                        else if (user.Username == "hr") user.Username = "hr_user";
                        else if (user.Username == "accounting") user.Username = "accounting_user";
                        else if (user.Username == "production") user.Username = "production_user";

                        // Hash with BCrypt
                        user.PasswordHash = HashPassword(newPassword);
                    }

                    context.SaveChanges();
                    Console.WriteLine("Password migration complete!");
                }
            }
            else
            {
                // Seed Users for all roles with strong passwords
                var roles = context.Roles.ToList();

                context.Users.AddRange(
                    new User
                    {
                        Username = "admin",
                        PasswordHash = HashPassword("Admin@123!"),
                        RoleId = roles.First(r => r.Name == "Admin").Id
                    },
                    new User
                    {
                        Username = "sales_user",
                        PasswordHash = HashPassword("Sales@123!"),
                        RoleId = roles.First(r => r.Name == "Sales").Id
                    },
                    new User
                    {
                        Username = "hr_user",
                        PasswordHash = HashPassword("HR@123!"),
                        RoleId = roles.First(r => r.Name == "HR").Id
                    },
                    new User
                    {
                        Username = "purchase_user",
                        PasswordHash = HashPassword("Purchase@123!"),
                        RoleId = roles.First(r => r.Name == "Purchase").Id
                    },
                    new User
                    {
                        Username = "accounting_user",
                        PasswordHash = HashPassword("Accounting@123!"),
                        RoleId = roles.First(r => r.Name == "Accounting").Id
                    },
                    new User
                    {
                        Username = "production_user",
                        PasswordHash = HashPassword("Production@123!"),
                        RoleId = roles.First(r => r.Name == "Production").Id
                    }
                );
                context.SaveChanges();
            }

            // Seed sample data for testing
            if (!context.SalesOrders.Any())
            {
                context.SalesOrders.AddRange(
                    new SalesOrder
                    {
                        CustomerName = "ABC Corporation",
                        SaleDate = DateTime.UtcNow.AddDays(-5),
                        TotalAmount = 15000.00m
                    },
                    new SalesOrder
                    {
                        CustomerName = "XYZ Industries",
                        SaleDate = DateTime.UtcNow.AddDays(-2),
                        TotalAmount = 25000.00m
                    },
                    new SalesOrder
                    {
                        CustomerName = "Tech Solutions Ltd",
                        SaleDate = DateTime.UtcNow.AddDays(-1),
                        TotalAmount = 35000.00m
                    }
                );
                context.SaveChanges();
            }

            if (!context.PurchaseOrders.Any())
            {
                var supplier = context.Suppliers.FirstOrDefault();
                if (supplier != null)
                {
                    context.PurchaseOrders.AddRange(
                        new PurchaseOrder
                        {
                            CompanyId = 1,
                            PONumber = "PO20250101",
                            SupplierId = supplier.Id,
                            OrderDate = DateTime.UtcNow.AddDays(-3),
                            Status = "Confirmed",
                            SubTotal = 8000.00m,
                            TaxAmount = 0,
                            DiscountAmount = 0,
                            ShippingAmount = 0,
                            TotalAmount = 8000.00m,
                            CreatedDate = DateTime.UtcNow,
                            CreatedBy = 1
                        }
                    );
                    context.SaveChanges();
                }
            }

            if (!context.Employees.Any())
            {
                context.Employees.AddRange(
                    new Employee
                    {
                        Name = "John Doe",
                        Position = "Software Engineer",
                        Department = "IT",
                        Email = "john.doe@company.com",
                        Phone = "+1234567890",
                        HireDate = DateTime.UtcNow.AddYears(-2),
                        IsActive = true
                    },
                    new Employee
                    {
                        Name = "Jane Smith",
                        Position = "HR Manager",
                        Department = "Human Resources",
                        Email = "jane.smith@company.com",
                        Phone = "+1234567891",
                        HireDate = DateTime.UtcNow.AddYears(-3),
                        IsActive = true
                    },
                    new Employee
                    {
                        Name = "Mike Johnson",
                        Position = "Sales Representative",
                        Department = "Sales",
                        Email = "mike.johnson@company.com",
                        Phone = "+1234567892",
                        HireDate = DateTime.UtcNow.AddYears(-1),
                        IsActive = true
                    },
                    new Employee
                    {
                        Name = "Sarah Williams",
                        Position = "Accountant",
                        Department = "Accounting",
                        Email = "sarah.williams@company.com",
                        Phone = "+1234567893",
                        HireDate = DateTime.UtcNow.AddMonths(-6),
                        IsActive = true
                    }
                );
                context.SaveChanges();
            }

            if (!context.Products.Any())
            {
                context.Products.AddRange(
                    new Product
                    {
                        Name = "Widget A",
                        Quantity = 100,
                        Price = 50.00m
                    },
                    new Product
                    {
                        Name = "Widget B",
                        Quantity = 250,
                        Price = 75.00m
                    },
                    new Product
                    {
                        Name = "Component C",
                        Quantity = 500,
                        Price = 25.00m
                    }
                );
                context.SaveChanges();
            }

            if (!context.Expenses.Any())
            {
                context.Expenses.AddRange(
                    new Expense
                    {
                        Description = "Office Rent",
                        Amount = 5000.00m,
                        Date = DateTime.UtcNow.AddDays(-10)
                    },
                    new Expense
                    {
                        Description = "Utilities",
                        Amount = 800.00m,
                        Date = DateTime.UtcNow.AddDays(-8)
                    },
                    new Expense
                    {
                        Description = "Marketing Campaign",
                        Amount = 3000.00m,
                        Date = DateTime.UtcNow.AddDays(-4)
                    }
                );
                context.SaveChanges();
            }

            if (!context.Departments.Any())
            {
                context.Departments.AddRange(
                    new Department
                    {
                        DepartmentName = "IT Department",
                        Description = "Information Technology",
                        CompanyId = 1,
                        IsActive = true,
                        CreatedDate = DateTime.UtcNow
                    },
                    new Department
                    {
                        DepartmentName = "Sales Department",
                        Description = "Sales and Marketing",
                        CompanyId = 1,
                        IsActive = true,
                        CreatedDate = DateTime.UtcNow
                    },
                    new Department
                    {
                        DepartmentName = "Operations",
                        Description = "Operations and Production",
                        CompanyId = 1,
                        IsActive = true,
                        CreatedDate = DateTime.UtcNow
                    }
                );
                context.SaveChanges();
            }

            if (!context.Suppliers.Any())
            {
                context.Suppliers.AddRange(
                    new Supplier
                    {
                        SupplierCode = "SUP001",
                        SupplierName = "Tech Supplies Inc.",
                        ContactPerson = "John Supplier",
                        Email = "john@techsupplies.com",
                        Phone = "+1234567890",
                        Address = "123 Supply Street",
                        City = "Tech City",
                        State = "CA",
                        Country = "USA",
                        PostalCode = "12345",
                        PaymentTerms = 30,
                        SupplierType = "Material",
                        IsActive = true,
                        CompanyId = 1,
                        CreatedDate = DateTime.UtcNow,
                        CreatedBy = 1
                    },
                    new Supplier
                    {
                        SupplierCode = "SUP002",
                        SupplierName = "Office Solutions Ltd",
                        ContactPerson = "Sarah Office",
                        Email = "sarah@officesolutions.com",
                        Phone = "+1234567891",
                        Address = "456 Office Ave",
                        City = "Business City",
                        State = "NY",
                        Country = "USA",
                        PostalCode = "54321",
                        PaymentTerms = 45,
                        SupplierType = "Both",
                        IsActive = true,
                        CompanyId = 1,
                        CreatedDate = DateTime.UtcNow,
                        CreatedBy = 1
                    },
                    new Supplier
                    {
                        SupplierCode = "SUP003",
                        SupplierName = "Industrial Materials Co.",
                        ContactPerson = "Mike Materials",
                        Email = "mike@industrial.com",
                        Phone = "+1234567892",
                        Address = "789 Industrial Blvd",
                        City = "Factory Town",
                        State = "TX",
                        Country = "USA",
                        PostalCode = "67890",
                        PaymentTerms = 60,
                        SupplierType = "Material",
                        IsActive = true,
                        CompanyId = 1,
                        CreatedDate = DateTime.UtcNow,
                        CreatedBy = 1
                    }
                );
                context.SaveChanges();
            }

            // Seed Warehouses
            if (!context.Warehouses.Any())
            {
                context.Warehouses.AddRange(
                    new Warehouse
                    {
                        WarehouseCode = "WH001",
                        WarehouseName = "Main Warehouse",
                        Address = "100 Warehouse Drive",
                        City = "Storage City",
                        State = "CA",
                        Country = "USA",
                        PostalCode = "11111",
                        IsActive = true,
                        CompanyId = 1,
                        CreatedDate = DateTime.UtcNow
                    },
                    new Warehouse
                    {
                        WarehouseCode = "WH002",
                        WarehouseName = "Secondary Storage",
                        Address = "200 Storage Lane",
                        City = "Depot Town",
                        State = "NY",
                        Country = "USA",
                        PostalCode = "22222",
                        IsActive = true,
                        CompanyId = 1,
                        CreatedDate = DateTime.UtcNow
                    }
                );
                context.SaveChanges();
            }

            // Seed Sample Purchase Requests
            if (!context.PurchaseRequests.Any())
            {
                var dept = context.Departments.First();
                var pr = new PurchaseRequest
                {
                    RequestNumber = "PR20250101",
                    RequestDate = DateTime.UtcNow.AddDays(-5),
                    DepartmentId = dept.Id,
                    RequestedBy = 1,
                    Priority = "High",
                    RequiredDate = DateTime.UtcNow.AddDays(15),
                    Status = "Approved",
                    ApprovedBy = 1,
                    ApprovalDate = DateTime.UtcNow.AddDays(-3),
                    Notes = "Urgent supplies needed for Q1",
                    CompanyId = 1,
                    CreatedDate = DateTime.UtcNow.AddDays(-5),
                    CreatedBy = 1
                };

                var product1 = context.Products.First();
                pr.Items.Add(new PurchaseRequestItem
                {
                    ProductId = product1.Id,
                    Description = product1.Name,
                    Quantity = 50,
                    EstimatedPrice = 50.00m,
                    Purpose = "Production materials"
                });

                context.PurchaseRequests.Add(pr);
                context.SaveChanges();
            }
        }

        // Use BCrypt for secure password hashing
        public static string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password, BCrypt.Net.BCrypt.GenerateSalt(12));
        }

        // Verify password against hash
        public static bool VerifyPassword(string password, string hash)
        {
            return BCrypt.Net.BCrypt.Verify(password, hash);
        }
    }
}