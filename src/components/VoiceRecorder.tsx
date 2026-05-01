import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { VoiceNote } from '../types';
import { generateId, nowISO } from '../utils/dates';

interface Props {
  onVoiceNoteAdded: (note: VoiceNote) => void;
}

type RecordingState = 'idle' | 'recording' | 'stopped';

export function VoiceRecorder({ onVoiceNoteAdded }: Props) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startRecording() {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Microphone access is required for voice notes.');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY,
      );
      recordingRef.current = recording;
      setState('recording');
      setDuration(0);
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    } catch (e) {
      Alert.alert('Error', 'Could not start recording.');
    }
  }

  async function stopRecording() {
    if (!recordingRef.current) return;
    if (timerRef.current) clearInterval(timerRef.current);

    try {
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recordingRef.current.getURI();
      if (uri) {
        const note: VoiceNote = {
          id: generateId(),
          uri,
          duration,
          createdAt: nowISO(),
        };
        onVoiceNoteAdded(note);
      }
      recordingRef.current = null;
      setState('idle');
      setDuration(0);
    } catch (e) {
      Alert.alert('Error', 'Could not save recording.');
      setState('idle');
    }
  }

  function formatDuration(s: number) {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.micBtn, state === 'recording' && styles.micBtnActive]}
        onPress={state === 'recording' ? stopRecording : startRecording}
        activeOpacity={0.8}
      >
        <Ionicons
          name={state === 'recording' ? 'stop' : 'mic'}
          size={22}
          color="#fff"
        />
      </TouchableOpacity>
      <View style={styles.labelBox}>
        <Text style={styles.label}>
          {state === 'recording' ? `Recording… ${formatDuration(duration)}` : 'Add voice note'}
        </Text>
        {state === 'recording' && (
          <Text style={styles.hint}>Tap stop when done</Text>
        )}
        {state === 'idle' && (
          <Text style={styles.hint}>Speak freely — add a transcript below for AI</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.borderLight,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: Colors.error,
  },
  labelBox: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  hint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
