import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, formatDateTime } from '../constants/theme';

type Note = { id: string; title: string; body: string; date: string };
const STORE = '@notas-al-dia/notas';

export default function NotesScreen() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => { AsyncStorage.getItem(STORE).then(value => { if (value) setNotes(JSON.parse(value)); }).catch(() => Alert.alert('Aviso', 'No fue posible cargar las notas.')).finally(() => setReady(true)); }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem(STORE, JSON.stringify(notes)).catch(() => Alert.alert('Aviso', 'No fue posible guardar los cambios.')); }, [notes, ready]);

  function addNote() {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    if (!cleanTitle && !cleanBody) return;
    setNotes(current => [{ id: Date.now().toString(), title: cleanTitle || 'Nota sin título', body: cleanBody, date: new Date().toISOString() }, ...current]);
    setTitle(''); setBody('');
  }
  function removeNote(id: string) { Alert.alert('Eliminar nota', '¿Quieres borrar esta nota?', [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: () => setNotes(items => items.filter(note => note.id !== id)) }]); }

  return <SafeAreaView style={styles.safe} edges={['top']}><KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>TU ESPACIO PERSONAL</Text><Text style={styles.heading}>Notas al día</Text></View><View style={styles.count}><Text style={styles.countText}>{notes.length}</Text></View></View>
    <Text style={styles.subtitle}>Ideas pequeñas, recuerdos importantes.</Text>
    <View style={styles.composer}><TextInput value={title} onChangeText={setTitle} placeholder="Título de la nota" placeholderTextColor={Colors.muted} style={styles.titleInput} maxLength={70} /><TextInput value={body} onChangeText={setBody} placeholder="Escribe lo que tienes en mente…" placeholderTextColor={Colors.muted} style={styles.bodyInput} multiline maxLength={1000} textAlignVertical="top" /><View style={styles.composerFooter}><Text style={styles.hint}>Se guarda automáticamente</Text><Pressable onPress={addNote} style={styles.addButton} accessibilityLabel="Guardar nota"><Ionicons name="add" size={20} color="white" /><Text style={styles.addText}>Guardar</Text></Pressable></View></View>
    <Text style={styles.sectionTitle}>Tus notas</Text>
    <FlatList data={notes} keyExtractor={item => item.id} contentContainerStyle={notes.length ? styles.list : styles.emptyList} showsVerticalScrollIndicator={false} ListEmptyComponent={<View style={styles.empty}><View style={styles.emptyIcon}><Ionicons name="leaf-outline" size={26} color={Colors.green} /></View><Text style={styles.emptyTitle}>Aquí empieza tu historia</Text><Text style={styles.emptyText}>Guarda una idea, una tarea o algo que quieras recordar.</Text></View>} renderItem={({ item }) => <View style={styles.noteCard}><View style={styles.noteTop}><Text style={styles.noteTitle}>{item.title}</Text><Pressable onPress={() => removeNote(item.id)} hitSlop={10} accessibilityLabel="Eliminar nota"><Ionicons name="trash-outline" size={17} color={Colors.muted} /></Pressable></View>{item.body ? <Text style={styles.noteBody} numberOfLines={5}>{item.body}</Text> : null}<Text style={styles.noteDate}>{formatDateTime(item.date)}</Text></View>} />
  </KeyboardAvoidingView></SafeAreaView>;
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: Colors.paper }, page: { flex: 1, paddingHorizontal: 22 }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }, eyebrow: { color: Colors.green, fontSize: 10, letterSpacing: 1.8, fontWeight: '700' }, heading: { color: Colors.ink, fontSize: 30, fontWeight: '700', marginTop: 5 }, count: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.paleGreen, alignItems: 'center', justifyContent: 'center' }, countText: { color: Colors.green, fontWeight: '700', fontSize: 16 }, subtitle: { color: Colors.muted, fontSize: 14, marginTop: 7, marginBottom: 20 }, composer: { backgroundColor: Colors.card, borderRadius: 18, borderWidth: 1, borderColor: Colors.line, padding: 16 }, titleInput: { fontSize: 16, fontWeight: '700', color: Colors.ink, paddingVertical: 3 }, bodyInput: { minHeight: 74, maxHeight: 125, fontSize: 14, lineHeight: 21, color: Colors.ink, paddingTop: 10 }, composerFooter: { borderTopWidth: 1, borderTopColor: Colors.line, paddingTop: 12, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, hint: { fontSize: 11, color: Colors.muted }, addButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.green, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 12 }, addText: { color: '#fff', fontSize: 13, fontWeight: '700' }, sectionTitle: { color: Colors.ink, fontWeight: '700', fontSize: 17, marginTop: 23, marginBottom: 12 }, list: { paddingBottom: 16, gap: 10 }, emptyList: { flexGrow: 1, justifyContent: 'center', paddingBottom: 45 }, empty: { alignItems: 'center', paddingHorizontal: 30 }, emptyIcon: { backgroundColor: Colors.paleGreen, borderRadius: 28, width: 56, height: 56, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }, emptyTitle: { color: Colors.ink, fontSize: 16, fontWeight: '700' }, emptyText: { color: Colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 19, marginTop: 6 }, noteCard: { backgroundColor: Colors.card, borderColor: Colors.line, borderWidth: 1, borderRadius: 15, padding: 15 }, noteTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, noteTitle: { color: Colors.ink, fontSize: 15, fontWeight: '700', flex: 1, marginRight: 12 }, noteBody: { color: '#59645C', fontSize: 13, lineHeight: 19, marginTop: 7 }, noteDate: { color: Colors.muted, fontSize: 10, marginTop: 10, textTransform: 'capitalize' } });
