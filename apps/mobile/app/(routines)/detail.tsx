import { FlatList, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { FitColors as T } from '@/constants/theme';
import { useMyRoutines, type RoutineExerciseItem } from '@/lib/api/routines';
import { equipmentLabel, targetLabel } from '@/lib/exercise-labels';

export default function RoutineDetailScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    // El detalle sale del cache de /routines/mine (mismo query del tab).
    const { data: routines, isPending } = useMyRoutines();
    const routine = routines?.find((r) => r.id === id);

    if (isPending) {
        return (
            <View style={s.center}>
                <Stack.Screen options={{ title: 'Rutina' }} />
                <ActivityIndicator color={T.yellow} size="large" />
            </View>
        );
    }

    if (!routine) {
        return (
            <View style={s.center}>
                <Stack.Screen options={{ title: 'Rutina' }} />
                <Ionicons name="clipboard-outline" size={40} color={T.muted} />
                <Text style={s.errorText}>No se encontró la rutina</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen options={{ title: routine.name }} />
            <FlatList
                style={s.container}
                data={routine.exercises}
                keyExtractor={(item) => item.id}
                contentContainerStyle={s.listPad}
                ListHeaderComponent={
                    <View style={s.header}>
                        {routine.objective ? <Text style={s.objective}>{routine.objective}</Text> : null}
                        <View style={s.metaRow}>
                            <View style={s.metaChip}>
                                <Ionicons name="barbell-outline" size={14} color={T.yellow} />
                                <Text style={s.metaText}>{routine.exercises.length} ejercicios</Text>
                            </View>
                            {routine.createdByName ? (
                                <View style={s.metaChip}>
                                    <Ionicons name="person-outline" size={14} color={T.yellow} />
                                    <Text style={s.metaText}>{routine.createdByName}</Text>
                                </View>
                            ) : null}
                        </View>
                    </View>
                }
                renderItem={({ item, index }) => <RoutineExerciseRow item={item} index={index} />}
            />
        </>
    );
}

function RoutineExerciseRow({ item, index }: { item: RoutineExerciseItem; index: number }) {
    const setsReps = item.sets != null || item.reps ? `${item.sets ?? '—'} × ${item.reps ?? '—'}` : null;

    return (
        <TouchableOpacity
            style={s.row}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/(exercises)/detail', params: { id: item.exerciseId } })}
        >
            <Text style={s.rowOrder}>{index + 1}</Text>
            <View style={s.thumbWrap}>
                {item.exercise.imageUrl ? (
                    <Image
                        source={{ uri: item.exercise.imageUrl }}
                        style={s.thumb}
                        contentFit="contain"
                        transition={150}
                    />
                ) : (
                    <Ionicons name="barbell-outline" size={22} color={T.muted} />
                )}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.rowName} numberOfLines={2}>
                    {item.exercise.name}
                </Text>
                <Text style={s.rowSub} numberOfLines={1}>
                    {setsReps ? `${setsReps} · ` : ''}
                    {targetLabel(item.exercise.target)} · {equipmentLabel(item.exercise.equipment)}
                </Text>
                {item.notes ? (
                    <View style={s.noteBox}>
                        <Ionicons name="chatbubble-ellipses-outline" size={12} color={T.yellow} />
                        <Text style={s.noteText} numberOfLines={2}>
                            {item.notes}
                        </Text>
                    </View>
                ) : null}
            </View>
            <Ionicons name="chevron-forward" size={18} color={T.muted} />
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: T.bg },
    center: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', gap: 10 },
    errorText: { color: T.white, fontSize: 15, fontWeight: '700' },
    listPad: { padding: 20, paddingBottom: 40 },
    header: { marginBottom: 16 },
    objective: { color: T.muted, fontSize: 14, lineHeight: 20, marginBottom: 10 },
    metaRow: { flexDirection: 'row', gap: 8 },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: T.card,
        borderRadius: 12,
        paddingHorizontal: 10,
        height: 28,
    },
    metaText: { color: T.white, fontSize: 12, fontWeight: '600' },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: T.card,
        borderRadius: 14,
        padding: 10,
        marginBottom: 10,
    },
    rowOrder: { color: T.yellow, fontSize: 13, fontWeight: '900', width: 18, textAlign: 'center' },
    thumbWrap: {
        width: 56,
        height: 56,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    thumb: { width: 56, height: 56 },
    rowName: { color: T.white, fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
    rowSub: { color: T.muted, fontSize: 12, marginTop: 3 },
    noteBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
        backgroundColor: 'rgba(255, 214, 0, 0.08)',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    noteText: { color: T.white, fontSize: 12, flex: 1 },
});
