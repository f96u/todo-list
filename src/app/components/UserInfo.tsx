'use client';

import { useAuth } from '../provider/AuthProvider';

export function UserInfo() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        <span className="font-semibold">ゲストID:</span>{' '}
        <span className="font-mono text-xs break-all">{user.uid}</span>
      </p>
    </div>
  );
}

