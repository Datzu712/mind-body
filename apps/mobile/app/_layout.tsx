import 'react-native-reanimated';

import { DarkTheme, ThemeProvider } from 'expo-router/react-navigation';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AuthProvider } from '@/context/auth-context';
import { useAuth } from '@/context/auth-context';
import { useEffect } from 'react';

export default function RootLayout() {
    useEffect(() => {
        WebBrowser.warmUpAsync();

        return () => {
            WebBrowser.coolDownAsync();
        };
    }, []);

    return (
        <AuthProvider>
            <ThemeProvider value={DarkTheme}>
                <RootNavigator />
                <StatusBar style="light" />
            </ThemeProvider>
        </AuthProvider>
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
        <Stack>
            <Stack.Protected guard={!session}>
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="callback" options={{ headerShown: false }} />
            </Stack.Protected>

            <Stack.Protected guard={!!session}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
