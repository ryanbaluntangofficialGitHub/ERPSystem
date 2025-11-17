using System;
using System.Linq;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ERPSystem.Data;
using ERPSystem.Models;
using Microsoft.AspNetCore.Hosting;

namespace ERPSystem.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AnalyticsController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly ILogger<AnalyticsController> _logger;
        private readonly IWebHostEnvironment _env;

        public AnalyticsController(AppDbContext db, ILogger<AnalyticsController> logger, IWebHostEnvironment env)
        {
            _db = db;
            _logger = logger;
            _env = env;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                int productsCount = 0, activeProducts = 0, warehousesCount = 0, activeWarehouses = 0, prsPending = 0, posDraft = 0, posApproved = 0, grPending = 0, salesOrders = 0;
                List<object> salesTrend = new();
                List<object> poStatusCounts = new();
                List<object> recentAudits = new();

                try
                {
                    productsCount = await _db.Products.CountAsync();
                    activeProducts = await _db.Products.CountAsync(p => p.IsActive);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Unable to compute product counts for analytics");
                }

                try
                {
                    warehousesCount = await _db.Warehouses.CountAsync();
                    activeWarehouses = await _db.Warehouses.CountAsync(w => w.IsActive);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Unable to compute warehouse counts for analytics");
                }

                try
                {
                    prsPending = await _db.PurchaseRequests.CountAsync(pr => pr.Status == "PendingApproval");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Unable to compute purchase request counts for analytics");
                }

                try
                {
                    posDraft = await _db.PurchaseOrders.CountAsync(po => po.Status == "Draft");
                    posApproved = await _db.PurchaseOrders.CountAsync(po => po.Status == "Approved");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Unable to compute purchase order counts for analytics");
                }

                try
                {
                    grPending = await _db.GoodsReceipts.CountAsync(gr => gr.Status == "Draft" || gr.Status == "PendingApproval");
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Unable to compute goods receipt counts for analytics");
                }

                try
                {
                    salesOrders = await _db.SalesOrders.CountAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Unable to compute sales order count for analytics");
                }

                try
                {
                    var now = DateTime.UtcNow;
                    var months = Enumerable.Range(0, 6).Select(i => now.AddMonths(-i)).Reverse().ToList();
                    foreach (var m in months)
                    {
                        var start = new DateTime(m.Year, m.Month, 1);
                        var end = start.AddMonths(1);
                        int count = 0;
                        try
                        {
                            count = await _db.SalesOrders.CountAsync(s => s.SaleDate >= start && s.SaleDate < end);
                        }
                        catch (Exception ex)
                        {
                            _logger.LogWarning(ex, "Unable to compute sales trend month {Month}", start.ToString("yyyy-MM"));
                        }
                        salesTrend.Add(new { month = start.ToString("yyyy-MM"), count });
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Unable to compute sales trend for analytics");
                }

                try
                {
                    poStatusCounts = await _db.PurchaseOrders
                        .GroupBy(p => p.Status)
                        .Select(g => new { status = g.Key, count = g.Count() })
                        .Cast<object>()
                        .ToListAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Unable to compute PO status counts");
                }

                try
                {
                    recentAudits = await _db.AuditLogs
                        .OrderByDescending(a => a.CreatedDate)
                        .Take(10)
                        .Select(a => new { a.Id, a.Action, a.Entity, a.EntityId, a.UserId, a.Details, a.CreatedDate })
                        .Cast<object>()
                        .ToListAsync();
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Unable to fetch recent audit logs");
                }

                var result = new
                {
                    Products = new { Total = productsCount, Active = activeProducts },
                    Warehouses = new { Total = warehousesCount, Active = activeWarehouses },
                    PurchaseRequests = new { PendingApproval = prsPending },
                    PurchaseOrders = new { Draft = posDraft, Approved = posApproved, StatusCounts = poStatusCounts },
                    GoodsReceipts = new { Pending = grPending },
                    SalesOrders = new { Total = salesOrders, Trend = salesTrend },
                    RecentAudit = recentAudits
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching analytics");
                if (_env?.IsDevelopment() == true)
                {
                    return Problem(detail: ex.ToString(), title: "Error fetching analytics");
                }
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}
