import { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Doc {
  url: string;
  document_type: string;
}

interface DocumentViewerProps {
  doc: Doc;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export function DocumentViewer({ doc, open, onOpenChange, onRefresh }: DocumentViewerProps) {
  useEffect(() => {
    if (open) {
      onRefresh();
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{doc.document_type}</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[80vh]">
          <img
            src={doc.url}
            alt={doc.document_type}
            className="w-full object-contain"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
