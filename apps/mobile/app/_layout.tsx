import 'react-native-reanimated';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { onlineManager } from '@tanstack/react-query';
import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Network from 'expo-network';
import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthProvider, useAuth } from '@/context/auth-context';
import { useEffect } from 'react';

const queryClient = new QueryClient();

let networkListenerRegistered = false;

function registerNetworkListener() {
    if (networkListenerRegistered) return;
    networkListenerRegistered = true;

    onlineManager.setEventListener((setOnline) => {
        let initialised = false;

        const eventSubscription = Network.addNetworkStateListener((state) => {
            initialised = true;
            setOnline(!!state.isConnected);
        });

        Network.getNetworkStateAsync()
            .then((state) => {
                if (!initialised) {
                    setOnline(!!state.isConnected);
                }
            })
            .catch(() => {
                // getNetworkStateAsync can reject on some platforms/SDK versions
            });

        return eventSubscription.remove;
    });
}

function warmUpBrowser() {
    WebBrowser.warmUpAsync().catch(() => {
        // Browser warm-up is opportunistic and unavailable on some targets.
    });
}

function coolDownBrowser() {
    WebBrowser.coolDownAsync().catch(() => {
        // Browser cool-down is also best-effort.
    });
}

export default function RootLayout() {
    useEffect(() => {
        registerNetworkListener();
        warmUpBrowser();

        return () => {
            coolDownBrowser();
        };
    }, []);

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ThemeProvider value={DarkTheme}>
                    <RootNavigator />
                    <StatusBar style="light" />
                </ThemeProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}

function RootNavigator() {
    const { isLoading, session } = useAuth();

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }} initialRouteName={session ? '(tabs)' : '(auth)'}>
            <Stack.Protected guard={!session}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="callback" options={{ headerShown: false }} />
            </Stack.Protected>

            <Stack.Protected guard={!!session}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(reservations)" options={{ headerShown: false }} />
                <Stack.Screen name="(settings)" options={{ headerShown: false }} />
                <Stack.Screen name="(measurements)" options={{ headerShown: false }} />
                <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
            </Stack.Protected>
        </Stack>
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
