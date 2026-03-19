import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request, props) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const params = await props.params;
  const scheduleId = params.id;
  const db = getDb();

  try {
    const { field, userId } = await request.json(); // field: 'reader_1_id' | 'reader_2_id' | 'animator_id'

    const allowedFields = ['reader_1_id', 'reader_2_id', 'reader_3_id', 'reader_4_id', 'reader_5_id', 'reader_6_id', 'reader_7_id', 'animator_id'];
    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: 'Campo inválido' }, { status: 400 });
    }

    // Here we could add revalidation logic to check if they served previous day etc.
    // For now, we allow the admin to override and just update the DB.

    const result = db.prepare(`
      UPDATE schedules
      SET ${field} = ?, status = 'CONFIRMED'
      WHERE id = ?
    `).run(userId || null, scheduleId);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Escala não encontrada ou não atualizada' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Escala atualizada com sucesso' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Erro ao atualizar escala' }, { status: 500 });
  }
}
