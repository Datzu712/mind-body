import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { revokeKeycloakSession } from '@/lib/auth/keycloak-account';
import { type AuthSession, clearSession, loadSession, saveSession } from '@/lib/auth/session';
import { type AuthUser, extractUserFromToken } from '@/lib/auth/token-claims';
import { isExpiringSoon, refreshSession } from '@/lib/auth/token-refresh';

interface AuthContextValue {
    session: AuthSession | null;
    user: AuthUser | null;
    isLoading: boolean;
    onSignedIn: (session: AuthSession) => void;
    signOut: () => Promise<void>;
}

WebBrowser.maybeCompleteAuthSession();

const AuthContext = createContext<AuthContextValue | null>(null);
const REFRESH_INTERVAL_MS = 60 * 1000; // check every 60s

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<AuthSession | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const refreshTimerRef = useRef<number | null>(null);

    const doSignOut = useCallback(async () => {
        if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
            refreshTimerRef.current = null;
        }

        const currentSession = session;
        if (currentSession) {
            try {
                await revokeKeycloakSession(currentSession.refreshToken);
            } catch (e) {
                console.warn('[auth] keycloak logout failed:', e);
            }
        }

        await WebBrowser.coolDownAsync();
        await clearSession();
        setSession(null);
        setUser(null);

        router.replace('/(auth)/login');
    }, [session]);

    const startRefreshTimer = useCallback(
        (currentSession: AuthSession) => {
            if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);

            refreshTimerRef.current = setInterval(async () => {
                if (!isExpiringSoon(currentSession)) return;

                try {
                    const refreshed = await refreshSession(currentSession);
                    await saveSession(refreshed);
                    setSession(refreshed);
                    setUser(extractUserFromToken(refreshed.accessToken));
                    startRefreshTimer(refreshed);
                } catch {
                    await doSignOut();
                }
            }, REFRESH_INTERVAL_MS);
        },
        [doSignOut],
    );

    const applySession = useCallback(
        (nextSession: AuthSession) => {
            setSession(nextSession);
            setUser(extractUserFromToken(nextSession.accessToken));
            startRefreshTimer(nextSession);
        },
        [startRefreshTimer],
    );

    const onSignedIn = useCallback(
        (newSession: AuthSession) => {
            applySession(newSession);
            router.replace('/(tabs)');
        },
        [applySession],
    );

    // Restore session on mount
    useEffect(() => {
        loadSession()
            .then(async (saved) => {
                if (!saved) return;

                try {
                    if (isExpiringSoon(saved)) {
                        const refreshed = await refreshSession(saved);
                        await saveSession(refreshed);
                        applySession(refreshed);
                        return;
                    }

                    applySession(saved);
                } catch {
                    await clearSession();
                }
            })
            .finally(() => setIsLoading(false));

        return () => {
            if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
        };
    }, [applySession]);

    return (
        <AuthContext.Provider value={{ session, user, isLoading, onSignedIn, signOut: doSignOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
