namespace ERPSystem.Models
{
    public class Purchase
    {
        public int Id { get; set; }
        public string SupplierName { get; set; }
        public DateTime PurchaseDate { get; set; }
        public decimal TotalCost { get; set; }
    }
}
