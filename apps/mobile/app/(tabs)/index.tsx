import { FitColors as T } from '@/constants/theme';
import { useHealthData } from '@/hooks/use-health-data';
import { useProfile } from '@/hooks/use-profile';
import { useMyRoutines } from '@/lib/api/routines';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { router } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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

const SectionHead = ({ title, right }: { title: string; right?: string }) => (
    <View style={s.secHead}>
        <Text style={s.secTitle}>{title}</Text>
        {right ? <Text style={s.secRight}>{right}</Text> : null}
    </View>
);

function greetingFor(hour: number): string {
    if (hour < 12) return 'BUENOS DÍAS';
    if (hour < 19) return 'BUENAS TARDES';
    return 'BUENAS NOCHES';
}

/** "4×10" from the routine's sets/reps; either side may be missing. */
function setsLabel(sets: number | null, reps: string | null): string {
    if (sets && reps) return `${sets}×${reps}`;
    if (sets) return `${sets} series`;
    return reps ?? '—';
}

export default function HomeScreen() {
    const { data: profile } = useProfile();
    const health = useHealthData();
    const { data: routines, isLoading: routinesLoading } = useMyRoutines();

    const now = new Date();
    // The routine the member is on right now; the backend has no per-day split,
    // so the active routine IS the plan shown. `GET /routines/mine` already
    // returns only ACTIVE assignments of ACTIVE routines, ordered by assignedAt
    // DESC, so the first item is the current one — no filtering needed here.
    const activeRoutine = routines?.[0];
    // Numbered in the trainer's intended order, not whatever order the API returned.
    const planExercises = [...(activeRoutine?.exercises ?? [])].sort((a, b) => a.displayOrder - b.displayOrder);

    const firstName = profile?.fullName?.trim().split(/\s+/)[0]?.toUpperCase() ?? '';
    const initial = firstName.charAt(0) || '·';

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Header */}
                <View style={s.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.dateLabel}>{format(now, 'EEEE, d MMM', { locale: es })}</Text>
                        <Text style={s.greeting}>
                            {`${greetingFor(now.getHours())},\n`}
                            <Text style={{ color: T.yellow }}>{firstName ? `${firstName} 💪` : '💪'}</Text>
                        </Text>
                    </View>
                    <View style={s.avatar}>
                        <Text style={s.avatarTxt}>{initial}</Text>
                    </View>
                </View>

                {/* Daily stats */}
                <View style={s.statsRow}>
                    {(
                        [
                            {
                                icon: '🔥',
                                val: health.caloriesToday.toLocaleString('es-CR'),
                                unit: 'CAL',
                                ac: T.orange,
                            },
                            { icon: '⚡', val: String(health.exercisesToday), unit: 'EJERC', ac: T.yellow },
                            { icon: '⏱', val: String(health.activeMinutesToday), unit: 'MIN', ac: T.blue },
                        ] as const
                    ).map((st, i) => (
                        <View key={i} style={s.statCard}>
                            <Text style={s.statIcon}>{st.icon}</Text>
                            <Text style={[s.statVal, { color: st.ac }]}>{st.val}</Text>
                            <Text style={s.statUnit}>{st.unit}</Text>
                        </View>
                    ))}
                </View>

                {/* Featured routine card */}
                <View style={s.px}>
                    {routinesLoading ? (
                        <View style={[s.featCard, s.featLoading]}>
                            <ActivityIndicator color={T.yellow} />
                        </View>
                    ) : activeRoutine ? (
                        <View style={s.featCard}>
                            <View style={s.featGlow} pointerEvents="none" />
                            <Pill label="TU RUTINA" />
                            <Text style={s.featTitle}>{activeRoutine.name}</Text>
                            {activeRoutine.objective ? (
                                <Text style={s.featSub} numberOfLines={2} ellipsizeMode="tail">
                                    {activeRoutine.objective}
                                </Text>
                            ) : null}
                            <View style={s.featMetaRow}>
                                <View style={s.featMetaItem}>
                                    <Text style={s.featMetaIcon}>⚡</Text>
                                    <Text style={s.featMetaText}>
                                        {planExercises.length} {planExercises.length === 1 ? 'EJERCICIO' : 'EJERCICIOS'}
                                    </Text>
                                </View>
                                {activeRoutine.createdByName ? (
                                    <View style={s.featMetaItem}>
                                        <Text style={s.featMetaIcon}>👤</Text>
                                        <Text style={s.featMetaText}>{activeRoutine.createdByName.toUpperCase()}</Text>
                                    </View>
                                ) : null}
                            </View>
                            <TouchableOpacity
                                style={s.featBtn}
                                activeOpacity={0.85}
                                onPress={() =>
                                    router.push({
                                        pathname: '/(routines)/detail',
                                        params: { id: activeRoutine.id },
                                    })
                                }
                            >
                                <Text style={s.featBtnText}>VER RUTINA →</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={[s.featCard, s.featEmpty]}>
                            <Text style={s.emptyTitle}>Sin rutina asignada</Text>
                            <Text style={s.emptyText}>Tu entrenador todavía no te ha asignado una rutina.</Text>
                        </View>
                    )}
                </View>

                {/* Routine exercises */}
                {planExercises.length > 0 && (
                    <>
                        <SectionHead title="EJERCICIOS" right={String(planExercises.length)} />
                        <View style={[s.px, { gap: 8 }]}>
                            {planExercises.map((item, index) => (
                                <View key={item.id} style={s.exRow}>
                                    <View style={s.exIndex}>
                                        <Text style={s.exIndexText}>{index + 1}</Text>
                                    </View>
                                    <Text style={s.exName} numberOfLines={1}>
                                        {item.exercise.name}
                                    </Text>
                                    <View style={s.setsBadge}>
                                        <Text style={s.setsText}>{setsLabel(item.sets, item.reps)}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </>
                )}

                {/* Streak banner */}
                {health.currentStreak > 0 && (
                    <View style={[s.px, { marginTop: 14 }]}>
                        <View style={s.streakCard}>
                            <Text style={s.streakFire}>🔥</Text>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={s.streakLabel}>RACHA ACTIVA</Text>
                                <Text style={s.streakVal}>
                                    {health.currentStreak} {health.currentStreak === 1 ? 'DÍA' : 'DÍAS SEGUIDOS'}
                                </Text>
                            </View>
                            {health.currentStreak >= health.bestStreak && <Pill label="RÉCORD" />}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* FAB — Coach IA */}
            <TouchableOpacity style={s.coachFab} onPress={() => router.push('/(coach)')} activeOpacity={0.85}>
                <Ionicons name="sparkles" size={24} color={T.bg} />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingBottom: 88 },

    coachFab: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: T.yellow,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: T.yellow,
        shadowOpacity: 0.35,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    px: { paddingHorizontal: 20 },

    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 20,
        paddingTop: 6,
    },
    dateLabel: {
        fontSize: 11,
        color: T.muted,
        fontWeight: '600',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 3,
    },
    greeting: { fontSize: 23, fontWeight: '900', color: T.white, lineHeight: 28 },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: T.yellow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarTxt: { fontSize: 20, fontWeight: '900', color: T.bg },

    statsRow: {
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 20,
        marginTop: 14,
    },
    statCard: {
        flex: 1,
        backgroundColor: T.card,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: T.border,
    },
    statIcon: { fontSize: 18, marginBottom: 4 },
    statVal: { fontSize: 20, fontWeight: '900', lineHeight: 22 },
    statUnit: {
        fontSize: 9,
        color: T.muted,
        fontWeight: '700',
        marginTop: 3,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    featCard: {
        backgroundColor: '#1a1400',
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: T.yellowBdr,
        overflow: 'hidden',
        marginTop: 14,
    },
    featLoading: { minHeight: 150, alignItems: 'center', justifyContent: 'center' },
    featEmpty: { backgroundColor: T.card, borderColor: T.border },
    emptyTitle: { fontSize: 15, fontWeight: '800', color: T.white },
    emptyText: { fontSize: 12, color: T.muted, marginTop: 6, lineHeight: 17 },
    featGlow: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: 'rgba(255,214,0,0.07)',
    },
    featTitle: {
        fontSize: 30,
        fontWeight: '900',
        color: T.white,
        marginTop: 10,
        lineHeight: 30,
        textTransform: 'uppercase',
        letterSpacing: -1,
    },
    featSub: {
        color: T.muted,
        fontSize: 10,
        fontWeight: '700',
        marginTop: 6,
        letterSpacing: 1,
        // Needed once the objective wraps to a second line before being clipped.
        lineHeight: 15,
        textTransform: 'uppercase',
    },
    featMetaRow: { flexDirection: 'row', gap: 14, marginTop: 14 },
    featMetaItem: { flexDirection: 'row', gap: 4, alignItems: 'center' },
    featMetaIcon: { fontSize: 11 },
    featMetaText: { fontSize: 10, color: T.muted, fontWeight: '700' },
    featBtn: {
        backgroundColor: T.yellow,
        borderRadius: 10,
        paddingVertical: 11,
        paddingHorizontal: 20,
        marginTop: 16,
        alignSelf: 'flex-start',
    },
    featBtnText: {
        color: T.bg,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    secHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    secTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: T.white,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },
    secRight: { fontSize: 11, fontWeight: '700', color: T.yellow },

    exRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: T.card,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: T.border,
    },
    exIndex: {
        width: 24,
        height: 24,
        borderRadius: 7,
        backgroundColor: T.bg,
        borderWidth: 1,
        borderColor: T.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Muted on purpose: the yellow accent belongs to the sets badge, which carries
    // the actual data — the ordinal is just scaffolding.
    exIndexText: { fontSize: 11, fontWeight: '800', color: T.muted },
    exName: { flex: 1, fontSize: 13, fontWeight: '600', color: T.white },
    setsBadge: {
        backgroundColor: T.yellowDim,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    setsText: { fontSize: 11, fontWeight: '800', color: T.yellow },

    streakCard: {
        backgroundColor: T.yellowDim,
        borderWidth: 1,
        borderColor: T.yellowBdr,
        borderRadius: 16,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
    },
    streakFire: { fontSize: 28 },
    streakLabel: {
        fontSize: 10,
        color: T.yellow,
        fontWeight: '700',
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },
    streakVal: { fontSize: 18, fontWeight: '900', color: T.white, marginTop: 1 },
});
