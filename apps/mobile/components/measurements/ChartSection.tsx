import { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { FitColors as T } from '@/constants/theme';
import { useMeasurements } from '@/hooks/use-measurements';
import { METRICS, PERIODS, shortDate, getFromDate, type MetricKey, type PeriodKey } from './constants';

export function ChartSection() {
    const [metric, setMetric] = useState<MetricKey>('weightKg');
    const [period, setPeriod] = useState<PeriodKey>('all');

    const fromDate = getFromDate(period);
    const { data: measurements } = useMeasurements(fromDate);
    const metaInfo = METRICS.find((m) => m.key === metric)!;

    const chartData = useMemo(() => {
        if (!measurements) return [];
        const sorted = [...measurements].sort((a, b) => a.measuredAt.localeCompare(b.measuredAt));
        return sorted
            .filter((m) => m[metric] != null)
            .map((m) => ({
                value: m[metric]!,
                label: shortDate(m.measuredAt),
                dataPointText: `${m[metric]}`,
            }));
    }, [measurements, metric]);

    const hasEnoughData = chartData.length >= 2;

    return (
        <View>
            {/* Metric pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.pills}>
                {METRICS.map((m) => (
                    <Pressable
                        key={m.key}
                        style={[s.pill, metric === m.key && s.pillActive]}
                        onPress={() => setMetric(m.key)}
                    >
                        <Ionicons
                            name={m.icon}
                            size={13}
                            color={metric === m.key ? T.bg : T.muted}
                            style={{ marginRight: 4 }}
                        />
                        <Text style={[s.pillLabel, metric === m.key && s.pillLabelActive]}>{m.label}</Text>
                    </Pressable>
                ))}
            </ScrollView>

            {/* Period pills */}
            <View style={s.periodRow}>
                {PERIODS.map((p) => (
                    <Pressable
                        key={p.key}
                        style={[s.periodBtn, period === p.key && s.periodBtnActive]}
                        onPress={() => setPeriod(p.key)}
                    >
                        <Text style={[s.periodLabel, period === p.key && s.periodLabelActive]}>{p.label}</Text>
                    </Pressable>
                ))}
            </View>

            {/* Chart */}
            {hasEnoughData ? (
                <View style={s.chartCard}>
                    <Text style={s.chartTitle}>
                        {metaInfo.label} ({metaInfo.unit})
                    </Text>
                    <LineChart
                        data={chartData}
                        width={280}
                        height={180}
                        color={T.yellow}
                        dataPointsColor={T.yellow}
                        thickness={2}
                        startFillColor={T.yellow}
                        startOpacity={0.15}
                        endOpacity={0.01}
                        areaChart
                        curved
                        yAxisTextStyle={{ color: T.muted, fontSize: 10 }}
                        xAxisLabelTextStyle={{ color: T.muted, fontSize: 8, width: 50, textAlign: 'center' }}
                        rulesColor={T.border}
                        yAxisColor={T.border}
                        xAxisColor={T.border}
                        backgroundColor={T.card}
                        spacing={50}
                        textShiftY={-8}
                        textColor={T.yellow}
                        textFontSize={9}
                        noOfSections={4}
                        hideDataPoints={false}
                        dataPointsRadius={4}
                    />
                </View>
            ) : (
                <View style={s.chartEmpty}>
                    <Ionicons name="analytics-outline" size={48} color={T.muted} />
                    <Text style={s.chartEmptyTitle}>Datos insuficientes</Text>
                    <Text style={s.chartEmptySub}>
                        Se necesitan al menos 2 mediciones para generar la gráfica de {metaInfo.label.toLowerCase()}.
                    </Text>
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    pills: { gap: 8, marginBottom: 12 },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: T.card,
        borderWidth: 1,
        borderColor: T.border,
    },
    pillActive: { backgroundColor: T.yellow, borderColor: T.yellow },
    pillLabel: { fontSize: 12, fontWeight: '700', color: T.muted },
    pillLabelActive: { color: T.bg },
    periodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    periodBtn: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: T.card,
        borderWidth: 1,
        borderColor: T.border,
    },
    periodBtnActive: { backgroundColor: T.yellowDim, borderColor: T.yellowBdr },
    periodLabel: { fontSize: 12, fontWeight: '700', color: T.muted },
    periodLabelActive: { color: T.yellow },
    chartCard: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 16,
        overflow: 'hidden',
    },
    chartTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: T.white,
        letterSpacing: 0.5,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    chartEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
    chartEmptyTitle: { fontSize: 15, fontWeight: '800', color: T.white },
    chartEmptySub: { fontSize: 12, color: T.muted, textAlign: 'center', lineHeight: 17, paddingHorizontal: 20 },
});
