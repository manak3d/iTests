async function run() {
  const ts = Date.now();
  const res = await fetch('http://localhost:9002/api/classrooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: `class_${ts}`,
      name: 'Test Class',
      teacherId: 'teacher123'
    })
  });
  
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Data:", data);
}

run();
