import { generateMasses } from '@/lib/scheduleService';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { year, month } = await request.json();
    if (!year || !month) return NextResponse.json({ error: 'Ano e mês são obrigatórios' }, { status: 400 });

    const count = generateMasses(year, month);
    return NextResponse.json({ success: true, count, message: `Foram geradas/verificadas ${count} missas para ${month}/${year}` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao gerar missas' }, { status: 500 });
  }
}

export async function GET(request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const month = searchParams.get('month');
  
  if (!year || !month) return NextResponse.json({ error: 'Ano e mês requeridos' }, { status: 400 });
  
  const prefix = `${year}-${month.padStart(2, '0')}`;
  const db = getDb();

  const masses = db.prepare('SELECT * FROM masses WHERE mass_date LIKE ? ORDER BY mass_date, mass_time').all(`${prefix}%`);
  return NextResponse.json({ masses });
}
