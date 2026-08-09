import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '@/components/ScreenHeader';
import { MessageCircle } from 'lucide-react';
import { useWhatsAppUrl } from '@/lib/support';

export function SubscriptionPage() {
  const navigate = useNavigate();
  const whatsappUrl = useWhatsAppUrl();

  return (
    <div className="min-h-screen bg-gray-50 px-4 pt-10 pb-24" dir="rtl">
      <ScreenHeader title="الاشتراك" onBack={() => navigate(-1)} />

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-lg font-bold text-gray-900">اشتراك المنصة</h2>
          <p className="text-gray-500 text-sm">
            اشترك الآن للحصول على الوصول الكامل لجميع مميزات المنصة
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">✓</span>
            </div>
            <span className="text-sm font-bold text-gray-700">إنشاء عروض البيع</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">✓</span>
            </div>
            <span className="text-sm font-bold text-gray-700">إنشاء طلبات الشراء</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">✓</span>
            </div>
            <span className="text-sm font-bold text-gray-700">تقديم العروض على الصفقات</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-green-600 font-bold text-sm">✓</span>
            </div>
            <span className="text-sm font-bold text-gray-700">متابعة صفقاتك</span>
          </div>
        </div>

        <button
          onClick={() => window.open(whatsappUrl, '_blank')}
          className="w-full h-14 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-colors"
        >
          <MessageCircle size={20} />
          تواصل معنا للاشتراك
        </button>
      </div>
    </div>
  );
}