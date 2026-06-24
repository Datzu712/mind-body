import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import { getExerciseById, getRoutineForMemberRoutine } from '@/lib/training/training-data';

export default function RoutineDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const data = useMemo(() => getRoutineForMemberRoutine(id), [id]);

    if (!data) {
        return (
            <SafeAreaView style={s.root} edges={['top']}>
                <Stack.Screen options={{ title: 'Rutina', headerShown: true }} />
                <View style={s.empty}>
                    <Ionicons name="alert-circle-outline" size={48} color={T.muted} />
                    <Text style={s.emptyTitle}>Rutina no encontrada</Text>
                    <TouchableOpacity style={s.emptyBtn} onPress={() => router.replace('/(tabs)/routines')}>
                        <Text style={s.emptyBtnText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const { routine } = data;

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <Stack.Screen options={{ title: routine.name, headerShown: false }} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={T.white} />
                    </TouchableOpacity>
                    <Text style={s.eyebrow}>RUTINA ASIGNADA</Text>
                    <Text style={s.title}>{routine.name}</Text>
                    <Text style={s.subtitle}>{routine.objective}</Text>
                </View>

                {/* Exercises */}
                <View style={s.secHead}>
                    <Text style={s.secTitle}>EJERCICIOS ({routine.exercises.length})</Text>
                </View>
                <View style={[s.px, { gap: 10 }]}>
                    {routine.exercises.map((re) => {
                        const exercise = getExerciseById(re.exerciseId);
                        if (!exercise) return null;
                        return (
                            <View key={re.id} style={s.exCard}>
                                <View style={[s.exIcon, { backgroundColor: T.yellowDim, borderColor: T.yellowBdr }]}>
                                    <Text style={{ fontSize: 22 }}>{exercise.emoji}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.exName}>{exercise.name}</Text>
                                    <Text style={s.exMuscle}>{exercise.muscleGroup}</Text>
                                    {re.notes ? <Text style={s.exNotes}>{re.notes}</Text> : null}
                                    <View style={s.chipsRow}>
                                        <View style={s.chip}>
                                            <Text style={s.chipLabel}>SERIES</Text>
                                            <Text style={s.chipVal}>{re.sets}</Text>
                                        </View>
                                        <View style={s.chip}>
                                            <Text style={s.chipLabel}>REPS</Text>
                                            <Text style={s.chipVal}>{re.reps}</Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </ScrollView>

            {/* CTA */}
            <View style={s.footer}>
                <TouchableOpacity
                    style={s.cta}
                    activeOpacity={0.85}
                    onPress={() => router.push(`/workout-session?memberRoutineId=${id}`)}
                >
                    <Text style={s.ctaText}>INICIAR SESIÓN</Text>
                    <Ionicons name="arrow-forward" size={18} color={T.bg} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingBottom: 120 },
    px: { paddingHorizontal: 20 },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: T.white },
    emptyBtn: {
        backgroundColor: T.yellow,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    emptyBtnText: { fontSize: 14, fontWeight: '800', color: T.bg },

    header: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },
    backBtn: { marginBottom: 10 },
    eyebrow: {
        fontSize: 11,
        color: T.muted,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: { fontSize: 24, fontWeight: '900', color: T.white },
    subtitle: { fontSize: 13, color: T.muted, marginTop: 4 },

    secHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 10,
    },
    secTitle: { fontSize: 12, fontWeight: '800', color: T.white, letterSpacing: 1.5, textTransform: 'uppercase' },

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
    exName: { fontSize: 14, fontWeight: '800', color: T.white },
    exMuscle: { fontSize: 11, color: T.muted, marginTop: 2 },
    exNotes: { fontSize: 10, color: T.yellow, marginTop: 6, fontStyle: 'italic' },
    chipsRow: { flexDirection: 'row', gap: 7, marginTop: 8 },
    chip: {
        backgroundColor: T.card2,
        borderRadius: 7,
        paddingHorizontal: 9,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    chipLabel: { fontSize: 9, color: T.muted, fontWeight: '700', textTransform: 'uppercase' },
    chipVal: { fontSize: 13, color: T.yellow, fontWeight: '900' },

    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 20,
        paddingBottom: 28,
        backgroundColor: T.bg,
        borderTopWidth: 1,
        borderTopColor: T.border,
    },
    cta: {
        backgroundColor: T.yellow,
        borderRadius: 14,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    ctaText: { fontSize: 14, fontWeight: '900', color: T.bg, letterSpacing: 0.5 },
});
