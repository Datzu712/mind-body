import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FitColors as T } from '@/constants/theme';
import { useMeasurementSummary } from '@/hooks/use-measurements';

export function CuerpoTab() {
    const { data: summary } = useMeasurementSummary();
    const latest = summary?.latest;

    return (
        <View style={s.px}>
            <Pressable style={s.card} onPress={() => router.push('/(measurements)')}>
                <View style={s.header}>
                    <View style={s.iconWrap}>
                        <Ionicons name="body-outline" size={22} color={T.yellow} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={s.title}>Medidas corporales</Text>
                        <Text style={s.sub}>
                            {latest ? `Última medición: ${latest.measuredAt}` : 'Sin mediciones aún'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={T.muted} />
                </View>

                {latest && (
                    <View style={s.metrics}>
                        {latest.weightKg != null && (
                            <View style={s.metric}>
                                <Ionicons name="scale-outline" size={16} color={T.yellow} />
                                <Text style={s.metricVal}>{latest.weightKg}</Text>
                                <Text style={s.metricUnit}>kg</Text>
                            </View>
                        )}
                        {latest.bodyFatPercentage != null && (
                            <View style={s.metric}>
                                <Ionicons name="water-outline" size={16} color={T.yellow} />
                                <Text style={s.metricVal}>{latest.bodyFatPercentage}</Text>
                                <Text style={s.metricUnit}>% grasa</Text>
                            </View>
                        )}
                        {latest.waistCm != null && (
                            <View style={s.metric}>
                                <Ionicons name="ellipse-outline" size={16} color={T.yellow} />
                                <Text style={s.metricVal}>{latest.waistCm}</Text>
                                <Text style={s.metricUnit}>cm cintura</Text>
                            </View>
                        )}
                    </View>
                )}

                <View style={s.cta}>
                    <Text style={s.ctaText}>Ver gráficas y evolución</Text>
                    <Ionicons name="analytics-outline" size={16} color={T.yellow} />
                </View>
            </Pressable>

            {summary && summary.totalRecords >= 2 && summary.variations.weightKg != null && (
                <View style={s.delta}>
                    <View style={s.deltaRow}>
                        <Text style={s.deltaLabel}>Cambio de peso</Text>
                        <Text style={[s.deltaVal, { color: summary.variations.weightKg <= 0 ? T.green : T.red }]}>
                            {summary.variations.weightKg > 0 ? '+' : ''}
                            {summary.variations.weightKg} kg
                        </Text>
                    </View>
                    {summary.variations.bodyFatPercentage != null && (
                        <View style={s.deltaRow}>
                            <Text style={s.deltaLabel}>Cambio grasa corporal</Text>
                            <Text
                                style={[
                                    s.deltaVal,
                                    { color: summary.variations.bodyFatPercentage <= 0 ? T.green : T.red },
                                ]}
                            >
                                {summary.variations.bodyFatPercentage > 0 ? '+' : ''}
                                {summary.variations.bodyFatPercentage}%
                            </Text>
                        </View>
                    )}
                    <Text style={s.deltaFooter}>
                        {summary.totalRecords} mediciones · desde {summary.first!.measuredAt}
                    </Text>
                </View>
            )}

            {!latest && (
                <View style={s.empty}>
                    <Ionicons name="fitness-outline" size={40} color={T.muted} />
                    <Text style={s.emptyText}>Registra tus medidas para ver tu progreso corporal aquí.</Text>
                    <Pressable style={s.emptyBtn} onPress={() => router.push('/(measurements)')}>
                        <Text style={s.emptyBtnText}>Ir a mediciones</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const s = StyleSheet.create({
    px: { paddingHorizontal: 20 },
    card: {
        backgroundColor: T.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: T.border,
        padding: 16,
    },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    iconWrap: {
        width: 42,
        height: 42,
        borderRadius: 12,
        backgroundColor: T.yellowDim,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: { fontSize: 15, fontWeight: '800', color: T.white },
    sub: { fontSize: 12, color: T.muted, marginTop: 2 },
    metrics: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
        paddingTop: 14,
        borderTopWidth: 1,
        borderTopColor: T.border,
    },
    metric: { alignItems: 'center', gap: 4 },
    metricVal: { fontSize: 20, fontWeight: '900', color: T.white },
    metricUnit: { fontSize: 10, color: T.muted, fontWeight: '600' },
    cta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: T.border,
    },
    ctaText: { fontSize: 13, fontWeight: '700', color: T.yellow },
    delta: {
        backgroundColor: T.card,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: T.border,
        padding: 14,
        marginTop: 12,
        gap: 8,
    },
    deltaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    deltaLabel: { fontSize: 13, fontWeight: '600', color: T.muted },
    deltaVal: { fontSize: 14, fontWeight: '800' },
    deltaFooter: { fontSize: 10, color: T.muted, marginTop: 4 },
    empty: { alignItems: 'center', gap: 12, paddingVertical: 40 },
    emptyText: { fontSize: 13, color: T.muted, textAlign: 'center', lineHeight: 18 },
    emptyBtn: {
        backgroundColor: T.yellowDim,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: T.yellowBdr,
        paddingHorizontal: 18,
        paddingVertical: 10,
    },
    emptyBtnText: { fontSize: 13, fontWeight: '700', color: T.yellow },
});
