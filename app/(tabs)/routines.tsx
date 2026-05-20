import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';

// ── Types & data ─────────────────────────────────────────────────────────────

type Routine = {
  name: string;
  sub: string;
  exs: number;
  dur: number;
  pct: number;
  day: string;
  diff: string;
  accent: string;
};

const ROUTINES: Routine[] = [
  { name: 'PECHO & TRÍCEPS',  sub: 'Push Day',         exs: 6,  dur: 55, pct: 40,  day: 'LUNES',     diff: 'AVANZADO',   accent: T.orange  },
  { name: 'ESPALDA & BÍCEPS', sub: 'Pull Day',          exs: 7,  dur: 60, pct: 0,   day: 'MARTES',    diff: 'AVANZADO',   accent: T.blue    },
  { name: 'PIERNAS',          sub: 'Leg Day',           exs: 8,  dur: 70, pct: 100, day: 'MIÉRCOLES', diff: 'INTENSO',    accent: T.green   },
  { name: 'HOMBROS',          sub: 'Shoulder Day',      exs: 5,  dur: 45, pct: 0,   day: 'JUEVES',    diff: 'INTERMEDIO', accent: T.purple  },
  { name: 'FULL BODY HIIT',   sub: 'High Intensity',    exs: 10, dur: 40, pct: 40,  day: 'VIERNES',   diff: 'INTENSO',    accent: T.yellow  },
  { name: 'DESCANSO ACTIVO',  sub: 'Active Recovery',   exs: 4,  dur: 30, pct: 0,   day: 'SÁBADO',    diff: 'LIGERO',     accent: '#64D2FF' },
  { name: 'DESCANSO',         sub: 'Rest Day',          exs: 0,  dur: 0,  pct: 0,   day: 'DOMINGO',   diff: 'REST',       accent: T.muted   },
];

const DAY_LETTERS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// ── Helpers ───────────────────────────────────────────────────────────────────

const Bar = ({ pct, color = T.yellow, h = 4 }: { pct: number; color?: string; h?: number }) => (
  <View style={{ backgroundColor: T.card3, height: h, borderRadius: h, overflow: 'hidden' }}>
    <View style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', backgroundColor: color }} />
  </View>
);

const Pill = ({ label, bg = T.yellow, fg = T.bg, sm }: {
  label: string; bg?: string; fg?: string; sm?: boolean;
}) => (
  <View style={{ backgroundColor: bg, borderRadius: 5, paddingHorizontal: sm ? 6 : 8, paddingVertical: sm ? 2 : 3, alignSelf: 'flex-start' }}>
    <Text style={{ color: fg, fontSize: sm ? 9 : 10, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' }}>{label}</Text>
  </View>
);

// ── Screen ────────────────────────────────────────────────────────────────────

export default function RoutinesScreen() {
  const [selDay, setSelDay] = useState(0);
  const completed = ROUTINES.filter(r => r.pct === 100).length;

  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.eyebrow}>SEMANA ACTUAL</Text>
          <Text style={s.title}>MIS RUTINAS</Text>
        </View>

        {/* Week overview */}
        <View style={s.px}>
          <View style={s.weekCard}>
            <View style={s.weekTopRow}>
              <Text style={s.weekLabel}>PROGRESO SEMANAL</Text>
              <Text style={s.weekCount}>{completed}/5 COMPLETADOS</Text>
            </View>
            <Bar pct={(completed / 5) * 100} h={5} />

            {/* Day buttons */}
            <View style={s.dayRow}>
              {DAY_LETTERS.map((d, i) => {
                const r = ROUTINES[i];
                const isDone  = r.pct === 100;
                const isToday = i === 0;
                const isRest  = r.diff === 'REST';
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setSelDay(i)}
                    style={[
                      s.dayBtn,
                      isDone  && s.dayBtnDone,
                      isToday && !isDone && s.dayBtnToday,
                      selDay === i && !isDone && s.dayBtnSel,
                    ]}
                    activeOpacity={0.7}>
                    <Text style={[s.dayLetter, isDone && s.dayLetterDone, isToday && !isDone && s.dayLetterToday]}>
                      {d}
                    </Text>
                    {!isRest && (
                      <View style={[
                        s.dayDot,
                        { backgroundColor: isDone ? T.bg : (r.pct > 0 ? T.yellow : T.card3) },
                      ]} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Routine list */}
        <View style={s.secHead}>
          <Text style={s.secTitle}>ESTA SEMANA</Text>
        </View>
        <View style={[s.px, { gap: 10 }]}>
          {ROUTINES.map((r, i) => (
            <View key={i} style={[s.routineCard, r.pct === 100 && { borderColor: r.accent + '44' }]}>
              {/* Accent top bar */}
              <View style={{ height: 3, backgroundColor: r.pct > 0 ? r.accent : T.border, borderRadius: 2 }} />

              <View style={s.routineInner}>
                <View style={{ flex: 1 }}>
                  {/* Day + difficulty */}
                  <View style={s.routineTopRow}>
                    <Text style={s.routineDayLabel}>{r.day}</Text>
                    <Pill
                      label={r.diff}
                      bg={r.diff === 'REST' ? T.card2 : r.accent + '22'}
                      fg={r.diff === 'REST' ? T.muted : r.accent}
                      sm
                    />
                  </View>
                  <Text style={s.routineName}>{r.name}</Text>
                  <Text style={s.routineSub}>{r.sub}</Text>
                </View>

                {/* Action */}
                {r.pct === 100 ? (
                  <View style={[s.doneCircle, { backgroundColor: r.accent }]}>
                    <Ionicons name="checkmark" size={14} color={T.bg} />
                  </View>
                ) : r.exs > 0 ? (
                  <TouchableOpacity style={s.startBtn} activeOpacity={0.8}>
                    <Text style={s.startBtnText}>INICIAR</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Progress bar */}
              {r.exs > 0 && (
                <View style={s.routineProgress}>
                  <View style={s.routineProgressRow}>
                    <Text style={s.routineProgressMeta}>{r.exs} ejercicios · {r.dur} min</Text>
                    <Text style={[s.routineProgressPct, { color: r.pct > 0 ? r.accent : T.muted }]}>{r.pct}%</Text>
                  </View>
                  <Bar pct={r.pct} color={r.accent} h={3} />
                </View>
              )}
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: T.bg },
  scroll:  { paddingBottom: 28 },
  px:      { paddingHorizontal: 20 },

  header:  { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 14 },
  eyebrow: { fontSize: 11, color: T.muted, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  title:   { fontSize: 24, fontWeight: '900', color: T.white },

  // Week card
  weekCard:     { backgroundColor: T.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border },
  weekTopRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  weekLabel:    { fontSize: 11, fontWeight: '700', color: T.muted, letterSpacing: 0.5, textTransform: 'uppercase' },
  weekCount:    { fontSize: 11, fontWeight: '800', color: T.yellow },
  dayRow:       { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 4 },
  dayBtn:       { flex: 1, height: 40, borderRadius: 10, backgroundColor: T.card2, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dayBtnDone:   { backgroundColor: T.yellow },
  dayBtnToday:  { backgroundColor: T.yellowDim, borderWidth: 1, borderColor: T.yellowBdr },
  dayBtnSel:    { borderWidth: 1, borderColor: T.muted },
  dayLetter:    { fontSize: 10, fontWeight: '800', color: T.muted, letterSpacing: 0.3 },
  dayLetterDone:  { color: T.bg },
  dayLetterToday: { color: T.yellow },
  dayDot:       { width: 4, height: 4, borderRadius: 2 },

  // Section head
  secHead:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  secTitle: { fontSize: 12, fontWeight: '800', color: T.white, letterSpacing: 1.5, textTransform: 'uppercase' },

  // Routine card
  routineCard:      { backgroundColor: T.card, borderRadius: 16, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },
  routineInner:     { flexDirection: 'row', alignItems: 'flex-start', padding: 14, paddingBottom: 10 },
  routineTopRow:    { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 4 },
  routineDayLabel:  { fontSize: 9, color: T.muted, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  routineName:      { fontSize: 15, fontWeight: '800', color: T.white, letterSpacing: -0.2 },
  routineSub:       { fontSize: 11, color: T.muted, marginTop: 2 },
  doneCircle:       { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  startBtn:         { backgroundColor: T.yellowDim, borderWidth: 1, borderColor: T.yellowBdr, borderRadius: 9, paddingVertical: 7, paddingHorizontal: 12 },
  startBtnText:     { color: T.yellow, fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  routineProgress:     { paddingHorizontal: 14, paddingBottom: 12 },
  routineProgressRow:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  routineProgressMeta: { fontSize: 10, color: T.muted, fontWeight: '600' },
  routineProgressPct:  { fontSize: 10, fontWeight: '800' },
});
