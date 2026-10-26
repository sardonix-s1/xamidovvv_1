import { useI18n } from '../i18n/I18nProvider';
import { Reveal, SectionFrame } from './ui';

export function AboutSection() {
  const { t } = useI18n();
  const [first, ...rest] = t.about.paragraphs;

  return (
    <SectionFrame id="about" kicker={t.about.kicker} heading={t.about.heading}>
      <Reveal as="p" className="lede" delay={80}>
        {first}
      </Reveal>
      {rest.map((text, i) => (
        <Reveal key={text} as="p" className="prose" delay={160 + i * 90}>
          {text}
        </Reveal>
      ))}
      <Reveal as="p" className="about__place" delay={340}>
        {t.about.location}
      </Reveal>
    </SectionFrame>
  );
}
