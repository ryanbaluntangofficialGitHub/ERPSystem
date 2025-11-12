using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Net.Mail;
using System.Net;

namespace ERPSystem.Services
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly ILogger<SmtpEmailSender> _logger;
        private readonly IConfiguration _config;

        public SmtpEmailSender(ILogger<SmtpEmailSender> logger, IConfiguration config)
        {
            _logger = logger;
            _config = config;
        }

        public async Task<(bool Success, string? ErrorMessage)> SendEmailAsync(string to, string subject, string body, string? from = null)
        {
            try
            {
                var smtpSection = _config.GetSection("Smtp");
                var host = smtpSection["Host"];
                var port = int.Parse(smtpSection["Port"] ?? "25");
                var username = smtpSection["Username"];
                var password = smtpSection["Password"];
                var enableSsl = bool.Parse(smtpSection["EnableSsl"] ?? "false");
                var fromAddress = from ?? smtpSection["From"] ?? "noreply@example.com";

                using var client = new SmtpClient(host, port)
                {
                    EnableSsl = enableSsl,
                    Credentials = new NetworkCredential(username, password)
                };

                var msg = new MailMessage(fromAddress, to, subject, body) { IsBodyHtml = false };
                await client.SendMailAsync(msg);

                return (true, null);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Error sending email to {To}", to);
                return (false, ex.Message);
            }
        }
    }
}