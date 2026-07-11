import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { TanStackDevtools } from '@tanstack/react-devtools';
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools';
import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools';

import { routeTree } from './routeTree.gen';
import { queryClient } from './routes/__root';
import './globals.css';

const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    context: { queryClient },
});

const rootElement = document.getElementById('root')!;

if (!rootElement.innerHTML) {
    createRoot(rootElement).render(
        <StrictMode>
            <RouterProvider router={router} />

            <TanStackDevtools
                config={{ position: 'bottom-right' }}
                plugins={[
                    {
                        name: 'TanStack Router',
                        render: <TanStackRouterDevtoolsPanel router={router} />,
                    },
                    {
                        name: 'TanStack Query',
                        render: <ReactQueryDevtoolsPanel client={queryClient} />,
                    },
                ]}
            />
        </StrictMode>,
    );
}
