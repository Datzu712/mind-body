import { useEffect, useMemo, useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import {
    createEmptySession,
    getExerciseById,
    getRoutineForMemberRoutine,
    type WorkoutSession,
} from '@/lib/training/training-data';
import { loadWorkoutSessions, saveWorkoutSession } from '@/lib/training/training-storage';

export default function WorkoutSessionScreen() {
    const { memberRoutineId } = useLocalSearchParams<{ memberRoutineId: string }>();
    const data = useMemo(() => getRoutineForMemberRoutine(memberRoutineId), [memberRoutineId]);
    const [session, setSession] = useState<WorkoutSession | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        let active = true;
        (async () => {
            const existing = await findOrCreateSession(memberRoutineId);
            if (active) setSession(existing);
        })();
        return () => {
            active = false;
        };
    }, [memberRoutineId]);

    const updateSet = useCallback(
        (exerciseIndex: number, setIndex: number, patch: { weight?: string; reps?: string; done?: boolean }) => {
            setSession((prev) => {
                if (!prev) return prev;
                const next = { ...prev };
                next.exercises = prev.exercises.map((ex, i) => {
                    if (i !== exerciseIndex) return ex;
                    return {
                        ...ex,
                        sets: ex.sets.map((set, j) => {
                            if (j !== setIndex) return set;
                            return {
                                ...set,
                                weight: patch.weight === undefined ? set.weight : parseNumber(patch.weight),
                                reps: patch.reps === undefined ? set.reps : parseNumber(patch.reps),
                                done: patch.done === undefined ? set.done : patch.done,
                            };
                        }),
                    };
                });
                return next;
            });
        },
        [],
    );

    const updateNotes = useCallback((exerciseIndex: number, notes: string) => {
        setSession((prev) => {
            if (!prev) return prev;
            const next = { ...prev };
            next.exercises = prev.exercises.map((ex, i) => (i === exerciseIndex ? { ...ex, notes } : ex));
            return next;
        });
    }, []);

    const addSet = useCallback((exerciseIndex: number) => {
        setSession((prev) => {
            if (!prev) return prev;
            const next = { ...prev };
            next.exercises = prev.exercises.map((ex, i) =>
                i === exerciseIndex
                    ? { ...ex, sets: [...ex.sets, { weight: undefined, reps: undefined, done: false }] }
                    : ex,
            );
            return next;
        });
    }, []);

    const finish = useCallback(async () => {
        if (!session) return;
        setSaving(true);
        await saveWorkoutSession(session);
        setSaving(false);
        router.push(`/workout-confirmation?sessionId=${session.id}&memberRoutineId=${memberRoutineId}`);
    }, [session, memberRoutineId]);

    if (!data || !session) {
        return (
            <SafeAreaView style={s.root} edges={['top']}>
                <Stack.Screen options={{ title: 'Sesión', headerShown: true }} />
                <View style={s.empty}>
                    <Ionicons name="barbell-outline" size={48} color={T.muted} />
                    <Text style={s.emptyTitle}>Cargando sesión...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const { routine } = data;
    const allDone = session.exercises.every((ex) => ex.sets.length > 0 && ex.sets.every((set) => set.done));

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <Stack.Screen options={{ title: routine.name, headerShown: false }} />
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                    {/* Header */}
                    <View style={s.header}>
                        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
                            <Ionicons name="arrow-back" size={24} color={T.white} />
                        </TouchableOpacity>
                        <Text style={s.eyebrow}>SESION DE ENTRENAMIENTO</Text>
                        <Text style={s.title}>{routine.name}</Text>
                    </View>

                    {/* Exercises */}
                    <View style={[s.px, { gap: 16 }]}>
                        {session.exercises.map((ex, exerciseIndex) => {
                            const re = routine.exercises[exerciseIndex];
                            const exercise = re ? getExerciseById(re.exerciseId) : undefined;
                            if (!re || !exercise) return null;
                            return (
                                <View key={re.id} style={s.exCard}>
                                    <View style={s.exHeader}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={s.exName}>{exercise.name}</Text>
                                            <Text style={s.exMeta}>
                                                Objetivo: {re.sets} series · {re.reps}
                                            </Text>
                                        </View>
                                        <Text style={s.exEmoji}>{exercise.emoji}</Text>
                                    </View>

                                    {ex.sets.map((set, setIndex) => (
                                        <View key={setIndex} style={s.setRow}>
                                            <Text style={s.setNum}>{setIndex + 1}</Text>
                                            <TextInput
                                                style={s.input}
                                                placeholder="Peso"
                                                placeholderTextColor={T.muted}
                                                keyboardType="numeric"
                                                value={set.weight?.toString() ?? ''}
                                                onChangeText={(text) =>
                                                    updateSet(exerciseIndex, setIndex, { weight: text })
                                                }
                                            />
                                            <TextInput
                                                style={s.input}
                                                placeholder="Reps"
                                                placeholderTextColor={T.muted}
                                                keyboardType="numeric"
                                                value={set.reps?.toString() ?? ''}
                                                onChangeText={(text) =>
                                                    updateSet(exerciseIndex, setIndex, { reps: text })
                                                }
                                            />
                                            <TouchableOpacity
                                                style={[s.checkBtn, set.done && s.checkBtnDone]}
                                                onPress={() => updateSet(exerciseIndex, setIndex, { done: !set.done })}
                                                activeOpacity={0.8}
                                            >
                                                <Ionicons
                                                    name={set.done ? 'checkmark' : 'checkbox-outline'}
                                                    size={18}
                                                    color={set.done ? T.bg : T.muted}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    ))}

                                    <TouchableOpacity
                                        style={s.addSetBtn}
                                        onPress={() => addSet(exerciseIndex)}
                                        activeOpacity={0.75}
                                    >
                                        <Ionicons name="add" size={16} color={T.yellow} />
                                        <Text style={s.addSetText}>Añadir serie</Text>
                                    </TouchableOpacity>

                                    <TextInput
                                        style={s.notesInput}
                                        placeholder="Observaciones..."
                                        placeholderTextColor={T.muted}
                                        multiline
                                        value={ex.notes ?? ''}
                                        onChangeText={(text) => updateNotes(exerciseIndex, text)}
                                    />
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={s.footer}>
                    <TouchableOpacity
                        style={[s.cta, (!allDone || saving) && s.ctaDisabled]}
                        disabled={!allDone || saving}
                        onPress={finish}
                        activeOpacity={0.85}
                    >
                        <Text style={s.ctaText}>{saving ? 'GUARDANDO...' : 'FINALIZAR SESIÓN'}</Text>
                        <Ionicons name="arrow-forward" size={18} color={T.bg} />
                    </TouchableOpacity>
                    {!allDone && <Text style={s.hint}>Marca todas las series como hechas para continuar</Text>}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

async function findOrCreateSession(memberRoutineId: string) {
    const sessions = (await loadWorkoutSessions()).filter(
        (s) => s.memberRoutineId === memberRoutineId && s.status === 'IN_PROGRESS',
    );
    const latest = sessions.sort((a, b) => b.date.localeCompare(a.date))[0];
    return latest ?? createEmptySession(memberRoutineId);
}

function parseNumber(value: string): number | undefined {
    const n = Number(value.replace(',', '.'));
    return Number.isFinite(n) && n >= 0 ? n : undefined;
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingBottom: 140 },
    px: { paddingHorizontal: 20 },

    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: T.white },

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

    exCard: { backgroundColor: T.card, borderRadius: 16, borderWidth: 1, borderColor: T.border, padding: 14, gap: 10 },
    exHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    exName: { fontSize: 15, fontWeight: '800', color: T.white },
    exMeta: { fontSize: 11, color: T.muted, marginTop: 2 },
    exEmoji: { fontSize: 24 },

    setRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    setNum: { width: 18, fontSize: 12, fontWeight: '800', color: T.muted, textAlign: 'center' },
    input: {
        flex: 1,
        backgroundColor: T.card2,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: T.border,
        paddingHorizontal: 10,
        paddingVertical: 8,
        color: T.white,
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },
    checkBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: T.card2,
        borderWidth: 1,
        borderColor: T.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkBtnDone: { backgroundColor: T.green, borderColor: T.green },

    addSetBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: T.yellowBdr,
        borderStyle: 'dashed',
        borderRadius: 10,
    },
    addSetText: { fontSize: 12, fontWeight: '800', color: T.yellow },

    notesInput: {
        backgroundColor: T.card2,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: T.border,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: T.white,
        fontSize: 13,
        minHeight: 64,
        textAlignVertical: 'top',
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
    hint: { fontSize: 11, color: T.muted, textAlign: 'center', marginTop: 8 },
});
