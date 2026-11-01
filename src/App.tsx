import { HashRouter } from 'react-router';
import AppRouter from "@/router/AppRouter";
import TopNav from "@/components/TopNav";
import SideNav from "@/components/SideNav";
import BottomNav from "@/components/BottomNav";
import { useAppStore } from "@/store/useAppStore";
import { useHydration } from "@/contexts/HydrationContext";
import { PageSkeleton } from "@/components/Skeleton";
import SkipToContent from "@/components/SkipToContent";
import { MotionConfig } from "framer-motion";
import RoleSelectionModal from "@/components/RoleSelectionModal";

const AppContent: React.FC = () => {
  const { isHydrating } = useHydration();
  const isSideNavCollapsed = useAppStore((s) => s.isSideNavCollapsed);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-surface text-primary flex flex-col relative">
      <SkipToContent />

      {/* Navigation Layers */}
      <TopNav />
      <SideNav />

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} className={`flex-grow w-full max-w-full transition-[padding] duration-300 ease-in-out pt-16 ${isSideNavCollapsed ? 'md:pl-20' : 'md:pl-20 xl:pl-72'}`}>
        <div className="max-w-7xl mx-auto w-full h-full flex flex-col">
          {isHydrating ? (
            <PageSkeleton />
          ) : (
            <AppRouter />
          )}
        </div>
      </main>

      {/* Bottom Padding: accounts for BottomNav on mobile, none on desktop */}
      <div className="h-20 md:h-0"></div>

      {/* Mobile Bottom Tab Navigation */}
      <BottomNav />

      {/* Onboarding de rol laboral (primer arranque) */}
      {!isHydrating && <RoleSelectionModal />}
    </div>
  );
};

export default function App() {
  // reducedMotion="user": Framer Motion respeta prefers-reduced-motion.
  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <AppContent />
      </HashRouter>
    </MotionConfig>
  );
}
