// Doğrulama, istek gövdesi ve ürün verisi web projesiyle ortaktır (../src). Metro'nun proje kökü dışındaki
// bu klasörü görebilmesi için watchFolders'a eklenir. Ortak dosyaların hiçbir npm bağımlılığı yoktur.
const path = require('path')
const { getDefaultConfig } = require('expo/metro-config')

const config = getDefaultConfig(__dirname)
config.watchFolders = [path.resolve(__dirname, '../src')]

module.exports = config
