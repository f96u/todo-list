import { TodoSection } from './components/TodoSection';
import { MemoSection } from './components/MemoSection';
import { PortfolioNotice } from './components/PortfolioNotice';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-full">
        <TodoSection />
        <MemoSection />
        <div className="max-w-2xl mx-auto">
          <PortfolioNotice />
        </div>
      </div>
    </div>
  );
}
