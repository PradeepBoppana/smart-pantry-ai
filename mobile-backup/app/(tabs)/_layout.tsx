import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Colors } from '../../constants/theme';

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 22 }}>{icon}</Text>
      <Text style={{
        fontSize: 10,
        fontWeight: focused ? '600' : '400',
        color: focused ? Colors.accent : Colors.textMuted,
        marginTop: 2,
      }}>
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.bgCard,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 70,
          paddingBottom: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" label="Pantry" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📸" label="Scan" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🍳" label="Cook" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="🛒" label="Shop" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" label="Stats" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
