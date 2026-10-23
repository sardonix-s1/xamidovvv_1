import { person } from '../config/site';
import { useI18n } from '../i18n/I18nProvider';
import { Reveal } from './ui';

export function QuoteSection() {
  const { t } = useI18n();

  return (
    <section id="quote" className="quote" aria-labelledby="quote-title">
      <div className="container quote__inner">
        <Reveal as="p" className="kicker">
          {t.quote.kicker}
        </Reveal>
        <Reveal delay={120}>
          <h2 id="quote-title" className="quote__line" lang="en">
            {person.tagline}
          </h2>
        </Reveal>
        <Reveal as="p" className="quote__secondary" delay={260}>
          {t.quote.secondary}
        </Reveal>
        {t.quote.localized ? (
          <Reveal as="p" className="quote__localized" delay={340}>
            {t.quote.localized}
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
