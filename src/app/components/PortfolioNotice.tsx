'use client';

import { useAuth } from '../provider/AuthProvider';

export function PortfolioNotice() {
  const { user } = useAuth();

  if (!user || !user.isAnonymous) return null;

  return (
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
  );
}
