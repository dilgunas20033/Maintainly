import React, { useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import BackButton from './BackButton';

export default function ScanReceipts({ navigation }: any) {
  const [photos, setPhotos] = useState<string[]>([]);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return alert('Permissions required');
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.7, allowsEditing: false, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!res.canceled && res.assets && res.assets.length > 0) setPhotos(p => [res.assets[0].uri, ...p]);
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return alert('Camera permission required');
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled && res.assets && res.assets.length > 0) setPhotos(p => [res.assets[0].uri, ...p]);
  }

  return (
    <View style={s.wrap}>
      <BackButton onPress={() => navigation.goBack()} />
      <Text style={s.title}>Scan Receipts</Text>
      <Text style={s.caption}>Capture or pick receipt photos to keep with appliances (OCR & parsing planned later).</Text>

      <View style={{ flexDirection:'row', gap:12 }}>
        <Pressable onPress={takePhoto} style={s.btn}><Text style={s.btnText}>Take Photo</Text></Pressable>
        <Pressable onPress={pickImage} style={[s.btn, { backgroundColor:'#fff', borderWidth:1, borderColor:'#00B1F2' }]}><Text style={{ color:'#00B1F2', fontWeight:'700' }}>Pick Image</Text></Pressable>
      </View>

      <ScrollView style={{ marginTop:12 }}>
        {photos.map((u, i) => (
          <Image key={u + i} source={{ uri: u }} style={{ width: '100%', height: 220, marginBottom: 12, borderRadius: 8 }} />
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex:1, padding:16, backgroundColor:'#fff' },
  title: { fontSize:22, fontWeight:'800', marginBottom:6, marginTop:8 },
  caption: { color:'#666', marginBottom:12 },
  btn: { padding:10, backgroundColor:'#00B1F2', borderRadius:10, alignItems:'center', marginRight:8 },
  btnText: { color:'#fff', fontWeight:'700' }
});
