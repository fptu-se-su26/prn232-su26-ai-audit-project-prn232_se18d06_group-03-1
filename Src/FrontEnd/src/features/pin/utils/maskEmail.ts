export function maskEmail(email: string): string {
  const separatorIndex = email.indexOf("@");
  if (separatorIndex <= 0) {
    return email;
  }
  const local = email.slice(0, separatorIndex);
  const domain = email.slice(separatorIndex + 1);
  return `${local.slice(0, 3)}***@${domain}`;
}
