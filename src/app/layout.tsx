import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import './globals.css';
import { product } from '@/config/product';
export const metadata: Metadata = {
  title: { default: product.name, template: `%s · ${product.name}` },
  description: product.descriptor,
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  const content = (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
  return process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? (
    <ClerkProvider>{content}</ClerkProvider>
  ) : (
    content
  );
}
