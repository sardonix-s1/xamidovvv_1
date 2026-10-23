import { configuredSiteUrl } from '../config/site';

export type SiteUrlSource = 'config' | 'location' | 'none';

export interface ResolvedSiteUrl {
  /** The public URL, or null when the site is only running locally. */
  url: string | null;
  source: SiteUrlSource;
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/** True for localhost, loopback, .local and private-network hosts — not shareable addresses. */
function isLocalHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '0.0.0.0' || hostname === '[::1]') return true;
  if (hostname.endsWith('.local')) return true;
  if (/^127\./.test(hostname) || /^10\./.test(hostname) || /^192\.168\./.test(hostname)) return true;
  return /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
}

/**
 * 1. VITE_SITE_URL, when configured.
 * 2. Otherwise the address the page is actually served from — but only if it is a public one.
 * 3. Otherwise null (local development): the QR code shows an explanatory state instead.
 */
export function resolveSiteUrl(): ResolvedSiteUrl {
  if (configuredSiteUrl && isHttpUrl(configuredSiteUrl)) {
    return { url: `${configuredSiteUrl}/`, source: 'config' };
  }
  if (typeof window !== 'undefined') {
    const { protocol, hostname, origin, pathname } = window.location;
    if ((protocol === 'http:' || protocol === 'https:') && !isLocalHost(hostname)) {
      return { url: `${origin}${pathname}`, source: 'location' };
    }
  }
  return { url: null, source: 'none' };
}
