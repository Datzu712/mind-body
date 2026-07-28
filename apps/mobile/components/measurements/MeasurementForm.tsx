import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import type { MeasurementValuesPayload } from '@/lib/api/measurements';
import { METRICS, type MetricKey } from './constants';

// ── Stepper con repetición al mantener presionado ────────────────────────────

function StepperButton({ icon, onStep, disabled }: { icon: 'add' | 'remove'; onStep: () => void; disabled?: boolean }) {
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const stop = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
        timeoutRef.current = null;
        intervalRef.current = null;
    }, []);

    const start = useCallback(() => {
        onStep();
        timeoutRef.current = setTimeout(() => {
            intervalRef.current = setInterval(onStep, 80);
        }, 300);
    }, [onStep]);

    // Si se desmonta con el dedo abajo, el interval quedaría vivo.
    useEffect(() => stop, [stop]);

    return (
        <Pressable style={s.stepperBtn} onPressIn={start} onPressOut={stop} disabled={disabled}>
            <Ionicons name={icon} size={18} color={T.white} />
        </Pressable>
    );
}

// ── Estado del form ─────────────────────────────────────────────────────────

/** Valores con los que abre el form. `Measurement` calza tal cual. */
export type MeasurementFormInitial = Record<MetricKey, number | null> & { notes: string | null };

type FormState = Record<MetricKey, string> & { notes: string };

/** El estado se arma desde METRICS: sumar una métrica es un solo cambio. */
function toFormState(initial: MeasurementFormInitial | null): FormState {
    const metrics = Object.fromEntries(
        METRICS.map((m) => [m.key, initial?.[m.key] != null ? String(initial[m.key]) : '']),
    ) as Record<MetricKey, string>;

    return { ...metrics, notes: initial?.notes ?? '' };
}

/**
 * El teclado `decimal-pad` usa coma como separador decimal en es-CR, y
 * `parseFloat('80,5')` daría 80 perdiendo los decimales sin avisar.
 *
 * Después de normalizar se exige un decimal simple: `parseFloat` es demasiado
 * permisivo y aceptaría `1,234,5` como 1.234 o `5abc` como 5, en silencio. Lo
 * que no calce da NaN, se omite del payload, y con eso Guardar se deshabilita.
 */
function parseDecimal(text: string): number {
    const normalized = text.trim().replace(',', '.');
    return /^\d*\.?\d*$/.test(normalized) ? parseFloat(normalized) : NaN;
}

/** Un campo vacío o no numérico se omite: el API lo interpreta como "sin valor". */
function toPayload(state: FormState): MeasurementValuesPayload {
    const payload: MeasurementValuesPayload = {};

    for (const m of METRICS) {
        const parsed = parseDecimal(state[m.key]);
        if (Number.isFinite(parsed)) payload[m.key] = parsed;
    }

    const notes = state.notes.trim();
    if (notes) payload.notes = notes;

    return payload;
}

// ── Form ─────────────────────────────────────────────────────────────────────

export interface MeasurementFormProps {
    title: string;
    submitLabel: string;
    /**
     * Valores con los que abre. Se leen una sola vez, al montar: quien monta el
     * form es responsable de tenerlos listos, así no hace falta un efecto que
     * los reaplique después y que podría pisar lo que el usuario ya tecleó.
     */
    initial: MeasurementFormInitial | null;
    submitting: boolean;
    errorMessage: string | null;
    onSubmit: (values: MeasurementValuesPayload) => void;
    onClose: () => void;
}

/**
 * Form de mediciones sin dominio propio: no sabe si crea o corrige, solo recibe
 * valores y devuelve valores. No trae `Modal`, así se puede montar suelto o
 * dentro de uno ajeno — apilar dos `Modal` de React Native falla en iOS.
 */
export function MeasurementForm({
    title,
    submitLabel,
    initial,
    submitting,
    errorMessage,
    onSubmit,
    onClose,
}: MeasurementFormProps) {
    const [state, setState] = useState<FormState>(() => toFormState(initial));

    const stateRef = useRef(state);
    stateRef.current = state;

    const setField = useCallback((key: keyof FormState, value: string) => {
        setState((prev) => ({ ...prev, [key]: value }));
    }, []);

    const step = useCallback((key: MetricKey, direction: 1 | -1) => {
        const metric = METRICS.find((m) => m.key === key)!;
        const current = parseDecimal(stateRef.current[key]) || 0;
        const next = Math.max(0, current + direction * metric.step);
        setState((prev) => ({ ...prev, [key]: next.toFixed(1) }));
    }, []);

    // Se valida el payload ya parseado, no el texto: un campo con solo "," o "-"
    // habilitaría Guardar y el PUT llegaría vacío, borrando las cuatro métricas.
    const payload = toPayload(state);
    const canSubmit = METRICS.some((m) => payload[m.key] != null) && !submitting;

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
                <View style={s.header}>
                    <Pressable onPress={onClose} hitSlop={12} disabled={submitting}>
                        <Text style={[s.cancel, submitting && { opacity: 0.3 }]}>Cancelar</Text>
                    </Pressable>
                    <Text style={s.title}>{title}</Text>
                    <Pressable onPress={() => onSubmit(payload)} hitSlop={12} disabled={!canSubmit}>
                        <Text style={[s.save, !canSubmit && { opacity: 0.3 }]}>
                            {submitting ? 'Guardando…' : submitLabel}
                        </Text>
                    </Pressable>
                </View>

                {errorMessage && (
                    <View style={s.errorBanner}>
                        <Ionicons name="alert-circle-outline" size={16} color={T.red} />
                        <Text style={s.errorText}>{errorMessage}</Text>
                    </View>
                )}

                <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
                    {METRICS.map((m) => (
                        <View key={m.key} style={s.inputRow}>
                            <View style={s.inputLabel}>
                                <Ionicons name={m.icon} size={16} color={T.yellow} />
                                <Text style={s.inputLabelText}>{m.label}</Text>
                            </View>
                            <View style={s.inputWithSteppers}>
                                <StepperButton icon="remove" onStep={() => step(m.key, -1)} disabled={submitting} />
                                <View style={s.inputCenter}>
                                    <TextInput
                                        style={s.input}
                                        value={state[m.key]}
                                        onChangeText={(v) => setField(m.key, v)}
                                        placeholder="0"
                                        placeholderTextColor={T.card3}
                                        keyboardType="decimal-pad"
                                        returnKeyType="next"
                                        textAlign="center"
                                        editable={!submitting}
                                    />
                                    <Text style={s.inputUnit}>{m.unit}</Text>
                                </View>
                                <StepperButton icon="add" onStep={() => step(m.key, 1)} disabled={submitting} />
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
                            value={state.notes}
                            onChangeText={(v) => setField('notes', v)}
                            placeholder="Observaciones (opcional)"
                            placeholderTextColor={T.card3}
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            editable={!submitting}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
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
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
        marginHorizontal: 20,
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: T.red + '33',
        backgroundColor: T.red + '14',
    },
    errorText: { flex: 1, fontSize: 12, fontWeight: '600', color: T.red, lineHeight: 17 },
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
