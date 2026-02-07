import { 
  type User, type InsertUser,
  type Provider, type InsertProvider,
  type Game, type InsertGame,
  type SiteSettings, type InsertSiteSettings,
  users, providers, games, siteSettings
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getProviders(): Promise<Provider[]>;
  getProvider(id: string): Promise<Provider | undefined>;
  createProvider(provider: InsertProvider): Promise<Provider>;
  updateProvider(id: string, provider: Partial<InsertProvider>): Promise<Provider | undefined>;
  deleteProvider(id: string): Promise<boolean>;
  
  getGames(): Promise<Game[]>;
  getGamesByProvider(providerId: string): Promise<Game[]>;
  getGame(id: string): Promise<Game | undefined>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, game: Partial<InsertGame>): Promise<Game | undefined>;
  deleteGame(id: string): Promise<boolean>;
  
  getSettings(): Promise<SiteSettings | undefined>;
  updateSettings(settings: InsertSiteSettings): Promise<SiteSettings>;
  
  seedData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getProviders(): Promise<Provider[]> {
    return db.select().from(providers).orderBy(providers.sortOrder);
  }

  async getProvider(id: string): Promise<Provider | undefined> {
    const [provider] = await db.select().from(providers).where(eq(providers.id, id));
    return provider;
  }

  async createProvider(provider: InsertProvider): Promise<Provider> {
    const [newProvider] = await db.insert(providers).values(provider).returning();
    return newProvider;
  }

  async updateProvider(id: string, provider: Partial<InsertProvider>): Promise<Provider | undefined> {
    const [updated] = await db.update(providers).set(provider).where(eq(providers.id, id)).returning();
    return updated;
  }

  async deleteProvider(id: string): Promise<boolean> {
    const result = await db.delete(providers).where(eq(providers.id, id));
    return true;
  }

  async getGames(): Promise<Game[]> {
    return db.select().from(games).orderBy(games.sortOrder);
  }

  async getGamesByProvider(providerId: string): Promise<Game[]> {
    return db.select().from(games).where(eq(games.providerId, providerId)).orderBy(games.sortOrder);
  }

  async getGame(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [newGame] = await db.insert(games).values(game).returning();
    return newGame;
  }

  async updateGame(id: string, game: Partial<InsertGame>): Promise<Game | undefined> {
    const [updated] = await db.update(games).set(game).where(eq(games.id, id)).returning();
    return updated;
  }

  async deleteGame(id: string): Promise<boolean> {
    await db.delete(games).where(eq(games.id, id));
    return true;
  }

  async getSettings(): Promise<SiteSettings | undefined> {
    const [settings] = await db.select().from(siteSettings).where(eq(siteSettings.id, "main"));
    return settings;
  }

  async updateSettings(settings: InsertSiteSettings): Promise<SiteSettings> {
    const existing = await this.getSettings();
    if (existing) {
      const [updated] = await db.update(siteSettings).set(settings).where(eq(siteSettings.id, "main")).returning();
      return updated;
    } else {
      const [created] = await db.insert(siteSettings).values({ ...settings, id: "main" }).returning();
      return created;
    }
  }

  async seedData(): Promise<void> {
    const existingSettings = await this.getSettings();
    if (!existingSettings) {
      await db.insert(siteSettings).values({
        id: "main",
        siteName: "RTP LIVE SLOT",
        primaryColor: "#3B82F6",
        secondaryColor: "#1e3a5f",
        accentColor: "#60A5FA",
        titleColor: "#FFFFFF",
        borderColor: "#3B82F6",
        buttonColor: "#3B82F6",
        backgroundColor: "#0a0a1a",
        rtpChangeInterval: 5,
        adminUsername: "admin",
        adminPassword: "bell2026",
      });
    }

    const existingProviders = await this.getProviders();
    if (existingProviders.length === 0) {
      const pragmatic = await this.createProvider({ name: "Pragmatic Play", sortOrder: 1 });
      const pgsoft = await this.createProvider({ name: "PG Soft", sortOrder: 2 });
      const habanero = await this.createProvider({ name: "Habanero", sortOrder: 3 });
      const microgaming = await this.createProvider({ name: "Microgaming", sortOrder: 4 });

      await this.createGame({ providerId: pragmatic.id, name: "Gates of Olympus", rtpValue: 96, pattern: "Manual 97 ❌✅✅\nAuto 88 ❌❌✅\nTurbo 48 ❌✅❌", category: "high", sortOrder: 1 });
      await this.createGame({ providerId: pragmatic.id, name: "Starlight Princess", rtpValue: 94, pattern: "Manual 97 ❌✅✅\nAuto 88 ❌❌✅\nTurbo 48 ❌✅❌", category: "high", sortOrder: 2 });
      await this.createGame({ providerId: pragmatic.id, name: "Sweet Bonanza", rtpValue: 97, pattern: "Manual 97 ❌✅✅\nAuto 88 ❌❌✅\nTurbo 48 ❌✅❌", category: "high", sortOrder: 3 });
      await this.createGame({ providerId: pragmatic.id, name: "Wild West Gold", rtpValue: 92, pattern: "Manual 97 ❌✅✅\nAuto 88 ❌❌✅\nTurbo 48 ❌✅❌", category: "mid", sortOrder: 4 });

      await this.createGame({ providerId: pgsoft.id, name: "Mahjong Ways", rtpValue: 95, pattern: "Spin 25x, Normal", sortOrder: 1 });
      await this.createGame({ providerId: pgsoft.id, name: "Mahjong Ways 2", rtpValue: 98, pattern: "Spin 15x, Max Bet", sortOrder: 2 });
      await this.createGame({ providerId: pgsoft.id, name: "Fortune Tiger", rtpValue: 93, pattern: "Spin 35x, Normal", sortOrder: 3 });

      await this.createGame({ providerId: habanero.id, name: "Koi Gate", rtpValue: 91, pattern: "Spin 60x, Normal", sortOrder: 1 });
      await this.createGame({ providerId: habanero.id, name: "Hot Hot Fruit", rtpValue: 96, pattern: "Spin 20x, Max Bet", sortOrder: 2 });

      await this.createGame({ providerId: microgaming.id, name: "Mega Moolah", rtpValue: 88, pattern: "Spin 100x, Normal", sortOrder: 1 });
      await this.createGame({ providerId: microgaming.id, name: "Immortal Romance", rtpValue: 94, pattern: "Spin 45x, Normal", sortOrder: 2 });
    }
  }
}

export const storage = new DatabaseStorage();
