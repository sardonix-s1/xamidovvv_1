import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { person, type SectionId } from '../config/site';
import { useI18n } from '../i18n/I18nProvider';
import { LanguageSwitcher } from './LanguageSwitcher';

const LINKS = ['about', 'projects', 'skills', 'interests', 'contact'] as const;

export function Navigation({ active }: { active: SectionId }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // Lock page scroll and move focus into the menu while it is open.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    menuRef.current?.querySelector<HTMLElement>('a')?.focus();
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Leaving the mobile layout closes the menu.
  useEffect(() => {
    const media = window.matchMedia('(min-width: 900px)');
    const onChange = () => media.matches && setOpen(false);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close(true);
      return;
    }
    if (e.key !== 'Tab') return;
    // Keep Tab inside the open menu (toggle button + links).
    const items = [
      toggleRef.current,
      ...Array.from(menuRef.current?.querySelectorAll<HTMLElement>('a, button') ?? []),
    ].filter((el): el is HTMLElement => !!el);
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <header className="header" data-scrolled={scrolled || undefined} data-open={open || undefined} onKeyDown={onKeyDown}>
      <div className="header__inner">
        <a className="header__brand" href="#hero" aria-label={t.nav.home} onClick={() => setOpen(false)}>
          {person.brand}
        </a>

        <nav className="header__nav" aria-label={t.nav.label}>
          {LINKS.map((id) => (
            <a key={id} href={`#${id}`} aria-current={active === id ? 'location' : undefined}>
              {t.nav[id]}
            </a>
          ))}
        </nav>

        <div className="header__tools">
          <LanguageSwitcher />
          <button
            ref={toggleRef}
            type="button"
            className="header__toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            <span aria-hidden="true" className="header__bars" />
          </button>
        </div>
      </div>

      <div id="mobile-menu" ref={menuRef} className="menu" hidden={!open}>
        <nav aria-label={t.nav.label}>
          {LINKS.map((id) => (
            <a
              key={id}
              href={`#${id}`}
              aria-current={active === id ? 'location' : undefined}
              onClick={() => setOpen(false)}
            >
              {t.nav[id]}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
