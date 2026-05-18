

async function run() {
  const ts = Date.now();
  const username = `student_${ts}`;
  
  const res = await fetch('http://localhost:9002/api/students', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Test',
      lastName: 'Student',
      username: username,
      password: 'pwd',
      classroomId: 'testclass123'
    })
  });
  
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Data:", data);
}

run();
