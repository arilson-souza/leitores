import './globals.css';
import { Manrope } from 'next/font/google';

const manrope = Manrope({ subsets: ['latin'] });

export const metadata = {
  title: 'Sistema de Escalas - Paróquia Imaculado Coração de Maria',
  description: 'Gerenciamento de escalas de leitores e animadores',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body className={manrope.className} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
