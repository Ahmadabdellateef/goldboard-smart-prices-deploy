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
  price: string;
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
};

export type BoardData = {
  settings: BoardSettings;
  rates: Rate[];
  updatedAt?: Date;
};

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
  },
  rates: [
    { label: "ذهب عيار 24", karat: "24K", price: "0.00", change: "0.00", isVisible: true },
    { label: "ذهب عيار 22", karat: "22K", price: "0.00", change: "0.00", isVisible: true },
    { label: "ذهب عيار 21", karat: "21K", price: "0.00", change: "0.00", isVisible: true },
    { label: "ذهب عيار 18", karat: "18K", price: "0.00", change: "0.00", isVisible: true },
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
        price: String(rate.price ?? "0.00"),
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
