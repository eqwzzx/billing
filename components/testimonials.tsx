"use client"

import { useState, useEffect, useRef } from "react"
import { Star, Quote } from "lucide-react"
import Image from "next/image"

interface Testimonial {
  id: number
  name: string
  avatar_url: string | null
  game: string | null
  price: string | null
  rating: number
  text: string
}

const placeholderTestimonials: Testimonial[] = [
  {
    id: 1,
    name: "Ваше имя здесь",
    avatar_url: null,
    game: "Ваш тариф",
    price: "___",
    rating: 10,
    text: "Здесь может быть ваш отзыв! Станьте нашим клиентом и поделитесь впечатлениями о сервисе. Мы ценим каждое мнение и постоянно работаем над улучшением качества наших услуг.",
  },
  {
    id: 2,
    name: "Будущий клиент",
    avatar_url: null,
    game: "Любая игра",
    price: "от 99",
    rating: 10,
    text: "Расскажите другим пользователям о своем опыте использования наших серверов. Ваш отзыв поможет нам стать лучше и поможет другим сделать правильный выбор!",
  },
  {
    id: 3,
    name: "Следующий отзыв",
    avatar_url: null,
    game: "Minecraft / Rust / CS",
    price: "299",
    rating: 10,
    text: "Мы постоянно совершенствуем наш сервис и хотим услышать ваше мнение. Напишите нам о вашем опыте, и мы с радостью разместим ваш отзыв на главной странице!",
  },
]

export function Testimonials() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)
  const [indicatorStyle, setIndicatorStyle] = useState({ width: 0, left: 0 })
  const dotsRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollerRef = useRef<HTMLDivElement>(null)

  // Загрузка отзывов из API
  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await fetch("/api/testimonials")
        if (response.ok) {
          const data = await response.json()
          setTestimonials(data.length > 0 ? data : placeholderTestimonials)
        } else {
          setTestimonials(placeholderTestimonials)
        }
      } catch (error) {
        console.error("Error fetching testimonials:", error)
        setTestimonials(placeholderTestimonials)
      } finally {
        setLoading(false)
      }
    }
    fetchTestimonials()
  }, [])

  // Бесконечная прокрутка для > 3 отзывов
  useEffect(() => {
    if (testimonials.length <= 3 || !scrollerRef.current) return

    const scroller = scrollerRef.current
    let scrollPosition = 0
    let animationFrameId: number

    const scroll = () => {
      scrollPosition += 0.5 // Скорость прокрутки (пиксели за кадр)
      
      const cardWidth = 320 + 16 // ширина карточки + gap
      const totalWidth = cardWidth * testimonials.length
      
      // Сброс позиции когда прокрутили первый набор полностью
      if (scrollPosition >= totalWidth) {
        scrollPosition = 0
      }
      
      scroller.style.transform = `translateX(-${scrollPosition}px)`
      animationFrameId = requestAnimationFrame(scroll)
    }

    animationFrameId = requestAnimationFrame(scroll)

    // Пауза при наведении
    const handleMouseEnter = () => cancelAnimationFrame(animationFrameId)
    const handleMouseLeave = () => {
      animationFrameId = requestAnimationFrame(scroll)
    }

    scroller.addEventListener('mouseenter', handleMouseEnter)
    scroller.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      cancelAnimationFrame(animationFrameId)
      scroller.removeEventListener('mouseenter', handleMouseEnter)
      scroller.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [testimonials.length])

  // Автоматическая прокрутка для мобильных (до 3 отзывов)
  useEffect(() => {
    if (!isAutoPlaying || testimonials.length <= 1 || testimonials.length > 3) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, testimonials.length])

  // Обновление индикатора
  useEffect(() => {
    const updateIndicator = () => {
      if (!dotsRef.current || testimonials.length > 3) return
      const activeDot = dotsRef.current.querySelector(`[data-index="${currentIndex}"]`) as HTMLButtonElement
      if (activeDot) {
        setIndicatorStyle({
          width: activeDot.offsetWidth,
          left: activeDot.offsetLeft,
        })
      }
    }
    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [currentIndex, testimonials.length])

  // Прокрутка контейнера для мобильных
  useEffect(() => {
    if (containerRef.current && testimonials.length <= 3) {
      const cardWidth = containerRef.current.scrollWidth / testimonials.length
      containerRef.current.scrollTo({
        left: cardWidth * currentIndex,
        behavior: 'smooth'
      })
    }
  }, [currentIndex, testimonials.length])

  const handleDotClick = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  if (loading) {
    return (
      <section className="px-3 sm:px-8 py-12 sm:py-20 md:px-16 lg:px-24">
        <div className="max-w-[1320px] mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="size-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
          </div>
        </div>
      </section>
    )
  }

  const showInfiniteScroll = testimonials.length > 3

  return (
    <section className="px-3 sm:px-8 py-12 sm:py-20 md:px-16 lg:px-24">
      <div className="max-w-[1320px] mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h2 className="font-heading text-xl sm:text-2xl font-bold text-foreground md:text-3xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            Отзывы клиентов
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
            Что говорят наши пользователи о сервисе
          </p>
        </div>

        {/* Infinite Scroll для > 3 отзывов */}
        {showInfiniteScroll ? (
          <div className="relative">
            {/* Градиенты затемнения по краям */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
            
            <div className="overflow-hidden">
              <div ref={scrollerRef} className="flex gap-4 will-change-transform">
                {/* Дублируем отзывы для бесконечной прокрутки */}
                {[...testimonials, ...testimonials].map((testimonial, index) => (
                  <div
                    key={`${testimonial.id}-${index}`}
                    className="flex-shrink-0 w-[280px] sm:w-[320px]"
                  >
                    <TestimonialCard testimonial={testimonial} index={index} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Grid для <= 3 отзывов */}
            <div className="hidden lg:grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard 
                  key={testimonial.id} 
                  testimonial={testimonial} 
                  index={index}
                />
              ))}
            </div>

            {/* Mobile Carousel для <= 3 отзывов */}
            <div className="lg:hidden">
              <div
                ref={containerRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                onMouseEnter={() => setIsAutoPlaying(false)}
                onMouseLeave={() => setIsAutoPlaying(true)}
              >
                {testimonials.map((testimonial, index) => (
                  <div
                    key={testimonial.id}
                    className="min-w-full snap-center"
                  >
                    <TestimonialCard testimonial={testimonial} index={index} />
                  </div>
                ))}
              </div>

              {/* Carousel Dots */}
              {testimonials.length > 1 && (
                <div ref={dotsRef} className="relative mt-6 flex justify-center gap-2">
                  <div
                    className="absolute top-0 h-2 rounded-full bg-primary transition-all duration-300 ease-out"
                    style={{
                      width: indicatorStyle.width,
                      left: indicatorStyle.left,
                    }}
                  />
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      data-index={index}
                      onClick={() => handleDotClick(index)}
                      className={`relative z-10 size-2 rounded-full transition-colors ${
                        currentIndex === index ? "bg-transparent" : "bg-muted/50"
                      }`}
                      aria-label={`Перейти к отзыву ${index + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

interface TestimonialCardProps {
  testimonial: Testimonial
  index: number
}

function TestimonialCard({ testimonial, index }: TestimonialCardProps) {
  return (
    <div
      className="relative rounded-2xl sm:rounded-[32px] border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 sm:p-6"
      style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
    >
      {/* Quote icon */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 opacity-10">
        <Quote className="size-12 sm:size-16 text-foreground" />
      </div>

      {/* User info */}
      <div className="relative z-10 flex items-start gap-3 mb-3 sm:mb-4">
        <div className="relative size-12 sm:size-14 rounded-xl overflow-hidden flex-shrink-0 bg-muted/50">
          {testimonial.avatar_url ? (
            <Image
              src={testimonial.avatar_url}
              alt={testimonial.name}
              width={56}
              height={56}
              className="size-full object-cover"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          ) : (
            <div className="size-full flex items-center justify-center text-2xl font-bold text-muted-foreground">
              {testimonial.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-heading text-sm sm:text-base font-semibold truncate text-foreground">
            {testimonial.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            {testimonial.game && (
              <span className="text-[10px] sm:text-xs text-muted-foreground">
                {testimonial.game}
              </span>
            )}
            {testimonial.price && (
              <>
                <span className="text-[10px] sm:text-xs text-muted-foreground/60">•</span>
                <span className="text-[10px] sm:text-xs font-medium px-1.5 py-0.5 rounded text-foreground bg-muted/50">
                  {testimonial.price.replace(/₽/g, '').trim()}₽
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="relative z-10 flex items-center gap-1 mb-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Star
            key={i}
            className={`size-3 sm:size-3.5 ${
              i < testimonial.rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted/30 text-muted/30"
            }`}
          />
        ))}
        <span className="ml-1 text-xs sm:text-sm font-medium text-foreground">
          {testimonial.rating}/10
        </span>
      </div>

      {/* Review text */}
      <p className="relative z-10 text-xs sm:text-sm leading-relaxed text-muted-foreground">
        {testimonial.text}
      </p>
    </div>
  )
}
