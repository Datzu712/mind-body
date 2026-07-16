import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { FitColors as T } from '@/constants/theme';
import { ScreenHeader } from '@/components/reservations/ScreenHeader';
import { ReservationStatusBadge } from '@/components/reservations/ReservationStatusBadge';
import { ReservationActionButton } from '@/components/reservations/ReservationActionButton';
import { ReservationStateCard } from '@/components/reservations/ReservationStateCard';
import { ReservationEmptyState } from '@/components/reservations/ReservationEmptyState';
import { useCancelReservation, useMyReservations, type ReservationView } from '@/lib/api/reservations';

type TabKey = 'proximas' | 'historial';

/** Feedback local de cancelación (se captura antes de que el refetch mueva la fila). */
type CancelBanner = { result: 'plazo' | 'tardia' | 'error'; className: string; dateLabel: string; message?: string };

export default function MyReservationsScreen() {
    const [tab, setTab] = useState<TabKey>('proximas');
    const [banners, setBanners] = useState<Record<string, CancelBanner>>({});

    const scope = tab === 'proximas' ? 'UPCOMING' : 'HISTORY';
    const { data: list = [], isLoading, isError, refetch } = useMyReservations(scope);
    const cancelReservation = useCancelReservation();

    const handleCancel = (r: ReservationView) => {
        cancelReservation.mutate(r.id, {
            onSuccess: ({ registeredAsNoShow }) =>
                setBanners((prev) => ({
                    ...prev,
                    [r.id]: {
                        result: registeredAsNoShow ? 'tardia' : 'plazo',
                        className: r.className,
                        dateLabel: r.dateLabel,
                    },
                })),
            onError: (error) =>
                setBanners((prev) => ({
                    ...prev,
                    [r.id]: {
                        result: 'error',
                        className: r.className,
                        dateLabel: r.dateLabel,
                        message: error instanceof Error ? error.message : 'No se pudo cancelar la reserva',
                    },
                })),
        });
    };

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
                {tab === 'proximas' && Object.keys(banners).length > 0 && (
                    <View style={[s.px, { gap: 10, marginBottom: 6 }]}>
                        {Object.entries(banners).map(([id, banner]) =>
                            banner.result === 'plazo' ? (
                                <ReservationStateCard
                                    key={id}
                                    variant="cancelacion-plazo"
                                    title="Reserva cancelada con éxito"
                                    message={`${banner.className} · ${banner.dateLabel}`}
                                    detail="Cancelación dentro del plazo. No se aplicó penalización."
                                />
                            ) : banner.result === 'tardia' ? (
                                <ReservationStateCard
                                    key={id}
                                    variant="cancelacion-tardia"
                                    title="Cancelación fuera de plazo"
                                    message={`${banner.className} · ${banner.dateLabel}`}
                                    detail="Quedó registrada como inasistencia por cancelación tardía."
                                />
                            ) : (
                                <ReservationStateCard
                                    key={id}
                                    variant="sin-cupos"
                                    title="No se pudo cancelar"
                                    message={`${banner.className} · ${banner.dateLabel}`}
                                    detail={banner.message}
                                />
                            ),
                        )}
                    </View>
                )}

                {/* List */}
                {isLoading ? (
                    <View style={s.loading}>
                        <ActivityIndicator color={T.yellow} />
                    </View>
                ) : isError ? (
                    <ReservationEmptyState
                        icon="cloud-offline-outline"
                        title="No pudimos cargar tus reservas"
                        message="Revisa tu conexión e inténtalo de nuevo."
                        actionLabel="Reintentar"
                        onAction={() => void refetch()}
                    />
                ) : list.length === 0 ? (
                    <ReservationEmptyState
                        title={tab === 'proximas' ? 'No tienes clases programadas' : 'Aún no hay historial'}
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
                                        <Text style={s.className}>{r.className}</Text>
                                        <View style={s.metaRow}>
                                            <Ionicons name="person-outline" size={12} color={T.muted} />
                                            <Text style={s.meta}>
                                                {r.trainer}
                                                {r.room ? ` · ${r.room}` : ''}
                                            </Text>
                                        </View>
                                        <View style={[s.metaRow, { marginTop: 3 }]}>
                                            <Ionicons name="time-outline" size={12} color={T.muted} />
                                            <Text style={s.meta}>{r.time}</Text>
                                        </View>
                                    </View>
                                    <ReservationStatusBadge variant={r.status} sm />
                                </View>

                                {/* Actions only for upcoming, active reservations */}
                                {tab === 'proximas' && (r.status === 'confirmada' || r.status === 'reprogramada') && (
                                    <View style={s.actions}>
                                        <ReservationActionButton
                                            label="Reprogramar"
                                            variant="secondary"
                                            icon="calendar-outline"
                                            style={s.actionButton}
                                            onPress={() =>
                                                // La ruta existe pero el union tipado de expo-router se regenera
                                                // hasta el próximo `expo start`.
                                                router.push({
                                                    pathname: '/(reservations)/reschedule',
                                                    params: { reservationId: r.id, className: r.className },
                                                } as never)
                                            }
                                        />
                                        <ReservationActionButton
                                            label={cancelReservation.isPending ? 'Cancelando…' : 'Cancelar'}
                                            variant="danger"
                                            icon="close"
                                            style={s.actionButton}
                                            onPress={cancelReservation.isPending ? undefined : () => handleCancel(r)}
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
                                                    params: { id: r.sessionId },
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
    loading: { paddingVertical: 40, alignItems: 'center' },

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
    actionButton: {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: 0,
        minHeight: 44,
        paddingHorizontal: 10,
    },
});
