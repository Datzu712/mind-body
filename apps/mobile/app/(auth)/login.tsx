import { useAuthRequest } from 'expo-auth-session';
import { useMemo, useState } from 'react';

const QUOTES = [
    'Ir al gym es mi manera favorita de ganar fuerza y perder excusas.',
    'El cuerpo logra lo que la mente cree.',
    'No se trata de ser el mejor. Se trata de ser mejor que ayer.',
    'El dolor que sientes hoy será la fuerza que sentirás mañana.',
    'Cada rep cuenta. Cada gota de sudor vale.',
    'Tu único límite eres tú.',
    'Entrena duro, come bien, duerme suficiente. Repite.',
    'La constancia hace más que la intensidad.',
    'El gym no es un castigo. Es un privilegio.',
    'Empezar es la parte más difícil. Ya empezaste.',
];

import { Platform } from 'react-native';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FitColors as T } from '@/constants/theme';
import { keycloakConfig } from '@/lib/auth/config';
import { keycloakAccountUrls } from '@/lib/auth/keycloak-account';
import { clearPendingAuthRequest, savePendingAuthRequest } from '@/lib/auth/pending-auth';

export default function LoginScreen() {
    const [isStartingAuth, setIsStartingAuth] = useState(false);
    const quote = useMemo(() => QUOTES[Math.floor(Math.random() * QUOTES.length)], []);

    const [request, , promptAsync] = useAuthRequest(
        {
            clientId: keycloakConfig.clientId,
            redirectUri: keycloakConfig.redirectUri,
            usePKCE: true,
            scopes: ['openid', 'profile', 'email', 'offline_access'],
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
                action: 'login',
            });

            const result = await promptAsync(
                Platform.OS === 'android'
                    ? { createTask: true, showInRecents: false, useProxyActivity: false }
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

    async function handleForgotPassword() {
        await WebBrowser.openBrowserAsync(keycloakAccountUrls.resetPassword);
    }

    const loading = !request || isStartingAuth;

    return (
        <SafeAreaView style={s.root}>
            {loading ? (
                <View style={s.loadingOverlay}>
                    <ActivityIndicator size="large" color={T.yellow} />
                </View>
            ) : (
                <View style={s.content}>
                    {/* Branding */}
                    <View style={s.brandWrap}>
                        <View style={s.logoBox}>
                            <Text style={s.logoText}>MAB</Text>
                        </View>
                        <Text style={s.appName}>MIND&amp;BODY</Text>
                        <Text style={s.appTagline}>"{quote}"</Text>
                    </View>

                    {/* Actions */}
                    <View style={s.actions}>
                        <TouchableOpacity style={s.loginBtn} onPress={handleLogin} activeOpacity={0.85}>
                            <Text style={s.loginBtnText}>INICIAR SESION</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={s.forgotBtn} onPress={handleForgotPassword} activeOpacity={0.7}>
                            <Text style={s.forgotBtnText}>Olvide mi contrasena</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: T.bg,
    },
    loadingOverlay: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 32,
        justifyContent: 'space-between',
        paddingTop: 80,
        paddingBottom: 48,
    },

    // Branding
    brandWrap: {
        alignItems: 'center',
        gap: 12,
    },
    logoBox: {
        width: 80,
        height: 80,
        borderRadius: 22,
        backgroundColor: T.yellow,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    logoText: {
        fontSize: 32,
        fontWeight: '900',
        color: T.bg,
        letterSpacing: -1,
    },
    appName: {
        fontSize: 28,
        fontWeight: '900',
        color: T.white,
        letterSpacing: 4,
    },
    appTagline: {
        fontSize: 13,
        color: T.muted,
        letterSpacing: 0.3,
    },

    // Actions
    actions: {
        gap: 12,
    },
    loginBtn: {
        backgroundColor: T.yellow,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
    },
    loginBtnText: {
        color: T.bg,
        fontSize: 15,
        fontWeight: '800',
        letterSpacing: 1.5,
    },
    forgotBtn: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    forgotBtnText: {
        color: T.muted,
        fontSize: 13,
        fontWeight: '500',
    },
});
