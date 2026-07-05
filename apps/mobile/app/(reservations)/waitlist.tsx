import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

import { FitColors as T } from '@/constants/theme';
import { ScreenHeader } from '@/components/reservations/ScreenHeader';
import { WaitlistPositionCard } from '@/components/reservations/WaitlistPositionCard';
import { ReservationEmptyState } from '@/components/reservations/ReservationEmptyState';
import { MOCK_WAITLIST } from '@/components/reservations/mock-reservations';

type TabKey = 'posiciones' | 'historial';

export default function WaitlistScreen() {
    const [tab, setTab] = useState<TabKey>('posiciones');
    const [left, setLeft] = useState<Record<string, boolean>>({});

    const active = useMemo(() => MOCK_WAITLIST.filter((w) => w.status !== 'cerrada' && !left[w.id]), [left]);
    const closed = useMemo(() => MOCK_WAITLIST.filter((w) => w.status === 'cerrada'), []);
    const list = tab === 'posiciones' ? active : closed;

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScreenHeader title="Lista de espera" />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Segmented tabs */}
                <View style={s.segment}>
                    {(['posiciones', 'historial'] as TabKey[]).map((key) => {
                        const on = tab === key;
                        return (
                            <TouchableOpacity
                                key={key}
                                onPress={() => setTab(key)}
                                activeOpacity={0.85}
                                accessibilityRole="tab"
                                accessibilityState={{ selected: on }}
                                style={[s.segBtn, on && s.segBtnOn]}
                            >
                                <Text style={[s.segText, on && s.segTextOn]}>
                                    {key === 'posiciones' ? 'Mis posiciones' : 'Historial'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {list.length === 0 ? (
                    <ReservationEmptyState
                        icon="people-outline"
                        title="No estás en ninguna lista"
                        message="Cuando una clase esté llena, podrás unirte a su lista de espera desde el detalle."
                        actionLabel="Explorar clases"
                        onAction={() => router.replace('/(tabs)/reservations')}
                    />
                ) : (
                    <View style={[s.px, { gap: 12 }]}>
                        {list.map((w) => (
                            <WaitlistPositionCard
                                key={w.id}
                                data={w}
                                onLeave={() => setLeft((prev) => ({ ...prev, [w.id]: true }))}
                                onViewReservation={() => router.push('/(reservations)/my-reservations')}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingBottom: 32, paddingTop: 4 },
    px: { paddingHorizontal: 20 },

    segment: {
        flexDirection: 'row',
        gap: 6,
        backgroundColor: T.card2,
        borderRadius: 12,
        padding: 4,
        marginHorizontal: 20,
        marginBottom: 16,
    },
    segBtn: { flex: 1, height: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    segBtnOn: { backgroundColor: T.yellow },
    segText: { fontSize: 13, fontWeight: '800', color: T.muted },
    segTextOn: { color: T.bg },
});
