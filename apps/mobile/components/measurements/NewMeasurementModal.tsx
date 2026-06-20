import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import { useMeasurementSummary } from '@/hooks/use-measurements';
import { METRICS, type MetricKey } from './constants';

// ── Stepper with long-press repeat ───────────────────────────────────────────

function StepperButton({ icon, onStep }: { icon: 'add' | 'remove'; onStep: () => void }) {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const start = useCallback(() => {
        onStep();
        timeoutRef.current = setTimeout(() => {
            intervalRef.current = setInterval(onStep, 80);
        }, 300);
    }, [onStep]);

    const stop = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        timeoutRef.current = null;
        intervalRef.current = null;
    }, []);

    return (
        <Pressable style={s.stepperBtn} onPressIn={start} onPressOut={stop}>
            <Ionicons name={icon} size={18} color={T.white} />
        </Pressable>
    );
}

// ── Modal ────────────────────────────────────────────────────────────────────

export function NewMeasurementModal({
    visible,
    onClose,
    onSaved,
}: {
    visible: boolean;
    onClose: () => void;
    onSaved: () => void;
}) {
    const { data: summary } = useMeasurementSummary();
    const latest = summary?.latest;

    const [weight, setWeight] = useState('');
    const [height, setHeight] = useState('');
    const [bodyFat, setBodyFat] = useState('');
    const [waist, setWaist] = useState('');
    const [notes, setNotes] = useState('');
    const [prefilled, setPrefilled] = useState(false);

    React.useEffect(() => {
        if (visible && latest && !prefilled) {
            setWeight(latest.weightKg != null ? String(latest.weightKg) : '');
            setHeight(latest.heightCm != null ? String(latest.heightCm) : '');
            setBodyFat(latest.bodyFatPercentage != null ? String(latest.bodyFatPercentage) : '');
            setWaist(latest.waistCm != null ? String(latest.waistCm) : '');
            setPrefilled(true);
        }
        if (!visible) setPrefilled(false);
    }, [visible, latest, prefilled]);

    const handleSave = () => {
        // TODO: call API to save measurement
        onSaved();
    };

    const vals = { weightKg: weight, heightCm: height, bodyFatPercentage: bodyFat, waistCm: waist };
    const setters = { weightKg: setWeight, heightCm: setHeight, bodyFatPercentage: setBodyFat, waistCm: setWaist };
    const valsRef = useRef(vals);
    valsRef.current = vals;

    const stepFn = useCallback((key: MetricKey, delta: number) => {
        const m = METRICS.find((x) => x.key === key)!;
        const current = parseFloat(valsRef.current[key]) || 0;
        const next = Math.max(0, current + delta * m.step);
        setters[key](next.toFixed(1));
    }, []);

    const hasAnyValue = weight || height || bodyFat || waist;

    return (
        <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
            <SafeAreaView style={s.root} edges={['top']}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
                    <View style={s.header}>
                        <Pressable onPress={onClose} hitSlop={12}>
                            <Text style={s.cancel}>Cancelar</Text>
                        </Pressable>
                        <Text style={s.title}>Nueva medición</Text>
                        <Pressable onPress={handleSave} hitSlop={12} disabled={!hasAnyValue}>
                            <Text style={[s.save, !hasAnyValue && { opacity: 0.3 }]}>Guardar</Text>
                        </Pressable>
                    </View>

                    <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
                        {METRICS.map((m) => (
                            <View key={m.key} style={s.inputRow}>
                                <View style={s.inputLabel}>
                                    <Ionicons name={m.icon} size={16} color={T.yellow} />
                                    <Text style={s.inputLabelText}>{m.label}</Text>
                                </View>
                                <View style={s.inputWithSteppers}>
                                    <StepperButton icon="remove" onStep={() => stepFn(m.key, -1)} />
                                    <View style={s.inputCenter}>
                                        <TextInput
                                            style={s.input}
                                            value={vals[m.key]}
                                            onChangeText={(v) => setters[m.key](v)}
                                            placeholder="0"
                                            placeholderTextColor={T.card3}
                                            keyboardType="decimal-pad"
                                            returnKeyType="next"
                                            textAlign="center"
                                        />
                                        <Text style={s.inputUnit}>{m.unit}</Text>
                                    </View>
                                    <StepperButton icon="add" onStep={() => stepFn(m.key, 1)} />
                                </View>
                            </View>
                        ))}

                        <View style={s.inputRow}>
                            <View style={s.inputLabel}>
                                <Ionicons name="chatbubble-outline" size={16} color={T.yellow} />
                                <Text style={s.inputLabelText}>Notas</Text>
                            </View>
                            <TextInput
                                style={[s.input, s.inputMulti]}
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="Observaciones (opcional)"
                                placeholderTextColor={T.card3}
                                multiline
                                numberOfLines={3}
                                textAlignVertical="top"
                            />
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </Modal>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: T.border,
    },
    cancel: { fontSize: 15, fontWeight: '600', color: T.muted },
    title: { fontSize: 16, fontWeight: '800', color: T.white },
    save: { fontSize: 15, fontWeight: '700', color: T.yellow },
    content: { padding: 20, gap: 18 },
    inputRow: { gap: 6 },
    inputLabel: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    inputLabelText: { fontSize: 12, fontWeight: '700', color: T.muted },
    inputWithSteppers: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    stepperBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: T.card2,
        borderWidth: 1,
        borderColor: T.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    inputCenter: { flex: 1, justifyContent: 'center' },
    input: {
        backgroundColor: T.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: T.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 20,
        fontWeight: '700',
        color: T.white,
    },
    inputUnit: { position: 'absolute', right: 16, fontSize: 13, fontWeight: '600', color: T.muted },
    inputMulti: { fontSize: 14, fontWeight: '500', minHeight: 80, paddingTop: 14 },
});
