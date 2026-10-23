import { person } from '../config/site';
import { useI18n } from '../i18n/I18nProvider';

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <p>
          © {new Date().getFullYear()} {person.name} · {person.brand}
          <span className="footer__sep" aria-hidden="true">
            {' '}
            ·{' '}
          </span>
          <span className="footer__note">{t.footer.note}</span>
        </p>
        <a href="#hero" className="textlink">
          {t.footer.top}
        </a>
      </div>
    </footer>
  );
}
