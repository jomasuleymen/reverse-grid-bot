/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    VITE_APP_NODE_ENV: string
    VITE_APP_TITLE: string
    // More environment variables...
  }

  interface Route {
    path: string
    element: JSX.Element
    children: Route[]
  }
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

export { }

