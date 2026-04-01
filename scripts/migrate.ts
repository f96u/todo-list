import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const serviceAccount = require(process.env.GOOGLE_APPLICATION_CREDENTIALS!);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

interface TodoRaw {
  id: string;
  text: string;
  completed?: boolean;
  completedAt?: Timestamp;
  blocked?: boolean;
  blockedReason?: string;
  createdAt?: Timestamp;
  [key: string]: unknown;
}

function migrateTodo(todo: TodoRaw): TodoRaw {
  const updated: TodoRaw = { ...todo };

  // 1. completed → completedAt に統合
  if ('completed' in updated) {
    if (updated.completed === true && !updated.completedAt) {
      updated.completedAt = new Timestamp(0, 0);
    }
    delete updated.completed;
  }

  // 2. blocked → blockedReason に統合
  if ('blocked' in updated) {
    if (!(updated.blocked === true && updated.blockedReason)) {
      updated.blockedReason = '';
    }
    delete updated.blocked;
  } else if (!('blockedReason' in updated)) {
    updated.blockedReason = '';
  }

  // 3. createdAt が未設定なら現在時刻を設定
  if (!updated.createdAt) {
    updated.createdAt = Timestamp.now();
  }

  return updated;
}

async function migrate() {
  const snapshot = await db.collection('users').get();

  let docCount = 0;
  let todoCount = 0;

  console.log(`Processing ${snapshot.docs.length} user document(s)...`);

  for (const userDoc of snapshot.docs) {
    const data = userDoc.data();
    const todos: TodoRaw[] = data?.todolist?.todos ?? [];

    if (!Array.isArray(todos)) {
      console.log(`  [${userDoc.id}] todos is not an array, skipping.`);
      continue;
    }

    const migratedTodos = todos.map(migrateTodo);

    await userDoc.ref.update({ 'todolist.todos': migratedTodos });

    console.log(`  [${userDoc.id}] migrated ${todos.length} todo(s).`);
    docCount++;
    todoCount += todos.length;
  }

  console.log('\n=== Migration Complete ===');
  console.log(`Documents processed: ${docCount}`);
  console.log(`Todos migrated:      ${todoCount}`);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
