'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Alert from '@/app/components/Alert';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function MissasEspeciaisPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [massesList, setMassesList] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mass_date: '',
    mass_time: '',
    required_readers: 2
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.user.role !== 'ADMIN') {
          router.push('/dashboard');
          return;
        }
        setUser(userData.user);
      }

      const listRes = await fetch('/api/admin/special-masses');
      if (listRes.ok) {
        const data = await listRes.json();
        setMassesList(data.specialMasses);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/special-masses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage(data.message);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Tem certeza que deseja cancelar a missa especial "${name}"? Todas as escalas atreladas a ela serão perdidas.`)) {
      return;
    }

    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/special-masses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage(data.message);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      {user && <Header user={user} />}
      <main className="main-content">
        <div className="card large" style={{ maxWidth: '1000px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="card-title" style={{ margin: 0 }}>Gerenciar Missas Especiais</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/admin" className="btn btn-secondary" style={{ width: 'auto' }}>
                Voltar à Coordenação
              </Link>
              <button onClick={() => setShowForm(true)} className="btn" style={{ width: 'auto' }}>
                + Nova Missa Especial
              </button>
            </div>
          </div>

          <Alert type="error" message={error} />
          <Alert type="success" message={message} />

          {showForm && (
            <div style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '2rem', backgroundColor: '#f9fafb' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Cadastrar Missa Solene/Especial</h3>
              <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Missas criadas aqui não serão apagadas nem sobrescritas pela geração mensal automática.
                Os membros conseguirão ver essas missas na página de Disponibilidade caso selecionem o respectivo mês.
              </p>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div className="form-group">
                    <label className="form-label">Nome da Celebração</label>
                    <input type="text" name="name" className="form-input" placeholder="Ex: Corpus Christi" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Data</label>
                    <input type="date" name="mass_date" className="form-input" value={formData.mass_date} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Horário</label>
                    <input type="time" name="mass_time" className="form-input" value={formData.mass_time} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Qtd. de Leitores (1 a 4)</label>
                    <input type="number" name="required_readers" className="form-input" min="1" max="4" value={formData.required_readers} onChange={handleInputChange} required />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn" style={{ flex: 1 }}>Agendar Missa</button>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {loading && !massesList.length ? (
            <p style={{ textAlign: 'center' }}>Carregando...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem' }}>Celebração</th>
                    <th style={{ padding: '0.75rem' }}>Data</th>
                    <th style={{ padding: '0.75rem' }}>Horário</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Vagas p/ Leitores</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {massesList.map((m) => {
                    const [year, month, day] = m.mass_date.split('-');
                    return (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 500 }}>{m.name || 'Missa Especial'}</td>
                        <td style={{ padding: '0.75rem' }}>{`${day}/${month}/${year}`}</td>
                        <td style={{ padding: '0.75rem' }}>{m.mass_time}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <span style={{ 
                            fontSize: '0.85rem', padding: '0.2rem 0.6rem', borderRadius: '4px',
                            backgroundColor: '#e0e7ff', color: '#3730a3', fontWeight: 'bold'
                          }}>
                            {m.required_readers} Leitores
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <button 
                            onClick={() => handleDelete(m.id, m.name)}
                            style={{ 
                              background: 'none', border: '1px solid var(--error)', color: 'var(--error)', 
                              padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer'
                            }}
                          >
                           Pular / Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {massesList.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhuma missa especial / solene cadastrada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
