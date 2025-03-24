"use client";
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Button from './Button';
import styles from './PDFViewer.module.css';
import { PDFCache } from '../services/pdfCache';

const pdfCache = new PDFCache();

if (typeof window !== 'undefined') {
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

const options = {
    cMapUrl: '/cmaps/',
    standardFontDataUrl: '/standard_fonts/',
};

interface PDFViewerProps {
    file: string;
    scaleDefault?: number;
    isDemo?: boolean;
}

const isPDFValid = (data: ArrayBuffer): boolean => {
    try {
        // Ensure we have enough data
        if (!data || data.byteLength < 5) {
            console.debug('[PDFViewer] Invalid PDF: Data too short', {
                length: data?.byteLength
            });
            return false;
        }

        // Check PDF magic number (%PDF-)
        const header = new Uint8Array(data.slice(0, 5));
        
        // Log the actual header bytes and their ASCII representation
        const headerBytes = Array.from(header);
        const headerAscii = String.fromCharCode(...headerBytes);
        console.debug('[PDFViewer] PDF header check:', {
            headerBytes,
            headerAscii,
            expected: '%PDF-',
            dataLength: data.byteLength
        });

        // Check if it's a valid PDF header
        const isValid = headerAscii === '%PDF-';
        
        if (!isValid) {
            console.debug('[PDFViewer] Invalid PDF header:', {
                expected: [0x25, 0x50, 0x44, 0x46, 0x2D],
                received: headerBytes
            });
        }

        return isValid;
    } catch (err) {
        console.error('[PDFViewer] PDF validation error:', err);
        return false;
    }
};

export default function PDFViewer({ file, scaleDefault =1.5, isDemo = false }: PDFViewerProps) {
    const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [scale, setScale] = useState(scaleDefault);
    const MIN_SCALE = 0.5;
    const MAX_SCALE = 3;
    const containerRef = useRef<HTMLDivElement>(null);

    // Memoize the file object to prevent unnecessary rerenders
    const memoizedFile = useMemo(() => 
        pdfData ? { data: pdfData, cacheKey: file } : undefined
    , [pdfData, file]);

    // Memoize handlers
    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setPageNumber(1); // Reset to first page when loading new document
        setError(null);
    }, []);

    const onDocumentLoadError = useCallback((error: Error) => {
        setError(error.message);
    }, []);

    const handleZoomIn = useCallback(() => {
        setScale(prev => Math.min(prev + 0.25, MAX_SCALE));
    }, []);

    const handleZoomOut = useCallback(() => {
        setScale(prev => Math.max(prev - 0.25, MIN_SCALE));
    }, []);

    const getZoomControlsStyle = useCallback(() => {
        if (!containerRef.current) return {};
        const containerWidth = containerRef.current.getBoundingClientRect().width;
        return {
            right: containerRef.current.closest(`.${styles.solution}`) ? 
                `${containerWidth/2 + 1}px` : '1rem'
        };
    }, []);

    // Fetch PDF data
    useEffect(() => {
        let isMounted = true;

        const fetchPDF = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                // Check cache first
                const cachedData = await pdfCache.get(file);
                if (cachedData && isMounted) {
                    if (isPDFValid(cachedData)) {
                        console.debug('[PDFViewer] Cache hit:', file);
                        setPdfData(cachedData);
                        setIsLoading(false);
                        return;
                    } else {
                        console.debug('[PDFViewer] Invalid cached PDF, fetching from server:', file);
                        await pdfCache.delete(file);
                    }
                }

                console.debug('[PDFViewer] Fetching from server:', file);
                
                // Use different endpoints based on demo mode
                const endpoint = isDemo ? '/api/demo-pdf-proxy' : '/api/generate-file-shared-key';
                const sasResponse = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ file }),
                });
                
                if (!sasResponse.ok) throw new Error('Failed to generate access token');
                const { downloadLink } = await sasResponse.json();

                const pdfResponse = await fetch('/api/proxy-pdf', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ url: downloadLink }),
                });

                if (!pdfResponse.ok) {
                    console.error('[PDFViewer] PDF fetch failed:', {
                        status: pdfResponse.status,
                        statusText: pdfResponse.statusText
                    });
                    throw new Error('Failed to fetch PDF');
                }

                // Check content type
                const contentType = pdfResponse.headers.get('content-type');
                if (!contentType?.includes('application/pdf') && !contentType?.includes('application/octet-stream')) {
                    console.error('[PDFViewer] Invalid content type:', contentType);
                    throw new Error('Invalid response type');
                }

                const data = await pdfResponse.arrayBuffer();
                console.debug('[PDFViewer] Received PDF data:', {
                    size: data.byteLength,
                    contentType
                });

                if (!isPDFValid(data)) {
                    throw new Error('Invalid PDF data received');
                }
                
                if (isMounted) {
                    await pdfCache.set(file, data);
                    setPdfData(data);
                }
            } catch (err) {
                if (isMounted) {
                    console.error('[PDFViewer] Error:', err);
                    setError(err instanceof Error ? err.message : 'Failed to load PDF');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        fetchPDF();

        return () => {
            isMounted = false;
        };
    }, [file, isDemo]);

    return (
        <div className={styles.container} ref={containerRef}>
            {isLoading ? (
                <div className={styles.loadingContainer}>
                    <p>Loading PDF...</p>
                </div>
            ) : error ? (
                <div className={styles.errorContainer}>
                    <p className={styles.errorMessage}>Failed to load PDF: {error}</p>
                </div>
            ) : (
                <>
                    <div className={styles.zoomControls} style={getZoomControlsStyle()}>
                        <Button onClick={handleZoomOut} disabled={scale <= MIN_SCALE}>-</Button>
                        <span>{Math.round(scale * 100)}%</span>
                        <Button onClick={handleZoomIn} disabled={scale >= MAX_SCALE}>+</Button>
                    </div>
                    <div className={styles.pdfWrapper}>
                    <Document
                        file={memoizedFile}
                        onLoadSuccess={onDocumentLoadSuccess}
                        onLoadError={onDocumentLoadError}
                        options={options}
                    >
                        <Page 
                            pageNumber={pageNumber} 
                            renderAnnotationLayer={false} 
                            renderTextLayer={false} 
                            scale={scale}
                        />
                    </Document>
                    </div>
                </>
            )}

            <div className={styles.controls}>
                <Button
                    onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                    disabled={pageNumber <= 1 || !!error}
                >
                    Previous
                </Button>
                <span>
                    Page {pageNumber} of {numPages || '--'}
                </span>
                <Button
                    onClick={() => setPageNumber(prev => Math.min(numPages || 1, prev + 1))}
                    disabled={pageNumber >= (numPages || 1) || !!error}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}