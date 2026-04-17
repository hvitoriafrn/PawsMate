// app/(tabs)/_layout.tsx 
// This file controls the tabs in the app and their layout


// import necessary modules and components
import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';


// defines the layout for the tab navigation
export default function TabLayout() {

  // Render the tab navigator with tabs for home and explore
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#F2B949',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f0f0f0',
        }
      }}>

      {/* Home tab*/}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) =>
             <Feather name="home"  size={24} color={color} />,
        }}
      />

      {/* Explore tab*/}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            <Feather name="compass" size={24} color={color} />
          )
        }}
      />

      <Tabs.Screen
        name="messages/index"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => (
            <Feather name="message-circle" size={24} color={color}/>
          ),
        }}
      />

      <Tabs.Screen
        name="messages/[matchId]"
        options={{ href: null }}
      />

      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color }) => (
            <Feather name="calendar" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
       name="profile"
       options={{
        title: 'Profile',
        tabBarIcon: ({ color }) => (
          <Feather name="user" size={24} color={color}/>
        ),
        }}
      />


    </Tabs>
  );
}