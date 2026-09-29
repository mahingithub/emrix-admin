import type { Product, ProductImage } from "./types";
import type { SceneKey } from "./scenes";

/** Locally bundled, AI-created collection artwork. Admin uploads take priority. */
export const COLLECTION_ART: Record<SceneKey, { src: string; alt: string }> = {
  "shinobi": {
    "src": "/images/catalog/collections/naruto.webp",
    "alt": "Naruto Uzumaki, spiky blond hair, leaf headband, orange and black outfit, blue Rasengan swirling in his hand, orange chakra embers over Konoha rooftops"
  },
  "pirate": {
    "src": "/images/catalog/collections/one-piece.webp",
    "alt": "Monkey D. Luffy, iconic straw hat and open red jacket, confident joyful grin, wind in his hair, towering ocean waves and the Thousand Sunny behind him"
  },
  "sorcerer": {
    "src": "/images/catalog/collections/jujutsu-kaisen.webp",
    "alt": "Satoru Gojo with spiky white hair, black high collar, blindfold pulled down revealing luminous blue eyes, raised hand, violet cursed energy and fractured city night"
  },
  "swordsman": {
    "src": "/images/catalog/collections/demon-slayer.webp",
    "alt": "Tanjiro Kamado, red-brown hair, forehead scar and hanafuda earrings, green and black checkered haori, katana surrounded by beautifully curved turquoise water dragon, dark forest"
  },
  "scout": {
    "src": "/images/catalog/collections/attack-on-titan.webp",
    "alt": "Levi Ackerman in a green Survey Corps cape overlooking a sunlit walled town"
  },
  "fighter": {
    "src": "/images/catalog/collections/dragon-ball.webp",
    "alt": "Goku in his orange gi, smiling above a sunlit mountain valley"
  },
  "devil": {
    "src": "/images/catalog/collections/chainsaw-man.webp",
    "alt": "Denji in Chainsaw Man form with orange chainsaw head and mechanical teeth, white shirt and black tie, dynamic pose, sparks and industrial Tokyo rooftop background, no blood or gore"
  },
  "shadow": {
    "src": "/images/catalog/collections/solo-leveling.webp",
    "alt": "Sung Jinwoo, recognizable handsome black-haired anime hunter, glowing violet eyes, black coat, spectral shadow soldiers and Igris behind him, dagger, violet flame wisps"
  },
  "reaper": {
    "src": "/images/catalog/collections/bleach.webp",
    "alt": "Ichigo Kurosaki, bright orange hair, black soul reaper robes, enormous Zangetsu blade over shoulder, flowing cloth, pale moon and spiritual energy"
  },
  "brawler": {
    "src": "/images/catalog/collections/hunter-x-hunter.webp",
    "alt": "Gon Freecss and Killua Zoldyck, iconic spiky black hair and silver hair, green outfit and blue-white outfit, side by side, vivid Nen energy and electric sparks, dense forest"
  },
  "oracle": {
    "src": "/images/catalog/collections/death-note.webp",
    "alt": "Light Yagami with brown hair and tan blazer holding a black notebook, Ryuk looming behind him, striking red apple, gothic shadows and intricate feather shapes"
  },
  "hero": {
    "src": "/images/catalog/collections/my-hero-academia.webp",
    "alt": "Izuku Midoriya, messy dark green hair, freckles, green hero costume, clenched fist with brilliant green lightning, dynamic city perspective"
  }
};

export const PRODUCT_MOCKUPS: Record<string, { color: string; description: string }> = {
  "hidden-leaf-shinobi-tee": {
    "color": "Black",
    "description": "Naruto Uzumaki using blue Rasengan, orange chakra accents, manga panels"
  },
  "nine-tails-chakra-oversized": {
    "color": "Black",
    "description": "Naruto in golden chakra mode with Kurama the nine-tailed fox behind him, fiery orange and gold, detailed manga linework"
  },
  "straw-hat-pirates-tee": {
    "color": "White",
    "description": "Monkey D. Luffy with straw hat and red vest grinning, ocean waves, straw-hat pirate crest, red and teal manga collage"
  },
  "sun-god-gear-five-oversized": {
    "color": "White",
    "description": "Luffy Gear Five with white flowing hair and clothes, laughing in dynamic pose, flowing white smoke against black ink and gold sunburst"
  },
  "cursed-energy-tee": {
    "color": "Black",
    "description": "Yuji Itadori with pink hair and black uniform red hood, dynamic punch with black-flash scarlet and violet energy, detailed manga portrait panels"
  },
  "domain-expansion-oversized": {
    "color": "Black",
    "description": "Satoru Gojo, white hair and luminous blue eyes, black high collar, domain expansion hand gesture, rich violet and blue cosmic energy, premium manga collage"
  },
  "water-breathing-tee": {
    "color": "Navy",
    "description": "Tanjiro Kamado with green checkered haori swinging katana amid sweeping ukiyo-e turquoise water dragon, intricate waves and white foam"
  },
  "demon-slayer-corps-tee": {
    "color": "Black",
    "description": "Tanjiro with Nezuko and Zenitsu, intricately drawn anime manga triptych with emerald water, rose pink and amber lightning accents"
  },
  "wings-of-freedom-tee": {
    "color": "Olive",
    "description": "Levi Ackerman with green cloak, dual swords and maneuver gear, intricate white and navy wings emblem behind him, monochrome manga panels"
  },
  "rumbling-oversized": {
    "color": "Sand",
    "description": "Eren Yeager portrait over dramatic Attack Titan face, intricate monochrome manga collage with crimson smoke and crumbling wall"
  },
  "turtle-school-tee": {
    "color": "Orange",
    "description": "Goku in classic black spiky hair, blue kamehameha blast and blue-white ink manga panels, Turtle School insignia"
  },
  "super-saiyan-aura-tee": {
    "color": "Black",
    "description": "Super Saiyan Goku with golden hair and turquoise eyes, spectacular golden power-up aura, electric blue sparks, beautifully inked manga panels"
  },
  "devil-hunter-tee": {
    "color": "White",
    "description": "Chainsaw Man Denji with orange chainsaw head and black tie, dynamic chainsaw pose, black and crimson ink manga graphic, no blood or gore"
  },
  "public-safety-oversized": {
    "color": "Black",
    "description": "Aki Hayakawa, Denji and Power from Chainsaw Man, cinematic manga triptych in bone white with muted crimson and rust highlights"
  },
  "shadow-monarch-tee": {
    "color": "Black",
    "description": "Sung Jinwoo handsome black-haired hunter with glowing violet eyes, dagger and spectral Igris behind, beautifully detailed luminous purple shadow flames"
  },
  "arise-oversized": {
    "color": "Black",
    "description": "Sung Jinwoo standing over army of shadow knights, Igris crimson plume, blue-violet spectral flames, tall premium detailed manga composition"
  },
  "soul-reaper-tee": {
    "color": "White",
    "description": "Ichigo Kurosaki, spiky orange hair and black robes, gigantic Zangetsu sword, black ink slash and red sun, detailed manga panels"
  },
  "hollow-mask-tee": {
    "color": "Black",
    "description": "Ichigo Kurosaki face half covered by white hollow mask with red stripes, orange hair, dramatic bone-white mask closeup and crimson ink strokes"
  },
  "hunter-license-tee": {
    "color": "White",
    "description": "Gon Freecss and Killua Zoldyck, striking manga panels with green Nen aura and icy blue lightning, small hunter license motifs"
  },
  "nen-aura-oversized": {
    "color": "Black",
    "description": "Gon Freecss unleashing Jajanken punch, emerald green and golden Nen aura, energetic monochrome manga panels"
  },
  "kira-justice-tee": {
    "color": "Black",
    "description": "Light Yagami holding Death Note notebook, Ryuk shadow behind him and crimson apple, gothic bone-white manga panels with deep red accents"
  },
  "shinigami-apple-tee": {
    "color": "White",
    "description": "Ryuk from Death Note with spiky black hair and huge mischievous grin holding bright red apple, gothic inked feathers and black manga panels"
  },
  "plus-ultra-hero-tee": {
    "color": "White",
    "description": "All Might in iconic red blue and gold hero suit with broad grin and dynamic raised fist, bold detailed manga composition"
  },
  "one-for-all-oversized": {
    "color": "Black",
    "description": "Izuku Midoriya in green hero costume, dark green messy hair and freckles, dynamic full-cowl punch, emerald lightning, intricate manga panels"
  }
};

/** Background-free tees, used where a product sits on a coloured stage (the homepage limited drop). */
export const PRODUCT_CUTOUTS: Record<string, string> = {
  "domain-expansion-oversized": "/images/catalog/products/domain-expansion-oversized-cutout.webp",
};

/** A mockup is tied to its pictured colour, never relabelled as another variant. */
export function bundledProductPhotos(product: Pick<Product, "slug" | "name">): ProductImage[] {
  const mockup = PRODUCT_MOCKUPS[product.slug];
  if (!mockup) return [];
  return [{
    id: `catalog-${product.slug}`,
    url: `/images/catalog/products/${product.slug}.webp`,
    alt: `${product.name} — ${mockup.color} T-shirt design mockup`,
    color: mockup.color,
  }];
}

/** Uploaded photos take priority; built-in mockups cover the launch catalogue. */
export function productPhotos(product: Product, colorName = product.colors[0]?.name): ProductImage[] {
  const photos = product.images.length ? product.images : bundledProductPhotos(product);
  if (!colorName) return photos;
  const matching = photos.filter((photo) => !photo.color || photo.color === colorName);
  return matching.length ? matching : photos;
}
