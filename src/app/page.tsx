'use client';

import { useState, useEffect } from 'react';
import { getDoc, setDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from './firebase/config';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: Date;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // ゲストログイン（匿名認証）を強制
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // 認証後にFirestoreからデータを取得
        await checkAndLoadTodos(currentUser.uid);
      } else {
        // 未認証の場合は匿名認証を実行
        try {
          const userCredential = await signInAnonymously(auth);
          setUser(userCredential.user);
        } catch (error) {
          console.error('Error signing in anonymously:', error);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // users/{userId}ドキュメント内のtodolistフィールドの存在確認とデータ取得
  const checkAndLoadTodos = async (userId: string) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        // ドキュメントが存在する場合は、todolistフィールドからtodos配列を取得
        const data = userDoc.data();
        const todosData: Todo[] = data.todolist?.todos || data.todos || [];
        // createdAtをDateオブジェクトに変換
        const todosWithDates = todosData.map((todo: Todo & { createdAt?: Timestamp | Date }) => ({
          ...todo,
          createdAt: todo.createdAt && 'toDate' in todo.createdAt 
            ? (todo.createdAt as Timestamp).toDate() 
            : todo.createdAt,
        }));
        // createdAtでソート（新しい順）
        todosWithDates.sort((a: Todo, b: Todo) => {
          const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return bDate - aDate;
        });
        setTodos(todosWithDates);
      } else {
        // ドキュメントが存在しない場合は、空の配列で初期化
        await setDoc(userRef, { todolist: { todos: [] } });
        setTodos([]);
      }
    } catch (error) {
      console.error('Error checking/loading todos:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async () => {
    if (inputText.trim() === '' || !user) return;
    
    try {
      const newTodo: Todo = {
        id: Date.now().toString(),
        text: inputText.trim(),
        completed: false,
        createdAt: new Date(),
      };
      
      const updatedTodos = [newTodo, ...todos];
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        todolist: {
          todos: updatedTodos.map(todo => ({
            ...todo,
            createdAt: Timestamp.fromDate(todo.createdAt || new Date()),
          })),
        },
      });
      
      setTodos(updatedTodos);
      setInputText('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  const saveEdit = async (id: string) => {
    if (editingText.trim() === '' || !user) return;
    
    try {
      const updatedTodos = todos.map(todo => 
        todo.id === id ? { ...todo, text: editingText.trim() } : todo
      );
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        todolist: {
          todos: updatedTodos.map(todo => ({
            ...todo,
            createdAt: todo.createdAt ? Timestamp.fromDate(new Date(todo.createdAt)) : Timestamp.now(),
          })),
        },
      });
      
      setTodos(updatedTodos);
      setEditingId(null);
      setEditingText('');
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const deleteTodo = async (id: string) => {
    if (!user) return;
    
    try {
      const updatedTodos = todos.filter(todo => todo.id !== id);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        todolist: {
          todos: updatedTodos.map(todo => ({
            ...todo,
            createdAt: todo.createdAt ? Timestamp.fromDate(new Date(todo.createdAt)) : Timestamp.now(),
          })),
        },
      });
      
      setTodos(updatedTodos);
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const toggleComplete = async (id: string) => {
    if (!user) return;
    
    try {
      const updatedTodos = todos.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      );
      
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        todolist: {
          todos: updatedTodos.map(todo => ({
            ...todo,
            createdAt: todo.createdAt ? Timestamp.fromDate(new Date(todo.createdAt)) : Timestamp.now(),
          })),
        },
      });
      
      setTodos(updatedTodos);
    } catch (error) {
      console.error('Error toggling todo completion:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ユーザーID表示 */}
        {user && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">ゲストID:</span>{' '}
              <span className="font-mono text-xs break-all">{user.uid}</span>
            </p>
          </div>
        )}
        
        <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Todo List
        </h1>

        {/* Todo追加フォーム */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTodo()}
              placeholder="新しいTodoを入力..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={addTodo}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              追加
            </button>
          </div>
        </div>

        {/* Todoリスト */}
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              読み込み中...
            </div>
          ) : todos.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              Todoがありません。上記のフォームから追加してください。
            </div>
          ) : (
            todos.map((todo) => (
              <div
                key={todo.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center gap-3"
              >
                {/* 完了チェックボックス */}
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleComplete(todo.id)}
                  className="w-5 h-5 text-blue-500 rounded focus:ring-2 focus:ring-blue-500"
                />

                {/* Todoテキストまたは編集フィールド */}
                {editingId === todo.id ? (
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') saveEdit(todo.id);
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(todo.id)}
                      className="px-4 py-1 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                    >
                      保存
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="px-4 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                      キャンセル
                    </button>
                  </div>
                ) : (
                  <>
                    <span
                      className={`flex-1 ${
                        todo.completed
                          ? 'line-through text-gray-500 dark:text-gray-400'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {todo.text}
                    </span>
                    <button
                      onClick={() => startEdit(todo)}
                      className="px-4 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-colors"
                      disabled={todo.completed}
                    >
                      編集
                    </button>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                    >
                      削除
                    </button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* 説明セクション */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              ポートフォリオサイトについて
            </h2>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>
                <span className="font-semibold">⚠️ データの保持期間:</span> このサイトはポートフォリオサイトのため、一定期間でデータが消去されます。
              </p>
              <p>
                <span className="font-semibold">📱 端末について:</span> ゲストIDとデータが紐づいているため、端末が変わると元のデータにアクセスできません。同じ端末・ブラウザでアクセスした場合のみ、データが保持されます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
