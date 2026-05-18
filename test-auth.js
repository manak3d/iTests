

async function run() {
  const ts = Date.now();
  const username = `testuser_${ts}`;
  
  console.log('1. Registering user:', username);
  const regRes = await fetch('http://localhost:9002/api/teachers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Test',
      lastName: 'Auth',
      email: `${username}@skola.cz`,
      username,
      password: 'password123',
      subjects: []
    })
  });
  
  console.log('Reg status:', regRes.status);
  const regData = await regRes.json();
  console.log('Reg data:', regData);

  if (regRes.status !== 201) return;

  console.log('\n2. Logging in with user:', username);
  const loginRes = await fetch('http://localhost:9002/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      password: 'password123',
      role: 'teacher'
    })
  });

  console.log('Login status:', loginRes.status);
  const loginData = await loginRes.json();
  console.log('Login data:', loginData);
}

run();
