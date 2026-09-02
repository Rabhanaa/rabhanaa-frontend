import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { LogOut, MapPin, Briefcase, Mail, Phone, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useApiError } from "@/hooks/useApiError";
import { deregisterPushToken } from "@/lib/notifications";
import { isSupplySideRole } from "@/lib/roles";

interface UserProfile {
  public_id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  is_admin: boolean;
  region_name?: string;
  job_name?: string;
  // job_id and region_id are only here because /auth/profile takes a whole
  // profile; the toggle below has to send them back unchanged.
  job_id?: number;
  region_id?: number;
  job_key?: string;
  supplies_to_retail: boolean;
  interests: number[];
}

export function ProfilePage() {
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);
  const { handleError } = useApiError();

  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get<UserProfile>("/auth/me");
        setUser(res);
      } catch (err) {
        handleError(err);
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  // Whether this merchant sells to retailers (#7). Until now the answer was
  // taken once at registration and never editable, which was harmless while
  // nothing read it — now that retailer feeds filter on it, a merchant who
  // unticked it by mistake would be invisible with no way back.
  const [savingSupply, setSavingSupply] = useState(false);

  const handleSuppliesToRetail = async (next: boolean) => {
    if (!user?.job_id || !user?.region_id) return;
    const previous = user.supplies_to_retail;
    setUser({ ...user, supplies_to_retail: next }); // optimistic
    setSavingSupply(true);
    try {
      await api.post("/auth/profile", {
        job_id: user.job_id,
        region_id: user.region_id,
        supplies_to_retail: next,
      });
    } catch (err) {
      setUser({ ...user, supplies_to_retail: previous });
      handleError(err);
    } finally {
      setSavingSupply(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await deregisterPushToken()
    try {
      await api.post("/auth/logout", {});
    } catch { /* ignore logout errors */ }
    logout({ silent: true });
    navigate("/login");
  };

  const statusText: Record<string, string> = {
    active: "نشط",
    pending_review: "قيد المراجعة",
    pending_documents: "في انتظار المستندات",
    suspended: "معلق",
  };

  const statusColor: Record<string, string> = {
    active: "bg-green-50 text-green-700 border-green-200",
    pending_review: "bg-yellow-50 text-yellow-700 border-yellow-200",
    pending_documents: "bg-blue-50 text-blue-700 border-blue-200",
    suspended: "bg-red-50 text-red-600 border-red-200",
  };

  const infoRows = [
    { icon: Mail, label: "البريد الإلكتروني", value: user?.email },
    { icon: Phone, label: "رقم الهاتف", value: user?.phone },
    { icon: MapPin, label: "المنطقة", value: user?.region_name },
    { icon: Briefcase, label: "المهنة", value: user?.job_name },
  ];

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-green-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      {/* Header */}
      <div className="bg-gradient-to-b from-green-800 via-green-600 to-green-500 px-6 pt-14 pb-10 text-white relative">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-extrabold text-white border-4 border-white/30 shadow-xl">
            {user?.name?.charAt(0) || "U"}
          </div>

          <div className="text-center">
            <h2 className="text-xl font-extrabold text-white">{user?.name}</h2>
            <span
              className={`mt-1.5 inline-block text-xs font-bold px-3 py-1 rounded-full border ${
                statusColor[user?.status || ""] ||
                "bg-white/20 text-white border-white/30"
              }`}
            >
              {statusText[user?.status || ""] || user?.status}
            </span>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {/* Info Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 divide-y divide-gray-50">
          {infoRows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <Icon size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold">{label}</p>
                <p className="text-sm font-bold text-gray-900">
                  {value || "—"}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Supply to retail (#7) — only the merchant types that retailers are
            allowed to see, which is the same set asked at registration. */}
        {isSupplySideRole(user?.job_key) && (
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={!!user?.supplies_to_retail}
                disabled={savingSupply}
                onChange={(e) => handleSuppliesToRetail(e.target.checked)}
                className="size-5 shrink-0 accent-green-600 disabled:opacity-50"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-gray-700">أقوم بالتوريد للتجزئة</span>
                <span className="mt-0.5 block text-xs text-gray-500">
                  {user?.supplies_to_retail
                    ? "إعلاناتك تظهر لتجار التجزئة"
                    : "إعلاناتك لا تظهر لتجار التجزئة"}
                </span>
              </span>
              {savingSupply && <Loader2 className="size-4 animate-spin text-gray-400" />}
            </label>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full h-14 bg-red-50 border-2 border-red-200 text-red-600 rounded-2xl font-bold text-base hover:bg-red-100 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <LogOut size={18} />
          {loading ? "جاري الخروج..." : "تسجيل الخروج"}
        </button>
      </div>
    </div>
  );
}
