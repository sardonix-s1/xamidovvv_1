/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Public URL of the deployed site (no trailing slash). Optional. */
  readonly VITE_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
