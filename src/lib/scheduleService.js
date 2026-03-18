import { getDb } from './db';

const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate();

export function generateMasses(year, month, specialDates = []) {
  const db = getDb();
  const daysInMonth = getDaysInMonth(year, month);
  let count = 0;

  const insertMass = db.prepare(`
    INSERT OR IGNORE INTO masses (mass_date, mass_time, day_type)
    VALUES (?, ?, ?)
  `);

  db.transaction(() => {
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const d = new Date(year, month - 1, i);
      const dayOfWeek = d.getDay();
      
      const isSpecial = specialDates.includes(dateStr);
      let dayType = 'WEEKDAY';
      let times = [];

      if (isSpecial) {
        dayType = 'SPECIAL';
        // Assuming special dates follow Sunday times if not specified, 
        // to simplify we can just use default times for the day but mark as special
      }

      if (dayOfWeek >= 1 && dayOfWeek <= 3 || dayOfWeek === 5) {
        times = ['19:30'];
        if (!isSpecial) dayType = 'WEEKDAY';
      } else if (dayOfWeek === 4) {
        times = ['20:00'];
        if (!isSpecial) dayType = 'WEEKDAY';
      } else if (dayOfWeek === 6) {
        times = ['19:00'];
        if (!isSpecial) dayType = 'SATURDAY';
      } else if (dayOfWeek === 0) {
        times = ['08:00', '10:30', '19:00'];
        if (!isSpecial) dayType = 'SUNDAY';
      }

      for (const t of times) {
        const result = insertMass.run(dateStr, t, dayType);
        if (result.changes > 0) count++;
      }
    }
  })();

  return count;
}

export function generateSchedules(year, month) {
  const db = getDb();
  const prefix = `${year}-${String(month).padStart(2, '0')}`;

  const masses = db.prepare(`SELECT id, mass_date, mass_time, day_type, required_readers FROM masses WHERE mass_date LIKE ? ORDER BY mass_date, mass_time`).all(`${prefix}%`);
  if (masses.length === 0) throw new Error('Nenhuma missa gerada para este mês.');

  const availabilities = db.prepare(`SELECT user_id, mass_date, mass_time FROM availabilities WHERE mass_date LIKE ?`).all(`${prefix}%`);
  
  // Build a map of availabilities: { "YYYY-MM-DD HH:MM": [user_ids] }
  const availMap = {};
  availabilities.forEach(a => {
    const key = `${a.mass_date} ${a.mass_time}`;
    if (!availMap[key]) availMap[key] = [];
    availMap[key].push(a.user_id);
  });

  // Fetch all users to know who can be reader/animator, and their leave status
  const users = db.prepare(`SELECT id, can_be_reader, can_be_animator, status, leave_start, leave_end FROM users`).all();
  const userMap = {};
  users.forEach(u => userMap[u.id] = u);

  const insertSchedule = db.prepare(`
    INSERT INTO schedules (mass_id, reader_1_id, reader_2_id, reader_3_id, reader_4_id, animator_id, status)
    VALUES (?, ?, ?, ?, ?, ?, 'PLANNED')
  `);

  // Clear existing schedules for this month to regenerate
  db.prepare(`
    DELETE FROM schedules WHERE mass_id IN (SELECT id FROM masses WHERE mass_date LIKE ?)
  `).run(`${prefix}%`);

  // Usage tracking to balance schedules
  const usageCount = {};
  users.forEach(u => usageCount[u.id] = 0);
  
  let generatedCount = 0;

  db.transaction(() => {
    // Keep track of who was scheduled in the previous day or time
    let previousDayDate = null;
    let scheduledPreviousDay = new Set();
    let scheduledPreviousTime = new Set();
    let currentDayDate = null;

    for (const mass of masses) {
      if (mass.mass_date !== currentDayDate) {
        previousDayDate = currentDayDate;
        currentDayDate = mass.mass_date;
        scheduledPreviousDay = new Set(scheduledPreviousTime); // End of day, transition
        scheduledPreviousTime = new Set();
      }

      const key = `${mass.mass_date} ${mass.mass_time}`;
      const availableUsers = availMap[key] || [];

      // Filter users who shouldn't serve (served previous day or previous time, or on leave)
      const eligibleUsers = availableUsers.filter(uid => {
        const u = userMap[uid];
        if (!u) return false;
        
        if (u.status === 'LICENCIADO') {
          if (!u.leave_start) return false; // Indefinite leave
          const massDateObj = new Date(mass.mass_date);
          const startObj = new Date(u.leave_start);
          const endObj = u.leave_end ? new Date(u.leave_end) : new Date('2099-12-31');
          if (massDateObj >= startObj && massDateObj <= endObj) {
            return false; // Skip, is on leave
          }
        }
        
        return !scheduledPreviousTime.has(uid) && !scheduledPreviousDay.has(uid);
      });

      // Sort eligible users by usage count (ascending) to balance
      eligibleUsers.sort((a, b) => usageCount[a] - usageCount[b]);

      let readersNeeded = mass.required_readers || ((mass.day_type === 'WEEKDAY') ? 1 : 2);
      let animatorsNeeded = 1;

      let r1 = null, r2 = null, r3 = null, r4 = null, anim = null;
      let currentlyScheduled = new Set();

      // Find Animators first (usually fewer animators than readers)
      for (const uid of eligibleUsers) {
        if (userMap[uid].can_be_animator && animatorsNeeded > 0) {
          anim = uid;
          animatorsNeeded--;
          currentlyScheduled.add(uid);
          usageCount[uid]++;
          break;
        }
      }

      // Find Readers
      for (const uid of eligibleUsers) {
        if (currentlyScheduled.has(uid)) continue;
        if (userMap[uid].can_be_reader) {
          if (!r1) {
            r1 = uid;
          } else if (!r2) {
            r2 = uid;
          } else if (!r3) {
            r3 = uid;
          } else if (!r4) {
            r4 = uid;
          }
          readersNeeded--;
          currentlyScheduled.add(uid);
          usageCount[uid]++;
        }
        if (readersNeeded <= 0) break;
      }

      // Record schedule
      insertSchedule.run(mass.id, r1, r2, r3, r4, anim);
      generatedCount++;

      // Update previous time sets
      scheduledPreviousTime.clear();
      if (r1) scheduledPreviousTime.add(r1);
      if (r2) scheduledPreviousTime.add(r2);
      if (r3) scheduledPreviousTime.add(r3);
      if (r4) scheduledPreviousTime.add(r4);
      if (anim) scheduledPreviousTime.add(anim);
    }
  })();

  return generatedCount;
}

export function validateManualChange(scheduleId, field, newUserId) {
  // To be implemented: validation logic for manual changes
  return true;
}
