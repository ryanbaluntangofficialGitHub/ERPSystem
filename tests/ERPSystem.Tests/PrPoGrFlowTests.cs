using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using ERPSystem.Data;
using ERPSystem.Models;
using ERPSystem.Services;
using Microsoft.AspNetCore.Mvc;

namespace ERPSystem.Tests
{
    public class PrPoGrFlowTests : IDisposable
    {
        private readonly AppDbContext _db;
        private readonly PurchasingService _service;

        public PrPoGrFlowTests()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            _db = new AppDbContext(options);

            // Seed product and supplier
            var supplier = new Supplier { SupplierCode = "SUP1", SupplierName = "Acme Corp", CompanyId = 1, CreatedDate = DateTime.UtcNow, CreatedBy = 1 };
            _db.Suppliers.Add(supplier);

            var product = new Product { ProductCode = "PRD1", Name = "Widget", CompanyId = 1, Price = 5m, Quantity = 0, CreatedDate = DateTime.UtcNow, CreatedBy = 1 };
            _db.Products.Add(product);

            _db.SaveChanges();

            _service = new PurchasingService(_db, new NullLogger<PurchasingService>());
        }

        [Fact]
        public async Task PurchaseRequest_ConvertedToPO_then_GR_approved_updates_inventory()
        {
            // Arrange: create a purchase request (already approved)
            var pr = new PurchaseRequest
            {
                CompanyId = 1,
                RequestNumber = "PRTEST",
                RequestDate = DateTime.UtcNow,
                Status = "Approved",
                CreatedDate = DateTime.UtcNow,
                CreatedBy = 1
            };
            var prItem = new PurchaseRequestItem
            {
                ProductId = _db.Products.First().Id,
                Description = "Need widgets",
                Quantity = 10,
                EstimatedPrice = 5m
            };
            pr.Items.Add(prItem);
            _db.PurchaseRequests.Add(pr);
            await _db.SaveChangesAsync();

            // Create PO (simulate conversion)
            var po = new PurchaseOrder
            {
                CompanyId = pr.CompanyId,
                PONumber = await _service.GeneratePONumberAsync(),
                PurchaseRequestId = pr.Id,
                SupplierId = _db.Suppliers.First().Id,
                OrderDate = DateTime.UtcNow,
                RequiredDate = pr.RequiredDate,
                Status = "Confirmed", // directly confirm for receive
                CreatedDate = DateTime.UtcNow,
                CreatedBy = 2
            };

            var poItem = new PurchaseOrderItem
            {
                ProductId = prItem.ProductId ?? 0,
                Quantity = prItem.Quantity,
                UnitPrice = prItem.EstimatedPrice,
                LineTotal = prItem.Quantity * prItem.EstimatedPrice
            };
            po.Items.Add(poItem);
            po.SubTotal = po.Items.Sum(i => i.LineTotal);
            po.TotalAmount = po.SubTotal;

            _db.PurchaseOrders.Add(po);
            await _db.SaveChangesAsync();

            // Create goods receipt for PO
            var createdGr = await _service.CreateGoodsReceiptAsync(new GoodsReceipt
            {
                CompanyId = po.CompanyId,
                PurchaseOrderId = po.Id,
                Items = { new GoodsReceiptItem { PurchaseOrderItemId = poItem.Id, ProductId = poItem.ProductId, OrderedQuantity = poItem.Quantity, ReceivedQuantity = poItem.Quantity, UnitPrice = poItem.UnitPrice } }
            }, 3);

            Assert.NotNull(createdGr);

            // Approve GR => inventory updated
            await _service.ApproveGoodsReceiptAsync(createdGr.Id, 4);

            var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == poItem.ProductId);
            Assert.NotNull(product);
            Assert.Equal((int)poItem.Quantity, product.Quantity);

            // PO item received quantity should be updated
            var updatedPoItem = await _db.PurchaseOrderItems.FirstOrDefaultAsync(i => i.Id == poItem.Id);
            Assert.NotNull(updatedPoItem);
            Assert.Equal(poItem.Quantity, updatedPoItem.ReceivedQuantity);
        }

        [Fact]
        public async Task PurchaseRequestController_Create_InvalidModel_ReturnsBadRequest()
        {
            // Use controller Create with invalid model state (ModelState error)
            var controller = new Controllers.PurchaseRequestController(_db, new NullLogger<Controllers.PurchaseRequestController>(), _service);
            controller.ModelState.AddModelError("CompanyId", "Required");

            var badDto = new DTOs.PurchaseRequestCreateDto();

            var result = await controller.Create(badDto) as BadRequestObjectResult;
            Assert.NotNull(result);
        }

        public void Dispose()
        {
            _db.Dispose();
        }
    }
}
