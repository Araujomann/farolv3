import { Tabs } from 'expo-router';
import React from 'react';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false
        
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Mapa',
        }}
      />
      
      <Tabs.Screen
        name="report"
        options={{
          title: 'Relatar',
        }}
      />
       <Tabs.Screen
        name="profile"
        options={{
          title: 'perfil',
        }}
      />
    </Tabs>
  );
}
