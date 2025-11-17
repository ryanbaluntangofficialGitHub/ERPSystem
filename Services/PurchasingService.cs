using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.Extensions.Logging;
using ERPSystem.Data;
using ERPSystem.Models;
using ERPSystem.Services;

namespace ERPSystem.Services
{
    public class PurchasingService
    {
        private readonly AppDbContext _db;
        private readonly ILogger<PurchasingService> _logger;
        private readonly IEmailSender? _emailSender;
        private readonly CodeGenerator _codeGenerator;

        public PurchasingService(AppDbContext db, ILogger<PurchasingService> logger, IEmailSender? emailSender = null, CodeGenerator? codeGenerator = null)
        {
            _db = db;
            _logger = logger;
            _emailSender = emailSender;
            _codeGenerator = codeGenerator ?? throw new ArgumentNullException(nameof(codeGenerator));
        }

        // Convert completed canvassing to a new PurchaseOrder
        public async Task<PurchaseOrder> ConvertCanvassingToPOAsync(int canvassingId, int userId)
        {
            var canvassing = await _db.Canvassings
                .Include(c => c.Items)
                .Include(c => c.PurchaseRequest)
                .FirstOrDefaultAsync(c => c.Id == canvassingId);

            if (canvassing == null) throw new InvalidOperationException("Canvassing not found.");
            if (canvassing.Status != "Completed") throw new InvalidOperationException("Canvassing must be completed to convert to PO.");
            if (!canvassing.SelectedSupplierId.HasValue) throw new InvalidOperationException("Selected supplier is required.");

            var useTransaction = _db.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory";
            IDbContextTransaction? tx = null;
            try
            {
                if (useTransaction)
                    tx = await _db.Database.BeginTransactionAsync();

                var po = new PurchaseOrder
                {
                    CompanyId = canvassing.CompanyId,
                    PONumber = await GeneratePONumberAsync(),
                    PurchaseRequestId = canvassing.PurchaseRequestId,
                    CanvassingId = canvassing.Id,
                    SupplierId = canvassing.SelectedSupplierId.Value,
                    OrderDate = DateTime.UtcNow,
                    RequiredDate = canvassing.PurchaseRequest?.RequiredDate,
                    Status = "Draft",
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = userId
                };

                decimal subTotal = 0m;
                var selectedItems = canvassing.Items.Where(i => i.IsSelected).ToList();
                foreach (var cItem in selectedItems)
                {
                    var poItem = new PurchaseOrderItem
                    {
                        ProductId = cItem.ProductId ?? 0,
                        Quantity = cItem.Quantity,
                        UnitPrice = cItem.UnitPrice,
                        LineTotal = cItem.TotalPrice
                    };
                    po.Items.Add(poItem);
                    subTotal += cItem.TotalPrice;
                }

                po.SubTotal = subTotal;
                po.TotalAmount = subTotal + po.TaxAmount - po.DiscountAmount + po.ShippingAmount;

                _db.PurchaseOrders.Add(po);

                if (canvassing.PurchaseRequest != null)
                {
                    canvassing.PurchaseRequest.Status = "Converted";
                    canvassing.PurchaseRequest.ModifiedDate = DateTime.UtcNow;
                    canvassing.PurchaseRequest.ModifiedBy = userId;
                }

                await _db.SaveChangesAsync();
                if (tx is not null) await tx.CommitAsync();

                _logger.LogInformation("Converted canvassing {CanvassingId} to PO {PONumber}", canvassingId, po.PONumber);

                // Save audit trail
                await AuditAsync(userId, "ConvertToPO", "Canvassing", canvassingId, $"Converted canvassing {canvassingId} to PO {po.PONumber}");

                return po;
            }
            catch (Exception ex)
            {
                if (tx is not null) await tx.RollbackAsync();
                _logger.LogError(ex, "Error converting canvassing {CanvassingId} to PO", canvassingId);
                throw;
            }
            finally
            {
                if (tx is not null) await tx.DisposeAsync();
            }
        }

        // Create GoodsReceipt and update related PO item received quantities
        public async Task<GoodsReceipt> CreateGoodsReceiptAsync(GoodsReceipt receipt, int userId)
        {
            if (receipt == null) throw new ArgumentNullException(nameof(receipt));

            var po = await _db.PurchaseOrders
                .Include(p => p.Items)
                .FirstOrDefaultAsync(p => p.Id == receipt.PurchaseOrderId);

            if (po == null) throw new InvalidOperationException("Purchase order not found.");
            if (po.Status != "Confirmed" && po.Status != "PartiallyReceived")
                throw new InvalidOperationException("PO must be confirmed before receiving.");

            var useTransaction = _db.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory";
            IDbContextTransaction? tx = null;
            try
            {
                if (useTransaction)
                    tx = await _db.Database.BeginTransactionAsync();

                receipt.GRNumber = await GenerateGRNumberAsync();
                receipt.ReceiptDate = DateTime.UtcNow;
                receipt.ReceivedBy = userId;
                receipt.Status = "Draft";
                receipt.CreatedDate = DateTime.UtcNow;
                receipt.CreatedBy = userId;

                _db.GoodsReceipts.Add(receipt);

                foreach (var grItem in receipt.Items)
                {
                    var poItem = po.Items.FirstOrDefault(i => i.Id == grItem.PurchaseOrderItemId);
                    if (poItem == null) throw new InvalidOperationException($"PO item {grItem.PurchaseOrderItemId} not found.");
                    poItem.ReceivedQuantity += grItem.ReceivedQuantity;
                }

                // Update PO status
                var allReceived = po.Items.All(i => i.ReceivedQuantity >= i.Quantity);
                var anyReceived = po.Items.Any(i => i.ReceivedQuantity > 0);

                po.Status = allReceived ? "Received" : (anyReceived ? "PartiallyReceived" : po.Status);

                await _db.SaveChangesAsync();
                if (tx is not null) await tx.CommitAsync();

                _logger.LogInformation("Created GR {GRNumber} for PO {PONumber}", receipt.GRNumber, po.PONumber);
                return receipt;
            }
            catch (Exception ex)
            {
                if (tx is not null) await tx.RollbackAsync();
                _logger.LogError(ex, "Error creating goods receipt for PO {POId}", receipt.PurchaseOrderId);
                throw;
            }
            finally
            {
                if (tx is not null) await tx.DisposeAsync();
            }
        }

        // Approve GoodsReceipt: set status and update inventory quantities
        public async Task ApproveGoodsReceiptAsync(int goodsReceiptId, int approverUserId)
        {
            var gr = await _db.GoodsReceipts
                .Include(g => g.Items)
                .FirstOrDefaultAsync(g => g.Id == goodsReceiptId);

            if (gr == null) throw new InvalidOperationException("Goods receipt not found.");
            if (gr.Status != "Draft" && gr.Status != "PendingApproval") throw new InvalidOperationException("Only draft/pending receipts can be approved.");

            var useTransaction = _db.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory";
            IDbContextTransaction? tx = null;
            try
            {
                if (useTransaction)
                    tx = await _db.Database.BeginTransactionAsync();

                gr.Status = "Approved";
                gr.ApprovedBy = approverUserId;
                gr.ApprovalDate = DateTime.UtcNow;

                // Update inventory (Product.Quantity) and ensure product exists
                foreach (var item in gr.Items)
                {
                    var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == item.ProductId);
                    if (product != null)
                    {
                        // Increase available stock by received minus rejected
                        var netQty = (int)(item.ReceivedQuantity - item.RejectedQuantity);
                        product.Quantity += Math.Max(0, netQty);
                        product.ModifiedDate = DateTime.UtcNow;
                        product.ModifiedBy = approverUserId;
                    }
                }

                await _db.SaveChangesAsync();
                if (tx is not null) await tx.CommitAsync();

                _logger.LogInformation("Approved goods receipt {Id} and updated inventory", goodsReceiptId);
            }
            catch (Exception ex)
            {
                if (tx is not null) await tx.RollbackAsync();
                _logger.LogError(ex, "Error approving goods receipt {Id}", goodsReceiptId);
                throw;
            }
            finally
            {
                if (tx is not null) await tx.DisposeAsync();
            }
        }

        // Send purchase order to supplier via email and create EmailLog
        public async Task SendPurchaseOrderAsync(int purchaseOrderId, int userId)
        {
            var po = await _db.PurchaseOrders
                .Include(p => p.Supplier)
                .Include(p => p.Items)
                    .ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(p => p.Id == purchaseOrderId);

            if (po == null) throw new InvalidOperationException("Purchase order not found.");
            if (po.Status != "Approved") throw new InvalidOperationException("Only approved POs can be sent.");

            if (string.IsNullOrEmpty(po.Supplier?.Email)) throw new InvalidOperationException("Supplier email is not configured.");

            var body = GeneratePOEmailBody(po);
            var subject = $"Purchase Order {po.PONumber}";
            var recipient = po.Supplier.Email;

            (bool Success, string? ErrorMessage) sendResult = (false, "Email sender not configured");
            if (_emailSender != null)
            {
                sendResult = await _emailSender.SendEmailAsync(recipient, subject, body);
            }

            // Create EmailLog
            var emailLog = new EmailLog
            {
                CompanyId = po.CompanyId,
                ReferenceType = "PurchaseOrder",
                ReferenceId = po.Id,
                RecipientEmail = recipient,
                Subject = subject,
                Body = body,
                SentDate = DateTime.UtcNow,
                Status = sendResult.Success ? "Sent" : "Failed",
                SentBy = userId
            };

            _db.EmailLogs.Add(emailLog);

            // Update PO status on success
            if (sendResult.Success)
            {
                po.Status = "Sent";
                po.SentDate = DateTime.UtcNow;
                po.ModifiedDate = DateTime.UtcNow;
                po.ModifiedBy = userId;
            }

            await _db.SaveChangesAsync();

            if (!sendResult.Success)
            {
                _logger.LogWarning("Failed to send PO {PONumber} to {Email}: {Error}", po.PONumber, recipient, sendResult.ErrorMessage);
                throw new InvalidOperationException("Failed to send purchase order: " + sendResult.ErrorMessage);
            }

            _logger.LogInformation("Purchase order {PONumber} sent to {Email}", po.PONumber, recipient);
        }

        // Make number generators public for controller/tests
        public async Task<string> GeneratePONumberAsync()
        {
            // Use CodeGenerator to produce PO + 10 digits
            return await _codeGenerator.GeneratePrefixedDocumentNumberAsync("PO", 12);
        }

        public async Task<string> GenerateGRNumberAsync()
        {
            var year = DateTime.UtcNow.Year;
            var month = DateTime.UtcNow.Month;
            var prefix = $"GR{year}{month:D2}";

            var lastGR = await _db.GoodsReceipts
                .Where(gr => gr.GRNumber.StartsWith(prefix))
                .OrderByDescending(gr => gr.GRNumber)
                .FirstOrDefaultAsync();

            int nextNumber = 1;
            if (lastGR != null)
            {
                var lastNumber = lastGR.GRNumber.Substring(prefix.Length);
                if (int.TryParse(lastNumber, out int num))
                {
                    nextNumber = num + 1;
                }
            }

            return $"{prefix}{nextNumber:D4}";
        }

        private string GeneratePOEmailBody(PurchaseOrder order)
        {
            var body = $@"Dear {order.Supplier?.ContactPerson ?? "Supplier"},

Please find attached our Purchase Order {order.PONumber}.

Order Details:
- PO Number: {order.PONumber}
- Order Date: {order.OrderDate:yyyy-MM-dd}
- Required Date: {order.RequiredDate:yyyy-MM-dd}
- Total Amount: ${order.TotalAmount:N2}

Items:
";
            foreach (var item in order.Items)
            {
                body += $"- {item.Product?.Name ?? item.Product?.ProductCode}: {item.Quantity} x ${item.UnitPrice:N2} = ${item.LineTotal:N2}\n";
            }

            body += @"/

Please confirm receipt of this order and provide estimated delivery date.

Best regards,
Purchasing Department
";
            return body;
        }

        // General-purpose audit log method
        public async Task AuditAsync(int userId, string action, string entity, int? entityId, string? details = null)
        {
            try
            {
                var log = new AuditLog
                {
                    CompanyId = 1,
                    UserId = userId,
                    Action = action,
                    Entity = entity,
                    EntityId = entityId,
                    Details = details,
                    CreatedDate = DateTime.UtcNow
                };

                _db.AuditLogs.Add(log);
                await _db.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to write audit log");
            }
        }
    }
}
