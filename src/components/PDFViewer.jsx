import { useEffect, useRef, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

function PDFViewer() {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [pdfInstance, setPdfInstance] = useState(null);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);

  const PDF_URL = "https://api.nextbv.app/v1/files/e2a5032e-ca35-4993-979a-5007f0546578/content";

  useEffect(() => {
    // Load PDF.js from CDN
    const loadPDFJS = async () => {
      try {
        // Load PDF.js library
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
          // Set worker
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          loadPDF();
        };
        script.onerror = () => {
          setError("Failed to load PDF.js library");
          setLoading(false);
        };
        document.head.appendChild(script);
      } catch (err) {
        setError(`Error loading PDF.js: ${err.message}`);
        setLoading(false);
      }
    };

    const loadPDF = async () => {
      try {
        const loadingTask = window.pdfjsLib.getDocument(PDF_URL);
        const pdf = await loadingTask.promise;
        setPdfInstance(pdf);
        // Wait a bit for refs to be ready
        setTimeout(() => renderAllPages(pdf), 100);
        setLoading(false);
      } catch (err) {
        setError(`Failed to load PDF: ${err.message}`);
        setLoading(false);
      }
    };

    loadPDFJS();
  }, []);

  const renderAllPages = async (pdf) => {
    const container = viewerRef.current;
    if (!container) return;
    
    container.innerHTML = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale, rotation });

      // Create canvas for each page
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      canvas.className = 'pdf-page mb-3 d-block mx-auto border';
      canvas.style.backgroundColor = isDarkMode ? '#1e1e1e' : '#ffffff';
      canvas.dataset.pageNumber = pageNum;

      // Create page container
      const pageContainer = document.createElement('div');
      pageContainer.className = 'page-container position-relative';
      pageContainer.appendChild(canvas);

      // Add page number label
      const pageLabel = document.createElement('div');
      pageLabel.className = 'position-absolute top-0 start-0 bg-primary text-white px-2 py-1 small';
      pageLabel.style.zIndex = '10';
      pageLabel.textContent = `Hal. ${pageNum}`;
      pageContainer.appendChild(pageLabel);

      container.appendChild(pageContainer);

      // Render page
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      await page.render(renderContext).promise;
    }
  };

  const performSearch = async (term) => {
    if (!pdfInstance || !term.trim()) {
      setSearchResults([]);
      setCurrentMatch(0);
      clearHighlights();
      return;
    }

    setIsSearching(true);
    const results = [];
    const searchTermLower = term.toLowerCase();

    try {
      // Clear previous highlights
      clearHighlights();

      // Search through all pages
      for (let pageNum = 1; pageNum <= pdfInstance.numPages; pageNum++) {
        const page = await pdfInstance.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        textContent.items.forEach((item, index) => {
          const itemText = item.str;
          let searchIndex = 0;
          let matchIndex = itemText.toLowerCase().indexOf(searchTermLower, searchIndex);
          
          while (matchIndex !== -1) {
            results.push({
              pageNum,
              itemIndex: index,
              textItem: item,
              matchStart: matchIndex,
              matchEnd: matchIndex + searchTermLower.length,
              text: itemText.substring(matchIndex, matchIndex + searchTermLower.length)
            });
            
            searchIndex = matchIndex + 1;
            matchIndex = itemText.toLowerCase().indexOf(searchTermLower, searchIndex);
          }
        });
      }
      
      setSearchResults(results);
      setCurrentMatch(results.length > 0 ? 1 : 0);
      
      // Highlight results
      if (results.length > 0) {
        highlightResults(results);
        scrollToMatch(results[0]);
      }
      
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const highlightResults = (results) => {
    results.forEach((result, index) => {
      const canvas = document.querySelector(`canvas[data-page-number="${result.pageNum}"]`);
      if (canvas) {
        const context = canvas.getContext('2d');
        const isCurrentMatch = index === (currentMatch - 1);
        
        context.save();
        context.fillStyle = isCurrentMatch ? "rgba(255, 165, 0, 0.6)" : "rgba(255, 255, 0, 0.4)";
        
        const item = result.textItem;
        const x = item.transform[4] * scale;
        const y = canvas.height - (item.transform[5] * scale);
        const width = (item.width / item.str.length) * (result.matchEnd - result.matchStart) * scale;
        const height = item.height ? item.height * scale : 12;
        
        context.fillRect(x + (result.matchStart * item.width / item.str.length * scale), y - height, width, height);
        context.restore();
      }
    });
  };

  const clearHighlights = () => {
    if (pdfInstance && viewerRef.current) {
      renderAllPages(pdfInstance);
    }
  };

  const scrollToMatch = (match) => {
    const canvas = document.querySelector(`canvas[data-page-number="${match.pageNum}"]`);
    if (canvas) {
      canvas.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const navigateMatch = (direction) => {
    if (searchResults.length === 0) return;
    
    let newMatch = currentMatch + direction;
    if (newMatch < 1) newMatch = searchResults.length;
    if (newMatch > searchResults.length) newMatch = 1;
    
    setCurrentMatch(newMatch);
    const targetResult = searchResults[newMatch - 1];
    
    // Re-highlight with new current match
    highlightResults(searchResults);
    scrollToMatch(targetResult);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    performSearch(searchTerm);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (pdfInstance && viewerRef.current) {
      setTimeout(() => renderAllPages(pdfInstance), 200);
    }
  };

  const zoomIn = () => {
    const newScale = Math.min(3.0, scale + 0.2);
    setScale(newScale);
    if (pdfInstance && viewerRef.current) {
      setTimeout(() => renderAllPages(pdfInstance), 100);
    }
  };

  const zoomOut = () => {
    const newScale = Math.max(0.4, scale - 0.2);
    setScale(newScale);
    if (pdfInstance && viewerRef.current) {
      setTimeout(() => renderAllPages(pdfInstance), 100);
    }
  };

  const resetZoom = () => {
    setScale(1.2);
    setRotation(0);
    if (pdfInstance && viewerRef.current) {
      setTimeout(() => renderAllPages(pdfInstance), 100);
    }
  };

  const rotateRight = () => {
    const newRotation = (rotation + 90) % 360;
    setRotation(newRotation);
    if (pdfInstance && viewerRef.current) {
      setTimeout(() => renderAllPages(pdfInstance), 100);
    }
  };

  const rotateLeft = () => {
    const newRotation = (rotation - 90 + 360) % 360;
    setRotation(newRotation);
    if (pdfInstance && viewerRef.current) {
      setTimeout(() => renderAllPages(pdfInstance), 100);
    }
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p>Loading PDF...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
      <div className="alert alert-danger text-center">
        <h5>Error</h5>
        <p>{error}</p>
      </div>
    </div>
  );

  return (
    <div className={`py-4 px-3 ${isDarkMode ? "bg-dark text-light" : "bg-light text-dark"}`} style={{ minHeight: "100vh" }}>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">PDF Viewer</h4>
          <button onClick={toggleDarkMode} className="btn btn-outline-secondary">
            {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        {/* Zoom and Rotate Controls */}
        <div className="d-flex flex-wrap justify-content-center gap-2 mb-3">
          <button onClick={zoomOut} className="btn btn-secondary" title="Zoom Out">
            🔍− Zoom Out
          </button>
          <button onClick={resetZoom} className="btn btn-secondary" title="Reset Zoom & Rotation">
            🎯 Reset ({Math.round(scale * 100)}%, {rotation}°)
          </button>
          <button onClick={zoomIn} className="btn btn-secondary" title="Zoom In">
            🔍+ Zoom In
          </button>
          <button onClick={rotateLeft} className="btn btn-warning" title="Rotate Left">
            ⟲ Putar Kiri
          </button>
          <button onClick={rotateRight} className="btn btn-warning" title="Rotate Right">
            ⟳ Putar Kanan
          </button>
        </div>

        {/* Enhanced Search Bar */}
        <div className="row g-2 align-items-center mb-4">
          <div className="col-md-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
              placeholder="Cari teks dalam PDF..."
              className="form-control"
            />
          </div>
          <div className="col-md-2">
            <button onClick={handleSearchSubmit} className="btn btn-success w-100" disabled={isSearching}>
              {isSearching ? "⏳" : "🔍"} Cari
            </button>
          </div>
          <div className="col-md-4">
            {searchResults.length > 0 && (
              <div className="d-flex align-items-center gap-2">
                <small className="text-muted">
                  {currentMatch}/{searchResults.length} hasil
                </small>
                <button 
                  onClick={() => navigateMatch(-1)} 
                  className="btn btn-sm btn-outline-primary"
                  disabled={searchResults.length === 0}
                >
                  ↑
                </button>
                <button 
                  onClick={() => navigateMatch(1)} 
                  className="btn btn-sm btn-outline-primary"
                  disabled={searchResults.length === 0}
                >
                  ↓
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PDF Viewer Container */}
        <div
          className="border rounded p-3"
          style={{ 
            maxHeight: "80vh", 
            overflow: "auto", 
            backgroundColor: isDarkMode ? "#333" : "#f8f9fa" 
          }}
          ref={containerRef}
        >
          <div ref={viewerRef} className="pdf-viewer"></div>
        </div>

        {/* Info */}
        <div className="text-center mt-3">
          <small className="text-muted">
            {pdfInstance && `Total ${pdfInstance.numPages} halaman`}
            {searchResults.length > 0 && ` • ${searchResults.length} hasil pencarian ditemukan`}
          </small>
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;