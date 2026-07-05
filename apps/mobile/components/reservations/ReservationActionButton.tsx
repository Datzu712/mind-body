import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';

type Props = {
    label: string;
    onPress?: () => void;
    variant?: ButtonVariant;
    icon?: IoniconName;
    disabled?: boolean;
    loading?: boolean;
    /** Shrink to content instead of filling the row. */
    compact?: boolean;
};

function resolve(variant: ButtonVariant): { bg: string; fg: string; border: string } {
    switch (variant) {
        case 'primary':
            return { bg: T.yellow, fg: T.bg, border: T.yellow };
        case 'secondary':
            return { bg: 'transparent', fg: T.white, border: T.border };
        case 'success':
            return { bg: T.green + '22', fg: T.green, border: T.green + '55' };
        case 'danger':
            return { bg: T.red + '22', fg: T.red, border: T.red + '55' };
        case 'warning':
            return { bg: T.orange + '22', fg: T.orange, border: T.orange + '55' };
        case 'info':
            return { bg: T.blue + '22', fg: T.blue, border: T.blue + '55' };
    }
}

/** Large (≥48px) accessible CTA. Icon + text; never color-only. */
export function ReservationActionButton({
    label,
    onPress,
    variant = 'primary',
    icon,
    disabled,
    loading,
    compact,
}: Props) {
    const c = resolve(variant);
    return (
        <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ disabled: !!disabled || !!loading }}
            activeOpacity={0.85}
            onPress={onPress}
            disabled={disabled || loading}
            style={[
                s.btn,
                { backgroundColor: c.bg, borderColor: c.border },
                compact && s.compact,
                (disabled || loading) && s.disabled,
            ]}
        >
            {loading ? (
                <ActivityIndicator size="small" color={c.fg} />
            ) : (
                <View style={s.inner}>
                    {icon && <Ionicons name={icon} size={16} color={c.fg} />}
                    <Text style={[s.label, { color: c.fg }]} numberOfLines={1}>
                        {label}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    btn: {
        minHeight: 48,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        flexGrow: 1,
    },
    compact: { flexGrow: 0, minHeight: 44, paddingHorizontal: 14 },
    inner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    label: { fontSize: 14, fontWeight: '800', letterSpacing: 0.3 },
    disabled: { opacity: 0.45 },
});
