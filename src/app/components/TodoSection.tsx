'use client';

import { useState, useEffect } from 'react';
import { getDoc, setDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../provider/AuthProvider';
import { TodoList } from './TodoList';
import { parseDueDate } from '../utils/parseDueDate';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: Date;
  dueDate?: Date;
}

function serializeTodo(todo: Todo) {
  return {
    id: todo.id,
    text: todo.text,
    completed: todo.completed,
    createdAt: todo.createdAt ? Timestamp.fromDate(new Date(todo.createdAt)) : Timestamp.now(),
    ...(todo.dueDate ? { dueDate: Timestamp.fromDate(new Date(todo.dueDate)) } : {}),
  };
}

export function TodoSection() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputText, setInputText] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const loading = authLoading || dataLoading;

  useEffect(() => {
    if (authLoading || !user) return;

    const loadTodos = async () => {
      setDataLoading(true);
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          const todosData: Todo[] = data.todolist?.todos || data.todos || [];
          const todosWithDates = todosData.map((todo: Todo & { createdAt?: Timestamp | Date; dueDate?: Timestamp | Date }) => ({
            ...todo,
            createdAt: todo.createdAt && 'toDate' in todo.createdAt
              ? (todo.createdAt as Timestamp).toDate()
              : todo.createdAt,
            dueDate: todo.dueDate && 'toDate' in todo.dueDate
              ? (todo.dueDate as Timestamp).toDate()
              : todo.dueDate,
          }));
          todosWithDates.sort((a: Todo, b: Todo) => {
            const aDate = a.createdAt ? a.createdAt.getTime() : 0;
            const bDate = b.createdAt ? b.createdAt.getTime() : 0;
            return bDate - aDate;
          });
          setTodos(todosWithDates);
        } else {
          const docData: { todolist: { todos: [] }; expireAt?: Timestamp } = {
            todolist: { todos: [] },
          };
          if (user.isAnonymous) {
            const expireAt = new Date();
            expireAt.setDate(expireAt.getDate() + 7);
            docData.expireAt = Timestamp.fromDate(expireAt);
          }
          await setDoc(userRef, docData);
        }
      } catch (error) {
        console.error('Error checking/loading todos:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadTodos();
  }, [user, authLoading]);

  const saveTodos = async (updatedTodos: Todo[]) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      todolist: { todos: updatedTodos.map(serializeTodo) },
    });
    setTodos(updatedTodos);
  };

  const addTodo = async () => {
    if (inputText.trim() === '' || !user) return;
    try {
      const { text, dueDate } = parseDueDate(inputText.trim());
      const newTodo: Todo = {
        id: Date.now().toString(),
        text,
        completed: false,
        createdAt: new Date(),
        dueDate,
      };
      await saveTodos([newTodo, ...todos]);
      setInputText('');
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const saveEdit = async (id: string, text: string) => {
    if (text.trim() === '' || !user) return;
    try {
      const { text: parsedText, dueDate } = parseDueDate(text.trim());
      const updatedTodos = todos.map(todo =>
        todo.id === id
          ? { ...todo, text: parsedText, dueDate: dueDate ?? todo.dueDate }
          : todo
      );
      await saveTodos(updatedTodos);
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    if (!user) return;
    try {
      await saveTodos(todos.filter(todo => todo.id !== id));
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const clearDueDate = async (id: string) => {
    if (!user) return;
    try {
      await saveTodos(todos.map(todo =>
        todo.id === id ? { ...todo, dueDate: undefined } : todo
      ));
    } catch (error) {
      console.error('Error clearing due date:', error);
    }
  };

  const toggleComplete = async (id: string) => {
    if (!user) return;
    const optimisticTodos = todos.map(t =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    setTodos(optimisticTodos);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        todolist: { todos: optimisticTodos.map(serializeTodo) },
      });
    } catch (error) {
      console.error('Error toggling todo completion:', error);
      setTodos(todos);
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
            onKeyDown={(e) => e.key === 'Enter' && e.metaKey && addTodo()}
            placeholder="新しいTodoを入力..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <button
            onClick={addTodo}
            className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
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
        onClearDueDate={clearDueDate}
      />
    </>
  );
}
