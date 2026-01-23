import { HashRouter } from 'react-router-dom';
import AppRouter from "@/router/AppRouter";
import TopNav from "@/components/TopNav";
import SideNav from "@/components/SideNav";
import { useAppStore } from '@/store/useAppStore';

export default function App() {
  const { isSideNavOpen } = useAppStore();

  return (
    <HashRouter>
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-primary-dark text-gray-900 dark:bg-gray-900 dark:text-white flex flex-col">
        <TopNav />
        <SideNav />
        <main className={`flex-grow w-full max-w-full transition-all duration-300 ease-in-out pt-16 ${isSideNavOpen ? 'pl-64' : ''}`}>
          <AppRouter />
        </main>
      </div>
    </HashRouter>
  );
}
