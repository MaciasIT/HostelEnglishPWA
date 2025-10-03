import { HashRouter } from 'react-router-dom';
import AppRouter from "@/router/AppRouter";
import BottomNav from "@/components/BottomNav";

export default function App() {
  return (
  <HashRouter>
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-white text-gray-900 dark:bg-gray-900 dark:text-white flex flex-col">
      <div className="flex-grow w-full max-w-full">
        <AppRouter />
      </div>
      <BottomNav />
    </div>
  </HashRouter>
  );
}
