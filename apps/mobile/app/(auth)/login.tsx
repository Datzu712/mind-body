import { useAuthRequest } from 'expo-auth-session';
import { useState } from 'react';
import { Platform } from 'react-native';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { keycloakConfig } from '@/lib/auth/config';
import { clearPendingAuthRequest, savePendingAuthRequest } from '@/lib/auth/pending-auth';

export default function LoginScreen() {
    const [isStartingAuth, setIsStartingAuth] = useState(false);

    const [request, , promptAsync] = useAuthRequest(
        {
            clientId: keycloakConfig.clientId,
            redirectUri: keycloakConfig.redirectUri,
            usePKCE: true,
            scopes: ['openid', 'profile', 'email', 'offline_access'],
            extraParams: { prompt: 'login' },
        },
        keycloakConfig.discovery,
    );

    async function handleLogin() {
        if (!request?.codeVerifier) return;

        setIsStartingAuth(true);

        try {
            await savePendingAuthRequest({
                codeVerifier: request.codeVerifier,
                state: request.state ?? null,
            });

            const result = await promptAsync(
                Platform.OS === 'android'
                    ? {
                          createTask: true,
                          showInRecents: false,
                          useProxyActivity: false,
                      }
                    : undefined,
            );

            if (result.type !== 'success') {
                await clearPendingAuthRequest();
                setIsStartingAuth(false);
            }
        } catch (error) {
            await clearPendingAuthRequest();
            setIsStartingAuth(false);
            console.error('[auth] auth request error:', error);
        }
    }

    const loading = !request || isStartingAuth;

    return (
        <View style={styles.container}>
            {loading ? (
                <ActivityIndicator size="large" />
            ) : (
                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    <Text style={styles.buttonText}>Iniciar sesion</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    button: {
        backgroundColor: '#1a73e8',
        borderRadius: 8,
        paddingHorizontal: 32,
        paddingVertical: 14,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
