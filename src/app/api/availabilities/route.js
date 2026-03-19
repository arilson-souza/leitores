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
    const availabilities = db.prepare(`
      SELECT mass_date, mass_time, role FROM availabilities
      WHERE user_id = ? AND mass_date LIKE ?
    `).all(session.id, `${prefix}%`);

    return NextResponse.json({ availabilities });
  } catch (error) {
    console.error('Error fetching availabilities:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { year, month, selectedSlots } = await request.json(); // selectedSlots: [{ mass_date: 'YYYY-MM-DD', mass_time: 'HH:MM' }, ...]
    
    if (!year || !month || !Array.isArray(selectedSlots)) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }

    const prefix = `${year}-${month.padStart(2, '0')}`;
    const db = getDb();

    // Use a transaction to replace old availabilities for the month
    const updateAvailabilities = db.transaction((slots) => {
      // Delete old slots for this month
      db.prepare(`
        DELETE FROM availabilities 
        WHERE user_id = ? AND mass_date LIKE ?
      `).run(session.id, `${prefix}%`);

      // Insert new slots
      const insert = db.prepare(`
        INSERT INTO availabilities (user_id, mass_date, mass_time, role) 
        VALUES (?, ?, ?, ?)
      `);

      for (const slot of slots) {
        insert.run(session.id, slot.mass_date, slot.mass_time, slot.role || 'AMBOS');
      }
    });

    updateAvailabilities(selectedSlots);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving availabilities:', error);
    return NextResponse.json({ error: 'Erro interno ao salvar disponibilidades' }, { status: 500 });
  }
}
