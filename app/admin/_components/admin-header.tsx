"use client"

import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { 
  Settings, Users, Server, CreditCard, Database, 
  Home, Search, Activity, Cloud, Mail, LogOut, FileText,
  HardDrive, Globe, Box, Menu, X, Link2, TrendingUp
} from "lucide-react"
import { useState } from "react"

export type Tab = "dashboard" | "users" | "servers" | "plans" | "pterodactyl" | "vmmanager" | "dedicated" | "domains" | "storagebox" | "status" | "smtp" | "logs" | "referrals" | "settings"

interface NavItem {
  id: Tab
  icon: React.ComponentType<{ className?: string }>
  label: string
}

interface AdminHeaderProps {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
  searchQuery: string
  setSearchQuery: (query: string) => void
}

export const navItems: NavItem[] = [
  { id: "dashboard", icon: Home, label: "Обзор" },
  { id: "users", icon: Users, label: "Пользователи" },
  { id: "servers", icon: Server, label: "Серверы" },
  { id: "plans", icon: CreditCard, label: "Тарифы" },
  { id: "pterodactyl", icon: Database, label: "Pterodactyl" },
  { id: "vmmanager", icon: Cloud, label: "VmManager" },
  { id: "dedicated", icon: HardDrive, label: "Дедики" },
  { id: "domains", icon: Globe, label: "Домены" },
  { id: "storagebox", icon: Box, label: "StorageBox" },
  { id: "status", icon: Activity, label: "Статус" },
  { id: "smtp", icon: Mail, label: "SMTP" },
  { id: "logs", icon: FileText, label: "Логи" },
  { id: "referrals", icon: Link2, label: "Реферальные ссылки" },
]

export function AdminHeader({ activeTab, setActiveTab, searchQuery, setSearchQuery }: AdminHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  
  return (
    <>
      <nav className="fixed top-2 sm:top-4 left-1/2 z-50 -translate-x-1/2 w-[calc(100%-1rem)] sm:w-auto max-w-[calc(100%-1rem)]">
        <div className="flex items-center justify-between gap-2 sm:gap-1 rounded-xl sm:rounded-2xl border border-border bg-background/80 px-3 sm:px-2 py-2 shadow-lg backdrop-blur-md">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 px-0 sm:px-3">
            <Image src="/logo.svg" alt="Fluxor" width={24} height={24} className="size-5 sm:size-6 brightness-0 dark:brightness-100" />
            <span className="font-heading font-bold text-sm sm:text-base text-foreground">Fluxor</span>
          </Link>
          
          <div className="h-6 w-px bg-border mx-1 hidden lg:block" />
          
          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                  activeTab === item.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <item.icon className="size-4" />
                <span className="hidden xl:block">{item.label}</span>
              </button>
            ))}
            
            {/* Маркетинг как отдельная кнопка-ссылка */}
            <Link
              href="/admin/marketing"
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <TrendingUp className="size-4" />
              <span className="hidden xl:block">Маркетинг</span>
            </Link>
            
            {/* Настройки как отдельная кнопка */}
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm transition-colors ${
                activeTab === "settings" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Settings className="size-4" />
              <span className="hidden xl:block">Настройки</span>
            </button>
          </div>
          
          <div className="h-6 w-px bg-border mx-1 hidden lg:block" />
          
          {/* Desktop Search */}
          <div className="relative hidden sm:block">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-32 md:w-48 pl-9 pr-3 py-2 rounded-xl bg-accent/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-accent"
            />
          </div>
          
          {/* Mobile/Desktop Actions */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>
            
            <Link href="/client" className="hidden sm:flex size-9 rounded-xl items-center justify-center text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
              <LogOut className="size-4" />
            </Link>
            
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex lg:hidden items-center justify-center size-8 sm:size-9 rounded-lg text-foreground transition-colors hover:bg-accent"
              aria-label="Меню"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="absolute top-16 sm:top-20 left-2 right-2 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-2xl border border-border bg-background/95 backdrop-blur-md shadow-xl animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="p-4 space-y-2">
              {/* Mobile Search */}
              <div className="relative mb-3 sm:hidden">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-accent/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-accent"
                />
              </div>

              {/* Navigation Items */}
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id)
                    setMobileMenuOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                    activeTab === item.id
                      ? "bg-foreground text-background font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <item.icon className="size-4" />
                  <span>{item.label}</span>
                </button>
              ))}
              
              {/* Маркетинг в мобильном меню */}
              <Link
                href="/admin/marketing"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                <TrendingUp className="size-4" />
                <span>Маркетинг</span>
              </Link>
              
              {/* Настройки в мобильном меню */}
              <button
                onClick={() => {
                  setActiveTab("settings")
                  setMobileMenuOpen(false)
                }}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                  activeTab === "settings"
                    ? "bg-foreground text-background font-medium"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
              >
                <Settings className="size-4" />
                <span>Настройки</span>
              </button>
              
              {/* Mobile Bottom Actions */}
              <div className="border-t border-border pt-3 mt-3 space-y-2">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-muted-foreground">Тема</span>
                  <ThemeToggle />
                </div>
                
                <Link
                  href="/client"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                >
                  <LogOut className="size-4" />
                  <span className="text-sm font-medium">Выйти из админки</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
