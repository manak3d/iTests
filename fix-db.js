require('dotenv').config();
const mongoose = require('mongoose');

async function run() {
  await mongoose.connect(process.env.MONGODB_URL.trim());
  
  try {
    await mongoose.connection.db.collection('students').dropIndex('email_1');
    console.log("Old email index dropped successfully.");
  } catch (e) {
    console.log("Could not drop email_1 index:", e.message);
  }

  // Také username_1 just in case
  // Wait, username should be unique, so that's fine.

  process.exit(0);
}
run();
