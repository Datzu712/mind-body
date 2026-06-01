import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FitColors as T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useInitiateAction } from '@/lib/auth/aia';
import { SettingsRow } from '@/components/ui/settings-row';

export default function SettingsScreen() {
    const { signOut } = useAuth();
    const initiateAction = useInitiateAction();

    return (
        <SafeAreaView style={s.root} edges={['bottom']}>
            <Stack.Screen options={{ title: 'Configuracion' }} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Cuenta */}
                <Text style={s.sectionTitle}>CUENTA</Text>
                <View style={s.section}>
                    <SettingsRow
                        icon="person-outline"
                        label="Informacion Personal"
                        accentColor={T.yellow}
                        onPress={() => router.push('/(settings)/personal-info')}
                    />
                    <SettingsRow
                        icon="lock-closed-outline"
                        label="Cambiar contrasena"
                        accentColor={T.blue}
                        onPress={() => initiateAction('UPDATE_PASSWORD')}
                    />
                    <SettingsRow
                        icon="shield-checkmark-outline"
                        label="Autenticacion en dos pasos"
                        accentColor={T.green}
                        onPress={() => initiateAction('CONFIGURE_TOTP')}
                    />
                </View>

                {/* Sesion */}
                <Text style={s.sectionTitle}>SESION</Text>
                <View style={s.section}>
                    <SettingsRow
                        icon="power-outline"
                        label="Cerrar sesion"
                        accentColor={T.red}
                        onPress={signOut}
                        rightElement={null}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingHorizontal: 20, paddingBottom: 32 },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: T.muted,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginTop: 24,
        marginBottom: 8,
    },
    section: { gap: 6 },
});
