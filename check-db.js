require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URL.trim());
  
  const teachers = await mongoose.connection.db.collection('teachers').find({}).toArray();
  console.log("Teachers in DB:");
  console.log(JSON.stringify(teachers, null, 2));
  
  process.exit(0);
}
run();
