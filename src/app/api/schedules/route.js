import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');

  if (!year || !month) {
    return NextResponse.json({ error: 'Ano e mês são requeridos' }, { status: 400 });
  }

  const prefix = `${year}-${month.padStart(2, '0')}`;
  const db = getDb();

  try {
    const schedules = db.prepare(`
      SELECT 
        s.id, s.status, m.mass_date, m.mass_time, m.day_type, m.name as mass_name,
        s.reader_1_id, s.reader_2_id, s.reader_3_id, s.reader_4_id, s.animator_id,
        u1.name as reader_1_name,
        u2.name as reader_2_name,
        u3.name as reader_3_name,
        u4.name as reader_4_name,
        ua.name as animator_name
      FROM schedules s
      JOIN masses m ON s.mass_id = m.id
      LEFT JOIN users u1 ON s.reader_1_id = u1.id
      LEFT JOIN users u2 ON s.reader_2_id = u2.id
      LEFT JOIN users u3 ON s.reader_3_id = u3.id
      LEFT JOIN users u4 ON s.reader_4_id = u4.id
      LEFT JOIN users ua ON s.animator_id = ua.id
      WHERE m.mass_date LIKE ?
      ORDER BY m.mass_date, m.mass_time
    `).all(`${prefix}%`);

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
