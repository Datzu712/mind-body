import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import { useHealthData } from '@/hooks/use-health-data';
import { progressStyles as ps } from './shared-styles';

const Bar = ({ pct, color = T.yellow, h = 5 }: { pct: number; color?: string; h?: number }) => (
    <View style={{ backgroundColor: T.card3, height: h, borderRadius: h, overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(100, Math.max(0, pct))}%`, height: '100%', backgroundColor: color }} />
    </View>
);

function fmtNum(v: number): string {
    if (v >= 10000) return `${(v / 1000).toFixed(1)}k`;
    if (v >= 1000) return v.toLocaleString();
    return String(v);
}

export function ResumenTab() {
    const hd = useHealthData();

    if (hd.isLoading) {
        return (
            <View style={ps.loading}>
                <ActivityIndicator size="large" color={T.yellow} />
            </View>
        );
    }

    const bigStats = [
        {
            lbl: 'CAL. QUEMADAS',
            val: fmtNum(hd.caloriesWeek),
            sub: 'esta semana',
            ic: 'flame-outline' as const,
            ac: T.orange,
        },
        {
            lbl: 'ENTRENOS',
            val: String(hd.exercisesMonth),
            sub: 'este mes',
            ic: 'barbell-outline' as const,
            ac: T.yellow,
        },
        {
            lbl: 'RACHA ACTUAL',
            val: `${hd.currentStreak} d`,
            sub: 'seguidos',
            ic: 'flash-outline' as const,
            ac: T.green,
        },
        { lbl: 'MEJOR RACHA', val: `${hd.bestStreak} d`, sub: 'récord', ic: 'trophy-outline' as const, ac: T.purple },
    ];

    const goals = [
        { lbl: 'PASOS HOY', cur: hd.stepsToday, max: 10000, ac: T.yellow, ic: 'footsteps-outline' as const },
        { lbl: 'ENTRENAMIENTOS', cur: hd.exercisesWeek, max: 5, ac: T.orange, ic: 'barbell-outline' as const },
        { lbl: 'MIN ACTIVOS', cur: hd.activeMinutesWeek, max: 300, ac: T.green, ic: 'timer-outline' as const },
    ];

    return (
        <>
            <View style={[ps.px, s.stepsHeader]}>
                <Ionicons name="footsteps-outline" size={28} color={T.yellow} />
                <View>
                    <Text style={s.stepsVal}>{hd.stepsToday.toLocaleString()}</Text>
                    <Text style={s.stepsLbl}>pasos hoy</Text>
                </View>
            </View>

            <View style={[ps.px, s.grid]}>
                {bigStats.map((st, i) => (
                    <View key={i} style={s.statCard}>
                        <Ionicons name={st.ic} size={20} color={st.ac} style={{ marginBottom: 6 }} />
                        <Text style={[s.statVal, { color: st.ac }]}>{st.val}</Text>
                        <Text style={s.statLbl}>{st.lbl}</Text>
                        <Text style={s.statSub}>{st.sub}</Text>
                    </View>
                ))}
            </View>

            <Text style={ps.secTitle}>METAS SEMANALES</Text>
            <View style={[ps.px, { gap: 10 }]}>
                {goals.map((g, i) => (
                    <View key={i} style={s.goalCard}>
                        <View style={s.goalTopRow}>
                            <View style={s.goalLeft}>
                                <Ionicons name={g.ic} size={18} color={g.ac} />
                                <Text style={s.goalLbl}>{g.lbl}</Text>
                            </View>
                            <Text style={[s.goalVal, { color: g.ac }]}>
                                {fmtNum(g.cur)}
                                <Text style={s.goalMax}>/{fmtNum(g.max)}</Text>
                            </Text>
                        </View>
                        <Bar pct={g.max > 0 ? (g.cur / g.max) * 100 : 0} color={g.ac} />
                        <Text style={s.goalPct}>{g.max > 0 ? Math.round((g.cur / g.max) * 100) : 0}% completado</Text>
                    </View>
                ))}
            </View>
        </>
    );
}

const s = StyleSheet.create({
    stepsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        marginBottom: 16,
    },
    stepsVal: { fontSize: 32, fontWeight: '900', color: T.white },
    stepsLbl: { fontSize: 12, color: T.muted, fontWeight: '600', textTransform: 'uppercase' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    statCard: {
        width: '48%',
        backgroundColor: T.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
    },
    statVal: { fontSize: 22, fontWeight: '900', lineHeight: 24 },
    statLbl: {
        fontSize: 9,
        color: T.muted,
        fontWeight: '700',
        marginTop: 5,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    statSub: { fontSize: 10, color: T.muted, marginTop: 1 },
    goalCard: { backgroundColor: T.card, borderRadius: 14, borderWidth: 1, borderColor: T.border, padding: 14 },
    goalTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    goalLeft: { flexDirection: 'row', gap: 8, alignItems: 'center' },
    goalLbl: { fontSize: 11, fontWeight: '700', color: T.white, letterSpacing: 0.3, textTransform: 'uppercase' },
    goalVal: { fontSize: 14, fontWeight: '900' },
    goalMax: { fontSize: 10, color: T.muted, fontWeight: '600' },
    goalPct: { fontSize: 10, color: T.muted, fontWeight: '600', marginTop: 6, textTransform: 'uppercase' },
});
