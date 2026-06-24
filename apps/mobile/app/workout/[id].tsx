import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import { getExerciseById, ROUTINES } from '@/lib/training/training-data';

export default function WorkoutDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const exercise = useMemo(() => getExerciseById(id), [id]);
    const routines = useMemo(() => ROUTINES.filter((r) => r.exercises.some((re) => re.exerciseId === id)), [id]);

    if (!exercise) {
        return (
            <SafeAreaView style={s.root} edges={['top']}>
                <Stack.Screen options={{ title: 'Ejercicio', headerShown: true }} />
                <View style={s.empty}>
                    <Ionicons name="alert-circle-outline" size={48} color={T.muted} />
                    <Text style={s.emptyTitle}>Ejercicio no encontrado</Text>
                    <TouchableOpacity style={s.emptyBtn} onPress={() => router.replace('/(tabs)/workouts')}>
                        <Text style={s.emptyBtnText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <Stack.Screen options={{ title: exercise.name, headerShown: false }} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={T.white} />
                    </TouchableOpacity>
                    <View style={[s.iconBig, { backgroundColor: T.yellowDim, borderColor: T.yellowBdr }]}>
                        <Text style={{ fontSize: 48 }}>{exercise.emoji}</Text>
                    </View>
                    <Text style={s.title}>{exercise.name}</Text>
                    <Text style={s.subtitle}>{exercise.muscleGroup}</Text>
                </View>

                <View style={s.px}>
                    <View style={s.card}>
                        <Text style={s.cardTitle}>Descripción</Text>
                        <Text style={s.cardText}>{exercise.description}</Text>
                    </View>

                    <View style={s.card}>
                        <Text style={s.cardTitle}>Detalles</Text>
                        <View style={s.detailRow}>
                            <Text style={s.detailLabel}>Categoría</Text>
                            <Text style={s.detailValue}>{exercise.category}</Text>
                        </View>
                        <View style={s.detailRow}>
                            <Text style={s.detailLabel}>Estado</Text>
                            <Text style={s.detailValue}>{exercise.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}</Text>
                        </View>
                    </View>

                    {routines.length > 0 && (
                        <View style={s.card}>
                            <Text style={s.cardTitle}>Aparece en</Text>
                            {routines.map((r) => (
                                <View key={r.id} style={s.routineRow}>
                                    <Ionicons name="list-outline" size={14} color={T.yellow} />
                                    <Text style={s.routineName}>{r.name}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingBottom: 40 },
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

    header: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20, alignItems: 'center' },
    backBtn: { alignSelf: 'flex-start', marginBottom: 10 },
    iconBig: {
        width: 100,
        height: 100,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginBottom: 16,
    },
    title: { fontSize: 24, fontWeight: '900', color: T.white, textAlign: 'center' },
    subtitle: { fontSize: 13, color: T.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

    card: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 16,
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: T.white,
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    cardText: { fontSize: 13, color: T.muted, lineHeight: 20 },

    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: T.border,
    },
    detailLabel: { fontSize: 12, color: T.muted },
    detailValue: { fontSize: 12, fontWeight: '800', color: T.white, textTransform: 'capitalize' },

    routineRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
    routineName: { fontSize: 13, fontWeight: '700', color: T.white },
});
