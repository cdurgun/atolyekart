// Web'deki src/components/RequestForm.jsx'in mobil karşılığı. Alan listesi, doğrulama ve istek gövdesi
// web ile aynı modüllerden gelir; burada yalnızca React Native arayüzü vardır.
import { useState } from 'react'
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { buildRequestBody, productSlug, requestKinds } from '../src/webhook/payload.js'
import { validateRequest } from '../src/webhook/validation.js'
import { API_URL, sendRequest } from './api.js'
import { colors, serif } from './theme.js'

const labels = {
  name: 'Adınız',
  product: 'Ürün',
  quantity: 'Adet',
  phone: 'Telefon numaranız',
  email: 'E-posta adresiniz',
}

const inputs = {
  name: { autoComplete: 'name', autoCapitalize: 'words' },
  quantity: { keyboardType: 'number-pad', maxLength: 2 },
  phone: { keyboardType: 'phone-pad', autoComplete: 'tel' },
  email: { keyboardType: 'email-address', autoComplete: 'email', autoCapitalize: 'none', autoCorrect: false },
}

const defaults = { quantity: '1', consent: false }

const successTexts = {
  order: 'Sipariş talebiniz alındı. Sizi telefonla arayacağız.',
  'stock-alert': 'Kaydınız alındı. Ürün stoğa girdiğinde e-postayla haber vereceğiz.',
}

const failureText = 'Gönderilemedi. Lütfen yeniden deneyin.'

export default function RequestForm({ kind, title, products }) {
  const { path, fields, optional } = requestKinds[kind]
  const empty = Object.fromEntries(fields.map((name) => [name, defaults[name] ?? '']))
  const [raw, setRaw] = useState(empty)
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('')

  function change(name, value) {
    setRaw({ ...raw, [name]: value })
    setErrors({ ...errors, [name]: undefined })
    setStatus('')
  }

  async function submit() {
    const result = validateRequest(raw, { fields, optional }, products.map(productSlug))
    setErrors(result.errors)
    setStatus('')
    if (Object.keys(result.errors).length) return

    const product = products.find((item) => productSlug(item) === result.values.product)
    const body = buildRequestBody(kind, result.values, product, 'mobile')

    setSending(true)
    const response = await sendRequest(path, body)
    setSending(false)
    if (response.ok) setRaw(empty)
    // Sunucu aynı kuralları yeniden uygular; reddederse alan hataları ve mesajı gösterilir.
    else if (response.errors) setErrors(Object.fromEntries(fields.filter((name) => response.errors[name]).map((name) => [name, response.errors[name]])))
    setStatus(response.ok ? successTexts[kind] : (response.message ?? failureText))
  }

  return (
    <View style={styles.form}>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      {fields.map((name) => (
        <View style={styles.field} key={name}>
          {name === 'consent' ? (
            <View style={styles.consent}>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: raw.consent }}
                accessibilityLabel="Kişisel verilerimin işlenmesine açık rıza veriyorum"
                hitSlop={12}
                onPress={() => change('consent', !raw.consent)}
                style={[styles.box, errors.consent && styles.boxInvalid]}
              >
                {raw.consent && <View style={styles.boxFill} />}
              </Pressable>
              <Text style={styles.consentText}>
                Kişisel verilerimin, talebimin karşılanması amacıyla{' '}
                <Text style={styles.link} accessibilityRole="link" onPress={() => Linking.openURL(`${API_URL}/gizlilik.html`)}>
                  Gizlilik Politikası
                </Text>
                'nda açıklandığı şekilde işlenmesine açık rıza veriyorum.
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.label}>
                {labels[name]}
                {optional.includes(name) && ' (isteğe bağlı)'}
              </Text>
              {name === 'product' ? (
                <View accessibilityRole="radiogroup">
                  {products.map((product) => {
                    const slug = productSlug(product)
                    const selected = raw.product === slug
                    return (
                      <Pressable
                        key={slug}
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        onPress={() => change('product', slug)}
                        style={[styles.option, selected && styles.optionSelected]}
                      >
                        <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{product.name}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              ) : (
                <TextInput
                  {...inputs[name]}
                  accessibilityLabel={labels[name]}
                  value={raw[name]}
                  onChangeText={(value) => change(name, value)}
                  style={[styles.input, errors[name] && styles.inputInvalid]}
                />
              )}
            </>
          )}
          {errors[name] && <Text style={styles.error}>{errors[name]}</Text>}
        </View>
      ))}
      <Pressable accessibilityRole="button" disabled={sending} onPress={submit} style={[styles.button, sending && styles.buttonDisabled]}>
        <Text style={styles.buttonText}>{title}</Text>
      </Pressable>
      {status !== '' && (
        <Text style={styles.status} accessibilityLiveRegion="polite">
          {status}
        </Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  form: { paddingTop: 16, marginTop: 32, borderTopWidth: 1, borderTopColor: colors.rule },
  title: { fontFamily: serif, fontSize: 19, fontWeight: '500', color: colors.ink },
  field: { marginTop: 16 },
  label: { fontSize: 15, color: colors.inkSoft },
  input: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.inkSoft, fontSize: 17, color: colors.ink },
  inputInvalid: { borderBottomWidth: 2, borderBottomColor: colors.ink },
  option: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.rule },
  optionSelected: { borderBottomColor: colors.ink },
  optionText: { fontSize: 17, color: colors.inkSoft },
  optionTextSelected: { color: colors.ink, fontWeight: '600' },
  consent: { flexDirection: 'row', gap: 12, marginTop: 8 },
  box: { width: 20, height: 20, marginTop: 2, padding: 3, borderWidth: 1, borderColor: colors.inkSoft },
  boxInvalid: { borderWidth: 2, borderColor: colors.ink, padding: 2 },
  boxFill: { flex: 1, backgroundColor: colors.ink },
  consentText: { flex: 1, fontSize: 15, lineHeight: 22, color: colors.inkSoft },
  link: { textDecorationLine: 'underline' },
  error: { marginTop: 6, fontSize: 15, fontWeight: '500', color: colors.ink },
  button: { alignSelf: 'flex-start', marginTop: 24, paddingVertical: 13, paddingHorizontal: 24, backgroundColor: colors.ink },
  buttonDisabled: { backgroundColor: colors.inkSoft },
  buttonText: { fontSize: 15, fontWeight: '500', color: colors.stone },
  status: { marginTop: 16, fontSize: 15, color: colors.ink },
})
