import React from 'react';
import { Download, Printer } from 'lucide-react';
import { Button } from '../common/Button';

export const DownloadPDFButton = ({ reportTitle }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <Button
      variant="outline"
      size="md"
      onClick={handlePrint}
      icon={Download}
      className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 font-bold"
    >
      Download PDF Report
    </Button>
  );
};
