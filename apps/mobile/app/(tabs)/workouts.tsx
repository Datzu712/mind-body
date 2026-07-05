import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { FitColors as T } from '@/constants/theme';
import { TRAINING_EXERCISES, type ExerciseCategory, type TrainingExercise } from '@/components/training/mock-training';

type Mode = 'member' | 'trainer';
type Filter = 'Todas' | ExerciseCategory;

const FILTERS: Filter[] = ['Todas', 'Fuerza', 'Cardio', 'Movilidad'];

const Pill = ({ label, bg = T.yellow, fg = T.bg }: { label: string; bg?: string; fg?: string }) => (
    <View style={[s.pill, { backgroundColor: bg }]}>
        <Text style={[s.pillText, { color: fg }]} numberOfLines={1}>
            {label}
        </Text>
    </View>
);

function ExerciseCard({
    exercise,
    selected,
    onPress,
}: {
    exercise: TrainingExercise;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.82}
            onPress={onPress}
            style={[s.exerciseCard, selected && { borderColor: exercise.accent + '99' }]}
        >
            <View style={[s.exerciseIcon, { backgroundColor: exercise.accent + '22' }]}>
                <Ionicons name="barbell-outline" size={20} color={exercise.accent} />
            </View>
            <View style={{ flex: 1 }}>
                <View style={s.cardTop}>
                    <Text style={s.exerciseName} numberOfLines={1}>
                        {exercise.name}
                    </Text>
                    <Pill label={exercise.level} bg={exercise.accent + '22'} fg={exercise.accent} />
                </View>
                <Text style={s.exerciseMeta}>{exercise.muscleGroup}</Text>
                <View style={s.chipsRow}>
                    <View style={s.chip}>
                        <Text style={s.chipLabel}>Series</Text>
                        <Text style={s.chipValue}>{exercise.sets}</Text>
                    </View>
                    <View style={s.chip}>
                        <Text style={s.chipLabel}>Reps</Text>
                        <Text style={s.chipValue}>{exercise.reps}</Text>
                    </View>
                </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={T.muted} />
        </TouchableOpacity>
    );
}

function ExerciseDetail({ exercise, mode }: { exercise: TrainingExercise; mode: Mode }) {
    const [published, setPublished] = useState(false);

    return (
        <View style={s.detailCard}>
            <View style={s.detailHead}>
                <View style={[s.detailIcon, { backgroundColor: exercise.accent + '22' }]}>
                    <Ionicons name="fitness-outline" size={22} color={exercise.accent} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={s.detailEyebrow}>{exercise.category}</Text>
                    <Text style={s.detailTitle}>{exercise.name}</Text>
                    <Text style={s.detailSub}>
                        {exercise.equipment} - {exercise.rest} descanso
                    </Text>
                </View>
            </View>

            <View style={s.metricGrid}>
                {[
                    ['Grupo', exercise.muscleGroup],
                    ['Carga', exercise.load],
                    ['Nivel', exercise.level],
                ].map(([label, value]) => (
                    <View key={label} style={s.metricBox}>
                        <Text style={s.metricLabel}>{label}</Text>
                        <Text style={s.metricValue} numberOfLines={1}>
                            {value}
                        </Text>
                    </View>
                ))}
            </View>

            <Text style={s.sectionTitle}>Instrucciones</Text>
            <View style={{ gap: 8 }}>
                {exercise.instructions.map((instruction, index) => (
                    <View key={instruction} style={s.instructionRow}>
                        <Text style={[s.instructionIndex, { color: exercise.accent }]}>{index + 1}</Text>
                        <Text style={s.instructionText}>{instruction}</Text>
                    </View>
                ))}
            </View>

            {mode === 'member' ? (
                <>
                    <Text style={s.sectionTitle}>Ultima ejecucion</Text>
                    {exercise.lastExecution ? (
                        <View style={s.historyCard}>
                            <Text style={s.historyDate}>{exercise.lastExecution.date}</Text>
                            <Text style={s.historyValue}>
                                {exercise.lastExecution.load} - {exercise.lastExecution.reps}
                            </Text>
                            <Text style={s.historyNote}>{exercise.lastExecution.note}</Text>
                        </View>
                    ) : (
                        <Text style={s.emptyInline}>Todavia no hay historial para este ejercicio.</Text>
                    )}
                </>
            ) : (
                <>
                    <Text style={s.sectionTitle}>Gestion de catalogo</Text>
                    <View style={s.formGrid}>
                        <TextInput value={String(exercise.sets)} style={s.smallInput} placeholderTextColor={T.muted} />
                        <TextInput value={exercise.reps} style={s.smallInput} placeholderTextColor={T.muted} />
                        <TextInput value={exercise.load} style={s.smallInput} placeholderTextColor={T.muted} />
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.86}
                        onPress={() => setPublished(true)}
                        style={[s.primaryAction, published && { backgroundColor: T.green }]}
                    >
                        <Ionicons
                            name={published ? 'checkmark-circle' : 'cloud-upload-outline'}
                            size={17}
                            color={T.bg}
                        />
                        <Text style={s.primaryActionText}>
                            {published ? 'Cambio publicado' : 'Actualizar ejercicio'}
                        </Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

export default function WorkoutsScreen() {
    const [mode, setMode] = useState<Mode>('member');
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState<Filter>('Todas');
    const [selectedId, setSelectedId] = useState(TRAINING_EXERCISES[0].id);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return TRAINING_EXERCISES.filter((exercise) => {
            const matchesFilter = filter === 'Todas' || exercise.category === filter;
            const matchesQuery =
                !q ||
                exercise.name.toLowerCase().includes(q) ||
                exercise.muscleGroup.toLowerCase().includes(q) ||
                exercise.equipment.toLowerCase().includes(q);
            return matchesFilter && matchesQuery;
        });
    }, [filter, query]);

    const selected = TRAINING_EXERCISES.find((exercise) => exercise.id === selectedId) ?? TRAINING_EXERCISES[0];

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                <View style={s.header}>
                    <Text style={s.eyebrow}>{mode === 'member' ? 'Catalogo miembro' : 'Catalogo entrenador'}</Text>
                    <Text style={s.title}>EJERCICIOS</Text>
                </View>

                <View style={s.modeRow}>
                    {(['member', 'trainer'] as const).map((item) => {
                        const active = mode === item;
                        return (
                            <TouchableOpacity
                                key={item}
                                onPress={() => setMode(item)}
                                style={[s.modeButton, active && s.modeButtonActive]}
                            >
                                <Ionicons
                                    name={item === 'member' ? 'person-outline' : 'construct-outline'}
                                    size={15}
                                    color={active ? T.bg : T.muted}
                                />
                                <Text style={[s.modeText, active && s.modeTextActive]}>
                                    {item === 'member' ? 'Miembro' : 'Entrenador'}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={s.searchWrap}>
                    <View style={s.search}>
                        <Ionicons name="search" size={18} color={T.muted} />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Buscar ejercicio, musculo o equipo"
                            placeholderTextColor={T.muted}
                            style={s.searchInput}
                            returnKeyType="search"
                        />
                        {query.length > 0 ? (
                            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Limpiar busqueda">
                                <Ionicons name="close-circle" size={18} color={T.muted} />
                            </TouchableOpacity>
                        ) : null}
                    </View>
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.filterRow}>
                    {FILTERS.map((item) => {
                        const active = filter === item;
                        return (
                            <TouchableOpacity
                                key={item}
                                onPress={() => setFilter(item)}
                                style={[s.filterChip, active && s.filterChipActive]}
                            >
                                <Text style={[s.filterText, active && s.filterTextActive]}>{item}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                <View style={s.secHead}>
                    <Text style={s.secTitle}>{mode === 'member' ? 'Catalogo disponible' : 'Gestion del catalogo'}</Text>
                    <Text style={s.secRight}>{filtered.length} resultados</Text>
                </View>

                <View style={s.listStack}>
                    {filtered.map((exercise) => (
                        <ExerciseCard
                            key={exercise.id}
                            exercise={exercise}
                            selected={exercise.id === selectedId}
                            onPress={() => setSelectedId(exercise.id)}
                        />
                    ))}
                </View>

                <View style={s.secHead}>
                    <Text style={s.secTitle}>Detalle</Text>
                </View>
                <ExerciseDetail exercise={selected} mode={mode} />
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingBottom: 32 },
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
    modeRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 14 },
    modeButton: {
        flex: 1,
        height: 42,
        borderRadius: 10,
        backgroundColor: T.card,
        borderWidth: 1,
        borderColor: T.border,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 7,
    },
    modeButtonActive: { backgroundColor: T.yellow, borderColor: T.yellow },
    modeText: { color: T.muted, fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
    modeTextActive: { color: T.bg },
    searchWrap: { paddingHorizontal: 20 },
    search: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: T.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: T.border,
        paddingHorizontal: 14,
        height: 48,
    },
    searchInput: { flex: 1, color: T.white, fontSize: 14, padding: 0 },
    filterRow: { gap: 8, paddingHorizontal: 20, paddingTop: 14 },
    filterChip: {
        borderRadius: 10,
        borderWidth: 1,
        borderColor: T.border,
        backgroundColor: T.card,
        paddingHorizontal: 13,
        paddingVertical: 9,
    },
    filterChipActive: { backgroundColor: T.yellow, borderColor: T.yellow },
    filterText: { color: T.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    filterTextActive: { color: T.bg },
    secHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    secTitle: { fontSize: 12, fontWeight: '800', color: T.white, letterSpacing: 1.2, textTransform: 'uppercase' },
    secRight: { fontSize: 11, color: T.muted, fontWeight: '700' },
    listStack: { paddingHorizontal: 20, gap: 10 },
    exerciseCard: {
        backgroundColor: T.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: T.border,
        padding: 13,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    exerciseIcon: { width: 48, height: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
    cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    exerciseName: { flex: 1, color: T.white, fontSize: 14, fontWeight: '900' },
    exerciseMeta: { color: T.muted, fontSize: 11, fontWeight: '600', marginBottom: 8 },
    chipsRow: { flexDirection: 'row', gap: 7 },
    chip: {
        backgroundColor: T.card2,
        borderRadius: 7,
        paddingHorizontal: 8,
        paddingVertical: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
    },
    chipLabel: { color: T.muted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
    chipValue: { color: T.yellow, fontSize: 12, fontWeight: '900' },
    pill: { borderRadius: 5, paddingHorizontal: 7, paddingVertical: 3, alignSelf: 'flex-start' },
    pillText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
    detailCard: {
        marginHorizontal: 20,
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 15,
        gap: 12,
    },
    detailHead: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    detailIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    detailEyebrow: { color: T.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    detailTitle: { color: T.white, fontSize: 18, fontWeight: '900', marginTop: 2 },
    detailSub: { color: T.muted, fontSize: 12, fontWeight: '600', marginTop: 4 },
    metricGrid: { flexDirection: 'row', gap: 8 },
    metricBox: { flex: 1, backgroundColor: T.card2, borderRadius: 11, padding: 10 },
    metricLabel: { color: T.muted, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
    metricValue: { color: T.white, fontSize: 12, fontWeight: '900', marginTop: 4 },
    sectionTitle: { color: T.white, fontSize: 12, fontWeight: '900', letterSpacing: 1.1, textTransform: 'uppercase' },
    instructionRow: { flexDirection: 'row', gap: 10, backgroundColor: T.card2, borderRadius: 12, padding: 10 },
    instructionIndex: { width: 18, fontSize: 12, fontWeight: '900' },
    instructionText: { flex: 1, color: T.muted, fontSize: 12, lineHeight: 17 },
    historyCard: { backgroundColor: T.card2, borderRadius: 12, padding: 12 },
    historyDate: { color: T.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    historyValue: { color: T.white, fontSize: 14, fontWeight: '900', marginTop: 4 },
    historyNote: { color: T.muted, fontSize: 12, lineHeight: 17, marginTop: 4 },
    emptyInline: { color: T.muted, fontSize: 12 },
    formGrid: { flexDirection: 'row', gap: 8 },
    smallInput: {
        flex: 1,
        height: 42,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: T.border,
        backgroundColor: T.card2,
        color: T.white,
        paddingHorizontal: 10,
        fontSize: 12,
        fontWeight: '700',
    },
    primaryAction: {
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: T.yellow,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    primaryActionText: { color: T.bg, fontSize: 14, fontWeight: '900' },
});
