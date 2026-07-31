import { Stack } from 'expo-router';

import { FitColors as T } from '@/constants/theme';

export default function CoachLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: T.bg },
            }}
        />
    );
}
