import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { FitColors as T } from '@/constants/theme';
import { useExercises, useExerciseFacets, type ExerciseSlim } from '@/lib/api/exercises';
import { useMyRoutines, type RoutineDetail } from '@/lib/api/routines';
import { bodyPartLabel, equipmentLabel, targetLabel } from '@/lib/exercise-labels';

function useDebounced(value: string, ms = 300): string {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const t = setTimeout(() => setDebounced(value), ms);
        return () => clearTimeout(t);
    }, [value, ms]);
    return debounced;
}

export default function WorkoutsScreen() {
    const [search, setSearch] = useState('');
    const [bodyPart, setBodyPart] = useState<string | null>(null);
    const [equipment, setEquipment] = useState<string | null>(null);
    const [equipModalOpen, setEquipModalOpen] = useState(false);
    const q = useDebounced(search);

    const { data: facets } = useExerciseFacets();
    const { data, isPending, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useExercises({
        q: q || undefined,
        bodyPart: bodyPart ?? undefined,
        equipment: equipment ?? undefined,
    });

    const exercises = data?.pages.flatMap((p) => p.items) ?? [];
    const total = data?.pages[0]?.total ?? 0;

    const openDetail = (id: string) => router.push({ pathname: '/(exercises)/detail', params: { id } });

    return (
        <SafeAreaView style={s.safe} edges={['top']}>
            {/* Header */}
            <View style={s.header}>
                <View>
                    <Text style={s.title}>EJERCICIOS</Text>
                    {total > 0 && <Text style={s.subtitle}>{total} en la biblioteca</Text>}
                </View>
                <TouchableOpacity
                    style={[s.filterBtn, equipment != null && s.filterBtnActive]}
                    onPress={() => setEquipModalOpen(true)}
                >
                    <Ionicons name="options-outline" size={20} color={equipment != null ? '#000' : T.white} />
                </TouchableOpacity>
            </View>

            {/* Mi rutina (asignada por el trainer) */}
            <MyRoutinesSection />

            {/* Búsqueda */}
            <View style={s.searchBox}>
                <Ionicons name="search" size={18} color={T.muted} />
                <TextInput
                    style={s.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder="Buscar ejercicio..."
                    placeholderTextColor={T.muted}
                    autoCapitalize="none"
                    autoCorrect={false}
                />
                {search !== '' && (
                    <Pressable onPress={() => setSearch('')}>
                        <Ionicons name="close-circle" size={18} color={T.muted} />
                    </Pressable>
                )}
            </View>

            {/* Chips de grupo muscular */}
            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipsRow}>
                    <TouchableOpacity
                        style={[s.chip, bodyPart == null && s.chipActive]}
                        onPress={() => setBodyPart(null)}
                    >
                        <Text style={[s.chipText, bodyPart == null && s.chipTextActive]}>Todos</Text>
                    </TouchableOpacity>
                    {facets?.bodyParts.map((bp) => (
                        <TouchableOpacity
                            key={bp}
                            style={[s.chip, bodyPart === bp && s.chipActive]}
                            onPress={() => setBodyPart(bodyPart === bp ? null : bp)}
                        >
                            <Text style={[s.chipText, bodyPart === bp && s.chipTextActive]}>{bodyPartLabel(bp)}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Lista */}
            {isPending ? (
                <View style={s.listPad}>
                    {Array.from({ length: 7 }).map((_, i) => (
                        <View key={i} style={s.skeletonRow}>
                            <View style={s.skeletonThumb} />
                            <View style={{ flex: 1, gap: 8 }}>
                                <View style={[s.skeletonBar, { width: '70%' }]} />
                                <View style={[s.skeletonBar, { width: '45%' }]} />
                            </View>
                        </View>
                    ))}
                </View>
            ) : isError ? (
                <View style={s.centerBox}>
                    <Ionicons name="cloud-offline-outline" size={40} color={T.muted} />
                    <Text style={s.centerText}>No se pudieron cargar los ejercicios</Text>
                    <TouchableOpacity style={s.retryBtn} onPress={() => void refetch()}>
                        <Text style={s.retryText}>REINTENTAR</Text>
                    </TouchableOpacity>
                </View>
            ) : exercises.length === 0 ? (
                <View style={s.centerBox}>
                    <Ionicons name="search-outline" size={40} color={T.muted} />
                    <Text style={s.centerText}>Sin resultados</Text>
                    <Text style={s.centerSub}>Probá con otro término u otros filtros</Text>
                </View>
            ) : (
                <FlatList
                    data={exercises}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={s.listPad}
                    onEndReached={() => hasNextPage && !isFetchingNextPage && fetchNextPage()}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={
                        isFetchingNextPage ? (
                            <ActivityIndicator color={T.yellow} style={{ marginVertical: 16 }} />
                        ) : null
                    }
                    renderItem={({ item }) => <ExerciseRow exercise={item} onPress={() => openDetail(item.id)} />}
                />
            )}

            {/* Modal filtro de equipo */}
            <Modal
                visible={equipModalOpen}
                animationType="slide"
                transparent
                onRequestClose={() => setEquipModalOpen(false)}
            >
                <Pressable style={s.modalBackdrop} onPress={() => setEquipModalOpen(false)}>
                    <Pressable style={s.modalSheet} onPress={(e) => e.stopPropagation()}>
                        <View style={s.modalHandle} />
                        <Text style={s.modalTitle}>EQUIPO</Text>
                        <ScrollView style={{ maxHeight: 420 }}>
                            <TouchableOpacity
                                style={s.modalRow}
                                onPress={() => {
                                    setEquipment(null);
                                    setEquipModalOpen(false);
                                }}
                            >
                                <Text style={[s.modalRowText, equipment == null && s.modalRowActive]}>
                                    Todo el equipo
                                </Text>
                                {equipment == null && <Ionicons name="checkmark" size={18} color={T.yellow} />}
                            </TouchableOpacity>
                            {facets?.equipments.map((eq) => (
                                <TouchableOpacity
                                    key={eq}
                                    style={s.modalRow}
                                    onPress={() => {
                                        setEquipment(eq);
                                        setEquipModalOpen(false);
                                    }}
                                >
                                    <Text style={[s.modalRowText, equipment === eq && s.modalRowActive]}>
                                        {equipmentLabel(eq)}
                                    </Text>
                                    {equipment === eq && <Ionicons name="checkmark" size={18} color={T.yellow} />}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </Pressable>
                </Pressable>
            </Modal>
        </SafeAreaView>
    );
}

function MyRoutinesSection() {
    const { data: routines, isPending, isError } = useMyRoutines();

    if (isPending) {
        return (
            <View style={s.routineSection}>
                <View style={[s.routineCard, { opacity: 0.5 }]}>
                    <View style={s.routineIcon} />
                    <View style={{ flex: 1, gap: 8 }}>
                        <View style={[s.skeletonBar, { width: '55%' }]} />
                        <View style={[s.skeletonBar, { width: '35%' }]} />
                    </View>
                </View>
            </View>
        );
    }
    // Si falla (p. ej. sin perfil de miembro) la sección se oculta: la
    // biblioteca sigue siendo el contenido principal del tab.
    if (isError) return null;

    if (!routines?.length) {
        return (
            <View style={s.routineSection}>
                <View style={s.routineCard}>
                    <View style={s.routineIcon}>
                        <Ionicons name="clipboard-outline" size={20} color={T.muted} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.routineName}>Sin rutina asignada</Text>
                        <Text style={s.routineSub}>Tu entrenador aún no te asignó una rutina</Text>
                    </View>
                </View>
            </View>
        );
    }

    return (
        <View style={s.routineSection}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                {routines.map((routine) => (
                    <RoutineCard key={routine.id} routine={routine} />
                ))}
            </ScrollView>
        </View>
    );
}

function RoutineCard({ routine }: { routine: RoutineDetail }) {
    return (
        <TouchableOpacity
            style={[s.routineCard, s.routineCardAssigned]}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/(routines)/detail', params: { id: routine.id } })}
        >
            <View style={[s.routineIcon, { backgroundColor: T.yellow }]}>
                <Ionicons name="clipboard" size={20} color="#000" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.routineName} numberOfLines={1}>
                    {routine.name}
                </Text>
                <Text style={s.routineSub} numberOfLines={1}>
                    {routine.exercises.length} ejercicios
                    {routine.createdByName ? ` · ${routine.createdByName}` : ''}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={T.muted} />
        </TouchableOpacity>
    );
}

function ExerciseRow({ exercise, onPress }: { exercise: ExerciseSlim; onPress: () => void }) {
    const [broken, setBroken] = useState(false);
    return (
        <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
            <View style={s.thumbWrap}>
                {!broken && exercise.imageUrl ? (
                    <Image
                        source={{ uri: exercise.imageUrl }}
                        style={s.thumb}
                        contentFit="contain"
                        transition={150}
                        onError={() => setBroken(true)}
                    />
                ) : (
                    <Ionicons name="barbell-outline" size={24} color={T.muted} />
                )}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.rowName} numberOfLines={2}>
                    {exercise.name}
                </Text>
                <Text style={s.rowSub} numberOfLines={1}>
                    {targetLabel(exercise.target)} · {equipmentLabel(exercise.equipment)}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={T.muted} />
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: T.bg },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 12,
    },
    title: { color: T.white, fontSize: 24, fontWeight: '900', letterSpacing: 0.5 },
    subtitle: { color: T.muted, fontSize: 12, marginTop: 2 },
    filterBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: T.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterBtnActive: { backgroundColor: T.yellow },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginBottom: 12,
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 12,
        backgroundColor: T.card,
    },
    searchInput: { flex: 1, color: T.white, fontSize: 15 },
    chipsRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 12 },
    chip: {
        paddingHorizontal: 14,
        height: 32,
        borderRadius: 16,
        backgroundColor: T.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipActive: { backgroundColor: T.yellow },
    chipText: { color: T.muted, fontSize: 13, fontWeight: '600' },
    chipTextActive: { color: '#000' },
    listPad: { paddingHorizontal: 20, paddingBottom: 24 },
    routineSection: { paddingHorizontal: 20, marginBottom: 12 },
    routineCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: T.card,
        borderRadius: 14,
        padding: 12,
        minWidth: 260,
    },
    routineCardAssigned: { borderWidth: 1, borderColor: 'rgba(255, 214, 0, 0.35)' },
    routineIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: T.card2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    routineName: { color: T.white, fontSize: 14, fontWeight: '800' },
    routineSub: { color: T.muted, fontSize: 12, marginTop: 2 },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: T.card,
        borderRadius: 14,
        padding: 10,
        marginBottom: 10,
    },
    thumbWrap: {
        width: 64,
        height: 64,
        borderRadius: 10,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    thumb: { width: 64, height: 64 },
    rowName: { color: T.white, fontSize: 14, fontWeight: '700', textTransform: 'capitalize' },
    rowSub: { color: T.muted, fontSize: 12, marginTop: 3 },
    centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 40 },
    centerText: { color: T.white, fontSize: 15, fontWeight: '700', textAlign: 'center' },
    centerSub: { color: T.muted, fontSize: 13, textAlign: 'center' },
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
    skeletonRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: T.card,
        borderRadius: 14,
        padding: 10,
        marginBottom: 10,
    },
    skeletonThumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: T.card2 },
    skeletonBar: { height: 12, borderRadius: 6, backgroundColor: T.card2 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    modalSheet: {
        backgroundColor: T.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 20,
        paddingBottom: 30,
        paddingTop: 10,
    },
    modalHandle: {
        alignSelf: 'center',
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: T.card3,
        marginBottom: 12,
    },
    modalTitle: { color: T.white, fontSize: 14, fontWeight: '900', letterSpacing: 1, marginBottom: 8 },
    modalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: T.card3,
    },
    modalRowText: { color: T.white, fontSize: 15 },
    modalRowActive: { color: T.yellow, fontWeight: '700' },
});
