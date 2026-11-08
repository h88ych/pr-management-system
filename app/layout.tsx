export const metadata = {
  title: 'ระบบใบขอซื้อ (PR)',
  description: 'Purchase Request management system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  )
}
