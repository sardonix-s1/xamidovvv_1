import { useI18n } from '../i18n/I18nProvider';
import { Reveal, SectionFrame } from './ui';

export function NowSection() {
  const { t } = useI18n();
  return (
    <SectionFrame id="now" kicker={t.now.kicker} heading={t.now.heading}>
      <dl className="facts">
        {t.now.items.map(([title, text], i) => (
          <Reveal key={title} className="facts__row" delay={i * 90}>
            <dt>{title}</dt>
            <dd>{text}</dd>
          </Reveal>
        ))}
      </dl>
    </SectionFrame>
  );
}
