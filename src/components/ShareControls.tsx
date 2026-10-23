import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import { copyText } from '../utils/clipboard';
import { ArrowUpRight, ExternalLink } from './ui';

interface Message {
  kind: 'ok' | 'error';
  text: string;
}

/** Copy link, native share (where supported), and a Telegram share link as a universal fallback. */
export function ShareControls({ url }: { url: string }) {
  const { t, fmt } = useI18n();
  const [message, setMessage] = useState<Message | null>(null);
  const timer = useRef<number>(0);
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const flash = (next: Message) => {
    setMessage(next);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setMessage(null), 5000);
  };

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const onCopy = async () => {
    const ok = await copyText(url);
    flash(ok ? { kind: 'ok', text: t.contact.copied } : { kind: 'error', text: t.contact.copyFailed });
  };

  const onShare = async () => {
    try {
      await navigator.share({ title: t.meta.title, text: t.contact.shareText, url });
      flash({ kind: 'ok', text: t.contact.shared }); // only after the share sheet reports success
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return; // visitor cancelled
      flash({ kind: 'error', text: t.contact.shareFailed });
    }
  };

  const telegramHref = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(t.contact.shareText)}`;

  return (
    <div className="share">
      <p className="share__url">
        <span className="share__url-label">{t.contact.urlLabel}</span>
        <code>{url}</code>
      </p>

      <div className="share__buttons">
        <button type="button" className="btn" onClick={onCopy}>
          {t.contact.copy}
        </button>
        {canShare ? (
          <button type="button" className="btn" onClick={onShare}>
            {t.contact.share}
          </button>
        ) : null}
        <ExternalLink href={telegramHref} className="textlink" label={fmt(t.contact.open, { name: 'Telegram' })}>
          {t.contact.shareTelegram}
          <ArrowUpRight />
        </ExternalLink>
      </div>

      <p className="share__status" role="status" aria-live="polite" data-kind={message?.kind}>
        {message ? (
          <>
            <span aria-hidden="true">{message.kind === 'ok' ? '✓' : '!'}</span> {message.text}
          </>
        ) : null}
      </p>
    </div>
  );
}
