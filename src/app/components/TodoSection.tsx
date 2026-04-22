'use client';

import { useState, useEffect } from 'react';
import { getDoc, setDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../provider/AuthProvider';
import { KanbanColumn, Todo } from './KanbanColumn';
import { Group, GROUP_COLORS } from './GroupSection';
import { parseDueDate } from '../utils/parseDueDate';

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
  const [dataLoading, setDataLoading] = useState(false);
  const [draggingTodoId, setDraggingTodoId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
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
            createdAt: 'toDate' in todo.createdAt ? (todo.createdAt as Timestamp).toDate() : todo.createdAt as Date,
            dueDate: todo.dueDate && 'toDate' in todo.dueDate ? (todo.dueDate as Timestamp).toDate() : todo.dueDate,
            completedAt: todo.completedAt && 'toDate' in todo.completedAt ? (todo.completedAt as Timestamp).toDate() : todo.completedAt,
          }));
          setTodos(todosWithDates);
          const groupsData: Group[] = (data.todolist?.groups || []).map(
            (g: Group & { createdAt: Timestamp | Date }) => ({
              ...g,
              createdAt: 'toDate' in g.createdAt ? (g.createdAt as Timestamp).toDate() : g.createdAt as Date,
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
        console.error('Error loading data:', error);
      } finally {
        setDataLoading(false);
      }
    };
    loadTodos();
  }, [user, authLoading]);

  const saveTodos = async (updatedTodos: Todo[]) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { 'todolist.todos': updatedTodos.map(serializeTodo) });
    setTodos(updatedTodos);
  };

  const saveGroups = async (updatedGroups: Group[]) => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { 'todolist.groups': updatedGroups.map(serializeGroup) });
    setGroups(updatedGroups);
  };

  const addTodo = async (groupId: string | null, text: string) => {
    if (text.trim() === '' || !user) return;
    try {
      const { text: parsedText, dueDate } = parseDueDate(text.trim());
      const newTodo: Todo = {
        id: Date.now().toString(),
        text: parsedText,
        createdAt: new Date(),
        dueDate,
        blockedReason: '',
        ...(groupId ? { groupId } : {}),
      };
      await saveTodos([newTodo, ...todos]);
    } catch (error) {
      console.error('Error adding todo:', error);
    }
  };

  const saveEdit = async (id: string, text: string) => {
    if (text.trim() === '' || !user) return;
    try {
      const { text: parsedText, dueDate } = parseDueDate(text.trim());
      await saveTodos(todos.map(todo =>
        todo.id === id ? { ...todo, text: parsedText, dueDate: dueDate ?? todo.dueDate } : todo
      ));
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
      await saveTodos(todos.map(todo => todo.id === id ? { ...todo, dueDate: undefined } : todo));
    } catch (error) {
      console.error('Error clearing due date:', error);
    }
  };

  const setBlocked = async (id: string, reason: string) => {
    if (!user) return;
    try {
      await saveTodos(todos.map(todo => todo.id === id ? { ...todo, blockedReason: reason } : todo));
    } catch (error) {
      console.error('Error setting blocked:', error);
    }
  };

  const unblock = async (id: string) => {
    if (!user) return;
    try {
      await saveTodos(todos.map(todo => todo.id === id ? { ...todo, blockedReason: '' } : todo));
    } catch (error) {
      console.error('Error unblocking todo:', error);
    }
  };

  const toggleComplete = async (id: string) => {
    if (!user) return;
    const optimisticTodos = todos.map(t =>
      t.id === id ? { ...t, completedAt: !t.completedAt ? new Date() : undefined } : t
    );
    setTodos(optimisticTodos);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { 'todolist.todos': optimisticTodos.map(serializeTodo) });
    } catch (error) {
      console.error('Error toggling completion:', error);
      setTodos(todos);
    }
  };

  const addGroup = async (name: string, color: string) => {
    if (!user) return;
    try {
      const newGroup: Group = { id: Date.now().toString(), name, color, createdAt: new Date() };
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
      const updatedTodos = todos.map(todo => todo.groupId === id ? { ...todo, groupId: undefined } : todo);
      const updatedGroups = groups.filter(g => g.id !== id);
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'todolist.todos': updatedTodos.map(serializeTodo),
        'todolist.groups': updatedGroups.map(serializeGroup),
      });
      setTodos(updatedTodos);
      setGroups(updatedGroups);
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  // ── DnD handlers ──────────────────────────────────────────────────────────

  const handleDragStart = (e: React.DragEvent, todoId: string) => {
    setDraggingTodoId(todoId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', todoId);
  };

  const handleDragEnd = () => {
    setDraggingTodoId(null);
    setDragOverColumnId(null);
  };

  const handleDragOver = (e: React.DragEvent, columnId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumnId(columnId ?? 'null');
  };

  const handleDrop = async (e: React.DragEvent, targetGroupId: string | null) => {
    e.preventDefault();
    const todoId = e.dataTransfer.getData('text/plain');
    if (!todoId || !user) return;
    setDraggingTodoId(null);
    setDragOverColumnId(null);
    const todo = todos.find(t => t.id === todoId);
    if (!todo) return;
    const currentGroupId = todo.groupId ?? null;
    if (currentGroupId === targetGroupId) return;
    try {
      await saveTodos(todos.map(t =>
        t.id === todoId ? { ...t, groupId: targetGroupId ?? undefined } : t
      ));
    } catch (error) {
      console.error('Error moving todo:', error);
    }
  };

  // ── Build column data ────────────────────────────────────────────────────

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortTodos = (ts: Todo[]) =>
    ts
      .filter(t => !t.completedAt || t.completedAt >= today)
      .sort((a, b) => {
        const aC = !!a.completedAt, bC = !!b.completedAt;
        if (aC !== bC) return aC ? 1 : -1;
        if (aC && bC) return (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0);
        const aHasDue = !!a.dueDate, bHasDue = !!b.dueDate;
        if (aHasDue !== bHasDue) return aHasDue ? 1 : -1;
        if (aHasDue && bHasDue) return a.dueDate!.getTime() - b.dueDate!.getTime();
        return b.createdAt.getTime() - a.createdAt.getTime();
      });

  const inboxTodos = sortTodos(todos.filter(t => !t.groupId));
  const columns = groups.map(group => ({
    group,
    todos: sortTodos(todos.filter(t => t.groupId === group.id)),
  }));

  const commonProps = {
    groups,
    draggingTodoId,
    dragOverColumnId,
    onEditSave: saveEdit,
    onToggleComplete: toggleComplete,
    onDelete: deleteTodo,
    onClearDueDate: clearDueDate,
    onSetBlocked: setBlocked,
    onUnblock: unblock,
    onAddTodo: addTodo,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onDragOver: handleDragOver,
    onDrop: handleDrop,
  };

  return (
    <div className="flex gap-4 pb-4 overflow-x-auto">
      {/* インボックス */}
      <KanbanColumn
        columnId={null}
        title="インボックス"
        todos={inboxTodos}
        loading={loading}
        {...commonProps}
      />

      {/* グループカラム */}
      {columns.map(({ group, todos: groupTodos }) => {
        return (
          <KanbanColumn
            key={group.id}
            columnId={group.id}
            title={group.name}
            color={group.color}
            todos={groupTodos}
            {...commonProps}
            onUpdateGroup={updateGroup}
            onDeleteGroup={deleteGroup}
          />
        );
      })}

      {/* グループ追加カラム */}
      <AddGroupColumn onAddGroup={addGroup} />
    </div>
  );
}

// ── AddGroupColumn ────────────────────────────────────────────────────────────

function AddGroupColumn({ onAddGroup }: { onAddGroup: (name: string, color: string) => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('blue');

  const handleAdd = () => {
    if (name.trim() === '') return;
    onAddGroup(name.trim(), color);
    setName('');
    setColor('blue');
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center gap-2 px-4 py-3 min-w-48 h-fit rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 hover:border-blue-300 hover:text-blue-400 dark:hover:border-blue-700 dark:hover:text-blue-500 transition-colors text-sm font-medium shrink-0"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
        グループを追加
      </button>
    );
  }

  return (
    <div className="min-w-72 w-72 shrink-0 bg-gray-100 dark:bg-gray-800/50 rounded-xl p-3 h-fit space-y-2">
      <div className="flex gap-1.5">
        {GROUP_COLORS.map(c => (
          <button
            key={c.value}
            onClick={() => setColor(c.value)}
            className={`w-4 h-4 rounded-full ${c.dot} transition-transform ${color === c.value ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'opacity-70 hover:opacity-100'}`}
            title={c.label}
          />
        ))}
      </div>
      <input
        type="text"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') handleAdd();
          if (e.key === 'Escape') { setIsAdding(false); setName(''); }
        }}
        placeholder="グループ名を入力..."
        className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        autoFocus
      />
      <div className="flex gap-1.5">
        <button
          onClick={handleAdd}
          className="flex-1 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          追加
        </button>
        <button
          onClick={() => { setIsAdding(false); setName(''); }}
          className="flex-1 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
