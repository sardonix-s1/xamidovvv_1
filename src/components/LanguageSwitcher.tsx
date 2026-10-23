import { LANGS } from '../config/site';
import { useI18n } from '../i18n/I18nProvider';

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="lang" role="group" aria-label={t.lang.label}>
      {LANGS.map((code) => (
        <button
          key={code}
          type="button"
          className="lang__btn"
          lang={code}
          aria-pressed={lang === code}
          aria-label={t.lang[code]}
          title={t.lang[code]}
          onClick={() => setLang(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
