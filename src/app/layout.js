import './globals.css';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Sistema de Escalas - Paróquia Imaculado Coração de Maria',
  description: 'Gerenciamento de escalas de leitores e animadores',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={inter.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
