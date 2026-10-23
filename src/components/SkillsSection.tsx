import { skills } from '../config/site';
import { useI18n } from '../i18n/I18nProvider';
import { Reveal, SectionFrame } from './ui';

export function SkillsSection() {
  const { t, pick } = useI18n();

  return (
    <SectionFrame id="skills" kicker={t.skills.kicker} heading={t.skills.heading}>
      {skills.length === 0 ? (
        <Reveal className="quiet" delay={100}>
          <p className="quiet__title">{t.skills.emptyTitle}</p>
          <p className="quiet__body">{t.skills.emptyBody}</p>
        </Reveal>
      ) : (
        <dl className="skills">
          {skills.map((group, i) => (
            <Reveal key={group.id} className="skills__group" delay={i * 80}>
              <dt>{pick(group.title)}</dt>
              <dd>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </dd>
            </Reveal>
          ))}
        </dl>
      )}
    </SectionFrame>
  );
}
