import { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import { getExerciseById, getRoutineForMemberRoutine } from '@/lib/training/training-data';
import { getWorkoutSession, saveWorkoutSession } from '@/lib/training/training-storage';

export default function WorkoutConfirmationScreen() {
    const { sessionId, memberRoutineId } = useLocalSearchParams<{ sessionId: string; memberRoutineId: string }>();
    const data = useMemo(() => getRoutineForMemberRoutine(memberRoutineId), [memberRoutineId]);
    const [session, setSession] = useState<Awaited<ReturnType<typeof getWorkoutSession>>>(null);
    const [trainerName, setTrainerName] = useState('');
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        let active = true;
        (async () => {
            const s = await getWorkoutSession(sessionId);
            if (active) setSession(s);
        })();
        return () => {
            active = false;
        };
    }, [sessionId]);

    const handleConfirm = async () => {
        if (!session) return;
        const updated = {
            ...session,
            confirmedByMember: true,
            trainerSignature: trainerName.trim(),
            status: 'COMPLETED' as const,
        };
        await saveWorkoutSession(updated);
        setConfirmed(true);
    };

    if (!data || !session) {
        return (
            <SafeAreaView style={s.root} edges={['top']}>
                <Stack.Screen options={{ title: 'Confirmar', headerShown: true }} />
                <View style={s.empty}>
                    <Ionicons name="checkmark-circle-outline" size={48} color={T.muted} />
                    <Text style={s.emptyTitle}>Cargando sesión...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const { routine } = data;
    const completedSets = session.exercises.reduce((acc, ex) => acc + ex.sets.filter((set) => set.done).length, 0);

    if (confirmed) {
        return (
            <SafeAreaView style={s.root} edges={['top']}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={s.success}>
                    <View style={s.successIcon}>
                        <Ionicons name="checkmark" size={48} color={T.bg} />
                    </View>
                    <Text style={s.successTitle}>¡Entrenamiento confirmado!</Text>
                    <Text style={s.successSub}>
                        {completedSets} series registradas · Firmado por {trainerName.trim() || 'entrenador'}
                    </Text>
                    <TouchableOpacity
                        style={s.cta}
                        onPress={() => router.replace('/(tabs)/routines')}
                        activeOpacity={0.85}
                    >
                        <Text style={s.ctaText}>VOLVER A RUTINAS</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <Stack.Screen options={{ title: 'Confirmar sesión', headerShown: false }} />
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={T.white} />
                    </TouchableOpacity>
                    <Text style={s.eyebrow}>CONFIRMACIÓN</Text>
                    <Text style={s.title}>{routine.name}</Text>
                </View>

                <View style={[s.px, { gap: 12 }]}>
                    <View style={s.summaryCard}>
                        <Text style={s.summaryTitle}>Resumen de la sesión</Text>
                        <View style={s.summaryRow}>
                            <Text style={s.summaryLabel}>Fecha</Text>
                            <Text style={s.summaryValue}>{new Date(session.date).toLocaleDateString('es-ES')}</Text>
                        </View>
                        <View style={s.summaryRow}>
                            <Text style={s.summaryLabel}>Series completadas</Text>
                            <Text style={s.summaryValue}>{completedSets}</Text>
                        </View>
                        <View style={s.summaryRow}>
                            <Text style={s.summaryLabel}>Ejercicios</Text>
                            <Text style={s.summaryValue}>{session.exercises.length}</Text>
                        </View>
                    </View>

                    <View style={s.exercisesCard}>
                        <Text style={s.summaryTitle}>Ejercicios registrados</Text>
                        {session.exercises.map((ex, i) => {
                            const re = routine.exercises[i];
                            const exercise = re ? getExerciseById(re.exerciseId) : undefined;
                            if (!re || !exercise) return null;
                            return (
                                <View key={re.id} style={s.exRow}>
                                    <Text style={s.exName}>{exercise.name}</Text>
                                    <Text style={s.exDetail}>
                                        {ex.sets.filter((set) => set.done).length}/{ex.sets.length} series
                                        {ex.notes ? ` · ${ex.notes}` : ''}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>

                    <View style={s.signatureCard}>
                        <Text style={s.summaryTitle}>Firma digital del entrenador</Text>
                        <Text style={s.signatureSub}>Ingresa el nombre del entrenador que valida la sesión.</Text>
                        <TextInput
                            style={s.signatureInput}
                            placeholder="Nombre del entrenador"
                            placeholderTextColor={T.muted}
                            value={trainerName}
                            onChangeText={setTrainerName}
                        />
                    </View>
                </View>
            </ScrollView>

            <View style={s.footer}>
                <TouchableOpacity
                    style={[s.cta, !trainerName.trim() && s.ctaDisabled]}
                    disabled={!trainerName.trim()}
                    onPress={handleConfirm}
                    activeOpacity={0.85}
                >
                    <Text style={s.ctaText}>CONFIRMAR Y FIRMAR</Text>
                    <Ionicons name="checkmark" size={18} color={T.bg} />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingBottom: 140 },
    px: { paddingHorizontal: 20 },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: T.white },

    success: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16 },
    successIcon: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: T.green,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successTitle: { fontSize: 20, fontWeight: '900', color: T.white, textAlign: 'center' },
    successSub: { fontSize: 13, color: T.muted, textAlign: 'center' },

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

    summaryCard: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 16,
        gap: 10,
    },
    summaryTitle: { fontSize: 13, fontWeight: '800', color: T.white, marginBottom: 4 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between' },
    summaryLabel: { fontSize: 12, color: T.muted },
    summaryValue: { fontSize: 12, fontWeight: '800', color: T.white },

    exercisesCard: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 16,
        gap: 10,
    },
    exRow: { borderBottomWidth: 1, borderBottomColor: T.border, paddingBottom: 10 },
    exName: { fontSize: 13, fontWeight: '800', color: T.white },
    exDetail: { fontSize: 11, color: T.muted, marginTop: 2 },

    signatureCard: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 16,
        gap: 10,
    },
    signatureSub: { fontSize: 12, color: T.muted },
    signatureInput: {
        backgroundColor: T.card2,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: T.border,
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: T.white,
        fontSize: 14,
    },

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
    ctaDisabled: { backgroundColor: T.card3 },
    ctaText: { fontSize: 14, fontWeight: '900', color: T.bg, letterSpacing: 0.5 },
});
