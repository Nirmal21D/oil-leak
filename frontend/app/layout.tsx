import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AegisSea // Maritime Intelligence & Tactical C2 Console (NTRO PS-26143)',
  description: 'Brutalist Tactical Maritime C2 Platform — SAR Oil Spill Segmentation, Lagrangian Advection Hindcasting, and Multi-Signal AIS Attribution',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-concrete-950 text-concrete-100 antialiased min-h-screen flex flex-col font-sans selection:bg-safety-orange selection:text-concrete-950">
        {children}
      </body>
    </html>
  )
}
