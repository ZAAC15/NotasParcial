import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AudioModule, RecordingPresets, setAudioModeAsync, useAudioRecorder, useAudioRecorderState, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { Colors, formatDateTime } from '../constants/theme';

type Recording = { id: string; uri: string; createdAt: string; durationMillis: number };
const AUDIO_STORE = '@notas-al-dia/audios';

function formatDuration(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
}

export default function AudioScreen() {
  const recorder = useAudioRecorder({ ...RecordingPresets.HIGH_QUALITY, directory: 'document' });
  const recordingState = useAudioRecorderState(recorder);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const player = useAudioPlayer(null);
  const playerStatus = useAudioPlayerStatus(player);

  useEffect(() => {
    AsyncStorage.getItem(AUDIO_STORE).then(value => {
      if (value) setRecordings(JSON.parse(value));
    }).catch(() => Alert.alert('Aviso', 'No fue posible cargar los audios guardados.'));
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false }).catch(() => {});
  }, []);

  async function toggleRecording() {
    try {
      if (recordingState.isRecording) {
        const durationMillis = recordingState.durationMillis;
        await recorder.stop();
        const uri = recorder.uri;
        if (!uri) throw new Error('No se encontró el audio grabado.');
        const id = Date.now().toString();
        const saved: Recording = { id, uri, createdAt: new Date().toISOString(), durationMillis };
        const updated = [saved, ...recordings];
        setRecordings(updated);
        setSaving(true);
        await AsyncStorage.setItem(AUDIO_STORE, JSON.stringify(updated));
        return;
      }
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) { Alert.alert('Permiso necesario', 'Activa el acceso al micrófono en los ajustes del dispositivo.'); return; }
      if (playerStatus.playing) player.pause();
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch {
      Alert.alert('No se pudo grabar', 'Revisa los permisos del micrófono e inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  async function togglePlayback(recording: Recording) {
    try {
      if (activeId === recording.id && playerStatus.playing) {
        player.pause();
        return;
      }
      await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true });
      if (activeId !== recording.id) {
        player.replace(recording.uri);
        setActiveId(recording.id);
      } else if (playerStatus.didJustFinish) {
        player.seekTo(0);
      }
      player.play();
    } catch {
      Alert.alert('No se pudo reproducir', 'El archivo de audio no está disponible.');
    }
  }

  function removeRecording(recording: Recording) {
    Alert.alert('Eliminar audio', '¿Quieres borrar esta grabación?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const updated = recordings.filter(item => item.id !== recording.id);
        if (activeId === recording.id) { player.pause(); player.replace(null); setActiveId(null); }
        setRecordings(updated);
        try {
          await FileSystem.deleteAsync(recording.uri, { idempotent: true });
          await AsyncStorage.setItem(AUDIO_STORE, JSON.stringify(updated));
        } catch { Alert.alert('Aviso', 'No fue posible actualizar la lista de audios.'); }
      } },
    ]);
  }

  const elapsed = Math.floor(recordingState.durationMillis / 1000);
  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;

  return <SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>NOTAS DE VOZ</Text><Text style={styles.heading}>Audio</Text><Text style={styles.subtitle}>Graba ideas y consérvalas en este dispositivo.</Text>
    <View style={styles.card}><View style={[styles.micCircle, recordingState.isRecording && styles.recordingCircle]}><Ionicons name={recordingState.isRecording ? 'radio' : 'mic'} size={34} color={recordingState.isRecording ? Colors.danger : Colors.green} /></View><Text style={styles.status}>{recordingState.isRecording ? 'Grabando ahora' : 'Listo para grabar'}</Text><Text style={styles.timer}>{recordingState.isRecording ? clock : '00:00'}</Text><Text style={styles.helper}>{recordingState.isRecording ? 'Toca el botón para terminar' : 'Los audios se guardan en esta app'}</Text><Pressable disabled={saving} onPress={toggleRecording} style={[styles.recordButton, recordingState.isRecording && styles.stopButton, saving && styles.disabled]} accessibilityLabel={recordingState.isRecording ? 'Detener grabación' : 'Iniciar grabación'}><Ionicons name={recordingState.isRecording ? 'stop' : 'mic'} size={22} color="white" /><Text style={styles.recordText}>{saving ? 'Guardando…' : recordingState.isRecording ? 'Detener y guardar' : 'Grabar audio'}</Text></Pressable></View>
    <View style={styles.listHeader}><Text style={styles.sectionTitle}>Audios guardados</Text><Text style={styles.total}>{recordings.length}</Text></View>
    {recordings.length ? recordings.map(recording => {
      const isActive = activeId === recording.id;
      const isPlaying = isActive && playerStatus.playing;
      return <View key={recording.id} style={styles.audioItem}><Pressable onPress={() => togglePlayback(recording)} style={styles.playButton} accessibilityLabel={isPlaying ? 'Pausar audio' : 'Reproducir audio'}><Ionicons name={isPlaying ? 'pause' : 'play'} size={19} color={Colors.green} /></Pressable><View style={styles.audioCopy}><Text style={styles.audioTitle}>Nota de voz · {formatDuration(recording.durationMillis)}</Text><Text style={styles.audioDate}>{formatDateTime(recording.createdAt)}</Text></View><Pressable onPress={() => removeRecording(recording)} hitSlop={10} accessibilityLabel="Eliminar audio"><Ionicons name="trash-outline" size={17} color={Colors.muted} /></Pressable></View>;
    }) : <Text style={styles.emptyText}>Las grabaciones que hagas aparecerán aquí.</Text>}
    <View style={styles.tip}><Ionicons name="information-circle-outline" size={18} color={Colors.green} /><Text style={styles.tipText}>Los audios quedan guardados en el almacenamiento de la app y siguen disponibles al volver a abrirla.</Text></View>
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: Colors.paper }, page: { flexGrow: 1, padding: 22, paddingBottom: 28 }, eyebrow: { color: Colors.green, fontSize: 10, letterSpacing: 1.8, fontWeight: '700', marginTop: 14 }, heading: { color: Colors.ink, fontSize: 30, fontWeight: '700', marginTop: 5 }, subtitle: { color: Colors.muted, fontSize: 14, marginTop: 7, marginBottom: 23 }, card: { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.line, borderRadius: 22, alignItems: 'center', padding: 22 }, micCircle: { width: 76, height: 76, borderRadius: 38, backgroundColor: Colors.paleGreen, alignItems: 'center', justifyContent: 'center' }, recordingCircle: { backgroundColor: '#F7E8E5' }, status: { color: Colors.ink, fontSize: 16, fontWeight: '700', marginTop: 18 }, timer: { color: Colors.ink, fontSize: 42, fontWeight: '300', fontVariant: ['tabular-nums'], marginTop: 10 }, helper: { color: Colors.muted, fontSize: 12, marginTop: 4 }, recordButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, backgroundColor: Colors.green, minWidth: 190, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, marginTop: 23 }, stopButton: { backgroundColor: Colors.danger }, recordText: { color: '#fff', fontWeight: '700', fontSize: 14 }, disabled: { opacity: 0.6 }, listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 23, marginBottom: 11 }, sectionTitle: { color: Colors.ink, fontWeight: '700', fontSize: 17 }, total: { color: Colors.green, fontWeight: '700', fontSize: 13 }, audioItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.line, padding: 12, borderRadius: 15, marginBottom: 9 }, playButton: { height: 42, width: 42, borderRadius: 21, backgroundColor: Colors.paleGreen, alignItems: 'center', justifyContent: 'center' }, audioCopy: { flex: 1, marginLeft: 12, marginRight: 8 }, audioTitle: { color: Colors.ink, fontSize: 12, fontWeight: '700' }, audioDate: { color: Colors.muted, fontSize: 10, marginTop: 4 }, emptyText: { color: Colors.muted, fontSize: 12, marginTop: 4 }, tip: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 18, paddingHorizontal: 3 }, tipText: { color: Colors.muted, fontSize: 11, flex: 1, lineHeight: 16 } });
