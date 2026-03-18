'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Alert from '@/app/components/Alert';

export default function EscalaPage() {
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
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
        setUser(userData.user);
      }

      const res = await fetch(`/api/schedules?year=${year}&month=${month}`);
      if (!res.ok) throw new Error('Falha ao buscar escalas');
      
      const data = await res.json();
      setSchedules(data.schedules);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(new Date(year, month, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1));

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  return (
    <>
      {user && <Header user={user} />}
      <main className="main-content">
        <div className="card large">
          <h2 className="card-title">Escala Mensal Definitiva</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <button onClick={prevMonth} className="btn btn-secondary" style={{ width: 'auto' }}>&larr; Anterior</button>
              <h3 style={{ fontSize: '1.2rem', margin: 0, minWidth: '150px', textAlign: 'center' }}>{monthNames[month - 1]} {year}</h3>
              <button onClick={nextMonth} className="btn btn-secondary" style={{ width: 'auto' }}>Próximo &rarr;</button>
            </div>
            
            <div style={{ display: 'flex', border: '1px solid var(--primary)', borderRadius: '4px', overflow: 'hidden' }}>
              <button 
                onClick={() => setViewMode('list')} 
                style={{ padding: '0.4rem 1rem', border: 'none', background: viewMode === 'list' ? 'var(--primary)' : 'white', color: viewMode === 'list' ? 'white' : 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Lista
              </button>
              <button 
                onClick={() => setViewMode('calendar')} 
                style={{ padding: '0.4rem 1rem', border: 'none', borderLeft: '1px solid var(--primary)', background: viewMode === 'calendar' ? 'var(--primary)' : 'white', color: viewMode === 'calendar' ? 'white' : 'var(--primary)', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Calendário
              </button>
            </div>
          </div>

          <Alert type="error" message={error} />

          {loading ? (
            <p style={{ textAlign: 'center' }}>Carregando...</p>
          ) : schedules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Nenhuma escala gerada para este mês ainda.</p>
            </div>
          ) : (
            viewMode === 'list' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {schedules.map((schedule) => {
                  const dateParts = schedule.mass_date.split('-');
                  const displayDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                  const isWeekend = schedule.day_type === 'SATURDAY' || schedule.day_type === 'SUNDAY' || schedule.day_type === 'SPECIAL';

                  return (
                    <div key={schedule.id} style={{ 
                      border: '1px solid var(--border)', 
                      borderRadius: '8px', 
                      padding: '1rem',
                      backgroundColor: 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                        <strong style={{ color: 'var(--primary)' }}>{displayDate} às {schedule.mass_time} {schedule.mass_name ? `(${schedule.mass_name})` : ''}</strong>
                        <span style={{ fontSize: '0.8rem', color: schedule.status === 'CONFIRMED' ? 'var(--success)' : 'var(--text-muted)' }}>
                          {schedule.status}
                        </span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>
                            {isWeekend ? 'Leitor 1' : 'Leitor'}
                          </span>
                          <span style={{ fontWeight: 500 }}>{schedule.reader_1_name || 'A definir'}</span>
                        </div>
                        
                        {isWeekend && (
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Leitor 2</span>
                            <span style={{ fontWeight: 500 }}>{schedule.reader_2_name || 'A definir'}</span>
                          </div>
                        )}

                        {schedule.reader_3_name && (
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Leitor(es) Extra(s)</span>
                            <span style={{ fontWeight: 500 }}>{[schedule.reader_3_name, schedule.reader_4_name].filter(Boolean).join(', ')}</span>
                          </div>
                        )}

                        <div>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Animador</span>
                          <span style={{ fontWeight: 500 }}>{schedule.animator_name || 'A definir'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', overflowX: 'auto', minWidth: '700px' }}>
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                  <div key={d} style={{ fontWeight: 'bold', textAlign: 'center', padding: '10px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '4px' }}>
                    {d}
                  </div>
                ))}
                
                {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}></div>
                ))}

                {Array.from({ length: new Date(year, month, 0).getDate() }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const daySchedules = schedules.filter(s => s.mass_date === dateStr);
                  
                  return (
                    <div key={day} style={{ 
                      border: '1px solid var(--border)', 
                      borderRadius: '4px', 
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: '120px',
                      backgroundColor: 'white'
                    }}>
                      <span style={{ fontWeight: 'bold', paddingBottom: '4px', borderBottom: '1px solid var(--border)', marginBottom: '8px' }}>{day}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {daySchedules.map(sch => (
                          <div key={sch.id} style={{ fontSize: '0.75rem', backgroundColor: '#f0fdfa', padding: '4px', borderRadius: '4px', border: '1px solid #ccfbf1' }}>
                            <strong style={{ color: 'var(--primary)', display: 'block' }}>{sch.mass_time} {sch.mass_name ? `(${sch.mass_name})` : ''}</strong>
                            <div style={{ marginTop: '2px', color: '#374151' }}>
                              L: {[sch.reader_1_name, sch.reader_2_name, sch.reader_3_name, sch.reader_4_name].filter(Boolean).join(', ') || 'Nenhum'}
                            </div>
                            <div style={{ marginTop: '2px', color: '#166534' }}>
                              A: {sch.animator_name || 'Nenhum'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </div>
      </main>
    </>
  );
}
