import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { FitColors as T } from '@/constants/theme';
import { ReservationFilterChips } from '@/components/reservations/ReservationFilterChips';
import { ReservationClassCard } from '@/components/reservations/ReservationClassCard';
import { ReservationEmptyState } from '@/components/reservations/ReservationEmptyState';
import { MOCK_CLASSES, FILTER_CATEGORIES, type FilterCategory } from '@/components/reservations/mock-reservations';

type Shortcut = {
    label: string;
    icon: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
    href: string;
};

const SHORTCUTS: Shortcut[] = [
    { label: 'Mis reservas', icon: 'bookmark-outline', color: T.green, href: '/(reservations)/my-reservations' },
    { label: 'Recordatorios', icon: 'notifications-outline', color: T.blue, href: '/(reservations)/reminders' },
    { label: 'Lista de espera', icon: 'people-outline', color: T.orange, href: '/(reservations)/waitlist' },
];

export default function ReservationsScreen() {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<FilterCategory>('Todas');

    const goToClass = (id: string) => router.push({ pathname: '/(reservations)/class-detail', params: { id } });

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return MOCK_CLASSES.filter((c) => {
            const matchesCat = category === 'Todas' || c.category === category;
            const matchesQuery =
                q.length === 0 || c.name.toLowerCase().includes(q) || c.trainer.toLowerCase().includes(q);
            return matchesCat && matchesQuery;
        });
    }, [query, category]);

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Header */}
                <View style={s.header}>
                    <Text style={s.eyebrow}>MÓDULO DE RESERVAS</Text>
                    <Text style={s.title}>RESERVAS</Text>
                    <Text style={s.subtitle}>Busca, filtra y reserva tu clase perfecta.</Text>
                </View>

                {/* Quick-access shortcuts */}
                <View style={s.shortcutRow}>
                    {SHORTCUTS.map((sc) => (
                        <TouchableOpacity
                            key={sc.label}
                            activeOpacity={0.85}
                            onPress={() => router.push(sc.href as never)}
                            accessibilityRole="button"
                            accessibilityLabel={sc.label}
                            style={s.shortcut}
                        >
                            <View style={[s.shortcutIcon, { backgroundColor: sc.color + '22' }]}>
                                <Ionicons name={sc.icon} size={18} color={sc.color} />
                            </View>
                            <Text style={s.shortcutLabel}>{sc.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Search */}
                <View style={s.px}>
                    <View style={s.search}>
                        <Ionicons name="search" size={18} color={T.muted} />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Buscar clases o entrenadores"
                            placeholderTextColor={T.muted}
                            style={s.searchInput}
                            returnKeyType="search"
                            accessibilityLabel="Buscar clases o entrenadores"
                        />
                        {query.length > 0 && (
                            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Limpiar búsqueda">
                                <Ionicons name="close-circle" size={18} color={T.muted} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Filters */}
                <View style={s.filterWrap}>
                    <ReservationFilterChips categories={FILTER_CATEGORIES} active={category} onChange={setCategory} />
                </View>

                {/* Section title */}
                <View style={s.secHead}>
                    <Text style={s.secTitle}>CLASES DE HOY</Text>
                    <Text style={s.secCount}>{filtered.length} disponibles</Text>
                </View>

                {/* List */}
                {filtered.length === 0 ? (
                    <ReservationEmptyState
                        icon="search-outline"
                        title="Sin resultados"
                        message="No encontramos clases con esos filtros. Prueba otra categoría o búsqueda."
                        actionLabel="Ver todas"
                        onAction={() => {
                            setQuery('');
                            setCategory('Todas');
                        }}
                    />
                ) : (
                    <View style={[s.px, { gap: 12 }]}>
                        {filtered.map((c) => (
                            <ReservationClassCard
                                key={c.id}
                                data={c}
                                onPress={() => goToClass(c.id)}
                                onReserve={() => goToClass(c.id)}
                                onWaitlist={() => router.push('/(reservations)/waitlist')}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const s = StyleSheet.create({
    root: { flex: 1, backgroundColor: T.bg },
    scroll: { paddingBottom: 28 },
    px: { paddingHorizontal: 20 },

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
    subtitle: { fontSize: 13, color: T.muted, marginTop: 4 },

    shortcutRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingBottom: 16 },
    shortcut: {
        flex: 1,
        backgroundColor: T.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: T.border,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        gap: 7,
    },
    shortcutIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
    shortcutLabel: { fontSize: 11, fontWeight: '700', color: T.white, textAlign: 'center' },

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

    filterWrap: { paddingTop: 14 },

    secHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 12,
    },
    secTitle: { fontSize: 12, fontWeight: '800', color: T.white, letterSpacing: 1.5, textTransform: 'uppercase' },
    secCount: { fontSize: 11, fontWeight: '700', color: T.muted },
});
