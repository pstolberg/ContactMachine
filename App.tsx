import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useStore } from './src/store';
import { scheduleDailyDigest } from './src/services/notifications';
import { computeDigest } from './src/utils/digest';

export default function App() {
  const { initialize, isInitialized, contacts, settings } = useStore();

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    if (settings.notificationsEnabled) {
      const count = computeDigest(contacts).length;
      scheduleDailyDigest(settings.notificationHour, settings.notificationMinute, count);
    }
  }, [isInitialized]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
