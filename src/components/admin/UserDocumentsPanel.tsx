import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useUserVerdict } from '@/hooks/useUserVerdict';
import { DocumentViewer } from './DocumentViewer';
import { RejectDialog } from './RejectDialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Doc {
  id: string;
  document_type: string;
  url: string;
  status: string;
}

interface DocumentsResponse {
  documents: Doc[];
  missing: string[];
}

const DOC_TYPES: { type: string; label: string }[] = [
  { type: 'business_license', label: 'الرخصة التجارية' },
  { type: 'national_id', label: 'الهوية الوطنية' },
  { type: 'tax_card', label: 'البطاقة الضريبية' },
];

interface UserDocumentsPanelProps {
  userPublicId: string;
  userStatus?: string;
  onVerdict?: (verdict: 'approve' | 'reject') => void;
}

export function UserDocumentsPanel({ userPublicId, userStatus, onVerdict }: UserDocumentsPanelProps) {
  const [docsResponse, setDocsResponse] = useState<DocumentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewerDoc, setViewerDoc] = useState<Doc | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const lastFetchAt = useRef<number>(0);
  const { approve, reject, isPending } = useUserVerdict();

  async function fetchDocs() {
    try {
      const data = await api.get<DocumentsResponse>(`/admin/users/${userPublicId}/documents`);
      setDocsResponse(data);
      lastFetchAt.current = Date.now();
    } catch {
      // errors handled silently; panel stays empty
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocs();

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastFetchAt.current;
        if (elapsed > 50 * 60 * 1000) {
          fetchDocs();
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userPublicId]); // eslint-disable-line react-hooks/exhaustive-deps

  function openViewer(doc: Doc) {
    setViewerDoc(doc);
    setViewerOpen(true);
  }

  function handleApprove() {
    approve(userPublicId, () => onVerdict?.('approve'));
  }

  function handleRejectConfirm(reason: string) {
    reject(userPublicId, reason, () => {
      setRejectOpen(false);
      onVerdict?.('reject');
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-base font-semibold">المستندات</h3>

      <div className="flex flex-row gap-4">
        {loading
          ? DOC_TYPES.map((dt) => (
              <div key={dt.type} className="flex flex-col items-center gap-1">
                <Skeleton className="w-24 h-24 rounded" />
                <span className="text-xs text-muted-foreground">{dt.label}</span>
              </div>
            ))
          : DOC_TYPES.map((dt) => {
              const doc = docsResponse?.documents.find((d) => d.document_type === dt.type);
              const isMissing = docsResponse?.missing.includes(dt.type) ?? true;

              return (
                <div key={dt.type} className="flex flex-col items-center gap-1">
                  {doc && !isMissing ? (
                    <img
                      src={doc.url}
                      alt={dt.label}
                      className="w-24 h-24 object-cover rounded cursor-pointer"
                      onClick={() => openViewer(doc)}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-muted flex items-center justify-center rounded">
                      <span className="text-xs text-muted-foreground text-center px-1">لم يُرفع بعد</span>
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">{dt.label}</span>
                </div>
              );
            })}
      </div>

      {userStatus === 'pending_review' && (
        <div className="flex flex-row gap-2 mt-2">
          <Button
            onClick={handleApprove}
            disabled={isPending}
          >
            موافقة
          </Button>
          <Button
            variant="outline"
            className="border-destructive text-destructive hover:bg-destructive/10"
            onClick={() => setRejectOpen(true)}
            disabled={isPending}
          >
            رفض
          </Button>
        </div>
      )}

      {viewerDoc && (
        <DocumentViewer
          doc={viewerDoc}
          open={viewerOpen}
          onOpenChange={setViewerOpen}
          onRefresh={fetchDocs}
        />
      )}

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={handleRejectConfirm}
        isPending={isPending}
      />
    </div>
  );
}
