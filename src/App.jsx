import { useState } from "react";
import PDFViewer from "./components/PDFViewer";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-dark text-light" : "bg-gray-100 text-dark"} p-4`}>
      <div className="container-fluid mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="mb-0">PDF Viewer</h4>
          <button onClick={toggleDarkMode} className="btn btn-outline-secondary">
            {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>
      </div>

      <PDFViewer isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
    </div>
  );
}

export default App;
