export function parseSupportTicketAttachmentUrls(value?: string | null): string[] {
  if (!value?.trim()) return [];

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
  } catch {
    // Older values may be saved as comma/newline separated URLs.
  }

  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function serializeSupportTicketAttachmentUrls(urls: string[]) {
  const cleanUrls = urls.map((url) => url.trim()).filter(Boolean);
  return cleanUrls.length > 0 ? JSON.stringify(cleanUrls) : undefined;
}
