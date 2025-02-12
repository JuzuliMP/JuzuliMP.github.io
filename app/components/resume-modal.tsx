"use client"

import PDFViewer from "./pdf-viewer"

interface ResumeModalProps {
  isOpen: boolean
  onClose: () => void
}

const ResumeModal = ({ isOpen, onClose }: ResumeModalProps) => {
  return (
    <PDFViewer
      isOpen={isOpen}
      onClose={onClose}
      file="/docs/resume.pdf"
      title="Resume"
      showDownload={true}
      fileName="mohammed_juzuli_resume.pdf"
    />
  )
}

export default ResumeModal 