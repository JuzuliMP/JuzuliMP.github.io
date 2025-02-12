"use client"

import { Dialog, DialogContent, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, X } from "lucide-react"
import { useState } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import "react-pdf/dist/esm/Page/AnnotationLayer.css"
import "react-pdf/dist/esm/Page/TextLayer.css"
import dynamic from 'next/dynamic'

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`

interface PDFViewerProps {
  isOpen: boolean
  onClose: () => void
  file: string
  title?: string
  maxWidth?: string
  scale?: number
  showDownload?: boolean
  fileName?: string
}

const PDFViewer = dynamic(() => import('react-pdf').then(mod => mod.Document), {
  ssr: false,
  loading: () => <p>Loading PDF...</p>
});

const PDFViewerComponent = ({ 
  isOpen, 
  onClose, 
  file,
  title,
  maxWidth = "max-w-3xl",
  scale = 1.2,
  showDownload = false,
  fileName
}: PDFViewerProps) => {
  const [numPages, setNumPages] = useState<number>(0)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setLoading(false)
    setError(null)
    setNumPages(numPages)
  }

  function onDocumentLoadError(error: Error) {
    setLoading(false)
    setError(error)
    console.error('PDF Error:', error)
  }

  const handleDownload = async () => {
    try {
      const response = await fetch(file)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName || 'document.pdf'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
    }
  }

  return (
    <Dialog open={isOpen} modal>
      <DialogPortal>
        <DialogOverlay className="bg-black/80" />
        <DialogContent 
          className={`${maxWidth} max-h-[90vh] overflow-y-auto`}
        >
          <div className="flex items-center justify-between mb-4">
            {title && (
              <div className="text-lg font-semibold text-center flex-grow">
                {title}
              </div>
            )}
            <div className="flex items-center gap-2">
              {showDownload && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="h-8 w-8"
                  aria-label="Download PDF"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {loading && (
            <div className="flex items-center justify-center p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading PDF...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="text-center text-red-500 p-4">
              <p>Error loading PDF. Please try again later.</p>
              <p className="text-sm mt-2">{error.message}</p>
            </div>
          )}

          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            }
            className="flex flex-col items-center"
          >
            {Array.from(new Array(numPages), (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                className="mb-4"
                scale={scale}
                loading={
                  <div className="flex items-center justify-center h-[500px] w-full border rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                }
              />
            ))}
          </Document>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  )
}

export default PDFViewerComponent 