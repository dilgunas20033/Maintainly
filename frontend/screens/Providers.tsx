import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, Pressable, Linking, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../lib/appContext';
import { useThemeMode } from '../lib/themeMode';
import { supabase } from '../lib/supabase';
import BackButton from './BackButton';

const BLUE = '#00B1F2';

// Removed hardcoded placeholder providers per request

function haversine(lat1:number, lon1:number, lat2:number, lon2:number) {
  const R = 3958.8; const toRad = (d:number)=>d*Math.PI/180;
  const dLat = toRad(lat2-lat1); const dLon = toRad(lon2-lon1);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

const CATS: Array<{ key: 'All' | 'Plumbing' | 'HVAC' | 'Electrical' | 'Appliance Repair' | 'Roofing'; label: string }> = [
  { key: 'All', label: 'All' },
  { key: 'Plumbing', label: 'Plumbing' },
  { key: 'HVAC', label: 'HVAC' },
  { key: 'Electrical', label: 'Electrical' },
  { key: 'Appliance Repair', label: 'Appliance' },
  { key: 'Roofing', label: 'Roofing' },
];

export default function Providers({ navigation, route }: any) {
  const { homes, currentHomeId } = useApp();
  const home = homes.find(h => h.id === currentHomeId);
  const homeLat = (home as any)?.lat ?? 26.560; const homeLon = (home as any)?.lon ?? -81.870;
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<(typeof CATS)[number]['key']>('All');
  const [loading, setLoading] = useState(true);
  const [remote, setRemote] = useState<any[]>([]);
  const { colors } = useThemeMode();

  // Optional preselected category from navigation params
  useEffect(() => {
    const pre = route?.params?.category as (typeof CATS)[number]['key'] | undefined;
    if (pre && CATS.some(c => c.key === pre)) setCat(pre);
  }, [route?.params]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase.from('providers').select('*').limit(100);
      if (!error && data) setRemote(data as any[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    // Try Overpass API to fetch nearby service providers by craft tags
    (async () => {
      if (!homeLat || !homeLon) return;
      try {
        const radius = 15000; // 15km
        const query = `[
          out:json
        ];
        (
          node(around:${radius},${homeLat},${homeLon})[craft=plumber];
          node(around:${radius},${homeLat},${homeLon})[craft=electrician];
          node(around:${radius},${homeLat},${homeLon})[craft=roofer];
          node(around:${radius},${homeLat},${homeLon})[craft=hvac];
        );
        out body;`;
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `data=${encodeURIComponent(query)}`
        });
        if (res.ok) {
          const json = await res.json();
          const mapped = (json.elements || []).map((el: any, i: number) => ({
            id: String(el.id || i),
            name: el.tags?.name || 'Local Provider',
            category: el.tags?.craft === 'plumber' ? 'Plumbing' : el.tags?.craft === 'electrician' ? 'Electrical' : el.tags?.craft === 'roofer' ? 'Roofing' : 'HVAC',
            rating: 4.5,
            reviews: 0,
            phone: el.tags?.phone || el.tags?.['contact:phone'] || '',
            website: el.tags?.website || '',
            lat: el.lat,
            lon: el.lon,
          }));
          if (mapped.length) setRemote(mapped);
        }
      } catch {}
    })();
  }, [homeLat, homeLon]);

  const list = useMemo(() => {
    return remote
      .map((d: any) => ({ ...d, distance: haversine(homeLat, homeLon, d.lat, d.lon) }))
      .filter(d => (cat === 'All' ? true : d.category === cat) && d.name.toLowerCase().includes(q.toLowerCase()))
      .sort((a,b) => a.distance - b.distance);
  }, [q, cat, homeLat, homeLon, remote]);

  function call(phone: string) {
    Linking.openURL(`tel:${phone}`).catch(() => {});
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.bg }}>
    <View style={s.wrap}>
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginTop:8 }}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[s.title, { color: colors.text }]}>Service Providers</Text>
        <View style={{ width:64 }} />
      </View>

      <TextInput
        placeholder="Search providers"
        value={q}
        onChangeText={setQ}
        style={[s.search, { borderColor: colors.primary, color: colors.text }]}
        placeholderTextColor={colors.textDim}
      />

      <View style={s.chips}>
        {CATS.map((c) => (
          <Pressable key={c.key} onPress={() => setCat(c.key)} style={[s.chip, { borderColor: colors.primary }, cat === c.key && { backgroundColor: colors.primary }]}>
            <Text style={[s.chipText, { color: cat === c.key ? '#fff' : colors.primary }]}>{c.label}</Text>
          </Pressable>
        ))}
      </View>

      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop:20 }} />}
      {(!loading && list.length === 0) && (
        <Text style={{ textAlign:'center', color: colors.textDim, marginTop: 20 }}>No providers found near your home.</Text>
      )}

      <FlatList
        data={list}
        keyExtractor={(it) => it.id}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        renderItem={({ item }) => (
          <View style={[s.row, { borderColor: colors.primary }] }>
            <View style={{ flex: 1 }}>
              <Text style={[s.name, { color: colors.text }]}>{item.name}</Text>
              <Text style={[s.meta, { color: colors.textDim }]}>{item.category} • {Number(item.rating).toFixed(1)} ★ • {item.reviews} reviews • {item.distance.toFixed(1)} mi</Text>
              {item.website && (
                <Pressable onPress={() => Linking.openURL(item.website)}><Text style={[s.link, { color: colors.primary }]}>{String(item.website).replace('https://','')}</Text></Pressable>
              )}
            </View>
            <Pressable onPress={() => call(item.phone)} style={[s.callBtn, { backgroundColor: colors.primary }]}><Text style={s.callText}>Call</Text></Pressable>
          </View>
        )}
      />
    </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: '800', marginTop: 0, marginBottom: 12, textAlign: 'center' },
  search: { height: 44, borderWidth: 2, borderRadius: 10, paddingHorizontal: 12 },
  chips: { flexDirection: 'row', gap: 8, marginVertical: 12, flexWrap: 'wrap' },
  chip: { borderWidth: 2, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontWeight: '800' },
  row: { borderWidth: 2, borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center' },
  name: { fontWeight: '800' },
  meta: { fontSize: 12 },
  callBtn: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  callText: { color: '#fff', fontWeight: '800' },
  link: { color: BLUE, fontSize: 12, marginTop: 2 },
});
