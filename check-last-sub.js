const mongoose = require('mongoose');
const { Schema } = mongoose;

async function main() {
  await mongoose.connect('mongodb://localhost:27017/itest');
  
  const sub = await mongoose.connection.db.collection('submissions').findOne({}, { sort: { _id: -1 } });
  if (!sub) {
    console.log("Ziadne submissions nenajdene.");
    process.exit(0);
  }
  
  console.log("Najnovsi submission:");
  console.log("ID:", sub._id);
  console.log("answers type:", typeof sub.answers, Array.isArray(sub.answers) ? 'Array' : '');
  console.log("answers:", sub.answers);
  console.log("questionDrawings type:", typeof sub.questionDrawings, Array.isArray(sub.questionDrawings) ? 'Array' : '');
  console.log("questionDrawings keys:", sub.questionDrawings ? Object.keys(sub.questionDrawings) : 'none');
  
  if (sub.questionDrawings) {
    for (const key of Object.keys(sub.questionDrawings)) {
      const val = sub.questionDrawings[key];
      console.log(`  kresba k ${key}: dlzka = ${val ? val.length : 'null'}`);
    }
  }

  process.exit(0);
}

main().catch(console.error);
