import {
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { firestore } from "./firebase";

export type Rate = {
  label: string;
  karat: string;
  sellPrice: string;
  buyPrice: string;
  price?: string;
  change: string;
  isVisible: boolean;
};

export type BoardSettings = {
  storeName: string;
  city: string;
  displayTitle: string;
  displayDate: string;
  displayTime: string;
  currency: string;
  unit: string;
  note: string;
  logoUrl: string | null;
  displayTheme: "gold" | "emerald" | "royal" | "ruby";
};

export type BoardData = {
  settings: BoardSettings;
  rates: Rate[];
  updatedAt?: Date;
};

export const CURRENCY_OPTIONS = [
  { value: "ليرة سورية", label: "الليرة السورية", code: "SYP" },
  { value: "دولار أمريكي", label: "الدولار الأمريكي", code: "USD" },
  { value: "يورو", label: "اليورو", code: "EUR" },
  { value: "ليرة تركية", label: "الليرة التركية", code: "TRY" },
  { value: "ريال سعودي", label: "الريال السعودي", code: "SAR" },
  { value: "درهم إماراتي", label: "الدرهم الإماراتي", code: "AED" },
  { value: "جنيه إسترليني", label: "الجنيه الإسترليني", code: "GBP" },
];

export const defaultBoard: BoardData = {
  settings: {
    storeName: "دار لُجين للمجوهرات",
    city: "سوريا",
    displayTitle: "نشرة أسعار الذهب اليوم",
    displayDate: new Intl.DateTimeFormat("ar-SY", { day: "2-digit", month: "long", year: "numeric" }).format(new Date()),
    displayTime: new Intl.DateTimeFormat("ar-SY", { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date()),
    currency: "ليرة سورية",
    unit: "للجرام",
    note: "الأسعار إرشادية وقد تختلف حسب المصنعية والمنتج.",
    logoUrl: null,
    displayTheme: "gold",
  },
  rates: [
    { label: "ذهب عيار 24", karat: "24K", sellPrice: "0.00", buyPrice: "0.00", change: "0.00", isVisible: true },
    { label: "ذهب عيار 22", karat: "22K", sellPrice: "0.00", buyPrice: "0.00", change: "0.00", isVisible: true },
    { label: "ذهب عيار 21", karat: "21K", sellPrice: "0.00", buyPrice: "0.00", change: "0.00", isVisible: true },
    { label: "ذهب عيار 18", karat: "18K", sellPrice: "0.00", buyPrice: "0.00", change: "0.00", isVisible: true },
  ],
};

const boardRef = doc(firestore, "goldboard", "main");

function normalizeBoard(raw: Record<string, unknown>): BoardData {
  const rawSettings = (raw.settings ?? {}) as Partial<BoardSettings>;
  const rawRates = Array.isArray(raw.rates) ? raw.rates : [];
  return {
    settings: { ...defaultBoard.settings, ...rawSettings },
    rates: rawRates.map((item) => {
      const rate = item as Partial<Rate>;
      return {
        label: String(rate.label ?? "ذهب عيار جديد"),
        karat: String(rate.karat ?? "20K"),
        sellPrice: String(rate.sellPrice ?? rate.price ?? "0.00"),
        buyPrice: String(rate.buyPrice ?? rate.price ?? "0.00"),
        change: String(rate.change ?? "0.00"),
        isVisible: rate.isVisible !== false,
      };
    }),
    updatedAt: raw.updatedAt && typeof raw.updatedAt === "object" && "toDate" in raw.updatedAt
      ? (raw.updatedAt as { toDate: () => Date }).toDate()
      : undefined,
  };
}

export function subscribeToBoard(onChange: (board: BoardData) => void, onError: (error: Error) => void): Unsubscribe {
  return onSnapshot(boardRef, snapshot => {
    onChange(snapshot.exists() ? normalizeBoard(snapshot.data()) : defaultBoard);
  }, error => onError(error));
}

export async function saveBoard(board: BoardData) {
  await setDoc(boardRef, {
    settings: board.settings,
    rates: board.rates,
    updatedAt: serverTimestamp(),
  });
}
