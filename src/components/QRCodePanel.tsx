import { useMemo } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { encodeQr, qrToSvgPath } from '../utils/qr';

/**
 * A real QR code for the public site address (VITE_SITE_URL, or the live origin
 * when the page is served from a public host). In local development there is no
 * public address yet, so an explanatory state is shown instead of a fake code.
 */
export function QRCodePanel({ url }: { url: string | null }) {
  const { t } = useI18n();

  const qr = useMemo(() => {
    if (!url) return null;
    try {
      return qrToSvgPath(encodeQr(url));
    } catch (error) {
      console.warn('QR generation failed:', error);
      return 'failed' as const;
    }
  }, [url]);

  if (!url) {
    return (
      <div className="qr qr--empty">
        <p>{t.contact.qrLocal}</p>
      </div>
    );
  }

  if (qr === 'failed' || qr === null) {
    return (
      <div className="qr qr--empty">
        <p>{t.contact.qrFailed}</p>
      </div>
    );
  }

  return (
    <div className="qr">
      <svg
        className="qr__code"
        viewBox={`0 0 ${qr.size} ${qr.size}`}
        role="img"
        aria-label={`${t.contact.qrAlt} (${url})`}
        shapeRendering="crispEdges"
      >
        <rect width={qr.size} height={qr.size} fill="#eceef1" />
        <path d={qr.path} fill="#07080a" />
      </svg>
    </div>
  );
}
