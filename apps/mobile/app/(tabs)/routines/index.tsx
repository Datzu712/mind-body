import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Modal,
    RefreshControl,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { FitColors as T } from '@/constants/theme';
import { useMarkNotificationRead, useNotifications, useRoutines } from '@/hooks/use-training';
import type { Notification, Routine } from '@/lib/api/types/training';

// ── Helpers ───────────────────────────────────────────────────────────────────

const Pill = ({ label, bg = T.yellow, fg = T.bg, sm }: { label: string; bg?: string; fg?: string; sm?: boolean }) => (
    <View
        style={{
            backgroundColor: bg,
            borderRadius: 5,
            paddingHorizontal: sm ? 6 : 8,
            paddingVertical: sm ? 2 : 3,
            alignSelf: 'flex-start',
        }}
    >
        <Text
            style={{
                color: fg,
                fontSize: sm ? 9 : 10,
                fontWeight: '800',
                letterSpacing: 0.4,
                textTransform: 'uppercase',
            }}
        >
            {label}
        </Text>
    </View>
);

const AccentColors = [T.orange, T.blue, T.green, T.purple, T.yellow];

function routineAccent(index: number) {
    return AccentColors[index % AccentColors.length];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SkeletonCard() {
    return (
        <View style={[s.routineCard, { opacity: 0.7 }]}>
            <View style={{ height: 3, backgroundColor: T.card3, borderRadius: 2 }} />
            <View style={s.routineInner}>
                <View style={{ flex: 1, gap: 8 }}>
                    <View style={{ width: 80, height: 12, backgroundColor: T.card3, borderRadius: 4 }} />
                    <View style={{ width: '60%', height: 16, backgroundColor: T.card3, borderRadius: 4 }} />
                    <View style={{ width: '40%', height: 12, backgroundColor: T.card3, borderRadius: 4 }} />
                </View>
            </View>
        </View>
    );
}

function ErrorRetry({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <View style={s.centerBox}>
            <Ionicons name="alert-circle-outline" size={40} color={T.red} />
            <Text style={s.errorText}>{message}</Text>
            <TouchableOpacity onPress={onRetry} style={s.retryBtn} activeOpacity={0.8}>
                <Text style={s.retryBtnText}>Reintentar</Text>
            </TouchableOpacity>
        </View>
    );
}

function EmptyState({ icon, title, message }: { icon: string; title: string; message: string }) {
    return (
        <View style={s.centerBox}>
            <Ionicons name={icon as never} size={48} color={T.muted} />
            <Text style={s.emptyTitle}>{title}</Text>
            <Text style={s.emptyMessage}>{message}</Text>
        </View>
    );
}

function NotificationItem({ item }: { item: Notification }) {
    const mark = useMarkNotificationRead();
    return (
        <View style={s.notifRow}>
            <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.notifTitle}>{item.title}</Text>
                {item.body ? <Text style={s.notifBody}>{item.body}</Text> : null}
                <Text style={s.notifDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            {!item.read && (
                <TouchableOpacity
                    onPress={() => mark.mutate(item.id)}
                    style={s.notifReadBtn}
                    disabled={mark.isPending}
                    activeOpacity={0.8}
                >
                    <Ionicons name="checkmark" size={16} color={T.yellow} />
                </TouchableOpacity>
            )}
        </View>
    );
}

function NotificationsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const { data, isLoading, error, refetch } = useNotifications();

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <SafeAreaView style={s.modalRoot} edges={['top']}>
                <View style={s.modalHeader}>
                    <Text style={s.modalTitle}>NOTIFICACIONES</Text>
                    <TouchableOpacity onPress={onClose} style={s.modalClose} activeOpacity={0.8}>
                        <Ionicons name="close" size={24} color={T.white} />
                    </TouchableOpacity>
                </View>
                <ScrollView contentContainerStyle={s.modalScroll}>
                    {isLoading ? (
                        <ActivityIndicator color={T.yellow} />
                    ) : error ? (
                        <ErrorRetry message="No se pudieron cargar las notificaciones" onRetry={refetch} />
                    ) : !data || data.length === 0 ? (
                        <EmptyState
                            icon="notifications-off-outline"
                            title="Sin notificaciones"
                            message="No tenés notificaciones por el momento."
                        />
                    ) : (
                        <View style={{ gap: 8 }}>
                            {data.map((n) => (
                                <NotificationItem key={n.id} item={n} />
                            ))}
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

function RoutineCard({ routine, index }: { routine: Routine; index: number }) {
    const accent = routineAccent(index);
    const exerciseCount = routine.exercises?.length ?? 0;

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/(tabs)/routines/[id]', params: { id: routine.id } })}
            style={s.routineCard}
        >
            <View style={{ height: 3, backgroundColor: accent, borderRadius: 2 }} />
            <View style={s.routineInner}>
                <View style={{ flex: 1 }}>
                    <View style={s.routineTopRow}>
                        <Pill label={routine.status} bg={accent + '22'} fg={accent} sm />
                        {exerciseCount > 0 && (
                            <Text style={s.metaText}>
                                {exerciseCount} ejercicio{exerciseCount === 1 ? '' : 's'}
                            </Text>
                        )}
                    </View>
                    <Text style={s.routineName}>{routine.name}</Text>
                    {routine.objective ? <Text style={s.routineSub}>{routine.objective}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={18} color={T.muted} />
            </View>
        </TouchableOpacity>
    );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function RoutinesScreen() {
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const { data, isLoading, error, refetch } = useRoutines();
    const { data: notifications } = useNotifications();
    const unreadCount = notifications?.filter((n) => !n.read).length ?? 0;

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={s.scroll}
                refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={T.yellow} />}
            >
                {/* Header */}
                <View style={s.header}>
                    <View style={{ flex: 1 }}>
                        <Text style={s.eyebrow}>SEMANA ACTUAL</Text>
                        <Text style={s.title}>MIS RUTINAS</Text>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => setNotificationsOpen(true)}
                        style={s.bellBtn}
                        accessibilityLabel="Ver notificaciones"
                    >
                        <Ionicons name="notifications-outline" size={22} color={T.white} />
                        {unreadCount > 0 && (
                            <View style={s.badge}>
                                <Text style={s.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Routine list */}
                <View style={s.secHead}>
                    <Text style={s.secTitle}>RUTINAS ASIGNADAS</Text>
                    {data ? <Text style={s.secCount}>{data.length}</Text> : null}
                </View>

                <View style={[s.px, { gap: 10 }]}>
                    {isLoading ? (
                        <>
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </>
                    ) : error ? (
                        <ErrorRetry message="No se pudieron cargar las rutinas" onRetry={refetch} />
                    ) : !data || data.length === 0 ? (
                        <EmptyState
                            icon="barbell-outline"
                            title="No tenés rutinas asignadas"
                            message="Tu entrenador te asignará rutinas para verlas acá."
                        />
                    ) : (
                        data.map((r, i) => <RoutineCard key={r.id} routine={r} index={i} />)
                    )}
                </View>
            </ScrollView>

            <NotificationsModal visible={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingBottom: 28 },
    px: { paddingHorizontal: 20 },

    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 14,
    },
    eyebrow: {
        fontSize: 11,
        color: T.muted,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: { fontSize: 24, fontWeight: '900', color: T.white },

    bellBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: T.card,
        borderWidth: 1,
        borderColor: T.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: T.red,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: T.bg,
    },
    badgeText: { color: T.white, fontSize: 9, fontWeight: '800' },

    secHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    secTitle: { fontSize: 12, fontWeight: '800', color: T.white, letterSpacing: 1.5, textTransform: 'uppercase' },
    secCount: { fontSize: 11, fontWeight: '700', color: T.muted },

    // Routine card
    routineCard: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        overflow: 'hidden',
    },
    routineInner: { flexDirection: 'row', alignItems: 'center', padding: 14, paddingBottom: 12 },
    routineTopRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 },
    metaText: { fontSize: 10, color: T.muted, fontWeight: '600' },
    routineName: { fontSize: 15, fontWeight: '800', color: T.white, letterSpacing: -0.2 },
    routineSub: { fontSize: 11, color: T.muted, marginTop: 2 },

    centerBox: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 24,
        alignItems: 'center',
        gap: 10,
    },
    emptyTitle: { fontSize: 15, fontWeight: '800', color: T.white, marginTop: 8 },
    emptyMessage: { fontSize: 12, color: T.muted, textAlign: 'center', lineHeight: 18 },
    errorText: { fontSize: 13, color: T.white, textAlign: 'center' },
    retryBtn: {
        backgroundColor: T.yellowDim,
        borderWidth: 1,
        borderColor: T.yellowBdr,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 16,
        marginTop: 4,
    },
    retryBtnText: { color: T.yellow, fontSize: 12, fontWeight: '800' },

    // Modal
    modalRoot: { flex: 1, backgroundColor: T.bg },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: T.border,
    },
    modalTitle: { fontSize: 14, fontWeight: '900', color: T.white, letterSpacing: 1 },
    modalClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
    modalScroll: { padding: 20, paddingBottom: 40, gap: 8 },

    notifRow: {
        flexDirection: 'row',
        gap: 12,
        backgroundColor: T.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
        alignItems: 'center',
    },
    notifTitle: { fontSize: 13, fontWeight: '800', color: T.white },
    notifBody: { fontSize: 11, color: T.muted, lineHeight: 16 },
    notifDate: { fontSize: 10, color: T.muted, marginTop: 2 },
    notifReadBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: T.yellowDim,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
