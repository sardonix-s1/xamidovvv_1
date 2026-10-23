/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  SITE CONFIG — the one place to edit facts about the owner.
 *  Text that appears on the page (About, interests, UI labels) lives in
 *  src/i18n/en.ts and src/i18n/ru.ts.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Lang = 'en' | 'ru';
export type Localized<T = string> = Record<Lang, T>;

export const LANGS: readonly Lang[] = ['en', 'ru'];
export const DEFAULT_LANG: Lang = 'en';

/** Identity. The tagline is the brand phrase and is intentionally not translated. */
export const person = {
  name: 'Sardor',
  brand: 'Xamidovvv',
  tagline: 'Building from ideas.',
} as const;

/** Contact destinations — URLs exactly as supplied by the owner. */
export interface SocialLink {
  id: 'telegram' | 'tiktok' | 'instagram';
  label: string;
  handle: string;
  url: string;
}

export const socials: readonly SocialLink[] = [
  {
    id: 'telegram',
    label: 'Telegram',
    handle: '@xamidovvv_09',
    url: 'https://t.me/xamidovvv_09',
  },
  {
    id: 'tiktok',
    label: 'TikTok',
    handle: '@sard_onix',
    url: 'https://www.tiktok.com/@sard_onix?_r=1&_t=ZS-9AbkQl36CU0',
  },
  {
    id: 'instagram',
    label: 'Instagram',
    handle: '@xamidovvv.09',
    url: 'https://www.instagram.com/xamidovvv.09?srtk=MXB1cXN0bnpnNHMwZQ==',
  },
];

/**
 * Public URL of the deployed site. Set VITE_SITE_URL at build time (see README).
 * Leave empty until the site is deployed — nothing fake is ever used.
 */
export const configuredSiteUrl: string = (import.meta.env.VITE_SITE_URL ?? '')
  .trim()
  .replace(/\/+$/, '');

/**
 * Music. No audio file is bundled with this site.
 *
 * The track "Зима" by Вектор А (released 2026) is offered through Spotify's
 * official embed. Nothing from Spotify is loaded until the visitor presses
 * Play, and nothing plays by itself.
 *
 *  • `audioSrc` — OPTIONAL. Only set this to a file you have the rights to
 *    publish (e.g. put "zima.mp3" in /public/audio and use '/audio/zima.mp3').
 *    When set it takes priority: the visitor gets play / pause / stop.
 *  • `spotifyTrackId` — drives the official embed. Set it to '' to turn it off.
 *  • `sourceUrl` — plain "listen on" link, always shown as a fallback.
 *  • `otherSources` — extra links to the artist on other services.
 */
export const music = {
  title: 'Зима',
  artist: 'Вектор А',
  audioSrc: '' as string,
  spotifyTrackId: '0Fre3PpmWIFIYBgQv9w0x1',
  sourceUrl: 'https://open.spotify.com/track/0Fre3PpmWIFIYBgQv9w0x1',
  sourceName: 'Spotify',
  otherSources: [
    {
      name: 'Apple Music',
      url: 'https://music.apple.com/us/artist/%D0%B2%D0%B5%D0%BA%D1%82%D0%BE%D1%80-%D0%B0/1568300689',
    },
  ] as readonly { name: string; url: string }[],
};

/**
 * PROJECTS — empty on purpose: the page shows a designed empty state until
 * you add real entries. Example (copy, uncomment, edit):
 *
 *   {
 *     id: 'my-project',
 *     name: { en: 'Project name', ru: 'Название проекта' },
 *     description: { en: 'One honest sentence.', ru: 'Одно честное предложение.' },
 *     tags: ['React', 'TypeScript'],
 *     url: 'https://example.com',        // optional, only a link that really works
 *     status: { en: 'In progress', ru: 'В работе' }, // optional
 *   },
 */
export interface Project {
  id: string;
  name: Localized;
  description: Localized;
  tags?: string[];
  url?: string;
  status?: Localized;
}

export const projects: readonly Project[] = [];

/**
 * SKILLS — empty on purpose (no invented skills, no percentages). Example:
 *
 *   { id: 'web', title: { en: 'Web', ru: 'Веб' }, items: ['HTML', 'CSS'] },
 */
export interface SkillGroup {
  id: string;
  title: Localized;
  items: string[];
}

export const skills: readonly SkillGroup[] = [];

/** Games shown in the Interests section (confirmed by the owner). */
export const games: readonly string[] = ['PUBG Mobile', 'Counter-Strike 2', 'Brawl Stars'];

/** Section ids, in page order. */
export const SECTION_IDS = [
  'hero',
  'about',
  'projects',
  'skills',
  'interests',
  'quote',
  'contact',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];
