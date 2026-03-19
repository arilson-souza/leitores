'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';

export default function Header({ user }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="header">
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src="/logo.png" alt="Paróquia Imaculado Coração de Maria" style={{ height: '46px', objectFit: 'contain' }} />
      </div>

      {user && (
        <button className="menu-toggle" onClick={toggleMenu} aria-label="Toggle Menu">
          {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      )}

      <nav className={`header-nav ${isMenuOpen ? 'open' : ''}`}>
        {user && (
          <>
            <Link href="/dashboard" className={pathname === '/dashboard' ? 'active' : ''} onClick={closeMenu}>
              Início
            </Link>
            <Link href="/disponibilidade" className={pathname === '/disponibilidade' ? 'active' : ''} onClick={closeMenu}>
              Minha Disponibilidade
            </Link>
            <Link href="/escala" className={pathname === '/escala' ? 'active' : ''} onClick={closeMenu}>
              Escala Mensal
            </Link>
            {user.role === 'ADMIN' && (
              <Link href="/admin" className={pathname.startsWith('/admin') ? 'active' : ''} onClick={closeMenu}>
                Coordenação
              </Link>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', paddingLeft: '20px' }}>
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="Perfil" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--surface-container-highest)' }} />
              ) : (
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 'bold' }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: '0.9rem', marginRight: '10px', color: 'var(--text-main)', fontWeight: '600' }}>{user.name.split(' ')[0]}</span>
              <button onClick={handleLogout} className="btn-logout" title="Sair" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem' }}>
                <LogOut size={18} />
              </button>
            </div>
          </>
        )}
      </nav>
    </header>
  );
}
