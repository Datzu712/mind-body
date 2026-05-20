import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FitColors as T } from '@/constants/theme';

// ── Helpers ───────────────────────────────────────────────────────────────────

const Bar = ({ pct, color = T.yellow, h = 4 }: { pct: number; color?: string; h?: number }) => (
  <View style={{ backgroundColor: T.card3, height: h, borderRadius: h, overflow: 'hidden' }}>
    <View style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', backgroundColor: color }} />
  </View>
);

const SectionHead = ({ title }: { title: string }) => (
  <View style={s.secHead}>
    <Text style={s.secTitle}>{title}</Text>
  </View>
);

function fmtNum(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v);
}

// ── Data ─────────────────────────────────────────────────────────────────────

const BIG_STATS = [
  { lbl: 'CAL. QUEMADAS',  val: '3,840', sub: 'esta semana', ic: '🔥', ac: T.orange  },
  { lbl: 'ENTRENOS',       val: '12',    sub: 'este mes',    ic: '💪', ac: T.yellow  },
  { lbl: 'RACHA ACTUAL',   val: '8 d',   sub: 'seguidos',    ic: '⚡', ac: T.green   },
  { lbl: 'MEJOR RACHA',    val: '21 d',  sub: 'récord',      ic: '🏆', ac: T.purple  },
];

const WEEK_CALS  = [2100, 2800, 1900, 3200, 2600, 3400, 2140];
const WEEK_LBLS  = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'];
const MAX_CAL    = Math.max(...WEEK_CALS);

const GOALS = [
  { lbl: 'ENTRENAMIENTOS', cur: 4,    max: 5,    ac: T.yellow, ic: '💪' },
  { lbl: 'CALORÍAS',       cur: 3840, max: 5000, ac: T.orange, ic: '🔥' },
  { lbl: 'MIN ACTIVOS',    cur: 240,  max: 300,  ac: T.green,  ic: '⏱' },
];

// 1 = workout, 2 = active rest, 0 = rest
const ACTIVITY = [1,1,0,1,1,2,0,1,1,0,1,1,2,0,1,0,1,1,2,0,1,1,1];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  return (
    <SafeAreaView style={s.root} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.eyebrow}>TU EVOLUCIÓN</Text>
          <Text style={s.title}>PROGRESO</Text>
        </View>

        {/* Big stats 2×2 grid */}
        <View style={[s.px, s.grid]}>
          {BIG_STATS.map((st, i) => (
            <View key={i} style={s.statCard}>
              <Text style={s.statIc}>{st.ic}</Text>
              <Text style={[s.statVal, { color: st.ac }]}>{st.val}</Text>
              <Text style={s.statLbl}>{st.lbl}</Text>
              <Text style={s.statSub}>{st.sub}</Text>
            </View>
          ))}
        </View>

        {/* Weekly calories chart */}
        <SectionHead title="CALORÍAS POR SEMANA" />
        <View style={s.px}>
          <View style={s.chartCard}>
            <View style={s.chartBars}>
              {WEEK_CALS.map((v, i) => {
                const h   = Math.round((v / MAX_CAL) * 72);
                const now = i === WEEK_CALS.length - 1;
                return (
                  <View key={i} style={s.chartCol}>
                    <View style={[
                      s.bar,
                      { height: h, backgroundColor: now ? T.yellow : T.yellowDim, borderWidth: now ? 0 : 1, borderColor: T.yellowBdr },
                    ]} />
                    <Text style={[s.barLabel, now && { color: T.yellow }]}>{WEEK_LBLS[i]}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Weekly goals */}
        <SectionHead title="METAS SEMANALES" />
        <View style={[s.px, { gap: 10 }]}>
          {GOALS.map((g, i) => (
            <View key={i} style={s.goalCard}>
              <View style={s.goalTopRow}>
                <View style={s.goalLeft}>
                  <Text style={s.goalIc}>{g.ic}</Text>
                  <Text style={s.goalLbl}>{g.lbl}</Text>
                </View>
                <Text style={[s.goalVal, { color: g.ac }]}>
                  {fmtNum(g.cur)}
                  <Text style={s.goalMax}>/{fmtNum(g.max)}</Text>
                </Text>
              </View>
              <Bar pct={(g.cur / g.max) * 100} color={g.ac} h={5} />
              <Text style={s.goalPct}>{Math.round((g.cur / g.max) * 100)}% COMPLETADO</Text>
            </View>
          ))}
        </View>

        {/* Activity calendar */}
        <SectionHead title="ACTIVIDAD DEL MES" />
        <View style={s.px}>
          <View style={s.calCard}>
            <View style={s.calGrid}>
              {ACTIVITY.map((tp, i) => (
                <View key={i} style={[
                  s.calDot,
                  tp === 0 && s.calDotRest,
                  tp === 1 && s.calDotActive,
                  tp === 2 && s.calDotLight,
                ]}>
                  <Text style={[
                    s.calDotNum,
                    tp === 1 && { color: T.bg },
                    tp === 2 && { color: T.yellow },
                    tp === 0 && { color: T.card3 },
                  ]}>{i + 1}</Text>
                </View>
              ))}
            </View>

            {/* Legend */}
            <View style={s.legend}>
              {[
                [T.yellow + 'BB', T.yellow + 'BB', 'Entreno'],
                [T.yellowDim, T.yellowBdr, 'Activo'],
                [T.card2, T.border, 'Descanso'],
              ].map(([bg, bd, lbl], i) => (
                <View key={i} style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: bg, borderColor: bd }]} />
                  <Text style={s.legendLbl}>{lbl}</Text>
                </View>
              ))}
            </View>
          </View>
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

  secHead: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  secTitle:{ fontSize: 12, fontWeight: '800', color: T.white, letterSpacing: 1.5, textTransform: 'uppercase' },

  // 2×2 grid
  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.border, padding: 14 },
  statIc:   { fontSize: 20, marginBottom: 6 },
  statVal:  { fontSize: 22, fontWeight: '900', lineHeight: 24 },
  statLbl:  { fontSize: 9, color: T.muted, fontWeight: '700', marginTop: 5, letterSpacing: 0.5, textTransform: 'uppercase' },
  statSub:  { fontSize: 10, color: T.muted, marginTop: 1 },

  // Chart
  chartCard: { backgroundColor: T.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: T.border },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 88 },
  chartCol:  { flex: 1, alignItems: 'center', gap: 6 },
  bar:       { width: '100%', borderRadius: 4, minHeight: 4 },
  barLabel:  { fontSize: 9, color: T.muted, fontWeight: '700' },

  // Goals
  goalCard:    { backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.border, padding: 14 },
  goalTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  goalLeft:    { flexDirection: 'row', gap: 8, alignItems: 'center' },
  goalIc:      { fontSize: 18 },
  goalLbl:     { fontSize: 11, fontWeight: '700', color: T.white, letterSpacing: 0.3, textTransform: 'uppercase' },
  goalVal:     { fontSize: 14, fontWeight: '900' },
  goalMax:     { fontSize: 10, color: T.muted, fontWeight: '600' },
  goalPct:     { fontSize: 10, color: T.muted, fontWeight: '600', marginTop: 6, textTransform: 'uppercase' },

  // Calendar
  calCard:  { backgroundColor: T.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: T.border },
  calGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  calDot:   { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  calDotRest:   { backgroundColor: T.card2, borderWidth: 1, borderColor: T.border },
  calDotActive: { backgroundColor: T.yellow + 'BB' },
  calDotLight:  { backgroundColor: T.yellowDim, borderWidth: 1, borderColor: T.yellowBdr },
  calDotNum:    { fontSize: 9, fontWeight: '800' },
  legend:       { flexDirection: 'row', gap: 12, marginTop: 12 },
  legendItem:   { flexDirection: 'row', gap: 5, alignItems: 'center' },
  legendDot:    { width: 10, height: 10, borderRadius: 3, borderWidth: 1 },
  legendLbl:    { fontSize: 10, color: T.muted, fontWeight: '600' },
});
