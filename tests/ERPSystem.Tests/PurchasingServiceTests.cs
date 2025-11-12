using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ERPSystem.Data;
using ERPSystem.Services;
using ERPSystem.Models;
using Microsoft.Extensions.Logging.Abstractions;

namespace ERPSystem.Tests
{
    public class PurchasingServiceTests : IDisposable
    {
        private readonly AppDbContext _db;
        private readonly PurchasingService _service;

        public PurchasingServiceTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _db = new AppDbContext(options);

            // Seed minimal data
            var supplier = new Supplier { Id = 1, SupplierCode = "S1", SupplierName = "Sup1", CompanyId = 1, CreatedDate = DateTime.UtcNow };
            _db.Suppliers.Add(supplier);

            var product = new Product { Id = 1, ProductCode = "P1", Name = "Prod1", CompanyId = 1, Price = 10, Quantity = 0, CreatedDate = DateTime.UtcNow };
            _db.Products.Add(product);

            var po = new PurchaseOrder
            {
                CompanyId = 1,
                Id = 1,
                PONumber = "PO1",
                SupplierId = supplier.Id,
                OrderDate = DateTime.UtcNow,
                Status = "Confirmed",
                SubTotal = 100,
                TotalAmount = 100,
                CreatedDate = DateTime.UtcNow,
                CreatedBy = 1
            };
            var poi = new PurchaseOrderItem { Id = 1, PurchaseOrderId = po.Id, ProductId = product.Id, Quantity = 10, ReceivedQuantity = 0, UnitPrice = 10, LineTotal = 100 };
            po.Items.Add(poi);
            _db.PurchaseOrders.Add(po);

            _db.SaveChanges();

            _service = new PurchasingService(_db, new NullLogger<PurchasingService>());
        }

        [Fact]
        public async Task CreateGoodsReceipt_Updates_PO_ItemReceivedQuantities_And_ProductQty_OnApprove()
        {
            // Arrange
            var gr = new GoodsReceipt
            {
                CompanyId = 1,
                PurchaseOrderId = 1,
                Items = {
                    new GoodsReceiptItem { Id = 1, PurchaseOrderItemId = 1, ProductId = 1, OrderedQuantity = 10, ReceivedQuantity = 10, UnitPrice = 10 }
                }
            };

            // Act: create GR
            var created = await _service.CreateGoodsReceiptAsync(gr, 2);

            // Assert PO item received quantity updated
            var poItem = await _db.PurchaseOrderItems.FirstOrDefaultAsync(i => i.Id == 1);
            Assert.NotNull(poItem);
            Assert.Equal(10m, poItem.ReceivedQuantity);

            // Approve GR and check product quantity
            await _service.ApproveGoodsReceiptAsync(created.Id, 3);
            var prod = await _db.Products.FirstOrDefaultAsync(p => p.Id == 1);
            Assert.NotNull(prod);
            Assert.Equal(10, prod.Quantity);
        }

        public void Dispose()
        {
            _db.Dispose();
        }
    }
}