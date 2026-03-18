import { getDb } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const massId = params.id;
  const db = getDb();
  
  try {
    const existing = db.prepare('SELECT id FROM masses WHERE id = ? AND day_type = ?').get(massId, 'SPECIAL');
    if (!existing) {
      return NextResponse.json({ error: 'Missa não encontrada ou não é especial' }, { status: 404 });
    }

    db.prepare('DELETE FROM masses WHERE id = ?').run(massId);
    return NextResponse.json({ success: true, message: 'Missa Especial removida com sucesso' });
  } catch (error) {
    console.error('Error deleting special mass:', error);
    return NextResponse.json({ error: 'Erro ao remover missa especial' }, { status: 500 });
  }
}
