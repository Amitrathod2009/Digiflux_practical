import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { bootstrapSession } from './src/store/slices/authSlice';
import RootNavigator from './src/navigation/RootNavigator';
import { color } from './src/theme';

function App() {
  useEffect(() => {
    store.dispatch(bootstrapSession());
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="dark-content" backgroundColor={color.bg} />
        <RootNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
