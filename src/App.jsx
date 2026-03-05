import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CompareProvider } from './context/CompareContext';
import { ThemeProvider } from './context/ThemeContext';
import ScrollRestoration from './components/ScrollRestoration/ScrollRestoration';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import PageTransition from './components/PageTransition/PageTransition';
import SearchPage from './pages/SearchPage/SearchPage';
import HomePage from './pages/HomePage/HomePage';
import CarDetailsPage from './pages/CarDetailsPage/CarDetailsPage';
import ComparePage from './pages/ComparePage/ComparePage';
import NewsFeedPage from './pages/NewsFeedPage/NewsFeedPage';
import RecommendPage from './pages/RecommendPage/RecommendPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import CatalogPage from './pages/CatalogPage/CatalogPage';
import AuthModal from './pages/Auth/AuthModal';
import NewsArticlePage from './pages/NewsArticlePage/NewsArticlePage';
import AnalyticsTracker from './components/AnalyticsTracker/AnalyticsTracker';
import AdminConsole from './pages/AdminConsole/AdminConsole';
import FloatingCompareBar from './components/FloatingCompareBar/FloatingCompareBar';

function GlobalAuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  return <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />;
}

export default function App() {
  useEffect(() => {
    console.log(
      "%c 🏎️ TorqueX Autos System Status: FULL THROTTLE ",
      "background: #e74c3c; color: white; font-weight: bold; border-radius: 4px; padding: 4px 8px;"
    );
    console.log(
      "%cWelcome to the cockpit. If you're reading this, you're either a dev or someone who really cares about specs. Type 'gear_shift()' for a quick laugh.",
      "color: #7f8c8d; font-style: italic;"
    );
    console.log(
      "    ____\n" +
      " __/  |_\\_\n" +
      "|  _     _``-.\n" +
      "'-(_)---(_)--'"
    );

    window.gear_shift = () => {
      const jokes = [
        "Why did the car get a ticket? It was speeding through its mid-life crisis.",
        "What kind of car does a snake drive? A Honda C-S-S-S-S-S-S-S-S-S-S.",
        "I told my car I needed a break. Now its transmission is slipping.",
        "What do you call a Ford Fiesta that ran out of gas? A Ford Siesta.",
        "My wife told me to stop impersonating a car. I told her I'd 'exhaust' all my options first."
      ];
      console.log(`%c ⚙️ ${jokes[Math.floor(Math.random() * jokes.length)]}`, "color: #e67e22; font-weight: bold;");
      return "Gears shifted.";
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <CompareProvider>
            <Navbar />
            <AnalyticsTracker />
            <ScrollRestoration />
            <PageTransition>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/cars" element={<CatalogPage />} />
                <Route path="/search" element={<SearchPage />} />
                <Route path="/car/:id" element={<CarDetailsPage />} />
                <Route path="/compare" element={<ComparePage />} />
                <Route path="/news" element={<NewsFeedPage />} />
                <Route path="/news/article/:id" element={<NewsArticlePage />} />
                <Route path="/recommend" element={<RecommendPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminConsole />} />
              </Routes>
            </PageTransition>
            <GlobalAuthModal />
            <FloatingCompareBar />
            <Footer />
          </CompareProvider>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
