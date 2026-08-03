import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { FitColors as T } from '@/constants/theme';
import { useMyRoutines, type RoutineDetail } from '@/lib/api/routines';

const Pill = ({ label, bg = T.yellow, fg = T.bg }: { label: string; bg?: string; fg?: string }) => (
    <View
        style={{
            backgroundColor: bg,
            borderRadius: 5,
            paddingHorizontal: 8,
            paddingVertical: 3,
            alignSelf: 'flex-start',
        }}
    >
        <Text style={{ color: fg, fontSize: 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' }}>
            {label}
        </Text>
    </View>
);

export default function RoutinesScreen() {
    const { data: routines, isPending, isError, refetch } = useMyRoutines();

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Header */}
                <View style={s.header}>
                    <Text style={s.eyebrow}>ASIGNADAS POR TU TRAINER</Text>
                    <Text style={s.title}>MIS RUTINAS</Text>
                </View>

                {isPending ? (
                    <View style={s.centerBox}>
                        <ActivityIndicator color={T.yellow} size="large" />
                    </View>
                ) : isError ? (
                    <View style={s.centerBox}>
                        <Ionicons name="cloud-offline-outline" size={40} color={T.muted} />
                        <Text style={s.centerText}>No se pudieron cargar tus rutinas</Text>
                        <TouchableOpacity style={s.retryBtn} onPress={() => void refetch()}>
                            <Text style={s.retryText}>REINTENTAR</Text>
                        </TouchableOpacity>
                    </View>
                ) : !routines?.length ? (
                    <View style={s.centerBox}>
                        <View style={s.emptyIcon}>
                            <Ionicons name="clipboard-outline" size={32} color={T.muted} />
                        </View>
                        <Text style={s.centerText}>Sin rutinas asignadas</Text>
                        <Text style={s.centerSub}>
                            Cuando tu entrenador te asigne una rutina, la vas a ver aquí con sus ejercicios, series y
                            repeticiones.
                        </Text>
                    </View>
                ) : (
                    <View style={[s.px, { gap: 12 }]}>
                        {routines.map((routine) => (
                            <RoutineCard key={routine.id} routine={routine} />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function RoutineCard({ routine }: { routine: RoutineDetail }) {
    return (
        <TouchableOpacity
            style={s.routineCard}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/(routines)/detail', params: { id: routine.id } })}
        >
            <View style={{ height: 3, backgroundColor: T.yellow, borderRadius: 2 }} />
            <View style={s.routineInner}>
                <View style={{ flex: 1 }}>
                    <Text style={s.routineName} numberOfLines={1}>
                        {routine.name}
                    </Text>
                    {routine.objective ? (
                        <Text style={s.routineObjective} numberOfLines={2}>
                            {routine.objective}
                        </Text>
                    ) : null}
                    <View style={s.pillRow}>
                        <Pill
                            label={`${routine.exercises.length} ejercicios`}
                            bg="rgba(255,214,0,0.15)"
                            fg={T.yellow}
                        />
                        {routine.createdByName ? (
                            <Pill label={routine.createdByName} bg={T.card2} fg={T.muted} />
                        ) : null}
                    </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={T.muted} />
            </View>
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingBottom: 24 },
    px: { paddingHorizontal: 20 },
    header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
    eyebrow: { color: T.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 },
    title: { color: T.white, fontSize: 24, fontWeight: '900', letterSpacing: 0.5, marginTop: 2 },
    centerBox: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 40, paddingTop: 80 },
    centerText: { color: T.white, fontSize: 15, fontWeight: '700', textAlign: 'center' },
    centerSub: { color: T.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: T.card,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    retryBtn: {
        marginTop: 8,
        backgroundColor: T.yellow,
        paddingHorizontal: 20,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    retryText: { color: '#000', fontWeight: '800', fontSize: 13 },
    routineCard: {
        backgroundColor: T.card,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    routineInner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
    routineName: { color: T.white, fontSize: 16, fontWeight: '900', letterSpacing: 0.3 },
    routineObjective: { color: T.muted, fontSize: 13, lineHeight: 18, marginTop: 4 },
    pillRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
});
