import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AegisSea | AI Marine Oil Spill Detection & Attribution',
  description: 'AI-Powered SAR Oil Spill Detection, Hindcast Drift Modeling & Multi-Signal AIS Vessel Attribution System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-ocean-900 text-slate-100 antialiased min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  )
}
