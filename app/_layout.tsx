import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return <>
    <StatusBar style="dark" />
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: Colors.ink,
      tabBarInactiveTintColor: Colors.muted,
      tabBarStyle: { height: 78, paddingTop: 10, paddingBottom: 12, backgroundColor: Colors.paper, borderTopColor: Colors.line },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
    }}>
      <Tabs.Screen name="index" options={{ title: 'Notas', tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="camera" options={{ title: 'Cámara', tabBarIcon: ({ color, size }) => <Ionicons name="camera-outline" color={color} size={size} /> }} />
      <Tabs.Screen name="audio" options={{ title: 'Audio', tabBarIcon: ({ color, size }) => <Ionicons name="mic-outline" color={color} size={size} /> }} />
    </Tabs>
  </>;
}
