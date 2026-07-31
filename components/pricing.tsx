"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Server, Cloud, Cpu, HardDrive, Database, Wifi, Code, Shield, RussianRuble, DollarSign, Euro, Lock, Zap, Flame, ArrowRight, LogIn, HelpCircle } from "lucide-react"
import { publicGamePlans } from "@/lib/public-plans"
import { formatPrice as formatCurrency, type Currency as CurrencyType, updateCurrencyRates } from "@/lib/currency"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"


const vdsPlansPromo = [
  { name: "PROMO-1", cpu: "AMD Ryzen 7 1700X PRO", vcpu: 1, ram: "2 ГБ", disk: "20 ГБ", diskType: "NVMe", network: "1 Гбит/с", location: "Finland", flag: "/finland.png", price: 110 },
  { name: "PROMO-2", cpu: "AMD Ryzen 7 1700X PRO", vcpu: 3, ram: "4 ГБ", disk: "40 ГБ", diskType: "NVMe", network: "1 Гбит/с", location: "Finland", flag: "/finland.png", price: 199 },
  { name: "PROMO-3", cpu: "AMD Ryzen 7 1700X PRO", vcpu: 4, ram: "6 ГБ", disk: "60 ГБ", diskType: "NVMe", network: "1 Гбит/с", location: "Finland", flag: "/finland.png", price: 299 },
  { name: "PROMO-4", cpu: "AMD Ryzen 7 1700X PRO", vcpu: 5, ram: "12 ГБ", disk: "80 ГБ", diskType: "NVMe", network: "1 Гбит/с", location: "Finland", flag: "/finland.png", price: 429 },
  { name: "PROMO-5", cpu: "AMD Ryzen 7 1700X PRO", vcpu: 6, ram: "16 ГБ", disk: "100 ГБ", diskType: "NVMe", network: "1 Гбит/с", location: "Finland", flag: "/finland.png", price: 579 },
  { name: "PROMO-6", cpu: "AMD Ryzen 7 1700X PRO", vcpu: 8, ram: "24 ГБ", disk: "150 ГБ", diskType: "NVMe", network: "1 Гбит/с", location: "Finland", flag: "/finland.png", price: 799 },
]

const vdsPlansStandard = [
  { name: "FI-1", cpu: "Intel Core i5-12500", vcpu: 1, ram: "2 ГБ", disk: "40 ГБ", diskType: "SSD", network: "1 Гбит/с", location: "Finland", flag: "/finland.png", price: 149 },
  { name: "FI-2", cpu: "Intel Core i5-12500", vcpu: 2, ram: "4 ГБ", disk: "80 ГБ", diskType: "SSD", network: "1 Гбит/с", location: "Finland", flag: "/finland.png", price: 319 },
  { name: "FI-3", cpu: "Intel Core i5-12500", vcpu: 4, ram: "8 ГБ", disk: "160 ГБ", diskType: "SSD", network: "1 Гбит/с", location: "Finland", flag: "/finland.png", price: 520 },
  { name: "FI-4", cpu: "Intel Core i5-12500", vcpu: 6, ram: "16 ГБ", disk: "240 ГБ", diskType: "SSD", network: "1 Гбит/с", location: "Finland", flag: "/finland.png", price: 859 },
  { name: "FI-5", cpu: "Intel Core i5-12500", vcpu: 8, ram: "24 ГБ", disk: "240 ГБ", diskType: "SSD", network: "1 Гбит/с", location: "Finland", flag: "/finland.png", price: 1099 },
  { name: "FI-6", cpu: "Intel Core i5-12500", vcpu: 12, ram: "32 ГБ", disk: "450 ГБ", diskType: "SSD", network: "1 Гбит/с", location: "Finland", flag: "/finland.png", price: 1599 },
]

// Новые тарифы Coding из файла ТАРИФЫ
const codingPlans = [
  { name: "Старт", icon: "code", vcpu: "100%", ram: "1 ГБ", disk: "10 ГБ", kernelSupport: "full", port: "1 Гбит/с", price: 99 },
  { name: "Разработка", icon: "code", vcpu: "200%", ram: "2 ГБ", disk: "20 ГБ", kernelSupport: "full", port: "1 Гбит/с", price: 199 },
  { name: "Продакшн", icon: "code", vcpu: "400%", ram: "4 ГБ", disk: "40 ГБ", kernelSupport: "full", port: "1 Гбит/с", price: 399 },
  { name: "Масштаб", icon: "code", vcpu: "800%", ram: "8 ГБ", disk: "80 ГБ", kernelSupport: "full", port: "1 Гбит/с", price: 799 },
  { name: "Дата-центр", icon: "code", vcpu: "1600%", ram: "16 ГБ", disk: "160 ГБ", kernelSupport: "full", port: "1 Гбит/с", price: 1499 },
]

const currencies = {
  RUB: { symbol: "₽", icon: RussianRuble },
  UAH: { symbol: "₴", icon: () => <span className="text-xs font-bold">₴</span> },
  USD: { symbol: "$", icon: DollarSign },
  EUR: { symbol: "€", icon: Euro },
}

type Currency = keyof typeof currencies
type VdsSubType = "standard" | "promo"
type VdsLocation = "de" | "fi"

const codingIcons: Record<string, React.ReactNode> = {
  code: <Code className="size-5 text-muted-foreground" />,
}

export function Pricing() {
  const [planType, setPlanType] = useState<"game" | "vds" | "coding">("game")
  const [currency, setCurrency] = useState<Currency>("RUB")
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [ratesLoading, setRatesLoading] = useState(true)
  const [firstOrderDiscount, setFirstOrderDiscount] = useState<number>(0)
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 })
  const [currencyIndicatorStyle, setCurrencyIndicatorStyle] = useState({ width: 0, left: 0 })
  const [vdsSubType, setVdsSubType] = useState<VdsSubType>("promo")
  const [vdsIndicatorStyle, setVdsIndicatorStyle] = useState({ width: 0, left: 0 })
  const [vdsLocation, setVdsLocation] = useState<VdsLocation>("de")
  const [locationIndicatorStyle, setLocationIndicatorStyle] = useState({ width: 0, left: 0 })
  const tabsRef = useRef<HTMLDivElement>(null)
  const currencyRef = useRef<HTMLDivElement>(null)
  const vdsTabsRef = useRef<HTMLDivElement>(null)
  const locationRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    checkAuth()
    loadCurrencyRates()
    loadFirstOrderDiscount()
  }, [])

  const loadCurrencyRates = async () => {
    try {
      await updateCurrencyRates()
      setRatesLoading(false)
    } catch (error) {
      console.error('Failed to load currency rates:', error)
      setRatesLoading(false)
    }
  }

  const loadFirstOrderDiscount = async () => {
    try {
      const res = await fetch('/api/marketing/discount/public')
      if (res.ok) {
        const data = await res.json()
        if (data.isEnabled && data.discountPercent > 0) {
          setFirstOrderDiscount(data.discountPercent)
        }
      }
    } catch (error) {
      console.error('Failed to load first order discount:', error)
    }
  }

  useEffect(() => {
    const type = searchParams.get('type')
    if (type === 'game' || type === 'vds' || type === 'coding') {
      setPlanType(type)
    }
  }, [searchParams])

  useEffect(() => {
    const handleSetType = (e: CustomEvent) => {
      const type = e.detail
      if (type === 'game' || type === 'vds' || type === 'coding') {
        setPlanType(type)
      }
    }
    window.addEventListener('setPricingType', handleSetType as EventListener)
    return () => window.removeEventListener('setPricingType', handleSetType as EventListener)
  }, [])

  useEffect(() => {
    const updateIndicator = () => {
      if (!tabsRef.current) return
      const activeButton = tabsRef.current.querySelector(`[data-type="${planType}"]`) as HTMLButtonElement
      if (activeButton) {
        setIndicatorStyle({
          width: activeButton.offsetWidth,
          left: activeButton.offsetLeft,
        })
      }
    }
    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [planType])

  useEffect(() => {
    const updateCurrencyIndicator = () => {
      if (!currencyRef.current) return
      const activeButton = currencyRef.current.querySelector(`[data-currency="${currency}"]`) as HTMLButtonElement
      if (activeButton) {
        setCurrencyIndicatorStyle({
          width: activeButton.offsetWidth,
          left: activeButton.offsetLeft,
        })
      }
    }
    updateCurrencyIndicator()
    window.addEventListener('resize', updateCurrencyIndicator)
    return () => window.removeEventListener('resize', updateCurrencyIndicator)
  }, [currency])

  useEffect(() => {
    const updateVdsIndicator = () => {
      if (!vdsTabsRef.current) return
      const activeButton = vdsTabsRef.current.querySelector(`[data-vds-type="${vdsSubType}"]`) as HTMLButtonElement
      if (activeButton) {
        setVdsIndicatorStyle({
          width: activeButton.offsetWidth,
          left: activeButton.offsetLeft,
        })
      }
    }
    updateVdsIndicator()
    window.addEventListener('resize', updateVdsIndicator)
    return () => window.removeEventListener('resize', updateVdsIndicator)
  }, [vdsSubType, planType])

  useEffect(() => {
    const updateLocationIndicator = () => {
      if (!locationRef.current) return
      const activeButton = locationRef.current.querySelector(`[data-location="${vdsLocation}"]`) as HTMLButtonElement
      if (activeButton) {
        setLocationIndicatorStyle({
          width: activeButton.offsetWidth,
          left: activeButton.offsetLeft,
        })
      }
    }
    updateLocationIndicator()
    window.addEventListener('resize', updateLocationIndicator)
    return () => window.removeEventListener('resize', updateLocationIndicator)
  }, [vdsLocation, planType, vdsSubType])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.user?.id === 'public') {
          setUser(null)
        } else {
          setUser(data.user)
        }
      }
    } catch {}
    setLoading(false)
  }

  const handleSelectPlan = () => {
    if (user) {
      router.push('/client')
    } else {
      router.push('/?auth=open')
    }
  }

  // Новые тарифы Minecraft из файла ТАРИФЫ с иконками из mcheads.ru
  const minecraftPlans = [
    { 
      name: "Кролик", 
      mob: "rabbit", 
      customImg: "https://mcheads.ru/heads/medium/front/wwfb.png",
      vcpu: "100%", ram: "2 ГБ", disk: "15 ГБ", db: "1", port: "1 Гбит/с", backups: "3", 
      price: 199
    },
    { 
      name: "Овца", 
      mob: "sheep", 
      customImg: "https://mcheads.ru/heads/medium/front/tjma.png",
      vcpu: "150%", ram: "3 ГБ", disk: "20 ГБ", db: "2", port: "1 Гбит/с", backups: "3", 
      price: 299
    },
    { 
      name: "Волк", 
      mob: "wolf", 
      customImg: "https://mcheads.ru/heads/medium/front/aufl.png",
      vcpu: "200%", ram: "4 ГБ", disk: "30 ГБ", db: "2", port: "1 Гбит/с", backups: "3", 
      price: 399
    },
    { 
      name: "Панда", 
      mob: "panda", 
      customImg: "https://mcheads.ru/heads/medium/front/uuse.png",
      vcpu: "300%", ram: "6 ГБ", disk: "45 ГБ", db: "3", port: "1 Гбит/с", backups: "3", 
      price: 599
    },
    { 
      name: "Белый медведь", 
      mob: "polar_bear", 
      customImg: "https://mcheads.ru/heads/medium/front/aglb.png",
      vcpu: "400%", ram: "8 ГБ", disk: "60 ГБ", db: "4", port: "1 Гбит/с", backups: "3", 
      price: 799
    },
    { 
      name: "Страж", 
      mob: "guardian", 
      customImg: "https://mcheads.ru/heads/medium/front/qjma.png",
      vcpu: "500%", ram: "10 ГБ", disk: "80 ГБ", db: "5", port: "1 Гбит/с", backups: "3", 
      price: 999
    },
    { 
      name: "Эндер-дракон", 
      mob: "ender_dragon", 
      customImg: "https://mcheads.ru/heads/medium/front/edld.png",
      vcpu: "600%", ram: "12 ГБ", disk: "100 ГБ", db: "6", port: "1 Гбит/с", backups: "3", 
      price: 1199
    },
    { 
      name: "Иссушитель", 
      mob: "wither", 
      customImg: "https://mcheads.ru/heads/medium/front/pzta.png",
      vcpu: "800%", ram: "16 ГБ", disk: "140 ГБ", db: "8", port: "1 Гбит/с", backups: "3", 
      price: 1599
    },
    { 
      name: "Варден", 
      mob: "warden", 
      customImg: "https://mcheads.ru/heads/medium/front/udkq.png",
      vcpu: "1200%", ram: "24 ГБ", disk: "220 ГБ", db: "10", port: "1 Гбит/с", backups: "3", 
      price: 2499
    },
  ]

  const gamePlans = minecraftPlans.map((p) => ({
    name: p.name,
    mob: p.mob,
    customImg: p.customImg,
    vcpu: p.vcpu,
    ram: p.ram,
    disk: p.disk,
    db: p.db,
    port: p.port,
    backups: p.backups,
    price: p.price,
  }))

  const getVdsPlans = () => {
    if (vdsSubType === "promo") return vdsPlansPromo
    return vdsPlansStandard
  }

  const plans = planType === "game" ? gamePlans : planType === "coding" ? codingPlans : getVdsPlans()

  // Используем утилиту для форматирования цены с автоматической конвертацией
  const formatPrice = (plan: any) => {
    return formatCurrency(plan.price, currency as CurrencyType)
  }

  // Форматирование цены со скидкой для первого заказа
  const formatPriceWithDiscount = (plan: any) => {
    const originalPrice = plan.price
    const discountedPrice = Math.round(originalPrice * (1 - firstOrderDiscount / 100))
    return {
      original: formatCurrency(originalPrice, currency as CurrencyType),
      discounted: formatCurrency(discountedPrice, currency as CurrencyType),
      discount: firstOrderDiscount
    }
  }

  return (
    <section id="pricing" className="scroll-mt-32 px-4 py-12 sm:px-8 sm:py-20 md:px-16 lg:px-24">
      <div className="max-w-[1320px] mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground sm:text-2xl md:text-3xl mb-1 sm:mb-2">
              Тарифы
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Выберите подходящий тариф для вашего сервера
            </p>
          </div>
          
          {/* Service and Currency Selection */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div ref={tabsRef} className="relative flex rounded-lg border border-border/50 bg-card/50 p-1 overflow-x-auto scrollbar-hide">
              <div
                className="absolute top-1 h-[calc(100%-8px)] rounded-md bg-primary transition-all duration-300 ease-out"
                style={{
                  width: indicatorStyle.width,
                  left: indicatorStyle.left,
                }}
              />
              <button
                data-type="game"
                onClick={() => setPlanType("game")}
                className={`relative z-10 flex items-center gap-1 sm:gap-1.5 rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap ${
                  planType === "game" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Server className="size-3.5 sm:size-4" />
                Minecraft
              </button>
              <button
                data-type="coding"
                onClick={() => setPlanType("coding")}
                className={`relative z-10 flex items-center gap-1 sm:gap-1.5 rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium whitespace-nowrap ${
                  planType === "coding" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code className="size-3.5 sm:size-4" />
                Coding
              </button>
            </div>

            <div ref={currencyRef} className="relative flex rounded-lg border border-border/50 bg-card/50 p-1 self-start sm:self-auto">
              <div
                className="absolute top-1 h-[calc(100%-8px)] rounded-md bg-primary transition-all duration-300 ease-out"
                style={{
                  width: currencyIndicatorStyle.width,
                  left: currencyIndicatorStyle.left,
                }}
              />
              {(Object.keys(currencies) as Currency[]).map((cur) => {
                const CurrencyIcon = currencies[cur].icon
                return (
                  <button
                    key={cur}
                    data-currency={cur}
                    onClick={() => setCurrency(cur)}
                    className={`relative z-10 flex items-center gap-1 rounded-md px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium ${
                      currency === cur ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <CurrencyIcon className="size-3 sm:size-3.5" />
                    {cur}
                  </button>
                )
              })}
            </div>
          </div>
        </div>



        {/* Pricing Grid */}
        {planType === "vds" ? (
          <div className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="relative rounded-2xl border-2 border-dashed border-border/50 bg-card/30 backdrop-blur-sm p-8 sm:p-12 max-w-md text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Cloud className="size-16 sm:size-20 text-muted-foreground/30" />
                  <div className="absolute -top-1 -right-1 flex size-8 sm:size-10 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                    <Lock className="size-4 sm:size-5 text-primary/60" />
                  </div>
                </div>
                <div>
                  <h3 className="font-heading text-xl sm:text-2xl font-bold text-foreground mb-2">
                    VDS тарифы
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    Скоро будут доступны мощные VDS серверы с лучшими характеристиками
                  </p>
                </div>
                <div className="mt-2 px-4 py-2 rounded-lg bg-primary/5 border border-primary/10">
                  <span className="text-xs sm:text-sm font-medium text-primary/80">
                    Следите за обновлениями
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan, index) => (
              <div
                key={plan.name}
                className="relative rounded-xl sm:rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
                {/* Promo badge - removed */}
                {/* Header */}
                <div className="p-4 sm:p-5 pb-3 sm:pb-4">
                  <div className="flex items-center gap-3">
                    {planType === "game" && "mob" in plan ? (
                      <img
                        src={(plan as typeof gamePlans[0]).customImg || `https://mc-heads.net/head/${(plan as typeof gamePlans[0]).mob}`}
                        alt={plan.name}
                        className="size-11 sm:size-12 rounded-xl"
                      />
                    ) : planType === "coding" && "icon" in plan ? (
                      <div className="flex size-11 sm:size-12 items-center justify-center rounded-xl bg-muted/50">
                        {codingIcons[(plan as typeof codingPlans[0]).icon]}
                      </div>
                    ) : (
                      <div className="flex size-11 sm:size-12 items-center justify-center rounded-xl bg-muted/50">
                        <Cloud className="size-5 sm:size-6 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">{plan.name}</h3>
                      <span className="text-[10px] sm:text-xs text-muted-foreground/80 uppercase tracking-wider">
                        {planType === "game" ? "Minecraft" : planType === "coding" ? "Coding" : "VDS"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="border-y border-border/30 bg-muted/30 px-4 sm:px-5 py-2.5 sm:py-3">
                  {firstOrderDiscount > 0 ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className="font-heading text-xl sm:text-2xl font-bold text-foreground transition-all duration-300">
                              {formatPriceWithDiscount(plan).discounted}
                            </span>
                            <span className="text-[10px] sm:text-xs text-muted-foreground">/мес</span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] sm:text-xs text-muted-foreground/70 line-through">
                              {formatPriceWithDiscount(plan).original}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20">
                            <Flame className="size-3 sm:size-3.5 text-orange-500" />
                            <span className="text-[10px] sm:text-xs font-bold text-orange-500">
                              -{formatPriceWithDiscount(plan).discount}%
                            </span>
                          </div>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center justify-center size-6 sm:size-7 rounded border border-border/50 bg-muted/50 cursor-help hover:bg-muted transition-colors">
                                  <HelpCircle className="size-3 sm:size-3.5 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="text-sm">Только на первый заказ</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className="font-heading text-xl sm:text-2xl font-bold text-foreground transition-all duration-300">{formatPrice(plan)}</span>
                      <span className="text-[10px] sm:text-xs text-muted-foreground">/мес</span>
                    </div>
                  )}
                </div>

                {/* Specs */}
                <div className="p-4 sm:p-5 pt-3 sm:pt-4">
                  <div className="space-y-2">
                    {/* CPU for VDS */}
                    {planType === "vds" && "cpu" in plan && (
                      <>
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <Cpu className="size-3.5 sm:size-4 text-muted-foreground" />
                            <span className="text-muted-foreground">CPU</span>
                          </div>
                          <span className="font-medium text-foreground bg-muted/50 px-2 py-0.5 rounded-md text-[10px] sm:text-xs">{(plan as typeof vdsPlansPromo[0]).cpu}</span>
                        </div>
                        <div className="h-px bg-border/30" />
                      </>
                    )}
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <Cpu className="size-3.5 sm:size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">vCPU</span>
                      </div>
                      <span className="font-medium text-foreground bg-muted/50 px-2 py-0.5 rounded-md">{plan.vcpu}</span>
                    </div>
                    <div className="h-px bg-border/30" />
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <Server className="size-3.5 sm:size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">RAM</span>
                      </div>
                      <span className="font-medium text-foreground bg-muted/50 px-2 py-0.5 rounded-md">{plan.ram}</span>
                    </div>
                    <div className="h-px bg-border/30" />
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <HardDrive className="size-3.5 sm:size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">{planType === "vds" ? (plan as typeof vdsPlansPromo[0]).diskType : "NVMe"}</span>
                      </div>
                      <span className="font-medium text-foreground bg-muted/50 px-2 py-0.5 rounded-md">{plan.disk}</span>
                    </div>
                    {planType === "game" && "db" in plan && (
                      <>
                        <div className="h-px bg-border/30" />
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <Database className="size-3.5 sm:size-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Базы данных</span>
                          </div>
                          <span className="font-medium text-foreground bg-muted/50 px-2 py-0.5 rounded-md">{(plan as typeof gamePlans[0]).db}</span>
                        </div>
                      </>
                    )}
                    <div className="h-px bg-border/30" />
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <Wifi className="size-3.5 sm:size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Сеть</span>
                      </div>
                      <span className="font-medium text-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                        {planType === "vds" ? (plan as typeof vdsPlansPromo[0]).network : (plan as typeof gamePlans[0]).port}
                      </span>
                    </div>
                    {/* Location for VDS */}
                    {planType === "vds" && "location" in plan && (
                      <>
                        <div className="h-px bg-border/30" />
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <img src={(plan as typeof vdsPlansPromo[0]).flag} alt={(plan as typeof vdsPlansPromo[0]).location} className="size-3.5 sm:size-4 rounded-sm" />
                            <span className="text-muted-foreground">Локация</span>
                          </div>
                          <span className="font-medium text-foreground bg-muted/50 px-2 py-0.5 rounded-md">{(plan as typeof vdsPlansPromo[0]).location}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {planType === "coding" && "kernelSupport" in plan && (
                    <>
                      <div className="h-px bg-border/30 my-2" />
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <Code className="size-3.5 sm:size-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Поддержка</span>
                        </div>
                        <div className="flex gap-1.5 bg-muted/50 px-2 py-1 rounded-md">
                          <img src="/nodejs.png" alt="Node.js" className="size-4" title="Node.js" />
                          <img src="/python.png" alt="Python" className="size-4" title="Python" />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Button */}
                  <div className="mt-3 sm:mt-4">
                    {loading ? (
                      <button disabled className="w-full rounded-xl border border-border/50 bg-muted/30 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-muted-foreground">
                        Загрузка...
                      </button>
                    ) : (
                      <button 
                        onClick={handleSelectPlan}
                        className="w-full rounded-xl bg-foreground py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-background flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                      >
                        {user ? (
                          <>
                            Выбрать тариф
                            <ArrowRight className="size-4" />
                          </>
                        ) : (
                          <>
                            <LogIn className="size-4" />
                            Войти и выбрать
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
