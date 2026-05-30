import { FitColors as T } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface Props {
    icon: React.ComponentProps<typeof Ionicons>['name'];
    label: string;
    accentColor?: string;
    onPress: () => void;
    rightElement?: React.ReactNode;
}

export function SettingsRow({ icon, label, accentColor = T.muted, onPress, rightElement }: Props) {
    return (
        <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.8}>
            <View style={[s.iconWrap, { backgroundColor: accentColor + '22' }]}>
                <Ionicons name={icon} size={18} color={accentColor} />
            </View>
            <Text style={s.label}>{label}</Text>
            {rightElement !== undefined ? rightElement : <Ionicons name="chevron-forward" size={16} color={T.muted} />}
        </TouchableOpacity>
    );
}

const s = StyleSheet.create({
    row: {
        backgroundColor: T.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: T.border,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconWrap: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    label: { flex: 1, fontSize: 14, fontWeight: '600', color: T.white },
});
