'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Alert from '@/app/components/Alert';

export default function DisponibilidadePage() {
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availabilities, setAvailabilities] = useState([]); // Array of string 'YYYY-MM-DD HH:MM'
  const [masses, setMasses] = useState([]);
  const [monthStatus, setMonthStatus] = useState('OPEN');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  useEffect(() => {
    fetchUserAndData();
  }, [currentDate]);

  const fetchUserAndData = async () => {
    setLoading(true);
    try {
      const userRes = await fetch('/api/auth/me');
      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData.user);
      }

      const [resAvail, resMasses] = await Promise.all([
        fetch(`/api/availabilities?year=${year}&month=${month}`),
        fetch(`/api/masses?year=${year}&month=${month}`)
      ]);

      if (resAvail.ok) {
        const data = await resAvail.json();
        const formatted = data.availabilities.map(a => `${a.mass_date} ${a.mass_time}`);
        setAvailabilities(formatted);
      }
      
      if (resMasses.ok) {
        const data = await resMasses.json();
        setMasses(data.masses);
        setMonthStatus(data.monthStatus);
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar dados do mês.');
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(new Date(year, month, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1));

  // Group fetched masses by date
  const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate();
  const daysInMonth = getDaysInMonth(year, month);
  
  const generateMonthDays = () => {
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const d = new Date(year, month - 1, i);
      const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat

      // Find masses for this date
      const slotsForDay = masses.filter(m => m.mass_date === dateStr);
      
      days.push({
        date: dateStr,
        dayOfMonth: i,
        dayOfWeek,
        slots: slotsForDay
      });
    }
    return days;
  };

  const days = generateMonthDays();

  const toggleSlot = (date, time) => {
    if (monthStatus !== 'OPEN') return;
    const val = `${date} ${time}`;
    if (availabilities.includes(val)) {
      setAvailabilities(availabilities.filter(a => a !== val));
    } else {
      setAvailabilities([...availabilities, val]);
    }
    setMessage(''); // clear success messsage on change
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    const formattedSlots = availabilities.map(a => {
      const [mass_date, mass_time] = a.split(' ');
      return { mass_date, mass_time };
    });

    try {
      const res = await fetch('/api/availabilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year: String(year), month: String(month), selectedSlots: formattedSlots })
      });

      if (!res.ok) throw new Error('Falha ao salvar');
      setMessage('Disponibilidade salva com sucesso!');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <>
      {user && <Header user={user} />}
      <main className="main-content">
        <div className="card large">
          <h2 className="card-title">Minha Disponibilidade</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <button onClick={prevMonth} className="btn btn-secondary" style={{ width: 'auto' }}>&larr; Anterior</button>
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{monthNames[month - 1]} {year}</h3>
            <button onClick={nextMonth} className="btn btn-secondary" style={{ width: 'auto' }}>Próximo &rarr;</button>
          </div>

          <Alert type="error" message={error} />
          <Alert type="success" message={message} />

          {loading ? (
            <p style={{ textAlign: 'center' }}>Carregando...</p>
          ) : masses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <p style={{ color: 'var(--text-muted)' }}>As missas deste mês ainda não foram liberadas pelo coordenador.</p>
            </div>
          ) : (
            <>
              {monthStatus !== 'OPEN' && (
                <Alert type="error" message="A escala deste mês já está Provisória ou Definitiva. Não é possível alterar sua disponibilidade." />
              )}
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginBottom: '20px' }}>
                {dayNames.map(d => (
                  <div key={d} style={{ fontWeight: 'bold', textAlign: 'center', padding: '10px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '4px' }}>
                    {d}
                  </div>
                ))}
                
                {/* Padding for first day of month */}
                {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} style={{ padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}></div>
                ))}

                {days.map(day => (
                  <div key={day.date} style={{ 
                    border: '1px solid var(--border)', 
                    borderRadius: '4px', 
                    padding: '10px',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100px',
                    backgroundColor: day.dayOfWeek === 0 || day.dayOfWeek === 6 ? '#f0fdfa' : 'white'
                  }}>
                    <span style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>{day.dayOfMonth}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                      {day.slots.map(mass => {
                        const isSelected = availabilities.includes(`${day.date} ${mass.mass_time}`);
                        return (
                          <button 
                            key={mass.mass_time}
                            onClick={() => toggleSlot(day.date, mass.mass_time)}
                            disabled={monthStatus !== 'OPEN'}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.8rem',
                              border: `1px solid ${isSelected ? 'var(--secondary)' : 'var(--border)'}`,
                              backgroundColor: isSelected ? 'var(--secondary)' : (monthStatus !== 'OPEN' ? '#f3f4f6' : 'white'),
                              color: isSelected ? 'white' : 'var(--text-main)',
                              borderRadius: '4px',
                              cursor: monthStatus !== 'OPEN' ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s',
                              opacity: monthStatus !== 'OPEN' && !isSelected ? 0.6 : 1
                            }}
                            title={mass.name || ''}
                          >
                            {mass.mass_time} {mass.day_type === 'SPECIAL' && '⭐'}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2rem' }}>
                <button 
                  className="btn" 
                  style={{ maxWidth: '300px' }} 
                  onClick={handleSave}
                  disabled={saving || monthStatus !== 'OPEN'}
                >
                  {saving ? 'Salvando...' : 'Salvar Disponibilidade'}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
