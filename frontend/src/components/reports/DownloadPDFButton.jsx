import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '../common/Button';
import { downloadInterviewReportPdf } from '../../services/interviewService';

export const DownloadPDFButton = ({ sessionId, reportTitle }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (sessionId) {
      setIsDownloading(true);
      try {
        const filename = `InterviewIQ_Report_${reportTitle ? reportTitle.replace(/\s+/g, '_') : 'Assessment'}_${sessionId.slice(0, 8)}.pdf`;
        await downloadInterviewReportPdf(sessionId, filename);
        return;
      } catch (e) {
        console.warn('Backend PDF download error, falling back to window.print:', e);
      } finally {
        setIsDownloading(false);
      }
    }
    window.print();
  };

  return (
    <Button
      variant="outline"
      size="md"
      onClick={handleDownload}
      disabled={isDownloading}
      icon={isDownloading ? Loader2 : Download}
      className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold"
    >
      {isDownloading ? 'Generating PDF...' : 'Download PDF Report'}
    </Button>
  );
};
