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

const isPDFValid = (data: ArrayBuffer): { ok: boolean, error: string } => {
    try {
        // Ensure we have enough data
        if (!data || data.byteLength < 5) {
            console.debug('[PDFViewer] Invalid PDF: Data too short', {
                length: data?.byteLength
            });
            return { ok: false, error: 'Data too short' };
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

        return { ok: isValid, error: isValid ? '' : 'Invalid PDF header' };
    } catch (err) {
        console.error('[PDFViewer] PDF validation error:', err);
        return { ok: false, error: 'Error validating PDF' };
    }
};

export default function PDFViewer({ file, scaleDefault = 1.5, isDemo = false }: PDFViewerProps) {
    const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState(1);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [scale, setScale] = useState(scaleDefault);
    const [isDownloading, setIsDownloading] = useState(false);
    const MIN_SCALE = 0.5;
    const MAX_SCALE = 3;
    const containerRef = useRef<HTMLDivElement>(null);

    // Memoize the file object to prevent unnecessary rerenders
    const memoizedFile = useMemo(() =>
        pdfData ? { data: pdfData, cacheKey: file } : undefined
        , [pdfData, file]);

    // Generate a user-friendly filename if not provided
    const downloadFileName = useMemo(() => {
        // Extract filename from blob path or use generic name
        const blobName = file.split('/').pop();
        if (blobName) return blobName.endsWith('.pdf') ? blobName : `${blobName}.pdf`;

        return 'document.pdf';
    }, [file]);

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
                `${containerWidth / 2 + 1}px` : '1rem'
        };
    }, []);

    const handleDownload = useCallback(async () => {
        // Add more detailed debug logs to diagnose the issue
        console.debug('[PDFViewer] Download requested:', {
            pdfDataExists: !!pdfData,
            pdfDataType: pdfData ? typeof pdfData : 'null',
            pdfDataByteLength: pdfData?.byteLength
        });

        if (!pdfData) {
            console.error('[PDFViewer] No PDF data available for download');
            alert('PDF data is not available. Try reloading the page.');
            return;
        }

        if (isDownloading) {
            console.warn('[PDFViewer] Download already in progress');
            return;
        }

        try {
            setIsDownloading(true);

            // Log the PDF data details before validation
            console.debug('[PDFViewer] Preparing to download PDF:', {
                dataAvailable: !!pdfData,
                byteLength: pdfData.byteLength,
                isArrayBuffer: pdfData instanceof ArrayBuffer
            });

            if (!pdfData || pdfData.byteLength === 0) {
                // Try to reload the PDF data if it's empty
                if (file) {
                    console.log('[PDFViewer] Attempting to reload PDF data before download');
                    try {
                        // Check cache first
                        const cachedData = await pdfCache.get(file);
                        if (cachedData && cachedData.byteLength > 0) {
                            console.debug('[PDFViewer] Successfully retrieved data from cache for download');
                            await downloadPDF(cachedData);
                            return;
                        }
                    } catch (err) {
                        console.error('[PDFViewer] Error retrieving from cache:', err);
                    }
                }
                throw new Error('PDF data is empty or undefined');
            }

            await downloadPDF(pdfData);
        } catch (err) {
            console.error('[PDFViewer] Download error:', err);
            alert('Failed to download PDF: ' + (err instanceof Error ? err.message : 'Unknown error'));
        } finally {
            setIsDownloading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pdfData, isDownloading, file]);

    // Helper function to handle the actual PDF download
    const downloadPDF = useCallback(async (data: ArrayBuffer) => {
        const pdfValidation = isPDFValid(data);
        if (!pdfValidation.ok) {
            console.error('[PDFViewer] Invalid PDF data, cannot download: ', pdfValidation.error);
            throw new Error(`Invalid PDF data: ${pdfValidation.error}`);
        }

        // Create a blob from the PDF data
        const blob = new Blob([data], { type: 'application/pdf' });

        console.debug('[PDFViewer] Created blob for download:', {
            size: blob.size,
            type: blob.type
        });

        // Create a download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadFileName;

        // Trigger download
        document.body.appendChild(link);
        link.click();

        // Cleanup
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }, [downloadFileName]);

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
                    const pdfValidation = isPDFValid(cachedData);
                    if (pdfValidation.ok) {
                        console.debug('[PDFViewer] Cache hit:', file);
                        setPdfData(cachedData);
                        setIsLoading(false);
                        return;
                    } else {
                        console.debug('[PDFViewer] Invalid cached PDF, fetching from server:', file, pdfValidation.error);
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

                const pdfValidation = isPDFValid(data);
                if (!pdfValidation.ok) {
                    throw new Error(`Invalid PDF data received ${pdfValidation.error}`);
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
                <Button
                    onClick={handleDownload}
                    disabled={isDownloading || !pdfData}
                >
                    {isDownloading ? 'Downloading...' : 'Download PDF'}
                </Button>
            </div>
        </div>
    );
}