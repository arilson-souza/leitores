import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  if (!year || !month) {
    return NextResponse.json({ error: 'Ano e mês são obrigatórios' }, { status: 400 });
  }

  const db = getDb();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  try {
    const masses = db.prepare(`
      SELECT id, mass_date, mass_time, day_type, name, required_readers 
      FROM masses 
      WHERE mass_date LIKE ? 
      ORDER BY mass_date, mass_time
    `).all(`${prefix}%`);
    
    let monthStatusRecord = db.prepare('SELECT status FROM schedule_months WHERE year = ? AND month = ?').get(year, month);
    const monthStatus = monthStatusRecord ? monthStatusRecord.status : 'OPEN';

    return NextResponse.json({ masses, monthStatus });
  } catch (error) {
    console.error('Error fetching masses:', error);
    return NextResponse.json({ error: 'Erro ao buscar missas do mês' }, { status: 500 });
  }
}
