import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { FitColors as T } from '@/constants/theme';
import { ScreenHeader } from '@/components/reservations/ScreenHeader';
import { ReservationEmptyState } from '@/components/reservations/ReservationEmptyState';
import { ReservationStateCard } from '@/components/reservations/ReservationStateCard';
import { ReservationStatusBadge } from '@/components/reservations/ReservationStatusBadge';
import { hasLowSpots, useRescheduleOptions, useRescheduleReservation, type GymSession } from '@/lib/api/reservations';

/**
 * Reprogramación de una reserva: lista las sesiones alternativas (misma clase,
 * futuras, con cupo) que ofrece el backend y confirma el cambio en un tap.
 */
export default function RescheduleScreen() {
    const params = useLocalSearchParams<{ reservationId?: string; className?: string }>();
    const reservationId = Array.isArray(params.reservationId) ? params.reservationId[0] : params.reservationId;
    const className = Array.isArray(params.className) ? params.className[0] : params.className;

    const { data: options = [], isLoading, isError, refetch } = useRescheduleOptions(reservationId);
    const reschedule = useRescheduleReservation();
    const [error, setError] = useState<string | null>(null);
    const [confirmedTo, setConfirmedTo] = useState<GymSession | null>(null);

    const handlePick = (option: GymSession) => {
        if (!reservationId || reschedule.isPending) return;
        setError(null);
        reschedule.mutate(
            { reservationId, targetSessionId: option.id },
            {
                onSuccess: () => setConfirmedTo(option),
                onError: (e) => setError(e instanceof Error ? e.message : 'No se pudo reprogramar'),
            },
        );
    };

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScreenHeader title="Reprogramar reserva" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                <View style={s.px}>
                    <Text style={s.subtitle}>
                        {className ? `Elige un nuevo horario para ${className}.` : 'Elige un nuevo horario.'}
                    </Text>
                </View>

                {confirmedTo ? (
                    <View style={[s.px, { marginTop: 16 }]}>
                        <ReservationStateCard
                            variant="exito"
                            title="¡Reserva reprogramada!"
                            message={`${confirmedTo.name} · ${confirmedTo.time}`}
                            detail={confirmedTo.dateLabel}
                            actionLabel="Volver a Mis reservas"
                            onAction={() => router.back()}
                        />
                    </View>
                ) : isLoading ? (
                    <View style={s.loading}>
                        <ActivityIndicator color={T.yellow} />
                    </View>
                ) : isError ? (
                    <ReservationEmptyState
                        icon="cloud-offline-outline"
                        title="No pudimos cargar los horarios"
                        message="Revisa tu conexión e inténtalo de nuevo."
                        actionLabel="Reintentar"
                        onAction={() => void refetch()}
                    />
                ) : options.length === 0 ? (
                    <ReservationEmptyState
                        icon="calendar-outline"
                        title="Sin horarios alternativos"
                        message="No hay otras sesiones de esta clase con cupo disponible por ahora."
                        actionLabel="Volver"
                        onAction={() => router.back()}
                    />
                ) : (
                    <View style={[s.px, { gap: 10, marginTop: 16 }]}>
                        {error && (
                            <ReservationStateCard variant="sin-cupos" title="No se pudo reprogramar" message={error} />
                        )}
                        {options.map((option) => (
                            <TouchableOpacity
                                key={option.id}
                                activeOpacity={0.85}
                                onPress={() => handlePick(option)}
                                accessibilityRole="button"
                                accessibilityLabel={`Reprogramar al ${option.dateLabel} ${option.time}`}
                                style={s.option}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={s.optionDate}>{option.dateLabel}</Text>
                                    <Text style={s.optionTime}>{option.time}</Text>
                                    <Text style={s.optionMeta}>{option.trainer}</Text>
                                </View>
                                <View style={s.optionRight}>
                                    <ReservationStatusBadge
                                        variant={hasLowSpots(option) ? 'pocos-cupos' : 'disponible'}
                                        label={`${option.spotsLeft} cupos`}
                                        sm
                                    />
                                    {reschedule.isPending ? (
                                        <ActivityIndicator size="small" color={T.yellow} />
                                    ) : (
                                        <Ionicons name="chevron-forward" size={18} color={T.muted} />
                                    )}
                                </View>
                            </TouchableOpacity>
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

    subtitle: { fontSize: 13, color: T.muted, fontWeight: '600' },

    option: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: T.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
    },
    optionDate: { fontSize: 11, fontWeight: '800', color: T.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
    optionTime: { fontSize: 16, fontWeight: '900', color: T.white, marginTop: 3 },
    optionMeta: { fontSize: 12, color: T.muted, fontWeight: '600', marginTop: 3 },
    optionRight: { alignItems: 'flex-end', gap: 8 },
});
