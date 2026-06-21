/**
 * This file has been claimed for ownership from @oussemasahbeni/keycloakify-login-shadcn version 250004.0.24.
 * To relinquish ownership and restore this file to its original content, run the following command:
 *
 * $ npx keycloakify own --path "login/KcContext.ts" --revert
 */

import { type ExtendKcContext, createUseKcContext } from '@keycloakify/login-ui/KcContext';
import type { KcEnvName, ThemeName } from '../kc.gen';

export type KcContextExtension = {
    themeName: ThemeName;
    properties: Record<KcEnvName, string> & {
        SHADCN_THEME_PRESET?: string;
        SHADCN_THEME_BASE?: string;
        SHADCN_THEME_RADIUS?: string;
        SHADCN_THEME_FONT?: string;
        SHADCN_THEME_LAYOUT?: string;
        SHADCN_THEME_LOGO_WHITE_URL?: string;
        SHADCN_THEME_LOGO_DARK_URL?: string;
        SHADCN_THEME_SIDE_IMAGE_URL?: string;
        SHADCN_THEME_PLACEHOLDER?: string;
    };
    // NOTE: Here you can declare more properties to extend the KcContext
    // See: https://docs.keycloakify.dev/faq-and-help/some-values-you-need-are-missing-from-in-kccontext
    client: {
        baseUrl?: string;
    };
    darkMode?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type KcContextExtensionPerPage = {};

export type KcContext = ExtendKcContext<KcContextExtension, KcContextExtensionPerPage>;

export const { useKcContext, KcContextProvider } = createUseKcContext<KcContext>();
