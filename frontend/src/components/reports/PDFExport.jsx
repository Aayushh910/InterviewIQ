import React from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '../common/Button';

export const PDFExport = () => {
  const handleExport = () => {
    window.print();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      icon={Download}
      iconPosition="left"
      onClick={handleExport}
    >
      Export Diagnostic PDF
    </Button>
  );
};
