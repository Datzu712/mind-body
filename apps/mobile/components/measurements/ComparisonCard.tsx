import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import { useMeasurementSummary } from '@/hooks/use-measurements';
import { METRICS, shortDate, deltaColor, deltaIcon } from './constants';

export function ComparisonCard() {
    const { data: summary } = useMeasurementSummary();
    if (!summary || !summary.first || !summary.latest || summary.totalRecords < 2) return null;

    return (
        <View style={s.card}>
            <Text style={s.title}>EVOLUCIÓN</Text>
            <View style={s.headerRow}>
                <View style={s.col}>
                    <Text style={s.dateLabel}>PRIMERA</Text>
                    <Text style={s.date}>{shortDate(summary.first.measuredAt)}</Text>
                </View>
                <View style={s.col}>
                    <Text style={s.dateLabel}>ÚLTIMA</Text>
                    <Text style={s.date}>{shortDate(summary.latest.measuredAt)}</Text>
                </View>
                <View style={s.col}>
                    <Text style={s.dateLabel}>CAMBIO</Text>
                </View>
            </View>
            {METRICS.map((m) => {
                const firstVal = summary.first![m.key];
                const latestVal = summary.latest![m.key];
                const variation = summary.variations[m.key];
                return (
                    <View key={m.key} style={s.metricRow}>
                        <View style={s.col}>
                            <Text style={s.val}>{firstVal != null ? `${firstVal} ${m.unit}` : '—'}</Text>
                        </View>
                        <View style={s.col}>
                            <Text style={s.val}>{latestVal != null ? `${latestVal} ${m.unit}` : '—'}</Text>
                        </View>
                        <View style={[s.col, s.deltaCol]}>
                            <Ionicons
                                name={deltaIcon(variation, m.key)}
                                size={12}
                                color={deltaColor(variation, m.key)}
                            />
                            <Text style={[s.delta, { color: deltaColor(variation, m.key) }]}>
                                {variation != null ? `${variation > 0 ? '+' : ''}${variation} ${m.unit}` : '—'}
                            </Text>
                        </View>
                    </View>
                );
            })}
            <Text style={s.footer}>{summary.totalRecords} mediciones registradas</Text>
        </View>
    );
}

const s = StyleSheet.create({
    card: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 16,
        marginBottom: 20,
    },
    title: { fontSize: 11, fontWeight: '800', color: T.yellow, letterSpacing: 1, marginBottom: 12 },
    headerRow: {
        flexDirection: 'row',
        marginBottom: 8,
        paddingBottom: 8,
        borderBottomWidth: 1,
        borderBottomColor: T.border,
    },
    col: { flex: 1, alignItems: 'center' },
    dateLabel: { fontSize: 9, fontWeight: '700', color: T.muted, letterSpacing: 0.5 },
    date: { fontSize: 11, fontWeight: '700', color: T.white, marginTop: 2 },
    metricRow: {
        flexDirection: 'row',
        paddingVertical: 6,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: T.border,
    },
    val: { fontSize: 12, fontWeight: '600', color: T.white },
    deltaCol: { flexDirection: 'row', gap: 3, justifyContent: 'center' },
    delta: { fontSize: 12, fontWeight: '700' },
    footer: { fontSize: 10, color: T.muted, textAlign: 'center', marginTop: 10 },
});
