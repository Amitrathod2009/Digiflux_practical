import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type AuthStackParamList = {
  Login: undefined;
};

export type ClientsStackParamList = {
  ClientsList: undefined;
  ClientProgress: { clientId: string; clientName: string };
  AddWeight: { clientId: string };
};

export type MainTabParamList = {
  ClientsTab: NavigatorScreenParams<ClientsStackParamList>;
  ProfileTab: undefined;
};

export type AuthStackScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type ClientsStackScreenProps<T extends keyof ClientsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ClientsStackParamList, T>,
    BottomTabScreenProps<MainTabParamList>
  >;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  BottomTabScreenProps<MainTabParamList, T>;
