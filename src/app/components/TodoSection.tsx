'use client';

import { useState, useEffect } from 'react';
import { getDoc, setDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../provider/AuthProvider';
import { TodoList } from './TodoList';
import { GroupSection, Group, GROUP_COLORS } from './GroupSection';
import { parseDueDate } from '../utils/parseDueDate';

interface Todo {
  id: string;
  text: string;
  createdAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  blockedReason: string;
  groupId?: string;
}

function serializeTodo(todo: Todo) {
  return {
    id: todo.id,
    text: todo.text,
    createdAt: Timestamp.fromDate(new Date(todo.createdAt)),
    blockedReason: todo.blockedReason ?? '',
    ...(todo.groupId ? { groupId: todo.groupId } : {}),
    ...(todo.dueDate ? { dueDate: Timestamp.fromDate(new Date(todo.dueDate)) } : {}),
    ...(todo.completedAt ? { completedAt: Timestamp.fromDate(new Date(todo.completedAt)) } : {}),
  };
}

function serializeGroup(group: Group) {
  return {
    id: group.id,
    name: group.name,
    color: group.color,
    createdAt: Timestamp.fromDate(new Date(group.createdAt)),
  };
}

export function TodoSection() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [newTodoGroupId, setNewTodoGroupId] = useState<string | null>(null);
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
          const todosWithDates = todosData.map((todo: Todo & { createdAt: Timestamp | Date; dueDate?: Timestamp | Date; completedAt?: Timestamp | Date }) => ({
            ...todo,
            createdAt: 'toDate' in todo.createdAt
              ? (todo.createdAt as Timestamp).toDate()
              : todo.createdAt as Date,
            dueDate: todo.dueDate && 'toDate' in todo.dueDate
              ? (todo.dueDate as Timestamp).toDate()
              : todo.dueDate,
            completedAt: todo.completedAt && 'toDate' in todo.completedAt
              ? (todo.completedAt as Timestamp).toDate()
              : todo.completedAt,
          }));
          setTodos(todosWithDates);
          const groupsData: Group[] = (data.todolist?.groups || []).map(
            (g: Group & { createdAt: Timestamp | Date }) => ({
              ...g,
              createdAt: 'toDate' in g.createdAt
                ? (g.createdAt as Timestamp).toDate()
                : g.createdAt as Date,
            })
          );
          setGroups(groupsData);
        } else {
          const docData: { todolist: { todos: []; groups: [] }; expireAt?: Timestamp } = {
            todolist: { todos: [], groups: [] },
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
      'todolist.todos': updatedTodos.map(serializeTodo),
    });
    setTodos(updatedTodos);
  };

  const saveGroups = async (updatedGroups: Group[]) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      'todolist.groups': updatedGroups.map(serializeGroup),
    });
    setGroups(updatedGroups);
  };

  const addTodo = async () => {
    if (inputText.trim() === '' || !user) return;
    try {
      const { text, dueDate } = parseDueDate(inputText.trim());
      const newTodo: Todo = {
        id: Date.now().toString(),
        text,
        createdAt: new Date(),
        dueDate,
        blockedReason: '',
        ...(newTodoGroupId ? { groupId: newTodoGroupId } : {}),
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

  const setBlocked = async (id: string, reason: string) => {
    if (!user) return;
    try {
      await saveTodos(todos.map(todo =>
        todo.id === id ? { ...todo, blockedReason: reason } : todo
      ));
    } catch (error) {
      console.error('Error setting blocked:', error);
    }
  };

  const unblock = async (id: string) => {
    if (!user) return;
    try {
      await saveTodos(todos.map(todo =>
        todo.id === id ? { ...todo, blockedReason: '' } : todo
      ));
    } catch (error) {
      console.error('Error unblocking todo:', error);
    }
  };

  const toggleComplete = async (id: string) => {
    if (!user) return;
    const optimisticTodos = todos.map(t =>
      t.id === id
        ? { ...t, completedAt: !t.completedAt ? new Date() : undefined }
        : t
    );
    setTodos(optimisticTodos);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'todolist.todos': optimisticTodos.map(serializeTodo),
      });
    } catch (error) {
      console.error('Error toggling todo completion:', error);
      setTodos(todos);
    }
  };

  const setTodoGroup = async (id: string, groupId: string | null) => {
    if (!user) return;
    try {
      await saveTodos(todos.map(todo =>
        todo.id === id ? { ...todo, groupId: groupId ?? undefined } : todo
      ));
    } catch (error) {
      console.error('Error setting group:', error);
    }
  };

  const addGroup = async (name: string, color: string) => {
    if (!user) return;
    try {
      const newGroup: Group = {
        id: Date.now().toString(),
        name,
        color,
        createdAt: new Date(),
      };
      await saveGroups([...groups, newGroup]);
    } catch (error) {
      console.error('Error adding group:', error);
    }
  };

  const updateGroup = async (id: string, name: string, color: string) => {
    if (!user) return;
    try {
      await saveGroups(groups.map(g => g.id === id ? { ...g, name, color } : g));
    } catch (error) {
      console.error('Error updating group:', error);
    }
  };

  const deleteGroup = async (id: string) => {
    if (!user) return;
    try {
      const updatedTodos = todos.map(todo =>
        todo.groupId === id ? { ...todo, groupId: undefined } : todo
      );
      const updatedGroups = groups.filter(g => g.id !== id);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'todolist.todos': updatedTodos.map(serializeTodo),
        'todolist.groups': updatedGroups.map(serializeGroup),
      });
      setTodos(updatedTodos);
      setGroups(updatedGroups);
      if (activeGroupId === id) setActiveGroupId(null);
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const visibleTodos = todos
    .filter(todo => !todo.completedAt || todo.completedAt >= today)
    .filter(todo => activeGroupId === null || todo.groupId === activeGroupId)
    .sort((a, b) => {
      const aCompleted = !!a.completedAt;
      const bCompleted = !!b.completedAt;
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
      if (aCompleted && bCompleted) {
        return (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0);
      }
      // 未完了: 期限なしを先頭、期限ありは近い順
      const aHasDue = !!a.dueDate;
      const bHasDue = !!b.dueDate;
      if (aHasDue !== bHasDue) return aHasDue ? 1 : -1;
      if (aHasDue && bHasDue) return a.dueDate!.getTime() - b.dueDate!.getTime();
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  const selectedGroupColor = newTodoGroupId
    ? (GROUP_COLORS.find(c => c.value === (groups.find(g => g.id === newTodoGroupId)?.color ?? '')) ?? null)
    : null;

  return (
    <>
      <GroupSection
        groups={groups}
        activeGroupId={activeGroupId}
        onFilterChange={setActiveGroupId}
        onAddGroup={addGroup}
        onUpdateGroup={updateGroup}
        onDeleteGroup={deleteGroup}
      />
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
          {groups.length > 0 && (
            <select
              value={newTodoGroupId ?? ''}
              onChange={e => setNewTodoGroupId(e.target.value || null)}
              className={`px-2 py-2 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 cursor-pointer ${
                selectedGroupColor
                  ? `${selectedGroupColor.badgeBg} ${selectedGroupColor.badgeText} ${selectedGroupColor.badgeDarkBg} ${selectedGroupColor.badgeDarkText} border-transparent`
                  : 'border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400'
              }`}
            >
              <option value="">グループなし</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          )}
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
        todos={visibleTodos}
        groups={groups}
        loading={loading}
        onEditSave={saveEdit}
        onToggleComplete={toggleComplete}
        onDelete={deleteTodo}
        onClearDueDate={clearDueDate}
        onSetBlocked={setBlocked}
        onUnblock={unblock}
        onSetGroup={setTodoGroup}
      />
    </>
  );
}
