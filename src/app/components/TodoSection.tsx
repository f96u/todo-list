'use client';

import { useState, useEffect } from 'react';
import { getDoc, setDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../provider/AuthProvider';
import { TodoList } from './TodoList';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: Date;
}

export function TodoSection() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  // 全体のローディング状態（認証中またはデータ取得中）
  const loading = authLoading || dataLoading;

  // 認証後にFirestoreからデータを取得
  useEffect(() => {
    if (authLoading || !user) return;

    const loadTodos = async () => {
      setDataLoading(true);
      try {
        const userRef = doc(db, 'users', user.uid);
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
          // ドキュメントが存在しない場合は、空の配列で初期化し、expireAtを設定
          const now = new Date();
          const expireAt = new Date(now);
          expireAt.setDate(expireAt.getDate() + 7); // 7日後
          
          await setDoc(userRef, {
            todolist: { todos: [] },
            expireAt: Timestamp.fromDate(expireAt),
          });
        }
      } catch (error) {
        console.error('Error checking/loading todos:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadTodos();
  }, [user, authLoading]);

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
            id: todo.id,
            text: todo.text,
            completed: todo.completed,
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

  const saveEdit = async (id: string, text: string) => {
    if (text.trim() === '' || !user) return;
    
    try {
      const updatedTodos = todos.map(todo => 
        todo.id === id ? { ...todo, text: text.trim() } : todo
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
      console.error('Error updating todo:', error);
    }
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
    <>
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
      <TodoList
        todos={todos}
        loading={loading}
        onEditSave={saveEdit}
        onToggleComplete={toggleComplete}
        onDelete={deleteTodo}
      />
    </>
  );
}

