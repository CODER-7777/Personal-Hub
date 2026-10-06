export function isInternalUrl(value: string, scheme: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === `${scheme}:` && url.hostname === '-' && !url.username && !url.password;
  } catch { return false; }
}

export function safeExternalUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return;
    return url.href;
  } catch { return; }
}
