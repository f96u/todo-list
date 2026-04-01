'use client';

import { useState } from 'react';
import { formatDueDate, getDueDateStatus } from '../utils/parseDueDate';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt?: Date;
  dueDate?: Date;
  blocked?: boolean;
  blockedReason?: string;
  completedAt?: Date;
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
  onSetBlocked: (id: string, reason: string) => void;
  onUnblock: (id: string) => void;
}

export function TodoList({
  todos,
  loading,
  onEditSave,
  onToggleComplete,
  onDelete,
  onClearDueDate,
  onSetBlocked,
  onUnblock,
}: TodoListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [blockingId, setBlockingId] = useState<string | null>(null);
  const [blockingReason, setBlockingReason] = useState('');

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

  const startBlocking = (todo: Todo) => {
    setBlockingId(todo.id);
    setBlockingReason(todo.blockedReason ?? '');
  };

  const cancelBlocking = () => {
    setBlockingId(null);
    setBlockingReason('');
  };

  const handleSetBlocked = (id: string) => {
    onSetBlocked(id, blockingReason.trim());
    setBlockingId(null);
    setBlockingReason('');
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[40, 65, 50].map((width, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3"
          >
            <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
            <div className="h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" style={{ width: `${width}%` }} />
          </div>
        ))}
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
          className={`group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex items-center gap-3 transition-shadow hover:shadow-md ${
            todo.blocked && !todo.completed ? 'border-l-4 border-l-amber-400 dark:border-l-amber-500' : ''
          }`}
        >
          {/* 完了チェックボックス */}
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggleComplete(todo.id)}
            className="w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
          />

          {/* Todoテキストまたは編集フィールド */}
          {editingId === todo.id ? (
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave(todo.id);
                  if (e.key === 'Escape') cancelEdit();
                }}
                className="flex-1 px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                autoFocus
              />
              {/* 保存ボタン（チェックアイコン） */}
              <button
                onClick={() => handleSave(todo.id)}
                className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                aria-label="保存"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              </button>
              {/* キャンセルボタン（バツアイコン） */}
              <button
                onClick={cancelEdit}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="キャンセル"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
          ) : blockingId === todo.id ? (
            /* ブロック理由入力フィールド */
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={blockingReason}
                onChange={(e) => setBlockingReason(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.metaKey) handleSetBlocked(todo.id);
                  if (e.key === 'Escape') cancelBlocking();
                }}
                placeholder="待機理由を入力（任意）"
                className="flex-1 px-3 py-1.5 border border-amber-300 dark:border-amber-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-gray-700 dark:text-white"
                autoFocus
              />
              <button
                onClick={() => handleSetBlocked(todo.id)}
                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                aria-label="待機状態に設定"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={cancelBlocking}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="キャンセル"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <span
                  className={`${
                    todo.completed
                      ? 'line-through text-gray-400 dark:text-gray-500'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {todo.text}
                </span>
                {todo.dueDate && (
                  <span
                    className={`group/badge ml-2 inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${
                      todo.completed
                        ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                        : dueDateStyles[getDueDateStatus(todo.dueDate)]
                    }`}
                  >
                    {formatDueDate(todo.dueDate)}
                    <button
                      onClick={() => onClearDueDate(todo.id)}
                      className="hidden group-hover/badge:inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                      aria-label="期日を削除"
                    >
                      ✕
                    </button>
                  </span>
                )}
                {todo.blocked && !todo.completed && (
                  <span className="group/block ml-2 inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
                    </svg>
                    {todo.blockedReason || '待機中'}
                    <button
                      onClick={() => onUnblock(todo.id)}
                      className="hidden group-hover/block:inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-black/20 dark:hover:bg-white/20 transition-colors"
                      aria-label="待機を解除"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>

              {/* アクションボタン（ホバー時のみ表示） */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!todo.completed && (
                  <>
                    <button
                      onClick={() => startEdit(todo)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                      aria-label="編集"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => todo.blocked ? onUnblock(todo.id) : startBlocking(todo)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        todo.blocked
                          ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                          : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/20'
                      }`}
                      aria-label={todo.blocked ? '待機を解除' : '待機状態に設定'}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </>
                )}
                <button
                  onClick={() => onDelete(todo.id)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                  aria-label="削除"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
