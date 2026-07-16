import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { FitColors as T } from '@/constants/theme';
import { ReservationActionButton } from '@/components/reservations/ReservationActionButton';
import { ReservationStateCard } from '@/components/reservations/ReservationStateCard';
import { ReservationStatusBadge } from '@/components/reservations/ReservationStatusBadge';
import { ScreenHeader } from '@/components/reservations/ScreenHeader';
import { hasNoSpots, useBookSession, useSessionDetail } from '@/lib/api/reservations';

const InfoRow = ({
    icon,
    label,
    value,
    valueColor = T.white,
}: {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    value: string;
    valueColor?: string;
}) => (
    <View style={s.infoRow}>
        <View style={s.infoIcon}>
            <Ionicons name={icon} size={16} color={T.muted} />
        </View>
        <Text style={s.infoLabel}>{label}</Text>
        <Text style={[s.infoValue, { color: valueColor }]}>{value}</Text>
    </View>
);

export default function ClassDetailScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const sessionId = Array.isArray(id) ? id[0] : id;

    const { data: gymClass, isLoading, isError, refetch } = useSessionDetail(sessionId);
    const book = useBookSession();
    const [bookError, setBookError] = useState<string | null>(null);

    const goToReservations = () => router.push('/(reservations)/my-reservations');

    const handleReserve = () => {
        if (!sessionId) return;
        setBookError(null);
        book.mutate(sessionId, {
            onError: (error) => setBookError(error instanceof Error ? error.message : 'No se pudo reservar'),
        });
    };

    if (isLoading || !gymClass) {
        return (
            <SafeAreaView style={s.root} edges={['top']}>
                <ScreenHeader title="Detalle de clase" />
                {isError ? (
                    <View style={[s.px, { marginTop: 24 }]}>
                        <ReservationStateCard
                            variant="sin-cupos"
                            title="No pudimos cargar la clase"
                            message="Revisa tu conexión e inténtalo de nuevo."
                            actionLabel="Reintentar"
                            onAction={() => void refetch()}
                        />
                    </View>
                ) : (
                    <View style={s.loading}>
                        <ActivityIndicator color={T.yellow} />
                    </View>
                )}
            </SafeAreaView>
        );
    }

    const noSpots = hasNoSpots(gymClass);
    const reserved = !!gymClass.viewer?.reservationId || book.isSuccess;
    const hasConflict = !!gymClass.viewer?.hasConflict;
    const room = [gymClass.room, gymClass.zone].filter(Boolean).join(' · ');

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScreenHeader title="Detalle de clase" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Title block */}
                <View style={s.px}>
                    <View style={[s.catChip, { backgroundColor: gymClass.accent + '22' }]}>
                        <Text style={[s.catText, { color: gymClass.accent }]}>{gymClass.category ?? 'Clase'}</Text>
                    </View>
                    <Text style={s.name}>{gymClass.name}</Text>
                    <View style={s.trainerRow}>
                        <Ionicons name="person-circle-outline" size={18} color={T.muted} />
                        <Text style={s.trainer}>{gymClass.trainer}</Text>
                    </View>
                </View>

                {/* Info card */}
                <View style={[s.px, { marginTop: 16 }]}>
                    <View style={s.infoCard}>
                        <InfoRow icon="calendar-outline" label="Fecha" value={gymClass.dateLabel} />
                        <InfoRow
                            icon="time-outline"
                            label="Horario"
                            value={`${gymClass.time} (${gymClass.durationMin} min)`}
                        />
                        {room.length > 0 && <InfoRow icon="location-outline" label="Sala" value={room} />}
                        {gymClass.level && <InfoRow icon="barbell-outline" label="Nivel" value={gymClass.level} />}
                        <InfoRow
                            icon="people-outline"
                            label="Cupos disponibles"
                            value={`${gymClass.spotsLeft} / ${gymClass.capacity}`}
                            valueColor={noSpots ? T.red : T.green}
                        />
                    </View>
                </View>

                {/* Description */}
                {gymClass.description.length > 0 && (
                    <View style={[s.px, { marginTop: 16 }]}>
                        <Text style={s.secTitle}>DESCRIPCIÓN</Text>
                        <Text style={s.desc}>{gymClass.description}</Text>
                    </View>
                )}

                {/* Actions + states */}
                <View style={[s.px, { marginTop: 20, gap: 12 }]}>
                    {reserved ? (
                        <ReservationStateCard
                            variant="exito"
                            title={book.isSuccess ? '¡Reserva confirmada!' : 'Ya tienes una reserva en esta clase'}
                            message={`${gymClass.name} · ${gymClass.time}`}
                            detail={`${gymClass.dateLabel}${room ? ` · ${room}` : ''}`}
                            actionLabel="Ver en Mis reservas"
                            onAction={goToReservations}
                        />
                    ) : noSpots ? (
                        <ReservationStateCard
                            variant="sin-cupos"
                            title="No hay cupos disponibles"
                            message="Esta sesión está llena. Revisa otros horarios de la misma clase."
                        />
                    ) : (
                        <>
                            <ReservationActionButton
                                label={book.isPending ? 'Reservando…' : 'Reservar mi cupo'}
                                variant="primary"
                                icon="checkmark"
                                onPress={book.isPending ? undefined : handleReserve}
                            />
                            {bookError && (
                                <ReservationStateCard
                                    variant="sin-cupos"
                                    title="No se pudo reservar"
                                    message={bookError}
                                />
                            )}
                            {hasConflict && (
                                <ReservationStateCard
                                    variant="conflicto"
                                    title="Tienes un conflicto de horario"
                                    message="Esta clase se cruza con otra reserva que ya tienes."
                                    actionLabel="Ver mis reservas"
                                    onAction={goToReservations}
                                />
                            )}
                        </>
                    )}

                    {/* Availability recap (icon + text + color, not color alone) */}
                    {!reserved && (
                        <View style={s.recap}>
                            <ReservationStatusBadge
                                variant={noSpots ? 'sin-cupos' : 'disponible'}
                                label={noSpots ? 'Sin cupos' : `${gymClass.spotsLeft} cupos disponibles`}
                            />
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingBottom: 32, paddingTop: 8 },
    px: { paddingHorizontal: 20 },
    loading: { paddingVertical: 48, alignItems: 'center' },

    catChip: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    catText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
    name: { fontSize: 26, fontWeight: '900', color: T.white, marginTop: 8, letterSpacing: -0.5 },
    trainerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
    trainer: { fontSize: 14, color: T.muted, fontWeight: '600' },

    infoCard: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        paddingHorizontal: 14,
        paddingVertical: 4,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 11,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: T.border,
    },
    infoIcon: { width: 22, alignItems: 'center' },
    infoLabel: { flex: 1, fontSize: 13, color: T.muted, fontWeight: '600' },
    infoValue: { fontSize: 13, fontWeight: '800' },

    secTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: T.white,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    desc: { fontSize: 14, color: T.muted, lineHeight: 21 },

    recap: { alignItems: 'center', marginTop: 2 },
});
