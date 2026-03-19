'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Alert from '@/app/components/Alert';

export default function EscalaPage() {
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const [monthStatus, setMonthStatus] = useState('OPEN');
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
      setMonthStatus(data.monthStatus || 'OPEN');
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
  const statusMap = { 'OPEN': 'Em preenchimento', 'DRAFT': 'Provisória', 'PUBLISHED': 'Definitiva' };

  const renderRoleBadge = (role, color) => (
    <span style={{ 
      backgroundColor: color, color: 'white', fontWeight: 'bold', 
      fontSize: '0.7rem', padding: '0.15rem 0.35rem', borderRadius: '4px', marginRight: '6px', display: 'inline-block', minWidth: '24px', textAlign: 'center'
    }}>{role}</span>
  );

  return (
    <>
      {user && <Header user={user} />}
      <main className="main-content">
        <div className="card large">
          <h2 className="card-title">Escala Mensal - {statusMap[monthStatus]}</h2>
          
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

          <div style={{ padding: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid var(--border)', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <strong style={{ color: 'var(--text-muted)' }}>Legenda das Funções:</strong>
            <div style={{ display: 'flex', alignItems: 'center' }}>{renderRoleBadge('L1', '#2563eb')} Leitor 1ª Leitura</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>{renderRoleBadge('L2', '#0d9488')} Leitor 2ª Leitura</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>{renderRoleBadge('L3 a L7', '#9333ea')} Leitores Extras</div>
            <div style={{ display: 'flex', alignItems: 'center' }}>{renderRoleBadge('A', '#ea580c')} Animador</div>
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
                      backgroundColor: 'var(--surface-container-lowest)',
                      border: '1px solid var(--border)',
                      borderRadius: '1.5rem',
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--surface-container-highest)', paddingBottom: '0.8rem', marginBottom: '0.5rem' }}>
                        <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>{displayDate} às {schedule.mass_time} {schedule.mass_name ? `(${schedule.mass_name})` : ''}</strong>
                        <span style={{ 
                          fontSize: '0.8rem', 
                          padding: '0.3rem 0.8rem', 
                          borderRadius: '9999px',
                          backgroundColor: schedule.status === 'CONFIRMED' ? 'var(--success-bg)' : 'var(--surface-container-highest)',
                          color: schedule.status === 'CONFIRMED' ? 'var(--success)' : 'var(--text-main)',
                          fontWeight: 'bold'
                        }}>
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
                            <span style={{ fontWeight: 500 }}>{[schedule.reader_3_name, schedule.reader_4_name, schedule.reader_5_name, schedule.reader_6_name, schedule.reader_7_name].filter(Boolean).join(', ')}</span>
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
                      backgroundColor: 'var(--surface-container-lowest)',
                      border: '1px solid var(--border)',
                      borderRadius: '1.5rem',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: '120px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
                    }}>
                      <span style={{ fontWeight: '800', marginBottom: '12px', display: 'block', fontSize: '1.2rem', color: 'var(--primary)' }}>{day}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {daySchedules.map(sch => (
                          <div key={sch.id} style={{ fontSize: '0.75rem', backgroundColor: '#f0fdfa', padding: '4px', borderRadius: '4px', border: '1px solid #ccfbf1' }}>
                            <strong style={{ color: 'var(--primary)', display: 'block', marginBottom: '4px' }}>{sch.mass_time} {sch.mass_name ? `(${sch.mass_name})` : ''}</strong>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              {sch.reader_1_name && <div style={{ color: '#374151' }}>{renderRoleBadge('L1', '#2563eb')} {sch.reader_1_name}</div>}
                              {sch.reader_2_name && <div style={{ color: '#374151' }}>{renderRoleBadge('L2', '#0d9488')} {sch.reader_2_name}</div>}
                              {sch.reader_3_name && <div style={{ color: '#374151' }}>{renderRoleBadge('L3', '#9333ea')} {sch.reader_3_name}</div>}
                              {sch.reader_4_name && <div style={{ color: '#374151' }}>{renderRoleBadge('L4', '#c026d3')} {sch.reader_4_name}</div>}
                              {sch.reader_5_name && <div style={{ color: '#374151' }}>{renderRoleBadge('L5', '#e11d48')} {sch.reader_5_name}</div>}
                              {sch.reader_6_name && <div style={{ color: '#374151' }}>{renderRoleBadge('L6', '#ca8a04')} {sch.reader_6_name}</div>}
                              {sch.reader_7_name && <div style={{ color: '#374151' }}>{renderRoleBadge('L7', '#4d7c0f')} {sch.reader_7_name}</div>}
                              {sch.animator_name && <div style={{ color: '#374151' }}>{renderRoleBadge('A', '#ea580c')} {sch.animator_name}</div>}
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
