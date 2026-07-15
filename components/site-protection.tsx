"use client"

import { useEffect } from "react"

export function SiteProtection() {
  useEffect(() => {
    // Console spam
    const spamConsole = () => {
      console.log(
        "%cFluxor Protect 🛡️",
        "color: #a855f7; font-size: 20px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.5);"
      )
    }
    const spamInterval = setInterval(spamConsole, 1000)
    spamConsole()

    // Проверка - это изображение?
    const isImage = (element: Element | null): boolean => {
      while (element) {
        const tag = element.tagName?.toLowerCase()
        if (tag === "img" || tag === "svg" || tag === "picture") {
          return true
        }
        element = element.parentElement
      }
      return false
    }

    // Блокировка контекстного меню ТОЛЬКО для изображений
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as Element
      if (isImage(target)) {
        e.preventDefault()
      }
    }

    // Блокировка горячих клавиш (только DevTools)
    const onKeyDown = (e: KeyboardEvent) => {
      // Блокируем DevTools
      if (e.key === "F12") {
        e.preventDefault()
        return
      }
      
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase()
        
        // Только Ctrl+U (просмотр исходного кода)
        if (key === "u") {
          e.preventDefault()
          return
        }
        
        // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
        if (e.shiftKey && ["i", "j", "c"].includes(key)) {
          e.preventDefault()
          return
        }
      }
    }

    // Блокировка перетаскивания изображений
    const onDragStart = (e: DragEvent) => {
      const target = e.target as Element
      if (isImage(target)) {
        e.preventDefault()
      }
    }

    document.addEventListener("contextmenu", onContextMenu)
    document.addEventListener("keydown", onKeyDown)
    document.addEventListener("dragstart", onDragStart)

    return () => {
      clearInterval(spamInterval)
      document.removeEventListener("contextmenu", onContextMenu)
      document.removeEventListener("keydown", onKeyDown)
      document.removeEventListener("dragstart", onDragStart)
    }
  }, [])

  return null
}
