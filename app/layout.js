import './globals.css'
import ConditionalShell from '../components/ConditionalShell'
import { CartProvider } from '../lib/cart-context'
import CartButton from '../components/CartButton'
import InstallPWA from '../components/InstallPWA'

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
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        {/* iOS splash screens — prevents white flash on launch */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)" href="/icons/splash-1290x2796.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)" href="/icons/splash-1179x2556.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)" href="/icons/splash-1170x2532.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)" href="/icons/splash-1125x2436.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)" href="/icons/splash-828x1792.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)" href="/icons/splash-750x1334.png" />
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
          <InstallPWA />
        </CartProvider>
      </body>
    </html>
  )
}
