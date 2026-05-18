const mongoose = require('mongoose');

async function main() {
  await mongoose.connect('mongodb://localhost:27017/itest');
  
  const submissions = await mongoose.connection.db.collection('submissions').find({}).toArray();
  console.log("Celkový počet odovzdaní v DB:", submissions.length);
  
  submissions.forEach(sub => {
    console.log(`\nSubmission ID: ${sub._id}`);
    console.log(`Assignment ID: ${sub.assignmentId}`);
    
    // Zistime počet kreseb a odpovedi
    const answersKeys = sub.answers ? Object.keys(sub.answers) : [];
    const drawingKeys = sub.questionDrawings ? Object.keys(sub.questionDrawings) : [];
    
    console.log(`Počet textových odpovedí: ${answersKeys.length}`);
    if (answersKeys.length > 0) {
      console.log(`Odpovede klúče:`, answersKeys);
    }
    
    console.log(`Počet kreseb k otázkam: ${drawingKeys.length}`);
    if (drawingKeys.length > 0) {
      console.log(`Kresby klúče:`, drawingKeys);
    }
    
    console.log(`Hlavný dokument (mainWorkDrawing) existuje:`, !!sub.mainWorkDrawing);
  });
  
  mongoose.connection.close();
}

main().catch(console.error);
