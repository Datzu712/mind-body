import { Stack } from 'expo-router';
import { FitColors as T } from '@/constants/theme';

/**
 * Stack group for the Reservations flow. Each screen renders its own dark
 * header + back button (headerShown:false), matching the wireframes.
 */
export default function ReservationsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: T.bg },
            }}
        >
            <Stack.Screen name="class-detail" />
            <Stack.Screen name="my-reservations" />
            <Stack.Screen name="reminders" />
            <Stack.Screen name="waitlist" />
        </Stack>
    );
}
