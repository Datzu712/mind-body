import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

/** Semantic states covering class availability + reservation lifecycle. */
export type BadgeVariant =
    | 'confirmada'
    | 'reprogramada'
    | 'cancelacion-tardia'
    | 'cancelada'
    | 'pocos-cupos'
    | 'sin-cupos'
    | 'disponible';

const CONFIG: Record<BadgeVariant, { label: string; color: string; icon: IoniconName }> = {
    confirmada: { label: 'Confirmada', color: T.green, icon: 'checkmark-circle' },
    reprogramada: { label: 'Reprogramada', color: T.blue, icon: 'sync' },
    'cancelacion-tardia': { label: 'Cancelación tardía', color: T.red, icon: 'alert-circle' },
    cancelada: { label: 'Cancelada', color: T.muted, icon: 'close-circle' },
    'pocos-cupos': { label: 'Pocos cupos', color: T.orange, icon: 'warning' },
    'sin-cupos': { label: 'Sin cupos', color: T.red, icon: 'remove-circle' },
    disponible: { label: 'Disponible', color: T.green, icon: 'ellipse' },
};

type Props = {
    variant: BadgeVariant;
    /** Override the default label (e.g. "8 cupos"). */
    label?: string;
    sm?: boolean;
};

/**
 * Status pill that always pairs icon + text + color, so state is never
 * communicated by color alone (accessibility requirement).
 */
export function ReservationStatusBadge({ variant, label, sm }: Props) {
    const cfg = CONFIG[variant];
    const text = label ?? cfg.label;
    return (
        <View
            accessibilityRole="text"
            accessibilityLabel={`Estado: ${text}`}
            style={[s.badge, { backgroundColor: cfg.color + '22', borderColor: cfg.color + '44' }, sm && s.badgeSm]}
        >
            <Ionicons name={cfg.icon} size={sm ? 10 : 12} color={cfg.color} />
            <Text style={[s.text, { color: cfg.color }, sm && s.textSm]} numberOfLines={1}>
                {text}
            </Text>
        </View>
    );
}

const s = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: 6,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: 'flex-start',
    },
    badgeSm: { paddingHorizontal: 6, paddingVertical: 2, gap: 3 },
    text: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3, textTransform: 'uppercase' },
    textSm: { fontSize: 9 },
});
