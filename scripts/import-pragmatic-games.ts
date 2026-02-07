import { db } from "../server/db";
import { games } from "../shared/schema";
import { Storage } from "@google-cloud/storage";
import * as fs from "fs";
import * as path from "path";
import { randomUUID } from "crypto";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const PRAGMATIC_PROVIDER_ID = "d22d1657-fd6b-4bcc-80e2-77dca8221c21";

const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

function parseObjectPath(fullPath: string): { bucketName: string; objectName: string } {
  const parts = fullPath.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error(`Invalid object path: ${fullPath}`);
  }
  return {
    bucketName: parts[0],
    objectName: parts.slice(1).join("/"),
  };
}

const gameNameMapping: Record<string, string> = {
  "vs1024butterfly": "Butterfly Blossom",
  "vs1024dtiger": "Dragon Tiger",
  "vs1024fortune": "Fortune of Giza",
  "vs1024lionsd": "5 Lions Dance",
  "vs1024mjwinbns": "Mahjong Wins Bonus",
  "vs10bblpop": "Bubble Pop",
  "vs10bookfallen": "Book of Fallen",
  "vs10bookoftut": "Book of Tut",
  "vs10cowgold": "Cowboys Gold",
  "vs10egyptcls": "Egyptian Fortunes",
  "vs10fruity2": "Fruity Treats",
  "vs10goldfish": "Goldfish",
  "vs10madame": "Madame Destiny",
  "vs10mayangods": "Mayan Gods",
  "vs10nudgeit": "Nudge It",
  "vs10runes": "Runes of Odin",
  "vs10strawberry": "Strawberry Cocktail",
  "vs10threestar": "Three Star Fortune",
  "vs10vampwolf": "Vampires vs Wolves",
  "vs10wildtut": "Wild Wild Riches",
  "vs117649starz": "Starz Megaways",
  "vs13g": "13",
  "vs15diamond": "Diamond Strike",
  "vs15fairytale": "Fairytale Fortune",
  "vs1600drago": "Drago Jewels of Fortune",
  "vs18mashang": "Tree of Riches",
  "vs1ball": "Hot to Burn Hold and Spin",
  "vs1dragon8": "Dragon Kingdom",
  "vs1fortunetree": "Fortune Tree",
  "vs1fufufu": "Fu Fu Fu",
  "vs1masterjoker": "Master Joker",
  "vs1money": "Money Money Money",
  "vs20aladdinsorc": "Aladdin and the Sorcerer",
  "vs20amuleteg": "Amulet of Dead",
  "vs20bermuda": "John Hunter Quest Bermuda",
  "vs20bigdawgs": "Big Dawgs",
  "vs20bl": "Big Bass Bonanza",
  "vs20bnnzdice": "Bonanza Dice",
  "vs20bonzgold": "Bonanza Gold",
  "vs20candvil": "Candy Village",
  "vs20chickdrop": "Chicken Drop",
  "vs20daydead": "Day of Dead",
  "vs20doghouse": "The Dog House",
  "vs20dugems": "Gems Bonanza",
  "vs20egypttrs": "Egyptian Rebirth",
  "vs20eightdragons": "8 Dragons",
  "vs20emptybank": "Empty the Bank",
  "vs20fparty2": "Fruit Party 2",
  "vs20fruitparty": "Fruit Party",
  "vs20fruitswx": "Fruits Deluxe",
  "vs20gatotx": "Gates of Gatot Kaca",
  "vs20godiva": "Lady Godiva",
  "vs20goldfever": "Gold Fever",
  "vs20gorilla": "Gorilla Kingdom",
  "vs20hercpeg": "Hercules and Pegasus",
  "vs20honey": "Sweet Bonanza",
  "vs20kraken": "Release the Kraken",
  "vs20leprechaun": "Leprechaun Song",
  "vs20leprexmas": "Leprechaun Carol",
  "vs20loksriches": "Might of Ra",
  "vs20magicpot": "Magic Money Maze",
  "vs20mergedwndw": "Wild Beach Party",
  "vs20midas": "The Hand of Midas",
  "vs20mkrush": "Monkey Rush",
  "vs20multiup": "Multi Up",
  "vs20ninjapower": "Ninja Power",
  "vs20olympdice": "Olympus Dice",
  "vs20olympxmas": "Gates of Olympus Xmas",
  "vs20olympx": "Gates of Olympus X1000",
  "vs20olymp": "Gates of Olympus",
  "vs20panda": "Panda Fortune 2",
  "vs20piggybank": "Piggy Bank Bills",
  "vs20pirateship": "Pirate Gold",
  "vs20piratesgold": "Pirate Golden Age",
  "vs20rainbowg": "Rainbow Gold",
  "vs20razor": "Razor Returns",
  "vs20rhinoluxe": "Great Rhino Deluxe",
  "vs20rhino": "Great Rhino",
  "vs20rio": "Rio Grande",
  "vs20rocket": "Gems of the Gods",
  "vs20rome": "Rome The Golden Age",
  "vs20santa": "Santa's Wonderland",
  "vs20sbxmas": "Sweet Bonanza Xmas",
  "vs20scgoldrush": "Gold Rush",
  "vs20screech": "Wild Depths",
  "vs20sh": "Spartan King",
  "vs20starlightx": "Starlight Princess 1000",
  "vs20starlight": "Starlight Princess",
  "vs20sugarrush": "Sugar Rush",
  "vs20swordofares": "Sword of Ares",
  "vs20theights": "Sky Bounty",
  "vs20tweethouse": "The Great Chicken Escape",
  "vs20vegasmagic": "Vegas Magic",
  "vs20wildboost": "Wild Booster",
  "vs20wildpix": "Wild Pixies",
  "vs20wolfgold": "Wolf Gold",
  "vs20xmascarol": "Christmas Carol Megaways",
  "vs20zbonanza": "Aztec Bonanza",
  "vs20zeusawaken": "Zeus vs Hades Gods of War",
  "vs20zeus": "Gates of Olympus",
  "vs21olympgate": "Gates of Olympus",
  "vs243caishien": "Caishen's Gold",
  "vs243crystalcave": "Crystal Caverns",
  "vs243dancparty": "Dance Party",
  "vs243fortune": "88 Fortunes",
  "vs243goldtrain": "Gold Train",
  "vs243lionsgold": "5 Lions Gold",
  "vs243lions": "5 Lions",
  "vs243mmagic": "Mystic Chief",
  "vs243nuwa": "Nuwa and the Five",
  "vs243santawon": "Santa's Wonderland",
  "vs25asgard": "Asgard",
  "vs25aztecking": "Aztec King",
  "vs25beauty": "Aztec Beauty",
  "vs25bravecatwl": "Fire Strike",
  "vs25champ": "The Champions",
  "vs25chillitrap": "Chilli Heat",
  "vs25dragonkingdom": "Dragon Kingdom",
  "vs25egypt": "Ancient Egypt",
  "vs25firestrike": "Fire Strike",
  "vs25goldpig": "Golden Pig",
  "vs25goldrush": "Gold Rush",
  "vs25goldturning": "Lucky Lightning",
  "vs25holdem": "Three Card Poker",
  "vs25journey": "Journey to the West",
  "vs25kingdoms": "3 Kingdoms",
  "vs25koi": "Koi Gate",
  "vs25mustang": "Mustang Gold",
  "vs25newyear": "Lucky New Year",
  "vs25phoenix": "Phoenix Forge",
  "vs25queenofgold": "Queen of Gold",
  "vs25pyramid": "Pyramid King",
  "vs25romeogold": "Romeo and Juliet",
  "vs25safari": "Safari King",
  "vs25samurai": "Samurai Code",
  "vs25scarabqueen": "John Hunter Scarab Queen",
  "vs25sea": "Ocean Tales",
  "vs25spinparty": "Spin and Score",
  "vs25wolfgold": "Wolf Gold",
  "vs40bigjuan": "Big Juan",
  "vs40bufkingdx": "Buffalo King Megaways",
  "vs40demonpots": "Demon Pots",
  "vs40firehot": "Fire Hot 40",
  "vs40hotburnwnd": "Hot to Burn",
  "vs40pirhunt": "Pirate Hunt",
  "vs40spartanking": "Spartan King",
  "vs40ultrab": "Ultra Burn",
  "vs40wildwest": "Wild West Gold",
  "vs4096bufking": "Buffalo King",
  "vs4096mystic": "Mystic Chief",
  "vs4096robhunt": "Robin Hood's Heroes",
  "vs4096treasure": "Treasure Wild",
  "vs50aladdin": "3 Genie Wishes",
  "vs50chinesecharms": "Lucky Dragons",
  "vs50dwarves": "Dwarven Gold",
  "vs50kingkong": "Jungle Gorilla",
  "vs50safariking": "Hot Safari",
  "vs576hokkwolf": "Hokkaido Wolf",
  "vs576treasures": "Treasure Wild",
  "vs5aztecgems_1": "Aztec Gems",
  "vs5spjoker": "Super Joker",
  "vs5super7": "Super 7s",
  "vs5trdragons": "Triple Dragons",
  "vs75bronco": "Bronco Spirit",
  "vs75empress": "Jade Butterfly",
  "vs7776aztec": "Aztec King Megaways",
  "vs7776secrets": "Secrets of Cleopatra",
  "vs7fire88": "Fire 88",
  "vs7monkeys": "7 Monkeys",
  "vs7pigs": "7 Piggies",
  "vs88hockattack": "Hockey Attack",
  "vs8magicjourn": "Magic Journey",
  "vs9aztecgemsdx": "Aztec Gems Deluxe",
  "vs9chen": "Cheeky Emperor",
  "vs9hotroll": "Hot Roll",
  "vs9madmonkey": "Monkey Madness",
  "vs9piggybank": "Piggy Riches",
  "vswaysalterego": "Alter Ego",
  "vswaysaztecking": "Aztec King",
  "vswaysbankbonz": "Bank Bonanza",
  "vswaysbufking": "Buffalo King Megaways",
  "vswayschilheat": "Chilli Heat Megaways",
  "vswayscryscav": "Crystal Caverns Megaways",
  "vswaysdogs": "The Dog House Megaways",
  "vswayselements": "Elemental Gems Megaways",
  "vswaysfirewmw": "Fire Strike 2",
  "vswayshammthor": "Power of Thor Megaways",
  "vswayshive": "The Hive",
  "vswaysincwnd": "Rise of Giza Powernudge",
  "vswayslions": "5 Lions Megaways",
  "vswaysluckyfish": "Lucky Fishing Megaways",
  "vswaysmadame": "Madame Destiny Megaways",
  "vswaysmahwblck": "Mahjong Ways 2",
  "vswaysmahwin2": "Mahjong Wins 2",
  "vswaysmegareel": "Mega Reel",
  "vswaysrhino": "Great Rhino Megaways",
  "vswayssamurai": "Rise of Samurai Megaways",
  "vswayswest": "Wild West Gold Megaways",
  "vswayswildgang": "Wild Wild Riches Megaways",
  "vswaysxjuicy": "Extra Juicy Megaways",
  "vswaysyumyum": "Yum Yum Powerways"
};

function getGameNameFromFilename(filename: string): string {
  const baseName = filename.replace(/\.(png|webp|jpg|jpeg)$/i, "");
  
  if (gameNameMapping[baseName]) {
    return gameNameMapping[baseName];
  }
  
  let name = baseName
    .replace(/^vs\d+/, "")
    .replace(/^vswaysmah/, "Mahjong ")
    .replace(/^vsways/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .replace(/(\d+)/g, " $1 ")
    .trim();
  
  name = name
    .split(/(?=[A-Z])|_|-|\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  
  if (!name) {
    name = baseName;
  }
  
  return name;
}

function generateRandomRtp(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function uploadFile(filePath: string, fileName: string): Promise<string> {
  const privateObjectDir = process.env.PRIVATE_OBJECT_DIR;
  if (!privateObjectDir) {
    throw new Error("PRIVATE_OBJECT_DIR not set");
  }

  const objectId = randomUUID();
  const fullPath = `${privateObjectDir}/uploads/${objectId}`;
  
  const { bucketName, objectName } = parseObjectPath(fullPath);
  
  const bucket = objectStorageClient.bucket(bucketName);
  const file = bucket.file(objectName);
  
  const fileBuffer = fs.readFileSync(filePath);
  
  await file.save(fileBuffer, {
    resumable: false,
  });
  
  return `/objects/uploads/${objectId}`;
}

async function importGames() {
  const imagesDir = "/tmp/pragmatic_images/pp";
  
  const existingGames = await db.select().from(games);
  const existingNames = new Set(existingGames.map(g => g.name.toLowerCase()));
  
  const files = fs.readdirSync(imagesDir).filter(f => 
    /\.(png|webp|jpg|jpeg)$/i.test(f)
  );
  
  console.log(`Found ${files.length} image files`);
  console.log(`Existing games in DB: ${existingGames.length}`);
  
  let imported = 0;
  let skipped = 0;
  
  for (const file of files) {
    const gameName = getGameNameFromFilename(file);
    
    if (existingNames.has(gameName.toLowerCase())) {
      console.log(`Skipping existing game: ${gameName}`);
      skipped++;
      continue;
    }
    
    try {
      const filePath = path.join(imagesDir, file);
      
      const imageUrl = await uploadFile(filePath, file);
      
      const rtpMin = 85;
      const rtpMax = 98;
      const rtpValue = generateRandomRtp(rtpMin, rtpMax);
      
      const patterns = [
        "🔴🔴🔴🔵🔵",
        "🔵🔵🔴🔴🔵",
        "🔴🔵🔵🔵🔴",
        "🔵🔴🔵🔴🔵",
        "🔴🔵🔴🔵🔵",
        "🔵🔵🔵🔴🔴",
        "🔴🔴🔵🔵🔵",
        "🔵🔴🔴🔵🔴"
      ];
      const pattern = patterns[Math.floor(Math.random() * patterns.length)];
      
      await db.insert(games).values({
        name: gameName,
        providerId: PRAGMATIC_PROVIDER_ID,
        rtpValue,
        rtpMin,
        rtpMax,
        imageUrl,
        pattern,
        sortOrder: imported + 1
      });
      
      console.log(`Imported: ${gameName} (RTP: ${rtpValue}%)`);
      imported++;
      existingNames.add(gameName.toLowerCase());
      
    } catch (error) {
      console.error(`Error importing ${file}:`, error);
    }
  }
  
  console.log(`\n=== Import Complete ===`);
  console.log(`Imported: ${imported} games`);
  console.log(`Skipped: ${skipped} (already exist)`);
}

importGames()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
  });
