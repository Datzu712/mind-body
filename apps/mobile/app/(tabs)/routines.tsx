import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { FitColors as T } from '@/constants/theme';
import { useFocusRoutine, useMyRoutines, useRemoveRoutine, type RoutineDetail } from '@/lib/api/routines';

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
                            <RoutineCard key={routine.id} routine={routine} total={routines.length} />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

/**
 * Acciones en una hoja inferior, no sueltas en el card: el card entero navega al
 * detalle, así que un botón permanente al lado se toca sin querer — y uno de
 * ellos saca la rutina del plan. Se abre con los tres puntos (descubrible) o
 * manteniendo apretado el card (atajo).
 */
function RoutineMenu({
    routine,
    canFocus,
    onClose,
    onFocus,
    onRemove,
}: {
    routine: RoutineDetail;
    canFocus: boolean;
    onClose: () => void;
    onFocus: () => void;
    onRemove: () => void;
}) {
    return (
        <Modal visible transparent animationType="fade" onRequestClose={onClose}>
            <Pressable style={s.sheetBackdrop} onPress={onClose}>
                {/* Absorbe el press: tocar la hoja no la debe cerrar. */}
                <Pressable style={s.sheet} onPress={() => {}}>
                    <View style={s.sheetGrab} />
                    <Text style={s.sheetTitle} numberOfLines={1}>
                        {routine.name}
                    </Text>

                    {canFocus ? (
                        <TouchableOpacity style={s.sheetRow} onPress={onFocus}>
                            <Ionicons name="star-outline" size={18} color={T.yellow} />
                            <Text style={s.sheetRowText}>Mostrar en el inicio</Text>
                        </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity style={s.sheetRow} onPress={onRemove}>
                        <Ionicons name="trash-outline" size={18} color={T.red} />
                        <Text style={[s.sheetRowText, { color: T.red }]}>Quitar del plan</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[s.sheetRow, s.sheetCancel]} onPress={onClose}>
                        <Text style={[s.sheetRowText, { color: T.muted }]}>Cancelar</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

function RoutineCard({ routine, total }: { routine: RoutineDetail; total: number }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const focus = useFocusRoutine();
    const remove = useRemoveRoutine();

    const confirmRemove = () => {
        setMenuOpen(false);
        Alert.alert(
            '¿Quitar esta rutina?',
            `"${routine.name}" va a salir de tu plan. Tu entrenador puede volver a asignártela.`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Quitar', style: 'destructive', onPress: () => remove.mutate(routine.id) },
            ],
        );
    };

    return (
        <TouchableOpacity
            style={[s.routineCard, routine.focused && s.routineCardFocused]}
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/(routines)/detail', params: { id: routine.id } })}
            onLongPress={() => setMenuOpen(true)}
            delayLongPress={350}
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
                        {routine.focused ? <Pill label="EN EL INICIO" /> : null}
                    </View>
                </View>
                {/* Touchable anidado: RN no propaga el press al card. */}
                <TouchableOpacity onPress={() => setMenuOpen(true)} hitSlop={12} style={s.moreBtn}>
                    <Ionicons name="ellipsis-vertical" size={18} color={T.muted} />
                </TouchableOpacity>
            </View>

            {menuOpen && (
                <RoutineMenu
                    routine={routine}
                    // Con una sola rutina no hay nada que elegir, y la ya enfocada tampoco.
                    canFocus={total > 1 && !routine.focused}
                    onClose={() => setMenuOpen(false)}
                    onFocus={() => {
                        setMenuOpen(false);
                        focus.mutate(routine.id);
                    }}
                    onRemove={confirmRemove}
                />
            )}
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
    routineCardFocused: { borderColor: T.yellowBdr },
    moreBtn: { padding: 4, marginLeft: 4 },

    sheetBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: T.card,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 28,
    },
    sheetGrab: { width: 36, height: 4, borderRadius: 2, backgroundColor: T.border, alignSelf: 'center' },
    sheetTitle: { fontSize: 13, fontWeight: '800', color: T.muted, marginTop: 14, marginBottom: 6 },
    sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 15 },
    sheetRowText: { fontSize: 15, fontWeight: '600', color: T.white },
    sheetCancel: { justifyContent: 'center', borderTopWidth: 1, borderTopColor: T.border, marginTop: 6 },

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
