import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { FitColors as T } from '@/constants/theme';
import { ReservationFilterChips } from '@/components/reservations/ReservationFilterChips';
import { ReservationClassCard } from '@/components/reservations/ReservationClassCard';
import { ReservationEmptyState } from '@/components/reservations/ReservationEmptyState';
import { useUpcomingSessions } from '@/lib/api/reservations';

export default function ReservationsScreen() {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('Todas');
    const { data: sessions = [], isLoading, isError, refetch } = useUpcomingSessions();

    const goToSession = (id: string) => router.push({ pathname: '/(reservations)/class-detail', params: { id } });

    // Chips dinámicos: 'Todas' + categorías presentes en las sesiones.
    const categories = useMemo(() => {
        const found = [...new Set(sessions.map((s) => s.category).filter((c): c is string => !!c))].sort();
        return ['Todas', ...found];
    }, [sessions]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return sessions.filter((s) => {
            const matchesCat = category === 'Todas' || s.category === category;
            const matchesQuery =
                q.length === 0 || s.name.toLowerCase().includes(q) || s.trainer.toLowerCase().includes(q);
            return matchesCat && matchesQuery;
        });
    }, [sessions, query, category]);

    return (
        <SafeAreaView style={s.root} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
                {/* Header */}
                <View style={s.header}>
                    <View style={s.headerCopy}>
                        <Text style={s.eyebrow}>MÓDULO DE RESERVAS</Text>
                        <Text style={s.title}>RESERVAS</Text>
                        <Text style={s.subtitle}>Busca, filtra y reserva tu clase perfecta.</Text>
                    </View>
                    <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => router.push('/(reservations)/reminders')}
                        accessibilityRole="button"
                        accessibilityLabel="Configurar recordatorios"
                        accessibilityHint="Abre las preferencias de avisos para tus clases"
                        style={s.remindersButton}
                    >
                        <Ionicons name="notifications-outline" size={20} color={T.muted} />
                    </TouchableOpacity>
                </View>

                {/* Acceso a la pantalla de gestión; no simula cambiar el contenido de esta vista. */}
                <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push('/(reservations)/my-reservations')}
                    accessibilityRole="button"
                    accessibilityLabel="Abrir Mis reservas"
                    accessibilityHint="Consulta y gestiona las clases que reservaste"
                    style={s.myReservationsLink}
                >
                    <View style={s.myReservationsIcon}>
                        <Ionicons name="bookmark-outline" size={19} color={T.yellow} />
                    </View>
                    <View style={s.myReservationsCopy}>
                        <Text style={s.myReservationsTitle}>Mis reservas</Text>
                        <Text style={s.myReservationsDescription}>Consulta y gestiona tus clases</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={T.muted} />
                </TouchableOpacity>

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
                    <ReservationFilterChips categories={categories} active={category} onChange={setCategory} />
                </View>

                {/* Section title */}
                <View style={s.secHead}>
                    <Text style={s.secTitle}>PRÓXIMAS CLASES</Text>
                    <Text style={s.secCount}>{filtered.length} disponibles</Text>
                </View>

                {/* List */}
                {isLoading ? (
                    <View style={s.loading}>
                        <ActivityIndicator color={T.yellow} />
                    </View>
                ) : isError ? (
                    <ReservationEmptyState
                        icon="cloud-offline-outline"
                        title="No pudimos cargar las clases"
                        message="Revisa tu conexión e inténtalo de nuevo."
                        actionLabel="Reintentar"
                        onAction={() => void refetch()}
                    />
                ) : filtered.length === 0 ? (
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
                            <ReservationClassCard key={c.id} data={c} onPress={() => goToSession(c.id)} />
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

    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 14,
    },
    headerCopy: { flex: 1 },
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

    remindersButton: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: T.card,
        borderWidth: 1,
        borderColor: T.border,
    },
    myReservationsLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: 20,
        marginBottom: 16,
        minHeight: 60,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: T.border,
        backgroundColor: T.card,
    },
    myReservationsIcon: {
        width: 38,
        height: 38,
        borderRadius: 11,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: T.yellowDim,
        borderWidth: 1,
        borderColor: T.yellowBdr,
    },
    myReservationsCopy: { flex: 1, gap: 2 },
    myReservationsTitle: { fontSize: 14, fontWeight: '800', color: T.white },
    myReservationsDescription: { fontSize: 11, fontWeight: '600', color: T.muted },

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

    loading: { paddingVertical: 40, alignItems: 'center' },
});
