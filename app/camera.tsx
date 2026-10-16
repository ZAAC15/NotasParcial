import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatDateTime } from '../constants/theme';

type SavedPhoto = { id: string; uri: string; createdAt: string };
const PHOTO_STORE = '@notas-al-dia/fotos';

export default function CameraScreen() {
  const [photos, setPhotos] = useState<SavedPhoto[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(PHOTO_STORE).then(value => {
      if (value) setPhotos(JSON.parse(value));
    }).catch(() => Alert.alert('Aviso', 'No fue posible cargar las fotos guardadas.'));
  }, []);

  async function savePhoto(sourceUri: string) {
    setSaving(true);
    try {
      const base = FileSystem.documentDirectory;
      if (!base) throw new Error('No hay una carpeta local disponible.');
      const folder = `${base}fotos/`;
      const folderInfo = await FileSystem.getInfoAsync(folder);
      if (!folderInfo.exists) await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
      const extension = sourceUri.split('?')[0].split('.').pop()?.toLowerCase() || 'jpg';
      const id = `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
      const destination = `${folder}${id}.${extension}`;
      await FileSystem.copyAsync({ from: sourceUri, to: destination });
      const saved: SavedPhoto = { id, uri: destination, createdAt: new Date().toISOString() };
      const updated = [saved, ...photos];
      setPhotos(updated);
      await AsyncStorage.setItem(PHOTO_STORE, JSON.stringify(updated));
    } catch {
      Alert.alert('No se pudo guardar', 'Inténtalo otra vez. Revisa el espacio disponible en el dispositivo.');
    } finally {
      setSaving(false);
    }
  }

  async function takePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) { Alert.alert('Permiso necesario', 'Activa el acceso a la cámara en los ajustes del dispositivo.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 });
    if (!result.canceled) await savePhoto(result.assets[0].uri);
  }

  async function choosePhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.85 });
    if (!result.canceled) await savePhoto(result.assets[0].uri);
  }

  function removePhoto(photo: SavedPhoto) {
    Alert.alert('Eliminar foto', '¿Quieres borrar esta foto guardada?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const updated = photos.filter(item => item.id !== photo.id);
        setPhotos(updated);
        try {
          await FileSystem.deleteAsync(photo.uri, { idempotent: true });
          await AsyncStorage.setItem(PHOTO_STORE, JSON.stringify(updated));
        } catch { Alert.alert('Aviso', 'No fue posible actualizar la lista de fotos.'); }
      } },
    ]);
  }

  return <SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>CAPTURA UN MOMENTO</Text><Text style={styles.heading}>Cámara</Text><Text style={styles.subtitle}>Tus fotos quedan guardadas en esta app.</Text>
    <View style={styles.preview}>{photos[0] ? <Image source={{ uri: photos[0].uri }} style={styles.image} /> : <View style={styles.placeholder}><View style={styles.cameraIcon}><Ionicons name="camera-outline" size={34} color={Colors.green} /></View><Text style={styles.placeholderTitle}>Tu próxima foto va aquí</Text><Text style={styles.placeholderText}>Toma una foto o elige una imagen de tu galería.</Text></View>}</View>
    <Pressable disabled={saving} onPress={takePhoto} style={[styles.primary, saving && styles.disabled]}><Ionicons name="camera" size={19} color="white" /><Text style={styles.primaryText}>{saving ? 'Guardando…' : 'Tomar una foto'}</Text></Pressable>
    <Pressable disabled={saving} onPress={choosePhoto} style={[styles.secondary, saving && styles.disabled]}><Ionicons name="images-outline" size={19} color={Colors.green} /><Text style={styles.secondaryText}>Elegir de la galería</Text></Pressable>
    <View style={styles.galleryHeader}><Text style={styles.sectionTitle}>Fotos guardadas</Text><Text style={styles.total}>{photos.length}</Text></View>
    {photos.length ? <View style={styles.grid}>{photos.map(photo => <View key={photo.id} style={styles.photoCard}><Image source={{ uri: photo.uri }} style={styles.thumbnail} /><View style={styles.photoFooter}><Text style={styles.photoDate}>{formatDateTime(photo.createdAt)}</Text><Pressable onPress={() => removePhoto(photo)} hitSlop={10} accessibilityLabel="Eliminar foto"><Ionicons name="trash-outline" size={16} color={Colors.muted} /></Pressable></View></View>)}</View> : <Text style={styles.emptyText}>Las fotos que tomes aparecerán aquí.</Text>}
  </ScrollView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: Colors.paper }, page: { padding: 22, paddingBottom: 28 }, eyebrow: { color: Colors.green, fontSize: 10, letterSpacing: 1.8, fontWeight: '700', marginTop: 14 }, heading: { color: Colors.ink, fontSize: 30, fontWeight: '700', marginTop: 5 }, subtitle: { color: Colors.muted, fontSize: 14, marginTop: 7, marginBottom: 23 }, preview: { height: 310, borderRadius: 22, overflow: 'hidden', backgroundColor: '#F0EDE5', borderWidth: 1, borderColor: Colors.line }, image: { width: '100%', height: '100%', resizeMode: 'cover' }, placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 }, cameraIcon: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.paleGreen, alignItems: 'center', justifyContent: 'center', marginBottom: 15 }, placeholderTitle: { color: Colors.ink, fontSize: 16, fontWeight: '700' }, placeholderText: { color: Colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 }, primary: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9, backgroundColor: Colors.green, padding: 15, borderRadius: 14, marginTop: 18 }, primaryText: { color: '#fff', fontSize: 14, fontWeight: '700' }, secondary: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 9, borderWidth: 1, borderColor: Colors.line, backgroundColor: Colors.card, padding: 14, borderRadius: 14, marginTop: 10 }, secondaryText: { color: Colors.green, fontSize: 14, fontWeight: '700' }, disabled: { opacity: 0.55 }, galleryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 11 }, sectionTitle: { color: Colors.ink, fontWeight: '700', fontSize: 17 }, total: { color: Colors.green, fontWeight: '700', fontSize: 13 }, grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 }, photoCard: { width: '48.5%', backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.line, borderRadius: 14, overflow: 'hidden', marginBottom: 2 }, thumbnail: { width: '100%', height: 130, resizeMode: 'cover' }, photoFooter: { minHeight: 38, paddingHorizontal: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, photoDate: { color: Colors.muted, fontSize: 10, flex: 1 }, emptyText: { color: Colors.muted, fontSize: 12, marginTop: 4 } });
