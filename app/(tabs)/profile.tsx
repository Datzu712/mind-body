import { FitColors as T } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Types ─────────────────────────────────────────────────────────────────────

type SettingItem =
  | { kind: "link"; ic: string; lbl: string; ac: string }
  | { kind: "toggle"; ic: string; lbl: string; ac: string; on: boolean };

// ── Data ─────────────────────────────────────────────────────────────────────

const USER_STATS = [
  { val: "47", lbl: "ENTRENOS" },
  { val: "89h", lbl: "TIEMPO" },
  { val: "8d", lbl: "RACHA" },
];

const SETTINGS_INITIAL: SettingItem[] = [
  { kind: "link", ic: "👤", lbl: "Información Personal", ac: T.yellow },
  { kind: "link", ic: "🎯", lbl: "Mis Objetivos", ac: T.green },
  { kind: "link", ic: "🔔", lbl: "Notificaciones", ac: "#FF9500" },
  { kind: "link", ic: "🏆", lbl: "Logros y Badges", ac: T.purple },
  { kind: "link", ic: "📊", lbl: "Estadísticas", ac: T.blue },
  { kind: "toggle", ic: "🌙", lbl: "Tema Oscuro", ac: "#64D2FF", on: true },
  { kind: "link", ic: "❓", lbl: "Ayuda y Soporte", ac: T.muted },
  { kind: "link", ic: "⚙️", lbl: "Configuración", ac: T.muted },
];

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const [settings, setSettings] = useState<SettingItem[]>(SETTINGS_INITIAL);

  function toggleSetting(idx: number) {
    setSettings((prev) =>
      prev.map((item, i) =>
        i === idx && item.kind === "toggle" ? { ...item, on: !item.on } : item,
      ),
    );
  }

  return (
    <SafeAreaView style={s.root} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
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
                  <Text style={s.avatarTxt}>C</Text>
                </View>
                <View style={s.onlineDot} />
              </View>

              {/* Name + membership */}
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={s.userName}>Juan Esteban</Text>
                <Text style={s.userEmail}>juan@meddyg.com</Text>
                <View style={s.memberBadge}>
                  <Text style={s.memberIcon}>⭐</Text>
                  <Text style={s.memberText}>GOLD MEMBER</Text>
                </View>
              </View>
            </View>

            {/* Stats row */}
            <View style={s.statsRow}>
              {USER_STATS.map((st, i) => (
                <View
                  key={i}
                  style={[
                    s.statCol,
                    i < USER_STATS.length - 1 && s.statColBorder,
                  ]}
                >
                  <Text style={s.statVal}>{st.val}</Text>
                  <Text style={s.statLbl}>{st.lbl}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Membership card */}
        <View style={[s.px, { marginTop: 12 }]}>
          <View style={s.membershipCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.membershipLabel}>MEMBRESÍA ACTIVA</Text>
              <Text style={s.membershipPlan}>Plan Gold · $29.99/mes</Text>
              <Text style={s.membershipRenewal}>Renueva: 15 Abr 2026</Text>
            </View>
            <TouchableOpacity style={s.manageBtn} activeOpacity={0.8}>
              <Text style={s.manageBtnText}>GESTIONAR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings */}
        <View style={s.secHead}>
          <Text style={s.secTitle}>CONFIGURACIÓN</Text>
        </View>
        <View style={[s.px, { gap: 6 }]}>
          {settings.map((item, i) => (
            <TouchableOpacity
              key={i}
              style={s.settingRow}
              onPress={() =>
                item.kind === "toggle" ? toggleSetting(i) : undefined
              }
              activeOpacity={0.8}
            >
              <View
                style={[s.settingIcon, { backgroundColor: item.ac + "22" }]}
              >
                <Text style={{ fontSize: 16 }}>{item.ic}</Text>
              </View>
              <Text style={s.settingLabel}>{item.lbl}</Text>
              {item.kind === "toggle" ? (
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
          <TouchableOpacity style={s.logoutBtn} activeOpacity={0.8}>
            <Ionicons name="power" size={16} color={T.red} />
            <Text style={s.logoutText}>CERRAR SESIÓN</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.version}>Mind&Body v2.1.0 · MIEMBRO DESDE ENE 2024</Text>
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
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  title: { fontSize: 24, fontWeight: "900", color: T.white },

  // Hero card
  heroCard: {
    backgroundColor: "#1a1400",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: T.yellowBdr,
    overflow: "hidden",
  },
  heroGlow: {
    position: "absolute",
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,214,0,0.08)",
  },
  heroTop: { flexDirection: "row", alignItems: "center" },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 20,
    backgroundColor: T.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { fontSize: 30, fontWeight: "900", color: T.bg },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: T.green,
    borderWidth: 2,
    borderColor: "#1a1400",
  },
  userName: {
    fontSize: 19,
    fontWeight: "900",
    color: T.white,
    marginBottom: 2,
  },
  userEmail: { fontSize: 11, color: T.muted, marginBottom: 9 },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: T.yellow,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  memberIcon: { fontSize: 11 },
  memberText: {
    fontSize: 10,
    fontWeight: "800",
    color: T.bg,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },

  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    marginTop: 18,
    paddingVertical: 12,
  },
  statCol: { flex: 1, alignItems: "center" },
  statColBorder: { borderRightWidth: 1, borderRightColor: T.border },
  statVal: { fontSize: 20, fontWeight: "900", color: T.yellow },
  statLbl: {
    fontSize: 9,
    color: T.muted,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 2,
  },

  // Membership
  membershipCard: {
    backgroundColor: T.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: T.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  membershipLabel: {
    fontSize: 9,
    color: T.muted,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  membershipPlan: { fontSize: 15, fontWeight: "800", color: T.white },
  membershipRenewal: { fontSize: 11, color: T.muted, marginTop: 2 },
  manageBtn: {
    backgroundColor: T.yellowDim,
    borderWidth: 1,
    borderColor: T.yellowBdr,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 13,
  },
  manageBtnText: {
    color: T.yellow,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },

  secHead: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  secTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: T.white,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },

  // Settings
  settingRow: {
    backgroundColor: T.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  settingLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: T.white },

  // Logout
  logoutBtn: {
    borderWidth: 1,
    borderColor: T.red + "44",
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: {
    color: T.red,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  version: {
    textAlign: "center",
    fontSize: 10,
    color: "#2A2A2A",
    paddingTop: 14,
    paddingBottom: 4,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
