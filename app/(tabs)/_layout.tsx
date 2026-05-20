import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { FitColors as T } from '@/constants/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IoniconsName, focusedName: IoniconsName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? focusedName : name} size={24} color={color} />
  );
}

// Height of the visible tab bar content (icons + labels), excluding the safe area
const TAB_CONTENT_HEIGHT = Platform.OS === 'ios' ? 58 : 54;
const TAB_TOP_PADDING    = 10;

export default function TabLayout() {
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: T.yellow,
        tabBarInactiveTintColor: T.muted,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#0C0C0C',
          borderTopColor: T.border,
          borderTopWidth: 1,
          // Total height = visible content + system nav bar (bottom inset)
          height: TAB_CONTENT_HEIGHT + TAB_TOP_PADDING + bottom,
          paddingBottom: bottom + (Platform.OS === 'ios' ? 0 : 4),
          paddingTop: TAB_TOP_PADDING,
        },
        tabBarLabelStyle: {
          fontSize: 9,
          fontWeight: '700',
          letterSpacing: 0.4,
          textTransform: 'uppercase',
          marginTop: -2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen
        name="routines"
        options={{
          title: 'Rutinas',
          tabBarIcon: tabIcon('calendar-outline', 'calendar'),
        }}
      />
      <Tabs.Screen
        name="workouts"
        options={{
          title: 'Ejercicios',
          tabBarIcon: tabIcon('barbell-outline', 'barbell'),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progreso',
          tabBarIcon: tabIcon('bar-chart-outline', 'bar-chart'),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: tabIcon('person-outline', 'person'),
        }}
      />
      {/* Keep explore hidden from tabs but accessible as route */}
      <Tabs.Screen
        name="explore"
        options={{ href: null }}
      />
    </Tabs>
  );
}
