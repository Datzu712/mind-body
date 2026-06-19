import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';
import { useMeasurements } from '@/hooks/use-measurements';
import type { Measurement } from '@/lib/api/types/measurement';
import { METRICS, formatDate } from './constants';

function MeasurementRow({ item, isFirst, prev }: { item: Measurement; isFirst: boolean; prev?: Measurement }) {
    const [expanded, setExpanded] = useState(false);
    const mainVal = item.weightKg != null ? `${item.weightKg} kg` : '—';

    const weightDiff =
        prev && item.weightKg != null && prev.weightKg != null ? +(prev.weightKg - item.weightKg).toFixed(1) : null;
    const trendColor = weightDiff != null && weightDiff !== 0 ? (weightDiff < 0 ? T.green : T.red) : null;

    return (
        <View style={s.timelineRow}>
            <View style={s.timelineTrack}>
                <View style={[s.dot, isFirst && s.dotFirst]} />
                <View style={s.line} />
            </View>
            <Pressable style={[s.row, isFirst && s.rowFirst]} onPress={() => setExpanded(!expanded)}>
                <View style={s.rowTop}>
                    <View style={s.rowLeft}>
                        <Text style={[s.rowDate, isFirst && s.rowDateFirst]}>{formatDate(item.measuredAt)}</Text>
                        {isFirst && <Text style={s.rowBadge}>Más reciente</Text>}
                    </View>
                    <View style={s.rowRight}>
                        <Text style={s.rowPreview}>{mainVal}</Text>
                        {trendColor && (
                            <View style={[s.trend, { backgroundColor: trendColor + '18' }]}>
                                <Ionicons
                                    name={weightDiff! < 0 ? 'trending-down' : 'trending-up'}
                                    size={11}
                                    color={trendColor}
                                />
                                <Text style={[s.trendText, { color: trendColor }]}>
                                    {weightDiff! > 0 ? '+' : ''}
                                    {weightDiff}
                                </Text>
                            </View>
                        )}
                        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={T.muted} />
                    </View>
                </View>
                {expanded && (
                    <View style={s.details}>
                        {METRICS.map((m) => {
                            const val = item[m.key];
                            return (
                                <View key={m.key} style={s.detailRow}>
                                    <View style={s.detailLeft}>
                                        <Ionicons name={m.icon} size={14} color={T.yellow} />
                                        <Text style={s.detailLabel}>{m.label}</Text>
                                    </View>
                                    <Text style={s.detailVal}>{val != null ? `${val} ${m.unit}` : '—'}</Text>
                                </View>
                            );
                        })}
                        {item.notes && (
                            <View style={s.notesWrap}>
                                <Ionicons name="chatbubble-outline" size={12} color={T.muted} />
                                <Text style={s.notes}>{item.notes}</Text>
                            </View>
                        )}
                    </View>
                )}
            </Pressable>
        </View>
    );
}

export function HistoryModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
    const { data: measurements } = useMeasurements();

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <View style={s.modalRoot}>
                <View style={s.header}>
                    <View />
                    <Text style={s.headerTitle}>Historial completo</Text>
                    <Pressable onPress={onClose} hitSlop={12}>
                        <Ionicons name="close" size={22} color={T.muted} />
                    </Pressable>
                </View>

                {measurements && measurements.length > 0 ? (
                    <FlatList
                        data={measurements}
                        keyExtractor={(m) => m.id}
                        renderItem={({ item, index }) => (
                            <MeasurementRow
                                item={item}
                                isFirst={index === 0}
                                prev={index > 0 ? measurements[index - 1] : undefined}
                            />
                        )}
                        contentContainerStyle={s.list}
                        showsVerticalScrollIndicator={false}
                    />
                ) : (
                    <View style={s.empty}>
                        <Ionicons name="body-outline" size={48} color={T.muted} />
                        <Text style={s.emptyTitle}>Sin mediciones</Text>
                    </View>
                )}
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
    modalRoot: { flex: 1, backgroundColor: T.bg },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: T.border,
    },
    headerTitle: { fontSize: 16, fontWeight: '800', color: T.white },
    list: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    emptyTitle: { fontSize: 16, fontWeight: '800', color: T.white },

    // Timeline
    timelineRow: { flexDirection: 'row' },
    timelineTrack: { width: 20, alignItems: 'center', paddingTop: 16 },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: T.muted, zIndex: 1 },
    dotFirst: { width: 10, height: 10, borderRadius: 5, backgroundColor: T.yellow },
    line: { flex: 1, width: 1.5, backgroundColor: T.border, marginTop: 2 },

    // Row
    row: {
        flex: 1,
        backgroundColor: T.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: T.border,
        padding: 12,
        marginBottom: 6,
        marginLeft: 8,
    },
    rowFirst: { borderColor: T.yellowBdr },
    rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    rowLeft: { gap: 1 },
    rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowDate: { fontSize: 13, fontWeight: '700', color: T.white },
    rowDateFirst: { color: T.yellow },
    rowBadge: { fontSize: 9, fontWeight: '700', color: T.yellow, letterSpacing: 0.3, marginTop: 1 },
    rowPreview: { fontSize: 13, fontWeight: '600', color: T.muted },
    trend: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    trendText: { fontSize: 10, fontWeight: '700' },

    // Expanded details
    details: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: T.border,
        gap: 8,
    },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    detailLabel: { fontSize: 12, fontWeight: '600', color: T.muted },
    detailVal: { fontSize: 13, fontWeight: '700', color: T.white },
    notesWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 4 },
    notes: { flex: 1, fontSize: 11, color: T.muted, fontStyle: 'italic' },
});
