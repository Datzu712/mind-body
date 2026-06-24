import { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import { getMemberRoutinesForMember, getRoutineById, getRoutineProgress } from '@/lib/training/training-data';
import { useWorkoutSessions } from '@/lib/training/training-storage';

// ── Helpers ───────────────────────────────────────────────────────────────────

const Bar = ({ pct, color = T.yellow, h = 4 }: { pct: number; color?: string; h?: number }) => (
    <View style={{ backgroundColor: T.card3, height: h, borderRadius: h, overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', backgroundColor: color }} />
    </View>
);

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

// ── Screen ────────────────────────────────────────────────────────────────────

export default function RoutinesScreen() {
    const { sessions } = useWorkoutSessions();
    const memberRoutines = useMemo(() => getMemberRoutinesForMember(), []);

    const routinesWithMeta = useMemo(
        () =>
            memberRoutines.map((mr) => {
                const routine = getRoutineById(mr.routineId);
                const pct = routine ? getRoutineProgress(mr.id, sessions) : 0;
                return { memberRoutine: mr, routine, pct };
            }),
        [memberRoutines, sessions],
    );

    const completed = routinesWithMeta.filter((r) => r.pct === 100).length;
    const total = routinesWithMeta.length || 1;

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Header */}
                <View style={s.header}>
                    <Text style={s.eyebrow}>SEMANA ACTUAL</Text>
                    <Text style={s.title}>MIS RUTINAS</Text>
                </View>

                {/* Week overview */}
                <View style={s.px}>
                    <View style={s.weekCard}>
                        <View style={s.weekTopRow}>
                            <Text style={s.weekLabel}>PROGRESO SEMANAL</Text>
                            <Text style={s.weekCount}>
                                {completed}/{routinesWithMeta.length} COMPLETADOS
                            </Text>
                        </View>
                        <Bar pct={(completed / total) * 100} h={5} />
                    </View>
                </View>

                {/* Routine list */}
                <View style={s.secHead}>
                    <Text style={s.secTitle}>RUTINAS ASIGNADAS</Text>
                </View>
                <View style={[s.px, { gap: 10 }]}>
                    {routinesWithMeta.map(({ memberRoutine, routine, pct }) => {
                        if (!routine) return null;
                        const accent = pct === 100 ? T.green : T.yellow;
                        return (
                            <TouchableOpacity
                                key={memberRoutine.id}
                                style={[s.routineCard, pct === 100 && { borderColor: accent + '44' }]}
                                activeOpacity={0.85}
                                onPress={() => router.push(`/routine/${memberRoutine.id}`)}
                            >
                                <View
                                    style={{ height: 3, backgroundColor: pct > 0 ? accent : T.border, borderRadius: 2 }}
                                />
                                <View style={s.routineInner}>
                                    <View style={{ flex: 1 }}>
                                        <View style={s.routineTopRow}>
                                            <Text style={s.routineDayLabel}>
                                                {new Date(memberRoutine.assignedAt).toLocaleDateString('es-ES', {
                                                    weekday: 'long',
                                                })}
                                            </Text>
                                            <Pill
                                                label={pct === 100 ? 'HECHO' : 'PENDIENTE'}
                                                bg={accent + '22'}
                                                fg={accent}
                                                sm
                                            />
                                        </View>
                                        <Text style={s.routineName}>{routine.name}</Text>
                                        <Text style={s.routineSub}>{routine.objective}</Text>
                                    </View>

                                    {pct === 100 ? (
                                        <View style={[s.doneCircle, { backgroundColor: accent }]}>
                                            <Ionicons name="checkmark" size={14} color={T.bg} />
                                        </View>
                                    ) : (
                                        <View style={s.startBtn}>
                                            <Text style={s.startBtnText}>INICIAR</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={s.routineProgress}>
                                    <View style={s.routineProgressRow}>
                                        <Text style={s.routineProgressMeta}>{routine.exercises.length} ejercicios</Text>
                                        <Text style={[s.routineProgressPct, { color: pct > 0 ? accent : T.muted }]}>
                                            {pct}%
                                        </Text>
                                    </View>
                                    <Bar pct={pct} color={accent} h={3} />
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

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

    // Week card
    weekCard: { backgroundColor: T.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border },
    weekTopRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
    weekLabel: { fontSize: 11, fontWeight: '700', color: T.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
    weekCount: { fontSize: 11, fontWeight: '800', color: T.yellow },

    // Section head
    secHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    secTitle: { fontSize: 12, fontWeight: '800', color: T.white, letterSpacing: 1.5, textTransform: 'uppercase' },

    // Routine card
    routineCard: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        overflow: 'hidden',
    },
    routineInner: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, paddingBottom: 10 },
    routineTopRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 },
    routineDayLabel: { fontSize: 9, color: T.muted, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
    routineName: { fontSize: 15, fontWeight: '800', color: T.white, letterSpacing: -0.2 },
    routineSub: { fontSize: 11, color: T.muted, marginTop: 2 },
    doneCircle: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    startBtn: {
        backgroundColor: T.yellowDim,
        borderWidth: 1,
        borderColor: T.yellowBdr,
        borderRadius: 9,
        paddingVertical: 7,
        paddingHorizontal: 12,
    },
    startBtnText: { color: T.yellow, fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
    routineProgress: { paddingHorizontal: 14, paddingBottom: 12 },
    routineProgressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    routineProgressMeta: { fontSize: 10, color: T.muted, fontWeight: '600' },
    routineProgressPct: { fontSize: 10, fontWeight: '800' },
});
