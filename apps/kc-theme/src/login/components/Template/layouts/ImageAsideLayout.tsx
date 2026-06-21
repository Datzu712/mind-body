/**
 * This file has been claimed for ownership from @oussemasahbeni/keycloakify-login-shadcn version 250004.0.24.
 * To relinquish ownership and restore this file to its original content, run the following command:
 *
 * $ npx keycloakify own --path "login/components/Template/layouts/ImageAsideLayout.tsx" --revert
 */

import { Card, CardContent } from '@/components/ui/card';
import { resolveAssetUrl } from '@/login/shared/resolveAssetUrl';
import type { ReactNode } from 'react';
import { TemplateTopBar } from '../TemplateTopBar';

const DEFAULT_SIDE_IMAGE = resolveAssetUrl('%BASE_URL%/gym-bg.jpg');

export function ImageAsideLayout(props: { content: ReactNode; imageUrl?: string }) {
    const { content, imageUrl } = props;

    return (
        <main className="flex min-h-svh flex-col items-center justify-center p-6 md:p-10">
            <TemplateTopBar />
            <Card className="overflow-hidden p-0 w-full max-w-sm md:max-w-4xl">
                <CardContent className="grid p-0 md:grid-cols-2">
                    <div className="min-w-0">{content}</div>
                    <div className="relative hidden md:block h-full min-h-80 bg-muted">
                        <img
                            src={imageUrl || DEFAULT_SIDE_IMAGE}
                            alt="Authentication visual"
                            className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.7]"
                        />
                    </div>
                </CardContent>
            </Card>
        </main>
    );
}
