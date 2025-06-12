import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.js?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

const PDF_URL =
  "https://api.nextbv.app/v1/files/e2a5032e-ca35-4993-979a-5007f0546578/content";

function PDFViewer() {
  const canvasRef = useRef(null);
  const [pdf, setPdf] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
  }, [pdf, pageNumber, scale]);

  const renderPage = async (num) => {
    const page = await pdf.getPage(num);
    const viewport = page.getViewport({ scale });
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
  };

  const nextPage = () => {
    if (pageNumber < pdf.numPages) {
      setPageNumber(pageNumber + 1);
    }
  };

  const prevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  const zoomIn = () => setScale(scale + 0.2);
  const zoomOut = () => setScale(Math.max(0.4, scale - 0.2));
  const resetZoom = () => setScale(1.2);

  if (loading) return <p>Loading PDF...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 justify-center">
        <button onClick={prevPage} className="px-4 py-2 bg-blue-500 text-white rounded">Prev</button>
        <span>Page {pageNumber} / {pdf.numPages}</span>
        <button onClick={nextPage} className="px-4 py-2 bg-blue-500 text-white rounded">Next</button>
      </div>

      <div className="flex gap-2 justify-center">
        <button onClick={zoomOut} className="px-3 py-1 bg-gray-300 rounded">-</button>
        <button onClick={resetZoom} className="px-3 py-1 bg-gray-300 rounded">Reset</button>
        <button onClick={zoomIn} className="px-3 py-1 bg-gray-300 rounded">+</button>
      </div>

      <div className="flex justify-center">
        <canvas ref={canvasRef} className="border shadow-md" />
      </div>
    </div>
  );
}

export default PDFViewer;
