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
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-color)', borderBottom: '2px solid var(--border)' }}>
                        <th style={{ padding: '0.75rem' }}>Data e Hora</th>
                        <th style={{ padding: '0.75rem' }}>Leitor 1</th>
                        <th style={{ padding: '0.75rem' }}>Leitor(es) Extra(s)</th>
                        <th style={{ padding: '0.75rem' }}>Animador</th>
                        <th style={{ padding: '0.75rem' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedules.map((schedule) => {
                        const isWeekend = schedule.day_type === 'SATURDAY' || schedule.day_type === 'SUNDAY' || schedule.day_type === 'SPECIAL';
                        const dateParts = schedule.mass_date.split('-');
                        const displayDate = `${dateParts[2]}/${dateParts[1]} às ${schedule.mass_time}`;
                        
                        const isIncomplete = !schedule.reader_1_name || !schedule.animator_name || (isWeekend && !schedule.reader_2_name);
                        
                        return (
                          <tr key={schedule.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: isIncomplete ? 'var(--error-bg)' : 'white' }}>
                            <td style={{ padding: '0.75rem', fontWeight: 500 }}>{displayDate}</td>
                            <td style={{ padding: '0.75rem' }}>{schedule.reader_1_name || <span style={{ color: 'var(--error)' }}>Faltando</span>}</td>
                            <td style={{ padding: '0.75rem' }}>
                              {!isWeekend && !schedule.reader_2_name ? '-' : 
                                [schedule.reader_2_name, schedule.reader_3_name, schedule.reader_4_name]
                                  .filter(Boolean).join(', ') || <span style={{ color: 'var(--error)' }}>Faltando</span>
                              }
                            </td>
                            <td style={{ padding: '0.75rem' }}>{schedule.animator_name || <span style={{ color: 'var(--error)' }}>Faltando</span>}</td>
                            <td style={{ padding: '0.75rem' }}>
                              <span style={{ 
                                fontSize: '0.8rem', 
                                padding: '0.25rem 0.5rem', 
                                borderRadius: '1rem',
                                backgroundColor: schedule.status === 'CONFIRMED' ? 'var(--success-bg)' : 'var(--bg-color)',
                                color: schedule.status === 'CONFIRMED' ? 'var(--success)' : 'var(--text-main)',
                              }}>
                                {schedule.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {schedules.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                            Missas geradas, mas escala ainda não processada. Clique em "Gerar Escala Automática".
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
