import { MongoClient } from 'mongodb';

const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:39133/';
const client = new MongoClient(url);
await client.connect();
const db = client.db('opensurvey');

const docs = await db.collection('surveySubmit').find({}).sort({ _id: -1 }).limit(2).toArray();
console.log('答卷条数(取样):', docs.length);
for (const doc of docs) {
  console.log('\n--- 文档 keys:', Object.keys(doc).join(','));
  console.log('typeof data :', typeof doc.data);
  console.log('secretKeys  :', JSON.stringify(doc.secretKeys));
  if (typeof doc.data === 'string') {
    console.log('data 前 200 :', doc.data.slice(0, 200));
  } else {
    console.log('data keys   :', Object.keys(doc.data || {}).join(','));
    console.log('data 前 200 :', JSON.stringify(doc.data).slice(0, 200));
  }
}
await client.close();
