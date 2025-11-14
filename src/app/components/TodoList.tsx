'use client';

import { useState } from 'react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: Date;
}

interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  onEditSave: (id: string, text: string) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export function TodoList({
  todos,
  loading,
  onEditSave,
  onToggleComplete,
  onDelete,
}: TodoListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingText(todo.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleSave = (id: string) => {
    if (editingText.trim() === '') return;
    onEditSave(id, editingText.trim());
    setEditingId(null);
    setEditingText('');
  };
  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        読み込み中...
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Todoがありません。上記のフォームから追加してください。
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 flex items-center gap-3"
        >
          {/* 完了チェックボックス */}
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggleComplete(todo.id)}
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
                  if (e.key === 'Enter') handleSave(todo.id);
                  if (e.key === 'Escape') cancelEdit();
                }}
                className="flex-1 px-3 py-1 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                autoFocus
              />
              <button
                onClick={() => handleSave(todo.id)}
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
                onClick={() => onDelete(todo.id)}
                className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
              >
                削除
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

