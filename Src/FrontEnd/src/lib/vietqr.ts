function crc16Ccitt(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function tlv(id: string, value: string): string {
  return id + value.length.toString().padStart(2, "0") + value;
}

/**
 * Generate EMV QR payload string following VietQR / NAPAS specification.
 *
 * Tag 38 – Merchant Account Information (NAPAS):
 *   Sub-tag 00 : GUID = "A000000727"
 *   Sub-tag 01 : Beneficiary Organization
 *       Sub-tag 00 : Bank BIN (6 digits)
 *       Sub-tag 01 : Account Number
 *   Sub-tag 02 : Service Code = "QRIBFTTA"
 */
export function makeVietQRContent(params: {
  bankId: string;
  accountId: string;
  amount?: number;
  description?: string;
}): string {
  const { bankId, accountId, amount, description } = params;

  // Sub-tag 01 of Tag 38: Beneficiary Organization
  // Contains nested: sub-tag 00 (Bank BIN) + sub-tag 01 (Account Number)
  const beneficiaryOrg =
    tlv("00", bankId) +
    tlv("01", accountId);

  // Tag 38: Merchant Account Information (NAPAS)
  const merchantInfo =
    tlv("00", "A000000727") +       // GUID
    tlv("01", beneficiaryOrg) +      // Beneficiary Organization
    tlv("02", "QRIBFTTA");           // Service Code: transfer to account

  let payload =
    tlv("00", "01") +               // Payload Format Indicator
    tlv("01", "12") +               // Point of Initiation Method: 12 = dynamic
    tlv("38", merchantInfo) +        // Merchant Account Info (NAPAS)
    tlv("53", "704");                // Transaction Currency: VND

  if (amount && amount > 0) {
    payload += tlv("54", amount.toString()); // Transaction Amount
  }

  payload += tlv("58", "VN");       // Country Code

  if (description) {
    payload += tlv("62", tlv("08", description)); // Additional Data: purpose of transaction
  }

  const crcData = payload + "6304";
  const crc = crc16Ccitt(crcData);
  payload += "6304" + crc;

  return payload;
}
