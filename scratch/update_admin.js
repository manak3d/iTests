require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const teacherSchema = new mongoose.Schema({
  username: String,
  password: { type: String, select: false },
  passwordPlain: String,
  role: String
}, { strict: false });

const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema, 'teachers');

async function updateAdminPassword() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    
    const admin = await Teacher.findOne({ username: 'admin', role: 'admin' });
    if (admin) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin1234', salt);
      
      admin.password = hashedPassword;
      admin.passwordPlain = 'admin1234';
      await admin.save();
      console.log("Admin password updated to admin1234 successfully!");
    } else {
      console.log("Admin user not found.");
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.disconnect();
  }
}

updateAdminPassword();
