import { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import { EXERCISES, type Exercise } from '@/lib/training/training-data';

type CategoryId = 'all' | 'fuerza' | 'cardio' | 'flexibilidad';

const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
    { id: 'all', label: 'TODOS', icon: '🔍' },
    { id: 'fuerza', label: 'FUERZA', icon: '🏋️' },
    { id: 'cardio', label: 'CARDIO', icon: '🏃' },
    { id: 'flexibilidad', label: 'FLEXIB.', icon: '🧘' },
];

const Pill = ({ label, bg = T.yellow, fg = T.bg, sm }: { label: string; bg?: string; fg?: string; sm?: boolean }) => (
    <View
        style={{
            backgroundColor: bg,
            borderRadius: 5,
            paddingHorizontal: sm ? 6 : 8,
            paddingVertical: sm ? 2 : 3,
            alignSelf: 'flex-start',
        }}
    >
        <Text
            style={{
                color: fg,
                fontSize: sm ? 9 : 10,
                fontWeight: '800',
                letterSpacing: 0.4,
                textTransform: 'uppercase',
            }}
        >
            {label}
        </Text>
    </View>
);

const LEVEL_BY_CATEGORY: Record<CategoryId, string> = {
    all: 'VARIADO',
    fuerza: 'AVANZADO',
    cardio: 'INTENSO',
    flexibilidad: 'BÁSICO',
};

export default function WorkoutsScreen() {
    const [cat, setCat] = useState<CategoryId>('all');
    const list = useMemo<Exercise[]>(() => {
        if (cat === 'all') return EXERCISES;
        return EXERCISES.filter((e) => e.category === cat);
    }, [cat]);

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Header */}
                <View style={s.header}>
                    <Text style={s.eyebrow}>CATÁLOGO</Text>
                    <Text style={s.title}>EJERCICIOS</Text>
                </View>

                {/* Search bar (visual) */}
                <View style={s.px}>
                    <View style={s.searchBar}>
                        <Ionicons name="search" size={15} color={T.muted} />
                        <Text style={s.searchPlaceholder}>Buscar ejercicio...</Text>
                    </View>
                </View>

                {/* Category tabs */}
                <View style={s.catRow}>
                    {CATEGORIES.map((c) => {
                        const active = cat === c.id;
                        return (
                            <TouchableOpacity
                                key={c.id}
                                style={[s.catTab, active && s.catTabActive]}
                                onPress={() => setCat(c.id)}
                                activeOpacity={0.75}
                            >
                                <Text style={s.catIcon}>{c.icon}</Text>
                                <Text style={[s.catLabel, active && s.catLabelActive]}>{c.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Exercise list */}
                <View style={[s.px, { gap: 10 }]}>
                    {list.map((ex) => (
                        <TouchableOpacity
                            key={ex.id}
                            style={s.exCard}
                            activeOpacity={0.8}
                            onPress={() => router.push(`/workout/${ex.id}`)}
                        >
                            <View style={[s.exIcon, { backgroundColor: T.yellowDim, borderColor: T.yellowBdr }]}>
                                <Text style={{ fontSize: 22 }}>{ex.emoji}</Text>
                            </View>

                            <View style={{ flex: 1 }}>
                                <View style={s.exTopRow}>
                                    <Text style={s.exName} numberOfLines={1}>
                                        {ex.name}
                                    </Text>
                                    <Pill
                                        label={LEVEL_BY_CATEGORY[ex.category]}
                                        bg={T.yellow + '22'}
                                        fg={T.yellow}
                                        sm
                                    />
                                </View>
                                <Text style={s.exMuscle}>{ex.muscleGroup}</Text>
                                <Text style={s.exDesc} numberOfLines={2}>
                                    {ex.description}
                                </Text>
                            </View>

                            <Ionicons name="chevron-forward" size={16} color={T.muted} />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingBottom: 28 },
    px: { paddingHorizontal: 20 },

    header: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },
    eyebrow: {
        fontSize: 11,
        color: T.muted,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: { fontSize: 24, fontWeight: '900', color: T.white },

    searchBar: {
        backgroundColor: T.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: T.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 11,
        marginBottom: 14,
    },
    searchPlaceholder: { fontSize: 13, color: T.muted, fontWeight: '500' },

    catRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 14 },
    catTab: {
        flex: 1,
        backgroundColor: T.card,
        borderRadius: 10,
        paddingVertical: 9,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: T.border,
        gap: 4,
    },
    catTabActive: { backgroundColor: T.yellow, borderColor: T.yellow },
    catIcon: { fontSize: 14 },
    catLabel: { fontSize: 10, fontWeight: '800', color: T.muted, letterSpacing: 0.3, textTransform: 'uppercase' },
    catLabelActive: { color: T.bg },

    exCard: {
        backgroundColor: T.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    exIcon: {
        width: 50,
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        flexShrink: 0,
    },
    exTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
    exName: { flex: 1, fontSize: 13, fontWeight: '700', color: T.white, marginRight: 8 },
    exMuscle: { fontSize: 11, color: T.muted, marginBottom: 4 },
    exDesc: { fontSize: 11, color: T.muted, lineHeight: 15 },
});
