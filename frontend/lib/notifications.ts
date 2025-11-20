import * as Notifications from 'expo-notifications';
import type { MaintenanceTask } from '../types/models';

// Request permissions (iOS) / create channel (Android)
export async function ensureNotificationSetup() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('maintenance', {
      name: 'Maintenance',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

// Schedule local notifications for soon/overdue tasks within next 3 days
export async function scheduleTaskNotifications(tasks: MaintenanceTask[]) {
  const now = new Date();
  for (const t of tasks) {
    if (t.severity === 'info') continue;
    const due = new Date(t.due_date);
    const days = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (days > 3) continue; // only near-term
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t.title,
        body: t.description || `${t.severity === 'overdue' ? 'OVERDUE' : 'Upcoming'} task due ${t.due_date}`,
        sound: true,
      },
      trigger: null, // immediate fire (MVP). Future: schedule near due date.
    });
  }
}
