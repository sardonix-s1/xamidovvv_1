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

export const projects: readonly Project[] = [
  {
    id: 'ielts-coach',
    name: { en: 'IELTS Speaking Coach', ru: 'IELTS Speaking Coach' },
    description: {
      en: 'A speaking-practice tool for IELTS, built together with Claude.',
      ru: 'Инструмент для тренировки устной части IELTS, сделан вместе с Claude.',
    },
    url: 'https://ieltsspeaking-coach.netlify.app',
    status: {
      en: 'Not released yet — maybe in about 2 weeks',
      ru: 'Ещё не выпущен — возможно, примерно через 2 недели',
    },
  },
  {
    id: 'jarvis',
    name: { en: 'Jarvis', ru: 'Jarvis' },
    description: {
      en: 'An AI assistant on my own PC that does everything I want — and a childhood dream of mine.',
      ru: 'ИИ-ассистент на моём компьютере, который делает всё, что мне нужно, — и моя детская мечта.',
    },
    status: { en: 'In progress · no public link', ru: 'В работе · публичной ссылки нет' },
  },
];

/**
 * SKILLS — only things the owner has confirmed. Each group has a title, a list of
 * items, an optional note and optional links to the profiles where the work lives.
 * Example group:
 *
 *   { id: 'web', title: { en: 'Web', ru: 'Веб' }, items: [{ en: 'HTML', ru: 'HTML' }] },
 */
export interface SkillGroup {
  id: string;
  title: Localized;
  items: Localized[];
  note?: Localized;
  /** which of the social profiles show this group's work */
  profiles?: SocialLink['id'][];
  /** short sample videos stored in /public/video */
  samples?: { src: string; poster: string; title: Localized }[];
}

export const skills: readonly SkillGroup[] = [
  {
    id: 'video',
    title: { en: 'Video editing', ru: 'Видеомонтаж' },
    items: [
      { en: 'CapCut on phone', ru: 'CapCut на телефоне' },
      { en: 'CapCut on PC', ru: 'CapCut на ПК' },
    ],
    note: {
      en: 'Solid experience on both. Plenty of my edits are on my Instagram and TikTok.',
      ru: 'Хороший опыт и там, и там. Много моих работ — в Instagram и TikTok.',
    },
    profiles: ['instagram', 'tiktok'],
    samples: [
      {
        src: '/video/edit-1.mp4',
        poster: '/video/edit-1.jpg',
        title: { en: 'Edit sample', ru: 'Пример монтажа' },
      },
    ],
  },
  {
    id: 'dev',
    title: { en: 'Development', ru: 'Разработка' },
    items: [
      { en: 'Learning C++', ru: 'Изучаю C++' },
      { en: 'Building with AI (Claude)', ru: 'Создаю с помощью ИИ (Claude)' },
    ],
    note: {
      en: 'Still a student of programming — AI helps me turn my ideas into working things.',
      ru: 'Я ещё учусь программированию — ИИ помогает превращать мои идеи в рабочие вещи.',
    },
  },
  {
    id: 'tools',
    title: { en: 'Tools', ru: 'Инструменты' },
    items: [
      { en: 'CapCut', ru: 'CapCut' },
      { en: 'Claude', ru: 'Claude' },
    ],
    note: {
      en: 'Next up: DaVinci Resolve.',
      ru: 'Дальше — DaVinci Resolve.',
    },
  },
];

/** Section ids, in page order. */
export const SECTION_IDS = [
  'hero',
  'quote',
  'about',
  'projects',
  'skills',
  'services',
  'now',
  'contact',
] as const;
export type SectionId = (typeof SECTION_IDS)[number];
