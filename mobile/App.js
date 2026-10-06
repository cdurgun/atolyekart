// Luna Atelier mobil vitrini (Expo). Ürün verisi, doğrulama ve istek gövdesi web projesiyle ortaktır;
// talepler web ile aynı /api uç noktalarına gider.
import { StatusBar } from 'expo-status-bar'
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { products } from '../src/products.js'
import { API_URL } from './api.js'
import RequestForm from './RequestForm.js'
import { colors, serif } from './theme.js'

export default function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen} edges={['top']}>
        <StatusBar style="light" />
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.header}>
              <Text style={styles.brand} accessibilityRole="header">
                Luna Atelier
              </Text>
              <Text style={styles.tagline}>El emeğiyle, sana özel.</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.heading} accessibilityRole="header">
                Ürünler
              </Text>
              {products.map((product) => (
                <View style={styles.card} key={product.name}>
                  {product.image && (
                    <Image source={{ uri: API_URL + product.image }} style={styles.image} accessibilityLabel={product.name} />
                  )}
                  <View style={styles.row}>
                    <Text style={styles.name}>{product.name}</Text>
                    <Text style={styles.name}>{product.price}</Text>
                  </View>
                  <Text style={styles.category}>{product.category}</Text>
                  <Text style={styles.description}>{product.description}</Text>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.heading} accessibilityRole="header">
                Sipariş ve Bildirim
              </Text>
              <RequestForm kind="order" title="Sipariş Ver" products={products} />
              <RequestForm kind="stock-alert" title="Stok Bildirimi İste" products={products} />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>© 2026 Luna Atelier. Tüm ürünler el emeğiyle üretilir.</Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.umber },
  flex: { flex: 1 },
  scroll: { backgroundColor: colors.stone },
  content: { flexGrow: 1 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28, backgroundColor: colors.umber },
  brand: { fontFamily: serif, fontSize: 40, color: colors.slip },
  tagline: { marginTop: 10, fontSize: 16, color: colors.amber },
  section: { paddingHorizontal: 20, paddingTop: 32 },
  heading: { fontFamily: serif, fontSize: 22, fontWeight: '500', color: colors.ink },
  card: { marginTop: 16, paddingBottom: 28, borderBottomWidth: 1, borderBottomColor: colors.rule },
  image: { width: '100%', aspectRatio: 4 / 3, marginBottom: 16, backgroundColor: colors.stoneDeep },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 16 },
  name: { fontFamily: serif, fontSize: 17, fontWeight: '500', color: colors.ink },
  category: { marginTop: 3, fontSize: 15, color: colors.inkSoft },
  description: { marginTop: 10, fontSize: 16, lineHeight: 25, color: colors.ink },
  footer: { marginTop: 40, paddingHorizontal: 20, paddingVertical: 28, backgroundColor: colors.umber },
  footerText: { fontSize: 15, color: colors.slip },
})
