import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const providers = pgTable("providers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  sortOrder: integer("sort_order").default(0),
});

export const insertProviderSchema = createInsertSchema(providers).omit({ id: true }).extend({
  imageUrl: z.string().optional().or(z.literal("")).or(z.null()),
});
export type InsertProvider = z.infer<typeof insertProviderSchema>;
export type Provider = typeof providers.$inferSelect;

export const games = pgTable("games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  providerId: varchar("provider_id").notNull().references(() => providers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  imageUrl: text("image_url"),
  rtpValue: integer("rtp_value").default(95),
  rtpMin: integer("rtp_min").default(75),
  rtpMax: integer("rtp_max").default(99),
  pattern: text("pattern"),
  category: text("category").default("mid"), // "high", "mid", "low"
  sortOrder: integer("sort_order").default(0),
  isActive: text("is_active").default("true"), // "true" or "false"
  pinnedOrder: integer("pinned_order"),
});

export const insertGameSchema = createInsertSchema(games).omit({ id: true }).extend({
  imageUrl: z.string().optional().or(z.literal("")).or(z.null()),
  rtpValue: z.number().min(0).max(100).optional(),
  rtpMin: z.number().min(0).max(100).optional(),
  rtpMax: z.number().min(0).max(100).optional(),
  category: z.enum(["high", "mid", "low"]).optional(),
  isActive: z.string().optional(),
  pinnedOrder: z.number().nullable().optional(),
});
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Game = typeof games.$inferSelect;

export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default("main"),
  logoUrl: text("logo_url"),
  hotLogoUrl: text("hot_logo_url"),
  bannerUrl: text("banner_url"),
  bannerUrls: text("banner_urls").default('[]'),
  bannerMobileUrl: text("banner_mobile_url"),
  bannerMobileUrls: text("banner_mobile_urls").default('[]'),
  backgroundImageUrl: text("background_image_url"),
  siteName: text("site_name").default("RTP LIVE"),
  primaryColor: text("primary_color").default("#1e40af"),
  secondaryColor: text("secondary_color").default("#1e3a5f"),
  accentColor: text("accent_color").default("#3b82f6"),
  titleColor: text("title_color").default("#FFFFFF"),
  borderColor: text("border_color").default("#3b82f6"),
  buttonColor: text("button_color").default("#2563eb"),
  playButtonColor: text("play_button_color").default("#22c55e"),
  backgroundColor: text("background_color").default("#030712"),
  auraColor: text("aura_color").default("#3b82f6"),
  auraIntensity: integer("aura_intensity").default(50),
  cardColor: text("card_color").default("#1e3a5f"),
  providerBgColor: text("provider_bg_color").default("#3b82f6"),
  providerLogoSize: integer("provider_logo_size").default(100),
  providerLogoObjectFit: text("provider_logo_object_fit").default("contain"), // contain, cover
  clockEnabled: text("clock_enabled").default("true"),
  // Opacity settings for each color (0-100)
  primaryColorOpacity: integer("primary_color_opacity").default(100),
  borderColorOpacity: integer("border_color_opacity").default(100),
  buttonColorOpacity: integer("button_color_opacity").default(100),
  playButtonColorOpacity: integer("play_button_opacity").default(100),
  auraColorOpacity: integer("aura_color_opacity").default(100),
  cardColorOpacity: integer("card_color_opacity").default(100),
  providerBgColorOpacity: integer("provider_bg_color_opacity").default(100),
  rtpChangeInterval: integer("rtp_change_interval").default(5),
  adminUsername: text("admin_username").default("admin"),
  adminPassword: text("admin_password").default("bell2026"),
  playUrl: text("play_url").default("#"),
  bannerButtons: text("banner_buttons").default('[{"label":"Daftar","url":"#"},{"label":"Login","url":"#"}]'),
  popupEnabled: text("popup_enabled").default("false"),
  popupTitle: text("popup_title").default("Selamat Datang!"),
  popupContent: text("popup_content").default(""),
  popupImageUrl: text("popup_image_url"),
  popupButtonLabel: text("popup_button_label").default("Daftar Sekarang"),
  popupButtonUrl: text("popup_button_url").default("#"),
  // New settings
  bannerOutlineThickness: integer("banner_outline_thickness").default(20), // 10x of original 2px
  bannerOutlineMode: text("banner_outline_mode").default("static"), // static, blink, pulse, linear
  bannerOutlineColors: text("banner_outline_colors").default('["#3b82f6", "#8b5cf6", "#ec4899"]'),
  clockTextColor: text("clock_text_color").default("#FFFFFF"),
  providerOutlineColor: text("provider_outline_color").default("#3b82f6"),
  providerOutlineThickness: integer("provider_outline_thickness").default(2),
  providerTextColor: text("provider_text_color").default("#FFFFFF"),
  providerTextSize: integer("provider_text_size").default(14),
  providerTabSize: integer("provider_tab_size").default(120),
  providerTabShape: text("provider_tab_shape").default("rectangle"), // rectangle, square
  scrollButtonColor: text("scroll_button_color").default("#3b82f6"),
  scrollButtonEnabled: text("scroll_button_enabled").default("true"),
  buttonOutlineEnabled: text("button_outline_enabled").default("true"),
  buttonOutlineColors: text("button_outline_colors").default('["#3b82f6", "#8b5cf6", "#ec4899"]'),
  buttonOutlineMode: text("button_outline_mode").default("pulse"), // static, blink, pulse, linear
  seoMetaTitle: text("seo_meta_title").default(""),
  seoMetaDescription: text("seo_meta_description").default(""),
  seoMetaKeywords: text("seo_meta_keywords").default(""),
  gscVerification: text("gsc_verification").default(""),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({ id: true }).extend({
  bannerMobileUrl: z.string().optional().or(z.literal("")).or(z.null()),
  popupImageUrl: z.string().optional().or(z.literal("")).or(z.null()),
  popupContent: z.string().optional().or(z.literal("")).or(z.null()),
});
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettings.$inferSelect;
