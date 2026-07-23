// Flavor content grounded in the real Robinhood Chain launch (July 2026):
// an Ethereum L2 on Arbitrum Orbit, Classic Stock Tokens, Robinhood Earn (~7% yield),
// and CASHCAT as the breakout memecoin. NFT names, slugs and logo images are the real
// collections from OpenSea's Robinhood-chain "Discover" page (images saved in /public/nft).
// The in-game economy itself is a sandboxed simulation, not real trading.

const UNISWAP_SWAP = "https://app.uniswap.org/swap";

export const TOKENS = {
  BTC: {
    symbol: "BTC", name: "Bitcoin", color: "#f7931a", img: "/coin/btc.png",
    base: 65800, kind: "crypto", cgId: "bitcoin",
    tradeUrl: "https://app.uniswap.org/explore/tokens/ethereum/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
  },
  ETH: {
    symbol: "ETH", name: "Ether", color: "#627eea", img: "/coin/eth.png",
    base: 1914, kind: "crypto", cgId: "ethereum",
    tradeUrl: "https://app.uniswap.org/explore/tokens/ethereum/NATIVE",
  },
  SOL: {
    symbol: "SOL", name: "Solana", color: "#9945ff", img: "/coin/sol.png",
    base: 77, kind: "crypto", cgId: "solana", tradeUrl: UNISWAP_SWAP,
  },
  DOGE: {
    symbol: "DOGE", name: "Dogecoin", color: "#c2a633", img: "/coin/doge.png",
    base: 0.072, kind: "meme", cgId: "dogecoin", tradeUrl: UNISWAP_SWAP,
  },
  CASHCAT: {
    symbol: "CASHCAT", name: "Cash Cat", color: "#ffd500", img: "/coin/cashcat.jpg",
    base: 0.068, kind: "meme", tradeUrl: UNISWAP_SWAP,
  },
  ANSEM: {
    symbol: "$ANSEM", name: "Ansem", color: "#222222", img: "/coin/ansem.jpg",
    base: 0.197, kind: "meme", tradeUrl: UNISWAP_SWAP,
  },
  TENDIES: {
    symbol: "TENDIES", name: "Tendies", color: "#e8a13a", img: "/coin/tendies.png",
    base: 0.0129, kind: "meme", tradeUrl: UNISWAP_SWAP,
  },
  ARROW: {
    symbol: "ARROW", name: "Arrow", color: "#111111", img: "/coin/arrow.png",
    base: 0.815, kind: "meme", tradeUrl: UNISWAP_SWAP,
  },
  NVDA: {
    symbol: "NVDAx", name: "NVIDIA Stock Token", color: "#76b900", img: "/coin/nvda.png",
    base: 205, kind: "stock", tradeUrl: UNISWAP_SWAP,
  },
  AAPL: {
    symbol: "AAPLx", name: "Apple Stock Token", color: "#ffffff", img: "/coin/aapl.png",
    base: 327, kind: "stock", tradeUrl: UNISWAP_SWAP,
  },
  TSLA: {
    symbol: "TSLAx", name: "Tesla Stock Token", color: "#e82127", img: "/coin/tsla.png",
    base: 377, kind: "stock", tradeUrl: UNISWAP_SWAP,
  },
};

const opensea = (slug) => `https://opensea.io/collection/${slug}`;

// "Viral" = already trending on the chain's marketplace. Real collections,
// real slugs, real logo images (downloaded from OpenSea into /public/nft).
export const NFT_VIRAL = [
  { name: "Gremlin Cartel", slug: "gremlin-cartel", img: "/nft/gremlin-cartel.avif", floor: 0.0241, change: 12.4, volume: 267.8 },
  { name: "StonkBrokers", slug: "stonkbrokers-434284142", img: "/nft/stonkbrokers.avif", floor: 0.08, change: 8.1, volume: 118.4 },
  { name: "Robinhood Punks", slug: "robinhood-punks", img: "/nft/robinhood-punks.avif", floor: 0.008, change: 3.9, volume: 94.2 },
  { name: "Hoodilios", slug: "hoodilios-305972298", img: "/nft/hoodilios.avif", floor: 0.009, change: 257.2, volume: 61.5 },
  { name: "Pyopyopyo", slug: "py0py0py0py0", img: "/nft/pyopyopyo.avif", floor: 0.085, change: 44.6, volume: 52.3 },
  { name: "Cash Cats", slug: "cashcatss", img: "/nft/cashcats.avif", floor: 0.02, change: 6.6, volume: 40.1 },
  { name: "Robinhood Migos", slug: "robinhood-migos", img: "/nft/robinhood-migos.avif", floor: 0.008, change: 19.2, volume: 28.9 },
  { name: "Sherwood", slug: "sherwood-705637463", img: "/nft/sherwood.avif", floor: 0.006, change: -4.2, volume: 22.7 },
  { name: "Robin Rebellion", slug: "robin-rebellion", img: "/nft/robin-rebellion.avif", floor: 0.007, change: -7.5, volume: 20.6 },
  { name: "OnChainHoodies", slug: "onchainhoodies-587016624", img: "/nft/onchainhoodies.avif", floor: 0.04, change: -1.8, volume: 18.4 },
  { name: "4663 Hoods", slug: "4663-hoods", img: "/nft/4663-hoods.avif", floor: 0.006, change: 353.8, volume: 12.9 },
].map((n) => ({ ...n, url: n.url ?? opensea(n.slug) }));

// Upcoming mints - real collections, but the mint countdowns/prices are game
// flavor. `mintInHours` is hours-from-first-load; the launch feed turns it into
// a live "Mints in Xd Yh" countdown and keeps the list sorted by soonest.
// Each upcoming mint has a `manager` (collab/partnerships contact). Monkey Hood
// uses its real X handle; the rest are demo contacts derived from the project.
export const NFT_UPCOMING_MINTS = [
  { name: "Monkey Hood", slug: "monkeyhood", img: "/nft/monkeyhood.png", url: "https://opensea.io/collection/monkeyhood", mintInHours: 3, price: "0.01 ETH", supply: 5000, hype: "hot", manager: { name: "Milo", role: "Collab Manager", x: "monkeyhoodnft", discord: "monkeyhood" } },
  { name: "Spudscouts", slug: "spudscouts", img: "/nft/spudscouts.avif", mintInHours: 5, price: "0.01 ETH", supply: 4444, hype: "hot", manager: { name: "Tater", role: "Collab Manager", x: "spudscouts", discord: "spudscouts" } },
  { name: "Pixel Hood Clan", slug: "pixel-hood-clan", img: "/nft/pixel-hood-clan.avif", mintInHours: 12, price: "0.006 ETH", supply: 5555, hype: "hot", manager: { name: "Vex", role: "Partnerships", x: "pixelhoodclan", discord: "pixelhood" } },
  { name: "Chibi Hood", slug: "chibihood", img: "/nft/chibihood.webp", mintInHours: 22, price: "Free", supply: 8000, hype: "raffle", manager: { name: "Yuki", role: "Collab Manager", x: "chibihood", discord: "chibihood" } },
  { name: "Roobears", slug: "roobears-888646428", img: "/nft/roobears.avif", mintInHours: 34, price: "0.015 ETH", supply: 3333, hype: "allowlist", manager: { name: "Bruno", role: "Community Lead", x: "roobearsnft", discord: "roobears" } },
  { name: "Slobos", slug: "slobos-542906720", img: "/nft/slobos.avif", mintInHours: 50, price: "0.005 ETH", supply: 10000, hype: "hot", manager: { name: "Sloane", role: "Collab Manager", x: "slobosnft", discord: "slobos" } },
  { name: "Much Wow", slug: "much-wow-nft", img: "/nft/much-wow.webp", mintInHours: 68, price: "Free", supply: 9999, hype: "raffle", manager: { name: "Rex", role: "Partnerships", x: "muchwownft", discord: "muchwow" } },
  { name: "Nyro", slug: "nyro-633460873", img: "/nft/nyro.avif", mintInHours: 90, price: "0.02 ETH", supply: 2222, hype: "allowlist", manager: { name: "Kai", role: "Collab Manager", x: "nyronft", discord: "nyro" } },
  { name: "Robinturtle", slug: "robinturtle-170675940", img: "/nft/robinturtle.avif", mintInHours: 115, price: "0.009 ETH", supply: 4200, hype: "hot", manager: { name: "Shelly", role: "Community Lead", x: "robinturtlenft", discord: "robinturtle" } },
  { name: "Hood Boyz", slug: "hood-boyz-380716183", img: "/nft/hood-boyz.avif", mintInHours: 140, price: "0.008 ETH", supply: 6969, hype: "allowlist", manager: { name: "Rico", role: "Collab Manager", x: "hoodboyznft", discord: "hoodboyz" } },
].map((n) => ({ ...n, url: n.url ?? opensea(n.slug) }));

export const QUESTS_POOL = [
  {
    id: "stake-base",
    title: "Power up your base",
    detail: "Stake 50 Robin Coins into Robinhood Earn to boost your town.",
    reward: 40,
    xp: 20,
    type: "stake",
    target: 50,
  },
  {
    id: "swap-before-rug",
    title: "Beat the rug pull",
    detail: "Swap out of CASHCAT before the next rug-pull event lands.",
    reward: 35,
    xp: 25,
    type: "swap",
    target: 1,
  },
  {
    id: "dodge-rugs",
    title: "Dodge & stack",
    detail: "Score 300+ in the Rug Runner.",
    reward: 45,
    xp: 30,
    type: "runner",
    target: 300,
  },
  {
    id: "scout-viral",
    title: "Scout the viral chart",
    detail: "Check the Trending tab for the day's biggest movers.",
    reward: 15,
    xp: 10,
    type: "scout",
    target: 1,
  },
];
