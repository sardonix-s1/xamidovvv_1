import { defineConfig, loadEnv, type HtmlTagDescriptor, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Adds absolute og:url / og:image / canonical tags only when the public URL is known
 * (VITE_SITE_URL). Without it nothing fake is inserted — see README.
 */
function socialMeta(siteUrl: string): Plugin {
  return {
    name: 'xamidovvv-social-meta',
    transformIndexHtml() {
      const base = siteUrl.trim().replace(/\/+$/, '');
      if (!/^https?:\/\//i.test(base)) return [];
      const meta = (attrs: Record<string, string>): HtmlTagDescriptor => ({
        tag: 'meta',
        attrs,
        injectTo: 'head',
      });
      return [
        { tag: 'link', attrs: { rel: 'canonical', href: `${base}/` }, injectTo: 'head' },
        meta({ property: 'og:url', content: `${base}/` }),
        meta({ property: 'og:image', content: `${base}/og.png` }),
        meta({ name: 'twitter:image', content: `${base}/og.png` }),
        meta({ property: 'og:image:width', content: '1200' }),
        meta({ property: 'og:image:height', content: '630' }),
        meta({ property: 'og:image:alt', content: 'Sardor — Xamidovvv. Building from ideas.' }),
      ];
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  return {
    plugins: [react(), socialMeta(env.VITE_SITE_URL ?? '')],
    build: { target: 'es2020', sourcemap: false },
  };
});
