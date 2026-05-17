import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { API_CONFIG } from '@/lib/api';

interface StatusResponse {
  status: string;
  account_status: string;
  next_step: string;
}

export function StatusRedirect() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login', { replace: true });
        return;
      }

      try {
        const response = await fetch(`${API_CONFIG.FULL_URL}/auth/status`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data: StatusResponse = await response.json();

          switch (data.next_step) {
            case 'interests':
              navigate('/select-interests', { replace: true });
              return;
            case 'location':
              navigate('/set-location', { replace: true });
              return;
            case 'documents':
              navigate('/documents', { replace: true });
              return;
            case '':
              if (data.status === 'active' || data.status === 'pending_review' || data.status === 'suspended') {
                navigate('/auctions', { replace: true });
              }
              return;
          }
        } else if (response.status === 401) {
          // Token invalid, logout handled by API client
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Failed to check status:', error);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return null;
}
