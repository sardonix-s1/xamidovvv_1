import type { CSSProperties } from 'react';
import { person, socials } from '../config/site';
import { useI18n } from '../i18n/I18nProvider';
import { ArrowDown, ArrowUpRight, ExternalLink } from './ui';

export function HeroSection() {
  const { t, fmt } = useI18n();

  return (
    <section id="hero" className="hero" aria-labelledby="hero-title">
      <div className="container hero__inner">
        <p className="hero__brand rise" style={{ '--i': 0 } as CSSProperties}>
          <span className="hero__dash" aria-hidden="true" />
          {person.brand}
        </p>

        <h1 id="hero-title" className="hero__name rise" style={{ '--i': 1 } as CSSProperties}>
          {person.name}
        </h1>

        <p className="hero__tagline rise" lang="en" style={{ '--i': 2 } as CSSProperties}>
          {person.tagline}
        </p>

        <p className="hero__intro rise" style={{ '--i': 3 } as CSSProperties}>
          {t.hero.intro}
        </p>

        <div className="hero__actions rise" style={{ '--i': 4 } as CSSProperties}>
          <a className="cta" href="#about">
            <span>{t.hero.explore}</span>
            <ArrowDown />
          </a>

          <div className="hero__social">
            <span className="hero__social-label">{t.hero.contactLabel}</span>
            <ul className="hero__social-list">
              {socials.map((s) => (
                <li key={s.id}>
                  <ExternalLink href={s.url} label={fmt(t.contact.open, { name: s.label })} className="textlink">
                    {s.label}
                    <ArrowUpRight />
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
