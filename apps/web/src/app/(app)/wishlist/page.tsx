import { Metadata } from 'next'
import { WishlistClient } from './WishlistClient'

export const metadata: Metadata = {
  title: 'Mis Favoritos',
  description: 'Tus productos guardados en Regalarte.',
}

export default function WishlistPage() {
  return <WishlistClient />
}