'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Alert from '@/app/components/Alert';

export default function DisponibilidadePage() {
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availabilities, setAvailabilities] = useState([]); // Array of string 'YYYY-MM-DD HH:MM'
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

      const res = await fetch(`/api/availabilities?year=${year}&month=${month}`);
      if (res.ok) {
        const data = await res.json();
        const formatted = data.availabilities.map(a => `${a.mass_date} ${a.mass_time}`);
        setAvailabilities(formatted);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const nextMonth = () => setCurrentDate(new Date(year, month, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 2, 1));

  // Determine fixed masses for the month
  const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate();
  const daysInMonth = getDaysInMonth(year, month);
  
  const generateMonthDays = () => {
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const d = new Date(year, month - 1, i);
      const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon, ... 6 = Sat

      let slots = [];
      if (dayOfWeek >= 1 && dayOfWeek <= 3 || dayOfWeek === 5) { // Mon, Tue, Wed, Fri
        slots = ['19:30'];
      } else if (dayOfWeek === 4) { // Thu
        slots = ['20:00'];
      } else if (dayOfWeek === 6) { // Sat
        slots = ['19:00'];
      } else if (dayOfWeek === 0) { // Sun
        slots = ['08:00', '10:30', '19:00'];
      }

      days.push({
        date: dateStr,
        dayOfMonth: i,
        dayOfWeek,
        slots
      });
    }
    return days;
  };

  const days = generateMonthDays();

  const toggleSlot = (date, time) => {
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
          ) : (
            <>
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
                      {day.slots.map(time => {
                        const isSelected = availabilities.includes(`${day.date} ${time}`);
                        return (
                          <button 
                            key={time}
                            onClick={() => toggleSlot(day.date, time)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '0.8rem',
                              border: `1px solid ${isSelected ? 'var(--secondary)' : 'var(--border)'}`,
                              backgroundColor: isSelected ? 'var(--secondary)' : 'white',
                              color: isSelected ? 'white' : 'var(--text-main)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                          >
                            {time}
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
                  disabled={saving}
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
