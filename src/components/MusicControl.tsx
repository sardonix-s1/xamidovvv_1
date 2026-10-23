import { useCallback, useEffect, useRef, useState } from 'react';
import { music } from '../config/site';
import { useI18n } from '../i18n/I18nProvider';
import { ArrowUpRight, ExternalLink } from './ui';

type FileState = 'stopped' | 'playing' | 'paused' | 'error';
type EmbedState = 'closed' | 'loading' | 'open' | 'slow';

const EMBED_SLOW_MS = 10_000;

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
    </svg>
  );
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor" />
    </svg>
  );
}
function StopIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path d="M3.5 3.5h9v9h-9z" fill="currentColor" />
    </svg>
  );
}

/**
 * Optional atmosphere, always started by the visitor — never autoplay.
 *
 *  1. If `music.audioSrc` is set (a file you have the rights to publish) → native audio with play / pause / stop.
 *  2. Else if `music.spotifyTrackId` is set → Spotify's official embed, loaded only after "Play".
 *  3. Else → a plain "listen on" link.
 */
export function MusicControl() {
  const { t, fmt } = useI18n();
  const trackName = fmt(t.music.track, { title: music.title, artist: music.artist });
  const mode = music.audioSrc ? 'file' : music.spotifyTrackId ? 'embed' : 'link';

  return (
    <div className="music" role="group" aria-label={t.music.region}>
      <p className="music__track" lang="ru">
        {trackName}
      </p>

      {mode === 'file' && <FilePlayer />}
      {mode === 'embed' && <EmbedPlayer />}

      <div className="music__links">
        <ExternalLink
          href={music.sourceUrl}
          className="textlink"
          label={`${fmt(t.music.listenOn, { name: music.sourceName })}: ${trackName}`}
        >
          {fmt(t.music.listenOn, { name: music.sourceName })}
          <ArrowUpRight />
        </ExternalLink>
        {music.otherSources.length > 0 && (
          <span className="music__also">
            {t.music.otherServices}{' '}
            {music.otherSources.map((s, i) => (
              <span key={s.name}>
                {i > 0 ? ', ' : ''}
                <ExternalLink href={s.url} className="textlink textlink--quiet">
                  {s.name}
                </ExternalLink>
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  );
}

/** Mode 1 — a licensed local/hosted file. */
function FilePlayer() {
  const { t } = useI18n();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [state, setState] = useState<FileState>('stopped');

  const ensureAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'none';
      audio.loop = true;
      audio.src = music.audioSrc;
      audio.addEventListener('error', () => setState('error'));
      audio.addEventListener('ended', () => setState('stopped'));
      audioRef.current = audio;
    }
    return audioRef.current;
  }, []);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      audioRef.current = null;
    },
    [],
  );

  const toggle = async () => {
    const audio = ensureAudio();
    if (state === 'playing') {
      audio.pause();
      setState('paused');
      return;
    }
    try {
      await audio.play();
      setState('playing');
    } catch {
      setState('error'); // blocked, missing file, unsupported format…
    }
  };

  const stop = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setState('stopped');
  };

  const label: Record<FileState, string> = {
    stopped: t.music.stopped,
    playing: t.music.playing,
    paused: t.music.paused,
    error: t.music.error,
  };

  return (
    <>
      <div className="music__controls">
        <button type="button" className="btn btn--round" onClick={toggle} aria-label={state === 'playing' ? t.music.pause : t.music.play}>
          {state === 'playing' ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button type="button" className="btn btn--round" onClick={stop} disabled={state === 'stopped'} aria-label={t.music.stop}>
          <StopIcon />
        </button>
        <span className="music__state" role="status">
          <span className="eq" data-playing={state === 'playing' || undefined} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {label[state]}
        </span>
      </div>
    </>
  );
}

/** Mode 2 — Spotify's official embed, mounted only after the visitor asks for it. */
function EmbedPlayer() {
  const { t, fmt } = useI18n();
  const [state, setState] = useState<EmbedState>('closed');

  useEffect(() => {
    if (state !== 'loading') return;
    const timer = window.setTimeout(() => setState((s) => (s === 'loading' ? 'slow' : s)), EMBED_SLOW_MS);
    return () => window.clearTimeout(timer);
  }, [state]);

  const isOpen = state !== 'closed';
  const status =
    state === 'closed'
      ? t.music.stopped
      : state === 'loading'
        ? t.music.loading
        : state === 'slow'
          ? fmt(t.music.embedSlow, { name: music.sourceName })
          : t.music.ready;

  return (
    <>
      <div className="music__controls">
        {isOpen ? (
          <button type="button" className="btn btn--round" onClick={() => setState('closed')} aria-label={t.music.stop}>
            <StopIcon />
          </button>
        ) : (
          <button type="button" className="btn btn--round" onClick={() => setState('loading')} aria-label={t.music.play}>
            <PlayIcon />
          </button>
        )}
        <span className="music__state" role="status">
          <span className="eq" data-playing={state === 'open' || undefined} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          {status}
        </span>
      </div>

      {isOpen ? (
        <iframe
          className="music__embed"
          title={fmt(t.music.embedTitle, { title: music.title, artist: music.artist })}
          src={`https://open.spotify.com/embed/track/${encodeURIComponent(music.spotifyTrackId)}?theme=0`}
          width="100%"
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setState((s) => (s === 'closed' ? s : 'open'))}
        />
      ) : (
        <p className="music__hint">{t.music.embedHint}</p>
      )}
    </>
  );
}
