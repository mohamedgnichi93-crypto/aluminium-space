import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Layout from './components/layout/Layout';
import { useTranslation } from 'react-i18next';
import { lazy, Suspense, useEffect } from 'react';
import { AIAgentProvider, useAIAgentContext, type Lang } from './context/AIAgentContext';
import AIAgent from './components/ai/AIAgent';
import { loadSettings } from './store/settingsStore';

const Home = lazy(() => import('./pages/Home'));
const Products = lazy(() => import('./pages/Products'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Contact = lazy(() => import('./pages/Contact'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const About = lazy(() => import('./pages/About'));
const NotFound = lazy(() => import('./pages/NotFound'));
const ClientPortal = lazy(() => import('./pages/ClientPortal'));

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Layout />}>
          <Route index element={<motion.div {...pageVariants} initial="initial" animate="animate" exit="exit"><Home /></motion.div>} />
          <Route path="produits" element={<motion.div {...pageVariants} initial="initial" animate="animate" exit="exit"><Products /></motion.div>} />
          <Route path="produits/:id" element={<motion.div {...pageVariants} initial="initial" animate="animate" exit="exit"><ProductDetail /></motion.div>} />
          <Route path="contact" element={<motion.div {...pageVariants} initial="initial" animate="animate" exit="exit"><Contact /></motion.div>} />
          <Route path="about" element={<motion.div {...pageVariants} initial="initial" animate="animate" exit="exit"><About /></motion.div>} />
          <Route path="dashboard" element={<motion.div {...pageVariants} initial="initial" animate="animate" exit="exit"><Dashboard /></motion.div>} />
          <Route path="dashbord" element={<Navigate to="/dashboard" replace />} />
          <Route path="admin" element={<Navigate to="/dashboard" replace />} />
          <Route path="devis" element={<Navigate to="/produits" replace />} />
          <Route path="mon-espace" element={<motion.div {...pageVariants} initial="initial" animate="animate" exit="exit"><ClientPortal /></motion.div>} />
          <Route path="*" element={<motion.div {...pageVariants} initial="initial" animate="animate" exit="exit"><NotFound /></motion.div>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}

function AppContent() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/');
  const { i18n } = useTranslation();
  const { setLanguage } = useAIAgentContext();

  useEffect(() => {
    setLanguage(i18n.language as Lang);
  }, [i18n.language, setLanguage]);

  return (
    <>
      <Suspense fallback={
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0d1b2a',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #81C063',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
        </div>
      }>
        <AnimatedRoutes />
      </Suspense>
      {!isDashboard && <AIAgent />}
    </>
  );
}

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    const dir = ['ar', 'tn'].includes(i18n.language) ? 'rtl' : 'ltr';
    document.documentElement.dir = dir;
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    loadSettings(); // load business settings once at app start
  }, []);

  return (
    <Router>
      <AIAgentProvider>
        <AppContent />
      </AIAgentProvider>
    </Router>
  );
}

export default App;
