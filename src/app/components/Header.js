'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Header({ user }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="header">
      <h1>Paróquia Imaculado Coração de Maria</h1>
      <nav className="header-nav">
        {user && (
          <>
            <Link href="/dashboard" className={pathname === '/dashboard' ? 'active' : ''}>
              Início
            </Link>
            <Link href="/disponibilidade" className={pathname === '/disponibilidade' ? 'active' : ''}>
              Minha Disponibilidade
            </Link>
            <Link href="/escala" className={pathname === '/escala' ? 'active' : ''}>
              Escala Mensal
            </Link>
            {user.role === 'ADMIN' && (
              <Link href="/admin" className={pathname.startsWith('/admin') ? 'active' : ''}>
                Administração
              </Link>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', paddingLeft: '20px' }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Perfil" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid white' }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold' }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: '0.9rem', marginRight: '10px' }}>{user.name.split(' ')[0]}</span>
              <button onClick={handleLogout} className="btn-logout" style={{ marginLeft: 0 }}>
                Sair
              </button>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}
