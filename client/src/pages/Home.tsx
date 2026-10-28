import {
  ArrowLeft,
  Clock3,
  ExternalLink,
  MapPin,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatTime(value: Date | string | undefined) {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("ar-SA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatDate(value: Date | string | undefined) {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("ar-SA", { day: "2-digit", month: "long", year: "numeric" }).format(date);
}

function GoldMark({ logoUrl, size = "normal" }: { logoUrl?: string | null; size?: "normal" | "large" }) {
  if (logoUrl) {
    return <img src={logoUrl} alt="شعار المحل" className={`brand-mark brand-mark-${size} brand-mark-image`} />;
  }
  return (
    <div className={`brand-mark brand-mark-${size}`} aria-label="شعار المحل">
      <span>ل</span>
      <i />
    </div>
  );
}

export default function Home() {
  const boardQuery = trpc.goldboard.get.useQuery(undefined, {
    refetchInterval: 15_000,
    staleTime: 10_000,
  });
  const settings = boardQuery.data?.settings;
  const rates = (boardQuery.data?.rates ?? []).filter(rate => Number(rate.isVisible) === 1);
  const updatedAt = settings?.updatedAt;
  const featured = rates.find(rate => rate.karat === "21K") ?? rates[0];

  return (
    <main className="display-page" dir="rtl">
      <div className="display-noise" aria-hidden="true" />
      <header className="display-header">
        <div className="display-brand">
          <GoldMark logoUrl={settings?.logoUrl} />
          <div>
            <p className="eyebrow">نشرة السوق اليومية</p>
            <h1>{settings?.storeName ?? "دار لُجين للمجوهرات"}</h1>
          </div>
        </div>
        <div className="display-header-actions">
          <span className="live-pill"><span className="live-dot" /> مباشر</span>
          <Link href="/control" className="display-control-link">
            <span>لوحة التحكم</span>
            <ArrowLeft size={16} />
          </Link>
        </div>
      </header>

      <div className="display-layout">
        <section className="display-main-column">
          <div className="display-intro">
            <div>
              <p className="eyebrow eyebrow-gold">أسعار الذهب اليوم</p>
              <h2>{settings?.displayTitle ?? "نشرة أسعار الذهب اليوم"}</h2>
              <p className="display-subtitle">قراءة واضحة، تحديث مستمر، وقرار شراء أكثر ثقة.</p>
            </div>
            <div className="last-update-card">
              <span className="last-update-icon"><Clock3 size={18} /></span>
              <div>
                <span>آخر تحديث · {settings?.displayDate ?? formatDate(updatedAt)}</span>
                <strong>{settings?.displayTime ?? formatTime(updatedAt)}</strong>
              </div>
              <RefreshCw size={15} className={boardQuery.isFetching ? "spin-soft" : ""} />
            </div>
          </div>

          <div className="rates-heading">
            <div>
              <span className="rates-index">01</span>
              <h3>قائمة العيارات</h3>
            </div>
            <span className="unit-label">السعر {settings?.unit ?? "للجرام"} · {settings?.currency ?? "ريال سعودي"}</span>
          </div>

          {boardQuery.isLoading ? (
            <div className="display-loading">جاري تجهيز نشرة الأسعار...</div>
          ) : (
            <div className="rates-list">
              {rates.map((rate, index) => {
                const isPositive = Number(rate.change) >= 0;
                const isFeatured = rate.id === featured?.id;
                return (
                  <article className={`rate-row ${isFeatured ? "rate-row-featured" : ""}`} key={rate.id}>
                    <div className="rate-number">0{index + 1}</div>
                    <div className="rate-name">
                      <span className="rate-karat">{rate.karat}</span>
                      <strong>{rate.label}</strong>
                    </div>
                    <div className="rate-price-wrap">
                      <strong className="rate-price">{formatPrice(rate.price)}</strong>
                      <span className="rate-currency">{settings?.currency ?? "ريال سعودي"}</span>
                    </div>
                    <div className={`rate-change ${isPositive ? "is-positive" : "is-negative"}`}>
                      {isPositive ? <TrendingUp size={17} /> : <TrendingDown size={17} />}
                      <span>{isPositive ? "+" : ""}{formatPrice(rate.change ?? "0")}</span>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="display-side-column">
          <div className="featured-card">
            <div className="featured-card-top">
              <span>العيار الأكثر تداولًا</span>
              <span className="featured-icon">✦</span>
            </div>
            <div className="featured-content">
              <span className="featured-kicker">{featured?.karat ?? "21K"}</span>
              <strong>{featured ? formatPrice(featured.price) : "364.45"}</strong>
              <span>{settings?.currency ?? "ريال سعودي"} {settings?.unit ?? "للجرام"}</span>
            </div>
            <div className="featured-rule"><span /></div>
            <p>يتغير السعر بحسب السوق العالمي وسعر الصرف.</p>
          </div>

          <div className="info-card">
            <div className="info-card-head">
              <span className="info-card-number">02</span>
              <span>معلومات النشرة</span>
            </div>
            <div className="info-line"><MapPin size={16} /><span>{settings?.city ?? "الرياض، المملكة العربية السعودية"}</span></div>
            <div className="info-line"><Clock3 size={16} /><span>تحديث تلقائي كل 15 ثانية</span></div>
            <div className="info-line"><ExternalLink size={16} /><span>اسأل فريقنا عن المصنعية</span></div>
          </div>

          <div className="display-note">
            <span className="note-mark">“</span>
            <p>{settings?.note ?? "الأسعار إرشادية وقد تختلف حسب المصنعية والمنتج."}</p>
          </div>
        </aside>
      </div>

      <footer className="display-footer">
        <span>© {new Date().getFullYear()} {settings?.storeName ?? "دار لُجين للمجوهرات"}</span>
        <span className="footer-status"><span className="live-dot" /> النشرة متصلة</span>
      </footer>
    </main>
  );
}
