namespace Solanist.Infrastructure.WhatsApp;

internal static class PhoneNumberNormalizer
{
    public static string? Normalize(string? phone, string defaultCountryCode = "27")
    {
        if (string.IsNullOrWhiteSpace(phone))
            return null;

        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length < 9)
            return null;

        if (digits.StartsWith('0') && digits.Length >= 10)
            digits = defaultCountryCode + digits[1..];

        if (digits.Length < 10 || digits.Length > 15)
            return null;

        return digits;
    }
}
