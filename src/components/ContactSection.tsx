import { useMemo } from 'react';
import { channels, socials } from '../config/site';
import { useI18n } from '../i18n/I18nProvider';
import { resolveSiteUrl } from '../utils/siteUrl';
import { QRCodePanel } from './QRCodePanel';
import { ShareControls } from './ShareControls';
import { ArrowUpRight, ExternalLink, Reveal, SectionFrame } from './ui';

export function ContactSection() {
  const { t, fmt, pick } = useI18n();
  const site = useMemo(() => resolveSiteUrl(), []);
  // Locally there is no public address, so copy/share fall back to the current page.
  const shareUrl = site.url ?? window.location.href.split('#')[0];

  return (
    <SectionFrame id="contact" kicker={t.contact.kicker} heading={t.contact.heading} wide>
      <Reveal as="p" className="prose" delay={60}>
        {t.contact.intro}
      </Reveal>

      <ul className="contacts">
        {socials.map((s, i) => (
          <Reveal as="li" key={s.id} delay={120 + i * 70}>
            <ExternalLink href={s.url} className="contact-row" label={fmt(t.contact.open, { name: s.label })}>
              <span className="contact-row__label">{s.label}</span>
              <span className="contact-row__handle">{s.handle}</span>
              <ArrowUpRight />
            </ExternalLink>
          </Reveal>
        ))}
      </ul>

      {channels.length > 0 && (
        <>
          <Reveal as="p" className="contacts__sub" delay={200}>
            {t.contact.channels}
          </Reveal>
          <ul className="contacts">
            {channels.map((ch, i) => (
              <Reveal as="li" key={ch.id} delay={240 + i * 70}>
                <ExternalLink href={ch.url} className="contact-row" label={`${ch.name} — ${pick(ch.description)}`}>
                  <span className="contact-row__label">{ch.name}</span>
                  <span className="contact-row__handle">{ch.handle}</span>
                  <ArrowUpRight />
                </ExternalLink>
              </Reveal>
            ))}
          </ul>
        </>
      )}

      <Reveal className="takeaway" delay={200}>
        <div className="takeaway__text">
          <h3 className="takeaway__title">{t.contact.scanTitle}</h3>
          <p className="takeaway__body">{t.contact.scanBody}</p>
          <ShareControls url={shareUrl} />
        </div>
        <QRCodePanel url={site.url} />
      </Reveal>
    </SectionFrame>
  );
}
