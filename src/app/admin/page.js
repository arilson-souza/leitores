'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Alert from '@/app/components/Alert';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [masses, setMasses] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [monthStatus, setMonthStatus] = useState('OPEN');
  
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // For manual adjustment
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [availableCandidates, setAvailableCandidates] = useState([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    fetchData();
  }, [currentDate]);

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

      // Fetch masses, schedules, and month status
      const [massRes, schedRes, statusRes] = await Promise.all([
        fetch(`/api/admin/masses?year=${year}&month=${month}`),
        fetch(`/api/schedules?year=${year}&month=${month}`),
        fetch(`/api/admin/schedule-months?year=${year}&month=${month}`)
      ]);

      if (massRes.ok) {
        const data = await massRes.json();
        setMasses(data.masses);
      }
      if (schedRes.ok) {
        const data = await schedRes.json();
        setSchedules(data.schedules);
      }
      if (statusRes.ok) {
        const data = await statusRes.json();
        setMonthStatus(data.status);
      }
    } catch (err) {
      setError('Erro ao carregar dados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(new Date(year, month, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1));

  const handleGenerateMasses = async () => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/masses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: String(year), month: String(month) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateSchedules = async () => {
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: String(year), month: String(month) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setActionLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/schedule-months', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: String(year), month: String(month), status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage(data.message);
      setMonthStatus(newStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <>
      {user && <Header user={user} />}
      <main className="main-content">
        <div className="card large" style={{ maxWidth: '1200px' }}>
          <h2 className="card-title">Coordenação de Escalas</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button onClick={prevMonth} className="btn btn-secondary" style={{ width: 'auto' }}>&larr; Anterior</button>
              <h3 style={{ fontSize: '1.2rem', margin: 0, minWidth: '150px', textAlign: 'center' }}>{monthNames[month - 1]} {year}</h3>
              <button onClick={nextMonth} className="btn btn-secondary" style={{ width: 'auto' }}>Próximo &rarr;</button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', marginRight: '1rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status da Escala</span>
                <select 
                  value={monthStatus} 
                  onChange={handleStatusChange} 
                  className="form-input" 
                  style={{ padding: '0.4rem', border: '1px solid var(--primary)', color: 'var(--primary)', fontWeight: 'bold' }}
                  disabled={actionLoading}
                >
                  <option value="OPEN">Em Preenchimento</option>
                  <option value="DRAFT">Provisória</option>
                  <option value="PUBLISHED">Definitiva</option>
                </select>
              </div>

              <button 
                onClick={handleGenerateMasses} 
                className="btn btn-secondary" 
                style={{ width: 'auto' }}
                disabled={actionLoading}
              >
                1. Gerar Missas
              </button>
              <button 
                onClick={handleGenerateSchedules} 
                className="btn" 
                style={{ width: 'auto' }}
                disabled={actionLoading || masses.length === 0}
              >
                2. Gerar Escala Automática
              </button>
            </div>
          </div>

          <div style={{ padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <strong style={{ color: 'var(--text-muted)' }}>Legenda das Funções:</strong>
            <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ backgroundColor: '#2563eb', color: 'white', fontWeight: 'bold', fontSize: '0.7rem', padding: '0.15rem 0.35rem', borderRadius: '4px', marginRight: '6px', display: 'inline-block', minWidth: '24px', textAlign: 'center' }}>L1</span> Leitor 1ª Leitura</div>
            <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ backgroundColor: '#0d9488', color: 'white', fontWeight: 'bold', fontSize: '0.7rem', padding: '0.15rem 0.35rem', borderRadius: '4px', marginRight: '6px', display: 'inline-block', minWidth: '24px', textAlign: 'center' }}>L2</span> Leitor 2ª Leitura</div>
            <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ backgroundColor: '#9333ea', color: 'white', fontWeight: 'bold', fontSize: '0.7rem', padding: '0.15rem 0.35rem', borderRadius: '4px', marginRight: '6px', display: 'inline-block', minWidth: '24px', textAlign: 'center' }}>L3 a L7</span> Leitores Extras</div>
            <div style={{ display: 'flex', alignItems: 'center' }}><span style={{ backgroundColor: '#ea580c', color: 'white', fontWeight: 'bold', fontSize: '0.7rem', padding: '0.15rem 0.35rem', borderRadius: '4px', marginRight: '6px', display: 'inline-block', minWidth: '24px', textAlign: 'center' }}>A</span> Animador</div>
          </div>

          <Alert type="error" message={error} />
          <Alert type="success" message={message} />

          {loading ? (
            <p style={{ textAlign: 'center' }}>Carregando...</p>
          ) : (
            <div style={{ marginTop: '2rem' }}>
              <h3 style={{ marginBottom: '1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                Missas e Escalas do Mês
              </h3>
              
              {masses.length === 0 ? (
                <p style={{ color: 'var(--text-muted)' }}>Mês sem missas geradas. Clique em "Gerar Missas" primeiro.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  {schedules.map((schedule) => {
                        const isWeekend = schedule.day_type === 'SATURDAY' || schedule.day_type === 'SUNDAY' || schedule.day_type === 'SPECIAL';
                        const dateParts = schedule.mass_date.split('-');
                        const displayDate = `${dateParts[2]}/${dateParts[1]} às ${schedule.mass_time}`;
                        
                        const isIncomplete = !schedule.reader_1_name || !schedule.animator_name || (isWeekend && !schedule.reader_2_name);
                        
                        return (
                          <div key={schedule.id} style={{ 
                            backgroundColor: isIncomplete ? 'var(--error-bg)' : 'var(--surface-container-lowest)',
                            borderRadius: '1.5rem',
                            padding: '1.5rem',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)',
                            border: isIncomplete ? '1px solid #fca5a5' : '1px solid var(--border)'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--surface-container-highest)', paddingBottom: '0.8rem', marginBottom: '1rem' }}>
                              <h4 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--primary)', fontWeight: '700' }}>{displayDate}</h4>
                              <span style={{ 
                                fontSize: '0.8rem', 
                                padding: '0.3rem 0.8rem', 
                                borderRadius: '9999px',
                                backgroundColor: schedule.status === 'CONFIRMED' ? 'var(--success-bg)' : 'var(--surface-container-highest)',
                                color: schedule.status === 'CONFIRMED' ? 'var(--success)' : 'var(--text-main)',
                                fontWeight: 'bold'
                              }}>
                                {schedule.status === 'CONFIRMED' ? 'Confirmado' : schedule.status}
                              </span>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Leitor 1</span>
                                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{schedule.reader_1_name || <span style={{ color: 'var(--error)' }}>Faltando</span>}</span>
                              </div>
                              
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Leitores Extras</span>
                                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                  {!isWeekend && !schedule.reader_2_name ? '-' : 
                                    [schedule.reader_2_name, schedule.reader_3_name, schedule.reader_4_name, schedule.reader_5_name, schedule.reader_6_name, schedule.reader_7_name]
                                      .filter(Boolean).join(', ') || <span style={{ color: 'var(--error)' }}>Faltando</span>
                                  }
                                </span>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Animador</span>
                                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{schedule.animator_name || <span style={{ color: 'var(--error)' }}>Faltando</span>}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {schedules.length === 0 && (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--surface-container-lowest)', borderRadius: '1.5rem' }}>
                          Missas geradas, mas escala ainda não processada. Clique em "Gerar Escala Automática".
                        </div>
                      )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
