'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Alert from '@/app/components/Alert';
import Link from 'next/link';
import { Clock, Calendar, Plus, Church, ChevronLeft, ChevronRight } from 'lucide-react';

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
        s.reader_5_id === loggedUser.id || 
        s.reader_6_id === loggedUser.id || 
        s.reader_7_id === loggedUser.id || 
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
  const shortMonthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const dayNamesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getDayName = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    const dateObj = new Date(y, m - 1, d);
    return dayNamesShort[dateObj.getDay()];
  };

  const getUserRole = (sch) => {
    const isWeekend = sch.day_type === 'SATURDAY' || sch.day_type === 'SUNDAY' || sch.day_type === 'SPECIAL';
    let roles = [];
    if (sch.reader_1_id === user?.id) roles.push(isWeekend ? 'Leitor 1' : 'Leitor');
    if (sch.reader_2_id === user?.id) roles.push('Leitor 2');
    if (sch.reader_3_id === user?.id) roles.push('Extra');
    if (sch.reader_4_id === user?.id) roles.push('Extra');
    if (sch.reader_5_id === user?.id) roles.push('Extra');
    if (sch.reader_6_id === user?.id) roles.push('Extra');
    if (sch.reader_7_id === user?.id) roles.push('Extra');
    if (sch.animator_id === user?.id) roles.push('Animador');
    return roles.length > 0 ? roles[0] : 'Escalado';
  };

  const getBadgeColor = (role) => {
    if(role.includes('Animador')) return { bg: '#cffafe', color: '#0891b2' };
    if(role.includes('Leitor 1') || role === 'Leitor') return { bg: '#a7f3d0', color: '#059669' };
    return { bg: '#e0e7ff', color: '#4f46e5' }; 
  }

  const firstSch = mySchedules.length > 0 ? mySchedules[0] : null;

  return (
    <>
      {user && <Header user={user} />}
      <main style={{ padding: '2rem 1.5rem 6rem', maxWidth: '600px', margin: '0 auto', width: '100%', boxSizing: 'border-box', position: 'relative', minHeight: '100vh' }}>
        
        <div style={{ marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.08em', color: 'var(--secondary)', textTransform: 'uppercase' }}>
            Controle de Voluntários
          </span>
          <h1 style={{ fontSize: '2.4rem', fontWeight: '800', color: 'var(--primary)', margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
            Minhas Escalas
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            Visualize suas próximas missas e horários atribuídos.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '0 auto 2rem', gap: '1rem', backgroundColor: 'var(--surface)', padding: '0.5rem', borderRadius: '9999px' }}>
          <button onClick={prevMonth} style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--border)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <ChevronLeft color="var(--primary)" size={20} />
          </button>
          <h3 style={{ fontSize: '1rem', margin: 0, minWidth: '120px', textAlign: 'center', color: 'var(--primary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {monthNames[month - 1]} {year}
          </h3>
          <button onClick={nextMonth} style={{ background: 'var(--surface-container-lowest)', border: '1px solid var(--border)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <ChevronRight color="var(--primary)" size={20} />
          </button>
        </div>

        <Alert type="error" message={error} />

        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>Carregando escalas...</p>
        ) : (
          <>
            {firstSch && (
              <div style={{ backgroundColor: 'var(--surface-container-lowest)', borderRadius: '1.5rem', padding: '1.5rem 1.5rem 2rem', position: 'relative', overflow: 'hidden', marginBottom: '2rem', boxShadow: '0 10px 30px rgba(0,32,70,0.05)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>Próxima Missa</span>
                
                <h2 style={{ fontSize: '1.8rem', fontWeight: '800', color: 'var(--primary)', margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', zIndex: 1, position: 'relative' }}>
                  {getDayName(firstSch.mass_date)}, {firstSch.mass_time}
                </h2>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', zIndex: 1, position: 'relative' }}>
                  <span style={{ fontSize: '0.7rem', backgroundColor: getBadgeColor(getUserRole(firstSch)).bg, color: getBadgeColor(getUserRole(firstSch)).color, padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {getUserRole(firstSch)}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '500' }}>
                    {firstSch.mass_name || 'Paróquia Imaculado Coração'}
                  </span>
                </div>
                
                <Church size={160} color="var(--surface)" style={{ position: 'absolute', right: '-20px', bottom: '-30px', zIndex: 0, opacity: 0.8 }} />
              </div>
            )}

            {mySchedules.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', padding: '0 0.25rem' }}>
                <h3 style={{ fontSize: '1.2rem', color: 'var(--primary)', margin: 0, fontWeight: '800' }}>Próximos Compromissos</h3>
                <Link href="/escala" style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: '800', textDecoration: 'none' }}>Ver Calendário</Link>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {mySchedules.map((sch, index) => {
                if (index === 0) return null; // Já mostrado no card principal

                const dateParts = sch.mass_date.split('-');
                const monthAbbr = shortMonthNames[parseInt(dateParts[1], 10) - 1];
                const dayNum = dateParts[2];
                const role = getUserRole(sch);
                const badgeColor = getBadgeColor(role);

                return (
                  <div key={sch.id} style={{ 
                    backgroundColor: 'var(--surface-container-lowest)', 
                    borderRadius: '1rem', 
                    padding: '1.25rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1.25rem',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: '4px', backgroundColor: 'var(--secondary)', borderRadius: '0 4px 4px 0' }} />
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minWidth: '40px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>{monthAbbr}</span>
                      <span style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)', lineHeight: 1 }}>{dayNum}</span>
                    </div>
                    
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--primary)', fontWeight: '800' }}>{sch.mass_name || 'Missa Regular'}</h4>
                        <span style={{ fontSize: '0.65rem', backgroundColor: badgeColor.bg, color: badgeColor.color, padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                          {role}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                        <Clock size={14} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>{sch.mass_time}</span>
                      </div>
                      
                      <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                         <span style={{ fontWeight: '800', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Animador:</span>
                         <span style={{ color: 'var(--text-main)', fontWeight: '600' }}>{sch.animator_name || 'A definir'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ border: '2px dashed var(--border)', borderRadius: '1.5rem', padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'transparent', marginTop: '1.5rem' }}>
              <Calendar size={32} color="var(--border)" style={{ marginBottom: '0.75rem' }} />
              <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>Não há mais escalas para este mês.</p>
            </div>
          </>
        )}

        {/* Floating Action Button */}
        <Link href="/disponibilidade" style={{ 
          position: 'fixed', 
          bottom: '2rem', 
          left: '50%', 
          transform: 'translateX(-50%)', 
          backgroundColor: 'var(--primary)', 
          color: 'white', 
          padding: '1rem 2rem', 
          borderRadius: '9999px', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem', 
          textDecoration: 'none', 
          fontWeight: '700', 
          boxShadow: '0 10px 25px rgba(0,32,70,0.3)', 
          zIndex: 100,
          whiteSpace: 'nowrap'
        }}>
          <Plus size={20} />
          Disponibilidade
        </Link>

      </main>
    </>
  );
}
