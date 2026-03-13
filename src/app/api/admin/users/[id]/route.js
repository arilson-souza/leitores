import { getDb } from '@/lib/db';
import { getSession, hashPassword } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const userId = params.id;
  
  try {
    const { name, email, role, can_be_reader, can_be_animator, password, avatar_url } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Nome e email são obrigatórios' }, { status: 400 });
    }

    const db = getDb();
    
    // Check if another user has the same email
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId);
    if (existingUser) {
      return NextResponse.json({ error: 'Email já cadastrado por outro usuário' }, { status: 400 });
    }

    const userRole = role === 'ADMIN' ? 'ADMIN' : 'VOLUNTARIO';
    const isReader = can_be_reader ? 1 : 0;
    const isAnimator = can_be_animator ? 1 : 0;
    const avatar = avatar_url || null;

    if (password && password.trim() !== '') {
      const hashed = await hashPassword(password);
      db.prepare(`
        UPDATE users 
        SET name = ?, email = ?, password_hash = ?, avatar_url = ?, role = ?, can_be_reader = ?, can_be_animator = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, email, hashed, avatar, userRole, isReader, isAnimator, userId);
    } else {
      db.prepare(`
        UPDATE users 
        SET name = ?, email = ?, avatar_url = ?, role = ?, can_be_reader = ?, can_be_animator = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(name, email, avatar, userRole, isReader, isAnimator, userId);
    }

    return NextResponse.json({ success: true, message: 'Usuário atualizado com sucesso' });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Erro ao atualizar usuário' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await getSession();
  if (!session || session.role !== 'ADMIN') return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });

  const userId = params.id;
  
  // Prevent admin from deleting themselves
  if (session.id === parseInt(userId, 10)) {
    return NextResponse.json({ error: 'Você não pode excluir sua própria conta' }, { status: 400 });
  }

  const db = getDb();
  try {
    // Foreign keys with ON DELETE CASCADE or SET NULL will handle related records in availabilities and schedules.
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    return NextResponse.json({ success: true, message: 'Usuário removido com sucesso' });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json({ error: 'Erro ao remover usuário' }, { status: 500 });
  }
}
