'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Alert from '@/app/components/Alert';

export default function MinhasEscalasPage() {
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mySchedules, setMySchedules] = useState([]);
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
      let loggedUser = null;
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        loggedUser = userData.user;
        setUser(loggedUser);
      } else {
        throw new Error('Você precisa estar logado.');
      }

      const res = await fetch(`/api/schedules?year=${year}&month=${month}`);
      if (!res.ok) throw new Error('Falha ao buscar escalas');
      
      const data = await res.json();
      
      // Filter schedules where the logged user is assigned
      const filtered = data.schedules.filter(s => 
        s.reader_1_id === loggedUser.id || 
        s.reader_2_id === loggedUser.id || 
        s.reader_3_id === loggedUser.id || 
        s.reader_4_id === loggedUser.id || 
        s.animator_id === loggedUser.id
      );
      
      setMySchedules(filtered);
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
          <h2 className="card-title">Minhas Escalas</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
            Aqui estão todas as missas em que você foi escalado(a) neste mês.
          </p>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', margin: '0 auto' }}>
              <button onClick={prevMonth} className="btn btn-secondary" style={{ width: 'auto' }}>&larr; Anterior</button>
              <h3 style={{ fontSize: '1.2rem', margin: 0, minWidth: '150px', textAlign: 'center' }}>{monthNames[month - 1]} {year}</h3>
              <button onClick={nextMonth} className="btn btn-secondary" style={{ width: 'auto' }}>Próximo &rarr;</button>
            </div>
          </div>

          <Alert type="error" message={error} />

          {loading ? (
            <p style={{ textAlign: 'center' }}>Carregando...</p>
          ) : mySchedules.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Você não possui escalas programadas para este mês.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {mySchedules.map((schedule) => {
                const dateParts = schedule.mass_date.split('-');
                const displayDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`;
                const isWeekend = schedule.day_type === 'SATURDAY' || schedule.day_type === 'SUNDAY' || schedule.day_type === 'SPECIAL';

                // Highlight user's role
                let myRoleText = [];
                if (schedule.reader_1_id === user.id) myRoleText.push(isWeekend ? 'Leitor 1' : 'Leitor');
                if (schedule.reader_2_id === user.id) myRoleText.push('Leitor 2');
                if (schedule.reader_3_id === user.id) myRoleText.push('Leitor Extra (3)');
                if (schedule.reader_4_id === user.id) myRoleText.push('Leitor Extra (4)');
                if (schedule.animator_id === user.id) myRoleText.push('Animador');

                return (
                  <div key={schedule.id} style={{ 
                    border: '1px solid var(--secondary)', 
                    borderRadius: '8px', 
                    padding: '1rem',
                    backgroundColor: '#f0fdf4',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #bbf7d0', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
                      <strong style={{ color: 'var(--primary)', fontSize: '1.1rem' }}>
                        {displayDate} às {schedule.mass_time} {schedule.mass_name ? `(${schedule.mass_name})` : ''}
                      </strong>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        padding: '0.2rem 0.6rem',
                        backgroundColor: 'var(--secondary)',
                        color: 'white',
                        borderRadius: '1rem',
                        fontWeight: 'bold'
                      }}>
                        {myRoleText.join(', ')}
                      </span>
                    </div>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.9rem' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>
                          {isWeekend ? 'Leitor 1' : 'Leitor'}
                        </span>
                        <span style={{ fontWeight: schedule.reader_1_id === user.id ? 'bold' : 'normal' }}>
                          {schedule.reader_1_name || 'A definir'}
                        </span>
                      </div>
                      
                      {isWeekend && (
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block' }}>Leitor 2</span>
                          <span style={{ fontWeight: schedule.reader_2_id === user.id ? 'bold' : 'normal' }}>
                            {schedule.reader_2_name || 'A definir'}
                          </span>
                        </div>
                      )}

                      {schedule.reader_3_name && (
                        <div>
                          <span style={{ color: 'var(--text-muted)', display: 'block' }}>Leitor(es) Extra(s)</span>
                          <span style={{ fontWeight: (schedule.reader_3_id === user.id || schedule.reader_4_id === user.id) ? 'bold' : 'normal' }}>
                            {[schedule.reader_3_name, schedule.reader_4_name].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}

                      <div>
                        <span style={{ color: 'var(--text-muted)', display: 'block' }}>Animador</span>
                        <span style={{ fontWeight: schedule.animator_id === user.id ? 'bold' : 'normal' }}>
                          {schedule.animator_name || 'A definir'}
                        </span>
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
