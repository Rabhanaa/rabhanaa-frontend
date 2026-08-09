export class ApiError extends Error {
  constructor(
    status: number,
    code: string,
    message: string,
    data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.data = data;
  }
  status: number;
  code: string;
  data?: unknown;
}

export class NetworkError extends Error {
  constructor(message = 'Network error - please check your connection') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Session expired - please login again') {
    super(401, 'UNAUTHORIZED', message);
  }
}

export interface ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS:       'البريد الإلكتروني أو كلمة المرور غير صحيحة',
  EMAIL_ALREADY_EXISTS:      'البريد الإلكتروني مستخدم بالفعل',
  INVALID_PHONE:             'رقم الهاتف غير صحيح',
  INVALID_OTP:               'رمز التحقق غير صحيح',
  OTP_EXPIRED:               'انتهت صلاحية رمز التحقق',
  SESSION_EXPIRED:           'تم تسجيل الدخول من جهاز آخر',
  UNAUTHORIZED:              'غير مصرح',
  ACCOUNT_NOT_ACTIVE:        'حسابك غير نشط',
  PENDING_REVIEW:            'حسابك قيد المراجعة - يمكنك تصفح الصفقات فقط',
  ADMIN_ONLY:                'هذا الإجراء للمسؤولين فقط',
  INVALID_REGION_ID:         'المنطقة المحددة غير موجودة',
  INVALID_JOB_ID:            'المهنة المحددة غير موجودة',
  INVALID_PASSWORD:          'كلمة المرور يجب أن تكون 8-16 حرفاً وتحتوي على حرف كبير وصغير ورقم ورمز خاص',
  INSUFFICIENT_INTERESTS:    'يجب اختيار 5 اهتمامات على الأقل',
  PASSWORD_ALREADY_SET:      'كلمة المرور محددة مسبقاً',
  AUCTION_NOT_FOUND:         'الصفقة غير موجودة',
  AUCTION_NOT_ACTIVE:        'الصفقة غير نشطة',
  AUCTION_STILL_ACTIVE:      'الصفقة لا تزال نشطة - يمكنك اختيار الفائز بعد انتهاء الصفقة',
  AUCTION_EXPIRED:           'الصفقة منتهية',
  CANNOT_BID_OWN:            'لا يمكنك تقديم عرض على صفقتك',
  ALREADY_BID:               'لقد قدمت عرض بالفعل',
  MAX_BIDDERS:               'تم الوصول للحد الأقصى من المزايدين',
  MAX_ACTIVE_BIDS:           'لديك 3 عروض نشطة بالفعل',
  BID_BELOW_MINIMUM:         'السعر غير عادل',
  CANNOT_CANCEL_WITH_BIDS:   'لا يمكن إلغاء الصفقة بعد وجود عروض',
  MAX_CANCELLATIONS:         'وصلت للحد الأقصى للإلغاء (3 شهرياً)',
  NOT_AUCTION_OWNER:         'أنت لست صاحب الصفقة',
  SELECTION_WINDOW_EXPIRED:  'انتهت فترة الاختيار',
  INVALID_QUANTITY:          'الكمية المطلوبة غير صحيحة',
  ORDER_NOT_FOUND:           'الطلب غير موجود',
  NOT_ORDER_PARTICIPANT:     'أنت لست طرف في هذا الطلب',
  ALREADY_CONFIRMED:         'تم التأكيد بالفعل',
  ORDER_CONFIRMATION_EXPIRED:'انتهت مهلة تأكيد الطلب (30 دقيقة)',
  ORDER_ALREADY_EXPIRED:     'الطلب منتهي الصلاحية ومُلغى',
  MAX_OPEN_ISSUES:           'لديك 3 استفسارات مفتوحة بالفعل',
  INVALID_FILE_TYPE:         'نوع الملف غير مدعوم',
  FILE_TOO_LARGE:            'حجم الملف كبير جداً',
  NO_SUBSCRIPTION:           'ليس لديك اشتراك نشط - تواصل معنا للترقية',
  INSUFFICIENT_TIER:         'اشتراكك الحالي لا يسمح بهذا الإجراء - تواصل معنا للترقية',
  MONTHLY_LIMIT_REACHED:     'وصلت للحد الشهري المسموح به - تواصل معنا للترقية',
  USER_NOT_FOUND:            'المستخدم غير موجود',
  INVALID_STATUS:            'لا يمكن تنفيذ الإجراء بالحالة الحالية',
  STORAGE_UNAVAILABLE:       'خدمة التخزين غير متاحة حالياً',
  SUBSCRIPTION_ALREADY_EXISTS: 'الاشتراك موجود بالفعل',
  SUBSCRIPTION_NOT_FOUND:    'الاشتراك غير موجود',
  INVALID_TIER:              'الباقة غير صحيحة',
  ISSUE_NOT_FOUND:           'الاستفسار غير موجود',
  USER_SUSPENDED:            'تم تعليق حسابك مؤقتاً',
  USER_BANNED:               'تم حظر حسابك',
  INVALID_STATUS_TRANSITION: 'لا يمكن تنفيذ هذا الإجراء على حالة الحساب الحالية',
  CANNOT_ACT_ON_ADMIN:       'لا يمكن تنفيذ هذا الإجراء على حساب مدير',
  CANNOT_ACT_ON_SELF:        'لا يمكن تنفيذ هذا الإجراء على حسابك',
  SUSPENSION_REASON_REQUIRED:'سبب التعليق مطلوب',
  BAN_REASON_REQUIRED:       'سبب الحظر مطلوب',

  // Backend ad-hoc error strings
  'unauthorized':                          'غير مصرح',
  'invalid request':                       'الطلب غير صحيح',
  'invalid auction id':                    'معرف الصفقة غير صحيح',
  'invalid bid id':                        'معرف العرض غير صحيح',
  'invalid offer id':                      'معرف العرض غير صحيح',
  'invalid order id':                      'معرف الطلب غير صحيح',
  'invalid request id':                    'معرف الطلب غير صحيح',
  'invalid subscription id':               'معرف الاشتراك غير صحيح',
  'invalid user id':                       'معرف المستخدم غير صحيح',
  'invalid issue id':                      'معرف الاستفسار غير صحيح',
  'no file provided':                      'لم يتم إرفاق ملف',
  'failed to open file':                   'تعذّر فتح الملف',
  'failed to read file':                   'تعذّر قراءة الملف',
  'failed to count sell bids':             'تعذّر حساب العروض',
  'failed to count supply offers':         'تعذّر حساب عروض التوريد',
  'no referral code found':                'لا يوجد رمز إحالة',
  'search query is required':              'حقل البحث مطلوب',
  "platform must be 'web' or 'mobile'":   'المنصة يجب أن تكون web أو mobile',
};

export function isPendingReviewError(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    ['PENDING_REVIEW', 'ACCOUNT_NOT_ACTIVE'].includes(err.code)
  );
}

export function isSubscriptionError(err: unknown): boolean {
  return (
    err instanceof ApiError &&
    ['NO_SUBSCRIPTION', 'INSUFFICIENT_TIER', 'MONTHLY_LIMIT_REACHED'].includes(err.code)
  );
}

export function getArabicMessage(code: string): string {
  const key = code?.trim();
  if (key && ERROR_MESSAGES[key]) return ERROR_MESSAGES[key];
  if (key?.startsWith('missing file:')) return 'الملف المطلوب مفقود';
  if (key?.includes('Field validation for')) return 'الرجاء التحقق من صحة البيانات المدخلة';
  return 'حدث خطأ غير متوقع';
}
