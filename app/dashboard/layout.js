import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

/**
 * Shared layout for all /dashboard/* pages.
 * Provides Navbar + Footer so individual pages don't repeat them.
 */
export default function DashboardLayout({ children }) {
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-surface pt-24 pb-16">
        {children}
      </div>
      <Footer />
    </>
  );
}
