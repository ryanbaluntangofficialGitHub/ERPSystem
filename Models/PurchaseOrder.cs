using System;

namespace ERPSystem.Models
{
    public class PurchaseOrder
    {
        public int Id { get; set; }
        public string Supplier { get; set; } = string.Empty;
        public DateTime Date { get; set; }
        public decimal Total { get; set; }
    }
}
