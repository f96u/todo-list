'use client';

import { useState } from 'react';
import { formatDueDate, getDueDateStatus } from '../utils/parseDueDate';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: Date;
  dueDate?: Date;
}

const dueDateStyles: Record<ReturnType<typeof getDueDateStatus>, string> = {
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  today:   'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  soon:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  future:  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

interface TodoListProps {
  todos: Todo[];
  loading: boolean;
  onEditSave: (id: string, text: string) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onClearDueDate: (id: string) => void;
}

export function TodoList({
  todos,
  loading,
  onEditSave,
  onToggleComplete,
  onDelete,
  onClearDueDate,
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
              <div className="flex-1 min-w-0">
                <span
                  className={`${
                    todo.completed
                      ? 'line-through text-gray-500 dark:text-gray-400'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {todo.text}
                </span>
                {todo.dueDate && (
                  <span
                    className={`group ml-2 inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${
                      todo.completed
                        ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                        : dueDateStyles[getDueDateStatus(todo.dueDate)]
                    }`}
                  >
                    {formatDueDate(todo.dueDate)}
                    <button
                      onClick={() => onClearDueDate(todo.id)}
                      className="hidden group-hover:inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                      aria-label="期日を削除"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>
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

