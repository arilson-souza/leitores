import { generateSchedules } from '@/lib/scheduleService';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  try {
    const { year, month } = await request.json();
    if (!year || !month) return NextResponse.json({ error: 'Ano e mês são obrigatórios' }, { status: 400 });

    const count = generateSchedules(year, month);
    return NextResponse.json({ success: true, count, message: `Escalas geradas com sucesso para ${count} missas.` });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: error.message || 'Erro ao gerar escalas' }, { status: 500 });
  }
}
