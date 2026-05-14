'use client';

import { useState, useEffect, useRef } from 'react';
import { getDoc, doc, updateDoc, Timestamp } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { db } from '../firebase/config';
import { useAuth } from '../provider/AuthProvider';

export interface Memo {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

function serializeMemo(memo: Memo) {
  return {
    id: memo.id,
    content: memo.content,
    createdAt: Timestamp.fromDate(new Date(memo.createdAt)),
    updatedAt: Timestamp.fromDate(new Date(memo.updatedAt)),
    ...(memo.deletedAt ? { deletedAt: Timestamp.fromDate(new Date(memo.deletedAt)) } : {}),
  };
}

function formatUpdatedAt(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${d} ${hh}:${mm}`;
}

// ── MemoEditor (編集モード) ──────────────────────────────────────────────────

interface MemoEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
}

function MemoEditor({ initialContent, onSave, onCancel }: MemoEditorProps) {
  const [draft, setDraft] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }, []);

  return (
    <div className="aspect-square w-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700/60 rounded-lg shadow-sm flex flex-col">
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onSave(draft);
          if (e.key === 'Escape') onCancel();
        }}
        placeholder="マークダウン形式で入力 (# 見出し, - リスト, **太字** など)"
        className="flex-1 min-h-0 p-3 bg-transparent text-sm font-mono text-gray-800 dark:text-gray-100 resize-none focus:outline-none rounded-t-lg"
      />
      <div className="flex items-center justify-between gap-2 px-2 py-1.5 border-t border-yellow-200 dark:border-yellow-800/60 shrink-0">
        <span className="text-[10px] text-gray-400 dark:text-gray-500 truncate">⌘+Enter 保存 / Esc キャンセル</span>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onCancel}
            className="p-1 rounded text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="キャンセル"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
          <button
            onClick={() => onSave(draft)}
            className="p-1 rounded text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30"
            aria-label="保存"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── MemoView (表示モード) ────────────────────────────────────────────────────

interface MemoViewProps {
  memo: Memo;
  onStartEdit: () => void;
  onDelete: () => void;
}

function MemoView({ memo, onStartEdit, onDelete }: MemoViewProps) {
  return (
    <div className="group relative aspect-square w-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/60 rounded-lg shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* ホバー時のアクションボタン */}
      <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={onStartEdit}
          className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-white/80 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-800/80 transition-colors backdrop-blur-sm"
          aria-label="編集"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
            <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded text-gray-500 hover:text-red-500 hover:bg-white/80 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-800/80 transition-colors backdrop-blur-sm"
          aria-label="削除"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {memo.content.trim() === '' ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">空のメモ</p>
        ) : (
          <div className="memo-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {memo.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      {/* 更新日 */}
      <div className="px-3 py-1 border-t border-yellow-200/70 dark:border-yellow-800/40 text-[10px] text-gray-500 dark:text-gray-400 shrink-0">
        更新: {formatUpdatedAt(memo.updatedAt)}
      </div>
    </div>
  );
}

// ── MemoTrashCard (ゴミ箱内の表示) ────────────────────────────────────────────

interface MemoTrashCardProps {
  memo: Memo;
  onRestore: () => void;
  onPermanentDelete: () => void;
}

function MemoTrashCard({ memo, onRestore, onPermanentDelete }: MemoTrashCardProps) {
  return (
    <div className="relative aspect-square w-full bg-gray-50 dark:bg-gray-800/40 border border-gray-200 dark:border-gray-700/60 rounded-lg shadow-sm flex flex-col opacity-80">
      <div className="absolute top-1.5 right-1.5 flex gap-0.5 z-10">
        <button
          onClick={onRestore}
          className="p-1 rounded text-gray-500 hover:text-green-600 hover:bg-white/80 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-gray-800/80 transition-colors backdrop-blur-sm"
          aria-label="復元"
          title="復元"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 0 1-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 0 1 0 10.75H10.75a.75.75 0 0 1 0-1.5h2.875a3.875 3.875 0 0 0 0-7.75H3.622l4.146 3.957a.75.75 0 0 1-1.036 1.085l-5.5-5.25a.75.75 0 0 1 0-1.085l5.5-5.25a.75.75 0 0 1 1.06.025Z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={onPermanentDelete}
          className="p-1 rounded text-gray-500 hover:text-red-500 hover:bg-white/80 dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-gray-800/80 transition-colors backdrop-blur-sm"
          aria-label="完全削除"
          title="完全削除"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 min-h-0">
        {memo.content.trim() === '' ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">空のメモ</p>
        ) : (
          <div className="memo-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {memo.content}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <div className="px-3 py-1 border-t border-gray-200 dark:border-gray-700/60 text-[10px] text-gray-500 dark:text-gray-400 shrink-0">
        削除: {memo.deletedAt ? formatUpdatedAt(memo.deletedAt) : ''}
      </div>
    </div>
  );
}

// ── MemoSection ───────────────────────────────────────────────────────────────

export function MemoSection() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading || !user) return;
    const loadMemos = async () => {
      setDataLoading(true);
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          const memosData = (data.todolist?.memos || []) as Array<Memo & { createdAt: Timestamp | Date; updatedAt: Timestamp | Date; deletedAt?: Timestamp | Date }>;
          const withDates: Memo[] = memosData.map(memo => ({
            ...memo,
            createdAt: 'toDate' in memo.createdAt ? (memo.createdAt as Timestamp).toDate() : memo.createdAt as Date,
            updatedAt: 'toDate' in memo.updatedAt ? (memo.updatedAt as Timestamp).toDate() : memo.updatedAt as Date,
            ...(memo.deletedAt ? {
              deletedAt: 'toDate' in memo.deletedAt ? (memo.deletedAt as Timestamp).toDate() : memo.deletedAt as Date,
            } : {}),
          }));
          setMemos(withDates);
        }
      } catch (error) {
        console.error('Error loading memos:', error);
      } finally {
        setDataLoading(false);
      }
    };
    loadMemos();
  }, [user, authLoading]);

  const saveMemos = (updated: Memo[]) => {
    const previous = memos;
    setMemos(updated);
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    updateDoc(userRef, { 'todolist.memos': updated.map(serializeMemo) }).catch(error => {
      console.error('Error saving memos:', error);
      setMemos(previous);
    });
  };

  const addMemo = () => {
    if (!user) return;
    const now = new Date();
    const newMemo: Memo = {
      id: Date.now().toString(),
      content: '',
      createdAt: now,
      updatedAt: now,
    };
    saveMemos([newMemo, ...memos]);
    setEditingId(newMemo.id);
  };

  const updateMemo = (id: string, content: string) => {
    if (!user) return;
    const existing = memos.find(m => m.id === id);
    if (!existing) return;
    if (content.trim() === '') {
      if (existing.content.trim() === '') {
        // 新規作成直後に空のまま保存した場合のみ物理削除
        saveMemos(memos.filter(m => m.id !== id));
      } else {
        // 内容のあったメモを空に編集して保存した場合はゴミ箱へ
        saveMemos(memos.map(m => m.id === id ? { ...m, deletedAt: new Date() } : m));
      }
      return;
    }
    if (existing.content === content) return;
    saveMemos(memos.map(m => m.id === id ? { ...m, content, updatedAt: new Date() } : m));
  };

  const cancelEdit = (id: string) => {
    const existing = memos.find(m => m.id === id);
    if (existing && existing.content === '') {
      saveMemos(memos.filter(m => m.id !== id));
    }
    setEditingId(null);
  };

  const deleteMemo = (id: string) => {
    saveMemos(memos.map(m => m.id === id ? { ...m, deletedAt: new Date() } : m));
    if (editingId === id) setEditingId(null);
  };

  const restoreMemo = (id: string) => {
    saveMemos(memos.map(m => {
      if (m.id !== id) return m;
      const next = { ...m };
      delete next.deletedAt;
      return next;
    }));
  };

  const permanentDeleteMemo = (id: string) => {
    saveMemos(memos.filter(m => m.id !== id));
  };

  if (authLoading) return null;

  const activeMemos = memos.filter(m => !m.deletedAt);
  const deletedMemos = memos
    .filter(m => m.deletedAt)
    .sort((a, b) => (b.deletedAt!.getTime() - a.deletedAt!.getTime()));

  return (
    <div className="max-w-7xl mx-auto mt-8">
      <div className="flex items-center gap-2 mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-gray-500 dark:text-gray-400">
          <path d="M5.5 3.5A1.5 1.5 0 0 1 7 2h6a1.5 1.5 0 0 1 1.5 1.5v1A1.5 1.5 0 0 1 13 6H7a1.5 1.5 0 0 1-1.5-1.5v-1Z" />
          <path fillRule="evenodd" d="M4 4.5a2 2 0 0 0-2 2V16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6.5a2 2 0 0 0-2-2h-.5a3 3 0 0 1-3 3h-5a3 3 0 0 1-3-3H4Zm2 6.25a.75.75 0 0 1 .75-.75h6.5a.75.75 0 0 1 0 1.5h-6.5a.75.75 0 0 1-.75-.75Zm.75 2.75a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-4.5Z" clipRule="evenodd" />
        </svg>
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">メモ</h2>
        <span className="text-xs text-gray-400 dark:text-gray-500">{activeMemos.length}</span>
      </div>

      {dataLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="aspect-square w-full rounded-lg bg-gray-100 dark:bg-gray-800/50 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {activeMemos.map(memo =>
              editingId === memo.id ? (
                <MemoEditor
                  key={memo.id}
                  initialContent={memo.content}
                  onSave={content => { updateMemo(memo.id, content); setEditingId(null); }}
                  onCancel={() => cancelEdit(memo.id)}
                />
              ) : (
                <MemoView
                  key={memo.id}
                  memo={memo}
                  onStartEdit={() => setEditingId(memo.id)}
                  onDelete={() => deleteMemo(memo.id)}
                />
              )
            )}
            <button
              onClick={addMemo}
              className="aspect-square w-full rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 hover:border-blue-300 hover:text-blue-400 dark:hover:border-blue-700 dark:hover:text-blue-500 transition-colors flex flex-col items-center justify-center gap-1.5"
              aria-label="メモを追加"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
              </svg>
              <span className="text-sm font-medium">メモを追加</span>
            </button>
          </div>

          {deletedMemos.length > 0 && (
            <div className="mt-6">
              <button
                onClick={() => setTrashOpen(o => !o)}
                className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-expanded={trashOpen}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={`w-4 h-4 transition-transform ${trashOpen ? 'rotate-90' : ''}`}
                >
                  <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z" clipRule="evenodd" />
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4Z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">ゴミ箱</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{deletedMemos.length}</span>
              </button>

              {trashOpen && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {deletedMemos.map(memo => (
                    <MemoTrashCard
                      key={memo.id}
                      memo={memo}
                      onRestore={() => restoreMemo(memo.id)}
                      onPermanentDelete={() => {
                        if (window.confirm('このメモを完全に削除します。元に戻せません。よろしいですか？')) {
                          permanentDeleteMemo(memo.id);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
