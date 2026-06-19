import { Stack } from 'expo-router';
import { FitColors as T } from '@/constants/theme';

export default function MeasurementsLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: T.bg },
                headerTintColor: T.white,
                headerTitleStyle: { fontWeight: '800' },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: T.bg },
            }}
        />
    );
}
