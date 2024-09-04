import * as mongoose from 'mongoose';

const connectToDB = async () => {
  const dbUri = process.env.DB_URI;
  if (!dbUri) {
    throw new Error('DB_URI ist nicht definiert');
  }
  await mongoose.connect(dbUri);
};

export const clearTestDB = async () => {
  try {
    await connectToDB();

    const collections = await mongoose.connection.db.collections();

    for (const collection of collections) {
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Fehler beim Bereinigen der Datenbank:', error);
  } finally {
    await mongoose.connection.close();
  }
};
