import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleDailyDigest(
  hour: number,
  minute: number,
  contactCount: number,
): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (contactCount === 0) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to connect 👋',
      body:
        contactCount === 1
          ? 'You have 1 person to reach out to today.'
          : `You have ${contactCount} people to reach out to today.`,
      sound: true,
    },
    trigger: {
      hour,
      minute,
      repeats: true,
    },
  });
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
