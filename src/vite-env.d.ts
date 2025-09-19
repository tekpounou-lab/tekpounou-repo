/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GA_TRACKING_ID: string
    // add more env vars here...
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
  