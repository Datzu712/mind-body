import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { FitColors as T } from '@/constants/theme';
import { ReservationActionButton } from '@/components/reservations/ReservationActionButton';
import { ReservationStateCard } from '@/components/reservations/ReservationStateCard';
import { ReservationStatusBadge } from '@/components/reservations/ReservationStatusBadge';
import { getClassById, hasNoSpots } from '@/components/reservations/mock-reservations';
import { ScreenHeader } from '@/components/reservations/ScreenHeader';

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
    const gymClass = getClassById(id);
    const noSpots = hasNoSpots(gymClass);

    const [reserved, setReserved] = useState(false);
    const [waitlisted, setWaitlisted] = useState(false);

    const goToReservations = () => router.push('/(reservations)/my-reservations');
    const goToWaitlist = () => router.push('/(reservations)/waitlist');

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScreenHeader title="Detalle de clase" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Title block */}
                <View style={s.px}>
                    <View style={[s.catChip, { backgroundColor: gymClass.accent + '22' }]}>
                        <Text style={[s.catText, { color: gymClass.accent }]}>{gymClass.category}</Text>
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
                        <InfoRow icon="calendar-outline" label="Fecha" value="Hoy, 9 jun 2025" />
                        <InfoRow
                            icon="time-outline"
                            label="Horario"
                            value={`${gymClass.time} (${gymClass.durationMin} min)`}
                        />
                        <InfoRow icon="location-outline" label="Sala" value={`${gymClass.room} · ${gymClass.zone}`} />
                        <InfoRow icon="barbell-outline" label="Nivel" value={gymClass.level} />
                        <InfoRow
                            icon="people-outline"
                            label="Cupos"
                            value={`${gymClass.spotsLeft} / ${gymClass.capacity}`}
                            valueColor={noSpots ? T.red : T.green}
                        />
                    </View>
                </View>

                {/* Description */}
                <View style={[s.px, { marginTop: 16 }]}>
                    <Text style={s.secTitle}>DESCRIPCIÓN</Text>
                    <Text style={s.desc}>{gymClass.description}</Text>
                </View>

                {/* Actions + states */}
                <View style={[s.px, { marginTop: 20, gap: 12 }]}>
                    {reserved ? (
                        <ReservationStateCard
                            variant="exito"
                            title="¡Reserva confirmada!"
                            message={`${gymClass.name} · ${gymClass.time}`}
                            detail={`${gymClass.room} · Hoy`}
                            actionLabel="Ver en Mis reservas"
                            onAction={goToReservations}
                        />
                    ) : waitlisted ? (
                        <ReservationStateCard
                            variant="info"
                            title="Estás en la lista de espera"
                            message={`Te avisaremos si se libera un cupo en ${gymClass.name}.`}
                            actionLabel="Ver lista de espera"
                            onAction={goToWaitlist}
                        />
                    ) : noSpots ? (
                        <>
                            <ReservationStateCard
                                variant="sin-cupos"
                                title="No hay cupos disponibles"
                                message="Únete a la lista de espera y te avisaremos si se libera un lugar."
                            />
                            <ReservationActionButton
                                label="Unirme a lista de espera"
                                variant="primary"
                                icon="people-outline"
                                onPress={() => setWaitlisted(true)}
                            />
                        </>
                    ) : (
                        <>
                            <ReservationActionButton
                                label="Reservar mi cupo"
                                variant="primary"
                                icon="checkmark"
                                onPress={() => setReserved(true)}
                            />
                            <ReservationActionButton
                                label="Unirme a lista de espera"
                                variant="secondary"
                                icon="people-outline"
                                onPress={() => setWaitlisted(true)}
                            />
                            {gymClass.hasConflict && (
                                <ReservationStateCard
                                    variant="conflicto"
                                    title="Tienes un conflicto de horario"
                                    message="Esta clase se cruza con otra reserva que ya tienes."
                                    detail="Yoga Flow · Hoy 07:00 - 08:00"
                                    actionLabel="Ver mis reservas"
                                    onAction={goToReservations}
                                />
                            )}
                        </>
                    )}

                    {/* Availability recap (icon + text + color, not color alone) */}
                    {!reserved && !waitlisted && (
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
