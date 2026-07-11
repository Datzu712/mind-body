import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import { ReservationActionButton, type ButtonVariant } from './ReservationActionButton';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export type StateVariant =
    | 'exito'
    | 'sin-cupos'
    | 'conflicto'
    | 'cancelacion-plazo'
    | 'cancelacion-tardia'
    | 'lista-cerrada'
    | 'cupo-asignado'
    | 'info';

const CONFIG: Record<StateVariant, { color: string; icon: IoniconName; btn: ButtonVariant }> = {
    exito: { color: T.green, icon: 'checkmark-circle', btn: 'success' },
    'cupo-asignado': { color: T.green, icon: 'checkmark-circle', btn: 'success' },
    'cancelacion-plazo': { color: T.green, icon: 'checkmark-circle', btn: 'success' },
    'sin-cupos': { color: T.red, icon: 'remove-circle', btn: 'secondary' },
    conflicto: { color: T.orange, icon: 'alert-circle', btn: 'warning' },
    'cancelacion-tardia': { color: T.red, icon: 'alert-circle', btn: 'danger' },
    'lista-cerrada': { color: T.red, icon: 'lock-closed', btn: 'danger' },
    info: { color: T.blue, icon: 'information-circle', btn: 'info' },
};

type Props = {
    variant: StateVariant;
    title: string;
    message?: string;
    /** Extra secondary line (e.g. class + schedule) rendered below the message. */
    detail?: string;
    actionLabel?: string;
    onAction?: () => void;
};

/**
 * Large semantic state card matching the wireframe "Estados principales".
 * Always combines icon + title + color + message so meaning survives without color.
 */
export function ReservationStateCard({ variant, title, message, detail, actionLabel, onAction }: Props) {
    const cfg = CONFIG[variant];
    return (
        <View
            accessibilityRole="summary"
            accessibilityLabel={`${title}. ${message ?? ''}`}
            style={[s.card, { borderColor: cfg.color + '55', backgroundColor: cfg.color + '14' }]}
        >
            <View style={s.head}>
                <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                <Text style={[s.title, { color: cfg.color }]}>{title}</Text>
            </View>
            {message ? <Text style={s.message}>{message}</Text> : null}
            {detail ? <Text style={s.detail}>{detail}</Text> : null}
            {actionLabel && onAction ? (
                <View style={s.actionWrap}>
                    <ReservationActionButton label={actionLabel} variant={cfg.btn} onPress={onAction} />
                </View>
            ) : null}
        </View>
    );
}

const s = StyleSheet.create({
    card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
    head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    title: { fontSize: 14, fontWeight: '900', letterSpacing: 0.2, flex: 1 },
    message: { fontSize: 13, color: T.white, lineHeight: 18 },
    detail: { fontSize: 12, color: T.muted, lineHeight: 17 },
    actionWrap: { marginTop: 6 },
});
