

async function run() {
  const res = await fetch('http://localhost:9002/api/teachers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Novak',
      lastName: 'Novak',
      email: 'novak.test12345@skola.cz',
      username: 'novak12345',
      password: 'pwd',
      subjects: []
    })
  });
  const data = await res.json();
  console.log(data);
}
run();
