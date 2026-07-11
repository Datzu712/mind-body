import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import { ReservationActionButton } from './ReservationActionButton';
import { ReservationStateCard } from './ReservationStateCard';
import type { WaitlistEntry } from './mock-reservations';

type Props = {
    data: WaitlistEntry;
    onLeave?: () => void;
    onViewReservation?: () => void;
};

/** Renders a waitlist entry, branching on its status into the matching UI state. */
export function WaitlistPositionCard({ data, onLeave, onViewReservation }: Props) {
    const { class: cls, position, status } = data;

    if (status === 'cupo-asignado') {
        return (
            <ReservationStateCard
                variant="cupo-asignado"
                title="¡Tienes un cupo!"
                message={`${cls.name} · ${cls.time}`}
                detail="Tu reserva está confirmada."
                actionLabel="Ver en Mis reservas"
                onAction={onViewReservation}
            />
        );
    }

    if (status === 'cerrada') {
        return (
            <ReservationStateCard
                variant="lista-cerrada"
                title="Lista de espera cerrada"
                message={`${cls.name} · ${cls.time}`}
                detail="No es posible unirse en este momento. La clase está llena."
            />
        );
    }

    // status === 'en-espera'
    return (
        <View style={s.card}>
            <View style={s.headRow}>
                <View style={{ flex: 1 }}>
                    <View style={[s.catChip, { backgroundColor: cls.accent + '22' }]}>
                        <Text style={[s.catText, { color: cls.accent }]}>{cls.category}</Text>
                    </View>
                    <Text style={s.name}>{cls.name}</Text>
                    <View style={s.metaRow}>
                        <Ionicons name="time-outline" size={13} color={T.muted} />
                        <Text style={s.meta}>
                            {cls.time} · {cls.room}
                        </Text>
                    </View>
                </View>
                <View style={s.posBox}>
                    <Text style={s.posLabel}>POSICIÓN</Text>
                    <Text style={s.posValue}>#{position}</Text>
                </View>
            </View>

            <Text style={s.note}>Te notificaremos si se libera un cupo.</Text>

            <ReservationActionButton
                label="Salir de la lista"
                variant="secondary"
                icon="exit-outline"
                onPress={onLeave}
            />
        </View>
    );
}

const s = StyleSheet.create({
    card: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
        gap: 12,
    },
    headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    catChip: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    catText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
    name: { fontSize: 16, fontWeight: '900', color: T.white, marginTop: 6 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    meta: { fontSize: 12, color: T.muted, fontWeight: '600' },
    posBox: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: T.card2,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: T.border,
        paddingHorizontal: 12,
        paddingVertical: 8,
        minWidth: 64,
    },
    posLabel: { fontSize: 8, fontWeight: '800', color: T.muted, letterSpacing: 0.6 },
    posValue: { fontSize: 22, fontWeight: '900', color: T.yellow, marginTop: 2 },
    note: { fontSize: 12, color: T.muted, lineHeight: 17 },
});
