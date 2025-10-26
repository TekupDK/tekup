import { useState } from "react";

import TekUp2025Navigation from "./TekUp2025Navigation";
import TekUp2025Hero from "./TekUp2025Hero";
import TekUp2025Dashboard from "./TekUp2025Dashboard";
import TekUp2025Footer from "./TekUp2025Footer";

const TekUp2025Complete = () => {
  const [currentPage, setCurrentPage] = useState('home');

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <TekUp2025Dashboard />;
      case 'home':
      default:
        return <TekUp2025Hero />;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--surface-base)] text-white">
      {/* Navigation */}
      <TekUp2025Navigation 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
      />

      {/* Main Content */}
      <main className="relative">
        {renderCurrentPage()}
      </main>

      {/* Footer */}
      <TekUp2025Footer />
    </div>
  );
};

export default TekUp2025Complete;