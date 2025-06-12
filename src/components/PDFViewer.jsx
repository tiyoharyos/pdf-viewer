import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";
import "bootstrap/dist/css/bootstrap.min.css";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const PDF_URL = "https://api.nextbv.app/v1/files/e2a5032e-ca35-4993-979a-5007f0546578/content";

function PDFViewer() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [pdf, setPdf] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const fetchPdf = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(PDF_URL);
        const loadedPdf = await loadingTask.promise;
        setPdf(loadedPdf);
        setLoading(false);
      } catch (err) {
        setError(`Failed to load PDF: ${err}`);
        setLoading(false);
      }
    };
    fetchPdf();
  }, []);

  useEffect(() => {
    if (pdf) {
      renderPage(pageNumber);
    }
  }, [pdf, pageNumber, scale, rotation, searchTerm]);

  const renderPage = async (num) => {
    if (renderTaskRef.current) renderTaskRef.current.cancel();

    const page = await pdf.getPage(num);
    const viewport = page.getViewport({ scale, rotation });
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Set background for dark mode
    context.fillStyle = isDarkMode ? "#1e1e1e" : "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);

    const renderContext = { canvasContext: context, viewport };
    renderTaskRef.current = page.render(renderContext);

    try {
      await renderTaskRef.current.promise;
    } catch (err) {
      if (err?.name !== "RenderingCancelledException") {
        console.error("Render error:", err);
      }
      return;
    }

    if (searchTerm) {
      const textContent = await page.getTextContent();
      context.save();
      context.fillStyle = "rgba(255, 255, 0, 0.4)";
      for (const item of textContent.items) {
        if (item.str.toLowerCase().includes(searchTerm.toLowerCase())) {
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const x = tx[4];
          const y = tx[5];
          const width = item.width * scale;
          const height = item.height ? item.height * scale : 10;
          context.fillRect(x, canvas.height - y, width, height);
        }
      }
      context.restore();
    }
  };

  const handleMouseDown = (e) => {
    const container = containerRef.current;
    const startX = e.clientX;
    const startY = e.clientY;
    const scrollLeft = container.scrollLeft;
    const scrollTop = container.scrollTop;

    const onMouseMove = (moveEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      container.scrollLeft = scrollLeft - dx;
      container.scrollTop = scrollTop - dy;
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
  const zoomIn = () => setScale((prev) => prev + 0.2);
  const zoomOut = () => setScale((prev) => Math.max(0.4, prev - 0.2));
  const resetZoom = () => setScale(1.2);
  const rotateRight = () => setRotation((prev) => (prev + 90) % 360);
  const rotateLeft = () => setRotation((prev) => (prev - 90 + 360) % 360);

  const handleSearch = () => renderPage(pageNumber);

  if (loading) return <p className="text-center mt-5">Loading PDF...</p>;
  if (error) return <p className="text-danger">{error}</p>;

  return (
    <div className={`py-4 px-3 ${isDarkMode ? "bg-dark text-light" : "bg-light text-dark"}`} style={{ minHeight: "100vh" }}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h4 className="mb-0">PDF Viewer</h4>
          <button onClick={toggleDarkMode} className="btn btn-outline-secondary">
            {isDarkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
        </div>

        <div className="row g-2 align-items-center mb-3">
          <div className="col-md-8">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari teks dalam halaman..."
              className="form-control"
            />
          </div>
          <div className="col-md-4 text-end">
            <button className="btn btn-success w-100" onClick={handleSearch}>🔍 Cari</button>
          </div>
        </div>

        <div className="d-flex flex-wrap justify-content-center gap-2 mb-3">
          <button onClick={zoomOut} className="btn btn-secondary">-</button>
          <button onClick={resetZoom} className="btn btn-secondary">Reset</button>
          <button onClick={zoomIn} className="btn btn-secondary">+</button>
          <button onClick={rotateLeft} className="btn btn-warning">⟲</button>
          <button onClick={rotateRight} className="btn btn-warning">⟳</button>
        </div>

        <div
          className="border rounded p-2 mb-3"
          style={{ maxHeight: "80vh", overflow: "auto", backgroundColor: isDarkMode ? "#333" : "#f8f9fa" }}
          ref={containerRef}
          onMouseDown={handleMouseDown}
        >
          <canvas ref={canvasRef} className="d-block mx-auto my-2" />
        </div>

        <div className="d-flex justify-content-between align-items-center">
          <button onClick={() => setPageNumber((p) => Math.max(1, p - 1))} className="btn btn-outline-primary">
            &laquo; Prev
          </button>
          <span>Halaman {pageNumber} dari {pdf.numPages}</span>
          <button onClick={() => setPageNumber((p) => Math.min(pdf.numPages, p + 1))} className="btn btn-outline-primary">
            Next &raquo;
          </button>
        </div>
      </div>
    </div>
  );
}

export default PDFViewer;
