import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CompareProvider } from './context/CompareContext';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import SearchPage from './pages/SearchPage/SearchPage';
import HomePage from './pages/HomePage/HomePage';
import CarDetailsPage from './pages/CarDetailsPage/CarDetailsPage';
import ComparePage from './pages/ComparePage/ComparePage';
import NewsFeedPage from './pages/NewsFeedPage/NewsFeedPage';
import RecommendPage from './pages/RecommendPage/RecommendPage';

export default function App() {
  return (
    <BrowserRouter>
      <CompareProvider>
        <Navbar />
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/cars" element={<HomePage />} />
          <Route path="/car/:id" element={<CarDetailsPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/news" element={<NewsFeedPage />} />
          <Route path="/recommend" element={<RecommendPage />} />
        </Routes>
        <Footer />
      </CompareProvider>
    </BrowserRouter>
  );
}