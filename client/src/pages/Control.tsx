import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  Eye,
  EyeOff,
  FileText,
  LayoutDashboard,
  LogOut,
  Monitor,
  Plus,
  Save,
  Store,
  Trash2,
  Upload,
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

// Keep a narrow local draft so mobile edits stay fluid before one atomic save.
type RateDraft = {
  label: string;
  karat: string;
  price: string;
  change: string;
  isVisible: boolean;
};

type BoardDraft = {
  settings: {
    storeName: string;
    city: string;
    displayTitle: string;
    displayDate: string;
    displayTime: string;
    currency: string;
    unit: string;
    note: string;
    logoUrl: string | null;
  };
  rates: RateDraft[];
};

type GoldboardData = {
  settings: BoardDraft["settings"] & { updatedAt?: Date | string };
  rates: Array<{ id: number; label: string; karat: string; price: string; change?: string; isVisible?: number | boolean; updatedAt?: Date | string }>;
};

const emptyDraft: BoardDraft = {
  settings: {
    storeName: "",
    city: "",
    displayTitle: "",
    displayDate: "",
    displayTime: "",
    currency: "ريال سعودي",
    unit: "للجرام",
    note: "",
    logoUrl: null,
  },
  rates: [],
};

function toDraft(data: GoldboardData): BoardDraft {
  return {
    settings: {
      storeName: data.settings.storeName,
      city: data.settings.city,
      displayTitle: data.settings.displayTitle,
      displayDate: data.settings.displayDate,
      displayTime: data.settings.displayTime,
      currency: data.settings.currency,
      unit: data.settings.unit,
      note: data.settings.note,
      logoUrl: data.settings.logoUrl ?? null,
    },
    rates: data.rates.map(rate => ({
      label: rate.label,
      karat: rate.karat,
      price: String(rate.price),
      change: String(rate.change),
      isVisible: Number(rate.isVisible) === 1,
    })),
  };
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="control-field">
      <span>{label}</span>
      <input value={value} type={type} onChange={event => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

export default function Control() {
  const auth = useAuth();
  const boardQuery = trpc.goldboard.get.useQuery(undefined, { enabled: Boolean(auth.user) });
  const updateMutation = trpc.goldboard.update.useMutation();
  const [draft, setDraft] = useState<BoardDraft>(emptyDraft);
  const [saved, setSaved] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (boardQuery.data) setDraft(toDraft(boardQuery.data));
  }, [boardQuery.data]);

  const visibleCount = useMemo(() => draft.rates.filter(rate => rate.isVisible).length, [draft.rates]);

  if (auth.loading) {
    return <div className="auth-loading" dir="rtl">جاري التحقق من جلسة الإدارة...</div>;
  }

  if (!auth.user) {
    return (
      <main className="login-page" dir="rtl">
        <div className="login-card">
          <div className="login-mark"><span>ل</span><i /></div>
          <p className="eyebrow eyebrow-gold">مساحة الإدارة</p>
          <h1>حدّث نشرة الذهب من هاتفك.</h1>
          <p>لوحة خاصة بصاحب المحل لتعديل الأسعار والهوية، بينما تبقى شاشة العرض أمام الزوار واضحة ومباشرة.</p>
          <button className="primary-button login-button" onClick={() => startLogin()}>تسجيل الدخول للمتابعة <ArrowRight size={17} /></button>
          <Link href="/display" className="back-to-display"><ArrowRight size={16} /> العودة إلى شاشة العرض</Link>
        </div>
      </main>
    );
  }

  const updateSetting = (key: keyof BoardDraft["settings"], value: string | null) => {
    setSaved(false);
    setDraft(current => ({ ...current, settings: { ...current.settings, [key]: value } }));
  };

  const updateRate = (index: number, key: keyof RateDraft, value: string | boolean) => {
    setSaved(false);
    setDraft(current => ({
      ...current,
      rates: current.rates.map((rate, rateIndex) => rateIndex === index ? { ...rate, [key]: value } : rate),
    }));
  };

  const addRate = () => {
    setSaved(false);
    setDraft(current => ({
      ...current,
      rates: [...current.rates, { label: "ذهب عيار جديد", karat: "20K", price: "0.00", change: "0.00", isVisible: true }],
    }));
  };

  const removeRate = (index: number) => {
    if (draft.rates.length <= 1) return;
    setSaved(false);
    setDraft(current => ({ ...current, rates: current.rates.filter((_, rateIndex) => rateIndex !== index) }));
  };

  const moveRate = (index: number, direction: -1 | 1) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= draft.rates.length) return;
    setSaved(false);
    setDraft(current => {
      const rates = [...current.rates];
      [rates[index], rates[nextIndex]] = [rates[nextIndex], rates[index]];
      return { ...current, rates };
    });
  };

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 100 * 1024) {
      toast.error("اختر صورة أقل من 100 كيلوبايت بصيغة PNG أو JPG أو WebP.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => updateSetting("logoUrl", String(reader.result));
    reader.onerror = () => toast.error("تعذر قراءة ملف الشعار، حاول مرة أخرى.");
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaved(false);
    try {
      await updateMutation.mutateAsync({ settings: draft.settings, rates: draft.rates });
      await boardQuery.refetch();
      setSaved(true);
      toast.success("تم حفظ النشرة ومزامنتها مع شاشة العرض.");
    } catch {
      toast.error("لم يتم الحفظ. راجع البيانات أو اتصالك ثم حاول مرة أخرى.");
    }
  };

  return (
    <main className="control-app" dir="rtl">
      <aside className={`control-sidebar ${mobileMenuOpen ? "is-open" : ""}`}>
        <div className="control-sidebar-brand">
          <div className="sidebar-mark"><span>ل</span><i /></div>
          <div><strong>GoldBoard</strong><span>مساحة الإدارة</span></div>
        </div>
        <nav className="control-nav">
          <span className="control-nav-label">إدارة النشرة</span>
          <a href="#overview" className="control-nav-item is-active"><LayoutDashboard size={17} /> نظرة عامة</a>
          <a href="#rates" className="control-nav-item"><CircleHelp size={17} /> أسعار العيارات</a>
          <a href="#identity" className="control-nav-item"><Store size={17} /> هوية المحل</a>
        </nav>
        <div className="sidebar-bottom">
          <Link href="/display" className="sidebar-display-link"><Monitor size={16} /> فتح شاشة العرض <ArrowRight size={15} /></Link>
          <button className="sidebar-logout" onClick={() => auth.logout()}><LogOut size={16} /> تسجيل الخروج</button>
        </div>
      </aside>

      <section className="control-content">
        <header className="control-topbar">
          <div className="topbar-title">
            <button className="mobile-menu-button" onClick={() => setMobileMenuOpen(open => !open)} aria-label="فتح القائمة"><LayoutDashboard size={18} /></button>
            <div><p className="eyebrow">مساحة الإدارة / اليوم</p><h1>صباح الذهب، {auth.user.name?.split(" ")[0] ?? "يا صديقي"}.</h1></div>
          </div>
          <div className="topbar-actions">
            <span className="sync-status"><span className="sync-dot" /> متصل</span>
            <Link href="/display" className="outline-button"><Monitor size={16} /> مشاهدة الشاشة</Link>
          </div>
        </header>

        <div className="control-body" id="overview">
          <div className="control-intro">
            <div><p className="eyebrow eyebrow-gold">لوحة التحكم</p><h2>كل ما يحتاجه زائرك، <em>بين يديك.</em></h2><p>عدّل الأسعار والبيانات من هاتفك، وستظهر التغييرات على الشاشة تلقائيًا.</p></div>
            <button className="primary-button save-top-button" onClick={save} disabled={updateMutation.isPending || boardQuery.isLoading}><Save size={17} /> {updateMutation.isPending ? "جارٍ الحفظ..." : "حفظ التغييرات"}</button>
          </div>

          <div className="control-stats">
            <div className="stat-card"><span>العيارات الظاهرة</span><strong>{visibleCount}<small> / {draft.rates.length}</small></strong><div className="stat-line"><span style={{ width: `${draft.rates.length ? (visibleCount / draft.rates.length) * 100 : 0}%` }} /></div></div>
            <div className="stat-card"><span>حالة النشرة</span><strong className="stat-online"><span className="sync-dot" /> مباشرة</strong><p>التحديث التلقائي مفعّل</p></div>
            <div className="stat-card"><span>مسار العرض</span><strong className="stat-path">/display</strong><p>رابط مناسب للشاشة الذكية</p></div>
          </div>

          <section className="control-section" id="rates">
            <div className="section-heading"><div><span className="section-number">01</span><div><h3>أسعار العيارات</h3><p>رتّب ما يظهر للزائر، وعدّل السعر في ثوانٍ.</p></div></div><button className="outline-button add-rate-button" onClick={addRate}><Plus size={17} /> إضافة عيار</button></div>
            <div className="rates-editor">
              <div className="editor-header"><span>العيار</span><span>السعر</span><span>التغير</span><span>الظهور</span><span>ترتيب</span><span /></div>
              {draft.rates.map((rate, index) => (
                <div className={`editor-row ${rate.isVisible ? "" : "is-hidden"}`} key={`${rate.karat}-${index}`}>
                  <div className="editor-rate-name"><span className="drag-handle">⠿</span><div><input value={rate.label} onChange={event => updateRate(index, "label", event.target.value)} /><small><input value={rate.karat} onChange={event => updateRate(index, "karat", event.target.value)} /></small></div></div>
                  <label className="editor-number"><input value={rate.price} type="text" inputMode="decimal" onChange={event => updateRate(index, "price", event.target.value)} /><span>ر.س</span></label>
                  <label className="editor-number editor-change"><input value={rate.change} type="text" inputMode="decimal" onChange={event => updateRate(index, "change", event.target.value)} /><span>ر.س</span></label>
                  <button className={`visibility-toggle ${rate.isVisible ? "is-on" : ""}`} onClick={() => updateRate(index, "isVisible", !rate.isVisible)} aria-label={rate.isVisible ? "إخفاء العيار" : "إظهار العيار"}>{rate.isVisible ? <Eye size={17} /> : <EyeOff size={17} />}</button>
                  <div className="order-buttons"><button onClick={() => moveRate(index, -1)} aria-label="تحريك للأعلى"><ChevronUp size={16} /></button><button onClick={() => moveRate(index, 1)} aria-label="تحريك للأسفل"><ChevronDown size={16} /></button></div>
                  <button className="delete-button" onClick={() => removeRate(index)} aria-label="حذف العيار"><Trash2 size={17} /></button>
                </div>
              ))}
            </div>
          </section>

          <section className="control-section" id="identity">
            <div className="section-heading"><div><span className="section-number">02</span><div><h3>بيانات النشرة والهوية</h3><p>هذه المعلومات تظهر مباشرة على شاشة العرض.</p></div></div></div>
            <div className="settings-grid">
              <div className="settings-panel"><div className="panel-title"><Store size={18} /><div><strong>هوية المحل</strong><span>الاسم والموقع والشعار</span></div></div><div className="field-grid"><Field label="اسم المحل" value={draft.settings.storeName} onChange={value => updateSetting("storeName", value)} placeholder="مثال: دار لُجين للمجوهرات" /><Field label="المدينة / العنوان" value={draft.settings.city} onChange={value => updateSetting("city", value)} placeholder="الرياض، المملكة العربية السعودية" /></div><div className="logo-upload"><div className="logo-preview">{draft.settings.logoUrl ? <img src={draft.settings.logoUrl} alt="شعار المحل" /> : <span>ل</span>}</div><div><strong>شعار المحل</strong><p>يفضّل صورة مربعة بخلفية شفافة.</p><label className="upload-button"><Upload size={16} /> رفع أو استبدال الشعار<input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLogoUpload} /></label></div></div></div>
              <div className="settings-panel"><div className="panel-title"><FileText size={18} /><div><strong>تفاصيل النشرة</strong><span>النصوص والوحدة الظاهرة</span></div></div><Field label="عنوان النشرة" value={draft.settings.displayTitle} onChange={value => updateSetting("displayTitle", value)} placeholder="نشرة أسعار الذهب اليوم" /><div className="field-grid"><Field label="تاريخ العرض" value={draft.settings.displayDate} onChange={value => updateSetting("displayDate", value)} placeholder="28 أكتوبر 2026" /><Field label="وقت آخر تحديث" value={draft.settings.displayTime} onChange={value => updateSetting("displayTime", value)} placeholder="04:05 م" /></div><div className="field-grid"><Field label="العملة" value={draft.settings.currency} onChange={value => updateSetting("currency", value)} placeholder="ريال سعودي" /><Field label="وحدة السعر" value={draft.settings.unit} onChange={value => updateSetting("unit", value)} placeholder="للجرام" /></div><label className="control-field"><span>ملاحظة أسفل النشرة</span><textarea value={draft.settings.note} onChange={event => updateSetting("note", event.target.value)} placeholder="الأسعار إرشادية وقد تختلف حسب المصنعية والمنتج." rows={3} /></label></div>
            </div>
          </section>

          <div className="save-bar"><div>{saved ? <><Check size={17} /> تم حفظ التغييرات ومزامنتها</> : <><FileText size={17} /> لا تنسَ حفظ آخر تعديل قبل مغادرة الصفحة</>}</div><button className="primary-button" onClick={save} disabled={updateMutation.isPending}><Save size={17} /> حفظ النشرة</button></div>
        </div>
      </section>
    </main>
  );
}
