import { NextResponse } from 'next/server'

interface CBRValute {
  CharCode: string
  Value: number
  Nominal: number
}

interface CBRResponse {
  Valute: {
    USD: CBRValute
    EUR: CBRValute
    UAH: CBRValute
  }
}

// Кеш для курсов (обновляется раз в час)
let cachedRates: any = null
let lastFetch: number = 0
const CACHE_DURATION = 60 * 60 * 1000 // 1 час

/**
 * Получает актуальные курсы с ЦБ РФ
 */
async function fetchCBRRates() {
  try {
    const response = await fetch('https://www.cbr-xml-daily.ru/daily_json.js', {
      next: { revalidate: 3600 } // Кеш на 1 час
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch CBR rates')
    }

    const data: CBRResponse = await response.json()
    
    // Конвертируем курсы ЦБ в наш формат (RUB -> валюта)
    const rates = {
      RUB: 1,
      USD: 1 / data.Valute.USD.Value,
      EUR: 1 / data.Valute.EUR.Value,
      UAH: data.Valute.UAH.Nominal / data.Valute.UAH.Value, // UAH дается за 10 гривен
    }

    return {
      rates,
      source: 'CBR',
      lastUpdated: new Date().toISOString(),
      originalRates: {
        USD: data.Valute.USD.Value,
        EUR: data.Valute.EUR.Value,
        UAH: data.Valute.UAH.Value,
      }
    }
  } catch (error) {
    console.error('Error fetching CBR rates:', error)
    
    // Fallback на статичные курсы если API недоступен
    return {
      rates: {
        RUB: 1,
        USD: 0.013,
        EUR: 0.0115,
        UAH: 0.52,
      },
      source: 'fallback',
      lastUpdated: new Date().toISOString(),
      error: 'Using fallback rates due to API error'
    }
  }
}

export async function GET() {
  const now = Date.now()
  
  // Проверяем кеш
  if (cachedRates && (now - lastFetch) < CACHE_DURATION) {
    return NextResponse.json({
      ...cachedRates,
      cached: true,
      cacheAge: Math.floor((now - lastFetch) / 1000) // возраст кеша в секундах
    })
  }

  // Получаем свежие курсы
  const ratesData = await fetchCBRRates()
  
  // Обновляем кеш
  cachedRates = ratesData
  lastFetch = now

  return NextResponse.json({
    ...ratesData,
    cached: false
  })
}
