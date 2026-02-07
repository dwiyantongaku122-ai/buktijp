import { db } from "../server/db";
import { providers, games } from "../shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

function formatGameName(filename: string): string {
  let name = filename.replace(/\.(webp|png|jpg|jpeg)$/i, "");
  name = name.replace(/^smg_/, "");
  name = name.replace(/^vs\d+/, "");
  name = name.replace(/^\d+[a-z0-9]*/, "");
  name = name.replace(/([a-z])([A-Z])/g, "$1 $2");
  name = name.replace(/([a-zA-Z])(\d)/g, "$1 $2");
  name = name.replace(/(\d)([a-zA-Z])/g, "$1 $2");
  name = name
    .split(/[\s_-]+/)
    .filter(w => w.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  return name.trim() || filename.replace(/\.(webp|png|jpg|jpeg)$/i, "");
}

async function seedProviders() {
  console.log("Starting to seed new providers...");

  const providersData = [
    { name: "Microgaming", folder: "microgaming" },
    { name: "Reel Kingdom", folder: "reelkingdom" },
    { name: "Joker", folder: "joker" },
  ];

  for (const providerData of providersData) {
    const existing = await db.select().from(providers).where(eq(providers.name, providerData.name));
    
    let providerId: string;
    
    if (existing.length === 0) {
      providerId = randomUUID();
      await db.insert(providers).values({
        id: providerId,
        name: providerData.name,
        imageUrl: null,
        sortOrder: 0,
      });
      console.log(`Created provider: ${providerData.name} (${providerId})`);
    } else {
      providerId = existing[0].id;
      console.log(`Provider already exists: ${providerData.name} (${providerId})`);
    }

    const gamesFolder = path.join(process.cwd(), "client/public/games", providerData.folder);
    
    if (!fs.existsSync(gamesFolder)) {
      console.log(`Folder not found: ${gamesFolder}`);
      continue;
    }

    const files = fs.readdirSync(gamesFolder).filter(f => 
      f.endsWith(".webp") || f.endsWith(".png") || f.endsWith(".jpg")
    );

    console.log(`Found ${files.length} game files for ${providerData.name}`);

    let addedCount = 0;
    for (const file of files) {
      const gameName = formatGameName(file);
      const imageUrl = `/games/${providerData.folder}/${file}`;
      
      if (file.includes("user") || file.includes("logo")) continue;

      try {
        await db.insert(games).values({
          id: randomUUID(),
          name: gameName,
          providerId: providerId,
          imageUrl: imageUrl,
          rtpValue: Math.floor(Math.random() * 25) + 75,
          rtpMin: 75,
          rtpMax: 99,
          category: ["high", "mid", "low"][Math.floor(Math.random() * 3)] as "high" | "mid" | "low",
          pattern: `Manual ${Math.floor(Math.random() * 100)} ✅❌✅\nAuto ${Math.floor(Math.random() * 100)} ❌✅❌\nTurbo ${Math.floor(Math.random() * 100)} ✅✅❌`,
          sortOrder: addedCount,
        });
        addedCount++;
      } catch (err: any) {
        if (!err.message?.includes("duplicate")) {
          console.error(`Error adding game ${gameName}:`, err.message);
        }
      }
    }

    console.log(`Added ${addedCount} games for ${providerData.name}`);
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seedProviders().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
