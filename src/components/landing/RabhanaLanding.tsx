import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Beef,
  Boxes,
  Drumstick,
  Facebook,
  Fish,
  MessageCircle,
  Milk,
  ShieldCheck,
  Wheat,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuthStore } from "@/stores/auth";

type Category = {
  name: string;
  icon: LucideIcon;
  count: string;
};

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mx-auto max-w-3xl text-center">
      <span aria-hidden="true" className="mx-auto mb-4 block h-px w-12 bg-accent" />
      <h2 className="text-3xl font-extrabold tracking-tight text-secondary sm:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-3 text-base text-muted-foreground sm:text-lg">{subtitle}</p> : null}
    </header>
  );
}

export default function RabhanaLanding() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = !!token;

  const categories: Category[] = useMemo(
    () => [
      { name: "لحوم مستوردة", icon: Beef, count: "10 صفقة نشطة" },
      { name: "كبدة مستوردة", icon: Beef, count: "8 صفقة نشطة" },
      { name: "فراخ مستوردة و مصرية", icon: Drumstick, count: "6 صفقة نشطة" },
      { name: "اسماك مجمدة كرتونه", icon: Fish, count: "7 صفقة نشطة" },
      { name: "ألبان ومشتقات", icon: Milk, count: "5 صفقة نشطة" },
      { name: "جميع المصنعات", icon: Wheat, count: "12 صفقة نشطة" },
      { name: "المزيد من منتجات الكرتونة", icon: Boxes, count: "4 صفقة نشطة" },
    ],
    [],
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-secondary-foreground/10 bg-secondary text-secondary-foreground">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3">
            <img src="/brand/icon-white-square.png" alt="" className="size-10 rounded-2xl" />
            <div>
              <div className="text-lg font-extrabold leading-none text-secondary-foreground">ربحانة</div>
              <div className="text-xs text-secondary-foreground/70">مع ربحانة دايما ربحانة</div>
              <span className="mt-1 block h-px w-8 bg-accent" aria-hidden="true" />
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm text-secondary-foreground/75 md:flex" aria-label="روابط">
            <a className="transition-colors duration-200 hover:text-accent" href="#how">كيف تعمل</a>
            <a className="transition-colors duration-200 hover:text-accent" href="#categories">الفئات</a>
            <a className="transition-colors duration-200 hover:text-accent" href="#stats">الأرقام</a>
            <a className="transition-colors duration-200 hover:text-accent" href="#footer">تواصل</a>
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-secondary-foreground/25 bg-transparent px-4 text-sm font-semibold text-secondary-foreground transition-colors duration-200 hover:bg-secondary-foreground/10"
                  onClick={() => navigate('/auctions')}
                  aria-label="الصفقات"
                >
                  الصفقات
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
                  onClick={() => navigate('/profile')}
                  aria-label="حسابي"
                >
                  حسابي
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-secondary-foreground/25 bg-transparent px-4 text-sm font-semibold text-secondary-foreground transition-colors duration-200 hover:bg-secondary-foreground/10"
                  onClick={() => navigate('/login')}
                  aria-label="تسجيل الدخول"
                >
                  تسجيل الدخول
                </button>
                <button
                  type="button"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-accent hover:text-accent-foreground"
                  onClick={() => navigate('/register')}
                  aria-label="إنشاء حساب"
                >
                  ابدأ البيع
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden bg-background">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,hsl(var(--accent)/0.18),transparent_55%),radial-gradient(circle_at_10%_85%,hsl(var(--secondary)/0.12),transparent_50%)]"
          />
          <div className="container relative flex min-h-[calc(100svh-4rem)] items-center py-12 md:py-16">
            <div className="mx-auto max-w-3xl text-center animate-fade-in px-4">
              <p className="inline-flex items-center gap-2 rounded-full border border-secondary/15 bg-secondary/5 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm font-semibold text-secondary">
                <ShieldCheck className="size-3.5 md:size-4" aria-hidden="true" />
                منصة صفقات B2B في مصر
              </p>

              <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.05] tracking-tight text-secondary">
                مع ربحانة دايما ربحانة
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base md:text-lg leading-relaxed text-muted-foreground">
                المنصة الوحيدة في تبادل السلع الغذائية بين تجار الجملة في مصر والشرق الاوسط.
              </p>

              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                {isAuthenticated ? (
                  <button
                    type="button"
                    className="inline-flex h-12 items-center justify-center rounded-xl bg-secondary px-8 text-base font-extrabold text-secondary-foreground transition-colors duration-200 hover:bg-primary"
                    onClick={() => navigate('/auctions')}
                  >
                    الصفقات
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="inline-flex h-12 items-center justify-center rounded-xl bg-secondary px-8 text-base font-extrabold text-secondary-foreground transition-colors duration-200 hover:bg-primary"
                      onClick={() => navigate('/register')}
                    >
                      ابدأ البيع
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-12 items-center justify-center rounded-xl border border-secondary/30 bg-transparent px-8 text-base font-extrabold text-secondary transition-colors duration-200 hover:bg-secondary hover:text-secondary-foreground"
                      onClick={() => navigate('/login')}
                    >
                      تصفح الصفقات
                    </button>
                  </>
                )}
              </div>

              <div className="mt-12 flex items-center justify-center gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground md:text-xs">
                <span aria-hidden="true" className="h-px w-8 bg-accent md:w-10" />
                <span>مخصص للتجار والشركات والمستوردين والمصانع</span>
                <span aria-hidden="true" className="h-px w-8 bg-accent md:w-10" />
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="py-20 sm:py-28 border-t border-border/60">
          <div className="container">
            <SectionTitle title="كيف تعمل ربحانة" subtitle="ثلاث خطوات بسيطة لتبدأ البيع والشراء بثقة." />

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                {
                  title: "أنشئ صفقتك",
                  desc: "أضف تفاصيل المنتج والصور والسعر بسهولة.",
                  icon: "1",
                },
                {
                  title: "استقبل العروض",
                  desc: "عروض تنافسية من مشترين موثوقين.",
                  icon: "2",
                },
                {
                  title: "اقبض بأمان",
                  desc: "إتمام الصفقة بتأكيد الطلب والدفع الآمن.",
                  icon: "3",
                },
              ].map((s) => (
                <article
                  key={s.title}
                  className="group rounded-2xl border border-border bg-card p-7 transition-colors duration-200 hover:border-secondary/40"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid size-12 place-items-center rounded-xl bg-secondary text-secondary-foreground">
                      <span className="text-lg font-extrabold">{s.icon}</span>
                    </div>
                    <div className="text-right">
                      <h3 className="text-lg font-extrabold text-secondary">{s.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="categories" className="py-20 sm:py-28 border-t border-border/60">
          <div className="container">
            <SectionTitle title="الفئات" subtitle="اختر فئتك وتابع الصفقات النشطة." />

            <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {categories.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.name}
                    type="button"
                    className="group rounded-2xl border border-border bg-card p-6 text-right transition-colors duration-200 hover:border-secondary/40 hover:bg-secondary/[0.03]"
                    onClick={() => navigate(isAuthenticated ? '/auctions' : '/login')}
                    aria-label={`عرض صفقات ${c.name}`}
                  >
                    <div className="grid size-12 place-items-center rounded-xl bg-secondary/5 text-secondary transition-colors duration-200 group-hover:bg-secondary group-hover:text-secondary-foreground">
                      <Icon className="size-6" aria-hidden="true" />
                    </div>
                    <div className="mt-5 text-lg font-extrabold text-secondary">{c.name}</div>
                    <div className="mt-1 text-sm font-semibold text-primary">{c.count}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section id="stats" className="py-20 sm:py-28 border-t border-border/60">
          <div className="container">
            <div className="relative overflow-hidden rounded-2xl bg-secondary p-8 sm:p-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,hsl(var(--accent)/0.18),transparent_55%)]"
              />
              <div className="relative">
                <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-secondary-foreground sm:text-3xl">
                      أرقام تتكلم
                    </h2>
                    <p className="mt-2 text-secondary-foreground/85">
                      نمو مستمر وثقة من مجتمع الأعمال الزراعي.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-accent">
                    <ShieldCheck className="size-5" aria-hidden="true" />
                    <span className="text-sm font-bold">حماية وموثوقية</span>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {["2,500+", "20,000+", "98%", "100%"].map((v, i) => {
                    const label = ["صفقة مُنجزة و شراء كل 90 دقيقة", "تاجر موثوق", "معدل رضا", "دعم فني"][i];
                    return (
                      <div
                        key={label}
                        className="rounded-xl border border-secondary-foreground/10 bg-secondary-foreground/[0.04] p-6"
                      >
                        <div className="text-4xl font-extrabold tracking-tight text-accent">{v}</div>
                        <div className="mt-2 text-sm font-semibold text-secondary-foreground/80">{label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 sm:py-28 border-t border-border/60">
          <div className="container">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-secondary p-8 text-secondary-foreground">
                <h3 className="text-xl font-extrabold text-secondary-foreground">هل لديك منتجات للبيع؟</h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary-foreground/80">
                  أنشئ صفقتك بسرعة ووصل لعدد أكبر من المشترين.
                </p>
                <button
                  type="button"
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-accent px-6 text-base font-extrabold text-accent-foreground transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
                  onClick={() => navigate(isAuthenticated ? '/create' : '/login')}
                >
                  أنشئ صفقة
                </button>
              </div>

              <div className="rounded-2xl border border-border bg-card p-8 transition-colors duration-200 hover:border-secondary/40">
                <h3 className="text-xl font-extrabold text-secondary">تبحث عن منتجات غذائية ومجمدات مستورة؟</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  تابع الصفقات حسب الفئة والمنطقة، واختر أفضل العروض.
                </p>
                <button
                  type="button"
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 text-base font-extrabold text-primary-foreground transition-colors duration-200 hover:bg-secondary hover:text-secondary-foreground"
                  onClick={() => navigate(isAuthenticated ? '/auctions' : '/login')}
                >
                  تصفح الصفقات
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer id="footer" className="border-t border-secondary-foreground/10 bg-secondary text-secondary-foreground">
        <div className="container py-10">
          <div className="grid gap-8 md:grid-cols-3 md:items-start">
            <div>
              <div className="flex items-center gap-2">
                <img src="/brand/icon-green.png" alt="" className="h-8 w-auto" />
                <div className="text-2xl font-extrabold text-secondary-foreground">ربحانة</div>
              </div>
              <p className="mt-2 text-sm text-secondary-foreground/70">مع ربحانة دايما ربحانة</p>
              <span aria-hidden="true" className="mt-3 block h-px w-12 bg-accent" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm font-semibold text-secondary-foreground/75 md:justify-self-center">
              {["من نحن", "تواصل معنا", "الشروط والأحكام", "سياسة الخصوصية"].map((l) => (
                <button
                  key={l}
                  type="button"
                  className="w-fit text-right transition-colors duration-200 hover:text-accent"
                  onClick={() => navigate('/login')}
                >
                  {l}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 md:justify-self-end">
              <a
                href="#"
                aria-label="واتساب"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
                className="grid size-11 place-items-center rounded-2xl border border-secondary-foreground/20 bg-transparent text-secondary-foreground transition-colors duration-200 hover:border-accent hover:bg-accent hover:text-accent-foreground"
              >
                <MessageCircle className="size-5" aria-hidden="true" />
              </a>
              <a
                href="#"
                aria-label="فيسبوك"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
                className="grid size-11 place-items-center rounded-2xl border border-secondary-foreground/20 bg-transparent text-secondary-foreground transition-colors duration-200 hover:border-accent hover:bg-accent hover:text-accent-foreground"
              >
                <Facebook className="size-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="mt-10 text-center text-xs font-semibold text-secondary-foreground/60">
            © 2026 ربحانة - جميع الحقوق محفوظة
          </div>
        </div>
      </footer>
    </div>
  );
}
