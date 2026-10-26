import { skills, socials } from '../config/site';
import { useI18n } from '../i18n/I18nProvider';
import { ArrowUpRight, ExternalLink, Reveal, SectionFrame } from './ui';

export function SkillsSection() {
  const { t, pick, fmt } = useI18n();

  return (
    <SectionFrame id="skills" kicker={t.skills.kicker} heading={t.skills.heading}>
      {skills.length === 0 ? (
        <Reveal className="quiet" delay={100}>
          <p className="quiet__title">{t.skills.emptyTitle}</p>
          <p className="quiet__body">{t.skills.emptyBody}</p>
        </Reveal>
      ) : (
        <dl className="skills">
          {skills.map((group, i) => {
            const links = socials.filter((s) => group.profiles?.includes(s.id));
            return (
              <Reveal key={group.id} className="skills__group" delay={i * 90}>
                <dt>{pick(group.title)}</dt>
                <dd>
                  <ul>
                    {group.items.map((item) => (
                      <li key={item.en}>{pick(item)}</li>
                    ))}
                  </ul>
                  {group.note ? <p className="skills__note">{pick(group.note)}</p> : null}
                  {links.length > 0 && (
                    <p className="skills__links">
                      <span>{t.skills.profiles}</span>
                      {links.map((s) => (
                        <ExternalLink
                          key={s.id}
                          href={s.url}
                          className="textlink"
                          label={fmt(t.contact.open, { name: s.label })}
                        >
                          {s.label}
                          <ArrowUpRight />
                        </ExternalLink>
                      ))}
                    </p>
                  )}
                  {group.samples?.length ? (
                    <div className="skills__samples">
                      {group.samples.map((v) => (
                        <figure key={v.src} className="sample">
                          <video
                            controls
                            playsInline
                            preload="none"
                            poster={v.poster}
                            src={v.src}
                            aria-label={pick(v.title)}
                          />
                          <figcaption>{pick(v.title)}</figcaption>
                        </figure>
                      ))}
                    </div>
                  ) : null}
                </dd>
              </Reveal>
            );
          })}
        </dl>
      )}
    </SectionFrame>
  );
}
