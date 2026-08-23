import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppSelector } from '../store/hooks';
import { color, type } from '../theme';
import LoginScreen from '../screens/LoginScreen';
import ClientsScreen from '../screens/ClientsScreen';
import ClientProgressScreen from '../screens/ClientProgressScreen';
import AddWeightScreen from '../screens/AddWeightScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { ClientsIcon, ProfileIcon } from '../components/TabIcons';
import type {
  AuthStackParamList,
  ClientsStackParamList,
  MainTabParamList,
} from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const ClientsStack = createNativeStackNavigator<ClientsStackParamList>();
const Tabs = createBottomTabNavigator<MainTabParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: color.bg },
  headerShadowVisible: false,
  headerTintColor: color.ink,
  headerTitleStyle: { fontWeight: '800' as const, color: color.ink },
  contentStyle: { backgroundColor: color.bg },
};

function ClientsStackNavigator() {
  return (
    <ClientsStack.Navigator screenOptions={stackScreenOptions}>
      <ClientsStack.Screen
        name="ClientsList"
        component={ClientsScreen}
        options={{ title: 'Clients' }}
      />
      <ClientsStack.Screen
        name="ClientProgress"
        component={ClientProgressScreen}
        options={({ route }) => ({ title: route.params.clientName })}
      />
      <ClientsStack.Screen
        name="AddWeight"
        component={AddWeightScreen}
        options={{ title: 'Add weight', presentation: 'modal' }}
      />
    </ClientsStack.Navigator>
  );
}

const renderClientsIcon = ({ color: tint }: { color: string }) => (
  <ClientsIcon tint={tint} />
);
const renderProfileIcon = ({ color: tint }: { color: string }) => (
  <ProfileIcon tint={tint} />
);

function MainTabs() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: color.accent,
        tabBarInactiveTintColor: color.inkFaint,
        tabBarStyle: { backgroundColor: color.surface, borderTopColor: color.line },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="ClientsTab"
        component={ClientsStackNavigator}
        options={{
          title: 'Clients',
          tabBarIcon: renderClientsIcon,
        }}
      />
      <Tabs.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: renderProfileIcon,
        }}
      />
    </Tabs.Navigator>
  );
}

function SplashView() {
  return (
    <View style={styles.splash}>
      <Text style={styles.splashWordmark}>Molt Coach</Text>
    </View>
  );
}

export default function RootNavigator() {
  const status = useAppSelector(state => state.auth.status);

  if (status === 'bootstrapping') {
    return <SplashView />;
  }

  return (
    <NavigationContainer>
      {status === 'signedIn' ? (
        <MainTabs />
      ) : (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="Login" component={LoginScreen} />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashWordmark: {
    ...type.title,
    color: color.accent,
  },
});
