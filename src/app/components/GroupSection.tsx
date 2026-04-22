'use client';

import { useState } from 'react';

export interface Group {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}

export const GROUP_COLORS: Array<{
  value: string;
  label: string;
  dot: string;
  badgeBg: string;
  badgeText: string;
  badgeDarkBg: string;
  badgeDarkText: string;
}> = [
  { value: 'blue',   label: 'ブルー',   dot: 'bg-blue-500',   badgeBg: 'bg-blue-100',   badgeText: 'text-blue-700',   badgeDarkBg: 'dark:bg-blue-900/40',   badgeDarkText: 'dark:text-blue-300'   },
  { value: 'green',  label: 'グリーン', dot: 'bg-green-500',  badgeBg: 'bg-green-100',  badgeText: 'text-green-700',  badgeDarkBg: 'dark:bg-green-900/40',  badgeDarkText: 'dark:text-green-300'  },
  { value: 'purple', label: 'パープル', dot: 'bg-purple-500', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700', badgeDarkBg: 'dark:bg-purple-900/40', badgeDarkText: 'dark:text-purple-300' },
  { value: 'red',    label: 'レッド',   dot: 'bg-red-500',    badgeBg: 'bg-red-100',    badgeText: 'text-red-700',    badgeDarkBg: 'dark:bg-red-900/40',    badgeDarkText: 'dark:text-red-300'    },
  { value: 'orange', label: 'オレンジ', dot: 'bg-orange-500', badgeBg: 'bg-orange-100', badgeText: 'text-orange-700', badgeDarkBg: 'dark:bg-orange-900/40', badgeDarkText: 'dark:text-orange-300' },
  { value: 'pink',   label: 'ピンク',   dot: 'bg-pink-500',   badgeBg: 'bg-pink-100',   badgeText: 'text-pink-700',   badgeDarkBg: 'dark:bg-pink-900/40',   badgeDarkText: 'dark:text-pink-300'   },
  { value: 'teal',   label: 'ティール', dot: 'bg-teal-500',   badgeBg: 'bg-teal-100',   badgeText: 'text-teal-700',   badgeDarkBg: 'dark:bg-teal-900/40',   badgeDarkText: 'dark:text-teal-300'   },
  { value: 'yellow', label: 'イエロー', dot: 'bg-yellow-500', badgeBg: 'bg-yellow-100', badgeText: 'text-yellow-700', badgeDarkBg: 'dark:bg-yellow-900/40', badgeDarkText: 'dark:text-yellow-300' },
];

interface GroupSectionProps {
  groups: Group[];
  activeGroupId: string | null;
  onFilterChange: (groupId: string | null) => void;
  onAddGroup: (name: string, color: string) => void;
  onUpdateGroup: (id: string, name: string, color: string) => void;
  onDeleteGroup: (id: string) => void;
}

export function GroupSection({
  groups,
  activeGroupId,
  onFilterChange,
  onAddGroup,
  onUpdateGroup,
  onDeleteGroup,
}: GroupSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('blue');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');

  const handleAdd = () => {
    if (newName.trim() === '') return;
    onAddGroup(newName.trim(), newColor);
    setNewName('');
    setNewColor('blue');
    setIsAdding(false);
  };

  const startEdit = (group: Group, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(group.id);
    setEditingName(group.name);
    setEditingColor(group.color);
  };

  const handleUpdate = () => {
    if (!editingId || editingName.trim() === '') return;
    onUpdateGroup(editingId, editingName.trim(), editingColor);
    setEditingId(null);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onDeleteGroup(id);
    if (activeGroupId === id) onFilterChange(null);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        {/* 全て フィルターボタン */}
        <button
          onClick={() => onFilterChange(null)}
          className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
            activeGroupId === null
              ? 'bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-800'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
          }`}
        >
          全て
        </button>

        {groups.map(group => {
          const c = GROUP_COLORS.find(col => col.value === group.color) ?? GROUP_COLORS[0];
          const isActive = activeGroupId === group.id;

          return (
            <div key={group.id} className="group/item relative">
              {editingId === group.id ? (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600">
                  <div className="flex gap-1">
                    {GROUP_COLORS.map(col => (
                      <button
                        key={col.value}
                        onClick={() => setEditingColor(col.value)}
                        className={`w-3.5 h-3.5 rounded-full ${col.dot} transition-transform ${
                          editingColor === col.value
                            ? 'ring-2 ring-offset-1 ring-gray-400 scale-110'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                        title={col.label}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleUpdate();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="text-xs border-0 bg-transparent dark:text-white focus:outline-none w-20"
                    autoFocus
                  />
                  <button
                    onClick={handleUpdate}
                    className="text-blue-500 hover:text-blue-600"
                    aria-label="保存"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-gray-400 hover:text-gray-500"
                    aria-label="キャンセル"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onFilterChange(isActive ? null : group.id)}
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors ${
                    isActive ? 'ring-2 ring-offset-1 ring-current ' : ''
                  }${c.badgeBg} ${c.badgeText} ${c.badgeDarkBg} ${c.badgeDarkText}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                  {group.name}
                  <span
                    onClick={e => startEdit(group, e)}
                    className="hidden group-hover/item:inline-flex items-center ml-0.5 opacity-60 hover:opacity-100 cursor-pointer"
                    role="button"
                    aria-label="編集"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z" />
                      <path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z" />
                    </svg>
                  </span>
                  <span
                    onClick={e => handleDelete(group.id, e)}
                    className="hidden group-hover/item:inline-flex items-center ml-0.5 opacity-60 hover:opacity-100 cursor-pointer"
                    role="button"
                    aria-label="削除"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                      <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L8.94 10l-4.72 4.72a.75.75 0 1 0 1.06 1.06L10 11.06l4.72 4.72a.75.75 0 1 0 1.06-1.06L11.06 10l4.72-4.72a.75.75 0 0 0-1.06-1.06L10 8.94 5.28 4.22Z" />
                    </svg>
                  </span>
                </button>
              )}
            </div>
          );
        })}

        {/* グループ追加 */}
        {isAdding ? (
          <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-700 rounded-full border border-dashed border-gray-300 dark:border-gray-600">
            <div className="flex gap-1">
              {GROUP_COLORS.map(c => (
                <button
                  key={c.value}
                  onClick={() => setNewColor(c.value)}
                  className={`w-3.5 h-3.5 rounded-full ${c.dot} transition-transform ${
                    newColor === c.value
                      ? 'ring-2 ring-offset-1 ring-gray-400 scale-110'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.label}
                />
              ))}
            </div>
            <input
              type="text"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') { setIsAdding(false); setNewName(''); }
              }}
              placeholder="グループ名"
              className="text-xs border-0 bg-transparent dark:text-white placeholder-gray-400 focus:outline-none w-20"
              autoFocus
            />
            <button onClick={handleAdd} className="text-blue-500 hover:text-blue-600" aria-label="追加">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewName(''); }}
              className="text-gray-400 hover:text-gray-500"
              aria-label="キャンセル"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="p-1 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
            aria-label="グループを追加"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
