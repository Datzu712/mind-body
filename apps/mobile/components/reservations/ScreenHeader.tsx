import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FitColors as T } from '@/constants/theme';

type Props = {
    title: string;
    /** Optional right-side action (e.g. an icon button). */
    right?: React.ReactNode;
    /** Fallback route when there is no back stack (deep-link safety). */
    fallback?: string;
};

/** Dark header with a back button, shared across the (reservations) stack screens. */
export function ScreenHeader({ title, right, fallback = '/(tabs)/reservations' }: Props) {
    const goBack = () => {
        if (router.canGoBack()) router.back();
        else router.replace(fallback as never);
    };

    return (
        <View style={s.header}>
            <TouchableOpacity
                onPress={goBack}
                accessibilityRole="button"
                accessibilityLabel="Volver"
                hitSlop={8}
                style={s.backBtn}
            >
                <Ionicons name="arrow-back" size={22} color={T.white} />
            </TouchableOpacity>
            <Text style={s.title} numberOfLines={1}>
                {title}
            </Text>
            <View style={s.right}>{right}</View>
        </View>
    );
}

const s = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: { flex: 1, fontSize: 18, fontWeight: '900', color: T.white },
    right: { minWidth: 40, alignItems: 'flex-end' },
});
