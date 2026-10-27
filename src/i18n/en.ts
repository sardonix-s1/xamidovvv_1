/** English UI strings and page content. The Russian dictionary (ru.ts) must match this shape. */
export const en = {
  meta: {
    title: 'Sardor — Xamidovvv · Building from ideas.',
    description:
      'Sardor, online as Xamidovvv. A personal corner of the internet: learning, technology, music, games, and building from ideas.',
    locale: 'en_US',
  },
  nav: {
    skip: 'Skip to content',
    label: 'Primary',
    home: 'Xamidovvv — back to the top',
    about: 'About',
    projects: 'Projects',
    skills: 'Skills',
    services: 'Work with me',
    now: 'Now',
    contact: 'Contact',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },
  lang: {
    label: 'Language',
    en: 'English',
    ru: 'Русский',
  },
  hero: {
    intro: 'A quiet corner of the internet for ideas in progress.',
    explore: 'Explore',
    contactLabel: 'Find me on',
  },
  about: {
    kicker: 'About',
    heading: 'Hello, I’m Sardor.',
    paragraphs: [
      'Online, I’m Xamidovvv — a video editor and a student developer.',
      'I’m still learning programming, and I use AI to turn my own ideas into reality, one project at a time.',
      'I’ve been editing video for a long time. I work for quality, not for views — and I love the real emotion on someone’s face when they see the result.',
    ],
    location: 'Qashqadaryo, Uzbekistan',
  },
  projects: {
    kicker: 'Projects',
    heading: 'Things in the making.',
    emptyTitle: 'Nothing here yet.',
    emptyBody: 'Projects will appear here as they take shape. For now, this space is left open.',
    visit: 'Open project',
  },
  skills: {
    kicker: 'Skills',
    heading: 'Tools & craft.',
    profiles: 'See the work on',
    emptyTitle: 'Not listed yet.',
    emptyBody: 'Skills will be added here when they’re ready.',
  },
  services: {
    kicker: 'Work with me',
    heading: 'What I can make for you.',
    items: [
      ['Video editing', 'Edits of any level, from short clips to polished videos.'],
      ['Websites', 'Personal and simple business sites, built with AI.'],
      ['Ideas into reality', 'Bring an idea — I’ll find a way to make it real.'],
    ] as [string, string][],
    note: 'Quality over speed: give me enough time and I’ll deliver something truly good.',
    faqTitle: 'Questions?',
    faq: 'Price, timing, how to order — message me on Telegram or Instagram.',
    cta: 'Write on Telegram',
  },
  now: {
    kicker: 'Right now',
    heading: 'Where I am headed.',
    items: [
      ['Studying', 'Dream Zone learning center — preparing for IELTS and SAT.'],
      ['Next year', 'Applying to university: New Uzbekistan University or Inha, with the goal of studying abroad.'],
      ['Building', 'Jarvis and the IELTS Speaking Coach.'],
    ] as [string, string][],
  },
  quote: {
    kicker: 'Direction',
    secondary: 'My own direction, at my own pace.',
    localized: '',
  },
  contact: {
    kicker: 'Contact',
    channels: 'Channels',
    heading: 'Say hi.',
    intro: 'The easiest way to reach me is through any of these.',
    open: 'Open {name} in a new tab',
    scanTitle: 'Take it with you',
    scanBody: 'Scan to open this page on another device, or copy the link.',
    qrAlt: 'QR code that opens this website',
    qrLoading: 'Generating QR code…',
    qrFailed: 'The QR code could not be generated. You can still copy the link.',
    qrLocal:
      'The QR code will appear once the site has a public address (see the README: VITE_SITE_URL).',
    urlLabel: 'Page address',
    copy: 'Copy link',
    copied: 'Link copied.',
    copyFailed: 'Couldn’t copy automatically. Select the address above and copy it manually.',
    share: 'Share',
    shared: 'Shared.',
    shareUnavailable: 'Sharing isn’t available here — copy the link or use Telegram.',
    shareFailed: 'Couldn’t open sharing. Copy the link or use Telegram instead.',
    shareText: 'Sardor — Xamidovvv. Building from ideas.',
    shareTelegram: 'Share via Telegram',
  },
  footer: {
    note: 'Built from ideas.',
    top: 'Back to top',
  },
};

export type Dictionary = typeof en;
