import { BrowserRouter } from 'react-router-dom';
import AppRouter from "@/router/AppRouter";
import BottomNav from "@/components/BottomNav";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-900 dark:text-white flex flex-col">
        <div className="flex-grow">
          <AppRouter />
        </div>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
