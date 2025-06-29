/// <reference types="vite/client" />

declare module '*.css' {
  const content: string;
  export default content;
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_CONNECTION_TIMEOUT: string
  readonly FAST_REFRESH: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
