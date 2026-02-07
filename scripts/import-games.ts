import { Client } from "@replit/object-storage";
import { db } from "../server/db";
import { providers, games } from "../shared/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

const client = new Client();

const providerMapping: Record<string, string> = {
  "pragmaticplay": "Pragmatic Play",
  "pgsoft": "PG Soft",
  "habanero": "Habanero",
  "joker": "Joker Gaming",
  "microgaming": "Microgaming",
  "nolimit": "Nolimit City",
  "spade": "Spade Gaming",
  "jili": "JILI",
  "cq9": "CQ9",
  "playtech": "Playtech",
  "playstar": "Playstar",
  "reelkingdom": "Reel Kingdom",
  "bng": "BNG"
};

const gameNameMapping: Record<string, string> = {
  "vs1024butterfly": "Butterfly Bloom",
  "vs1024dtiger": "Dragon Tiger",
  "vs1024fortune": "Fortune of Giza",
  "vs1024lionsd": "5 Lions Dance",
  "vs1024mjwinbns": "Mahjong Wins Bonus",
  "vs10bblpop": "Bubble Pop",
  "vs10bookfallen": "Book of Fallen",
  "vs10bookoftut": "Book of Tut",
  "vs10cowgold": "Cowboys Gold",
  "vs10egyptcls": "Egyptian Fortunes",
  "vs10fruity2": "Fruity Candy",
  "vs10goldfish": "Fishin Reels",
  "vs10madame": "Madame Destiny",
  "vs10mayangods": "Mayan Gods",
  "vs10nudgeit": "Nudge It",
  "vs10runes": "Runes of Destiny",
  "vs10strawberry": "Juicy Fruits",
  "vs10threestar": "Three Star Fortune",
  "vs10vampwolf": "Vampires vs Wolves",
  "vs10wildtut": "Wild Wild Riches",
  "vs117649starz": "Starz Megaways",
  "vs13g": "13 Lucky Cats",
  "vs15diamond": "Diamond Strike",
  "vs15fairytale": "Fairytale Fortune",
  "vs1600drago": "Drago Jewels of Fortune",
  "vs18mashang": "88 Fortunes Megaways",
  "vs1ball": "Lucky Ball",
  "vs1dragon8": "Dragon 8",
  "vs1fortunetree": "Fortune Tree",
  "vs1fufufu": "Fu Fu Fu",
  "vs1masterjoker": "Master Joker",
  "vs1money": "Money Money Money",
  "vs20aladdinsorc": "Aladdin and the Sorcerer",
  "vs20amuleteg": "Amulet of Dead",
  "vs20bermuda": "Bermuda Riches",
  "vs20bigdawgs": "Big Dawgs",
  "vs20bl": "Black Bull",
  "vs20bnnzdice": "Bonanza Dice",
  "vs20bonzgold": "Bonanza Gold",
  "vs20candvil": "Candy Village",
  "vs20chickdrop": "Chicken Drop",
  "vs20daydead": "Day of Dead",
  "vs20doghouse": "The Dog House",
  "vs20dugems": "Dino's Day Out",
  "vs20egypttrs": "Egyptian Treasure",
  "vs20eightdragons": "8 Dragons",
  "vs20emptybank": "Empty The Bank",
  "vs20fparty2": "Fruit Party 2",
  "vs20fruitparty": "Fruit Party",
  "vs20fruitswx": "Fruits Wild",
  "vs20gatotx": "Gates of Olympus X",
  "vs20godiva": "Lady Godiva",
  "vs20goldfever": "Gold Fever",
  "vs20gorilla": "Gorilla Mayhem",
  "vs20hercpeg": "Hercules and Pegasus",
  "vs20honey": "Honey Honey Honey",
  "vs20kraken": "Release the Kraken",
  "vs20leprechaun": "Leprechaun Song",
  "vs20leprexmas": "Leprechaun Christmas",
  "vs20loksriches": "Loki's Riches",
  "vs20olympgate": "Gates of Olympus",
  "vs20olympx2": "Gates of Olympus X2",
  "vs20rhino": "Great Rhino",
  "vs20rhinoluxe": "Great Rhino Deluxe",
  "vs20santa": "Santa's Wonderland",
  "vs20sbxmas": "Starlight Christmas",
  "vs20starlight": "Starlight Princess",
  "vs20starlightx": "Starlight Princess X",
  "vs20sugarrush": "Sugar Rush",
  "vs20sugarrushx": "Sugar Rush Xmas",
  "vs20superlion": "Super Lion",
  "vs20swordofares": "Sword of Ares",
  "vs20trsbox": "Treasure Box",
  "vs20wildpix": "Wild Pixies",
  "vs20wolfgold": "Wolf Gold",
  "vs20zeusftg": "Zeus vs Hades",
  "vs243asgard": "Asgard",
  "vs243fortune": "Fortune Charm",
  "vs243lions": "5 Lions Gold",
  "vs25chilli": "Chilli Heat",
  "vs25dragonkingdom": "Dragon Kingdom",
  "vs25goldpig": "Golden Pig",
  "vs25gldox": "Golden Ox",
  "vs25goldparty": "Gold Party",
  "vs25hotchilli": "Hot Fiesta",
  "vs25jokerking": "Joker King",
  "vs25kingdom": "Kingdom of the Dead",
  "vs25mustang": "Mustang Gold",
  "vs25pandagold": "Panda Fortune",
  "vs25peking": "Peking Luck",
  "vs25pyramid": "Pyramid Bonanza",
  "vs25pyraways": "Pyramid King",
  "vs25queendom": "Queen's Domain",
  "vs25safari": "Hot Safari",
  "vs25scarabqueen": "John Hunter - Scarab",
  "vs25sweet": "Sweet Bonanza",
  "vs25sweetxmas": "Sweet Bonanza Xmas",
  "vs25thebes": "Thebes Casino",
  "vs25tigeryear": "Year of the Tiger",
  "vs25vegas": "Vegas Nights",
  "vs25walker": "Wild Walker",
  "vs25wildspells": "Wild Spells",
  "vs25wolfgold2": "Wolf Gold 2",
  "vs25yucatan": "Yucatan Mystery",
  "vs40bigjuan": "Big Juan",
  "vs40cleocatra": "Cleocatra",
  "vs40fruity": "Extra Juicy",
  "vs40pirate": "Pirate Gold",
  "vs40spartaking": "Spartan King",
  "vs40wildwest": "Wild West Gold",
  "vs5aztecgems": "Aztec Gems",
  "vs5drmystery": "Dragon Mystery",
  "vs5firejoker": "Fire Joker",
  "vs5hotburn": "Hot to Burn",
  "vs5line": "5 Line Slots",
  "vs5spjoker": "Super Joker",
  "vs5super7": "Super 7s",
  "vs5trdragons": "Triple Dragons",
  "vs75bronco": "Bronco Spirit",
  "vs75empress": "Empress Peacock",
  "vs7776aztec": "Aztec Bonanza",
  "vs7776secrets": "Secrets of Cleopatra",
  "vs7fire88": "Fire 88",
  "vs7monkeys": "7 Monkeys",
  "vs7pigs": "7 Piggies",
  "vs88hockattack": "Hockey Attack",
  "vs8magicjourn": "Magic Journey",
  "vs9aztecgemsdx": "Aztec Gems Deluxe",
  "vs9chen": "Chen's Fortune",
  "vs9hotroll": "Hot Roll",
  "vs9madmonkey": "Mad Monkey",
  "vs9piggybank": "Piggy Bank Bills",
  "vswaysalterego": "Alter Ego",
  "vswaysaztecking": "Aztec King Megaways",
  "vswaysbankbonz": "Bank Bonanza",
  "vswaysbufking": "Buffalo King Megaways",
  "vswayschilheat": "Chilli Heat Megaways",
  "vswayscryscav": "Crystal Caverns Megaways",
  "vswaysdogs": "The Dog House Megaways",
  "vswayselements": "Elements Megaways",
  "vswaysfirewmw": "Fire Strike Megaways",
  "vswayshammthor": "Hammer of Thor Megaways",
  "vswayshive": "The Hive Megaways",
  "vswaysincwnd": "Incredible Wizard",
  "vswayslions": "5 Lions Megaways",
  "vswaysluckyfish": "Lucky Fish",
  "vswaysmadame": "Madame Destiny Megaways",
  "vswaysmahwblck": "Mahjong Ways Black",
  "vswaysmahwin2": "Mahjong Wins 2",
  "vswaysmegareel": "Mega Reel Megaways",
  "vswaysrhino": "Great Rhino Megaways",
  "vswayssamurai": "Rise of Samurai Megaways",
  "vswayswest": "Wild West Gold Megaways",
  "vswayswildgang": "Wild Gang",
  "vswaysxjuicy": "Extra Juicy Megaways",
  "vswaysyumyum": "Yum Yum Powerways"
};

async function uploadFile(localPath: string, remotePath: string): Promise<string> {
  const fileBuffer = fs.readFileSync(localPath);
  await client.uploadFromBytes(remotePath, fileBuffer);
  return `https://object.cloud.replit.com/${remotePath}`;
}

async function main() {
  console.log("Starting import...");
  
  const imgDir = "/tmp/game_images/img";
  const ppDir = "/tmp/game_images/img/pp";
  const bucketId = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID;
  
  if (!bucketId) {
    console.error("No bucket ID found");
    process.exit(1);
  }

  console.log("Creating Pragmatic Play provider...");
  const [ppProvider] = await db.insert(providers).values({
    name: "Pragmatic Play",
    imageUrl: null,
    sortOrder: 0
  }).returning();
  console.log(`Created provider: ${ppProvider.name} (${ppProvider.id})`);

  const ppProviderImagePath = path.join(imgDir, "pragmaticplay.svg");
  if (fs.existsSync(ppProviderImagePath)) {
    const remotePath = `${bucketId}/public/providers/pragmaticplay.svg`;
    const url = await uploadFile(ppProviderImagePath, remotePath);
    await db.update(providers).set({ imageUrl: url }).where(eq(providers.id, ppProvider.id));
    console.log(`Uploaded provider image: ${url}`);
  }

  const gameFiles = fs.readdirSync(ppDir).filter(f => f.endsWith('.png') || f.endsWith('.webp'));
  console.log(`Found ${gameFiles.length} game images`);
  
  let count = 0;
  for (const file of gameFiles) {
    const baseName = file.replace(/\.(png|webp)$/, '');
    const gameName = gameNameMapping[baseName] || baseName.replace(/^vs\d+/, '').replace(/([A-Z])/g, ' $1').trim() || baseName;
    
    const localPath = path.join(ppDir, file);
    const remotePath = `${bucketId}/public/games/${file}`;
    
    let imageUrl = "";
    try {
      imageUrl = await uploadFile(localPath, remotePath);
    } catch (err) {
      console.error(`Failed to upload ${file}:`, err);
      continue;
    }
    
    try {
      await db.insert(games).values({
        providerId: ppProvider.id,
        name: gameName,
        imageUrl: imageUrl,
        rtpValue: Math.floor(Math.random() * 10) + 90,
        rtpMin: 75,
        rtpMax: 99,
        pattern: null,
        sortOrder: count
      });
      count++;
      if (count % 20 === 0) {
        console.log(`Imported ${count} games...`);
      }
    } catch (err) {
      console.error(`Failed to insert game ${gameName}:`, err);
    }
  }
  
  console.log(`\nImport complete! Created ${count} games for Pragmatic Play`);
}

main().catch(console.error);
