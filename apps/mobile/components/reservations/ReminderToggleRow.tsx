import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';

type Props = {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    sub?: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
};

/** Notification-channel row with an accessible native Switch. */
export function ReminderToggleRow({ icon, label, sub, value, onValueChange }: Props) {
    return (
        <View style={s.row}>
            <View style={[s.iconWrap, { backgroundColor: (value ? T.green : T.muted) + '22' }]}>
                <Ionicons name={icon} size={18} color={value ? T.green : T.muted} />
            </View>
            <View style={s.textWrap}>
                <Text style={s.label}>{label}</Text>
                {sub ? <Text style={s.sub}>{sub}</Text> : null}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: T.card3, true: T.green }}
                thumbColor={T.white}
                ios_backgroundColor={T.card3}
                accessibilityLabel={label}
                accessibilityRole="switch"
            />
        </View>
    );
}

const s = StyleSheet.create({
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 6,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textWrap: { flex: 1 },
    label: { fontSize: 15, fontWeight: '700', color: T.white },
    sub: { fontSize: 12, color: T.muted, marginTop: 2 },
});
