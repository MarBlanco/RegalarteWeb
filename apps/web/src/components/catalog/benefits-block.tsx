'use client'

import Link from 'next/link'

interface Benefit {
  icon: React.ReactNode
  title: string
  description: string
}

const ShippingIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-6 h-6"
    aria-hidden="true"
  >
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <circle cx="6" cy="8" r="2" />
    <path d="M18 16v-2a2 2 0 0 0-2-2h-4a2 2 0 0 1-2-2V6" />
  </svg>
)

const PackagingIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-6 h-6"
    aria-hidden="true"
  >
    <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
    <path d="M21 16V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3" />
    <path d="M4 20l1.12 1.12" />
    <path d="M18 8v9" />
    <path d="M20 20H4" />
    <circle cx="16" cy="16" r="2" />
  </svg>
)

const PaymentIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-6 h-6"
    aria-hidden="true"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3 7 3" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

const SupportIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-6 h-6"
    aria-hidden="true"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-3.4L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-3.4L21 3l-1.9 5.7a8.38 8.38 0 0 1 .9 3.8z" />
  </svg>
)

const benefits = [
  {
    icon: <ShippingIcon />,
    title: 'Envíos a todo el país',
    description: 'Envío gratis en compras mayores a $50.000',
  },
  {
    icon: <PackagingIcon />,
    title: 'Packaging Premium',
    description: 'Empaques cuidadosos para que todo llegue intacto.',
  },
  {
    icon: <PaymentIcon />,
    title: 'Pagos Seguros',
    description: 'Tus datos protegidos con encriptación bancaria.',
  },
  {
    icon: <SupportIcon />,
    title: 'Atención Personalizada',
    description: 'Te acompañamos en cada paso de tu compra.',
  },
] as const

export function BenefitsBlock() {
  return (
    <section className="px-7 py-10 sm:py-14">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="sr-only">Beneficios</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {benefits.map((benefit) => (
            <article
              key={benefit.title}
              className="flex flex-col items-center text-center gap-3 p-4 sm:px-6 rounded-xl border border-[#E5DDD1] bg-[#F4EDE4]/60 transition-colors hover:border-[#C45A37]/50"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F4EDE4] text-[#C45A37]">
                {benefit.icon}
              </div>
              <h3 className="text-sm font-semibold text-[#38271D]">{benefit.title}</h3>
              <p className="text-xs text-[#7A6A5D] max-w-[180px]">
                {benefit.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export { benefits }