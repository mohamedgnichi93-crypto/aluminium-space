import { Outlet, useLocation } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import ToastContainer from '../ui/Toast';
import { useToast } from '../../hooks/useToast';

const Layout = () => {
  const { toasts, removeToast } = useToast();
  const location = useLocation();
  
  // Robust check for dashboard path
  const isDashboard = location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/');

  // Scroll progress (only on non-dashboard)
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {/* Scroll Progress Bar - Hide on dashboard */}
      {!isDashboard && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-[3px] z-[9999] origin-left"
          style={{
            scaleX,
            background: 'var(--accent-blue)',
          }}
        />
      )}

      {!isDashboard && <Header />}

      <main className={`flex-grow ${!isDashboard ? 'pt-[70px]' : ''}`}>
        <Outlet />
      </main>

      {!isDashboard && <Footer />}

      {/* Sticky mobile CTA — removed to fix mobile responsiveness (covered footer, overlapped AI agent) */}

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

    </div>
  );
};

export default Layout;
