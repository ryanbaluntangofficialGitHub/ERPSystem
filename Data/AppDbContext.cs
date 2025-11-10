using Microsoft.EntityFrameworkCore;
using ERPSystem.Models;

namespace ERPSystem.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        // Authentication & System
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }

        // Sales Module
        public DbSet<SalesOrder> SalesOrders { get; set; }

        // Purchasing Module
        public DbSet<PurchaseRequest> PurchaseRequests { get; set; }
        public DbSet<PurchaseRequestItem> PurchaseRequestItems { get; set; }
        public DbSet<Canvassing> Canvassings { get; set; }
        public DbSet<CanvassingItem> CanvassingItems { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseOrderItem> PurchaseOrderItems { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }

        // Warehouse Module
        public DbSet<GoodsReceipt> GoodsReceipts { get; set; }
        public DbSet<GoodsReceiptItem> GoodsReceiptItems { get; set; }
        public DbSet<Warehouse> Warehouses { get; set; }

        // HR Module
        public DbSet<Employee> Employees { get; set; }
        public DbSet<Department> Departments { get; set; }

        // Production/Inventory Module
        public DbSet<Product> Products { get; set; }

        // Accounting Module
        public DbSet<Expense> Expenses { get; set; }

        // System
        public DbSet<EmailLog> EmailLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ===== RELATIONSHIPS =====

            // Purchase Request -> Purchase Request Items
            modelBuilder.Entity<PurchaseRequest>()
                .HasMany(pr => pr.Items)
                .WithOne(pri => pri.PurchaseRequest)
                .HasForeignKey(pri => pri.PurchaseRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            // Canvassing -> Canvassing Items
            modelBuilder.Entity<Canvassing>()
                .HasMany(c => c.Items)
                .WithOne(ci => ci.Canvassing)
                .HasForeignKey(ci => ci.CanvassingId)
                .OnDelete(DeleteBehavior.Cascade);

            // Purchase Order -> Purchase Order Items
            modelBuilder.Entity<PurchaseOrder>()
                .HasMany(po => po.Items)
                .WithOne(poi => poi.PurchaseOrder)
                .HasForeignKey(poi => poi.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Cascade);

            // Purchase Order -> Goods Receipts (NO CASCADE - prevent cycle)
            modelBuilder.Entity<PurchaseOrder>()
                .HasMany(po => po.GoodsReceipts)
                .WithOne(gr => gr.PurchaseOrder)
                .HasForeignKey(gr => gr.PurchaseOrderId)
                .OnDelete(DeleteBehavior.Restrict);

            // Goods Receipt -> Goods Receipt Items
            modelBuilder.Entity<GoodsReceipt>()
                .HasMany(gr => gr.Items)
                .WithOne(gri => gri.GoodsReceipt)
                .HasForeignKey(gri => gri.GoodsReceiptId)
                .OnDelete(DeleteBehavior.Cascade);

            // Goods Receipt Item -> Purchase Order Item (NO CASCADE - prevent cycle)
            modelBuilder.Entity<GoodsReceiptItem>()
                .HasOne(gri => gri.PurchaseOrderItem)
                .WithMany()
                .HasForeignKey(gri => gri.PurchaseOrderItemId)
                .OnDelete(DeleteBehavior.Restrict);

            // Goods Receipt Item -> Product (NO CASCADE - prevent cycle)
            modelBuilder.Entity<GoodsReceiptItem>()
                .HasOne(gri => gri.Product)
                .WithMany()
                .HasForeignKey(gri => gri.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            // Employee -> Department
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.DepartmentNav)
                .WithMany()
                .HasForeignKey(e => e.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            // ===== DECIMAL PRECISION CONFIGURATIONS =====

            // Purchase Request Item
            modelBuilder.Entity<PurchaseRequestItem>()
                .Property(p => p.Quantity).HasPrecision(18, 2);
            modelBuilder.Entity<PurchaseRequestItem>()
                .Property(p => p.EstimatedPrice).HasPrecision(18, 2);

            // Canvassing Item
            modelBuilder.Entity<CanvassingItem>()
                .Property(p => p.Quantity).HasPrecision(18, 2);
            modelBuilder.Entity<CanvassingItem>()
                .Property(p => p.UnitPrice).HasPrecision(18, 2);
            modelBuilder.Entity<CanvassingItem>()
                .Property(p => p.TotalPrice).HasPrecision(18, 2);

            // Purchase Order
            modelBuilder.Entity<PurchaseOrder>()
                .Property(p => p.SubTotal).HasPrecision(18, 2);
            modelBuilder.Entity<PurchaseOrder>()
                .Property(p => p.TaxAmount).HasPrecision(18, 2);
            modelBuilder.Entity<PurchaseOrder>()
                .Property(p => p.DiscountAmount).HasPrecision(18, 2);
            modelBuilder.Entity<PurchaseOrder>()
                .Property(p => p.ShippingAmount).HasPrecision(18, 2);
            modelBuilder.Entity<PurchaseOrder>()
                .Property(p => p.TotalAmount).HasPrecision(18, 2);

            // Purchase Order Item
            modelBuilder.Entity<PurchaseOrderItem>()
                .Property(p => p.Quantity).HasPrecision(18, 2);
            modelBuilder.Entity<PurchaseOrderItem>()
                .Property(p => p.ReceivedQuantity).HasPrecision(18, 2);
            modelBuilder.Entity<PurchaseOrderItem>()
                .Property(p => p.UnitPrice).HasPrecision(18, 2);
            modelBuilder.Entity<PurchaseOrderItem>()
                .Property(p => p.DiscountPercent).HasPrecision(5, 2);
            modelBuilder.Entity<PurchaseOrderItem>()
                .Property(p => p.DiscountAmount).HasPrecision(18, 2);
            modelBuilder.Entity<PurchaseOrderItem>()
                .Property(p => p.TaxPercent).HasPrecision(5, 2);
            modelBuilder.Entity<PurchaseOrderItem>()
                .Property(p => p.TaxAmount).HasPrecision(18, 2);
            modelBuilder.Entity<PurchaseOrderItem>()
                .Property(p => p.LineTotal).HasPrecision(18, 2);

            // Goods Receipt Item
            modelBuilder.Entity<GoodsReceiptItem>()
                .Property(p => p.OrderedQuantity).HasPrecision(18, 2);
            modelBuilder.Entity<GoodsReceiptItem>()
                .Property(p => p.ReceivedQuantity).HasPrecision(18, 2);
            modelBuilder.Entity<GoodsReceiptItem>()
                .Property(p => p.RejectedQuantity).HasPrecision(18, 2);
            modelBuilder.Entity<GoodsReceiptItem>()
                .Property(p => p.UnitPrice).HasPrecision(18, 2);

            // Product
            modelBuilder.Entity<Product>()
                .Property(p => p.Price).HasPrecision(18, 2);

            // Sales Order
            modelBuilder.Entity<SalesOrder>()
                .Property(p => p.TotalAmount).HasPrecision(18, 2);

            // Expense
            modelBuilder.Entity<Expense>()
                .Property(p => p.Amount).HasPrecision(18, 2);

            // ===== UNIQUE CONSTRAINTS =====

            // Ensure unique codes
            modelBuilder.Entity<Supplier>()
                .HasIndex(s => s.SupplierCode)
                .IsUnique();

            modelBuilder.Entity<Product>()
                .HasIndex(p => p.ProductCode)
                .IsUnique();

            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.EmployeeCode)
                .IsUnique();

            modelBuilder.Entity<Warehouse>()
                .HasIndex(w => w.WarehouseCode)
                .IsUnique();
        }
    }
}