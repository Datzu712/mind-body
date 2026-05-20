import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';

// ── Types ─────────────────────────────────────────────────────────────────────

type Exercise = {
  nm: string;
  ms: string;
  sets: string;
  reps: string;
  lv: string;
  ac: string;
  em: string;
};

type CategoryId = 'fuerza' | 'cardio' | 'flexibilidad';

// ── Data ─────────────────────────────────────────────────────────────────────

const CATEGORIES: { id: CategoryId; label: string; icon: string }[] = [
  { id: 'fuerza',       label: 'FUERZA',  icon: '🏋️' },
  { id: 'cardio',       label: 'CARDIO',  icon: '🏃' },
  { id: 'flexibilidad', label: 'FLEXIB.', icon: '🧘' },
];

const EXERCISES: Record<CategoryId, Exercise[]> = {
  fuerza: [
    { nm: 'Press de Banca',      ms: 'Pecho',        sets: '4', reps: '10',   lv: 'AVANZADO',   ac: T.orange, em: '🏋️' },
    { nm: 'Peso Muerto',         ms: 'Espalda baja', sets: '4', reps: '6',    lv: 'AVANZADO',   ac: T.red,    em: '⚡' },
    { nm: 'Sentadilla',          ms: 'Cuádriceps',   sets: '4', reps: '8',    lv: 'AVANZADO',   ac: '#FF9500',em: '🔥' },
    { nm: 'Press Militar',       ms: 'Hombros',      sets: '3', reps: '10',   lv: 'INTERMEDIO', ac: T.purple, em: '💥' },
    { nm: 'Dominadas',           ms: 'Espalda',      sets: '3', reps: 'Máx.', lv: 'AVANZADO',   ac: T.blue,   em: '🎯' },
    { nm: 'Fondos en Paralelas', ms: 'Tríceps',      sets: '3', reps: '12',   lv: 'INTERMEDIO', ac: T.green,  em: '✊' },
  ],
  cardio: [
    { nm: 'Carrera HIIT',    ms: 'Full Body', sets: '8', reps: '30s',  lv: 'INTENSO',  ac: T.yellow,  em: '🏃' },
    { nm: 'Salto de Cuerda', ms: 'Cardio',    sets: '5', reps: '2min', lv: 'MODERADO', ac: T.orange,  em: '⚡' },
    { nm: 'Box Jumps',       ms: 'Piernas',   sets: '4', reps: '15',   lv: 'INTENSO',  ac: T.red,     em: '🦘' },
    { nm: 'Burpees',         ms: 'Full Body', sets: '4', reps: '20',   lv: 'INTENSO',  ac: '#FF9500', em: '🔥' },
    { nm: 'Ciclismo Indoor', ms: 'Cardio',    sets: '1', reps: '45min',lv: 'MODERADO', ac: T.green,   em: '🚴' },
  ],
  flexibilidad: [
    { nm: 'Hip Flexor Stretch', ms: 'Caderas', sets: '3', reps: '60s', lv: 'BÁSICO',   ac: '#64D2FF', em: '🧘' },
    { nm: 'Isquiotibiales',     ms: 'Piernas', sets: '3', reps: '45s', lv: 'BÁSICO',   ac: T.green,   em: '🌊' },
    { nm: 'Movilidad Hombros',  ms: 'Hombros', sets: '3', reps: '30s', lv: 'BÁSICO',   ac: T.purple,  em: '🌀' },
    { nm: 'Cat-Cow',            ms: 'Columna', sets: '2', reps: '20',  lv: 'BÁSICO',   ac: '#FF9500', em: '🐱' },
    { nm: 'Pigeon Pose',        ms: 'Glúteos', sets: '2', reps: '90s', lv: 'MODERADO', ac: T.blue,    em: '🕊️' },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

const Pill = ({ label, bg = T.yellow, fg = T.bg, sm }: {
  label: string; bg?: string; fg?: string; sm?: boolean;
}) => (
  <View style={{ backgroundColor: bg, borderRadius: 5, paddingHorizontal: sm ? 6 : 8, paddingVertical: sm ? 2 : 3, alignSelf: 'flex-start' }}>
    <Text style={{ color: fg, fontSize: sm ? 9 : 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</Text>
  </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────

export default function WorkoutsScreen() {
  const [cat, setCat] = useState<CategoryId>('fuerza');
  const list = EXERCISES[cat];

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.eyebrow}>CATÁLOGO</Text>
          <Text style={s.title}>EJERCICIOS</Text>
        </View>

        {/* Search bar (visual) */}
        <View style={s.px}>
          <View style={s.searchBar}>
            <Ionicons name="search" size={15} color={T.muted} />
            <Text style={s.searchPlaceholder}>Buscar ejercicio...</Text>
          </View>
        </View>

        {/* Category tabs */}
        <View style={s.catRow}>
          {CATEGORIES.map(c => {
            const active = cat === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[s.catTab, active && s.catTabActive]}
                onPress={() => setCat(c.id)}
                activeOpacity={0.75}>
                <Text style={s.catIcon}>{c.icon}</Text>
                <Text style={[s.catLabel, active && s.catLabelActive]}>{c.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Exercise list */}
        <View style={[s.px, { gap: 10 }]}>
          {list.map((ex, i) => (
            <TouchableOpacity key={`${cat}-${i}`} style={s.exCard} activeOpacity={0.8}>
              {/* Emoji icon */}
              <View style={[s.exIcon, { backgroundColor: ex.ac + '22', borderColor: ex.ac + '44' }]}>
                <Text style={{ fontSize: 22 }}>{ex.em}</Text>
              </View>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <View style={s.exTopRow}>
                  <Text style={s.exName} numberOfLines={1}>{ex.nm}</Text>
                  <Pill label={ex.lv} bg={ex.ac + '22'} fg={ex.ac} sm />
                </View>
                <Text style={s.exMuscle}>{ex.ms}</Text>

                {/* Sets / Reps chips */}
                <View style={s.chipsRow}>
                  {[['SERIES', ex.sets], ['REPS', ex.reps]].map(([lbl, val], j) => (
                    <View key={j} style={s.chip}>
                      <Text style={s.chipLabel}>{lbl}</Text>
                      <Text style={s.chipVal}>{val}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <Ionicons name="chevron-forward" size={16} color={T.muted} />
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: T.bg },
  scroll: { paddingBottom: 28 },
  px:     { paddingHorizontal: 20 },

  header:  { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },
  eyebrow: { fontSize: 11, color: T.muted, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  title:   { fontSize: 24, fontWeight: '900', color: T.white },

  searchBar:         { backgroundColor: T.card, borderRadius: 12, borderWidth: 1, borderColor: T.border, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 14 },
  searchPlaceholder: { fontSize: 13, color: T.muted, fontWeight: '500' },

  catRow:       { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 14 },
  catTab:       { flex: 1, backgroundColor: T.card, borderRadius: 10, paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: T.border, gap: 4 },
  catTabActive: { backgroundColor: T.yellow, borderColor: T.yellow },
  catIcon:      { fontSize: 14 },
  catLabel:     { fontSize: 10, fontWeight: '800', color: T.muted, letterSpacing: 0.3, textTransform: 'uppercase' },
  catLabelActive: { color: T.bg },

  exCard:    { backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.border, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  exIcon:    { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  exTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  exName:    { flex: 1, fontSize: 13, fontWeight: '700', color: T.white, marginRight: 8 },
  exMuscle:  { fontSize: 11, color: T.muted, marginBottom: 8 },
  chipsRow:  { flexDirection: 'row', gap: 7 },
  chip:      { backgroundColor: T.card2, borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 5 },
  chipLabel: { fontSize: 9, color: T.muted, fontWeight: '700', textTransform: 'uppercase' },
  chipVal:   { fontSize: 13, color: T.yellow, fontWeight: '900' },
});
