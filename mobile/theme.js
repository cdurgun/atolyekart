// Web tasarım sistemindeki (DESIGN.md) renk ve boyutların mobil karşılığı.
import { Platform } from 'react-native'

export const colors = {
  stone: '#ddd6c9',
  stoneDeep: '#d2c9b9',
  ink: '#2b211b',
  inkSoft: '#5a4a3f',
  umber: '#3a2a22',
  slip: '#ede6da',
  amber: '#d9a441',
  rule: 'rgba(43, 33, 27, 0.24)',
}

export const serif = Platform.select({ ios: 'Georgia', default: 'serif' })
