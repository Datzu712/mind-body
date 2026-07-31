/// <reference types="vite/client" />

interface ImportMetaEnv {
    /** API origin used in production builds (dev goes through the Vite proxy). */
    readonly VITE_API_BASE_URL?: string;
}
