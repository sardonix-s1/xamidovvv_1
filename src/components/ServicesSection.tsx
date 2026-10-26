import { socials } from '../config/site';
import { useI18n } from '../i18n/I18nProvider';
import { ArrowUpRight, ExternalLink, Reveal, SectionFrame } from './ui';

export function ServicesSection() {
  const { t, fmt } = useI18n();
  const s = t.services;
  const telegram = socials.find((x) => x.id === 'telegram');
  return (
    <SectionFrame id="services" kicker={s.kicker} heading={s.heading}>
      <ol className="offers">
        {s.items.map(([title, text], i) => (
          <Reveal as="li" key={title} className="offers__item" delay={i * 90}>
            <span className="offers__index" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="offers__title">{title}</h3>
            <p className="offers__text">{text}</p>
          </Reveal>
        ))}
      </ol>
      <Reveal as="p" className="prose" delay={300}>
        {s.note}
      </Reveal>
      <Reveal className="faq" delay={360}>
        <h3 className="faq__title">{s.faqTitle}</h3>
        <p className="faq__text">{s.faq}</p>
        {telegram ? (
          <ExternalLink
            href={telegram.url}
            className="textlink"
            label={fmt(t.contact.open, { name: telegram.label })}
          >
            {s.cta}
            <ArrowUpRight />
          </ExternalLink>
        ) : null}
      </Reveal>
    </SectionFrame>
  );
}
