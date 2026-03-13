'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Alert from '@/app/components/Alert';
import { useRouter } from 'next/navigation';

export default function IntegrantesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [usersList, setUsersList] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: null,
    name: '',
    email: '',
    password: '',
    avatar_url: '',
    role: 'VOLUNTARIO',
    can_be_reader: true,
    can_be_animator: true
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

      const listRes = await fetch('/api/admin/users');
      if (listRes.ok) {
        const data = await listRes.json();
        setUsersList(data.users);
      } else {
        throw new Error('Erro ao buscar usuários');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError('A imagem deve ter no máximo 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatar_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openAddForm = () => {
    setIsEditing(false);
    setFormData({
      id: null,
      name: '',
      email: '',
      password: '',
      avatar_url: '',
      role: 'VOLUNTARIO',
      can_be_reader: true,
      can_be_animator: true
    });
    setShowForm(true);
    setMessage('');
    setError('');
  };

  const openEditForm = (u) => {
    setIsEditing(true);
    setFormData({
      id: u.id,
      name: u.name,
      email: u.email,
      password: '', // Blank for editing unless changing
      avatar_url: u.avatar_url || '',
      role: u.role,
      can_be_reader: Boolean(u.can_be_reader),
      can_be_animator: Boolean(u.can_be_animator)
    });
    setShowForm(true);
    setMessage('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const url = isEditing ? `/api/admin/users/${formData.id}` : '/api/admin/users';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
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
    if (!window.confirm(`Tem certeza que deseja remover o integrante "${name}"? Todas as escalas dele serão atualizadas.`)) {
      return;
    }

    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
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
            <h2 className="card-title" style={{ margin: 0 }}>Gerenciar Integrantes</h2>
            <button onClick={openAddForm} className="btn" style={{ width: 'auto' }}>
              + Adicionar Integrante
            </button>
          </div>

          <Alert type="error" message={error} />
          <Alert type="success" message={message} />

          {showForm && (
            <div style={{ padding: '1.5rem', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '2rem', backgroundColor: '#f9fafb' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>{isEditing ? 'Editar Integrante' : 'Novo Integrante'}</h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Nome Completo</label>
                    <input type="text" name="name" className="form-input" value={formData.name} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">E-mail</label>
                    <input type="email" name="email" className="form-input" value={formData.email} onChange={handleInputChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isEditing ? 'Nova Senha (deixe em branco para manter)' : 'Senha Inicial'}</label>
                    <input type="text" name="password" className="form-input" value={formData.password} onChange={handleInputChange} required={!isEditing} minLength={6} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nível de Acesso</label>
                    <select name="role" className="form-input" value={formData.role} onChange={handleInputChange}>
                      <option value="VOLUNTARIO">Voluntário</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Foto de Perfil (Opcional - Máx 2MB)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {formData.avatar_url && (
                        <img 
                          src={formData.avatar_url} 
                          alt="Preview" 
                          style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} 
                        />
                      )}
                      <input type="file" accept="image/*" className="form-input" onChange={handleFileChange} style={{ flex: 1 }} />
                      {formData.avatar_url && (
                        <button type="button" onClick={() => setFormData(p => ({...p, avatar_url: ''}))} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', width: 'auto' }}>
                          Limpar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name="can_be_reader" checked={formData.can_be_reader} onChange={handleInputChange} />
                    <strong>Pode ser Leitor?</strong>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                    <input type="checkbox" name="can_be_animator" checked={formData.can_be_animator} onChange={handleInputChange} />
                    <strong>Pode ser Animador?</strong>
                  </label>
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="submit" className="btn" style={{ flex: 1 }}>{isEditing ? 'Salvar Alterações' : 'Cadastrar'}</button>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowForm(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {loading && !usersList.length ? (
            <p style={{ textAlign: 'center' }}>Carregando...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem' }}>Nome</th>
                    <th style={{ padding: '0.75rem' }}>E-mail</th>
                    <th style={{ padding: '0.75rem' }}>Funções</th>
                    <th style={{ padding: '0.75rem' }}>Acesso</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => {
                    let funcs = [];
                    if (u.can_be_reader) funcs.push('Leitor');
                    if (u.can_be_animator) funcs.push('Animador');

                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: 500 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={u.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {u.name}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem' }}>{u.email}</td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {funcs.join(', ') || 'Nenhuma'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem' }}>
                          <span style={{ 
                            fontSize: '0.8rem', padding: '0.2rem 0.5rem', borderRadius: '4px',
                            backgroundColor: u.role === 'ADMIN' ? '#dbeafe' : '#f3f4f6',
                            color: u.role === 'ADMIN' ? '#1e40af' : '#4b5563'
                          }}>
                            {u.role === 'ADMIN' ? 'Admin' : 'Voluntário'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <button 
                            onClick={() => openEditForm(u)} 
                            style={{ 
                              background: 'none', border: '1px solid var(--secondary)', color: 'var(--secondary)', 
                              padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem' 
                            }}
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id, u.name)}
                            disabled={user?.id === u.id}
                            style={{ 
                              background: 'none', border: '1px solid var(--error)', color: 'var(--error)', 
                              padding: '0.3rem 0.6rem', borderRadius: '4px', cursor: user?.id === u.id ? 'not-allowed' : 'pointer',
                              opacity: user?.id === u.id ? 0.5 : 1
                            }}
                          >
                           Excluir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {usersList.length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhum integrante cadastrado além do administrador.
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
