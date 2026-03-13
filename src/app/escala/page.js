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
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button onClick={prevMonth} className="btn btn-secondary" style={{ width: 'auto' }}>&larr; Anterior</button>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{monthNames[month - 1]} {year}</h3>
            <button onClick={nextMonth} className="btn btn-secondary" style={{ width: 'auto' }}>Próximo &rarr;</button>
          </div>

          <Alert type="error" message={error} />

          {loading ? (
            <p style={{ textAlign: 'center' }}>Carregando...</p>
          ) : schedules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Nenhuma escala gerada para este mês ainda.</p>
            </div>
          ) : (
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
                      <strong style={{ color: 'var(--primary)' }}>{displayDate} às {schedule.mass_time}</strong>
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

                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Animador</span>
                        <span style={{ fontWeight: 500 }}>{schedule.animator_name || 'A definir'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
