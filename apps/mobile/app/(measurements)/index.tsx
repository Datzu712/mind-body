import { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import { useMeasurements } from '@/hooks/use-measurements';
import { ComparisonCard } from '@/components/measurements/ComparisonCard';
import { ChartSection } from '@/components/measurements/ChartSection';
import { HistoryModal } from '@/components/measurements/HistoryModal';
import { NewMeasurementModal } from '@/components/measurements/NewMeasurementModal';
import type { Measurement } from '@/lib/api/types/measurement';

export default function MeasurementsScreen() {
    const [historyVisible, setHistoryVisible] = useState(false);
    const [formVisible, setFormVisible] = useState(false);
    const [editingMeasurement, setEditingMeasurement] = useState<Measurement | null>(null);
    const [toast, setToast] = useState(false);
    const [toastMsg, setToastMsg] = useState('Medición registrada');
    const wasEditingRef = useRef(false);
    const { data: measurements } = useMeasurements();
    const hasData = measurements && measurements.length > 0;

    const handleEdit = useCallback((m: Measurement) => {
        wasEditingRef.current = true;
        setEditingMeasurement(m);
        setHistoryVisible(false);
        setFormVisible(true);
    }, []);

    const handleSaved = useCallback(() => {
        const wasEditing = wasEditingRef.current;
        wasEditingRef.current = false;
        setFormVisible(false);
        setEditingMeasurement(null);
        setToastMsg(wasEditing ? 'Medición actualizada' : 'Medición registrada');
        if (wasEditing) {
            setHistoryVisible(true);
        }
        setToast(true);
        setTimeout(() => setToast(false), 2200);
    }, []);

    return (
        <>
            <Stack.Screen options={{ title: 'Mediciones Corporales' }} />
            <View style={s.root}>
                {hasData ? (
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                        <ComparisonCard />
                        <ChartSection />

                        <Pressable style={s.historyBtn} onPress={() => setHistoryVisible(true)}>
                            <Ionicons name="time-outline" size={18} color={T.yellow} />
                            <Text style={s.historyBtnText}>Ver historial completo</Text>
                            <Ionicons name="chevron-forward" size={16} color={T.muted} />
                        </Pressable>
                    </ScrollView>
                ) : (
                    <View style={s.empty}>
                        <Ionicons name="body-outline" size={56} color={T.muted} />
                        <Text style={s.emptyTitle}>No hay mediciones registradas</Text>
                        <Text style={s.emptySub}>Registra tu primera medición para comenzar a ver tu evolución.</Text>
                        <Pressable style={s.emptyBtn} onPress={() => setFormVisible(true)}>
                            <Ionicons name="add" size={18} color={T.bg} />
                            <Text style={s.emptyBtnText}>Registrar medición</Text>
                        </Pressable>
                    </View>
                )}

                {hasData && (
                    <Pressable style={s.fab} onPress={() => setFormVisible(true)}>
                        <Ionicons name="add" size={26} color={T.bg} />
                    </Pressable>
                )}

                <HistoryModal visible={historyVisible} onClose={() => setHistoryVisible(false)} onEdit={handleEdit} />
                <NewMeasurementModal
                    visible={formVisible}
                    onClose={() => {
                        setFormVisible(false);
                        setEditingMeasurement(null);
                    }}
                    onSaved={handleSaved}
                    editingMeasurement={editingMeasurement}
                />

                {toast && (
                    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(300)} style={s.toast}>
                        <Ionicons name="checkmark-circle" size={20} color={T.green} />
                        <Text style={s.toastText}>{toastMsg}</Text>
                    </Animated.View>
                )}
            </View>
        </>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { padding: 20, paddingBottom: 100 },

    // Empty state
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: T.white, textAlign: 'center' },
    emptySub: { fontSize: 13, color: T.muted, textAlign: 'center', lineHeight: 18 },
    emptyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: T.yellow,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
        marginTop: 8,
    },
    emptyBtnText: { fontSize: 14, fontWeight: '800', color: T.bg },

    // History button
    historyBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: T.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: T.border,
        padding: 16,
        marginTop: 20,
    },
    historyBtnText: { flex: 1, fontSize: 14, fontWeight: '700', color: T.white },

    // FAB
    fab: {
        position: 'absolute',
        bottom: 28,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: T.yellow,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 6,
        shadowColor: T.yellow,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },

    // Toast
    toast: {
        position: 'absolute',
        bottom: 100,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: T.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: T.green + '33',
        paddingHorizontal: 20,
        paddingVertical: 12,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
    },
    toastText: { fontSize: 14, fontWeight: '700', color: T.white },
});
