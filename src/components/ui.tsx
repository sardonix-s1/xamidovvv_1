import type { CSSProperties, ElementType, ReactNode } from 'react';
import { useReveal } from '../hooks/useReveal';

/** Fades its children up once they scroll into view (CSS handles the animation). */
export function Reveal({
  as: Tag = 'div',
  delay = 0,
  className = '',
  children,
}: {
  as?: ElementType;
  delay?: number;
  className?: string;
  children: ReactNode;
}) {
  const ref = useReveal<HTMLElement>();
  const style = { '--d': `${delay}ms` } as CSSProperties;
  return (
    <Tag ref={ref} className={`reveal ${className}`.trim()} style={style}>
      {children}
    </Tag>
  );
}

export function ArrowUpRight() {
  return (
    <svg className="arrow" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M4 12 12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" />
    </svg>
  );
}

export function ArrowDown() {
  return (
    <svg className="arrow" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M8 3v10M4 9.5 8 13.5 12 9.5" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square" />
    </svg>
  );
}

/** Standard two-column section frame: kicker on the left, content on the right. */
export function SectionFrame({
  id,
  kicker,
  heading,
  children,
  wide = false,
}: {
  id: string;
  kicker: string;
  heading: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const headingId = `${id}-heading`;
  return (
    <section id={id} className={`section${wide ? ' section--wide' : ''}`} aria-labelledby={headingId}>
      <div className="container section__grid">
        <Reveal className="section__head">
          <p className="kicker">{kicker}</p>
          <h2 id={headingId} className="section__title">
            {heading}
          </h2>
        </Reveal>
        <div className="section__body">{children}</div>
      </div>
    </section>
  );
}

/** A link that opens in a new tab, safely. */
export function ExternalLink({
  href,
  label,
  className,
  children,
}: {
  href: string;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a href={href} className={className} target="_blank" rel="noopener noreferrer" aria-label={label}>
      {children}
    </a>
  );
}
