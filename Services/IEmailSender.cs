using System.Threading.Tasks;

namespace ERPSystem.Services
{
    public interface IEmailSender
    {
        Task<(bool Success, string? ErrorMessage)> SendEmailAsync(string to, string subject, string body, string? from = null);
    }
}