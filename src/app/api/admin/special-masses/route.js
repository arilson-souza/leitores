import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const db = getDb();
  try {
    const specialMasses = db.prepare('SELECT id, mass_date, mass_time, name, required_readers FROM masses WHERE day_type = ? ORDER BY mass_date, mass_time').all('SPECIAL');
    return NextResponse.json({ specialMasses });
  } catch (error) {
    console.error('Error fetching special masses:', error);
    return NextResponse.json({ error: 'Erro ao buscar missas especiais' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { mass_date, mass_time, name, required_readers } = await request.json();

    if (!mass_date || !mass_time || !name || !required_readers) {
      return NextResponse.json({ error: 'Preencha todos os campos obrigatórios' }, { status: 400 });
    }

    const db = getDb();
    
    // Check if a mass already exists at the same date and time
    const existing = db.prepare('SELECT id FROM masses WHERE mass_date = ? AND mass_time = ?').get(mass_date, mass_time);
    if (existing) {
      return NextResponse.json({ error: 'Já existe uma missa cadastrada nesta data e hora' }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO masses (mass_date, mass_time, day_type, name, required_readers)
      VALUES (?, ?, 'SPECIAL', ?, ?)
    `).run(mass_date, mass_time, name, parseInt(required_readers, 10));

    return NextResponse.json({ success: true, message: 'Missa Especial cadastrada com sucesso', id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error adding special mass:', error);
    return NextResponse.json({ error: 'Erro ao adicionar missa especial' }, { status: 500 });
  }
}
