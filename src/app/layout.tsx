import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { LocalAuthProvider } from '@/lib/auth-context';
import { DevTools } from '@/components/dev-tools';

export const metadata: Metadata = {
  title: 'NIE Campus Guide',
  description: 'A citation-grounded campus assistant for NIE Mysore.',
};

import { ClerkProvider } from '@clerk/nextjs';
import { GlobalErrorBoundary } from '@/components/providers/global-error-boundary';
import { OfflineIndicator } from '@/components/providers/offline-indicator';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark" suppressHydrationWarning>
        <head>
          <meta httpEquiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://*.clerk.accounts.dev https://challenges.cloudflare.com; worker-src 'self' blob:; frame-src 'self' https://challenges.cloudflare.com https://*.clerk.accounts.dev; connect-src 'self' https://*.clerk.accounts.dev https://clerk.com https://*.clerk.com https://challenges.cloudflare.com; img-src 'self' data: https://img.clerk.com https://*.clerk.com" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Source+Code+Pro:wght@400;600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
        </head>
        <body className="font-body antialiased" suppressHydrationWarning>
          <GlobalErrorBoundary>
            <LocalAuthProvider>
              {children}
            </LocalAuthProvider>
            <OfflineIndicator />
            <Toaster />
          </GlobalErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
