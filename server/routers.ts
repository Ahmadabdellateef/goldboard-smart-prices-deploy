import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { getGoldboardData, replaceGoldboardData } from "./db";

const rateInput = z.object({
  label: z.string().trim().min(1).max(120),
  karat: z.string().trim().min(1).max(32),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, "السعر يجب أن يكون رقمًا صالحًا"),
  change: z.string().regex(/^-?\d+(\.\d{1,2})?$/, "التغير يجب أن يكون رقمًا صالحًا"),
  isVisible: z.boolean(),
});

const boardInput = z.object({
  settings: z.object({
    storeName: z.string().trim().min(1).max(160),
    city: z.string().trim().min(1).max(120),
    displayTitle: z.string().trim().min(1).max(180),
    displayDate: z.string().trim().min(1).max(80),
    displayTime: z.string().trim().min(1).max(40),
    currency: z.string().trim().min(1).max(32),
    unit: z.string().trim().min(1).max(32),
    note: z.string().trim().max(500),
    logoUrl: z.string().max(160_000).nullable(),
  }),
  rates: z.array(rateInput).min(1).max(12),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  goldboard: router({
    get: publicProcedure.query(() => getGoldboardData()),
    update: adminProcedure.input(boardInput).mutation(({ input }) =>
      replaceGoldboardData(
        { ...input.settings, id: 1 },
        input.rates.map(rate => ({ ...rate, sortOrder: 0, isVisible: rate.isVisible ? 1 : 0 }))
      )
    ),
  }),
});

export type AppRouter = typeof appRouter;
