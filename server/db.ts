import { asc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  goldRates,
  InsertGoldRate,
  InsertStoreSettings,
  InsertUser,
  storeSettings,
  StoreSettings,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];

  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };

  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

const defaultSettings: StoreSettings = {
  id: 1,
  storeName: "دار لُجين للمجوهرات",
  city: "الرياض، المملكة العربية السعودية",
  displayTitle: "نشرة أسعار الذهب اليوم",
  displayDate: new Intl.DateTimeFormat("ar-SA", { day: "2-digit", month: "long", year: "numeric" }).format(new Date()),
  displayTime: new Intl.DateTimeFormat("ar-SA", { hour: "2-digit", minute: "2-digit", hour12: true }).format(new Date()),
  currency: "ريال سعودي",
  unit: "للجرام",
  note: "الأسعار إرشادية وقد تختلف حسب المصنعية والمنتج.",
  logoUrl: null,
  updatedAt: new Date(),
};

const defaultRates: InsertGoldRate[] = [
  { label: "ذهب عيار 24", karat: "24K", price: "416.50", change: "2.10", sortOrder: 1, isVisible: 1 },
  { label: "ذهب عيار 22", karat: "22K", price: "381.80", change: "1.40", sortOrder: 2, isVisible: 1 },
  { label: "ذهب عيار 21", karat: "21K", price: "364.45", change: "0.90", sortOrder: 3, isVisible: 1 },
  { label: "ذهب عيار 18", karat: "18K", price: "312.40", change: "-0.30", sortOrder: 4, isVisible: 1 },
];

export async function getGoldboardData() {
  const db = await getDb();
  if (!db) return { settings: defaultSettings, rates: defaultRates.map((rate, index) => ({ ...rate, id: index + 1, updatedAt: new Date() })) };

  const settingsRows = await db.select().from(storeSettings).where(eq(storeSettings.id, 1)).limit(1);
  const rateRows = await db.select().from(goldRates).orderBy(asc(goldRates.sortOrder), asc(goldRates.id));

  return {
    settings: settingsRows[0] ?? defaultSettings,
    rates: rateRows.length > 0 ? rateRows : defaultRates.map((rate, index) => ({ ...rate, id: index + 1, updatedAt: new Date() })),
  };
}

export async function replaceGoldboardData(settings: InsertStoreSettings, rates: InsertGoldRate[]) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  await db.transaction(async tx => {
    await tx.insert(storeSettings).values({ ...settings, id: 1 }).onDuplicateKeyUpdate({
      set: {
        storeName: settings.storeName,
        city: settings.city,
        displayTitle: settings.displayTitle,
        displayDate: settings.displayDate,
        displayTime: settings.displayTime,
        currency: settings.currency,
        unit: settings.unit,
        note: settings.note,
        logoUrl: settings.logoUrl ?? null,
      },
    });
    await tx.delete(goldRates);
    if (rates.length > 0) {
      await tx.insert(goldRates).values(rates.map((rate, index) => ({ ...rate, sortOrder: index + 1 })));
    }
  });

  return getGoldboardData();
}
