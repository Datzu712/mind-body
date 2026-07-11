import { router, Stack } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { FitColors as T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useInitiateAction } from '@/lib/auth/aia';
import { SettingsRow } from '@/components/ui/settings-row';
import { useHealthConnect } from '@/hooks/use-health-connect';
import { useManualSync } from '@/hooks/use-activity-sync';

export default function SettingsScreen() {
    const { signOut } = useAuth();
    const initiateAction = useInitiateAction();
    const hc = useHealthConnect();
    const { sync, isSyncing, lastResult, lastSyncLabel } = useManualSync();

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

                {/* Integraciones */}
                <Text style={s.sectionTitle}>INTEGRACIONES</Text>
                <View style={s.section}>
                    <SettingsRow
                        icon={hc.isConnected ? 'heart' : 'heart-outline'}
                        label="Health Connect"
                        accentColor={hc.isConnected ? T.green : T.muted}
                        onPress={hc.isConnected ? () => {} : hc.connect}
                        rightElement={
                            <View style={s.rowRight}>
                                {hc.isConnected && <Ionicons name="checkmark-circle" size={16} color={T.green} />}
                                <Text style={[s.rowStatus, { color: hc.isConnected ? T.green : T.muted }]}>
                                    {hc.isLoading ? 'Conectando...' : hc.isConnected ? 'Conectado' : 'Conectar'}
                                </Text>
                            </View>
                        }
                    />
                    {hc.isConnected && (
                        <SettingsRow
                            icon="sync-outline"
                            label="Sincronizar datos"
                            accentColor={T.blue}
                            onPress={isSyncing ? () => {} : sync}
                            rightElement={
                                <View style={s.syncRight}>
                                    <Text
                                        style={[
                                            s.rowStatus,
                                            {
                                                color:
                                                    lastResult === 'success'
                                                        ? T.green
                                                        : lastResult === 'error'
                                                          ? T.red
                                                          : T.blue,
                                            },
                                        ]}
                                    >
                                        {isSyncing
                                            ? 'Sincronizando...'
                                            : lastResult === 'success'
                                              ? 'Sincronizado'
                                              : lastResult === 'error'
                                                ? 'Error al sincronizar'
                                                : 'Sincronizar'}
                                    </Text>
                                    {lastSyncLabel && !isSyncing && !lastResult && (
                                        <Text style={s.lastSync}>{lastSyncLabel}</Text>
                                    )}
                                </View>
                            }
                        />
                    )}
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
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    syncRight: { alignItems: 'flex-end' },
    rowStatus: { fontSize: 12, fontWeight: '600' },
    lastSync: { fontSize: 10, color: T.muted, marginTop: 2 },
});
