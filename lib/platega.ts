import crypto from "crypto"

const MERCHANT_ID = process.env.PLATEGA_MERCHANT_ID!
const SECRET_KEY = process.env.PLATEGA_SECRET_KEY!
const API_URL = process.env.PLATEGA_API_URL || "https://app.platega.io"

export interface CreatePaymentParams {
  amount: number
  orderId: string // Used as payload
  description: string
  callbackUrl?: string // Not used in v2 API
  redirectUrl: string // Success redirect
  payerEmail?: string // Not used in v2 API
  lifetime?: number // Not used in v2 API
  failedUrl?: string // Failed redirect
  userId?: string // For metadata (antifraud)
  userName?: string // For metadata
}

export interface PlategaPaymentResult {
  id: string
  url: string
  amount: number
  status: string
  expiresIn?: string
  rate?: number
}

export interface PlategaApiResponse {
  success?: boolean
  error?: string
  errors?: string[]
  transactionId?: string
  url?: string
  amount?: number
  status?: string
  expiresIn?: string
  rate?: number
}

/**
 * Создание платежной ссылки без заданного метода
 * POST /v2/transaction/process
 */
export async function createPayment(params: CreatePaymentParams): Promise<PlategaPaymentResult> {
  const requestData: any = {
    paymentDetails: {
      amount: params.amount,
      currency: "RUB",
    },
    description: params.description,
    return: params.redirectUrl,
    failedUrl: params.failedUrl || params.redirectUrl,
    payload: params.orderId, // Store orderId in payload
  }

  // Add metadata if userId is provided (required for antifraud)
  if (params.userId) {
    requestData.metadata = {
      userId: params.userId,
      userName: params.userName || "",
    }
  }

  const fullUrl = `${API_URL}/v2/transaction/process`
  console.log("[Platega] Creating payment:", { ...requestData, merchantId: MERCHANT_ID })
  console.log("[Platega] Request URL:", fullUrl)
  console.log("[Platega] Headers:", {
    "Content-Type": "application/json",
    "X-MerchantId": MERCHANT_ID,
    "X-Secret": SECRET_KEY ? "***" : "missing"
  })

  const response = await fetch(fullUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-MerchantId": MERCHANT_ID,
      "X-Secret": SECRET_KEY,
    },
    body: JSON.stringify(requestData),
  })

  console.log("[Platega] Response status:", response.status)

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Platega] API error:", response.status, errorText)
    throw new Error(`Platega API error: ${response.status} ${errorText}`)
  }

  const result = await response.json() as PlategaApiResponse

  console.log("[Platega] Response:", result)

  if (result.error || result.errors || !result.transactionId || !result.url) {
    const errorMsg = result.error || result.errors?.join(", ") || "Unknown error"
    throw new Error(`Platega API error: ${errorMsg}`)
  }

  return {
    id: result.transactionId,
    url: result.url,
    amount: result.amount || params.amount,
    status: result.status || "PENDING",
    expiresIn: result.expiresIn,
    rate: result.rate,
  }
}

export type PaymentStatus = "PENDING" | "PROCESSING" | "CONFIRMED" | "CANCELED" | "CHARGEBACKED"

export interface PlategaWebhookPayload {
  id: string // Transaction ID
  amount: number
  currency: string // "RUB"
  status: PaymentStatus
  paymentMethod?: number
  payload?: string // Our orderId stored here
  // Дополнительные поля для подписок (опционально)
  SubscriptionId?: string
  NextChargeAt?: string
}

/**
 * Проверка подписи webhook
 * Согласно документации, Platega отправляет заголовки X-MerchantId и X-Secret
 */
export function verifyWebhookSignature(
  payload: PlategaWebhookPayload,
  receivedMerchantId: string,
  receivedSecret: string
): boolean {
  const isValid = receivedMerchantId === MERCHANT_ID && receivedSecret === SECRET_KEY

  console.log("[Platega] Webhook signature verification:", {
    receivedMerchantId,
    expectedMerchantId: MERCHANT_ID,
    secretMatches: receivedSecret === SECRET_KEY,
    isValid,
  })

  return isValid
}

/**
 * Получение статуса платежа
 * GET /v1/transactions/{id}
 */
export async function getPaymentStatus(transactionId: string): Promise<PlategaWebhookPayload> {
  console.log("[Platega] Getting payment status:", transactionId)

  const response = await fetch(`${API_URL}/v1/transactions/${transactionId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-MerchantId": MERCHANT_ID,
      "X-Secret": SECRET_KEY,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Platega] API error:", response.status, errorText)
    throw new Error(`Platega API error: ${response.status} ${errorText}`)
  }

  const result = await response.json()

  console.log("[Platega] Status response:", result)

  return result as PlategaWebhookPayload
}

/**
 * Создание СБП-подписки (рекуррентные платежи)
 * POST /v1/subscriptions
 */
export interface CreateSubscriptionParams {
  amount: number
  interval: "DAY" | "WEEK" | "MONTH" | "YEAR"
  intervalCount?: number
  orderId: string
  description: string
  callbackUrl: string
  redirectUrl: string
  payerEmail?: string
}

export interface PlategaSubscriptionResult {
  id: string
  url: string
  amount: number
  status: string
  interval: string
  nextChargeAt?: string
}

export async function createSubscription(
  params: CreateSubscriptionParams
): Promise<PlategaSubscriptionResult> {
  const requestData = {
    amount: params.amount,
    interval: params.interval,
    intervalCount: params.intervalCount || 1,
    orderId: params.orderId,
    description: params.description,
    callbackUrl: params.callbackUrl,
    redirectUrl: params.redirectUrl,
    payerEmail: params.payerEmail,
  }

  console.log("[Platega] Creating subscription:", { ...requestData, merchantId: MERCHANT_ID })

  const response = await fetch(`${API_URL}/v1/subscriptions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-MerchantId": MERCHANT_ID,
      "X-Secret": SECRET_KEY,
    },
    body: JSON.stringify(requestData),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Platega] Subscription API error:", response.status, errorText)
    throw new Error(`Platega Subscription API error: ${response.status} ${errorText}`)
  }

  const result = await response.json() as any

  console.log("[Platega] Subscription response:", result)

  if (result.error || result.errors || !result.id || !result.url) {
    const errorMsg = result.error || result.errors?.join(", ") || "Unknown error"
    throw new Error(`Platega Subscription API error: ${errorMsg}`)
  }

  return {
    id: result.id,
    url: result.url,
    amount: result.amount || params.amount,
    status: result.status || "PENDING",
    interval: result.interval || params.interval,
    nextChargeAt: result.nextChargeAt,
  }
}

/**
 * Проверка возможности отмены транзакции
 * GET /transaction/{id}/cancel-supported
 */
export interface CancelSupportedResponse {
  supported: boolean
  totalDeductUsdt: number
  penaltyNativeAmount?: number | null
  penaltyNativeCurrency?: string | null
  penaltyUsdt?: number | null
  penaltyConversionRate?: number | null
  blockReason?: string | null
}

export async function checkCancelSupported(transactionId: string): Promise<CancelSupportedResponse> {
  console.log("[Platega] Checking cancel supported:", transactionId)

  const response = await fetch(`${API_URL}/transaction/${transactionId}/cancel-supported`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "X-MerchantId": MERCHANT_ID,
      "X-Secret": SECRET_KEY,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Platega] Check cancel supported error:", response.status, errorText)
    throw new Error(`Platega API error: ${response.status} ${errorText}`)
  }

  const result = await response.json() as CancelSupportedResponse
  console.log("[Platega] Cancel supported response:", result)

  return result
}

/**
 * Отмена транзакции (возврат средств)
 * POST /transaction/{id}/cancel
 */
export interface CancelTransactionResponse {
  transactionId: string
  accepted: boolean
  manualControlRequired: boolean
  message: string
}

export async function cancelTransaction(transactionId: string): Promise<CancelTransactionResponse> {
  console.log("[Platega] Canceling transaction:", transactionId)

  const response = await fetch(`${API_URL}/transaction/${transactionId}/cancel`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "X-MerchantId": MERCHANT_ID,
      "X-Secret": SECRET_KEY,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Platega] Cancel transaction error:", response.status, errorText)
    throw new Error(`Platega API error: ${response.status} ${errorText}`)
  }

  const result = await response.json() as CancelTransactionResponse
  console.log("[Platega] Cancel transaction response:", result)

  return result
}

/**
 * Получение балансов мерчанта
 * GET /v1/balances
 */
export interface PlategaBalance {
  currency: string
  amount: number
  hold: number
  available: number
}

export async function getBalances(): Promise<PlategaBalance[]> {
  console.log("[Platega] Getting balances")

  const response = await fetch(`${API_URL}/v1/balances`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "X-MerchantId": MERCHANT_ID,
      "X-Secret": SECRET_KEY,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Platega] Get balances error:", response.status, errorText)
    throw new Error(`Platega API error: ${response.status} ${errorText}`)
  }

  const result = await response.json()
  console.log("[Platega] Balances response:", result)

  return result as PlategaBalance[]
}

/**
 * Экспорт транзакций
 * GET /v1/transactions/export/{format}
 */
export type ExportFormat = "csv" | "excel" | "json"

export interface ExportTransactionsParams {
  from?: string // ISO date
  to?: string // ISO date
  status?: PaymentStatus
  format: ExportFormat
}

export async function exportTransactions(params: ExportTransactionsParams): Promise<string> {
  const queryParams = new URLSearchParams()
  if (params.from) queryParams.append("from", params.from)
  if (params.to) queryParams.append("to", params.to)
  if (params.status) queryParams.append("status", params.status)

  const endpoint = params.format === "excel" 
    ? `/v1/transactions/export/excel` 
    : params.format === "json"
    ? `/v1/transactions/export/json`
    : `/v1/transactions/export/csv`

  const url = `${API_URL}${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ""}`
  
  console.log("[Platega] Exporting transactions:", url)

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "X-MerchantId": MERCHANT_ID,
      "X-Secret": SECRET_KEY,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("[Platega] Export transactions error:", response.status, errorText)
    throw new Error(`Platega API error: ${response.status} ${errorText}`)
  }

  const result = await response.json()
  console.log("[Platega] Export response:", result)

  // API возвращает ссылку на файл
  return result.url || result.downloadUrl || ""
}
