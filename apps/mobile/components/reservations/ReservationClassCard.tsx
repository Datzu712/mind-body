import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import { ReservationStatusBadge } from './ReservationStatusBadge';
import { ReservationActionButton } from './ReservationActionButton';
import { hasLowSpots, hasNoSpots, type GymClass } from './mock-reservations';

type Props = {
    data: GymClass;
    onPress?: () => void;
    onReserve?: () => void;
    onWaitlist?: () => void;
};

const MetaRow = ({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) => (
    <View style={s.metaRow}>
        <Ionicons name={icon} size={13} color={T.muted} />
        <Text style={s.metaText}>{text}</Text>
    </View>
);

/** Compact class card for the explore list. Tap → detail; CTA → reserve/waitlist. */
export function ReservationClassCard({ data, onPress, onReserve, onWaitlist }: Props) {
    const noSpots = hasNoSpots(data);
    const lowSpots = hasLowSpots(data);

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`Ver detalle de ${data.name} con ${data.trainer}`}
            style={s.card}
        >
            {/* Accent top bar */}
            <View style={{ height: 3, backgroundColor: data.accent, borderRadius: 2 }} />

            <View style={s.inner}>
                {/* Header row: category chip + spots badge */}
                <View style={s.topRow}>
                    <View style={[s.catChip, { backgroundColor: data.accent + '22' }]}>
                        <Text style={[s.catText, { color: data.accent }]}>{data.category}</Text>
                    </View>
                    {noSpots ? (
                        <ReservationStatusBadge variant="sin-cupos" sm />
                    ) : lowSpots ? (
                        <ReservationStatusBadge variant="pocos-cupos" label={`${data.spotsLeft} cupos`} sm />
                    ) : (
                        <ReservationStatusBadge variant="disponible" label={`${data.spotsLeft} cupos`} sm />
                    )}
                </View>

                <Text style={s.name}>{data.name}</Text>

                <View style={s.metaWrap}>
                    <MetaRow icon="person-outline" text={data.trainer} />
                    <MetaRow icon="time-outline" text={data.time} />
                    <MetaRow icon="barbell-outline" text={`Nivel ${data.level}`} />
                </View>

                {noSpots ? (
                    <ReservationActionButton
                        label="Lista de espera"
                        variant="secondary"
                        icon="people-outline"
                        onPress={onWaitlist}
                    />
                ) : (
                    <ReservationActionButton label="Reservar" variant="primary" icon="checkmark" onPress={onReserve} />
                )}
            </View>
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    card: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        overflow: 'hidden',
    },
    inner: { padding: 14, gap: 10 },
    topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    catChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    catText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
    name: { fontSize: 17, fontWeight: '900', color: T.white, letterSpacing: -0.2 },
    metaWrap: { gap: 5 },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
    metaText: { fontSize: 13, color: T.muted, fontWeight: '600' },
});
