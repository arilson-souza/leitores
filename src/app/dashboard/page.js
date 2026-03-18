import { getSession } from '@/lib/auth';
import Header from '@/app/components/Header';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const user = await getSession();

  if (!user) {
    redirect('/login');
  }

  return (
    <>
      <Header user={user} />
      <main className="main-content">
        <div className="card large">
          <h2 className="card-title">Dashboard</h2>
          <p style={{ textAlign: 'center', marginBottom: '2rem' }}>
            Olá, <strong>{user.name}</strong>! Seja bem-vindo(a) ao sistema de escalas da Paróquia.
          </p>

          <div className="dashboard-grid">
            <Link href="/disponibilidade" className="action-card">
              <h3>Minha Disponibilidade</h3>
              <p>Marque os dias em que você pode servir na paróquia</p>
            </Link>
            <Link href="/minhas-escalas" className="action-card" style={{ borderColor: 'var(--secondary)' }}>
              <h3>Minhas Escalas</h3>
              <p>Consulte apenas os dias em que você está escalado</p>
            </Link>
            <Link href="/escala" className="action-card">
              <h3>Escala Mensal</h3>
              <p>Visualize a escala completa de todos os membros</p>
            </Link>

            {user.role === 'ADMIN' && (
              <>
                <Link href="/admin" className="action-card" style={{ borderColor: 'var(--secondary)' }}>
                  <h3>Gerenciar Escalas</h3>
                  <p>Gerar missas, automatizar escalas e verificar faltas</p>
                </Link>
                <Link href="/admin/missas-especiais" className="action-card" style={{ borderColor: '#6366f1' }}>
                  <h3>Missas Solenes</h3>
                  <p>Agendar missas esporádicas e eventos especiais</p>
                </Link>
                <Link href="/admin/integrantes" className="action-card" style={{ borderColor: 'var(--success)' }}>
                  <h3>Gerenciar Membros</h3>
                  <p>Adicionar, editar e remover membros</p>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
