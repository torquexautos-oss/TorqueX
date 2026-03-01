import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CompareProvider } from './context/CompareContext';
import ScrollRestoration from './components/ScrollRestoration/ScrollRestoration';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import SearchPage from './pages/SearchPage/SearchPage';
import HomePage from './pages/HomePage/HomePage';
import CarDetailsPage from './pages/CarDetailsPage/CarDetailsPage';
import ComparePage from './pages/ComparePage/ComparePage';
import NewsFeedPage from './pages/NewsFeedPage/NewsFeedPage';
import RecommendPage from './pages/RecommendPage/RecommendPage';
import CatalogPage from './pages/CatalogPage/CatalogPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import AuthModal from './pages/Auth/AuthModal';
import NewsArticlePage from './pages/NewsArticlePage/NewsArticlePage';

function GlobalAuthModal() {
  const { isAuthModalOpen, closeAuthModal } = useAuth();
  return <AuthModal isOpen={isAuthModalOpen} onClose={closeAuthModal} />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <CompareProvider>
          <Navbar />
          <ScrollRestoration />
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
          </Routes>
          <GlobalAuthModal />
          <Footer />
        </CompareProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}