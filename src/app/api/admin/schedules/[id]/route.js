import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const scheduleId = params.id;
  const db = getDb();

  try {
    const { field, userId } = await request.json(); // field: 'reader_1_id' | 'reader_2_id' | 'animator_id'

    const allowedFields = ['reader_1_id', 'reader_2_id', 'animator_id'];
    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: 'Campo inválido' }, { status: 400 });
    }

    // Here we could add revalidation logic to check if they served previous day etc.
    // For now, we allow the admin to override and just update the DB.

    db.prepare(`
      UPDATE schedules
      SET ${field} = ?, status = 'CONFIRMED'
      WHERE id = ?
    `).run(userId || null, scheduleId);

    return NextResponse.json({ success: true, message: 'Escala atualizada com sucesso' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao atualizar escala' }, { status: 500 });
  }
}
