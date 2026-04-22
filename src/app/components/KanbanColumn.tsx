'use client';

import { useState, useRef } from 'react';
import { formatDueDate, getDueDateStatus } from '../utils/parseDueDate';
import { Group, GROUP_COLORS } from './GroupSection';

export interface Todo {
  id: string;
  text: string;
  createdAt: Date;
  dueDate?: Date;
  completedAt?: Date;
  blockedReason: string;
  groupId?: string;
}

const dueDateStyles: Record<ReturnType<typeof getDueDateStatus>, string> = {
  overdue: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  today:   'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  soon:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  future:  'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
};

interface TodoCardProps {
  todo: Todo;
  groups: Group[];
  onEditSave: (id: string, text: string) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onClearDueDate: (id: string) => void;
  onSetBlocked: (id: string, reason: string) => void;
  onUnblock: (id: string) => void;
  onDragStart: (e: React.DragEvent, todoId: string) => void;
  onDragEnd: () => void;
  isDragging: boolean;
}

function TodoCard({
  todo,
  groups,
  onEditSave,
  onToggleComplete,
  onDelete,
  onClearDueDate,
  onSetBlocked,
  onUnblock,
  onDragStart,
  onDragEnd,
  isDragging,
}: TodoCardProps) {
  const [editingText, setEditingText] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockingReason, setBlockingReason] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const startEdit = () => {
    setIsEditing(true);
    setEditingText(todo.text);
  };

  const handleSave = () => {
    if (editingText.trim() === '') return;
    onEditSave(todo.id, editingText.trim());
    setIsEditing(false);
  };

  const startBlocking = () => {
    setIsBlocking(true);
    setBlockingReason(todo.blockedReason ?? '');
  };

  const handleSetBlocked = () => {
    onSetBlocked(todo.id, blockingReason.trim());
    setIsBlocking(false);
  };

  const renderTextWithLinks = (text: string) => {
    const parts = text.split(/(https?:\/\/[^\s]+)/g);
    return parts.map((part, i) =>
      /^https?:\/\//.test(part) ? (
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(part);
            setCopiedUrl(part);
            setTimeout(() => setCopiedUrl(null), 2000);
          }}
          title={copiedUrl === part ? 'コピーしました！' : `クリックしてコピー: ${part}`}
          className={`inline-flex items-center mx-0.5 transition-colors ${
            copiedUrl === part
              ? 'text-green-500 dark:text-green-400'
              : 'text-blue-400 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300'
          }`}
          aria-label={`URLをコピー: ${part}`}
        >
          {copiedUrl === part ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4.25 5.5a.75.75 0 0 0-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 0 0 .75-.75v-4a.75.75 0 0 1 1.5 0v4A2.25 2.25 0 0 1 12.75 17h-8.5A2.25 2.25 0 0 1 2 14.75v-8.5A2.25 2.25 0 0 1 4.25 4h5a.75.75 0 0 1 0 1.5h-5Z" clipRule="evenodd" />
              <path fillRule="evenodd" d="M6.194 12.753a.75.75 0 0 0 1.06.053L16.5 4.44v2.81a.75.75 0 0 0 1.5 0v-4.5a.75.75 0 0 0-.75-.75h-4.5a.75.75 0 0 0 0 1.5h2.553l-9.056 8.194a.75.75 0 0 0-.053 1.06Z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      ) : (
        part
      )
    );
  };

  return (
    <div
      draggable={!isEditing && !isBlocking}
      onDragStart={e => onDragStart(e, todo.id)}
      onDragEnd={onDragEnd}
      className={`group bg-white dark:bg-gray-800 rounded-lg border p-3 transition-all cursor-grab active:cursor-grabbing select-none ${
        isDragging
          ? 'opacity-30 shadow-lg scale-95'
          : 'shadow-sm hover:shadow-md'
      } ${
        !!todo.blockedReason && !todo.completedAt
          ? 'border-l-4 border-l-amber-400 border-gray-100 dark:border-l-amber-500 dark:border-gray-700'
          : 'border-gray-100 dark:border-gray-700'
      }`}
    >
      {isEditing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={editingText}
            onChange={e => setEditingText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
          <button onClick={handleSave} className="p-1 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded" aria-label="保存">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
          </button>
          <button onClick={() => setIsEditing(false)} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" aria-label="キャンセル">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
      ) : isBlocking ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={blockingReason}
            onChange={e => setBlockingReason(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.metaKey) handleSetBlocked();
              if (e.key === 'Escape') setIsBlocking(false);
            }}
            placeholder="待機理由を入力（任意）"
            className="flex-1 px-2 py-1 text-sm border border-amber-300 dark:border-amber-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 dark:bg-gray-700 dark:text-white"
            autoFocus
          />
          <button onClick={handleSetBlocked} className="p-1 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded" aria-label="設定">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
          </button>
          <button onClick={() => setIsBlocking(false)} className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" aria-label="キャンセル">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={!!todo.completedAt}
            onChange={() => onToggleComplete(todo.id)}
            onClick={e => e.stopPropagation()}
            className="mt-0.5 w-4 h-4 text-blue-500 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer shrink-0"
          />
          <div className="flex-1 min-w-0">
            <span className={`text-sm leading-snug break-words ${!!todo.completedAt ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
              {renderTextWithLinks(todo.text)}
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {todo.dueDate && (
                <span className={`group/badge inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${!!todo.completedAt ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500' : dueDateStyles[getDueDateStatus(todo.dueDate)]}`}>
                  {formatDueDate(todo.dueDate)}
                  <button
                    onClick={e => { e.stopPropagation(); onClearDueDate(todo.id); }}
                    className="hidden group-hover/badge:inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-black/20 transition-colors"
                    aria-label="期日を削除"
                  >✕</button>
                </span>
              )}
              {!!todo.blockedReason && !todo.completedAt && (
                <span className="group/block inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                    <path fillRule="evenodd" d="M8 1a3.5 3.5 0 0 0-3.5 3.5V7A1.5 1.5 0 0 0 3 8.5v5A1.5 1.5 0 0 0 4.5 15h7a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 11 7V4.5A3.5 3.5 0 0 0 8 1Zm2 6V4.5a2 2 0 1 0-4 0V7h4Z" clipRule="evenodd" />
                  </svg>
                  {todo.blockedReason || '待機中'}
                  <button
                    onClick={e => { e.stopPropagation(); onUnblock(todo.id); }}
                    className="hidden group-hover/block:inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-black/20 transition-colors"
                    aria-label="待機を解除"
                  >✕</button>
                </span>
              )}
            </div>
          </div>
          {/* アクションボタン */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            {!todo.completedAt && (
              <>
                <button
                  onClick={e => { e.stopPropagation(); startEdit(); }}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
                  aria-label="編集"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                    <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
                  </svg>
                </button>
                <button
                  onClick={e => { e.stopPropagation(); !!todo.blockedReason ? onUnblock(todo.id) : startBlocking(); }}
                  className={`p-1 rounded transition-colors ${!!todo.blockedReason ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-900/20'}`}
                  aria-label={!!todo.blockedReason ? '待機を解除' : '待機状態に設定'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd" />
                  </svg>
                </button>
              </>
            )}
            <button
              onClick={e => { e.stopPropagation(); onDelete(todo.id); }}
              className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
              aria-label="削除"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── KanbanColumn ──────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  columnId: string | null; // null = inbox
  title: string;
  color?: string; // GROUP_COLORS value, undefined = inbox gray
  todos: Todo[];
  groups: Group[];
  loading?: boolean;
  draggingTodoId: string | null;
  dragOverColumnId: string | null; // 'null' string or group id
  onEditSave: (id: string, text: string) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onClearDueDate: (id: string) => void;
  onSetBlocked: (id: string, reason: string) => void;
  onUnblock: (id: string) => void;
  onAddTodo: (groupId: string | null, text: string) => void;
  onDragStart: (e: React.DragEvent, todoId: string) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, columnId: string | null) => void;
  onDrop: (e: React.DragEvent, groupId: string | null) => void;
  onUpdateGroup?: (id: string, name: string, color: string) => void;
  onDeleteGroup?: (id: string) => void;
}

export function KanbanColumn({
  columnId,
  title,
  color,
  todos,
  groups,
  loading,
  draggingTodoId,
  dragOverColumnId,
  onEditSave,
  onToggleComplete,
  onDelete,
  onClearDueDate,
  onSetBlocked,
  onUnblock,
  onAddTodo,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onUpdateGroup,
  onDeleteGroup,
}: KanbanColumnProps) {
  const [addingText, setAddingText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingColor, setEditingColor] = useState(color ?? 'blue');
  const inputRef = useRef<HTMLInputElement>(null);

  const columnKey = columnId ?? 'null';
  const isDragOver = dragOverColumnId === columnKey;

  const c = color ? GROUP_COLORS.find(col => col.value === color) ?? GROUP_COLORS[0] : null;

  const handleAddSubmit = () => {
    if (addingText.trim() === '') return;
    onAddTodo(columnId, addingText.trim());
    setAddingText('');
    setIsAdding(false);
  };

  const handleTitleSave = () => {
    if (!columnId || editingTitle.trim() === '') return;
    onUpdateGroup?.(columnId, editingTitle.trim(), editingColor);
    setIsEditingTitle(false);
  };

  const incompleteTodos = todos.filter(t => !t.completedAt);
  const completedTodos = todos.filter(t => !!t.completedAt);

  return (
    <div
      className={`flex flex-col rounded-xl border-2 transition-colors min-w-72 w-72 shrink-0 ${
        isDragOver
          ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950/30'
          : 'border-transparent bg-gray-100 dark:bg-gray-800/50'
      }`}
      onDragOver={e => onDragOver(e, columnId)}
      onDrop={e => onDrop(e, columnId)}
    >
      {/* カラムヘッダー */}
      <div className="px-3 pt-3 pb-2">
        {isEditingTitle && columnId ? (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {GROUP_COLORS.map(col => (
                <button
                  key={col.value}
                  onClick={() => setEditingColor(col.value)}
                  className={`w-4 h-4 rounded-full ${col.dot} transition-transform ${editingColor === col.value ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'opacity-70 hover:opacity-100'}`}
                  title={col.label}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={editingTitle}
                onChange={e => setEditingTitle(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleTitleSave();
                  if (e.key === 'Escape') setIsEditingTitle(false);
                }}
                className="flex-1 px-2 py-1 text-sm font-semibold border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                autoFocus
              />
              <button onClick={handleTitleSave} className="p-1 text-blue-500 hover:bg-blue-50 rounded" aria-label="保存">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
              </button>
              <button onClick={() => setIsEditingTitle(false)} className="p-1 text-gray-400 hover:bg-gray-100 rounded" aria-label="キャンセル">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between group/header">
            <div className="flex items-center gap-2">
              {c ? (
                <span className={`w-2.5 h-2.5 rounded-full ${c.dot} shrink-0`} />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400 shrink-0">
                  <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
                  <path fillRule="evenodd" d="M2 7.5h16l-1.577 8.649A2 2 0 0 1 14.445 18H5.555a2 2 0 0 1-1.978-1.851L2 7.5Zm6.5 1a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5h-3Z" clipRule="evenodd" />
                </svg>
              )}
              <h2 className="font-semibold text-sm text-gray-700 dark:text-gray-200">{title}</h2>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">{incompleteTodos.length}</span>
            </div>
            {columnId && (
              <div className="flex gap-0.5 opacity-0 group-hover/header:opacity-100 transition-opacity">
                <button
                  onClick={() => { setEditingTitle(title); setEditingColor(color ?? 'blue'); setIsEditingTitle(true); }}
                  className="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  aria-label="グループを編集"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                    <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                  </svg>
                </button>
                <button
                  onClick={() => onDeleteGroup?.(columnId)}
                  className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  aria-label="グループを削除"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* タスクリスト */}
      <div className="flex-1 overflow-y-auto px-3 pb-1 space-y-2 min-h-16">
        {loading ? (
          [40, 65, 50].map((width, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
              <div className="h-3.5 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" style={{ width: `${width}%` }} />
            </div>
          ))
        ) : (
          <>
            {incompleteTodos.map(todo => (
              <TodoCard
                key={todo.id}
                todo={todo}
                groups={groups}
                onEditSave={onEditSave}
                onToggleComplete={onToggleComplete}
                onDelete={onDelete}
                onClearDueDate={onClearDueDate}
                onSetBlocked={onSetBlocked}
                onUnblock={onUnblock}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                isDragging={draggingTodoId === todo.id}
              />
            ))}
            {completedTodos.map(todo => (
              <TodoCard
                key={todo.id}
                todo={todo}
                groups={groups}
                onEditSave={onEditSave}
                onToggleComplete={onToggleComplete}
                onDelete={onDelete}
                onClearDueDate={onClearDueDate}
                onSetBlocked={onSetBlocked}
                onUnblock={onUnblock}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                isDragging={draggingTodoId === todo.id}
              />
            ))}
            {incompleteTodos.length === 0 && completedTodos.length === 0 && (
              <div className={`h-16 rounded-lg border-2 border-dashed flex items-center justify-center text-xs transition-colors ${isDragOver ? 'border-blue-300 text-blue-400' : 'border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600'}`}>
                {isDragOver ? 'ここにドロップ' : 'タスクなし'}
              </div>
            )}
          </>
        )}
      </div>

      {/* タスク追加 */}
      <div className="px-3 pb-3 pt-1">
        {isAdding ? (
          <div className="flex items-center gap-1.5">
            <input
              ref={inputRef}
              type="text"
              value={addingText}
              onChange={e => setAddingText(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && e.metaKey) handleAddSubmit();
                if (e.key === 'Escape') { setIsAdding(false); setAddingText(''); }
              }}
              placeholder="タスクを入力..."
              className="flex-1 px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <button onClick={handleAddSubmit} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg" aria-label="追加">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
            </button>
            <button onClick={() => { setIsAdding(false); setAddingText(''); }} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg" aria-label="キャンセル">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            タスクを追加
          </button>
        )}
      </div>
    </div>
  );
}
