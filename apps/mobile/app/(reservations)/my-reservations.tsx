import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { FitColors as T } from '@/constants/theme';
import { ScreenHeader } from '@/components/reservations/ScreenHeader';
import { ReservationStatusBadge } from '@/components/reservations/ReservationStatusBadge';
import { ReservationActionButton } from '@/components/reservations/ReservationActionButton';
import { ReservationStateCard } from '@/components/reservations/ReservationStateCard';
import { ReservationEmptyState } from '@/components/reservations/ReservationEmptyState';
import { MOCK_UPCOMING, MOCK_HISTORY, type UserReservation } from '@/components/reservations/mock-reservations';

type TabKey = 'proximas' | 'historial';

/** Local cancellation feedback keyed by reservation id. */
type CancelResult = 'plazo' | 'tardia';

export default function MyReservationsScreen() {
    const [tab, setTab] = useState<TabKey>('proximas');
    const [cancelled, setCancelled] = useState<Record<string, CancelResult>>({});

    const upcoming = useMemo(() => MOCK_UPCOMING.filter((r) => !cancelled[r.id]), [cancelled]);
    const list = tab === 'proximas' ? upcoming : MOCK_HISTORY;

    const handleCancel = (r: UserReservation) =>
        setCancelled((prev) => ({ ...prev, [r.id]: r.cancelableInWindow ? 'plazo' : 'tardia' }));

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScreenHeader title="Mis reservas" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Segmented tabs */}
                <View style={s.segment}>
                    {(['proximas', 'historial'] as TabKey[]).map((key) => {
                        const on = tab === key;
                        return (
                            <TouchableOpacity
                                key={key}
                                onPress={() => setTab(key)}
                                activeOpacity={0.85}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: on }}
                                style={[s.segBtn, on && s.segBtnOn]}
                            >
                                <Text style={[s.segText, on && s.segTextOn]}>
                                    {key === 'proximas' ? 'Próximas' : 'Historial'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Cancellation feedback banners */}
                {tab === 'proximas' && Object.keys(cancelled).length > 0 && (
                    <View style={[s.px, { gap: 10, marginBottom: 6 }]}>
                        {Object.entries(cancelled).map(([id, result]) => {
                            const r = MOCK_UPCOMING.find((x) => x.id === id);
                            if (!r) return null;
                            return result === 'plazo' ? (
                                <ReservationStateCard
                                    key={id}
                                    variant="cancelacion-plazo"
                                    title="Reserva cancelada con éxito"
                                    message={`${r.class.name} · ${r.dateLabel}`}
                                    detail="Cancelación dentro del plazo. No se aplicó penalización."
                                />
                            ) : (
                                <ReservationStateCard
                                    key={id}
                                    variant="cancelacion-tardia"
                                    title="Cancelación fuera de plazo"
                                    message={`${r.class.name} · ${r.dateLabel}`}
                                    detail="Se aplicó una penalización por cancelación tardía."
                                />
                            );
                        })}
                    </View>
                )}

                {/* List */}
                {list.length === 0 ? (
                    <ReservationEmptyState
                        title="No tienes clases programadas"
                        message="Explora las clases disponibles y reserva tu próximo cupo."
                        actionLabel="Explorar clases"
                        onAction={() => router.replace('/(tabs)/reservations')}
                    />
                ) : (
                    <View style={[s.px, { gap: 12 }]}>
                        {list.map((r) => (
                            <View key={r.id} style={s.card}>
                                <View style={s.cardTop}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={s.dateLabel}>{r.dateLabel}</Text>
                                        <Text style={s.className}>{r.class.name}</Text>
                                        <View style={s.metaRow}>
                                            <Ionicons name="person-outline" size={12} color={T.muted} />
                                            <Text style={s.meta}>
                                                {r.class.trainer} · {r.class.room}
                                            </Text>
                                        </View>
                                        <View style={[s.metaRow, { marginTop: 3 }]}>
                                            <Ionicons name="time-outline" size={12} color={T.muted} />
                                            <Text style={s.meta}>{r.class.time}</Text>
                                        </View>
                                    </View>
                                    <ReservationStatusBadge variant={r.status} sm />
                                </View>

                                {/* Actions only for upcoming, active reservations */}
                                {tab === 'proximas' && r.status !== 'cancelada' && (
                                    <View style={s.actions}>
                                        <ReservationActionButton
                                            label="Reprogramar"
                                            variant="secondary"
                                            icon="calendar-outline"
                                            compact
                                            onPress={() =>
                                                router.push({
                                                    pathname: '/(reservations)/class-detail',
                                                    params: { id: r.class.id },
                                                })
                                            }
                                        />
                                        <ReservationActionButton
                                            label="Cancelar"
                                            variant="danger"
                                            icon="close"
                                            compact
                                            onPress={() => handleCancel(r)}
                                        />
                                    </View>
                                )}
                                {tab === 'historial' && (
                                    <View style={s.actions}>
                                        <ReservationActionButton
                                            label="Ver detalle"
                                            variant="secondary"
                                            icon="chevron-forward"
                                            compact
                                            onPress={() =>
                                                router.push({
                                                    pathname: '/(reservations)/class-detail',
                                                    params: { id: r.class.id },
                                                })
                                            }
                                        />
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingBottom: 32, paddingTop: 4 },
    px: { paddingHorizontal: 20 },

    segment: {
        flexDirection: 'row',
        gap: 6,
        backgroundColor: T.card2,
        borderRadius: 12,
        padding: 4,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    segBtn: { flex: 1, height: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    segBtnOn: { backgroundColor: T.yellow },
    segText: { fontSize: 13, fontWeight: '800', color: T.muted },
    segTextOn: { color: T.bg },

    card: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
        gap: 12,
    },
    cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    dateLabel: { fontSize: 10, fontWeight: '800', color: T.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
    className: { fontSize: 16, fontWeight: '900', color: T.white, marginTop: 4 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 },
    meta: { fontSize: 12, color: T.muted, fontWeight: '600' },
    actions: { flexDirection: 'row', gap: 10 },
});
