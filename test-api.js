const http = require('http');

async function runTests() {
  console.log('--- Iniciando Testes de Integração API ---');
  let cookie = '';

  const request = (path, method = 'GET', body = null, headers = {}) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 3000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };

      if (cookie) options.headers['Cookie'] = cookie;

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          let parsed;
          try { parsed = JSON.parse(data); } catch(e) { parsed = data; }
          const setCookie = res.headers['set-cookie'];
          if (setCookie) {
            cookie = setCookie[0].split(';')[0];
          }
          resolve({ status: res.statusCode, data: parsed });
        });
      });

      req.on('error', reject);
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  };

  // 1. Admin Login
  console.log('\\n1. Login como Admin');
  let res = await request('/api/auth/login', 'POST', { email: 'admin@paroquia.com', password: 'admin123' });
  console.log(`Status: ${res.status}`);
  if (res.status !== 200) throw new Error('Falha no login admin');

  // 2. Add availability for Admin (as a volunteer)
  console.log('\\n2. Adicionando disponibilidade');
  const slots = [
    { mass_date: '2026-03-15', mass_time: '08:00' },
    { mass_date: '2026-03-15', mass_time: '19:00' }
  ];
  res = await request('/api/availabilities', 'POST', { year: '2026', month: '3', selectedSlots: slots });
  console.log(`Status: ${res.status}`, res.data);

  // 3. Generate Masses
  console.log('\\n3. Gerando Missas para Março/2026');
  res = await request('/api/admin/masses', 'POST', { year: '2026', month: '3' });
  console.log(`Status: ${res.status}`, res.data);

  // 4. Generate Schedules
  console.log('\\n4. Gerando Escalas Automáticas');
  res = await request('/api/admin/generate-schedule', 'POST', { year: '2026', month: '3' });
  console.log(`Status: ${res.status}`, res.data);

  // 5. Fetch Schedules
  console.log('\\n5. Buscando Escalas Definitivas');
  res = await request('/api/schedules?year=2026&month=3', 'GET');
  console.log(`Status: ${res.status}`);
  const schedules = res.data.schedules;
  console.log(`Encontradas ${schedules?.length} missas escaladas.`);
  
  if (schedules && schedules.length > 0) {
    const filled = schedules.filter(s => s.reader_1_name || s.animator_name);
    console.log(`Destas, ${filled.length} têm pelo menos um voluntário alocado (Admin).`);
  }

  console.log('\\n--- Testes Concluídos ---');
}

runTests().catch(console.error);
