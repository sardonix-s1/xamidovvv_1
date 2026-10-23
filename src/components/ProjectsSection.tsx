import { projects } from '../config/site';
import { useI18n } from '../i18n/I18nProvider';
import { ArrowUpRight, ExternalLink, Reveal, SectionFrame } from './ui';

export function ProjectsSection() {
  const { t, pick } = useI18n();

  return (
    <SectionFrame id="projects" kicker={t.projects.kicker} heading={t.projects.heading} wide>
      {projects.length === 0 ? (
        <Reveal className="blueprint" delay={100}>
          <span className="blueprint__corner blueprint__corner--tl" aria-hidden="true" />
          <span className="blueprint__corner blueprint__corner--tr" aria-hidden="true" />
          <span className="blueprint__corner blueprint__corner--bl" aria-hidden="true" />
          <span className="blueprint__corner blueprint__corner--br" aria-hidden="true" />
          <span className="blueprint__cross" aria-hidden="true" />
          <h3 className="blueprint__title">{t.projects.emptyTitle}</h3>
          <p className="blueprint__body">{t.projects.emptyBody}</p>
        </Reveal>
      ) : (
        <ol className="projects">
          {projects.map((p, i) => (
            <Reveal as="li" key={p.id} className="project" delay={i * 80}>
              <span className="project__index" aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="project__main">
                <h3 className="project__name">{pick(p.name)}</h3>
                <p className="project__desc">{pick(p.description)}</p>
                {(p.tags?.length || p.status) && (
                  <p className="project__meta">
                    {p.status ? <span>{pick(p.status)}</span> : null}
                    {p.tags?.map((tag) => <span key={tag}>{tag}</span>)}
                  </p>
                )}
              </div>
              {p.url ? (
                <ExternalLink href={p.url} className="textlink" label={`${t.projects.visit}: ${pick(p.name)}`}>
                  {t.projects.visit}
                  <ArrowUpRight />
                </ExternalLink>
              ) : null}
            </Reveal>
          ))}
        </ol>
      )}
    </SectionFrame>
  );
}
