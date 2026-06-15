import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';

import { routeTree } from './routeTree.gen';
import './globals.css';

const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
});

const rootElement = document.getElementById('root')!;

if (!rootElement.innerHTML) {
    createRoot(rootElement).render(
        <StrictMode>
            <RouterProvider router={router} />
        </StrictMode>,
    );
}
