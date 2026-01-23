import { HashRouter } from 'react-router-dom';
import AppRouter from "@/router/AppRouter";
import TopNav from "@/components/TopNav";
import SideNav from "@/components/SideNav";

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-primary-dark text-white flex flex-col">
        {/* Navigation Layers */}
        <TopNav />
        <SideNav />

        {/* Main Content Area */}
        <main className="flex-grow w-full max-w-full transition-all duration-500 ease-in-out pt-20">
          <AppRouter />
        </main>

        {/* Global Bottom Padding for PWA/Mobile Navigation if needed */}
        <div className="h-10 sm:h-0"></div>
      </div>
    </HashRouter>
  );
}
