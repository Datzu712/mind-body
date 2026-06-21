import { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, type LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart } from 'react-native-gifted-charts';
import { FitColors as T } from '@/constants/theme';
import {
    useActivityHistory,
    computeWeekBars,
    computeWeekSummary,
    computeMonthBars,
    computeMonthSummary,
    compute3MonthBars,
    compute3MonthSummary,
    computeMonthActivity,
    ActivityType,
    type Period,
    type BarData,
    type PeriodSummary,
} from '@/hooks/use-activity-history';
import { progressStyles as ps } from './shared-styles';

type Metric = 'steps' | 'calories';

const PERIODS: { key: Period; label: string }[] = [
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: '3months', label: '3 Meses' },
];

const METRICS: { key: Metric; label: string }[] = [
    { key: 'steps', label: 'Pasos' },
    { key: 'calories', label: 'Calorías' },
];

const LEGEND_ITEMS = [
    { bg: T.yellow + 'BB', bd: T.yellow + 'BB', lbl: 'Entreno' },
    { bg: T.yellowDim, bd: T.yellowBdr, lbl: 'Activo' },
    { bg: T.card2, bd: T.border, lbl: 'Descanso' },
];

function fmtNum(v: number): string {
    if (v >= 10000) return `${(v / 1000).toFixed(1)}k`;
    if (v >= 1000) return v.toLocaleString();
    return String(v);
}

function toChartData(bars: BarData[]) {
    return bars.map((b) => ({
        value: b.value,
        label: b.label,
        frontColor: b.isCurrent ? T.yellow : T.yellowDim,
        gradientColor: b.isCurrent ? T.yellow + 'CC' : T.yellowDim,
    }));
}

function SummaryRow({ summary }: { summary: PeriodSummary }) {
    const items = [
        { ic: 'footsteps-outline' as const, val: fmtNum(summary.totalSteps), lbl: 'Pasos', ac: T.yellow },
        { ic: 'flame-outline' as const, val: fmtNum(summary.totalCalories), lbl: 'Calorías', ac: T.orange },
        { ic: 'barbell-outline' as const, val: String(summary.totalExercises), lbl: 'Entrenos', ac: T.green },
        { ic: 'timer-outline' as const, val: `${summary.totalActiveMinutes}m`, lbl: 'Activo', ac: T.blue },
    ];

    return (
        <View style={s.summaryRow}>
            {items.map((it, i) => (
                <View key={i} style={s.summaryItem}>
                    <Ionicons name={it.ic} size={16} color={it.ac} />
                    <Text style={[s.summaryVal, { color: it.ac }]}>{it.val}</Text>
                    <Text style={s.summaryLbl}>{it.lbl}</Text>
                </View>
            ))}
        </View>
    );
}

export function ActividadTab() {
    const { data: records, isLoading } = useActivityHistory();
    const [period, setPeriod] = useState<Period>('week');
    const [metric, setMetric] = useState<Metric>('steps');
    const [chartWidth, setChartWidth] = useState(0);

    const onChartLayout = useCallback((e: LayoutChangeEvent) => {
        setChartWidth(e.nativeEvent.layout.width - 32); // subtract card padding (16*2)
    }, []);

    const computed = useMemo(() => {
        if (!records) return null;

        const getBars = (m: Metric) => {
            if (period === 'week') return computeWeekBars(records, m);
            if (period === 'month') return computeMonthBars(records, m);
            return compute3MonthBars(records, m);
        };

        const summary =
            period === 'week'
                ? computeWeekSummary(records)
                : period === 'month'
                  ? computeMonthSummary(records)
                  : compute3MonthSummary(records);

        return {
            bars: getBars(metric),
            summary,
            monthDays: period === 'month' ? computeMonthActivity(records) : null,
        };
    }, [records, period, metric]);

    if (isLoading || !computed) {
        return (
            <View style={ps.loading}>
                <ActivityIndicator size="large" color={T.yellow} />
            </View>
        );
    }

    const chartData = toChartData(computed.bars);
    const barCount = chartData.length;
    const computedBarWidth = chartWidth > 0 ? Math.floor(((chartWidth - 16) / barCount) * 0.6) : 26;
    const computedSpacing = chartWidth > 0 ? Math.floor(((chartWidth - 16) / barCount) * 0.4) : 8;

    return (
        <>
            {/* Period pills */}
            <View style={[ps.px, { marginBottom: 16 }]}>
                <View style={s.pillRow}>
                    {PERIODS.map((p) => (
                        <Pressable
                            key={p.key}
                            style={[s.pill, period === p.key && s.pillActive]}
                            onPress={() => setPeriod(p.key)}
                        >
                            <Text style={[s.pillLabel, period === p.key && s.pillLabelActive]}>{p.label}</Text>
                        </Pressable>
                    ))}
                </View>
            </View>

            {/* Summary */}
            <View style={ps.px}>
                <SummaryRow summary={computed.summary} />
            </View>

            {/* Metric toggle */}
            <View style={[ps.px, s.metricRow]}>
                {METRICS.map((m) => (
                    <Pressable
                        key={m.key}
                        style={[s.metricPill, metric === m.key && s.metricPillActive]}
                        onPress={() => setMetric(m.key)}
                    >
                        <Text style={[s.metricLabel, metric === m.key && s.metricLabelActive]}>{m.label}</Text>
                    </Pressable>
                ))}
            </View>

            {/* Chart */}
            <View style={ps.px}>
                <View style={s.chartCard} onLayout={onChartLayout}>
                    {chartWidth > 0 && (
                        <BarChart
                            key={`${period}-${metric}`}
                            data={chartData}
                            barWidth={computedBarWidth}
                            spacing={computedSpacing}
                            height={140}
                            barBorderTopLeftRadius={5}
                            barBorderTopRightRadius={5}
                            noOfSections={4}
                            yAxisThickness={0}
                            xAxisThickness={0}
                            xAxisLabelTextStyle={s.xLabel}
                            disableScroll
                            parentWidth={chartWidth}
                            isAnimated
                            animationDuration={400}
                            backgroundColor="transparent"
                            showGradient
                            gradientColor={T.yellow + '33'}
                            initialSpacing={4}
                            endSpacing={4}
                            yAxisTextStyle={s.yLabel}
                            yAxisColor="transparent"
                            rulesColor={T.border}
                            rulesType="dashed"
                            dashWidth={4}
                            dashGap={4}
                            formatYLabel={(v) =>
                                metric === 'calories' ? `${(Number(v) / 1000).toFixed(1)}k` : fmtNum(Number(v))
                            }
                            focusBarOnPress
                            focusedBarConfig={{ color: T.yellow, width: computedBarWidth + 2 }}
                            overflowTop={50}
                            renderTooltip={(item: { value: number }) => (
                                <View style={s.tooltip}>
                                    <Text style={s.tooltipText}>
                                        {metric === 'calories'
                                            ? `${item.value.toLocaleString()} cal`
                                            : `${item.value.toLocaleString()} pasos`}
                                    </Text>
                                </View>
                            )}
                        />
                    )}
                </View>
            </View>

            {/* Month calendar (only in month view) */}
            {computed.monthDays && (
                <>
                    <Text style={ps.secTitle}>ACTIVIDAD DEL MES</Text>
                    <View style={ps.px}>
                        <View style={s.calCard}>
                            <View style={s.calGrid}>
                                {computed.monthDays.map((md) => (
                                    <View
                                        key={md.day}
                                        style={[
                                            s.calDot,
                                            md.type === ActivityType.REST && s.calDotRest,
                                            md.type === ActivityType.WORKOUT && s.calDotActive,
                                            md.type === ActivityType.ACTIVE && s.calDotLight,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                s.calDotNum,
                                                md.type === ActivityType.WORKOUT && { color: T.bg },
                                                md.type === ActivityType.ACTIVE && { color: T.yellow },
                                                md.type === ActivityType.REST && { color: T.card3 },
                                            ]}
                                        >
                                            {md.day}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                            <View style={s.legend}>
                                {LEGEND_ITEMS.map((item, i) => (
                                    <View key={i} style={s.legendItem}>
                                        <View
                                            style={[s.legendDot, { backgroundColor: item.bg, borderColor: item.bd }]}
                                        />
                                        <Text style={s.legendLbl}>{item.lbl}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                </>
            )}
        </>
    );
}

const s = StyleSheet.create({
    // Period pills
    pillRow: { flexDirection: 'row', gap: 8 },
    pill: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: T.border,
    },
    pillActive: { backgroundColor: T.yellowDim, borderColor: T.yellowBdr },
    pillLabel: { fontSize: 11, fontWeight: '700', color: T.muted },
    pillLabelActive: { color: T.yellow },

    // Summary
    summaryRow: {
        flexDirection: 'row',
        backgroundColor: T.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
        justifyContent: 'space-around',
    },
    summaryItem: { alignItems: 'center', gap: 4 },
    summaryVal: { fontSize: 16, fontWeight: '900' },
    summaryLbl: { fontSize: 9, color: T.muted, fontWeight: '700', textTransform: 'uppercase' },

    // Chart
    chartCard: {
        backgroundColor: T.card,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 40,
        borderWidth: 1,
        borderColor: T.border,
    },
    metricRow: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 8 },
    metricPill: {
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    metricPillActive: { backgroundColor: T.card2 },
    metricLabel: { fontSize: 11, fontWeight: '700', color: T.muted },
    metricLabelActive: { color: T.white },
    yLabel: { fontSize: 9, color: T.muted, fontWeight: '600' },
    tooltip: {
        backgroundColor: T.white,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginBottom: 6,
        alignSelf: 'center',
    },
    tooltipText: { fontSize: 10, fontWeight: '800', color: T.bg },
    xLabel: { fontSize: 9, color: T.muted, fontWeight: '700' },

    // Calendar
    calCard: { backgroundColor: T.card, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: T.border },
    calGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
    calDot: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    calDotRest: { backgroundColor: T.card2, borderWidth: 1, borderColor: T.border },
    calDotActive: { backgroundColor: T.yellow + 'BB' },
    calDotLight: { backgroundColor: T.yellowDim, borderWidth: 1, borderColor: T.yellowBdr },
    calDotNum: { fontSize: 9, fontWeight: '800' },
    legend: { flexDirection: 'row', gap: 12, marginTop: 12 },
    legendItem: { flexDirection: 'row', gap: 5, alignItems: 'center' },
    legendDot: { width: 10, height: 10, borderRadius: 3, borderWidth: 1 },
    legendLbl: { fontSize: 10, color: T.muted, fontWeight: '600' },
});
