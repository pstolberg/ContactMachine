import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { Colors } from '../constants/colors';
import {
  requestNotificationPermissions,
  scheduleDailyDigest,
  cancelAllNotifications,
} from '../services/notifications';
import { computeDigest } from '../utils/digest';
import { clearAll } from '../services/database';

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function SettingsScreen() {
  const { settings, contacts, updateSettings } = useStore();
  const insets = useSafeAreaInsets();
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);

  async function toggleNotifications(enabled: boolean) {
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) {
        Alert.alert(
          'Permission denied',
          'Allow notifications in Settings to enable daily reminders.',
        );
        return;
      }
    }
    updateSettings({ notificationsEnabled: enabled });
    if (enabled) {
      const digestCount = computeDigest(contacts).length;
      await scheduleDailyDigest(
        settings.notificationHour,
        settings.notificationMinute,
        digestCount,
      );
    } else {
      await cancelAllNotifications();
    }
  }

  async function saveNotificationTime(hour: number) {
    setSavingNotif(true);
    updateSettings({ notificationHour: hour });
    if (settings.notificationsEnabled) {
      const count = computeDigest(contacts).length;
      await scheduleDailyDigest(hour, settings.notificationMinute, count);
    }
    setSavingNotif(false);
  }

  function handleClearData() {
    Alert.alert(
      'Clear all data',
      'This will delete all contacts and reset settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear everything',
          style: 'destructive',
          onPress: async () => {
            await clearAll();
            Alert.alert('Done', 'All data cleared. Restart the app.');
          },
        },
      ],
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Profile */}
        <SectionTitle label="Your profile" />
        <View style={styles.card}>
          <FieldRow label="Your name">
            <TextInput
              style={styles.textInput}
              value={settings.userName ?? ''}
              onChangeText={(v) => updateSettings({ userName: v })}
              placeholder="How should we greet you?"
              placeholderTextColor={Colors.textTertiary}
            />
          </FieldRow>
        </View>

        {/* AI */}
        <SectionTitle label="AI (Anthropic)" />
        <View style={styles.card}>
          <FieldRow label="API Key">
            <View style={styles.apiKeyRow}>
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                value={settings.anthropicApiKey ?? ''}
                onChangeText={(v) => updateSettings({ anthropicApiKey: v })}
                placeholder="sk-ant-…"
                placeholderTextColor={Colors.textTertiary}
                secureTextEntry={!apiKeyVisible}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setApiKeyVisible((v) => !v)} style={styles.eyeBtn}>
                <Ionicons
                  name={apiKeyVisible ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </FieldRow>
          <Text style={styles.hint}>
            Used for AI message suggestions and profile enrichment. Never sent anywhere except
            Anthropic's API.
          </Text>
        </View>

        {/* Notifications */}
        <SectionTitle label="Daily digest" />
        <View style={styles.card}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Morning reminder</Text>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ true: Colors.primary }}
              thumbColor="#fff"
            />
          </View>
          {settings.notificationsEnabled && (
            <>
              <Text style={styles.fieldLabel}>Notification time</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hourRow}
              >
                {HOURS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.hourChip, settings.notificationHour === h && styles.hourChipActive]}
                    onPress={() => saveNotificationTime(h)}
                  >
                    <Text
                      style={[
                        styles.hourChipText,
                        settings.notificationHour === h && styles.hourChipTextActive,
                      ]}
                    >
                      {h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* Default cadence */}
        <SectionTitle label="Defaults" />
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Default check-in frequency (days)</Text>
          <TextInput
            style={styles.textInput}
            value={String(settings.defaultCheckInDays)}
            onChangeText={(v) => {
              const n = parseInt(v, 10);
              if (!isNaN(n) && n >= 0) updateSettings({ defaultCheckInDays: n });
            }}
            keyboardType="number-pad"
            placeholder="14"
            placeholderTextColor={Colors.textTertiary}
          />
        </View>

        {/* Data */}
        <SectionTitle label="Data" />
        <View style={styles.card}>
          <Text style={styles.metaText}>
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} stored locally on your device.
          </Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData}>
            <Ionicons name="trash-outline" size={16} color={Colors.error} />
            <Text style={styles.dangerBtnText}>Clear all data</Text>
          </TouchableOpacity>
        </View>

        {/* About */}
        <SectionTitle label="About" />
        <View style={styles.card}>
          <Text style={styles.aboutText}>ContactMachine v1.0</Text>
          <Text style={styles.hint}>
            Stay personally connected at scale. All data lives on your device.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function SectionTitle({ label }: { label: string }) {
  return <Text style={sectionTitleStyle}>{label}</Text>;
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={fieldRowStyles.row}>
      <Text style={fieldRowStyles.label}>{label}</Text>
      <View style={fieldRowStyles.value}>{children}</View>
    </View>
  );
}

const sectionTitleStyle: any = {
  fontSize: 13,
  fontWeight: '600',
  color: Colors.textTertiary,
  textTransform: 'uppercase',
  letterSpacing: 0.8,
  marginTop: 20,
  marginBottom: 8,
};

const fieldRowStyles = StyleSheet.create({
  row: { marginBottom: 4 },
  label: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', marginBottom: 6 },
  value: {},
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16 },
  pageTitle: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4, paddingTop: 4 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 4,
  },
  textInput: {
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: Colors.background,
  },
  apiKeyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  eyeBtn: { padding: 6 },
  hint: { fontSize: 12, color: Colors.textTertiary, marginTop: 8, lineHeight: 18 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  switchLabel: { fontSize: 15, color: Colors.textPrimary, fontWeight: '500' },
  fieldLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500', marginTop: 12, marginBottom: 8 },
  hourRow: { gap: 6, paddingBottom: 4 },
  hourChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  hourChipActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  hourChipText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  hourChipTextActive: { color: Colors.primary, fontWeight: '600' },
  metaText: { fontSize: 14, color: Colors.textSecondary, marginBottom: 12 },
  dangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  dangerBtnText: { fontSize: 14, color: Colors.error, fontWeight: '500' },
  aboutText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
});
