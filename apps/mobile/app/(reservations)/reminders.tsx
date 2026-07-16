import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { FitColors as T } from '@/constants/theme';
import { ScreenHeader } from '@/components/reservations/ScreenHeader';
import { ReminderToggleRow } from '@/components/reservations/ReminderToggleRow';

// Preferencias locales de recordatorio (la entrega de notificaciones aún no
// tiene backend; estas opciones se persistirán cuando exista ese servicio).
type ReminderAnticipation = '15min' | '1h' | '24h';

const DEFAULT_REMINDER_PREFS = { push: true, email: true, anticipation: '1h' as ReminderAnticipation };

const ANTICIPATION_OPTIONS: { value: ReminderAnticipation; label: string }[] = [
    { value: '15min', label: '15 min' },
    { value: '1h', label: '1 hora' },
    { value: '24h', label: '24 horas' },
];

export default function RemindersScreen() {
    const [push, setPush] = useState(DEFAULT_REMINDER_PREFS.push);
    const [email, setEmail] = useState(DEFAULT_REMINDER_PREFS.email);
    const [anticipation, setAnticipation] = useState<ReminderAnticipation>(DEFAULT_REMINDER_PREFS.anticipation);
    const [saved, setSaved] = useState(false);

    /** Any control change surfaces a transient "changes applied" confirmation. */
    const flagSaved = () => setSaved(true);

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScreenHeader title="Recordatorios" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Channels */}
                <View style={s.px}>
                    <Text style={s.secTitle}>CANALES DE NOTIFICACIÓN</Text>
                    <Text style={s.secSub}>Elige por dónde quieres recibir los recordatorios de tus clases.</Text>
                    <View style={s.card}>
                        <ReminderToggleRow
                            icon="notifications-outline"
                            label="Push"
                            sub="Notificaciones en la app"
                            value={push}
                            onValueChange={(v) => {
                                setPush(v);
                                flagSaved();
                            }}
                        />
                        <View style={s.divider} />
                        <ReminderToggleRow
                            icon="mail-outline"
                            label="Correo electrónico"
                            sub="En tu correo registrado"
                            value={email}
                            onValueChange={(v) => {
                                setEmail(v);
                                flagSaved();
                            }}
                        />
                    </View>
                </View>

                {/* Anticipation */}
                <View style={[s.px, { marginTop: 22 }]}>
                    <Text style={s.secTitle}>¿CUÁNDO QUIERES RECIBIRLOS?</Text>
                    <Text style={s.secSub}>Selecciona con cuánta anticipación.</Text>
                    <View style={s.chipRow}>
                        {ANTICIPATION_OPTIONS.map((opt) => {
                            const on = anticipation === opt.value;
                            return (
                                <TouchableOpacity
                                    key={opt.value}
                                    onPress={() => {
                                        setAnticipation(opt.value);
                                        flagSaved();
                                    }}
                                    activeOpacity={0.85}
                                    accessibilityRole="radio"
                                    accessibilityState={{ selected: on }}
                                    accessibilityLabel={`Anticipación ${opt.label}`}
                                    style={[s.chip, on ? s.chipOn : s.chipOff]}
                                >
                                    <Text style={[s.chipText, on ? s.chipTextOn : s.chipTextOff]}>{opt.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Note */}
                <View style={[s.px, { marginTop: 22 }]}>
                    <View style={s.note}>
                        <Ionicons name="information-circle-outline" size={18} color={T.blue} />
                        <Text style={s.noteText}>Si cancelas tu reserva, no se enviará ningún recordatorio.</Text>
                    </View>
                </View>

                {/* Saved confirmation */}
                {saved && (
                    <View style={[s.px, { marginTop: 18 }]}>
                        <View style={s.savedBanner}>
                            <Ionicons name="checkmark-circle" size={18} color={T.green} />
                            <Text style={s.savedText}>Cambios aplicados</Text>
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingBottom: 32, paddingTop: 8 },
    px: { paddingHorizontal: 20 },

    secTitle: { fontSize: 12, fontWeight: '800', color: T.white, letterSpacing: 1.2, textTransform: 'uppercase' },
    secSub: { fontSize: 13, color: T.muted, marginTop: 4, marginBottom: 12, lineHeight: 18 },

    card: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: T.border, marginVertical: 4 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
        minHeight: 44,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipOn: { backgroundColor: T.yellow, borderColor: T.yellow },
    chipOff: { backgroundColor: T.card2, borderColor: T.border },
    chipText: { fontSize: 13, fontWeight: '800' },
    chipTextOn: { color: T.bg },
    chipTextOff: { color: T.muted },

    note: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        backgroundColor: T.blue + '14',
        borderColor: T.blue + '44',
        borderWidth: 1,
        borderRadius: 12,
        padding: 12,
    },
    noteText: { flex: 1, fontSize: 13, color: T.white, lineHeight: 18 },

    savedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'flex-start',
        backgroundColor: T.green + '22',
        borderColor: T.green + '55',
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    savedText: { fontSize: 13, fontWeight: '800', color: T.green },
});
