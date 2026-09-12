const ShippingIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-7 w-7"
    aria-hidden="true"
  >
    <path d="M1 8h13v9H1z" />
    <path d="M14 11h4l3 3v3h-7z" />
    <circle cx="5.5" cy="17.5" r="1.8" />
    <circle cx="17.5" cy="17.5" r="1.8" />
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
    className="h-7 w-7"
    aria-hidden="true"
  >
    <rect x="3" y="8" width="18" height="4" />
    <path d="M5 12v9h14v-9" />
    <path d="M12 8v13" />
    <path d="M12 8c-4 0-5.5-1.5-5.5-3.5C6.5 3 8 2.5 9 3.5 10.5 5 12 8 12 8z" />
    <path d="M12 8c4 0 5.5-1.5 5.5-3.5 0-1.5-1.5-2-2.5-1C13.5 5 12 8 12 8z" />
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
    className="h-7 w-7"
    aria-hidden="true"
  >
    <rect x="4" y="10" width="16" height="10" rx="1.5" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    <path d="M12 14v3" />
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
    className="h-7 w-7"
    aria-hidden="true"
  >
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
)

const benefits = [
  {
    icon: <ShippingIcon />,
    title: 'Envíos a todo el país',
    description: 'A donde estés.',
  },
  {
    icon: <PackagingIcon />,
    title: 'Packaging premium',
    description: 'Cada detalle importa.',
  },
  {
    icon: <PaymentIcon />,
    title: 'Pagos seguros',
    description: 'Protegemos tu compra.',
  },
  {
    icon: <SupportIcon />,
    title: 'Atención personalizada',
    description: 'Estamos para ayudarte.',
  },
] as const

export interface BenefitsBlockProps {
  items?: { title: string; description: string }[]
}

export function BenefitsBlock({ items }: BenefitsBlockProps) {
  const list = items
    ? benefits.map((b, i) => ({ ...b, ...(items[i] ?? {}) }))
    : benefits
  return (
    <section className="border-y border-[#EBDFD1] bg-[#FBF7F1] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-[1400px]">
        <h2 className="sr-only">Beneficios</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-[#E5DDD1]">
          {list.map((benefit) => (
            <article
              key={benefit.title}
              className="flex items-center gap-4 lg:justify-center lg:px-8"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center text-[#B85C33]">
                {benefit.icon}
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[#38271D]">
                  {benefit.title}
                </h3>
                <p className="mt-0.5 text-xs text-[#7A6A5D]">
                  {benefit.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export { benefits }
