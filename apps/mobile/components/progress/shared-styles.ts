import { StyleSheet } from 'react-native';
import { FitColors as T } from '@/constants/theme';

export const progressStyles = StyleSheet.create({
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    px: { paddingHorizontal: 20 },
    secTitle: {
        fontSize: 12,
        fontWeight: '800',
        color: T.white,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
});
