import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, ExternalLink, MapPin, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { defaultBoard, subscribeToBoard, type BoardData } from "@/lib/goldboard";

function formatPrice(value: string | number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
}
function formatDate(value?: Date) {
  return value ? new Intl.DateTimeFormat("ar-SY", { day: "2-digit", month: "long", year: "numeric" }).format(value) : defaultBoard.settings.displayDate;
}
function formatTime(value?: Date) {
  return value ? new Intl.DateTimeFormat("ar-SY", { hour: "2-digit", minute: "2-digit", hour12: true }).format(value) : defaultBoard.settings.displayTime;
}
function GoldMark({ logoUrl, size = "normal" }: { logoUrl?: string | null; size?: "normal" | "large" }) {
  if (logoUrl) return <img src={logoUrl} alt="شعار المحل" className={`brand-mark brand-mark-${size} brand-mark-image`} />;
  return <svg className={`brand-mark-svg brand-mark-${size}`} viewBox="0 0 100 100" role="img" aria-label="شعار المحل"><path d="M50 8 88 30v40L50 92 12 70V30Z" /><path d="m50 8 0 84M12 30l38 22 38-22M12 70l38-18 38 18M50 52 72 39v26L50 78Z" /></svg>;
}

export default function Home() {
  const [board, setBoard] = useState<BoardData>(defaultBoard);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  useEffect(() => {
    setFetching(true);
    return subscribeToBoard(data => { setBoard(data); setLoading(false); setFetching(false); }, () => { setLoading(false); setFetching(false); });
  }, []);
  const settings = board.settings;
  const rates = board.rates.filter(rate => rate.isVisible);
  const featured = rates.find(rate => rate.karat === "21K") ?? rates[0];
  return (
    <main className="display-page" dir="rtl">
      <div className="display-noise" aria-hidden="true" />
      <header className="display-header">
        <div className="display-brand"><GoldMark logoUrl={settings.logoUrl} /><div><p className="eyebrow">نشرة السوق اليومية</p><h1>{settings.storeName}</h1></div></div>
        <div className="display-header-actions"><span className="live-pill"><span className="live-dot" /> مباشر</span><Link href="/control" className="display-control-link"><span>لوحة التحكم</span><ArrowLeft size={16} /></Link></div>
      </header>
      <div className="display-layout">
        <section className="display-main-column">
          <div className="display-intro"><div><p className="eyebrow eyebrow-gold">أسعار الذهب اليوم</p><h2>{settings.displayTitle}</h2><p className="display-subtitle">قراءة واضحة، تحديث مستمر، وقرار شراء أكثر ثقة.</p></div><div className="last-update-card"><span className="last-update-icon"><Clock3 size={18} /></span><div><span>آخر تحديث · {settings.displayDate || formatDate(board.updatedAt)}</span><strong>{settings.displayTime || formatTime(board.updatedAt)}</strong></div><RefreshCw size={15} className={fetching ? "spin-soft" : ""} /></div></div>
          <div className="rates-heading"><div><span className="rates-index">01</span><h3>قائمة العيارات</h3></div><span className="unit-label">السعر {settings.unit} · {settings.currency}</span></div>
          {loading ? <div className="display-loading">جاري تجهيز نشرة الأسعار...</div> : <div className="rates-list">{rates.map((rate, index) => { const isPositive = Number(rate.change) >= 0; const isFeatured = rate === featured; return <article className={`rate-row ${isFeatured ? "rate-row-featured" : ""}`} key={`${rate.karat}-${index}`}><div className="rate-number">0{index + 1}</div><div className="rate-name"><span className="rate-karat">{rate.karat}</span><strong>{rate.label}</strong></div><div className="rate-price-wrap"><strong className="rate-price">{formatPrice(rate.price)}</strong><span className="rate-currency">{settings.currency}</span></div><div className={`rate-change ${isPositive ? "is-positive" : "is-negative"}`}>{isPositive ? <TrendingUp size={17} /> : <TrendingDown size={17} />}<span>{isPositive ? "+" : ""}{formatPrice(rate.change)}</span></div></article>; })}</div>}
        </section>
        <aside className="display-side-column"><div className="featured-card"><div className="featured-card-top"><span>العيار الأكثر تداولًا</span><span className="featured-icon">✦</span></div><div className="featured-content"><span className="featured-kicker">{featured?.karat ?? "21K"}</span><strong>{featured ? formatPrice(featured.price) : "0.00"}</strong><span>{settings.currency} {settings.unit}</span></div><div className="featured-rule"><span /></div><p>يتغير السعر بحسب السوق العالمي وسعر الصرف.</p></div><div className="info-card"><div className="info-card-head"><span className="info-card-number">02</span><span>معلومات النشرة</span></div><div className="info-line"><MapPin size={16} /><span>{settings.city}</span></div><div className="info-line"><Clock3 size={16} /><span>مزامنة مباشرة من Firestore</span></div><div className="info-line"><ExternalLink size={16} /><span>اسأل فريقنا عن المصنعية</span></div></div><div className="display-note"><span className="note-mark">“</span><p>{settings.note}</p></div></aside>
      </div>
      <footer className="display-footer"><span>© {new Date().getFullYear()} {settings.storeName}</span><span className="footer-status"><span className="live-dot" /> النشرة متصلة</span></footer>
    </main>
  );
}
