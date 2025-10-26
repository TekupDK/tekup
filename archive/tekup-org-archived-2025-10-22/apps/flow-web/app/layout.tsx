import './globals.css';
import { QueryProviders } from './providers';

export const metadata = { title: 'TekUp Flow' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <QueryProviders>
          {children}
        </QueryProviders>
      </body>
    </html>
  );
}
