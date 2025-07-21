
import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFViewerProps {
  filePath: string;
  fileName: string;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

export function PDFViewer({ 
  filePath, 
  fileName, 
  onPageChange, 
  currentPage = 1, 
  zoom = 1,
  onZoomChange 
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState(currentPage);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState(zoom);
  const { toast } = useToast();

  useEffect(() => {
    loadPdfFromStorage();
  }, [filePath]);

  useEffect(() => {
    setPageNumber(currentPage);
  }, [currentPage]);

  useEffect(() => {
    setScale(zoom);
  }, [zoom]);

  const loadPdfFromStorage = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) {
        throw error;
      }

      const url = URL.createObjectURL(data);
      setPdfUrl(url);
    } catch (err: any) {
      console.error('Error loading PDF:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to load PDF document",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF document');
    toast({
      title: "Error",
      description: "Failed to load PDF document",
      variant: "destructive",
    });
  };

  const goToPrevPage = () => {
    const newPage = Math.max(pageNumber - 1, 1);
    setPageNumber(newPage);
    onPageChange?.(newPage);
  };

  const goToNextPage = () => {
    const newPage = Math.min(pageNumber + 1, numPages);
    setPageNumber(newPage);
    onPageChange?.(newPage);
  };

  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.25, 3);
    setScale(newScale);
    onZoomChange?.(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.25, 0.5);
    setScale(newScale);
    onZoomChange?.(newScale);
  };

  const downloadPdf = async () => {
    if (!pdfUrl) return;
    
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = fileName;
    a.click();
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading PDF...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={loadPdfFromStorage} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* PDF Controls */}
        <div className="flex items-center justify-between mb-4 p-2 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Page {pageNumber} of {numPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm">{Math.round(scale * 100)}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 3}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadPdf}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* PDF Document */}
        <div className="border rounded-lg bg-white overflow-auto max-h-96">
          {pdfUrl && (
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading PDF...</span>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
