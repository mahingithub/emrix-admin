// Collection artwork keys (see ./catalog-media.ts).
import type { Anime } from "./types";

export type SceneKey =
  | "shinobi"
  | "pirate"
  | "sorcerer"
  | "swordsman"
  | "scout"
  | "fighter"
  | "devil"
  | "shadow"
  | "reaper"
  | "brawler"
  | "oracle"
  | "hero";

export const SCENE_LABEL: Record<SceneKey, string> = {
  shinobi: "Ninja on the run",
  pirate: "Pirate captain",
  sorcerer: "Sorcerer's hand sign",
  swordsman: "Swordsman's slash",
  scout: "Winged scout",
  fighter: "Power-up aura",
  devil: "Devil hunter",
  shadow: "Shadow army",
  reaper: "Moonlit reaper",
  brawler: "Energy punch",
  oracle: "Winged oracle",
  hero: "Caped hero",
};

export const SCENE_KEYS = Object.keys(SCENE_LABEL) as SceneKey[];

const DEFAULTS: Record<string, SceneKey> = {
  naruto: "shinobi",
  "one-piece": "pirate",
  "jujutsu-kaisen": "sorcerer",
  "demon-slayer": "swordsman",
  "attack-on-titan": "scout",
  "dragon-ball": "fighter",
  "chainsaw-man": "devil",
  "solo-leveling": "shadow",
  bleach: "reaper",
  "hunter-x-hunter": "brawler",
  "death-note": "oracle",
  "my-hero-academia": "hero",
};

/** The collection's chosen scene, or a sensible default. */
export function sceneFor(anime: Pick<Anime, "slug" | "scene">): SceneKey {
  if (anime.scene && anime.scene in SCENE_LABEL) return anime.scene;
  if (DEFAULTS[anime.slug]) return DEFAULTS[anime.slug];
  const hash = [...anime.slug].reduce((n, c) => n + c.charCodeAt(0), 0);
  return SCENE_KEYS[hash % SCENE_KEYS.length];
}
