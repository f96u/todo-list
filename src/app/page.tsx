'use client';

import { useAuth } from './provider/AuthProvider';
import { TodoSection } from './components/TodoSection';

export default function Home() {
  const { user } = useAuth();


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* ユーザーID表示 */}
        {user && (
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold">ゲストID:</span>{' '}
              <span className="font-mono text-xs break-all">{user.uid}</span>
            </p>
          </div>
        )}
        
        <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Todo List
        </h1>

        <TodoSection />

        {/* 説明セクション */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              ポートフォリオサイトについて
            </h2>
            <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <p>
                <span className="font-semibold">⚠️ データの保持期間:</span> このサイトはポートフォリオサイトのため、一定期間でデータが消去されます。
              </p>
              <p>
                <span className="font-semibold">📱 端末について:</span> ゲストIDとデータが紐づいているため、端末が変わると元のデータにアクセスできません。同じ端末・ブラウザでアクセスした場合のみ、データが保持されます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
