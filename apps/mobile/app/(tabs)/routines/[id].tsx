import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    ActivityIndicator,
    Switch,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';

import { FitColors as T } from '@/constants/theme';
import {
    useConfirmSession,
    useCreateSession,
    useRoutine,
    useSessions,
    useUpdateExerciseLog,
    useValidateSession,
} from '@/hooks/use-training';
import { useIsTrainer } from '@/hooks/use-is-trainer';
import type { RoutineExercise, TrainingSession } from '@/lib/api/types/training';
import { getMockRoutineMaterials } from '@/lib/mock-routine-materials';

// ── Helpers ───────────────────────────────────────────────────────────────────

const statusLabel: Record<string, string> = {
    PENDING: 'PENDIENTE',
    CONFIRMED: 'CONFIRMADA',
    VALIDATED: 'VALIDADA',
    EXPIRED: 'EXPIRADA',
};

const statusColor: Record<string, string> = {
    PENDING: T.yellow,
    CONFIRMED: T.blue,
    VALIDATED: T.green,
    EXPIRED: T.muted,
};

function parseNum(v: string): number | undefined {
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : undefined;
}

function formatDate(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString();
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <View style={s.centerBox}>
            <Ionicons name="alert-circle-outline" size={40} color={T.red} />
            <Text style={s.errorText}>{message}</Text>
            <TouchableOpacity onPress={onRetry} style={s.actionBtn} activeOpacity={0.8}>
                <Text style={s.actionBtnText}>Reintentar</Text>
            </TouchableOpacity>
        </View>
    );
}

function EmptyState({ icon, title, message }: { icon: string; title: string; message: string }) {
    return (
        <View style={s.centerBox}>
            <Ionicons name={icon as never} size={48} color={T.muted} />
            <Text style={s.emptyTitle}>{title}</Text>
            <Text style={s.emptyMessage}>{message}</Text>
        </View>
    );
}

function SessionHistoryItem({
    session,
    isTrainer,
    onValidate,
    onResume,
    validating,
}: {
    session: TrainingSession;
    isTrainer: boolean;
    onValidate: (id: string) => void;
    onResume: (id: string) => void;
    validating: boolean;
}) {
    const canValidate = isTrainer && session.status === 'CONFIRMED' && !session.validatedAt;
    const canResume = !isTrainer && session.status === 'PENDING';
    const logs = session.exerciseLogs ?? [];
    return (
        <TouchableOpacity
            style={s.historyCard}
            onPress={() => canResume && onResume(session.id)}
            activeOpacity={canResume ? 0.8 : 1}
            disabled={!canResume}
        >
            <View style={{ flex: 1, gap: 6 }}>
                <Text style={s.historyDate}>{formatDate(session.date)}</Text>
                <View style={s.historyRow}>
                    <View style={[s.statusDot, { backgroundColor: statusColor[session.status] ?? T.muted }]} />
                    <Text style={[s.historyStatus, { color: statusColor[session.status] ?? T.muted }]}>
                        {statusLabel[session.status] ?? session.status}
                    </Text>
                </View>
                {logs.length > 0 && (
                    <View style={{ gap: 2 }}>
                        {logs.slice(0, 3).map((log) => (
                            <Text key={log.id} style={s.historyLog}>
                                {log.exerciseName ?? 'Ejercicio'}: {log.targetSets ?? '-'}x{log.targetReps ?? '-'}{' '}
                                {log.targetWeightKg != null ? `@ ${log.targetWeightKg}kg` : ''}
                            </Text>
                        ))}
                        {logs.length > 3 && <Text style={s.historyLog}>+{logs.length - 3} más</Text>}
                    </View>
                )}
            </View>
            {canValidate && (
                <TouchableOpacity
                    style={[s.validateBtn, validating && { opacity: 0.6 }]}
                    onPress={() => onValidate(session.id)}
                    disabled={validating}
                    activeOpacity={0.8}
                >
                    <Text style={s.validateBtnText}>Validar</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
}

function ExerciseRow({
    ex,
    sessionId,
    editable,
    log,
    onChange,
}: {
    ex: RoutineExercise;
    sessionId: string;
    editable: boolean;
    log: LocalLog | undefined;
    onChange: (routineExerciseId: string, patch: Partial<LocalLog>) => void;
}) {
    const update = useUpdateExerciseLog();
    const value = log ?? { weight: '', reps: '', obs: '', completed: false };

    const save = () => {
        const weight = parseNum(value.weight);
        const reps = value.reps.trim();
        update.mutate({
            sessionId,
            payload: {
                routineExerciseId: ex.id,
                weightKgActual: weight,
                completedRepsLog: reps || undefined,
                notes: value.obs.trim() || undefined,
                completed: value.completed,
            },
        });
    };

    return (
        <View style={s.exerciseCard}>
            <View style={s.exerciseHeader}>
                <Text style={s.exerciseName}>{ex.exerciseName ?? 'Ejercicio'}</Text>
                <Switch
                    value={value.completed}
                    onValueChange={(checked) => {
                        onChange(ex.id, { completed: checked });
                        if (editable) save();
                    }}
                    disabled={!editable}
                    trackColor={{ false: T.card3, true: T.green + '55' }}
                    thumbColor={value.completed ? T.green : T.muted}
                />
            </View>
            {ex.sets || ex.reps ? (
                <Text style={s.exerciseTarget}>
                    {ex.sets ? `${ex.sets} series` : ''}
                    {ex.sets && ex.reps ? ' · ' : ''}
                    {ex.reps ? `${ex.reps} reps` : ''}
                </Text>
            ) : null}
            <Text style={s.exerciseTarget}>
                Descanso: {ex.restSeconds === 0 ? 'Sin descanso' : `${ex.restSeconds ?? 60} s`}
            </Text>
            {ex.notes ? <Text style={s.exerciseNotes}>{ex.notes}</Text> : null}

            <View style={s.inputsRow}>
                <View style={s.inputWrap}>
                    <Text style={s.inputLabel}>PESO (kg)</Text>
                    <TextInput
                        style={s.input}
                        keyboardType="decimal-pad"
                        value={value.weight}
                        onChangeText={(t) => onChange(ex.id, { weight: t })}
                        onBlur={editable ? save : undefined}
                        editable={editable}
                        placeholder="0"
                        placeholderTextColor={T.muted}
                    />
                </View>
                <View style={[s.inputWrap, { flex: 2 }]}>
                    <Text style={s.inputLabel}>REPS</Text>
                    <TextInput
                        style={s.input}
                        value={value.reps}
                        onChangeText={(t) => onChange(ex.id, { reps: t })}
                        onBlur={editable ? save : undefined}
                        editable={editable}
                        placeholder="10,8,8"
                        placeholderTextColor={T.muted}
                    />
                </View>
                <View style={[s.inputWrap, { flex: 2 }]}>
                    <Text style={s.inputLabel}>OBS</Text>
                    <TextInput
                        style={s.input}
                        value={value.obs}
                        onChangeText={(t) => onChange(ex.id, { obs: t })}
                        onBlur={editable ? save : undefined}
                        editable={editable}
                        placeholder="Notas"
                        placeholderTextColor={T.muted}
                    />
                </View>
            </View>
        </View>
    );
}

interface LocalLog {
    weight: string;
    reps: string;
    obs: string;
    completed: boolean;
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function RoutineDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const isTrainer = useIsTrainer();

    const { data: routine, isLoading: routineLoading, error: routineError, refetch: refetchRoutine } = useRoutine(id);
    const {
        data: sessions,
        isLoading: sessionsLoading,
        error: sessionsError,
        refetch: refetchSessions,
    } = useSessions();

    const create = useCreateSession();
    const confirm = useConfirmSession();
    const validate = useValidateSession();
    const updateLog = useUpdateExerciseLog();

    const saveAllLogs = async () => {
        if (!activeSessionId || !routine) return;
        await Promise.all(
            routine.exercises.map((ex) => {
                const value = logs[ex.id];
                if (!value) return Promise.resolve();
                const weight = parseNum(value.weight);
                const reps = value.reps.trim();
                return updateLog.mutateAsync({
                    sessionId: activeSessionId,
                    payload: {
                        routineExerciseId: ex.id,
                        weightKgActual: weight,
                        completedRepsLog: reps || undefined,
                        notes: value.obs.trim() || undefined,
                        completed: value.completed,
                    },
                });
            }),
        );
    };

    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const [logs, setLogs] = useState<Record<string, LocalLog>>({});

    const activeSession = useMemo(
        () => sessions?.find((s) => s.id === activeSessionId) ?? null,
        [sessions, activeSessionId],
    );

    useEffect(() => {
        if (!activeSession) {
            setLogs({});
            return;
        }
        const next: Record<string, LocalLog> = {};
        for (const log of activeSession.exerciseLogs ?? []) {
            next[log.routineExerciseId] = {
                weight: log.weightKgActual != null ? String(log.weightKgActual) : '',
                reps: log.completedRepsLog ?? '',
                obs: log.notes ?? '',
                completed: log.completed,
            };
        }
        setLogs(next);
    }, [activeSession?.id]);

    const filteredSessions = useMemo(() => {
        if (!sessions || !routine) return [];
        return sessions.filter((s) => s.memberRoutineId === routine.memberRoutineId);
    }, [sessions, routine]);
    const materials = useMemo(() => (routine ? getMockRoutineMaterials(routine.name) : []), [routine?.name]);

    const editable = Boolean(activeSession && activeSession.status === 'PENDING');

    const startSession = () => {
        if (!routine) return;
        create.mutate(routine.memberRoutineId, {
            onSuccess: (s) => setActiveSessionId(s.id),
        });
    };

    const confirmSession = async () => {
        if (!activeSessionId) return;
        await saveAllLogs();
        confirm.mutate(activeSessionId, {
            onSuccess: () => setActiveSessionId(null),
        });
    };

    const updateLocalLog = (routineExerciseId: string, patch: Partial<LocalLog>) => {
        setLogs((prev) => ({
            ...prev,
            [routineExerciseId]: {
                ...(prev[routineExerciseId] ?? { weight: '', reps: '', obs: '', completed: false }),
                ...patch,
            },
        }));
    };

    if (routineLoading) {
        return (
            <SafeAreaView style={s.root} edges={['top']}>
                <View style={s.loadingBox}>
                    <ActivityIndicator size="large" color={T.yellow} />
                    <Text style={s.loadingText}>Cargando rutina...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (routineError || !routine) {
        return (
            <SafeAreaView style={s.root} edges={['top']}>
                <ScrollView contentContainerStyle={s.scroll}>
                    <View style={s.header}>
                        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.8}>
                            <Ionicons name="arrow-back" size={22} color={T.white} />
                        </TouchableOpacity>
                    </View>
                    <ErrorRetry message="No se pudo cargar la rutina" onRetry={refetchRoutine} />
                </ScrollView>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Header */}
                <View style={s.header}>
                    <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.8}>
                        <Ionicons name="arrow-back" size={22} color={T.white} />
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <Text style={s.eyebrow}>RUTINA</Text>
                        <Text style={s.title}>{routine.name}</Text>
                    </View>
                </View>

                {/* Info */}
                <View style={[s.px, { marginBottom: 16 }]}>
                    <View style={s.infoCard}>
                        {routine.objective ? (
                            <View style={s.infoRow}>
                                <Ionicons name="flag-outline" size={14} color={T.yellow} />
                                <Text style={s.infoText}>{routine.objective}</Text>
                            </View>
                        ) : null}
                        <View style={s.infoRow}>
                            <Ionicons name="list-outline" size={14} color={T.yellow} />
                            <Text style={s.infoText}>
                                {routine.exercises.length} ejercicio{routine.exercises.length === 1 ? '' : 's'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Start / confirm */}
                <View style={[s.px, { gap: 10, marginBottom: 20 }]}>
                    {!activeSessionId ? (
                        <TouchableOpacity
                            onPress={startSession}
                            disabled={create.isPending}
                            style={[s.mainBtn, create.isPending && { opacity: 0.6 }]}
                            activeOpacity={0.85}
                        >
                            {create.isPending ? (
                                <ActivityIndicator color={T.bg} />
                            ) : (
                                <Text style={s.mainBtnText}>INICIAR ENTRENAMIENTO</Text>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <>
                            <View style={s.sessionBanner}>
                                <Ionicons name="fitness-outline" size={18} color={T.yellow} />
                                <Text style={s.sessionBannerText}>Sesión activa · registrá tus ejercicios</Text>
                            </View>
                            {activeSession?.status === 'PENDING' && (
                                <TouchableOpacity
                                    onPress={confirmSession}
                                    disabled={confirm.isPending}
                                    style={[s.mainBtn, confirm.isPending && { opacity: 0.6 }]}
                                    activeOpacity={0.85}
                                >
                                    {confirm.isPending ? (
                                        <ActivityIndicator color={T.bg} />
                                    ) : (
                                        <Text style={s.mainBtnText}>CONFIRMAR</Text>
                                    )}
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                    {create.isError && <Text style={s.errorInline}>{create.error?.message ?? 'Error al iniciar'}</Text>}
                    {confirm.isError && (
                        <Text style={s.errorInline}>{confirm.error?.message ?? 'Error al confirmar'}</Text>
                    )}
                </View>

                {/* Exercises */}
                <View style={s.secHead}>
                    <Text style={s.secTitle}>EJERCICIOS</Text>
                </View>
                <View style={[s.px, { gap: 10, marginBottom: 24 }]}>
                    {routine.exercises.length === 0 ? (
                        <EmptyState
                            icon="barbell-outline"
                            title="Sin ejercicios"
                            message="Esta rutina no tiene ejercicios cargados."
                        />
                    ) : (
                        routine.exercises
                            .sort((a, b) => a.displayOrder - b.displayOrder)
                            .map((ex) => (
                                <ExerciseRow
                                    key={ex.id}
                                    ex={ex}
                                    sessionId={activeSessionId ?? ''}
                                    editable={editable}
                                    log={logs[ex.id]}
                                    onChange={updateLocalLog}
                                />
                            ))
                    )}
                </View>

                {/* Support material */}
                <View style={s.secHead}>
                    <Text style={s.secTitle}>MATERIAL DE APOYO</Text>
                </View>
                <View style={[s.px, { gap: 10, marginBottom: 24 }]}>
                    {materials.length === 0 ? (
                        <EmptyState
                            icon="document-attach-outline"
                            title="Sin material"
                            message="Esta rutina no tiene archivos de apoyo disponibles."
                        />
                    ) : (
                        materials.map((material) => (
                            <TouchableOpacity
                                key={material.id}
                                style={s.materialCard}
                                activeOpacity={0.85}
                                onPress={async () => {
                                    if (await Linking.canOpenURL(material.url)) {
                                        await Linking.openURL(material.url);
                                    }
                                }}
                            >
                                <View style={s.materialIcon}>
                                    <Ionicons name="download-outline" size={18} color={T.yellow} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.materialTitle}>{material.title}</Text>
                                    <Text style={s.materialMeta}>
                                        {material.type} · {material.size}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* History */}
                <View style={s.secHead}>
                    <Text style={s.secTitle}>HISTORIAL</Text>
                </View>
                <View style={[s.px, { gap: 10, paddingBottom: 28 }]}>
                    {sessionsLoading ? (
                        <ActivityIndicator color={T.yellow} />
                    ) : sessionsError ? (
                        <ErrorRetry message="No se pudo cargar el historial" onRetry={refetchSessions} />
                    ) : filteredSessions.length === 0 ? (
                        <EmptyState
                            icon="time-outline"
                            title="No hay sesiones registradas"
                            message="Iniciá una sesión para empezar a registrar tu progreso."
                        />
                    ) : (
                        filteredSessions.map((session) => (
                            <SessionHistoryItem
                                key={session.id}
                                session={session}
                                isTrainer={isTrainer}
                                onValidate={(sid) => validate.mutate(sid)}
                                onResume={(sid) => setActiveSessionId(sid)}
                                validating={validate.isPending}
                            />
                        ))
                    )}
                    {validate.isError && (
                        <Text style={s.errorInline}>{validate.error?.message ?? 'Error al validar'}</Text>
                    )}
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

    loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: T.muted, fontSize: 13, fontWeight: '600' },

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 14,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: T.card,
        borderWidth: 1,
        borderColor: T.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    eyebrow: {
        fontSize: 11,
        color: T.muted,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: { fontSize: 22, fontWeight: '900', color: T.white, flexShrink: 1 },

    infoCard: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
        gap: 10,
    },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    infoText: { color: T.white, fontSize: 13, fontWeight: '600', flex: 1 },

    mainBtn: {
        backgroundColor: T.yellow,
        borderRadius: 14,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
    },
    mainBtnText: { color: T.bg, fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
    sessionBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: T.yellowDim,
        borderWidth: 1,
        borderColor: T.yellowBdr,
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    sessionBannerText: { color: T.yellow, fontSize: 13, fontWeight: '700' },
    errorInline: { color: T.red, fontSize: 12, fontWeight: '600', textAlign: 'center' },

    secHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 4,
        paddingBottom: 10,
    },
    secTitle: { fontSize: 12, fontWeight: '800', color: T.white, letterSpacing: 1.5, textTransform: 'uppercase' },

    exerciseCard: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
        gap: 10,
    },
    exerciseHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    exerciseName: { fontSize: 15, fontWeight: '800', color: T.white, flex: 1, flexShrink: 1 },
    exerciseTarget: { fontSize: 12, color: T.yellow, fontWeight: '700' },
    exerciseNotes: { fontSize: 11, color: T.muted, lineHeight: 16 },
    materialCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
    },
    materialIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: T.yellowDim,
        borderWidth: 1,
        borderColor: T.yellowBdr,
        alignItems: 'center',
        justifyContent: 'center',
    },
    materialTitle: { fontSize: 14, fontWeight: '800', color: T.white },
    materialMeta: { fontSize: 11, fontWeight: '700', color: T.muted, marginTop: 2 },
    inputsRow: { flexDirection: 'row', gap: 10 },
    inputWrap: { flex: 1, gap: 6 },
    inputLabel: { fontSize: 9, color: T.muted, fontWeight: '800', letterSpacing: 0.5 },
    input: {
        backgroundColor: T.card2,
        borderWidth: 1,
        borderColor: T.border,
        borderRadius: 10,
        color: T.white,
        fontSize: 14,
        paddingHorizontal: 12,
        height: 42,
    },

    historyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
        gap: 12,
    },
    historyDate: { fontSize: 13, fontWeight: '800', color: T.white },
    historyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3 },
    historyStatus: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
    historyLog: { fontSize: 11, color: T.muted },
    validateBtn: {
        backgroundColor: T.green + '22',
        borderWidth: 1,
        borderColor: T.green + '44',
        borderRadius: 10,
        paddingVertical: 7,
        paddingHorizontal: 14,
    },
    validateBtnText: { color: T.green, fontSize: 12, fontWeight: '800' },

    centerBox: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 24,
        alignItems: 'center',
        gap: 10,
    },
    emptyTitle: { fontSize: 15, fontWeight: '800', color: T.white, marginTop: 8 },
    emptyMessage: { fontSize: 12, color: T.muted, textAlign: 'center', lineHeight: 18 },
    errorText: { fontSize: 13, color: T.white, textAlign: 'center' },
    actionBtn: {
        backgroundColor: T.yellowDim,
        borderWidth: 1,
        borderColor: T.yellowBdr,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginTop: 4,
    },
    actionBtnText: { color: T.yellow, fontSize: 12, fontWeight: '800' },
});
