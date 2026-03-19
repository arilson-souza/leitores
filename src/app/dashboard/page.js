import { getSession } from '@/lib/auth';
import Header from '@/app/components/Header';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CalendarCheck, ListChecks, CalendarDays, Settings, CalendarRange, Users, ChevronRight } from 'lucide-react';

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  // Define the cards data for map
  const volunteerCards = [
    { href: '/disponibilidade', title: 'Minha Disponibilidade', desc: 'Marque os dias em que você pode servir', icon: CalendarCheck, color: '#34d399', bg: '#ecfdf5', border: '#059669' },
    { href: '/minhas-escalas', title: 'Minhas Escalas', desc: 'Consulte os dias em que você está escalado', icon: ListChecks, color: '#60a5fa', bg: '#eff6ff', border: '#2563eb' },
    { href: '/escala', title: 'Escala Mensal', desc: 'Visualize a escala pública de todos os membros', icon: CalendarDays, color: '#9ca3af', bg: '#f3f4f6', border: '#4b5563' },
  ];

  const adminCards = [
    { href: '/admin', title: 'Gerenciar Escalas', desc: 'Automatizar escalas e gerenciar preenchimento', icon: Settings, color: '#a78bfa', bg: '#f5f3ff', border: '#7c3aed' },
    { href: '/admin/missas-especiais', title: 'Missas Solenes', desc: 'Agendar missas esporádicas e eventos especiais', icon: CalendarRange, color: '#f472b6', bg: '#fdf2f8', border: '#db2777' },
    { href: '/admin/integrantes', title: 'Gerenciar Membros', desc: 'Adicionar, editar e remover controle de membros', icon: Users, color: '#fbbf24', bg: '#fffbeb', border: '#d97706' },
  ];

  return (
    <>
      <Header user={user} />
      <main style={{ padding: '2rem 1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
        
        <div style={{ marginBottom: '2.5rem' }}>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--primary)', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            Olá, {user?.name?.split(' ')[0] || 'Bem-vindo'}
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
            Pronto para fazer a diferença hoje? Aqui está o seu resumo de atividades.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {volunteerCards.map((card, idx) => (
            <Link key={idx} href={card.href} style={{ textDecoration: 'none' }}>
              <div style={{ 
                backgroundColor: 'var(--surface-container-lowest)', 
                borderRadius: '1.5rem', 
                padding: '1.25rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.03)',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s',
                gap: '1.5rem'
              }}>
                <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '6px', backgroundColor: card.border, borderTopRightRadius: '6px', borderBottomRightRadius: '6px' }} />
                
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <card.icon strokeWidth={2.5} size={28} color={card.border} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)', fontWeight: '700' }}>{card.title}</h3>
                  <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginTop: '0.25rem', lineHeight: 1.3 }}>{card.desc}</span>
                </div>
                
                <ChevronRight color="var(--border)" size={24} />
              </div>
            </Link>
          ))}
        </div>

        {user.role === 'ADMIN' && (
          <div style={{ marginTop: '3rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '800', letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '1.25rem', display: 'block' }}>
              Área de Coordenação
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {adminCards.map((card, idx) => (
                <Link key={idx} href={card.href} style={{ textDecoration: 'none' }}>
                  <div style={{ 
                    backgroundColor: 'var(--primary)', 
                    borderRadius: '1.5rem', 
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: '0 10px 20px rgba(0, 32, 70, 0.15)',
                    position: 'relative',
                    overflow: 'hidden',
                    gap: '1.5rem'
                  }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <card.icon strokeWidth={2.5} size={28} color="white" />
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'white', fontWeight: '700' }}>{card.title}</h3>
                      <span style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.25rem', lineHeight: 1.3 }}>{card.desc}</span>
                    </div>
                    
                    <ChevronRight color="rgba(255,255,255,0.4)" size={24} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>
    </>
  );
}
