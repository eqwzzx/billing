"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Star, Plus, Pencil, Trash2, Eye, EyeOff, Save, X } from "lucide-react"
import Image from "next/image"

interface Testimonial {
  id: number
  name: string
  avatar_url: string | null
  game: string | null
  price: string | null
  rating: number
  text: string
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export default function TestimonialsAdminPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Partial<Testimonial>>({
    name: "",
    avatar_url: "",
    game: "",
    price: "",
    rating: 10,
    text: "",
    is_active: true,
    display_order: 0,
  })

  useEffect(() => {
    fetchTestimonials()
  }, [])

  const fetchTestimonials = async () => {
    try {
      const response = await fetch("/api/admin/testimonials")
      if (response.ok) {
        const data = await response.json()
        setTestimonials(data)
      }
    } catch (error) {
      console.error("Error fetching testimonials:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingId(null)
    setFormData({
      name: "",
      avatar_url: "",
      game: "",
      price: "",
      rating: 10,
      text: "",
      is_active: true,
      display_order: 0,
    })
  }

  const handleEdit = (testimonial: Testimonial) => {
    setIsCreating(false)
    setEditingId(testimonial.id)
    setFormData(testimonial)
  }

  const handleCancel = () => {
    setIsCreating(false)
    setEditingId(null)
    setFormData({})
  }

  const handleSave = async () => {
    try {
      const url = isCreating ? "/api/admin/testimonials" : "/api/admin/testimonials"
      const method = isCreating ? "POST" : "PUT"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        await fetchTestimonials()
        handleCancel()
      } else {
        const error = await response.json()
        alert(`Ошибка: ${error.error}`)
      }
    } catch (error) {
      console.error("Error saving testimonial:", error)
      alert("Ошибка при сохранении")
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Вы уверены, что хотите удалить этот отзыв?")) return

    try {
      const response = await fetch(`/api/admin/testimonials?id=${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchTestimonials()
      }
    } catch (error) {
      console.error("Error deleting testimonial:", error)
      alert("Ошибка при удалении")
    }
  }

  const handleToggleActive = async (testimonial: Testimonial) => {
    try {
      const response = await fetch("/api/admin/testimonials", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: testimonial.id,
          is_active: !testimonial.is_active,
        }),
      })

      if (response.ok) {
        await fetchTestimonials()
      }
    } catch (error) {
      console.error("Error toggling active status:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="size-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="flex items-center justify-center size-10 rounded-lg border border-border hover:bg-accent transition-colors"
              title="Назад в админку"
            >
              <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Управление отзывами</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Добавляйте и редактируйте отзывы клиентов на главной странице
              </p>
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
          >
            <Plus className="size-4" />
            Добавить отзыв
          </button>
        </div>

        {/* Create/Edit Form */}
        {(isCreating || editingId !== null) && (
          <div className="rounded-xl border border-border/50 bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">
              {isCreating ? "Новый отзыв" : "Редактирование отзыва"}
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Имя *</label>
                <input
                  type="text"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  placeholder="maxcraft2222"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">URL аватара</label>
                <input
                  type="text"
                  value={formData.avatar_url || ""}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  placeholder="/avatar.webp"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Игра/Тариф</label>
                <input
                  type="text"
                  value={formData.game || ""}
                  onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  placeholder="Minecraft"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Цена</label>
                <input
                  type="text"
                  value={formData.price || ""}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  placeholder="199₽"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Рейтинг (1-10) *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.rating || 10}
                  onChange={(e) =>
                    setFormData({ ...formData, rating: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Порядок отображения</label>
                <input
                  type="number"
                  value={formData.display_order || 0}
                  onChange={(e) =>
                    setFormData({ ...formData, display_order: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                  placeholder="0"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Текст отзыва *</label>
                <textarea
                  value={formData.text || ""}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground min-h-[120px]"
                  placeholder="Отличный сервис! Рекомендую..."
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active ?? true}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="size-4 rounded border-border"
                />
                <label htmlFor="is_active" className="text-sm">
                  Активен (отображается на сайте)
                </label>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                <Save className="size-4" />
                Сохранить
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted/50"
              >
                <X className="size-4" />
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Testimonials List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className={`relative rounded-xl border p-4 ${
                testimonial.is_active
                  ? "border-border/50 bg-card"
                  : "border-border/30 bg-muted/20 opacity-60"
              }`}
            >
              {/* Status Badge */}
              <div className="absolute top-2 right-2 flex items-center gap-1">
                {testimonial.is_active ? (
                  <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-1 rounded">
                    Активен
                  </span>
                ) : (
                  <span className="text-xs bg-red-500/20 text-red-600 dark:text-red-400 px-2 py-1 rounded">
                    Скрыт
                  </span>
                )}
              </div>

              {/* User Info */}
              <div className="flex items-start gap-3 mb-3 mt-6">
                <div className="relative size-12 rounded-xl overflow-hidden bg-muted/50 flex-shrink-0">
                  <Image
                    src={testimonial.avatar_url || "/placeholder-avatar.svg"}
                    alt={testimonial.name}
                    width={48}
                    height={48}
                    className="size-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{testimonial.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    {testimonial.game && (
                      <span className="text-xs text-muted-foreground">{testimonial.game}</span>
                    )}
                    {testimonial.price && (
                      <>
                        <span className="text-xs text-muted-foreground/60">•</span>
                        <span className="text-xs font-medium">
                          {testimonial.price.replace(/₽/g, '').trim()}₽
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-3 ${
                      i < testimonial.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "fill-muted/30 text-muted/30"
                    }`}
                  />
                ))}
                <span className="ml-1 text-xs font-medium">{testimonial.rating}/10</span>
              </div>

              {/* Text */}
              <p className="text-xs text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                {testimonial.text}
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleActive(testimonial)}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded hover:bg-muted/50"
                  title={testimonial.is_active ? "Скрыть" : "Показать"}
                >
                  {testimonial.is_active ? (
                    <EyeOff className="size-3" />
                  ) : (
                    <Eye className="size-3" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(testimonial)}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded hover:bg-muted/50"
                >
                  <Pencil className="size-3" />
                  Изменить
                </button>
                <button
                  onClick={() => handleDelete(testimonial.id)}
                  className="flex items-center gap-1 px-2 py-1 text-xs border border-red-500/50 text-red-600 dark:text-red-400 rounded hover:bg-red-500/10"
                >
                  <Trash2 className="size-3" />
                  Удалить
                </button>
              </div>

              {/* Meta */}
              <div className="mt-3 pt-3 border-t border-border/50 text-[10px] text-muted-foreground">
                Порядок: {testimonial.display_order} • ID: {testimonial.id}
              </div>
            </div>
          ))}
        </div>

        {testimonials.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Отзывов пока нет. Добавьте первый!</p>
          </div>
        )}
      </div>
    </div>
  )
}
