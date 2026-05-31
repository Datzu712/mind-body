import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FitColors as T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { keycloakConfig } from '@/lib/auth/config';
import { clearPendingAuthRequest, loadPendingAuthRequest } from '@/lib/auth/pending-auth';
import { type AuthSession, saveSession } from '@/lib/auth/session';

function getParam(value: string | string[] | undefined): string | null {
    if (Array.isArray(value)) return value[0] ?? null;
    return value ?? null;
}

export default function CallbackScreen() {
    const { code, state, error, error_description: errorDescription } = useLocalSearchParams();
    const { onSignedIn } = useAuth();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const hasStartedRef = useRef(false);

    useEffect(() => {
        if (hasStartedRef.current) return;
        hasStartedRef.current = true;

        const authCode = getParam(code);
        const authState = getParam(state);
        const authError = getParam(error);
        const authErrorDescription = getParam(errorDescription);

        async function completeSignIn() {
            if (authError) {
                await clearPendingAuthRequest();
                setErrorMessage(authErrorDescription || `Error de autenticacion: ${authError}`);
                return;
            }

            if (!authCode) {
                await clearPendingAuthRequest();
                setErrorMessage('No se recibio el codigo de autorizacion.');
                return;
            }

            const pendingRequest = await loadPendingAuthRequest();

            if (!pendingRequest?.codeVerifier) {
                setErrorMessage('No se encontro el verificador PKCE para completar el login.');
                return;
            }

            if (pendingRequest.state && authState && pendingRequest.state !== authState) {
                await clearPendingAuthRequest();
                setErrorMessage('El parametro state no coincide con la solicitud original.');
                return;
            }

            try {
                const response = await fetch(keycloakConfig.discovery.tokenEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        grant_type: 'authorization_code',
                        client_id: keycloakConfig.clientId,
                        redirect_uri: keycloakConfig.redirectUri,
                        code: authCode,
                        code_verifier: pendingRequest.codeVerifier,
                    }).toString(),
                });

                const data = await response.json();

                if (!response.ok || !data.access_token) {
                    console.error('[auth] token exchange failed:', JSON.stringify(data));
                    setErrorMessage('No se pudo completar el intercambio del token.');
                    return;
                }
                console.debug(data.access_token);

                const newSession: AuthSession = {
                    accessToken: data.access_token,
                    refreshToken: data.refresh_token,
                    expiresAt: Date.now() + data.expires_in * 1000,
                };

                await saveSession(newSession);
                await clearPendingAuthRequest();
                onSignedIn(newSession);
            } catch (exchangeError) {
                console.error('[auth] token exchange error:', exchangeError);
                setErrorMessage('Ocurrio un error al completar el login.');
            }
        }

        completeSignIn();
    }, [code, error, errorDescription, onSignedIn, state]);

    // Redirigir al login si hay error
    useEffect(() => {
        if (!errorMessage) return;

        const timeout = setTimeout(() => {
            router.replace('/(auth)/login');
        }, 2500);

        return () => clearTimeout(timeout);
    }, [errorMessage]);

    return (
        <View style={s.container}>
            {errorMessage ? (
                <>
                    <Ionicons name="warning" size={48} color={T.red} />
                    <Text style={s.errorText}>{errorMessage}</Text>
                    <Text style={s.redirectText}>Volviendo al inicio de sesion...</Text>
                </>
            ) : (
                <>
                    <ActivityIndicator size="large" color={T.yellow} />
                    <Text style={s.loadingText}>Completando inicio de sesion...</Text>
                </>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: T.bg,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
        gap: 16,
    },
    loadingText: {
        fontSize: 15,
        color: T.white,
        textAlign: 'center',
    },
    errorText: {
        fontSize: 15,
        color: T.red,
        textAlign: 'center',
        lineHeight: 22,
    },
    redirectText: {
        fontSize: 12,
        color: T.muted,
        textAlign: 'center',
    },
});
