import { FitColors as T } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Shared micro-components ──────────────────────────────────────────────────

const Pill = ({
  label,
  bg = T.yellow,
  fg = T.bg,
  sm,
}: {
  label: string;
  bg?: string;
  fg?: string;
  sm?: boolean;
}) => (
  <View
    style={{
      backgroundColor: bg,
      borderRadius: 5,
      paddingHorizontal: sm ? 6 : 8,
      paddingVertical: sm ? 2 : 3,
      alignSelf: "flex-start",
    }}
  >
    <Text
      style={{
        color: fg,
        fontSize: sm ? 9 : 10,
        fontWeight: "800",
        letterSpacing: 0.4,
        textTransform: "uppercase",
      }}
    >
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

// ── Data ─────────────────────────────────────────────────────────────────────

const todayPlan = [
  { name: "Press de Banca", sets: "4×10", done: true },
  { name: "Press Inclinado DB", sets: "3×12", done: true },
  { name: "Cable Fly", sets: "3×15", done: false },
  { name: "Tricep Pushdown", sets: "4×12", done: false },
  { name: "Skull Crushers", sets: "3×10", done: false },
];

// ── Screen ───────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const done = todayPlan.filter((e) => e.done).length;

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        {/* Header */}
        <View style={s.header}>
          <View style={{ flex: 1 }}>
            <Text style={s.dateLabel}>LUNES, 23 MAR</Text>
            <Text style={s.greeting}>
              {"BUENOS DÍAS,\n"}
              <Text style={{ color: T.yellow }}>JUAN 💪</Text>
            </Text>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>C</Text>
          </View>
        </View>

        {/* Daily stats */}
        <View style={s.statsRow}>
          {(
            [
              { icon: "🔥", val: "2,140", unit: "CAL", ac: T.orange },
              { icon: "⚡", val: "5", unit: "EJERC", ac: T.yellow },
              { icon: "⏱", val: "45", unit: "MIN", ac: T.blue },
            ] as const
          ).map((st, i) => (
            <View key={i} style={s.statCard}>
              <Text style={s.statIcon}>{st.icon}</Text>
              <Text style={[s.statVal, { color: st.ac }]}>{st.val}</Text>
              <Text style={s.statUnit}>{st.unit}</Text>
            </View>
          ))}
        </View>

        {/* Featured workout card */}
        <View style={s.px}>
          <View style={s.featCard}>
            <View style={s.featGlow} pointerEvents="none" />
            <Pill label="WORKOUT DEL DÍA" />
            <Text style={s.featTitle}>{"CHEST\n& TRICEPS"}</Text>
            <Text style={s.featSub}>PUSH DAY · SEMANA A</Text>
            <View style={s.featMetaRow}>
              {(["⚡", "⏱", "🔥"] as const).map((ic, i) => {
                const labels = ["6 EJERCICIOS", "55 MIN", "480 CAL"];
                return (
                  <View key={i} style={s.featMetaItem}>
                    <Text style={s.featMetaIcon}>{ic}</Text>
                    <Text style={s.featMetaText}>{labels[i]}</Text>
                  </View>
                );
              })}
            </View>
            <TouchableOpacity style={s.featBtn} activeOpacity={0.85}>
              <Text style={s.featBtnText}>INICIAR ENTRENAMIENTO →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's plan */}
        <SectionHead
          title="PLAN DE HOY"
          right={`${done}/${todayPlan.length}`}
        />
        <View style={[s.px, { gap: 8 }]}>
          {todayPlan.map((ex, i) => (
            <View key={i} style={[s.exRow, ex.done && s.exRowDone]}>
              <View style={[s.checkCircle, ex.done && s.checkDone]}>
                {ex.done && (
                  <Ionicons name="checkmark" size={12} color={T.bg} />
                )}
              </View>
              <Text
                style={[s.exName, ex.done && s.exNameDone]}
                numberOfLines={1}
              >
                {ex.name}
              </Text>
              <View style={s.setsBadge}>
                <Text style={s.setsText}>{ex.sets}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Streak banner */}
        <View style={[s.px, { marginTop: 14 }]}>
          <View style={s.streakCard}>
            <Text style={s.streakFire}>🔥</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={s.streakLabel}>RACHA ACTIVA</Text>
              <Text style={s.streakVal}>8 DÍAS SEGUIDOS</Text>
            </View>
            <Pill label="RÉCORD" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scroll: { paddingBottom: 28 },
  px: { paddingHorizontal: 20 },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 6,
  },
  dateLabel: {
    fontSize: 11,
    color: T.muted,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  greeting: { fontSize: 23, fontWeight: "900", color: T.white, lineHeight: 28 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: T.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { fontSize: 20, fontWeight: "900", color: T.bg },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    marginTop: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: T.card,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: T.border,
  },
  statIcon: { fontSize: 18, marginBottom: 4 },
  statVal: { fontSize: 20, fontWeight: "900", lineHeight: 22 },
  statUnit: {
    fontSize: 9,
    color: T.muted,
    fontWeight: "700",
    marginTop: 3,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  featCard: {
    backgroundColor: "#1a1400",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: T.yellowBdr,
    overflow: "hidden",
    marginTop: 14,
  },
  featGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(255,214,0,0.07)",
  },
  featTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: T.white,
    marginTop: 10,
    lineHeight: 30,
    textTransform: "uppercase",
    letterSpacing: -1,
  },
  featSub: {
    color: T.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 6,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  featMetaRow: { flexDirection: "row", gap: 14, marginTop: 14 },
  featMetaItem: { flexDirection: "row", gap: 4, alignItems: "center" },
  featMetaIcon: { fontSize: 11 },
  featMetaText: { fontSize: 10, color: T.muted, fontWeight: "700" },
  featBtn: {
    backgroundColor: T.yellow,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 20,
    marginTop: 16,
    alignSelf: "flex-start",
  },
  featBtnText: {
    color: T.bg,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  secHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  secTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: T.white,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  secRight: { fontSize: 11, fontWeight: "700", color: T.yellow },

  exRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: T.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: T.border,
  },
  exRowDone: { borderColor: T.yellowBdr, opacity: 0.75 },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 7,
    backgroundColor: T.card2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: { backgroundColor: T.yellow },
  exName: { flex: 1, fontSize: 13, fontWeight: "600", color: T.white },
  exNameDone: { color: T.muted, textDecorationLine: "line-through" },
  setsBadge: {
    backgroundColor: T.yellowDim,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  setsText: { fontSize: 11, fontWeight: "800", color: T.yellow },

  streakCard: {
    backgroundColor: T.yellowDim,
    borderWidth: 1,
    borderColor: T.yellowBdr,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  streakFire: { fontSize: 28 },
  streakLabel: {
    fontSize: 10,
    color: T.yellow,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  streakVal: { fontSize: 18, fontWeight: "900", color: T.white, marginTop: 1 },
});
