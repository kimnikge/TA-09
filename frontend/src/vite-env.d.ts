/// <reference types="vite/client" />
/// <reference types="react" />
/// <reference types="react-dom" />

declare module '*.css' {
  const content: string;
  export default content;
}

declare module 'react/jsx-runtime' {
  export * from 'react/jsx-runtime';
}

declare module 'react/jsx-dev-runtime' {
  export * from 'react/jsx-dev-runtime';
}

// Явно определяем глобальные JSX типы
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
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
