const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">Siden blev ikke fundet</h2>
        <p className="text-gray-400 mb-8">
          Den side du leder efter eksisterer ikke eller er blevet flyttet.
        </p>
        <a href="/" className="btn btn-primary px-6 py-3">
          Gå til forsiden
        </a>
      </div>
    </div>
  );
};

export default NotFound;