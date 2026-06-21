import { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, type LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-gifted-charts';
import { FitColors as T } from '@/constants/theme';
import { useMeasurements } from '@/hooks/use-measurements';
import { METRICS, PERIODS, getDateRange, monthLabel, type MetricKey, type PeriodKey } from './constants';

export function ChartSection() {
    const [metric, setMetric] = useState<MetricKey>('weightKg');
    const [period, setPeriod] = useState<PeriodKey>('all');
    const [cardWidth, setCardWidth] = useState(0);

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        setCardWidth(e.nativeEvent.layout.width - 32);
    }, []);

    const { from, to } = getDateRange(period);
    const { data: measurements, isFetching } = useMeasurements(from, to);
    const metaInfo = METRICS.find((m) => m.key === metric)!;

    const chart = useMemo(() => {
        if (!measurements?.length) return null;

        const sorted = [...measurements]
            .sort((a, b) => a.measuredAt.localeCompare(b.measuredAt))
            .filter((m) => m[metric] != null);

        if (sorted.length < 2) return null;

        // Last measurement per month
        const byMonth = new Map<string, (typeof sorted)[number]>();
        for (const m of sorted) byMonth.set(m.measuredAt.slice(0, 7), m);

        let max = 0;
        const data = [...byMonth.values()].map((m) => {
            const value = m[metric]!;
            if (value > max) max = value;
            return { value, label: monthLabel(m.measuredAt) };
        });

        return { data, maxValue: Math.ceil(max * 1.2) };
    }, [measurements, metric]);

    const spacing =
        cardWidth > 0 && chart && chart.data.length > 1 ? Math.floor((cardWidth - 60) / (chart.data.length - 1)) : 40;

    return (
        <View>
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

            {isFetching && !chart ? (
                <View style={s.chartEmpty}>
                    <ActivityIndicator size="small" color={T.yellow} />
                </View>
            ) : chart ? (
                <View style={s.chartCard} onLayout={onLayout}>
                    <Text style={s.chartTitle}>
                        {metaInfo.label} ({metaInfo.unit})
                    </Text>
                    {cardWidth > 0 && (
                        <LineChart
                            key={`${metric}-${period}`}
                            data={chart.data}
                            height={130}
                            color={T.yellow}
                            dataPointsColor={T.yellow}
                            thickness={2}
                            startFillColor={T.yellow}
                            startOpacity={0.15}
                            endOpacity={0.01}
                            areaChart
                            curved
                            yAxisTextStyle={s.yLabel}
                            xAxisLabelTextStyle={s.xLabel}
                            rulesColor={T.border}
                            rulesType="dashed"
                            dashWidth={4}
                            dashGap={4}
                            yAxisColor="transparent"
                            xAxisColor="transparent"
                            backgroundColor="transparent"
                            spacing={spacing}
                            noOfSections={3}
                            maxValue={chart.maxValue}
                            dataPointsRadius={chart.data.length <= 12 ? 4 : 3}
                            scrollToEnd={false}
                            parentWidth={cardWidth}
                            isAnimated
                            animationDuration={300}
                            initialSpacing={10}
                            endSpacing={10}
                            pointerConfig={{
                                pointerStripColor: T.yellow + '33',
                                pointerStripWidth: 2,
                                pointerColor: T.yellow,
                                radius: 6,
                                pointerLabelWidth: 80,
                                pointerLabelHeight: 30,
                                activatePointersOnLongPress: false,
                                autoAdjustPointerLabelPosition: true,
                                pointerLabelComponent: (items: { value: number }[]) => {
                                    if (!items[0]) return null;
                                    return (
                                        <View style={s.tooltip}>
                                            <Text style={s.tooltipText}>
                                                {items[0].value} {metaInfo.unit}
                                            </Text>
                                        </View>
                                    );
                                },
                            }}
                        />
                    )}
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
        borderRadius: 20,
        borderWidth: 1,
        borderColor: T.border,
    },
    periodBtnActive: { backgroundColor: T.yellowDim, borderColor: T.yellowBdr },
    periodLabel: { fontSize: 11, fontWeight: '700', color: T.muted },
    periodLabelActive: { color: T.yellow },
    chartCard: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    chartTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: T.white,
        letterSpacing: 0.5,
        marginBottom: 12,
        textTransform: 'uppercase',
    },
    yLabel: { color: T.muted, fontSize: 9, fontWeight: '600' },
    xLabel: { color: T.muted, fontSize: 9, fontWeight: '600' },
    tooltip: {
        backgroundColor: T.white,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 4,
        alignSelf: 'center',
    },
    tooltipText: { fontSize: 11, fontWeight: '800', color: T.bg },
    chartEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 },
    chartEmptyTitle: { fontSize: 15, fontWeight: '800', color: T.white },
    chartEmptySub: { fontSize: 12, color: T.muted, textAlign: 'center', lineHeight: 17, paddingHorizontal: 20 },
});
