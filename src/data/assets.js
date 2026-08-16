// Flavor content grounded in the real Robinhood Chain launch (July 2026):
// an Ethereum L2 on Arbitrum Orbit, Classic Stock Tokens, Robinhood Earn (~7% yield),
// and CASHCAT as the breakout memecoin. NFT names, slugs and logo images are the real
// collections from OpenSea's Robinhood-chain "Discover" page (images saved in /public/nft).
// The in-game economy itself is a sandboxed simulation, not real trading.

const UNISWAP_SWAP = "https://app.uniswap.org/swap";
// Uniswap's bare /swap route is the same page for every token, so it tells you
// nothing about the one you clicked. Anything with a cgId gets its own page.
const cg = (id) => `https://www.coingecko.com/en/coins/${id}`;

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
    base: 77, kind: "crypto", cgId: "solana", tradeUrl: cg("solana"),
  },
  DOGE: {
    symbol: "DOGE", name: "Dogecoin", color: "#c2a633", img: "/coin/doge.png",
    base: 0.072, kind: "meme", cgId: "dogecoin", tradeUrl: cg("dogecoin"),
  },
  // Robinhood Markets itself, via its tokenized stock - so the town shows the
  // price of the company it is named after.
  HOOD: {
    symbol: "HOODx", name: "Robinhood Markets", color: "#00C805", img: "/logo-icon.png",
    base: 96, kind: "stock", cgId: "robinhood-xstock", tradeUrl: cg("robinhood-xstock"),
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
  // Robinhood's Classic Stock Tokens are listed on CoinGecko, so these carry
  // real prices instead of the simulated baseline.
  NVDA: {
    symbol: "NVDAx", name: "NVIDIA Stock Token", color: "#76b900", img: "/coin/nvda.png",
    base: 205, kind: "stock", cgId: "nvidia-robinhood-tokenized-stock",
    tradeUrl: cg("nvidia-robinhood-tokenized-stock"),
  },
  AAPL: {
    symbol: "AAPLx", name: "Apple Stock Token", color: "#ffffff", img: "/coin/aapl.png",
    base: 327, kind: "stock", cgId: "apple-robinhood-tokenized-stock",
    tradeUrl: cg("apple-robinhood-tokenized-stock"),
  },
  TSLA: {
    symbol: "TSLAx", name: "Tesla Stock Token", color: "#e82127", img: "/coin/tsla.png",
    base: 377, kind: "stock", cgId: "tesla-robinhood-tokenized-stock",
    tradeUrl: cg("tesla-robinhood-tokenized-stock"),
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

// Upcoming mints. Two kinds of row live here:
//
//   1. Curated demo rows, where `mintInHours` is hours-from-first-load and the
//      launch feed turns it into a live "Mints in Xd Yh" countdown. The
//      countdown, price, supply and manager contact are game flavor.
//   2. `tba: true` rows - real projects that have announced Robinhood but not a
//      date. These render "Mint date TBA" rather than a fabricated countdown,
//      carry the project's real X handle as the contact, and only state supply
//      or a "Free" price where the project itself does. Where the collection
//      already exists on OpenSea the slug resolves to it, so the live feed
//      overlays its real floor, artwork and link.
//
// The list is sorted dated-first, then TBA rows by floor.
export const NFT_UPCOMING_MINTS = [
  // Announced for Robinhood but pre-reveal: no OpenSea collection, no mint date,
  // price or supply published yet (the account has posted nothing). `tba` makes
  // the row say so instead of inventing a countdown for a real project - drop
  // the flag and fill in the real numbers once they announce.
  { name: "Nibblins", slug: "nibblins", img: "/nft/nibblins.jpg", url: "https://x.com/NibblinsHQ", tba: true, mintInHours: 1, price: "TBA", supply: null, hype: "hot", manager: { name: "Nibblins", role: "Official", x: "NibblinsHQ" } },
  // Announced for Robinhood, pre-reveal: resolved to a real OpenSea collection
  // where one exists, otherwise the row links to the project X account. Supply and
  // "Free" are only set where the project states them; everything else stays TBA.
  { name: "NTRPY", slug: "ntrpy", img: "/nft/0xntrpy.jpg", url: "https://opensea.io/collection/ntrpy", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "NTRPY", role: "Official", x: "0xNTRPY" } }, // live floor 0.42
  { name: "P.K.O", slug: "p-k-o", img: "/nft/pko-nft.jpg", url: "https://opensea.io/collection/p-k-o", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "P.K.O", role: "Official", x: "pko_nft" } }, // live floor 0.25
  { name: "Stu the Neet", slug: "stu-the-neet", img: "/nft/neetthestu.jpg", url: "https://opensea.io/collection/stu-the-neet", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "Stu the Neet", role: "Official", x: "NeetTheStu" } }, // live floor 0.19
  { name: "Echoes within Mūori", slug: "muorifield", img: "/nft/muorifield.jpg", url: "https://opensea.io/collection/muorifield", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "Echoes within Mūori", role: "Official", x: "MuoriField" } }, // live floor 0.143
  { name: "Null Saints", slug: "null-saints", img: "/nft/nullsaintsxyz.jpg", url: "https://opensea.io/collection/null-saints", tba: true, mintInHours: 1, price: "TBA", supply: 10000, manager: { name: "Null Saints", role: "Official", x: "NullSaintsxyz" } }, // live floor 0.04
  { name: "Bulls Runners", slug: "bulls-runners", img: "/nft/bullsrunners.jpg", url: "https://opensea.io/collection/bulls-runners", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "Bulls Runners", role: "Official", x: "BullsRunners" } }, // live floor 0.017
  { name: "HoodBirds", slug: "hoodbirds", img: "/nft/hoodbirds.jpg", url: "https://opensea.io/collection/hoodbirds", tba: true, mintInHours: 1, price: "Free", supply: null, manager: { name: "HoodBirds", role: "Official", x: "Hoodbirds_" } }, // live floor 0.01
  { name: "KittiHood", slug: "kittihood", img: "/nft/kittihoodpix.jpg", url: "https://opensea.io/collection/kittihood", tba: true, mintInHours: 1, price: "Free", supply: null, manager: { name: "KittiHood", role: "Official", x: "KittiHoodpix" } }, // live floor 0.01
  { name: "Retail Shrooms", slug: "retail-shrooms", img: "/nft/retailshrooms.jpg", url: "https://opensea.io/collection/retail-shrooms", tba: true, mintInHours: 1, price: "TBA", supply: 888, manager: { name: "Retail Shrooms", role: "Official", x: "RetailShrooms" } }, // live floor 0.0094
  { name: "Zero To Hero Academy", slug: "zero-to-hero-academy", img: "/nft/zthacademy.jpg", url: "https://opensea.io/collection/zero-to-hero-academy", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "Zero To Hero Academy", role: "Official", x: "ZTHAcademy" } }, // live floor 0.0064
  { name: "XCOPUNKS", slug: "xcopunks", img: "/nft/xcopunks.jpg", url: "https://opensea.io/collection/xcopunks", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "XCOPUNKS", role: "Official", x: "XCOPUNKS" } }, // live floor 0.0016161
  { name: "#Suit", slug: "suit", img: "/nft/suitsonhood.jpg", url: "https://opensea.io/collection/suit", tba: true, mintInHours: 1, price: "Free", supply: null, manager: { name: "#Suit", role: "Official", x: "SuitsOnHood" } },
  { name: "Alpha Simps", slug: "alpha-simps", img: "/nft/alphasimpsrh.jpg", url: "https://opensea.io/collection/alpha-simps", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "Alpha Simps", role: "Official", x: "alphasimpsRH" } },
  { name: "Big D", slug: "big-d", img: "/nft/bigd-team.jpg", url: "https://opensea.io/collection/big-d", tba: true, mintInHours: 1, price: "TBA", supply: 6969, manager: { name: "Big D", role: "Official", x: "BigD_team" } },
  { name: "Biwls", slug: "biwls", img: "/nft/biwlsxyz.jpg", url: "https://opensea.io/collection/biwls", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "Biwls", role: "Official", x: "biwlsxyz" } },
  { name: "BLNK", slug: "blnk", img: "/nft/blnkinc.jpg", url: "https://opensea.io/collection/blnk", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "BLNK", role: "Official", x: "BlnkINC" } },
  { name: "bolds", slug: "bolds", img: "/nft/boldpfps.jpg", url: "https://opensea.io/collection/bolds", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "bolds", role: "Official", x: "boldpfps" } },
  { name: "Chog", slug: "chog", img: "/nft/chognft.jpg", url: "https://opensea.io/collection/chog", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "Chog", role: "Official", x: "ChogNFT" } },
  { name: "Crocs", slug: "crocs", img: "/nft/crocpadrbh.jpg", url: "https://opensea.io/collection/crocs", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "Crocs", role: "Official", x: "CrocpadRBH" } },
  { name: "culvers", slug: "0xculvers", img: "/nft/0xculvers.jpg", url: "https://x.com/0xculvers", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "culvers", role: "Official", x: "0xculvers" } }, // no OpenSea collection yet - links to X
  { name: "FleurHood", slug: "fleurhood", img: "/nft/fleurhood.jpg", url: "https://opensea.io/collection/fleurhood", tba: true, mintInHours: 1, price: "Free", supply: 972, manager: { name: "FleurHood", role: "Official", x: "fleurhood" } },
  { name: "Ghost Cats", slug: "ghost-cats", img: "/nft/ghostcatsrh.jpg", url: "https://opensea.io/collection/ghost-cats", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "Ghost Cats", role: "Official", x: "GhostCatsRH" } },
  { name: "Hooded", slug: "hooded", img: "/nft/hoodednft.jpg", url: "https://opensea.io/collection/hooded", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "Hooded", role: "Official", x: "HoodedNFT" } },
  { name: "HoodTangs", slug: "hoodtangs", img: "/nft/hoodtangs.jpg", url: "https://opensea.io/collection/hoodtangs", tba: true, mintInHours: 1, price: "TBA", supply: 694, manager: { name: "HoodTangs", role: "Official", x: "HoodTangs" } },
  { name: "iri", slug: "iri", img: "/nft/irigenerative.jpg", url: "https://opensea.io/collection/iri", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "iri", role: "Official", x: "irigenerative" } },
  { name: "Kupo", slug: "kupo", img: "/nft/kuponfts.jpg", url: "https://opensea.io/collection/kupo", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "Kupo", role: "Official", x: "KupoNFTs" } },
  { name: "lostpixelgems.space", slug: "lostpixelgems-space", img: "/nft/lpc-nfts.jpg", url: "https://opensea.io/collection/lostpixelgems-space", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "lostpixelgems.space", role: "Official", x: "LPC_NFTS" } },
  { name: "Orangu", slug: "orangu", img: "/nft/orangunation.jpg", url: "https://opensea.io/collection/orangu", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "Orangu", role: "Official", x: "OranguNation" } },
  { name: "PU-X", slug: "pu-x", img: "/nft/parallelunix.jpg", url: "https://opensea.io/collection/pu-x", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "PU-X", role: "Official", x: "ParallelUniX" } },
  { name: "RobinWifHat, Inc", slug: "robinwifhat-inc", img: "/nft/robinwifhat.jpg", url: "https://opensea.io/collection/robinwifhat-inc", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "RobinWifHat, Inc", role: "Official", x: "RobinWifHat" } },
  { name: "Sindicat", slug: "sindicat", img: "/nft/sindicatgame.jpg", url: "https://opensea.io/collection/sindicat", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "Sindicat", role: "Official", x: "Sindicatgame" } },
  { name: "THE BUFOS", slug: "the-bufos", img: "/nft/thebufos.jpg", url: "https://opensea.io/collection/the-bufos", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "THE BUFOS", role: "Official", x: "THEBUFOS" } },
  { name: "The Cult of LUCI - By BeautiFuK", slug: "beautifukx", img: "/nft/beautifukx.jpg", url: "https://x.com/BeautifuKX", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "The Cult of LUCI - By BeautiFuK", role: "Official", x: "BeautifuKX" } }, // no OpenSea collection yet - links to X
  { name: "The Feline Reserve", slug: "the-feline-reserve", img: "/nft/felinereserve.jpg", url: "https://opensea.io/collection/the-feline-reserve", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "The Feline Reserve", role: "Official", x: "FelineReserve" } },
  { name: "The Saudis", slug: "the-saudis", img: "/nft/thesaudisnft.jpg", url: "https://opensea.io/collection/the-saudis", tba: true, mintInHours: 1, price: "TBA", supply: 5555, manager: { name: "The Saudis", role: "Official", x: "TheSaudisNFT" } },
  { name: "Volt", slug: "volt", img: "/nft/poweredbyvolt.jpg", url: "https://opensea.io/collection/volt", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "Volt", role: "Official", x: "PoweredByVolt" } },
  { name: "WEIRDOS", slug: "weirdos", img: "/nft/weirdos-art.jpg", url: "https://opensea.io/collection/weirdos", tba: true, mintInHours: 1, price: "TBA", supply: null, manager: { name: "WEIRDOS", role: "Official", x: "weirdos_art" } },
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
