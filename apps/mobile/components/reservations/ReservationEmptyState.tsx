import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import { ReservationActionButton } from './ReservationActionButton';

type Props = {
    icon?: React.ComponentProps<typeof Ionicons>['name'];
    title: string;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
};

/** Neutral empty state (e.g. "No tienes clases programadas"). */
export function ReservationEmptyState({ icon = 'calendar-outline', title, message, actionLabel, onAction }: Props) {
    return (
        <View style={s.wrap} accessibilityRole="summary" accessibilityLabel={`${title}. ${message}`}>
            <View style={s.iconWrap}>
                <Ionicons name={icon} size={28} color={T.muted} />
            </View>
            <Text style={s.title}>{title}</Text>
            <Text style={s.message}>{message}</Text>
            {actionLabel && onAction ? (
                <View style={s.actionWrap}>
                    <ReservationActionButton label={actionLabel} variant="primary" onPress={onAction} compact />
                </View>
            ) : null}
        </View>
    );
}

const s = StyleSheet.create({
    wrap: {
        alignItems: 'center',
        gap: 8,
        paddingVertical: 40,
        paddingHorizontal: 24,
    },
    iconWrap: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: T.card2,
        borderWidth: 1,
        borderColor: T.border,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    title: { fontSize: 16, fontWeight: '800', color: T.white, textAlign: 'center' },
    message: { fontSize: 13, color: T.muted, textAlign: 'center', lineHeight: 19 },
    actionWrap: { marginTop: 8 },
});
