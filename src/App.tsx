import { HashRouter } from 'react-router-dom';
import AppRouter from "@/router/AppRouter";
import TopNav from "@/components/TopNav";
import SideNav from "@/components/SideNav";
import BottomNav from "@/components/BottomNav";

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-primary-dark text-white flex flex-col">
        {/* Navigation Layers */}
        <TopNav />
        <SideNav />

        {/* Main Content Area */}
        <main className="flex-grow w-full max-w-full transition-all duration-500 ease-in-out pt-20 lg:pt-16">
          <div className="max-w-[1600px] mx-auto w-full h-full flex flex-col">
            <AppRouter />
          </div>
        </main>

        {/* Bottom Padding: accounts for BottomNav on mobile, none on desktop */}
        <div className="h-20 sm:h-0"></div>

        {/* Mobile Bottom Tab Navigation */}
        <BottomNav />
      </div>
    </HashRouter>
  );
}
