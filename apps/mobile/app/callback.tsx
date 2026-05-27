import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

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
    const [message, setMessage] = useState('Completando inicio de sesion...');
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
                setMessage(authErrorDescription || `Error de autenticacion: ${authError}`);
                return;
            }

            if (!authCode) {
                await clearPendingAuthRequest();
                setMessage('No se recibio el codigo de autorizacion.');
                return;
            }

            const pendingRequest = await loadPendingAuthRequest();

            if (!pendingRequest?.codeVerifier) {
                setMessage('No se encontro el verificador PKCE para completar el login.');
                return;
            }

            if (pendingRequest.state && authState && pendingRequest.state !== authState) {
                await clearPendingAuthRequest();
                setMessage('El parametro state no coincide con la solicitud original.');
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
                    setMessage('No se pudo completar el intercambio del token.');
                    return;
                }

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
                setMessage('Ocurrio un error al completar el login.');
            }
        }

        completeSignIn();
    }, [code, error, errorDescription, onSignedIn, state]);

    useEffect(() => {
        if (message === 'Completando inicio de sesion...') return;

        const timeout = setTimeout(() => {
            router.replace('/(auth)/login');
        }, 2500);

        return () => clearTimeout(timeout);
    }, [message]);

    return (
        <View style={styles.container}>
            {message === 'Completando inicio de sesion...' ? <ActivityIndicator size="large" /> : null}
            <Text style={styles.text}>{message}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
        gap: 16,
    },
    text: {
        fontSize: 16,
        textAlign: 'center',
    },
});
