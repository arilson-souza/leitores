'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Alert from '@/app/components/Alert';

export default function DisponibilidadePage() {
  const [user, setUser] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availabilities, setAvailabilities] = useState({}); // { "YYYY-MM-DD HH:MM": "LEITOR" | "ANIMADOR" | "AMBOS" }
  const [modalOpen, setModalOpen] = useState(false);
  const [slotToAssign, setSlotToAssign] = useState(null);
  const [tempRole, setTempRole] = useState('LEITOR');
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
        const availObj = {};
        data.availabilities.forEach(a => {
           availObj[`${a.mass_date} ${a.mass_time}`] = a.role || 'AMBOS';
        });
        setAvailabilities(availObj);
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
    if (availabilities[val]) {
      setAvailabilities(prev => {
        const newAvails = { ...prev };
        delete newAvails[val];
        return newAvails;
      });
      setMessage('');
    } else {
      setSlotToAssign(val);
      if (user?.can_be_reader) setTempRole('LEITOR');
      else if (user?.can_be_animator) setTempRole('ANIMADOR');
      
      setModalOpen(true);
      setMessage('');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setMessage('');

    const formattedSlots = Object.entries(availabilities).map(([key, role]) => {
      const [mass_date, mass_time] = key.split(' ');
      return { mass_date, mass_time, role };
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
        <div className="card large" style={{ padding: '0', backgroundColor: 'transparent' }}>
          <h2 className="card-title" style={{ textAlign: 'left', fontSize: '2rem' }}>Minha Disponibilidade</h2>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', backgroundColor: 'var(--surface-container-lowest)', padding: '1rem', borderRadius: '1.5rem' }}>
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
              
              {modalOpen && (
                <div style={{
                  position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundColor: 'rgba(0,32,70,0.4)', zIndex: 1000,
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  backdropFilter: 'blur(4px)'
                }} onClick={() => setModalOpen(false)}>
                  
                  <div className="bottom-sheet" style={{ 
                    backgroundColor: 'var(--surface-container-lowest)', 
                    padding: '2rem 1.5rem', 
                    borderTopLeftRadius: '2rem', borderTopRightRadius: '2rem', 
                    width: '100%', 
                    boxShadow: '0 -20px 40px rgba(0,32,70,0.15)' 
                  }} onClick={e => e.stopPropagation()}>
                    
                    <div style={{ width: '40px', height: '6px', backgroundColor: 'var(--surface-container-highest)', borderRadius: '3px', margin: '0 auto 1.5rem auto' }} />
                    <h3 className="text-headline">Escolher Função</h3>
                    <p className="text-body" style={{ marginBottom: '2rem' }}>
                      Como deseja servir no horário selecionado ({slotToAssign})?
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                      {user?.can_be_reader === 1 ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', padding: '1rem', border: tempRole === 'LEITOR' ? '2px solid #059669' : '2px solid var(--surface-container-highest)', borderRadius: '1rem', backgroundColor: tempRole === 'LEITOR' ? '#a7f3d0' : 'var(--surface)' }}>
                          <input type="radio" checked={tempRole === 'LEITOR'} onChange={() => setTempRole('LEITOR')} style={{ width: '20px', height: '20px', accentColor: '#059669' }} />
                          <span style={{ fontSize: '1.1rem', fontWeight: tempRole === 'LEITOR' ? '700' : '500', color: '#065f46' }}>📖 Leitor</span>
                        </label>
                      ) : null}
                      {user?.can_be_animator === 1 ? (
                        <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', padding: '1rem', border: tempRole === 'ANIMADOR' ? '2px solid #0891b2' : '2px solid var(--surface-container-highest)', borderRadius: '1rem', backgroundColor: tempRole === 'ANIMADOR' ? '#cffafe' : 'var(--surface)' }}>
                          <input type="radio" checked={tempRole === 'ANIMADOR'} onChange={() => setTempRole('ANIMADOR')} style={{ width: '20px', height: '20px', accentColor: '#0891b2' }} />
                          <span style={{ fontSize: '1.1rem', fontWeight: tempRole === 'ANIMADOR' ? '700' : '500', color: '#0e7490' }}>🎵 Animador</span>
                        </label>
                      ) : null}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                      <button className="btn" style={{ padding: '1rem' }} onClick={() => {
                        setAvailabilities(prev => ({ ...prev, [slotToAssign]: tempRole }));
                        setModalOpen(false);
                      }}>Confirmar Função</button>
                      <button className="btn-secondary" style={{ padding: '1rem', borderRadius: '9999px', border: 'none', fontWeight: '600', width: '100%', fontSize: '1rem', cursor: 'pointer' }} onClick={() => setModalOpen(false)}>Cancelar</button>
                    </div>
                  </div>
                </div>
              )}
              
              <div style={{ overflowX: 'auto', paddingBottom: '1rem', margin: '0 -1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', padding: '0 1rem', minWidth: '800px' }}>
                  {dayNames.map(d => (
                    <div key={d} style={{ fontWeight: 'bold', textAlign: 'center', padding: '12px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '1rem' }}>
                      {d}
                    </div>
                  ))}
                  
                  {/* Padding for first day of month */}
                  {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} style={{ padding: '20px', backgroundColor: 'var(--surface-container-low)', borderRadius: '1rem' }}></div>
                  ))}

                  {days.map(day => (
                    <div key={day.date} style={{ 
                      borderRadius: '1rem', 
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      minHeight: '120px',
                      backgroundColor: 'var(--surface-container-lowest)',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}>
                      <span style={{ fontWeight: '800', marginBottom: '12px', display: 'block', fontSize: '1.2rem', color: 'var(--primary)' }}>{day.dayOfMonth}</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {day.slots.map(mass => {
                          const valKey = `${day.date} ${mass.mass_time}`;
                          const isSelected = !!availabilities[valKey];
                          const roleAssigned = availabilities[valKey];
                          
                          let displayLabel = `${mass.mass_time} ${mass.day_type === 'SPECIAL' ? '⭐' : ''}`;
                          if (isSelected) {
                            if (roleAssigned === 'LEITOR') displayLabel += ' (L)';
                            else if (roleAssigned === 'ANIMADOR') displayLabel += ' (A)';
                            else displayLabel += ' (L/A)';
                          }
                          
                          const btnBg = isSelected
                            ? (roleAssigned === 'LEITOR' ? '#059669' : roleAssigned === 'ANIMADOR' ? '#0891b2' : 'var(--secondary)')
                            : (monthStatus !== 'OPEN' ? 'var(--surface-container-highest)' : 'var(--surface-container-low)');

                          return (
                            <button 
                              key={mass.mass_time}
                              onClick={() => toggleSlot(day.date, mass.mass_time)}
                              disabled={monthStatus !== 'OPEN'}
                              style={{
                                padding: '8px 12px',
                                fontSize: '0.85rem',
                                border: 'none',
                                fontWeight: isSelected ? '700' : '500',
                                backgroundColor: btnBg,
                                color: isSelected ? 'white' : 'var(--text-main)',
                                borderRadius: '9999px',
                                cursor: monthStatus !== 'OPEN' ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                                opacity: monthStatus !== 'OPEN' && !isSelected ? 0.6 : 1,
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                              title={mass.name || ''}
                            >
                              <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isSelected ? 'white' : 'var(--primary)', marginRight: '8px' }} />
                              {displayLabel}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem', marginBottom: '2rem' }}>
                <button 
                  className="btn" 
                  style={{ maxWidth: '300px', padding: '1rem', fontSize: '1.1rem' }} 
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
