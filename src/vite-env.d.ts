/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the SmartDine API. Defaults to the local dev server. */
  readonly VITE_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
