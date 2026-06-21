import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FitColors as T } from '@/constants/theme';
import { ResumenTab } from '@/components/progress/ResumenTab';
import { CuerpoTab } from '@/components/progress/CuerpoTab';
import { ActividadTab } from '@/components/progress/ActividadTab';

const TABS = ['Resumen', 'Cuerpo', 'Actividad'] as const;
type TabKey = (typeof TABS)[number];

export default function ProgressScreen() {
    const [activeTab, setActiveTab] = useState<TabKey>('Resumen');

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <View style={s.header}>
                <Text style={s.eyebrow}>TU EVOLUCIÓN</Text>
                <Text style={s.title}>PROGRESO</Text>
            </View>

            <View style={s.tabBar}>
                {TABS.map((tab) => (
                    <Pressable
                        key={tab}
                        style={[s.tab, activeTab === tab && s.tabActive]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[s.tabLabel, activeTab === tab && s.tabLabelActive]}>{tab}</Text>
                    </Pressable>
                ))}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {activeTab === 'Resumen' && <ResumenTab />}
                {activeTab === 'Cuerpo' && <CuerpoTab />}
                {activeTab === 'Actividad' && <ActividadTab />}
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingBottom: 28 },
    header: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 10 },
    eyebrow: {
        fontSize: 11,
        color: T.muted,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: { fontSize: 24, fontWeight: '900', color: T.white },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: 20,
        backgroundColor: T.card,
        borderRadius: 10,
        padding: 3,
        marginBottom: 16,
    },
    tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    tabActive: { backgroundColor: T.yellow },
    tabLabel: { fontSize: 12, fontWeight: '700', color: T.muted },
    tabLabelActive: { color: T.bg },
});
