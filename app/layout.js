import './globals.css'
import ConditionalShell from '../components/ConditionalShell'
import { CartProvider } from '../lib/cart-context'
import CartButton from '../components/CartButton'

export const metadata = {
  title: {
    default: 'Khula Cafe | Best of the Best',
    template: '%s | Khula Cafe',
  },
  description:
    'Experience authentic South African flavours in a stunning environment. Smart booking, loyalty rewards, and unforgettable moments at Khula Cafe.',
  keywords: ['Khula Cafe', 'South African food', 'restaurant', 'cafe', 'bunny chow', 'grills', 'booking'],
  openGraph: {
    title: 'Khula Cafe | Best of the Best',
    description: 'Where memories are made, smiles are created, and every visit feels special.',
    type: 'website',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Khula Cafe',
  },
  themeColor: '#f5c842',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f5c842" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Khula Cafe" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;900&family=Poppins:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <CartProvider>
          <ConditionalShell>{children}</ConditionalShell>
          <CartButton />
        </CartProvider>
      </body>
    </html>
  )
}
