import { URL } from 'node:url';

/**
 * SSRF Guard validates target URLs before any outbound HTTP requests.
 * Blocks:
 * - Loopback addresses (127.0.0.1, localhost, ::1)
 * - Cloud metadata endpoints (169.254.169.254, metadata.google.internal)
 * - Private RFC1918 subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)
 * - Non-HTTP/HTTPS protocols (file:, ftp:, gopher:, etc.)
 */
export function isSafeOutboundUrl(rawUrl: string): { safe: boolean; reason?: string } {
  try {
    const parsed = new URL(rawUrl);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { safe: false, reason: `Disallowed protocol: ${parsed.protocol}` };
    }

    const host = parsed.hostname.toLowerCase();

    // Check loopback & cloud metadata
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '169.254.169.254' ||
      host.endsWith('.metadata.google.internal') ||
      host.endsWith('.internal')
    ) {
      return { safe: false, reason: 'Destination targets private or metadata endpoint' };
    }

    // Check RFC1918 private IPv4 patterns
    const ipv4Match = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const first = parseInt(ipv4Match[1], 10);
      const second = parseInt(ipv4Match[2], 10);

      // 10.0.0.0/8
      if (first === 10) return { safe: false, reason: 'Private 10.0.0.0/8 address' };
      // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
      if (first === 172 && second >= 16 && second <= 31) {
        return { safe: false, reason: 'Private 172.16.0.0/12 address' };
      }
      // 192.168.0.0/16
      if (first === 192 && second === 168) {
        return { safe: false, reason: 'Private 192.168.0.0/16 address' };
      }
      // 0.0.0.0
      if (first === 0) return { safe: false, reason: 'Zero address' };
    }

    return { safe: true };
  } catch (err: any) {
    return { safe: false, reason: `Malformed URL: ${err.message}` };
  }
}
