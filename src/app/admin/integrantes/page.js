'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Alert from '@/app/components/Alert';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, Save, Plus } from 'lucide-react';

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
    can_be_animator: true,
    status: 'ATIVO',
    leave_start: '',
    leave_end: '',
    leave_reason: ''
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

      const listRes = await fetch(`/api/admin/users?t=${Date.now()}`);
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

  const fetchUsersSilent = async () => {
    try {
      const listRes = await fetch(`/api/admin/users?t=${Date.now()}`);
      if (listRes.ok) {
        const data = await listRes.json();
        setUsersList(data.users);
      }
    } catch (err) {
      console.error(err);
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
      can_be_animator: true,
      status: 'ATIVO',
      leave_start: '',
      leave_end: '',
      leave_reason: ''
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
      can_be_animator: Boolean(u.can_be_animator),
      status: u.status || 'ATIVO',
      leave_start: u.leave_start || '',
      leave_end: u.leave_end || '',
      leave_reason: u.leave_reason || ''
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

      console.log('Sending payload:', formData);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage(data.message);
      setShowForm(false);
      fetchUsersSilent();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Tem certeza que deseja remover o membro "${name}"? Todas as escalas dele serão atualizadas.`)) {
      return;
    }

    setError('');
    setMessage('');
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage(data.message);
      fetchUsersSilent();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuickStatus = async (u, newStatus) => {
    if (newStatus === 'LICENCIADO') {
      openEditForm(u);
      setTimeout(() => setFormData(prev => ({ ...prev, status: 'LICENCIADO' })), 0);
    } else {
      if (!window.confirm(`Deseja retornar o membro "${u.name}" para o status ATIVO?`)) return;
      setError('');
      setMessage('');
      try {
        const payload = { ...u, status: 'ATIVO', leave_start: '', leave_end: '', leave_reason: '' };
        // Clean up role to uppercase if it came lowercase, though it should be correct
        const res = await fetch(`/api/admin/users/${u.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setMessage(`Status de ${u.name} alterado para ATIVO.`);
        fetchUsersSilent();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  return (
    <>
      {user && <Header user={user} />}
      <main className="main-content">
        <div className="card large" style={{ maxWidth: '1000px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="card-title" style={{ margin: 0, fontSize: '2rem' }}>Gerenciar Membros</h2>
            <button onClick={openAddForm} className="btn" style={{ width: 'auto', padding: '0.8rem 1.5rem' }}>
              <Plus size={20} />
              Novo Membro
            </button>
          </div>

          {/* DASHBOARD SUMÁRIO */}
          {usersList && usersList.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', backgroundColor: '#f8fafc', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary)' }}>{usersList.length}</div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Membros Totais</div>
              </div>
              <div style={{ padding: '1rem', border: '1px solid #bbf7d0', borderRadius: '8px', backgroundColor: '#f0fdf4', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#166534' }}>{usersList.filter(u => u.status === 'ATIVO' || !u.status).length}</div>
                <div style={{ fontSize: '0.9rem', color: '#166534' }}>Ativos</div>
              </div>
              <div style={{ padding: '1rem', border: '1px solid #fef08a', borderRadius: '8px', backgroundColor: '#fefce8', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#854d0e' }}>{usersList.filter(u => u.status === 'LICENCIADO').length}</div>
                <div style={{ fontSize: '0.9rem', color: '#854d0e' }}>Licenciados</div>
              </div>
            </div>
          )}

          <Alert type="error" message={error} />
          <Alert type="success" message={message} />

          {showForm && (
            <div className="bottom-sheet" style={{ padding: '2rem', border: '1px solid var(--border)', borderRadius: '1.5rem', marginBottom: '2rem', backgroundColor: 'var(--surface-container-lowest)', boxShadow: '0 20px 40px rgba(0, 32, 70, 0.06)' }}>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)', fontSize: '1.5rem', fontWeight: '700' }}>{isEditing ? 'Editar Membro' : 'Novo Membro'}</h3>
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
                      <option value="VOLUNTARIO">Membro</option>
                      <option value="ADMIN">Coordenador</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status do Membro</label>
                    <select name="status" className="form-input" value={formData.status} onChange={handleInputChange}>
                      <option value="ATIVO">Ativo</option>
                      <option value="LICENCIADO">Em Licença</option>
                    </select>
                  </div>
                  
                  {formData.status === 'LICENCIADO' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Início da Licença</label>
                        <input type="date" name="leave_start" className="form-input" value={formData.leave_start} onChange={handleInputChange} required />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Fim da Licença (Opcional)</label>
                        <input type="date" name="leave_end" className="form-input" value={formData.leave_end} onChange={handleInputChange} />
                      </div>
                      <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                        <label className="form-label">Motivo da Licença</label>
                        <input type="text" name="leave_reason" className="form-input" value={formData.leave_reason} onChange={handleInputChange} placeholder="Ex: Viagem, Saúde, Motivos pessoais..." required />
                      </div>
                    </>
                  )}

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

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="submit" className="btn" style={{ flex: 1 }}>
                    <Save size={20} />
                    {isEditing ? 'Salvar Alterações' : 'Cadastrar Membro'}
                  </button>
                  <button type="button" className="btn-secondary" style={{ flex: 1, borderRadius: '9999px', border: 'none', fontWeight: '600', cursor: 'pointer' }} onClick={() => setShowForm(false)}>Cancelar</button>
                </div>
              </form>
            </div>
          )}

          {loading && !usersList.length ? (
            <p style={{ textAlign: 'center' }}>Carregando...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {usersList.map((u) => {
                    let funcs = [];
                    if (u.can_be_reader) funcs.push('Leitor');
                    if (u.can_be_animator) funcs.push('Animador');

                    return (
                      <div key={u.id} style={{ 
                        backgroundColor: 'var(--surface-container-lowest)',
                        border: '1px solid var(--border)',
                        borderRadius: '1.5rem',
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
                      }}>
                        {u.status === 'LICENCIADO' && (
                          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', backgroundColor: '#ea580c' }} />
                        )}
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--secondary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 'bold' }}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div style={{ flex: 1 }}>
                            <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)', fontWeight: '700' }}>{u.name}</h4>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{u.email}</span>
                          </div>
                          
                          <span style={{ 
                            fontSize: '0.8rem', padding: '0.3rem 0.8rem', borderRadius: '9999px', fontWeight: 'bold',
                            backgroundColor: u.role === 'ADMIN' ? '#dbeafe' : 'var(--surface-container-highest)',
                            color: u.role === 'ADMIN' ? '#1e40af' : 'var(--text-main)'
                          }}>
                            {u.role === 'ADMIN' ? 'Coordenador' : 'Voluntário'}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', fontWeight: 'bold' }}>Funções</span>
                            <span style={{ fontSize: '0.95rem', color: 'var(--text-main)', fontWeight: '600' }}>
                              {funcs.length > 0 ? (
                                <span style={{ padding: '0.3rem 0.6rem', backgroundColor: 'var(--secondary-container)', color: '#007166', borderRadius: '8px', fontSize: '0.85rem' }}>
                                  {funcs.join(' & ')}
                                </span>
                              ) : 'Nenhuma'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem', fontWeight: 'bold' }}>Status</span>
                            <select 
                              value={u.status || 'ATIVO'} 
                              onChange={(e) => handleQuickStatus(u, e.target.value)}
                              style={{ 
                                padding: '0.4rem', 
                                borderRadius: '8px', 
                                border: '1px solid transparent', 
                                backgroundColor: u.status === 'LICENCIADO' ? '#fefce8' : '#f0fdf4',
                                color: u.status === 'LICENCIADO' ? '#854d0e' : '#166534',
                                fontWeight: 'bold',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                width: 'fit-content'
                              }}
                            >
                              <option value="ATIVO">Ativo</option>
                              <option value="LICENCIADO">Licenciado</option>
                            </select>
                          </div>
                        </div>

                        {u.status === 'LICENCIADO' && (
                          <div style={{ backgroundColor: '#fff7ed', padding: '0.8rem', borderRadius: '8px', borderLeft: '3px solid #ea580c', fontSize: '0.9rem', color: '#9a3412', marginTop: '0.5rem' }}>
                            Licenciado de <b>{u.leave_start ? u.leave_start.split('-').reverse().join('/') : '-'}</b> até <b>{u.leave_end ? u.leave_end.split('-').reverse().join('/') : 'Indeterminado'}</b>
                            <br/><span style={{ fontSize: '0.8rem', opacity: 0.8 }}>Motivo: {u.leave_reason}</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                          <button 
                            onClick={() => openEditForm(u)} 
                            style={{ 
                              flex: 1, background: 'var(--surface-container-highest)', border: 'none', color: 'var(--primary)', 
                              padding: '0.8rem', borderRadius: '9999px', cursor: 'pointer', fontWeight: '600',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = '#d4d5d7'}
                            onMouseOut={e => e.currentTarget.style.background = 'var(--surface-container-highest)'}
                          >
                            <Pencil size={18} /> Editar
                          </button>
                          <button 
                            onClick={() => handleDelete(u.id, u.name)}
                            disabled={user?.id === u.id}
                            style={{ 
                              flex: 1, background: '#fee2e2', border: 'none', color: '#b91c1c', 
                              padding: '0.8rem', borderRadius: '9999px', cursor: user?.id === u.id ? 'not-allowed' : 'pointer', fontWeight: '600', opacity: user?.id === u.id ? 0.5 : 1,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.2s'
                            }}
                            onMouseOver={e => user?.id !== u.id && (e.currentTarget.style.background = '#fca5a5')}
                            onMouseOut={e => user?.id !== u.id && (e.currentTarget.style.background = '#fee2e2')}
                          >
                            <Trash2 size={18} /> Excluir
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {usersList.length === 0 && (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--surface-container-lowest)', borderRadius: '1.5rem' }}>
                      Nenhum membro cadastrado além do coordenador.
                    </div>
                  )}
            </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
