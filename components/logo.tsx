import Image from "next/image"

export function Logo({ className }: { className?: string }) {
  return (
    <>
      {/* Лого для темной темы (белое) */}
      <Image
        src="/logo.svg"
        alt="Logo"
        width={32}
        height={40}
        className={`${className} dark:block hidden`}
      />
      
      {/* Лого для светлой темы (темное) */}
      <Image
        src="/logo_dark.svg"
        alt="Logo"
        width={32}
        height={40}
        className={`${className} dark:hidden block`}
      />
    </>
  )
}
