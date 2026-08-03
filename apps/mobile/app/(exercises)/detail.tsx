import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

import { FitColors as T } from '@/constants/theme';
import { useExercise } from '@/lib/api/exercises';
import { bodyPartLabel, equipmentLabel, targetLabel } from '@/lib/exercise-labels';

export default function ExerciseDetailScreen() {
    const { id } = useLocalSearchParams<{ id?: string }>();
    const { data: exercise, isPending, isError, refetch } = useExercise(id);
    const [gifBroken, setGifBroken] = useState(false);

    if (isPending) {
        return (
            <View style={s.center}>
                <Stack.Screen options={{ title: 'Ejercicio' }} />
                <ActivityIndicator color={T.yellow} size="large" />
            </View>
        );
    }

    if (isError || !exercise) {
        return (
            <View style={s.center}>
                <Stack.Screen options={{ title: 'Ejercicio' }} />
                <Ionicons name="cloud-offline-outline" size={40} color={T.muted} />
                <Text style={s.errorText}>No se pudo cargar el ejercicio</Text>
                <TouchableOpacity style={s.retryBtn} onPress={() => void refetch()}>
                    <Text style={s.retryText}>REINTENTAR</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const mediaUri = !gifBroken && exercise.gifUrl ? exercise.gifUrl : exercise.imageUrl;

    return (
        <ScrollView style={s.scroll} contentContainerStyle={s.content}>
            <Stack.Screen options={{ title: '' }} />

            {/* GIF animado (fallback: thumbnail estático) */}
            {mediaUri && (
                <View style={s.mediaCard}>
                    <Image
                        source={{ uri: mediaUri }}
                        style={s.media}
                        contentFit="contain"
                        transition={200}
                        onError={() => setGifBroken(true)}
                    />
                </View>
            )}

            <Text style={s.name}>{exercise.name}</Text>

            {/* Chips principales */}
            <View style={s.chipsRow}>
                <View style={[s.chip, { backgroundColor: T.yellow }]}>
                    <Text style={s.chipTextDark}>{bodyPartLabel(exercise.bodyPart)}</Text>
                </View>
                <View style={s.chip}>
                    <Text style={s.chipText}>{targetLabel(exercise.target)}</Text>
                </View>
                <View style={s.chip}>
                    <Text style={s.chipText}>{equipmentLabel(exercise.equipment)}</Text>
                </View>
            </View>

            {/* Músculos secundarios */}
            {exercise.secondaryMuscles.length > 0 && (
                <View style={s.section}>
                    <Text style={s.sectionTitle}>MÚSCULOS SECUNDARIOS</Text>
                    <View style={s.chipsRow}>
                        {exercise.secondaryMuscles.map((m) => (
                            <View key={m} style={s.chipOutline}>
                                <Text style={s.chipText}>{targetLabel(m)}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}

            {/* Instrucciones */}
            {exercise.instructions.length > 0 && (
                <View style={s.section}>
                    <Text style={s.sectionTitle}>INSTRUCCIONES</Text>
                    {exercise.instructions.map((step, i) => (
                        <View key={i} style={s.stepRow}>
                            <View style={s.stepNum}>
                                <Text style={s.stepNumText}>{i + 1}</Text>
                            </View>
                            <Text style={s.stepText}>{step}</Text>
                        </View>
                    ))}
                </View>
            )}

            <Text style={s.attribution}>Media © Gym visual — gymvisual.com</Text>
        </ScrollView>
    );
}

const s = StyleSheet.create({
    scroll: { flex: 1, backgroundColor: T.bg },
    content: { padding: 20, paddingBottom: 40 },
    center: { flex: 1, backgroundColor: T.bg, alignItems: 'center', justifyContent: 'center', gap: 10 },
    errorText: { color: T.white, fontSize: 15, fontWeight: '700' },
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
    mediaCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 16,
    },
    media: { width: '100%', aspectRatio: 1 },
    name: {
        color: T.white,
        fontSize: 22,
        fontWeight: '900',
        textTransform: 'capitalize',
        marginBottom: 12,
    },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
        backgroundColor: T.card,
        paddingHorizontal: 12,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipOutline: {
        borderWidth: 1,
        borderColor: T.card3,
        paddingHorizontal: 12,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    chipText: { color: T.white, fontSize: 12, fontWeight: '600' },
    chipTextDark: { color: '#000', fontSize: 12, fontWeight: '800' },
    section: { marginTop: 24 },
    sectionTitle: { color: T.muted, fontSize: 12, fontWeight: '900', letterSpacing: 1, marginBottom: 12 },
    stepRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
    stepNum: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: T.yellow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumText: { color: '#000', fontSize: 13, fontWeight: '900' },
    stepText: { color: T.white, fontSize: 14, lineHeight: 21, flex: 1, opacity: 0.9 },
    attribution: { color: T.muted, fontSize: 11, marginTop: 32, textAlign: 'center' },
});
