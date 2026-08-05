import { FitColors as T } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';
import { useProfile } from '@/hooks/use-profile';
import { currentMembership, daysUntil, useMyMemberships, type Membership } from '@/lib/api/memberships';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type SettingItem =
    | { kind: 'link'; ic: string; lbl: string; ac: string }
    | { kind: 'toggle'; ic: string; lbl: string; ac: string; on: boolean };

const SETTINGS_INITIAL: SettingItem[] = [
    { kind: 'link', ic: '🎯', lbl: 'Mis Objetivos', ac: T.green },
    { kind: 'link', ic: '🔔', lbl: 'Notificaciones', ac: '#FF9500' },
    { kind: 'link', ic: '🏆', lbl: 'Logros y Badges', ac: T.purple },
    { kind: 'link', ic: '📊', lbl: 'Estadísticas', ac: T.blue },
    { kind: 'toggle', ic: '🌙', lbl: 'Tema Oscuro', ac: '#64D2FF', on: true },
    { kind: 'link', ic: '❓', lbl: 'Ayuda y Soporte', ac: T.muted },
    { kind: 'link', ic: '⚙️', lbl: 'Configuración', ac: T.muted },
];

/** 'YYYY-MM-DD' → '4 ago 2026'. Parsed as local time so the date does not shift. */
function formatDay(iso: string): string {
    return format(new Date(`${iso}T00:00:00`), 'd MMM yyyy', { locale: es });
}

interface MembershipState {
    label: string;
    bg: string;
    fg: string;
    note?: string;
}

/**
 * The badge the member sees. An ACTIVE term about to lapse gets its own warning
 * state: renewal happens at the front desk, so the app's only job is to say
 * "go talk to them" before access stops.
 */
function membershipState(membership: Membership | undefined): MembershipState {
    if (!membership) return { label: '', bg: 'transparent', fg: T.muted };

    if (membership.status === 'CANCELLED') {
        return { label: 'CANCELADA', bg: T.card, fg: T.muted, note: 'Hablá en recepción para reactivarla.' };
    }
    if (membership.status === 'SUSPENDED') {
        return { label: 'SUSPENDIDA', bg: T.card, fg: T.orange, note: 'Tu membresía está suspendida.' };
    }

    const days = daysUntil(membership.endDate);

    if (membership.status === 'EXPIRED' || days < 0) {
        return { label: 'VENCIDA', bg: T.card, fg: T.red, note: 'Renová en recepción para seguir reservando.' };
    }
    if (days <= 7) {
        return {
            label: 'POR VENCER',
            bg: T.yellowDim,
            fg: T.yellow,
            note: days === 0 ? 'Vence hoy. Renová en recepción.' : `Vence en ${days} ${days === 1 ? 'día' : 'días'}.`,
        };
    }

    return { label: 'ACTIVA', bg: T.yellow, fg: T.bg };
}

export default function ProfileScreen() {
    const [settings, setSettings] = useState<SettingItem[]>(SETTINGS_INITIAL);
    const { signOut } = useAuth();
    const { data: profile } = useProfile();
    const { data: memberships } = useMyMemberships();

    const current = currentMembership(memberships);
    const memState = membershipState(current);

    const displayName = profile?.fullName?.trim() || 'Usuario';
    const displayEmail = profile?.email ?? '';
    const avatarLabel = (displayName.trim()[0] || 'U').toUpperCase();

    // `createdAt` is '' while the JWT-claims placeholder stands in for the real profile.
    const memberSince =
        profile?.createdAt && !isNaN(new Date(profile.createdAt).getTime())
            ? format(new Date(profile.createdAt), 'MMM yyyy', { locale: es })
            : null;

    function toggleSetting(idx: number) {
        setSettings((prev) =>
            prev.map((item, i) => (i === idx && item.kind === 'toggle' ? { ...item, on: !item.on } : item)),
        );
    }

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Header */}
                <View style={s.header}>
                    <Text style={s.eyebrow}>MI CUENTA</Text>
                    <Text style={s.title}>PERFIL</Text>
                </View>

                {/* Profile hero card */}
                <View style={s.px}>
                    <View style={s.heroCard}>
                        <View style={s.heroGlow} pointerEvents="none" />

                        <View style={s.heroTop}>
                            {/* Avatar */}
                            <View style={s.avatarWrap}>
                                <View style={s.avatar}>
                                    <Text style={s.avatarTxt}>{avatarLabel}</Text>
                                </View>
                                <View style={s.onlineDot} />
                            </View>

                            {/* Name + membership */}
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <Text style={s.userName}>{displayName}</Text>
                                <Text style={s.userEmail}>{displayEmail}</Text>
                                {profile?.status === 'ACTIVE' && (
                                    <View style={s.memberBadge}>
                                        <Text style={s.memberIcon}>⭐</Text>
                                        <Text style={s.memberText}>MIEMBRO ACTIVO</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>

                {/* Membership. No amounts here on purpose: the gym charges in person,
                    so the app never has a price to show. */}
                {current ? (
                    <>
                        <View style={s.secHead}>
                            <Text style={s.secTitle}>MEMBRESÍA</Text>
                        </View>
                        <View style={s.px}>
                            <View style={s.memCard}>
                                <View style={s.memTop}>
                                    <Text style={s.memPlan}>{current.planName}</Text>
                                    <View style={[s.memChip, { backgroundColor: memState.bg }]}>
                                        <Text style={[s.memChipText, { color: memState.fg }]}>{memState.label}</Text>
                                    </View>
                                </View>

                                <View style={s.memDivider} />

                                <View style={s.memRow}>
                                    <View>
                                        <Text style={s.memLabel}>INICIO</Text>
                                        <Text style={s.memValue}>{formatDay(current.startDate)}</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={s.memLabel}>VENCE</Text>
                                        <Text style={s.memValue}>{formatDay(current.endDate)}</Text>
                                    </View>
                                </View>

                                {memState.note ? <Text style={s.memNote}>{memState.note}</Text> : null}
                            </View>
                        </View>
                    </>
                ) : null}

                {/* Settings */}
                <View style={s.secHead}>
                    <Text style={s.secTitle}>CONFIGURACIÓN</Text>
                </View>
                <View style={[s.px, { gap: 6 }]}>
                    {settings.map((item, i) => (
                        <TouchableOpacity
                            key={i}
                            style={s.settingRow}
                            onPress={() => {
                                if (item.kind === 'toggle') return toggleSetting(i);
                                if (item.lbl === 'Configuración') return router.push('/(settings)');
                            }}
                            activeOpacity={0.8}
                        >
                            <View style={[s.settingIcon, { backgroundColor: item.ac + '22' }]}>
                                <Text style={{ fontSize: 16 }}>{item.ic}</Text>
                            </View>
                            <Text style={s.settingLabel}>{item.lbl}</Text>
                            {item.kind === 'toggle' ? (
                                <Switch
                                    value={item.on}
                                    onValueChange={() => toggleSetting(i)}
                                    trackColor={{ false: T.card3, true: T.yellow }}
                                    thumbColor={T.bg}
                                    ios_backgroundColor={T.card3}
                                />
                            ) : (
                                <Ionicons name="chevron-forward" size={16} color={T.muted} />
                            )}
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout */}
                <View style={[s.px, { marginTop: 14 }]}>
                    <TouchableOpacity style={s.logoutBtn} activeOpacity={0.8} onPress={signOut}>
                        <Ionicons name="power" size={16} color={T.red} />
                        <Text style={s.logoutText}>CERRAR SESIÓN</Text>
                    </TouchableOpacity>
                </View>

                <Text style={s.version}>
                    Mind&Body v{Constants.expoConfig?.version ?? '—'}
                    {memberSince ? ` · MIEMBRO DESDE ${memberSince.toUpperCase()}` : ''}
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingBottom: 28 },
    px: { paddingHorizontal: 20 },

    header: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16 },
    eyebrow: {
        fontSize: 11,
        color: T.muted,
        fontWeight: '700',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    title: { fontSize: 24, fontWeight: '900', color: T.white },

    // Hero card
    heroCard: {
        backgroundColor: '#1a1400',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: T.yellowBdr,
        overflow: 'hidden',
    },
    heroGlow: {
        position: 'absolute',
        top: -30,
        right: -30,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(255,214,0,0.08)',
    },
    heroTop: { flexDirection: 'row', alignItems: 'center' },
    avatarWrap: { position: 'relative' },
    avatar: {
        width: 70,
        height: 70,
        borderRadius: 20,
        backgroundColor: T.yellow,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarTxt: { fontSize: 30, fontWeight: '900', color: T.bg },
    onlineDot: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: T.green,
        borderWidth: 2,
        borderColor: '#1a1400',
    },
    userName: {
        fontSize: 19,
        fontWeight: '900',
        color: T.white,
        marginBottom: 2,
    },
    userEmail: { fontSize: 11, color: T.muted, marginBottom: 9 },
    memberBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: T.yellow,
        borderRadius: 7,
        paddingHorizontal: 10,
        paddingVertical: 4,
        alignSelf: 'flex-start',
    },
    memberIcon: { fontSize: 11 },
    memberText: {
        fontSize: 10,
        fontWeight: '800',
        color: T.bg,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
    },

    // Membership

    memCard: {
        backgroundColor: T.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
    },
    memTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    memPlan: { flex: 1, fontSize: 15, fontWeight: '800', color: T.white },
    memChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
    memChipText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
    memDivider: { height: 1, backgroundColor: T.border, marginVertical: 12 },
    memRow: { flexDirection: 'row', justifyContent: 'space-between' },
    memLabel: { fontSize: 9, fontWeight: '800', color: T.muted, letterSpacing: 1 },
    memValue: { fontSize: 13, fontWeight: '700', color: T.white, marginTop: 3 },
    memNote: { fontSize: 11, color: T.muted, marginTop: 12, lineHeight: 15 },

    secHead: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    secTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: T.white,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
    },

    // Settings
    settingRow: {
        backgroundColor: T.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: T.border,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    settingIcon: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    settingLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: T.white },

    // Logout
    logoutBtn: {
        borderWidth: 1,
        borderColor: T.red + '44',
        borderRadius: 12,
        paddingVertical: 13,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    logoutText: {
        color: T.red,
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },

    version: {
        textAlign: 'center',
        fontSize: 10,
        color: '#2A2A2A',
        paddingTop: 14,
        paddingBottom: 4,
        letterSpacing: 0.3,
        textTransform: 'uppercase',
    },
});
