import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { games } from '../config/site';
import { useI18n } from '../i18n/I18nProvider';
import { useReducedMotion } from '../hooks/useReducedMotion';
import { copyText } from '../utils/clipboard';
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

/** One tab per game; the panel shows the in-game ID / nickname (or says it is coming soon). */
function GameTabs() {
  const { t, pick } = useI18n();
  const [selected, setSelected] = useState(0);
  const [note, setNote] = useState('');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const g = t.interests.games;
  const game = games[selected];

  const move = (to: number) => {
    const next = (to + games.length) % games.length;
    setSelected(next);
    setNote('');
    tabRefs.current[next]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      move(selected + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      move(selected - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      move(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      move(games.length - 1);
    }
  };

  const onCopy = async () => {
    if (!game.handle) return;
    setNote((await copyText(game.handle)) ? g.copied : g.copyFailed);
  };

  return (
    <div className="gametabs">
      <div className="gametabs__list" role="tablist" aria-label={g.tabs} onKeyDown={onKeyDown} lang="en">
        {games.map((item, i) => (
          <button
            key={item.id}
            ref={(el: HTMLButtonElement | null) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`game-tab-${item.id}`}
            aria-selected={selected === i}
            aria-controls="game-panel"
            tabIndex={selected === i ? 0 : -1}
            className="gametabs__tab"
            onClick={() => {
              setSelected(i);
              setNote('');
            }}
          >
            {item.name}
          </button>
        ))}
      </div>

      <div id="game-panel" role="tabpanel" aria-labelledby={`game-tab-${game.id}`} className="gametabs__panel" tabIndex={0}>
        <p className="gametabs__label">{pick(game.handleLabel)}</p>
        {game.handle ? (
          <div className="gametabs__row">
            <code className="gametabs__handle">{game.handle}</code>
            <button type="button" className="btn" onClick={onCopy}>
              {g.copy}
            </button>
          </div>
        ) : (
          <p className="gametabs__pending">{g.pending}</p>
        )}
        <p className="gametabs__note" role="status">
          {note}
        </p>
      </div>
    </div>
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
          <ul className="langlist">
            {i.languages.list.map(([name, note]) => (
              <li key={name}>
                <span className="langlist__name">{name}</span>
                <span className="langlist__note">{note}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal className="interest interest--games" delay={140}>
          <h3 className="interest__title">{i.games.title}</h3>
          <p className="interest__text">{i.games.text}</p>
          <GameTabs />
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
