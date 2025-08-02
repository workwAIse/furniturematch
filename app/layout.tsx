import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { AuthProvider } from '@/lib/auth-context'

export const metadata: Metadata = {
  title: 'FurnitureMatch',
  description: 'Collaborative furniture matching app',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Handle mobile viewport height changes
              function setViewportHeight() {
                const vh = window.innerHeight * 0.01;
                document.documentElement.style.setProperty('--vh', \`\${vh}px\`);
              }
              
              // Set initial height
              setViewportHeight();
              
              // Update on resize and orientation change
              window.addEventListener('resize', setViewportHeight);
              window.addEventListener('orientationchange', () => {
                setTimeout(setViewportHeight, 100);
              });
              
              // Handle iOS Safari viewport changes
              if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                window.addEventListener('scroll', setViewportHeight);
                window.addEventListener('focus', setViewportHeight);
              }
            `,
          }}
        />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
