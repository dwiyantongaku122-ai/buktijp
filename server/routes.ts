import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProviderSchema, insertGameSchema, insertSiteSettingsSchema } from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  await storage.seedData();
  
  registerObjectStorageRoutes(app);

  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const settings = await storage.getSettings();
      
      const adminUsername = settings?.adminUsername || "admin";
      const adminPassword = settings?.adminPassword || "bell2026";
      
      if (username === adminUsername && password === adminPassword) {
        res.json({ success: true });
      } else {
        res.status(401).json({ success: false, message: "Username atau password salah" });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: "Login gagal" });
    }
  });

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSettings();
      res.json(settings || {});
    } catch (error) {
      res.status(500).json({ error: "Failed to get settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const parsed = insertSiteSettingsSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const settings = await storage.updateSettings(parsed.data);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // Per-provider maps: hot games (5) and above70 games (20 total including hot)
  let hotGamesMap: Map<string, Set<string>> = new Map();
  let above70Map: Map<string, Set<string>> = new Map();
  let lastPatternUpdate = Date.now();
  let lastHotShuffle = Date.now();

  // Shuffle hot games + above70 distribution for each provider every 4 minutes
  // 5 hot games per provider, 20 total with RTP > 70 (5 hot + 15 mid-high), rest get low
  const shuffleHotGames = async () => {
    try {
      const providers = await storage.getProviders();
      const newHotMap = new Map<string, Set<string>>();
      const newAbove70Map = new Map<string, Set<string>>();

      for (const provider of providers) {
        const games = await storage.getGamesByProvider(provider.id);
        const activeGames = games.filter(g => g.isActive !== "false");
        if (activeGames.length === 0) continue;

        const shuffled = [...activeGames].sort(() => 0.5 - Math.random());

        const hotCount = Math.min(5, shuffled.length);
        const hotSet = new Set<string>();
        for (let i = 0; i < hotCount; i++) {
          hotSet.add(shuffled[i].id);
        }

        const above70Set = new Set<string>(hotSet);
        const above70Total = Math.min(20, shuffled.length);
        for (let i = hotCount; i < above70Total; i++) {
          above70Set.add(shuffled[i].id);
        }

        newHotMap.set(provider.id, hotSet);
        newAbove70Map.set(provider.id, above70Set);
      }

      hotGamesMap = newHotMap;
      above70Map = newAbove70Map;
      console.log("Hot games shuffled: 5 hot + 20 above-70 per provider");
    } catch (e) {
      console.error("Hot shuffle error:", e);
    }
  };

  // RTP rotation - updates RTP values every 1 minute
  // Hot (5 per provider): RTP 90-99, category "high"
  // Mid-high (15 per provider): RTP 71-89, category "mid"
  // Rest: RTP 30-70, category "low"
  const rotateRTP = async (updatePattern: boolean) => {
    try {
      const games = await storage.getGames();
      if (!games.length) return;

      for (const game of games) {
        const isHot = hotGamesMap.get(game.providerId)?.has(game.id) || false;
        const isAbove70 = above70Map.get(game.providerId)?.has(game.id) || false;

        let category: "high" | "mid" | "low";
        let rtpValue: number;

        if (isHot) {
          category = "high";
          rtpValue = Math.floor(Math.random() * 10) + 90; // 90-99
        } else if (isAbove70) {
          category = "mid";
          rtpValue = Math.floor(Math.random() * 19) + 71; // 71-89
        } else {
          category = "low";
          rtpValue = Math.floor(Math.random() * 41) + 30; // 30-70
        }

        const updateData: { rtpValue: number; category: "high" | "mid" | "low"; pattern?: string } = {
          rtpValue,
          category
        };

        if (updatePattern) {
          const manual = Math.floor(Math.random() * 100);
          const auto = Math.floor(Math.random() * 100);
          const turbo = Math.floor(Math.random() * 100);
          const pattern = `Manual ${manual} ${Math.random() > 0.5 ? "✅" : "❌"}${Math.random() > 0.5 ? "✅" : "❌"}${Math.random() > 0.5 ? "✅" : "❌"}\nAuto ${auto} ${Math.random() > 0.5 ? "✅" : "❌"}${Math.random() > 0.5 ? "✅" : "❌"}${Math.random() > 0.5 ? "✅" : "❌"}\nTurbo ${turbo} ${Math.random() > 0.5 ? "✅" : "❌"}${Math.random() > 0.5 ? "✅" : "❌"}${Math.random() > 0.5 ? "✅" : "❌"}`;
          updateData.pattern = pattern;
        }

        await storage.updateGame(game.id, updateData);
      }
    } catch (e) {
      console.error("RTP Rotation error:", e);
    }
  };

  // Initial shuffle and RTP assignment
  await shuffleHotGames();
  await rotateRTP(true);

  // Main interval - runs every 1 minute for RTP updates, every 4 minutes reshuffles hot/above70
  setInterval(async () => {
    const now = Date.now();

    if (now - lastHotShuffle >= 4 * 60 * 1000) {
      await shuffleHotGames();
      lastHotShuffle = now;
    }

    const updatePattern = now - lastPatternUpdate >= 10 * 60 * 1000;
    if (updatePattern) {
      lastPatternUpdate = now;
    }

    await rotateRTP(updatePattern);
  }, 60 * 1000);


  app.get("/api/providers", async (req, res) => {
    try {
      const providers = await storage.getProviders();
      res.json(providers);
    } catch (error) {
      res.status(500).json({ error: "Failed to get providers" });
    }
  });

  app.get("/api/providers/:id", async (req, res) => {
    try {
      const provider = await storage.getProvider(req.params.id);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      res.status(500).json({ error: "Failed to get provider" });
    }
  });

  app.post("/api/providers", async (req, res) => {
    try {
      const parsed = insertProviderSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const provider = await storage.createProvider(parsed.data);
      res.status(201).json(provider);
    } catch (error) {
      res.status(500).json({ error: "Failed to create provider" });
    }
  });

  app.put("/api/providers/:id", async (req, res) => {
    try {
      const parsed = insertProviderSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const provider = await storage.updateProvider(req.params.id, parsed.data);
      if (!provider) {
        return res.status(404).json({ error: "Provider not found" });
      }
      res.json(provider);
    } catch (error) {
      res.status(500).json({ error: "Failed to update provider" });
    }
  });

  app.delete("/api/providers/:id", async (req, res) => {
    try {
      await storage.deleteProvider(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete provider" });
    }
  });

  app.get("/api/games", async (req, res) => {
    try {
      const { providerId } = req.query;
      let games;
      if (providerId && typeof providerId === "string") {
        games = await storage.getGamesByProvider(providerId);
      } else {
        games = await storage.getGames();
      }
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: "Failed to get games" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const game = await storage.getGame(req.params.id);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ error: "Failed to get game" });
    }
  });

  app.post("/api/games/bulk", async (req, res) => {
    try {
      const { providerId, games: gamesList } = req.body;
      if (!providerId || !Array.isArray(gamesList) || gamesList.length === 0) {
        return res.status(400).json({ error: "providerId and games array required" });
      }
      if (gamesList.length > 200) {
        return res.status(400).json({ error: "Maximum 200 games per bulk upload" });
      }

      const createdGames = [];
      for (let i = 0; i < gamesList.length; i++) {
        const g = gamesList[i];
        const rtpValue = Math.floor(Math.random() * 25) + 75;
        const rtpMin = 75;
        const rtpMax = 99;
        const manual = Math.floor(Math.random() * 100);
        const auto = Math.floor(Math.random() * 100);
        const turbo = Math.floor(Math.random() * 100);
        const pattern = `Manual ${manual} ${Math.random() > 0.5 ? "✅" : "❌"}${Math.random() > 0.5 ? "✅" : "❌"}${Math.random() > 0.5 ? "✅" : "❌"}\nAuto ${auto} ${Math.random() > 0.5 ? "✅" : "❌"}${Math.random() > 0.5 ? "✅" : "❌"}${Math.random() > 0.5 ? "✅" : "❌"}\nTurbo ${turbo} ${Math.random() > 0.5 ? "✅" : "❌"}${Math.random() > 0.5 ? "✅" : "❌"}${Math.random() > 0.5 ? "✅" : "❌"}`;
        const category = rtpValue >= 90 ? "high" : rtpValue >= 80 ? "mid" : "low";

        const gameData = {
          providerId,
          name: g.name || `Game ${i + 1}`,
          imageUrl: g.imageUrl || "",
          rtpValue,
          rtpMin,
          rtpMax,
          pattern,
          category: category as "high" | "mid" | "low",
          sortOrder: i + 1,
        };

        const parsed = insertGameSchema.safeParse(gameData);
        if (parsed.success) {
          const created = await storage.createGame(parsed.data);
          createdGames.push(created);
        }
      }

      res.status(201).json({ created: createdGames.length, games: createdGames });
    } catch (error) {
      console.error("Bulk create error:", error);
      res.status(500).json({ error: "Failed to bulk create games" });
    }
  });

  app.post("/api/games", async (req, res) => {
    try {
      const parsed = insertGameSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const game = await storage.createGame(parsed.data);
      res.status(201).json(game);
    } catch (error) {
      res.status(500).json({ error: "Failed to create game" });
    }
  });

  app.put("/api/games/:id", async (req, res) => {
    try {
      const parsed = insertGameSchema.partial().safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const game = await storage.updateGame(req.params.id, parsed.data);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ error: "Failed to update game" });
    }
  });

  app.delete("/api/games/:id", async (req, res) => {
    try {
      await storage.deleteGame(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete game" });
    }
  });

  return httpServer;
}
