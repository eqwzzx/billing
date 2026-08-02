"use client"

import Link from "next/link"
import Image from "next/image"
import { ThemeToggle } from "@/components/theme-toggle"
import { LogOut } from "lucide-react"
import { navItems, type Tab } from "./admin-header"

interface AdminSidebarProps {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
}

export function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
  return (
    <aside className="fixed right-0 top-0 h-screen w-64 border-l border-border bg-background/80 backdrop-blur-md z-40 hidden lg:flex flex-col">
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Fluxor" width={32} height={32} className="size-8 brightness-0 dark:brightness-100" />
          <span className="font-heading font-bold text-xl text-foreground">Fluxor</span>
        </Link>
      </div>
      
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
              activeTab === item.id 
                ? "bg-foreground text-background" 
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            }`}
          >
            <item.icon className="size-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Тема</span>
          <ThemeToggle />
        </div>
        <Link 
          href="/client" 
          className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <LogOut className="size-5" />
          <span>Выйти</span>
        </Link>
      </div>
    </aside>
  )
}
