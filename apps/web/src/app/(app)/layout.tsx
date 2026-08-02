import React from 'react'
import './globals.css'
import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Providers } from '@/providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Regalarte',
  description: 'Descubrí el regalo perfecto. Universo Solística y Regalarte.',
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Regalarte',
    title: 'Regalarte',
    description: 'Descubrí el regalo perfecto. Universo Solística y Regalarte.',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Regalarte',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Regalarte',
    description: 'Descubrí el regalo perfecto. Universo Solística y Regalarte.',
    images: ['/opengraph-image'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body className={`${inter.className} min-h-screen flex flex-col`}>
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
