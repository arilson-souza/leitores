'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Alert from '@/app/components/Alert';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, Save, Plus } from 'lucide-react';

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="card-title" style={{ margin: 0, fontSize: '2rem' }}>Missas Especiais</h2>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/admin" className="btn-secondary" style={{ width: 'auto', padding: '0.8rem 1.5rem', borderRadius: '9999px', textDecoration: 'none', fontWeight: '600' }}>
                Voltar à Coordenação
              </Link>
              <button onClick={() => setShowForm(true)} className="btn" style={{ width: 'auto', padding: '0.8rem 1.5rem' }}>
                <Plus size={20} />
                Nova Missa Especial
              </button>
            </div>
          </div>

          <Alert type="error" message={error} />
          <Alert type="success" message={message} />

          {showForm && (
            <div style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '2rem', backgroundColor: '#f9fafb' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Cadastrar Missa Solene/Especial</h3>
              <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                Ao criar uma Missa Solene, todas as missas regulares dessa data serão removidas. 
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
                    <label className="form-label">Qtd. de Leitores (1 a 7)</label>
                    <input type="number" name="required_readers" className="form-input" min="1" max="7" value={formData.required_readers} onChange={handleInputChange} required />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="submit" className="btn" style={{ flex: 1 }}>
                    <Save size={20} />
                    Agendar Missa
                  </button>
                  <button type="button" className="btn-secondary" style={{ flex: 1, borderRadius: '9999px', border: 'none', fontWeight: '600', cursor: 'pointer' }} onClick={() => setShowForm(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {loading && !massesList.length ? (
            <p style={{ textAlign: 'center' }}>Carregando...</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {massesList.map((m) => {
                    const [year, month, day] = m.mass_date.split('-');
                    return (
                      <div key={m.id} style={{ 
                        backgroundColor: 'var(--surface-container-lowest)',
                        border: '1px solid var(--border)',
                        borderRadius: '1.5rem',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '1.3rem', color: 'var(--primary)', fontWeight: '700' }}>{m.name || 'Missa Especial'}</h4>
                            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>{`${day}/${month}/${year}`} às {m.mass_time}</span>
                          </div>
                          <span style={{ 
                            fontSize: '0.85rem', padding: '0.4rem 0.8rem', borderRadius: '8px',
                            backgroundColor: 'var(--secondary-container)', color: '#007166', fontWeight: 'bold'
                          }}>
                            {m.required_readers} Leitores
                          </span>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border)', marginTop: '0.5rem', paddingTop: '1.25rem' }}>
                          <button 
                            onClick={() => handleDelete(m.id, m.name)}
                            style={{ 
                              width: '100%', background: '#fee2e2', border: 'none', color: '#b91c1c', 
                              padding: '0.8rem', borderRadius: '9999px', cursor: 'pointer', fontWeight: '600',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#fca5a5'}
                            onMouseOut={e => e.currentTarget.style.background = '#fee2e2'}
                          >
                            <Trash2 size={18} /> Excluir Celebração
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {massesList.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--surface-container-lowest)', borderRadius: '1.5rem' }}>
                        Nenhuma missa especial ou solene cadastrada.
                    </div>
                  )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
