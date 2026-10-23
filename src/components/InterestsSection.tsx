import { useEffect, useState } from 'react';
import { games } from '../config/site';
import { useI18n } from '../i18n/I18nProvider';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { MusicControl } from './MusicControl';
import { Reveal, SectionFrame } from './ui';

/** Cycles through greetings; with reduced motion they are simply shown side by side. */
function Greetings({ words }: { words: readonly string[] }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), 2600);
    return () => window.clearInterval(id);
  }, [reduced, words.length]);

  if (reduced) {
    return (
      <p className="greetings greetings--static">
        {words.map((w, i) => (
          <span key={w}>
            {i > 0 ? <span className="greetings__sep"> / </span> : null}
            {w}
          </span>
        ))}
      </p>
    );
  }

  return (
    <>
      <p className="sr-only">{words.join(', ')}</p>
      <p className="greetings" aria-hidden="true">
        <span key={words[index]} className="greetings__word">
          {words[index]}
        </span>
      </p>
    </>
  );
}

export function InterestsSection() {
  const { t } = useI18n();
  const i = t.interests;

  return (
    <SectionFrame id="interests" kicker={i.kicker} heading={i.heading} wide>
      <div className="interests">
        <Reveal className="interest interest--lang" delay={60}>
          <h3 className="interest__title">{i.languages.title}</h3>
          <Greetings words={i.languages.greetings} />
          <ul className="plain-list">
            <li>{i.languages.english}</li>
            <li>{i.languages.spanish}</li>
          </ul>
        </Reveal>

        <Reveal className="interest interest--games" delay={140}>
          <h3 className="interest__title">{i.games.title}</h3>
          <p className="interest__text">{i.games.text}</p>
          <ul className="games" lang="en">
            {games.map((game) => (
              <li key={game}>{game}</li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="interest interest--music" delay={220}>
          <h3 className="interest__title">{i.music.title}</h3>
          <p className="interest__text">{i.music.text}</p>
          <MusicControl />
        </Reveal>

        <Reveal className="interest interest--themes" delay={300}>
          <h3 className="interest__title">{i.themes.title}</h3>
          <ul className="themes">
            {i.themes.words.map((word) => (
              <li key={word}>{word}</li>
            ))}
          </ul>
        </Reveal>
      </div>
    </SectionFrame>
  );
}
