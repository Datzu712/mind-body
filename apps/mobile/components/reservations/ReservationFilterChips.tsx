import React from 'react';
import { Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { FitColors as T } from '@/constants/theme';
import type { FilterCategory } from './mock-reservations';

type Props = {
    categories: FilterCategory[];
    active: FilterCategory;
    onChange: (category: FilterCategory) => void;
};

/** Horizontal, single-select filter chips. Active chip = yellow fill + dark text. */
export function ReservationFilterChips({ categories, active, onChange }: Props) {
    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.row}
            accessibilityRole="tablist"
        >
            {categories.map((cat) => {
                const on = cat === active;
                return (
                    <TouchableOpacity
                        key={cat}
                        onPress={() => onChange(cat)}
                        activeOpacity={0.8}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={`Filtrar por ${cat}`}
                        style={[s.chip, on ? s.chipOn : s.chipOff]}
                    >
                        <Text style={[s.label, on ? s.labelOn : s.labelOff]}>{cat}</Text>
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    );
}

const s = StyleSheet.create({
    row: { paddingHorizontal: 20, gap: 8 },
    chip: {
        minHeight: 34,
        borderRadius: 10,
        paddingHorizontal: 14,
        justifyContent: 'center',
        borderWidth: 1,
    },
    chipOn: { backgroundColor: T.yellow, borderColor: T.yellow },
    chipOff: { backgroundColor: T.card2, borderColor: T.border },
    label: { fontSize: 12, fontWeight: '800', letterSpacing: 0.3 },
    labelOn: { color: T.bg },
    labelOff: { color: T.muted },
});
