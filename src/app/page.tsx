import { TodoSection } from './components/TodoSection';
import { UserInfo } from './components/UserInfo';
import { PortfolioNotice } from './components/PortfolioNotice';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <UserInfo />
        <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Todo List
        </h1>
        <TodoSection />
        <PortfolioNotice />
      </div>
    </div>
  );
}
