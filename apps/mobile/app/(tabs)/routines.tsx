import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { FitColors as T } from '@/constants/theme';
import {
    ASSIGNED_ROUTINES,
    CLASS_ATTENDANCE,
    TRAINER_MEMBERS,
    type AssignedRoutine,
    type RoutineAttachment,
} from '@/components/training/mock-training';

type Mode = 'member' | 'trainer';

const clampPct = (value: number) => Math.min(100, Math.max(0, value));

const Bar = ({ pct, color = T.yellow, h = 4 }: { pct: number; color?: string; h?: number }) => (
    <View style={{ backgroundColor: T.card3, height: h, borderRadius: h, overflow: 'hidden' }}>
        <View style={{ width: `${clampPct(pct)}%`, height: '100%', backgroundColor: color }} />
    </View>
);

const Pill = ({ label, bg = T.yellow, fg = T.bg }: { label: string; bg?: string; fg?: string }) => (
    <View style={[s.pill, { backgroundColor: bg }]}>
        <Text style={[s.pillText, { color: fg }]} numberOfLines={1}>
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

function AttachmentRow({ attachment }: { attachment: RoutineAttachment }) {
    const icon = attachment.type === 'Video' ? 'play-circle-outline' : 'document-text-outline';

    return (
        <View style={s.attachmentRow}>
            <View style={s.attachmentIcon}>
                <Ionicons name={icon} size={17} color={T.yellow} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={s.attachmentName}>{attachment.name}</Text>
                <Text style={s.attachmentMeta}>
                    {attachment.type} - {attachment.size}
                </Text>
            </View>
            <Ionicons name="download-outline" size={17} color={T.muted} />
        </View>
    );
}

function RoutineCard({
    routine,
    selected,
    onPress,
}: {
    routine: AssignedRoutine;
    selected: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            activeOpacity={0.82}
            onPress={onPress}
            style={[s.routineCard, selected && { borderColor: routine.accent + '99' }]}
        >
            <View style={[s.cardAccent, { backgroundColor: routine.accent }]} />
            <View style={s.routineInner}>
                <View style={{ flex: 1 }}>
                    <View style={s.routineTop}>
                        <Text style={s.routineDay}>{routine.day}</Text>
                        <Pill label={routine.executionStatus} bg={routine.accent + '22'} fg={routine.accent} />
                    </View>
                    <Text style={s.routineName}>{routine.name}</Text>
                    <Text style={s.routineSub}>
                        {routine.goal} - {routine.durationMin} min - {routine.exercises.length} ejercicios
                    </Text>
                </View>
                <View style={[s.statusIcon, { backgroundColor: routine.progress === 100 ? routine.accent : T.card2 }]}>
                    <Ionicons
                        name={routine.progress === 100 ? 'checkmark' : 'chevron-forward'}
                        size={16}
                        color={routine.progress === 100 ? T.bg : T.muted}
                    />
                </View>
            </View>
            <View style={s.progressBlock}>
                <View style={s.progressRow}>
                    <Text style={s.progressLabel}>Avance registrado</Text>
                    <Text style={[s.progressValue, { color: routine.progress > 0 ? routine.accent : T.muted }]}>
                        {routine.progress}%
                    </Text>
                </View>
                <Bar pct={routine.progress} color={routine.accent} h={3} />
            </View>
        </TouchableOpacity>
    );
}

function MemberRoutineDetail({ routine }: { routine: AssignedRoutine }) {
    const [confirmed, setConfirmed] = useState(routine.executionStatus === 'Confirmada');

    return (
        <View style={s.detailCard}>
            <View style={s.detailHead}>
                <View style={{ flex: 1 }}>
                    <Text style={s.detailEyebrow}>Rutina asignada por {routine.trainer}</Text>
                    <Text style={s.detailTitle}>{routine.name}</Text>
                    <Text style={s.detailSub}>
                        {routine.frequency} - Nivel {routine.level}
                    </Text>
                </View>
                <View style={[s.detailBadge, { borderColor: routine.accent + '66' }]}>
                    <Text style={[s.detailBadgeText, { color: routine.accent }]}>{routine.progress}%</Text>
                </View>
            </View>

            <Text style={s.noteText}>{routine.notes}</Text>

            <SectionHead title="Ejercicios de hoy" right={`${routine.exercises.length}`} />
            <View style={{ gap: 9 }}>
                {routine.exercises.map((exercise, index) => (
                    <View key={exercise.id} style={s.exerciseRow}>
                        <View style={[s.exerciseNumber, { backgroundColor: exercise.accent + '22' }]}>
                            <Text style={[s.exerciseNumberText, { color: exercise.accent }]}>{index + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={s.exerciseName}>{exercise.name}</Text>
                            <Text style={s.exerciseMeta}>
                                {exercise.sets} series - {exercise.reps} reps - {exercise.load}
                            </Text>
                        </View>
                        <TextInput
                            placeholder="kg/reps"
                            placeholderTextColor={T.muted}
                            style={s.executionInput}
                            accessibilityLabel={`Registrar ejecucion de ${exercise.name}`}
                        />
                    </View>
                ))}
            </View>

            <SectionHead
                title="Adjuntos"
                right={routine.attachments.length ? `${routine.attachments.length}` : 'Sin archivos'}
            />
            <View style={{ gap: 8 }}>
                {routine.attachments.length ? (
                    routine.attachments.map((attachment) => (
                        <AttachmentRow key={attachment.id} attachment={attachment} />
                    ))
                ) : (
                    <Text style={s.emptyInline}>Esta rutina no tiene material adjunto.</Text>
                )}
            </View>

            <TouchableOpacity
                activeOpacity={0.86}
                onPress={() => setConfirmed(true)}
                style={[s.primaryAction, confirmed && { backgroundColor: T.green }]}
            >
                <Ionicons name={confirmed ? 'checkmark-circle' : 'save-outline'} size={17} color={T.bg} />
                <Text style={s.primaryActionText}>
                    {confirmed ? 'Entrenamiento confirmado' : 'Guardar y confirmar'}
                </Text>
            </TouchableOpacity>
        </View>
    );
}

function TrainerPanel() {
    const [draftName, setDraftName] = useState('Push day semana B');
    const [selectedMember, setSelectedMember] = useState(TRAINER_MEMBERS[0].id);
    const selected = TRAINER_MEMBERS.find((member) => member.id === selectedMember) ?? TRAINER_MEMBERS[0];
    const routine = ASSIGNED_ROUTINES.find((item) => item.id === selected.activeRoutineId) ?? ASSIGNED_ROUTINES[0];

    return (
        <>
            <View style={s.trainerHero}>
                <View>
                    <Text style={s.heroLabel}>Panel entrenador</Text>
                    <Text style={s.heroTitle}>Rutinas y asistencia</Text>
                    <Text style={s.heroCopy}>Crea, asigna, ajusta y revisa asistencia desde una vista compacta.</Text>
                </View>
                <View style={s.heroKpi}>
                    <Text style={s.heroKpiValue}>3</Text>
                    <Text style={s.heroKpiLabel}>alertas</Text>
                </View>
            </View>

            <SectionHead title="Crear rutina" right="Mock UI" />
            <View style={s.formCard}>
                <Text style={s.fieldLabel}>Nombre de rutina</Text>
                <TextInput
                    value={draftName}
                    onChangeText={setDraftName}
                    style={s.input}
                    placeholderTextColor={T.muted}
                />
                <Text style={s.fieldLabel}>Asignar a miembro</Text>
                <View style={s.memberChips}>
                    {TRAINER_MEMBERS.map((member) => {
                        const active = selectedMember === member.id;
                        return (
                            <TouchableOpacity
                                key={member.id}
                                onPress={() => setSelectedMember(member.id)}
                                style={[s.memberChip, active && { backgroundColor: T.yellow, borderColor: T.yellow }]}
                            >
                                <Text style={[s.memberChipText, active && { color: T.bg }]}>{member.name}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
                <TouchableOpacity style={s.secondaryAction} activeOpacity={0.85}>
                    <Ionicons name="person-add-outline" size={16} color={T.yellow} />
                    <Text style={s.secondaryActionText}>Asignar rutina y notificar</Text>
                </TouchableOpacity>
            </View>

            <SectionHead title="Miembro seleccionado" right={`${selected.adherence}% adherencia`} />
            <View style={s.memberCard}>
                <View style={s.memberAvatar}>
                    <Text style={s.memberAvatarText}>{selected.name.slice(0, 1)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={s.memberName}>{selected.name}</Text>
                    <Text style={s.memberMeta}>
                        {selected.goal} - {selected.lastCheckIn}
                    </Text>
                    <Bar pct={selected.adherence} color={selected.adherence < 50 ? T.red : T.green} h={4} />
                </View>
            </View>

            <SectionHead title="Actualizar rutina" right={routine.versionHistory[0]} />
            <View style={s.detailCard}>
                <Text style={s.detailTitle}>{routine.name}</Text>
                <Text style={s.noteText}>
                    Editar ejercicios, series o repeticiones publicaria una nueva version mock.
                </Text>
                {routine.exercises.map((exercise) => (
                    <View key={exercise.id} style={s.trainerExerciseRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.exerciseName}>{exercise.name}</Text>
                            <Text style={s.exerciseMeta}>
                                {exercise.sets}x{exercise.reps} - {exercise.load}
                            </Text>
                        </View>
                        <TouchableOpacity style={s.iconButton}>
                            <Ionicons name="create-outline" size={16} color={T.yellow} />
                        </TouchableOpacity>
                    </View>
                ))}
                <View style={s.versionBox}>
                    {routine.versionHistory.map((version) => (
                        <Text key={version} style={s.versionText}>
                            {version}
                        </Text>
                    ))}
                </View>
            </View>

            <SectionHead title="Asistencia grupal" />
            <View style={{ gap: 10 }}>
                {CLASS_ATTENDANCE.map((item) => (
                    <View key={item.id} style={s.attendanceCard}>
                        <View>
                            <Text style={s.attendanceName}>{item.className}</Text>
                            <Text style={s.attendanceMeta}>
                                {item.time} - {item.attended}/{item.reserved} presentes
                            </Text>
                        </View>
                        <Pill
                            label={`${item.reserved - item.attended} ausentes`}
                            bg={item.reserved - item.attended > 1 ? T.orange + '22' : T.green + '22'}
                            fg={item.reserved - item.attended > 1 ? T.orange : T.green}
                        />
                    </View>
                ))}
            </View>
        </>
    );
}

export default function RoutinesScreen() {
    const [mode, setMode] = useState<Mode>('member');
    const [selectedRoutineId, setSelectedRoutineId] = useState(ASSIGNED_ROUTINES[0].id);
    const selectedRoutine =
        ASSIGNED_ROUTINES.find((routine) => routine.id === selectedRoutineId) ?? ASSIGNED_ROUTINES[0];
    const activeRoutines = useMemo(() => ASSIGNED_ROUTINES.filter((routine) => routine.status !== 'Pausada'), []);
    const completed = activeRoutines.filter((routine) => routine.progress === 100).length;

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                <View style={s.header}>
                    <Text style={s.eyebrow}>
                        {mode === 'member' ? 'Experiencia miembro' : 'Experiencia entrenador'}
                    </Text>
                    <Text style={s.title}>ENTRENAMIENTOS</Text>
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
                                    name={item === 'member' ? 'person-outline' : 'clipboard-outline'}
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

                {mode === 'member' ? (
                    <>
                        <View style={s.summaryCard}>
                            <View>
                                <Text style={s.summaryLabel}>Progreso semanal</Text>
                                <Text style={s.summaryValue}>
                                    {completed}/{activeRoutines.length} rutinas completadas
                                </Text>
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Bar pct={(completed / activeRoutines.length) * 100} h={6} />
                            </View>
                        </View>

                        <SectionHead title="Mis rutinas" right={`${ASSIGNED_ROUTINES.length} asignadas`} />
                        <View style={s.listStack}>
                            {ASSIGNED_ROUTINES.map((routine) => (
                                <RoutineCard
                                    key={routine.id}
                                    routine={routine}
                                    selected={routine.id === selectedRoutineId}
                                    onPress={() => setSelectedRoutineId(routine.id)}
                                />
                            ))}
                        </View>

                        <SectionHead title="Detalle y ejecucion" />
                        <MemberRoutineDetail routine={selectedRoutine} />
                    </>
                ) : (
                    <TrainerPanel />
                )}
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
    modeRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 20,
        marginBottom: 14,
    },
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
    summaryCard: {
        marginHorizontal: 20,
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryLabel: { color: T.muted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
    summaryValue: { color: T.white, fontSize: 16, fontWeight: '900', marginTop: 3 },
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
    routineCard: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        overflow: 'hidden',
    },
    cardAccent: { height: 3 },
    routineInner: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
    routineTop: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 5 },
    routineDay: { color: T.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    routineName: { color: T.white, fontSize: 16, fontWeight: '900' },
    routineSub: { color: T.muted, fontSize: 11, fontWeight: '600', marginTop: 2 },
    statusIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    progressBlock: { paddingHorizontal: 14, paddingBottom: 12 },
    progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    progressLabel: { color: T.muted, fontSize: 10, fontWeight: '700' },
    progressValue: { fontSize: 10, fontWeight: '900' },
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
    detailHead: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
    detailEyebrow: { color: T.muted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
    detailTitle: { color: T.white, fontSize: 18, fontWeight: '900', marginTop: 3 },
    detailSub: { color: T.muted, fontSize: 12, fontWeight: '600', marginTop: 4 },
    detailBadge: {
        minWidth: 54,
        height: 42,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    detailBadgeText: { fontSize: 14, fontWeight: '900' },
    noteText: { color: T.muted, fontSize: 13, lineHeight: 19 },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: T.card2,
        borderRadius: 12,
        padding: 10,
    },
    exerciseNumber: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    exerciseNumberText: { fontSize: 12, fontWeight: '900' },
    exerciseName: { color: T.white, fontSize: 13, fontWeight: '800' },
    exerciseMeta: { color: T.muted, fontSize: 11, fontWeight: '600', marginTop: 2 },
    executionInput: {
        width: 74,
        height: 36,
        borderRadius: 9,
        borderWidth: 1,
        borderColor: T.border,
        color: T.white,
        paddingHorizontal: 9,
        fontSize: 11,
    },
    attachmentRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: T.card2,
        borderRadius: 12,
        padding: 10,
    },
    attachmentIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: T.yellowDim,
        alignItems: 'center',
        justifyContent: 'center',
    },
    attachmentName: { color: T.white, fontSize: 13, fontWeight: '800' },
    attachmentMeta: { color: T.muted, fontSize: 11, marginTop: 2 },
    emptyInline: { color: T.muted, fontSize: 12 },
    primaryAction: {
        minHeight: 48,
        borderRadius: 12,
        backgroundColor: T.yellow,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        marginTop: 2,
    },
    primaryActionText: { color: T.bg, fontSize: 14, fontWeight: '900' },
    trainerHero: {
        marginHorizontal: 20,
        backgroundColor: '#16130A',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: T.yellowBdr,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
    },
    heroLabel: { color: T.yellow, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
    heroTitle: { color: T.white, fontSize: 20, fontWeight: '900', marginTop: 3 },
    heroCopy: { color: T.muted, fontSize: 12, lineHeight: 17, marginTop: 5, maxWidth: 220 },
    heroKpi: {
        width: 66,
        height: 66,
        borderRadius: 16,
        backgroundColor: T.yellow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroKpiValue: { color: T.bg, fontSize: 24, fontWeight: '900' },
    heroKpiLabel: { color: T.bg, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
    formCard: {
        marginHorizontal: 20,
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
        gap: 10,
    },
    fieldLabel: { color: T.muted, fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
    input: {
        height: 44,
        backgroundColor: T.card2,
        borderWidth: 1,
        borderColor: T.border,
        borderRadius: 10,
        color: T.white,
        paddingHorizontal: 12,
        fontWeight: '700',
    },
    memberChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    memberChip: { borderWidth: 1, borderColor: T.border, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8 },
    memberChipText: { color: T.white, fontSize: 11, fontWeight: '800' },
    secondaryAction: {
        height: 44,
        borderRadius: 11,
        borderWidth: 1,
        borderColor: T.yellowBdr,
        backgroundColor: T.yellowDim,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    secondaryActionText: { color: T.yellow, fontSize: 13, fontWeight: '900' },
    memberCard: {
        marginHorizontal: 20,
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    memberAvatar: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: T.yellow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    memberAvatarText: { color: T.bg, fontSize: 19, fontWeight: '900' },
    memberName: { color: T.white, fontSize: 15, fontWeight: '900' },
    memberMeta: { color: T.muted, fontSize: 11, marginTop: 2, marginBottom: 8 },
    trainerExerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: T.card2,
        borderRadius: 12,
        padding: 10,
    },
    iconButton: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: T.yellowDim,
        alignItems: 'center',
        justifyContent: 'center',
    },
    versionBox: { gap: 5, borderTopWidth: 1, borderTopColor: T.border, paddingTop: 10 },
    versionText: { color: T.muted, fontSize: 11, fontWeight: '600' },
    attendanceCard: {
        marginHorizontal: 20,
        backgroundColor: T.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    attendanceName: { color: T.white, fontSize: 14, fontWeight: '900' },
    attendanceMeta: { color: T.muted, fontSize: 11, marginTop: 3 },
});
