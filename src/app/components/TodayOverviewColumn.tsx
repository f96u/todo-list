'use client';

import { useState } from 'react';
import { formatDueDate, getDueDateStatus } from '../utils/parseDueDate';
import { Todo } from './KanbanColumn';
import { Group, GROUP_COLORS } from './GroupSection';

interface TodayCardProps {
  todo: Todo;
  groupName: string | null;
  groupColor: string | null;
  onToggleComplete: (id: string) => void;
  onEditSave: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onClearDueDate: (id: string) => void;
  onSetBlocked: (id: string, reason: string) => void;
  onUnblock: (id: string) => void;
}

function TodayCard({
  todo,
  groupName,
  groupColor,
  onToggleComplete,
  onEditSave,
  onDelete,
  onClearDueDate,
  onSetBlocked,
  onUnblock,
}: TodayCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingText, setEditingText] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockingReason, setBlockingReason] = useState('');

  const colorInfo = groupColor ? GROUP_COLORS.find(c => c.value === groupColor) : null;
  const dueDateStatus = todo.dueDate ? getDueDateStatus(todo.dueDate) : null;

  const startEdit = () => { setIsEditing(true); setEditingText(todo.text); };
  const handleSave = () => {
    if (editingText.trim() === '') return;
    onEditSave(todo.id, editingText.trim());
    setIsEditing(false);
  };
  const startBlocking = () => { setIsBlocking(true); setBlockingReason(todo.blockedReason ?? ''); };
  const handleSetBlocked = () => {
    onSetBlocked(todo.id, blockingReason.trim());
    setIsBlocking(false);
  };

  return (
    <div
      className={`group bg-white dark:bg-gray-800 rounded-lg border p-3 shadow-sm hover:shadow-md transition-all ${
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
              {todo.text}
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {/* グループバッジ */}
              {colorInfo ? (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${colorInfo.badgeBg} ${colorInfo.badgeText} ${colorInfo.badgeDarkBg} ${colorInfo.badgeDarkText}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${colorInfo.dot} shrink-0`} />
                  {groupName}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5">
                    <path d="M2 3a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1H2Z" />
                    <path fillRule="evenodd" d="M2 7.5h12l-1.182 6.492A2 2 0 0 1 10.839 15H5.161a2 2 0 0 1-1.979-1.008L2 7.5Zm5 1.5a.75.75 0 0 0 0 1.5h2a.75.75 0 0 0 0-1.5H7Z" clipRule="evenodd" />
                  </svg>
                  インボックス
                </span>
              )}
              {/* 期日バッジ */}
              {todo.dueDate && dueDateStatus && (
                <span className={`group/badge inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded ${
                  !!todo.completedAt
                    ? 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                    : dueDateStatus === 'overdue'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                }`}>
                  {formatDueDate(todo.dueDate)}
                  <button
                    onClick={e => { e.stopPropagation(); onClearDueDate(todo.id); }}
                    className="hidden group-hover/badge:inline-flex items-center justify-center w-3.5 h-3.5 rounded-full hover:bg-black/20 transition-colors"
                    aria-label="期日を削除"
                  >✕</button>
                </span>
              )}
              {/* 待機バッジ */}
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

// ─── TodayOverviewColumn ───────────────────────────────────────────────────────

interface TodayOverviewColumnProps {
  todos: Todo[];
  groups: Group[];
  onEditSave: (id: string, text: string) => void;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onClearDueDate: (id: string) => void;
  onSetBlocked: (id: string, reason: string) => void;
  onUnblock: (id: string) => void;
}

export function TodayOverviewColumn({
  todos,
  groups,
  onEditSave,
  onToggleComplete,
  onDelete,
  onClearDueDate,
  onSetBlocked,
  onUnblock,
}: TodayOverviewColumnProps) {
  const todayTodos = todos.filter(t => {
    if (t.completedAt) return false;
    if (!t.dueDate) return false;
    const s = getDueDateStatus(t.dueDate);
    return s === 'today' || s === 'overdue';
  });

  // 期日昇順（overdue → today）
  const sorted = [...todayTodos].sort((a, b) => {
    if (!a.dueDate || !b.dueDate) return 0;
    return a.dueDate.getTime() - b.dueDate.getTime();
  });

  const cardProps = { onEditSave, onToggleComplete, onDelete, onClearDueDate, onSetBlocked, onUnblock };

  return (
    <div className="flex flex-col rounded-xl border-2 border-orange-200 dark:border-orange-900/50 bg-orange-50/60 dark:bg-orange-950/20 min-w-72 w-72 shrink-0">
      {/* ヘッダー */}
      <div className="px-3 pt-3 pb-2 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-orange-500 shrink-0">
          <path d="M10 2a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 2ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM15.657 5.404a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.061-1.06ZM6.464 14.596a.75.75 0 1 0-1.06-1.06l-1.061 1.06a.75.75 0 0 0 1.06 1.06l1.061-1.06ZM18 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 18 10ZM5 10a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 5 10ZM14.596 15.657a.75.75 0 0 0 1.06-1.06l-1.06-1.061a.75.75 0 1 0-1.06 1.06l1.06 1.061ZM5.404 6.464a.75.75 0 0 0 1.06-1.06L5.403 4.343a.75.75 0 0 0-1.06 1.06l1.061 1.061Z" />
        </svg>
        <h2 className="font-semibold text-sm text-orange-700 dark:text-orange-400">今日やること</h2>
        <span className="text-xs text-orange-400 dark:text-orange-600 font-normal">{sorted.length}</span>
      </div>

      {/* タスクリスト */}
      <div className="px-3 pb-3 flex flex-col gap-2 overflow-y-auto flex-1">
        {sorted.length === 0 ? (
          <p className="text-xs text-orange-300 dark:text-orange-800 py-4 text-center">
            今日のタスクはありません
          </p>
        ) : (
          sorted.map(todo => {
            const group = groups.find(g => g.id === todo.groupId) ?? null;
            return (
              <TodayCard
                key={todo.id}
                todo={todo}
                groupName={group?.name ?? null}
                groupColor={group?.color ?? null}
                {...cardProps}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
