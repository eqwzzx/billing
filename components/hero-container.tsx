"use client";

import { useEffect, useState } from "react";
import { UsersRound, Server, Gauge, MessageCircle } from "lucide-react";

interface Stats {
  clients: number;
  servers: number;
  uptime: string;
}

interface HeroContainerProps {
  onPricingClick?: () => void;
  onFeaturesClick?: () => void;
}

export function HeroContainer({ onPricingClick, onFeaturesClick }: HeroContainerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<Stats>({
    clients: 50,
    servers: 75,
    uptime: "99.9%"
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setStats({
            clients: data.clients,
            servers: data.servers,
            uptime: data.uptime
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };
    fetchStats();
  }, []);

  const statsData = [
    { number: `${stats.clients}+`, label: "клиентов", Icon: UsersRound },
    { number: `${stats.servers}+`, label: "серверов", Icon: Server },
    { number: stats.uptime, label: "uptime", Icon: Gauge },
    { number: "24/7", label: "поддержка", Icon: MessageCircle },
  ];

  return (
    <div className="relative w-full max-w-[1320px] mx-auto">
      {/* Desktop version */}
      <div className="hidden sm:block relative w-full aspect-[1320/528]">
        <svg 
          className={`absolute inset-0 w-full h-full transition-opacity duration-700 ease-out ${
            isVisible ? "opacity-100" : "opacity-0"
          }`} 
          viewBox="0 0 1320 528" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <clipPath id="containerClip">
              <path d="
                M 48 0 
                H 1272 
                Q 1320 0 1320 48 
                V 480 
                Q 1320 528 1272 528 
                H 534 
                Q 486 528 486 480 
                V 396 
                Q 486 348 438 348 
                H 48 
                Q 0 348 0 300 
                V 48 
                Q 0 0 48 0 
                Z
              " />
            </clipPath>
          </defs>
          <image 
            href="/new.jpg" 
            width="1320" 
            height="528" 
            preserveAspectRatio="xMidYMid slice"
            clipPath="url(#containerClip)"
            className="select-none pointer-events-none"
          />
        </svg>

        <div 
          className={`absolute top-[33%] left-[2%] -translate-y-1/2 p-5 md:p-7 rounded-3xl backdrop-blur-sm bg-black/5 dark:bg-white/5 transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          <h1 className="font-heading text-xl md:text-3xl font-bold text-white mb-3 md:mb-4">
            Хостинг, которому доверяют
          </h1>
          <p className="font-heading text-sm md:text-base text-white/80 max-w-[380px] md:max-w-[480px] leading-relaxed flex flex-wrap items-center gap-1">
            <span>Мгновенная активация серверов,</span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded-md">
              <svg className="w-3 h-3 md:w-3.5 md:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>низкий пинг</span>
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white/10 rounded-md">
              <svg className="w-3 h-3 md:w-3.5 md:h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>защита от DDoS</span>
            </span>
          </p>
          <p className="font-heading text-sm md:text-base text-white/80 max-w-[380px] md:max-w-[480px] mt-1">
            Создайте свой сервер за пару кликов.
          </p>
          
          <div 
            className={`flex items-center gap-3 mt-4 md:mt-6 transition-all duration-500 ease-out relative z-30 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: "400ms" }}
          >
            <button 
              onClick={onPricingClick}
              className="group px-4 md:px-6 py-2.5 md:py-3 bg-foreground text-background rounded-xl text-xs md:text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity font-heading relative z-30"
            >
              <span className="group-hover">Наши тарифы</span>
            </button>
            <button 
              onClick={onFeaturesClick}
              className="px-4 md:px-6 py-2.5 md:py-3 text-white border border-white/30 rounded-xl text-xs md:text-sm font-medium cursor-pointer hover:bg-white/10 transition-colors font-heading relative z-30"
            >
              Преимущества
            </button>
          </div>
        </div>
        
        {/* Stats in cutout area - Desktop */}
        <div className="absolute bottom-0 left-0 w-[33%] h-[34%] flex items-center justify-center">
          <div className="flex items-center gap-3 md:gap-6">
            {statsData.map((stat, i) => (
              <div 
                key={i} 
                className={`flex flex-col items-center transition-all duration-500 ease-out ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${300 + i * 100}ms` }}
              >
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-border flex items-center justify-center mb-1 md:mb-2">
                  <stat.Icon className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="font-heading text-base md:text-xl font-bold text-foreground">
                  {stat.number}
                </span>
                <span className="font-heading text-[7px] md:text-[9px] text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div 
          className={`absolute right-[5%] bottom-[-10%] w-[75%] max-w-[650px] transition-all duration-1000 ease-out z-20 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ 
            transitionDelay: "600ms",
            animation: isVisible ? "float 3s ease-in-out infinite" : "none"
          }}
        >
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50%] h-12 bg-gradient-to-t from-blue-500/30 via-blue-400/10 to-transparent blur-2xl rounded-full" />
          
          <img 
            src="/rig123.png" 
            alt="Minecraft Characters" 
            className="w-full h-auto drop-shadow-2xl relative z-10 select-none pointer-events-none"
            style={{
              filter: "drop-shadow(0 0 40px rgba(59, 130, 246, 0.25)) drop-shadow(0 10px 60px rgba(0, 0, 0, 0.3))"
            }}
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
          />
          
          <div className="absolute top-[15%] left-[5%] w-2 h-2 bg-blue-400/70 rounded-full animate-ping select-none pointer-events-none" style={{ animationDuration: "2s" }} />
          <div className="absolute top-[25%] right-[15%] w-1.5 h-1.5 bg-cyan-400/70 rounded-full animate-ping select-none pointer-events-none" style={{ animationDuration: "2.5s", animationDelay: "0.5s" }} />
          <div className="absolute top-[45%] left-[15%] w-1 h-1 bg-blue-300/70 rounded-full animate-ping select-none pointer-events-none" style={{ animationDuration: "3s", animationDelay: "1s" }} />
          <div className="absolute top-[35%] right-[5%] w-1.5 h-1.5 bg-sky-400/70 rounded-full animate-ping select-none pointer-events-none" style={{ animationDuration: "2.8s", animationDelay: "0.3s" }} />
        </div>
      </div>

      {/* Mobile version */}
      <div className="sm:hidden relative w-full">
        <div className="relative rounded-3xl overflow-hidden border border-border/50">
          <img 
            src="/new.jpg" 
            alt="Background" 
            className="w-full h-[300px] object-cover select-none pointer-events-none"
            draggable="false"
            onContextMenu={(e) => e.preventDefault()}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60" />
          
          <div 
            className={`absolute top-6 left-4 right-4 transition-all duration-700 ease-out ${
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <h1 className="font-heading text-lg font-bold text-white mb-2">
              Хостинг, которому доверяют
            </h1>
            <p className="font-heading text-xs text-white/90 leading-relaxed max-w-[280px]">
              Мгновенная активация серверов, низкий пинг и защита от DDoS
            </p>
            <p className="font-heading text-xs text-white/80 mt-1">
              Создайте свой сервер за пару кликов.
            </p>
            
            <div 
              className={`flex items-center gap-2 mt-4 transition-all duration-500 ease-out ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              }`}
              style={{ transitionDelay: "400ms" }}
            >
              <button 
                onClick={onPricingClick}
                className="px-4 py-2 bg-foreground text-background rounded-lg text-xs font-medium font-heading"
              >
                Наши тарифы
              </button>
              <button 
                onClick={onFeaturesClick}
                className="px-4 py-2 text-white border border-white/30 rounded-lg text-xs font-medium font-heading"
              >
                Преимущества
              </button>
            </div>
          </div>
          
          <div 
            className={`absolute bottom-4 right-4 w-[50%] max-w-[180px] transition-all duration-1000 ease-out ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: "600ms" }}
          >
            <img 
              src="/rig123.png" 
              alt="Minecraft Characters" 
              className="w-full h-auto drop-shadow-2xl select-none pointer-events-none"
              style={{
                filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.3))"
              }}
              draggable="false"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>

        {/* Stats - Mobile Version (Below Hero) */}
        <div className="mt-4 px-2">
          <div className="grid grid-cols-4 gap-2">
            {statsData.map((stat, i) => (
              <div 
                key={i} 
                className={`flex flex-col items-center p-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 transition-all duration-500 ease-out ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
                style={{ transitionDelay: `${300 + i * 100}ms` }}
              >
                <div className="w-7 h-7 rounded-full border border-border flex items-center justify-center mb-1">
                  <stat.Icon className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                </div>
                <span className="font-heading text-xs font-bold text-foreground text-center">
                  {stat.number}
                </span>
                <span className="font-heading text-[8px] text-muted-foreground uppercase tracking-wider text-center">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
      `}</style>
    </div>
  );
}
