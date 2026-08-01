"use client"

import Link from "next/link"
import { Server, Plus, Wallet, ExternalLink, ChevronRight, Gauge, Layers, Cpu, HardDrive, Zap, CreditCard, Banknote, KeyRound, Loader2, Monitor, Globe, Box } from "lucide-react"
import { User, ServerData, VdsServer } from "../types"
import { useState, useEffect } from "react"
import { notify } from "@/lib/notify"

interface DashboardTabProps {
  user: User
  servers: ServerData[]
  vdsServers?: VdsServer[]
}

interface OtherService {
  id: string
  name: string
  status: string
  paidAmount: number | null
}

export function DashboardTab({ user, servers, vdsServers = [] }: DashboardTabProps) {
  const [otherServices, setOtherServices] = useState<{
    dedicated: OtherService[]
    domains: OtherService[]
    storageBoxes: OtherService[]
  }>({ dedicated: [], domains: [], storageBoxes: [] })
  
  useEffect(() => {
    loadOtherServices()
  }, [])
  
  const loadOtherServices = async () => {
    try {
      const r = await fetch('/api/user/services')
      if (r.ok) {
        const data = await r.json()
        setOtherServices({
          dedicated: data.dedicated || [],
          domains: data.domains || [],
          storageBoxes: data.storageBoxes || [],
        })
      }
    } catch (error) {
      console.error('[Dashboard Services]', error)
    }
  }
  
  const activeServers = servers.filter(s => s.status === 'ACTIVE').length
  const activeVdsServers = vdsServers.filter(s => s.status === 'ACTIVE').length
  const activeDedicated = otherServices.dedicated.filter(s => s.status === 'ACTIVE').length
  const activeDomains = otherServices.domains.filter(s => s.status === 'ACTIVE').length
  const activeStorageBoxes = otherServices.storageBoxes.filter(s => s.status === 'ACTIVE').length
  const totalActiveServers = activeServers + activeVdsServers + activeDedicated + activeDomains + activeStorageBoxes
  const totalServers = servers.length + vdsServers.length + otherServices.dedicated.length + otherServices.domains.length + otherServices.storageBoxes.length
  const monthlySpend = servers.reduce((acc, s) => acc + s.plan.price, 0) + 
                       vdsServers.reduce((acc, s) => acc + (s.price || 0), 0) +
                       otherServices.dedicated.reduce((acc, s) => acc + (s.paidAmount || 0), 0) +
                       otherServices.domains.reduce((acc, s) => acc + (s.paidAmount || 0), 0) +
                       otherServices.storageBoxes.reduce((acc, s) => acc + (s.paidAmount || 0), 0)
  const greeting = new Date().getHours() < 12 ? "Доброе утро" : new Date().getHours() < 18 ? "Добрый день" : "Добрый вечер"
  const [resettingPassword, setResettingPassword] = useState(false)
  const [openingVdsPanel, setOpeningVdsPanel] = useState(false)

  const handleResetPterodactylPassword = async () => {
    setResettingPassword(true)
    try {
      const res = await fetch('/api/user/pterodactyl/reset-password', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        notify.success('Новый пароль отправлен на почту!')
      } else {
        notify.error(data.error || 'Ошибка сброса пароля')
      }
    } catch {
      notify.error('Ошибка сети')
    }
    setResettingPassword(false)
  }

  const handleOpenVdsPanel = async () => {
    setOpeningVdsPanel(true)
    try {
      const res = await fetch('/api/user/vds/sso')
      const data = await res.json()
      if (res.ok) {
        // Открываем SSO ссылку или просто панель
        const url = data.ssoUrl || data.panelUrl
        if (url) {
          window.open(url, '_blank')
        } else {
          notify.error('Не удалось получить ссылку на панель')
        }
      } else {
        notify.error(data.error || 'Ошибка открытия панели')
      }
    } catch {
      notify.error('Ошибка сети')
    }
    setOpeningVdsPanel(false)
  }

  return (
    <div className="max-w-5xl mx-auto pb-8 px-3 sm:px-4">
      {/* Hero with Background Image */}
      <div className="relative rounded-2xl overflow-hidden mb-4 sm:mb-6 border border-border/50 bg-card/30 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div 
          className="absolute inset-0"
          style={{ backgroundImage: 'url(/fon.jpg)', backgroundPosition: 'center 55%', backgroundSize: 'cover' }}
        />
        <div className="absolute inset-0 bg-black/50" />
        
        <div className="relative z-10 p-4 sm:p-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-white/60 text-xs sm:text-sm mb-1">{greeting}</p>
              <h1 className="font-heading text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span className="truncate">{user.name || user.email.split('@')[0]}</span>
                <img src="/nya.png" alt="" className="size-6 sm:size-7 flex-shrink-0" />
              </h1>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-xs mb-1">Баланс</p>
              <p className="text-xl sm:text-2xl font-bold text-white tabular-nums transition-all duration-300">{user.balance.toFixed(0)} ₽</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 sm:mt-5">
            <Link 
              href="/client/create"
              className="flex items-center gap-2 rounded-xl bg-white px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-black hover:bg-white/90 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <Zap className="size-3.5 sm:size-4" />
              Создать сервер
            </Link>
            <Link 
              href="/client/billing"
              className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
            >
              <CreditCard className="size-3.5 sm:size-4" />
              Пополнить
            </Link>
          </div>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Servers List - Large */}
        <div className="sm:col-span-2 lg:col-span-4 lg:row-span-2 rounded-2xl border border-border/50 bg-card/30 p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '100ms', animationFillMode: 'both' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <Layers className="size-3.5 sm:size-4 text-muted-foreground" />
              <h2 className="font-heading font-semibold text-sm sm:text-base text-foreground">Серверы</h2>
            </div>
            <Link href="/client/servers" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              Все <ChevronRight className="size-3" />
            </Link>
          </div>
          
          {totalServers === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 sm:py-12">
              <div className="size-12 sm:size-14 rounded-2xl bg-muted/30 flex items-center justify-center mb-3 sm:mb-4">
                <Cpu className="size-5 sm:size-6 text-muted-foreground" />
              </div>
              <p className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">Нет серверов</p>
              <Link 
                href="/client/create"
                className="flex items-center gap-2 rounded-lg bg-foreground px-4 py-2 text-xs sm:text-sm font-medium text-background"
              >
                <Plus className="size-3.5 sm:size-4" />
                Создать первый
              </Link>
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-2">
              {/* Обычные серверы */}
              {servers.slice(0, 4).map((server) => {
                const isActive = server.status === 'ACTIVE'
                return (
                  <div 
                    key={server.id} 
                    className="group flex items-center gap-2 sm:gap-4 p-2.5 sm:p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-all"
                  >
                    <div className={`size-8 sm:size-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-emerald-500/10' : 'bg-muted/50'}`}>
                      <HardDrive className={`size-3.5 sm:size-4 ${isActive ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <p className="font-medium text-xs sm:text-sm text-foreground truncate">{server.name}</p>
                        <span className={`size-1.5 sm:size-2 rounded-full flex-shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                      </div>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{server.plan.name} • {server.plan.price}₽/мес</p>
                    </div>
                    {server.pterodactylIdentifier && (
                      <a 
                        href={`${process.env.NEXT_PUBLIC_PTERODACTYL_URL || 'https://control.fluxor.solutions'}/server/${server.pterodactylIdentifier}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 size-7 sm:size-8 rounded-lg bg-foreground/10 flex items-center justify-center hover:bg-foreground/20 transition-all flex-shrink-0"
                      >
                        <ExternalLink className="size-3 sm:size-3.5 text-foreground" />
                      </a>
                    )}
                  </div>
                )
              })}
              
              {/* VDS серверы */}
              {vdsServers.slice(0, 4).map((vdsServer) => {
                const isActive = vdsServer.status === 'ACTIVE' || vdsServer.status === 'running'
                return (
                  <div 
                    key={`vds-${vdsServer.id}`} 
                    className="group flex items-center gap-4 p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-all"
                  >
                    <div className={`size-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-blue-500/10' : 'bg-muted/50'}`}>
                      <Monitor className={`size-4 ${isActive ? 'text-blue-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground truncate">{vdsServer.name}</p>
                        <span className="text-xs bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded">VDS</span>
                        <span className={`size-2 rounded-full ${isActive ? 'bg-blue-500' : 'bg-muted-foreground'}`} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {vdsServer.planName || 'VDS'} • {vdsServer.price || 0}₽/мес
                      </p>
                    </div>
                    {vdsServer.panelUrl && (
                      <a 
                        href={vdsServer.panelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="opacity-0 group-hover:opacity-100 size-8 rounded-lg bg-foreground/10 flex items-center justify-center hover:bg-foreground/20 transition-all"
                      >
                        <ExternalLink className="size-3.5 text-foreground" />
                      </a>
                    )}
                  </div>
                )
              })}
              
              {/* Dedicated серверы */}
              {otherServices.dedicated.slice(0, 1).map((service) => {
                const isActive = service.status === 'ACTIVE'
                return (
                  <div 
                    key={`dedicated-${service.id}`} 
                    className="group flex items-center gap-4 p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-all"
                  >
                    <div className={`size-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-purple-500/10' : 'bg-muted/50'}`}>
                      <Server className={`size-4 ${isActive ? 'text-purple-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground truncate">{service.name}</p>
                        <span className="text-xs bg-purple-500/10 text-purple-500 px-1.5 py-0.5 rounded">Dedicated</span>
                        <span className={`size-2 rounded-full ${isActive ? 'bg-purple-500' : 'bg-muted-foreground'}`} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Dedicated • {service.paidAmount || 0}₽/мес
                      </p>
                    </div>
                  </div>
                )
              })}
              
              {/* Домены */}
              {otherServices.domains.slice(0, 1).map((service) => {
                const isActive = service.status === 'ACTIVE'
                return (
                  <div 
                    key={`domain-${service.id}`} 
                    className="group flex items-center gap-4 p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-all"
                  >
                    <div className={`size-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-cyan-500/10' : 'bg-muted/50'}`}>
                      <Globe className={`size-4 ${isActive ? 'text-cyan-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground truncate">{service.name}</p>
                        <span className="text-xs bg-cyan-500/10 text-cyan-500 px-1.5 py-0.5 rounded">Домен</span>
                        <span className={`size-2 rounded-full ${isActive ? 'bg-cyan-500' : 'bg-muted-foreground'}`} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Домен • {service.paidAmount || 0}₽/мес
                      </p>
                    </div>
                  </div>
                )
              })}
              
              {/* StorageBox */}
              {otherServices.storageBoxes.slice(0, 1).map((service) => {
                const isActive = service.status === 'ACTIVE'
                return (
                  <div 
                    key={`storage-${service.id}`} 
                    className="group flex items-center gap-4 p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-all"
                  >
                    <div className={`size-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-amber-500/10' : 'bg-muted/50'}`}>
                      <Box className={`size-4 ${isActive ? 'text-amber-500' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-foreground truncate">{service.name}</p>
                        <span className="text-xs bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">Storage</span>
                        <span className={`size-2 rounded-full ${isActive ? 'bg-amber-500' : 'bg-muted-foreground'}`} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        StorageBox • {service.paidAmount || 0}₽/мес
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="sm:col-span-1 lg:col-span-2 rounded-2xl border border-border/50 bg-card/30 p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '150ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="size-8 sm:size-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Gauge className="size-4 sm:size-5 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Активных</p>
              <p className="text-lg sm:text-xl font-bold text-foreground">{totalActiveServers}<span className="text-xs sm:text-sm text-muted-foreground font-normal">/{totalServers}</span></p>
            </div>
          </div>
          {/* Donut Chart */}
          <div className="flex items-center justify-center">
            <svg className="size-20 sm:size-24 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
              <circle 
                cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" 
                strokeDasharray={`${totalServers ? (totalActiveServers / totalServers) * 88 : 0} 88`}
                strokeLinecap="round"
                className="text-blue-500 transition-all duration-500"
              />
            </svg>
            <div className="absolute text-center">
              <p className="text-base sm:text-lg font-bold text-foreground">{totalServers ? Math.round((totalActiveServers / totalServers) * 100) : 0}%</p>
            </div>
          </div>
        </div>

        <div className="sm:col-span-1 lg:col-span-2 rounded-2xl border border-border/50 bg-card/30 p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '200ms', animationFillMode: 'both' }}>
          <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
            <div className="size-8 sm:size-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Banknote className="size-4 sm:size-5 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">В месяц</p>
              <p className="text-lg sm:text-xl font-bold text-foreground">{monthlySpend}<span className="text-xs sm:text-sm text-muted-foreground font-normal ml-1">₽</span></p>
            </div>
          </div>
          {/* Bar Chart */}
          <div className="flex items-end gap-0.5 sm:gap-1 h-12 sm:h-16">
            {[40, 65, 45, 80, 55, 70, monthlySpend > 0 ? 90 : 30].map((h, i) => (
              <div 
                key={i} 
                className={`flex-1 rounded-t transition-all duration-500 ${i === 6 ? 'bg-amber-500' : 'bg-muted/30'}`}
                style={{ height: `${h}%`, transitionDelay: `${i * 50}ms` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] text-muted-foreground">
            <span>Пн</span>
            <span>Вт</span>
            <span>Ср</span>
            <span>Чт</span>
            <span>Пт</span>
            <span>Сб</span>
            <span>Вс</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="sm:col-span-2 lg:col-span-6 rounded-2xl border border-border/50 bg-card/30 p-4 sm:p-5 animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '250ms', animationFillMode: 'both' }}>
          <p className="text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3">Быстрые действия</p>
          <div className="grid grid-cols-3 sm:flex gap-2">
            {[
              { href: "/client/create", label: "Создать", icon: Zap },
              { href: "/client/servers", label: "Серверы", icon: Layers },
              { href: "/client/billing", label: "Баланс", icon: Wallet },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl bg-muted/20 hover:bg-muted/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                <item.icon className="size-4 sm:size-5 text-muted-foreground" />
                <span className="text-[10px] sm:text-xs font-medium text-foreground">{item.label}</span>
              </Link>
            ))}
            <button
              onClick={handleResetPterodactylPassword}
              disabled={resettingPassword}
              className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl bg-muted/20 hover:bg-muted/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            >
              {resettingPassword ? <Loader2 className="size-4 sm:size-5 text-muted-foreground animate-spin" /> : <KeyRound className="size-4 sm:size-5 text-muted-foreground" />}
              <span className="text-[10px] sm:text-xs font-medium text-foreground">Пароль</span>
            </button>
            {/* VDS кнопка скрыта до запуска */}
            {/* <button
              onClick={handleOpenVdsPanel}
              disabled={openingVdsPanel}
              className="flex-1 flex flex-col items-center gap-1.5 sm:gap-2 p-2.5 sm:p-3 rounded-xl bg-muted/20 hover:bg-muted/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
            >
              {openingVdsPanel ? <Loader2 className="size-4 sm:size-5 text-muted-foreground animate-spin" /> : <Monitor className="size-4 sm:size-5 text-muted-foreground" />}
              <span className="text-[10px] sm:text-xs font-medium text-foreground">VDS</span>
            </button> */}
          </div>
        </div>
      </div>
    </div>
  )
}
