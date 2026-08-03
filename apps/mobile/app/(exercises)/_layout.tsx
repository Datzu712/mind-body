import { Stack, router } from 'expo-router';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FitColors as T } from '@/constants/theme';

export default function ExercisesLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: { backgroundColor: T.bg },
                headerTintColor: T.white,
                headerTitleStyle: { fontWeight: '800' },
                headerShadowVisible: false,
                contentStyle: { backgroundColor: T.bg },
                headerLeft: () => (
                    <Pressable onPress={() => router.back()} style={{ marginRight: 8 }}>
                        <Ionicons name="arrow-back" size={24} color={T.white} />
                    </Pressable>
                ),
            }}
        />
    );
}
