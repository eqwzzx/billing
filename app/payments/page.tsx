"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Loader2, Check, AlertCircle, ArrowLeft, Zap } from "lucide-react"
import { notify } from "@/lib/notify"

interface User {
  id: string
  email: string
  name: string | null
  balance: number
}

function PaymentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const amount = searchParams.get("amount") || "0"
  const status = searchParams.get("status")
  const orderId = searchParams.get("order")

  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [selectedMethod, setSelectedMethod] = useState<"heleket" | "platega" | "other">("heleket")
  const [promoCode, setPromoCode] = useState("")
  const [promoLoading, setPromoLoading] = useState(false)
  const [promoResult, setPromoResult] = useState<{ valid: boolean; bonus?: number; message?: string } | null>(null)
  const [processing, setProcessing] = useState(false)

  const finalAmount = parseFloat(amount) + (promoResult?.bonus || 0)
  const newBalance = user ? user.balance + (promoResult?.valid ? finalAmount : parseFloat(amount)) : 0

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      } else {
        router.push("/")
      }
    } catch {
      router.push("/")
    }
    setAuthLoading(false)
  }

  const checkPromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoResult(null)
    try {
      const res = await fetch("/api/payments/check-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, amount: parseFloat(amount) }),
      })
      const data = await res.json()
      if (res.ok && data.valid) {
        setPromoResult({ valid: true, bonus: data.bonus, message: data.message })
        notify.success(`Промокод применён! +${data.bonus} ₽`)
      } else {
        setPromoResult({ valid: false, message: data.error || "Недействителен" })
        notify.error(data.error || "Промокод недействителен")
      }
    } catch {
      setPromoResult({ valid: false, message: "Ошибка" })
      notify.error("Ошибка проверки промокода")
    }
    setPromoLoading(false)
  }

  const handlePayment = async () => {
    setProcessing(true)
    try {
      let payload: any
      let endpoint: string
      
      if (selectedMethod === "heleket") {
        payload = { amount: parseFloat(amount) / 90, currency: "USDT", promoCode: promoResult?.valid ? promoCode : null }
        endpoint = "/api/heleket/create"
      } else if (selectedMethod === "platega") {
        payload = { amount: parseFloat(amount), promoCode: promoResult?.valid ? promoCode : null }
        endpoint = "/api/platega/create"
      } else {
        notify.error("Неподдерживаемый метод")
        setProcessing(false)
        return
      }
      
      const res = await fetch(endpoint, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify(payload) 
      })
      const data = await res.json()
      
      if (res.ok && data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        notify.error(data.error || "Ошибка")
      }
    } catch {
      notify.error("Ошибка сети")
    }
    setProcessing(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!user) return null

  // Успех
  if (status === "success" && orderId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-border/50 bg-card/30 p-8 text-center">
          <div className="size-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
            <Check className="size-8 text-emerald-500" />
          </div>
          <h1 className="font-heading text-xl font-bold mb-2">Оплата успешна</h1>
          <p className="text-sm text-muted-foreground mb-6">Средства зачислены</p>
          <Link href="/client/billing" className="block w-full py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:bg-foreground/90 transition-colors">
            Готово
          </Link>
        </div>
      </div>
    )
  }

  // Ошибка
  if (status === "fail" && orderId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-border/50 bg-card/30 p-8 text-center">
          <div className="size-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <AlertCircle className="size-8 text-red-500" />
          </div>
          <h1 className="font-heading text-xl font-bold mb-2">Ошибка</h1>
          <p className="text-sm text-muted-foreground mb-6">Платёж не завершён</p>
          <Link href="/client/billing" className="block w-full py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:bg-foreground/90 transition-colors">
            Назад
          </Link>
        </div>
      </div>
    )
  }

  const methods = [
    { id: "heleket", name: "Crypto", icon: "/heleket.png" },
    { id: "platega", name: "Platega", icon: "/platega.svg" },
    { id: "other", name: "Другие способы", icon: "/support.png" },
  ] as const

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/client/billing" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="size-4" />
          Назад
        </Link>

        <div className="rounded-2xl border border-border/50 bg-card/30 overflow-hidden">
          {/* Сумма */}
          <div className="p-6 border-b border-border/50 text-center">
            <p className="text-xs text-muted-foreground mb-1">К оплате</p>
            <p className="font-heading text-4xl font-bold tabular-nums">{amount} ₽</p>
            {promoResult?.valid && promoResult.bonus && (
              <p className="text-sm text-emerald-500 mt-2">+{promoResult.bonus} ₽ бонус</p>
            )}
          </div>

          <div className="p-6 space-y-5">
            {/* Способы оплаты */}
            <div>
              <p className="text-xs text-muted-foreground mb-3">Способ оплаты</p>
              <div className="grid grid-cols-1 gap-2">
                {methods.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMethod(m.id)}
                    className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                      selectedMethod === m.id
                        ? "border-foreground/30 bg-foreground/5"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <Image src={m.icon} alt={m.name} width={20} height={20} className="rounded" />
                    <span className="text-sm">{m.name}</span>
                    {selectedMethod === m.id && <Check className="size-3.5 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Промокод */}
            <div>
              <p className="text-xs text-muted-foreground mb-3">Промокод</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value.toUpperCase()); setPromoResult(null) }}
                  placeholder="PROMO"
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border/50 bg-card/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-colors"
                />
                <button
                  onClick={checkPromo}
                  disabled={promoLoading || !promoCode.trim()}
                  className="px-4 py-2.5 rounded-xl border border-border/50 text-sm hover:bg-muted/50 disabled:opacity-50 transition-colors"
                >
                  {promoLoading ? <Loader2 className="size-4 animate-spin" /> : "OK"}
                </button>
              </div>
              {promoResult && (
                <p className={`text-xs mt-2 ${promoResult.valid ? "text-emerald-500" : "text-red-500"}`}>
                  {promoResult.valid ? "Применён" : promoResult.message}
                </p>
              )}
            </div>

            {/* Баланс */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Баланс</span>
                <span>{user.balance.toFixed(0)} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">После оплаты</span>
                <span className="text-emerald-500 font-medium">{newBalance.toFixed(0)} ₽</span>
              </div>
            </div>

            {/* Кнопка */}
            {selectedMethod === "other" ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/50 space-y-3">
                  <p className="text-sm text-foreground text-center font-medium">
                    Свяжитесь с поддержкой для оплаты другими способами
                  </p>
                  <div className="flex flex-col gap-2">
                    <a
                      href="https://t.me/fluxor_solutions"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#229ED9] hover:bg-[#229ED9]/90 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                      </svg>
                      Telegram
                    </a>
                    <a
                      href="https://discord.gg/S39VPEzdyK"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 px-4 bg-[#5865F2] hover:bg-[#5865F2]/90 text-white rounded-xl text-sm font-medium transition-colors"
                    >
                      <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                      </svg>
                      Discord
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full flex items-center justify-center gap-2 py-3 bg-foreground text-background rounded-xl text-sm font-medium hover:bg-foreground/90 disabled:opacity-50 transition-colors"
              >
                {processing ? <Loader2 className="size-4 animate-spin" /> : <><Zap className="size-4" />Оплатить</>}
              </button>
            )}

            <p className="text-xs text-center text-muted-foreground">
              <Link href="/docs" className="underline hover:text-foreground transition-colors">Условия оферты</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PaymentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <PaymentsContent />
    </Suspense>
  )
}
