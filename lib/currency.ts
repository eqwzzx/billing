// Курсы валют относительно рубля
// Эти курсы используются как fallback если API недоступен
// Автоматически обновляются через API ЦБ РФ
export let CURRENCY_RATES = {
  RUB: 1,
  USD: 0.013,   // ~77 RUB за 1 USD (fallback)
  EUR: 0.0115,  // ~87 RUB за 1 EUR (fallback)
  UAH: 0.52,    // ~1.92 RUB за 1 UAH (fallback)
}

// Кеш для курсов
let cachedRates: typeof CURRENCY_RATES | null = null
let lastFetch = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1 час

/**
 * Получает актуальные курсы валют с API
 */
export async function updateCurrencyRates(): Promise<void> {
  const now = Date.now()
  
  // Используем кеш если он свежий
  if (cachedRates && (now - lastFetch) < CACHE_DURATION) {
    CURRENCY_RATES = cachedRates
    return
  }

  try {
    const response = await fetch('/api/currency/rates')
    if (!response.ok) throw new Error('Failed to fetch rates')
    
    const data = await response.json()
    
    if (data.rates) {
      cachedRates = data.rates
      CURRENCY_RATES = data.rates
      lastFetch = now
      
      console.log('✅ Currency rates updated:', {
        source: data.source,
        lastUpdated: data.lastUpdated,
        rates: data.rates
      })
    }
  } catch (error) {
    console.warn('⚠️ Failed to update currency rates, using fallback:', error)
  }
}

/**
 * Получает текущие курсы (с автообновлением)
 */
export async function getCurrencyRates() {
  await updateCurrencyRates()
  return CURRENCY_RATES
}

export type Currency = 'RUB' | 'USD' | 'EUR' | 'UAH'

export interface CurrencyInfo {
  symbol: string
  rate: number
  decimals: number // количество знаков после запятой
}

export const CURRENCIES: Record<Currency, CurrencyInfo> = {
  RUB: { symbol: '₽', rate: CURRENCY_RATES.RUB, decimals: 0 },
  USD: { symbol: '$', rate: CURRENCY_RATES.USD, decimals: 2 },
  EUR: { symbol: '€', rate: CURRENCY_RATES.EUR, decimals: 2 },
  UAH: { symbol: '₴', rate: CURRENCY_RATES.UAH, decimals: 0 },
}

/**
 * Конвертирует цену из рублей в указанную валюту
 */
export function convertPrice(priceRUB: number, currency: Currency): number {
  const rate = CURRENCY_RATES[currency]
  return priceRUB * rate
}

/**
 * Форматирует цену с учетом валюты
 */
export function formatPrice(priceRUB: number, currency: Currency): string {
  const currencyInfo = CURRENCIES[currency]
  const converted = convertPrice(priceRUB, currency)
  
  if (currencyInfo.decimals === 0) {
    // Для RUB и UAH - без десятичных знаков
    return `${Math.round(converted)} ${currencyInfo.symbol}`
  } else {
    // Для USD и EUR - с 2 знаками
    if (currency === 'USD') {
      return `${currencyInfo.symbol}${converted.toFixed(2)}`
    } else {
      return `${currencyInfo.symbol}${converted.toFixed(2)}`
    }
  }
}

/**
 * Получает символ валюты
 */
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCIES[currency].symbol
}
