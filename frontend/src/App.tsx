import { BrowserRouter, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import WallPage from "./pages/WallPage";
import ExplorePage from "./pages/ExplorePage";
import HowItWorksPage from "./pages/HowItWorksPage";
import OnchainPage from "./pages/OnchainPage";
import AboutPage from "./pages/AboutPage";
import MyBlocksPage from "./pages/MyBlocksPage";
import FaqPage from "./pages/FaqPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-graphite text-ink">
        <Header />
        <Routes>
          <Route path="/" element={<WallPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/onchain" element={<OnchainPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/my-blocks" element={<MyBlocksPage />} />
          <Route path="/faq" element={<FaqPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
