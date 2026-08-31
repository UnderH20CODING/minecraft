/**
 * PLACEHOLDER DATA — NOT VERIFIED AGAINST MCTIERS.COM.
 *
 * This sandbox's network policy blocks outbound access to mctiers.com (and
 * its known mirrors), so these tiers were NOT pulled from the live site and
 * are known to be inaccurate. They exist only so the app has something to
 * run against. Replace the `tiers` values below with real data copied from
 * https://mctiers.com/rankings/<mode> (see the Network tab / JSON response),
 * or use the in-app "Add custom player" form to fix entries one at a time.
 *
 * Format follows MCTiers.com's conventions: game modes like Vanilla, UHC,
 * Pot, NethPot, Sword, Axe, SMP; tiers HT1 "High Tier 1" down to LT5
 * "Low Tier 5".
 */

const TIER_ORDER = ["HT1", "LT1", "HT2", "LT2", "HT3", "LT3", "HT4", "LT4", "HT5", "LT5"];

// Rough "power score" per tier, used only for the fun end-of-draft power ranking.
const TIER_SCORE = {
  HT1: 15, LT1: 12,
  HT2: 9,  LT2: 7,
  HT3: 5,  LT3: 4,
  HT4: 3,  LT4: 2,
  HT5: 1.5, LT5: 1,
};

const GAME_MODES = ["Overall", "Vanilla", "UHC", "Pot", "NethPot", "Sword", "Axe", "SMP"];

const PLAYERS = [
  { name: "Technoblade", tiers: { Overall: "HT1", Vanilla: "HT1", UHC: "HT1", Pot: "HT1", NethPot: "HT1", Sword: "HT1", Axe: "HT1", SMP: "HT1" } },
  { name: "HBomb94", tiers: { Overall: "HT1", Vanilla: "HT1", UHC: "HT1", Pot: "HT2", NethPot: "HT2", Sword: "HT1", Axe: "LT1", SMP: "HT2" } },
  { name: "Quig", tiers: { Overall: "HT1", Vanilla: "HT2", UHC: "HT1", Pot: "HT1", NethPot: "HT1", Sword: "LT1", Axe: "HT1", SMP: "LT1" } },
  { name: "Sharky", tiers: { Overall: "HT1", Vanilla: "LT1", UHC: "HT2", Pot: "HT1", NethPot: "HT1", Sword: "HT2", Axe: "HT1", SMP: "LT2" } },
  { name: "Vezalii", tiers: { Overall: "LT1", Vanilla: "HT1", UHC: "LT1", Pot: "LT1", NethPot: "HT2", Sword: "HT1", Axe: "LT1", SMP: "HT2" } },
  { name: "Dynamic", tiers: { Overall: "LT1", Vanilla: "LT2", UHC: "HT2", Pot: "LT1", NethPot: "LT1", Sword: "LT2", Axe: "HT2", SMP: "LT1" } },
  { name: "EddieJuice", tiers: { Overall: "LT1", Vanilla: "HT2", UHC: "LT1", Pot: "HT2", NethPot: "LT1", Sword: "HT2", Axe: "LT2", SMP: "HT3" } },
  { name: "Barrett", tiers: { Overall: "LT1", Vanilla: "LT1", UHC: "LT2", Pot: "HT2", NethPot: "LT2", Sword: "LT1", Axe: "LT2", SMP: "HT2" } },
  { name: "Innit", tiers: { Overall: "LT1", Vanilla: "HT2", UHC: "HT2", Pot: "LT2", NethPot: "HT2", Sword: "LT2", Axe: "LT1", SMP: "LT2" } },
  { name: "Delu", tiers: { Overall: "LT1", Vanilla: "LT2", UHC: "LT1", Pot: "LT2", NethPot: "HT2", Sword: "LT2", Axe: "LT1", SMP: "LT2" } },
  { name: "LSK", tiers: { Overall: "HT2", Vanilla: "LT1", UHC: "HT3", Pot: "LT2", NethPot: "LT2", Sword: "LT1", Axe: "LT2", SMP: "HT3" } },
  { name: "ZMPZ", tiers: { Overall: "HT2", Vanilla: "HT2", UHC: "HT2", Pot: "LT2", NethPot: "LT2", Sword: "HT2", Axe: "LT2", SMP: "LT2" } },
  { name: "Amerika", tiers: { Overall: "HT2", Vanilla: "LT2", UHC: "HT3", Pot: "HT2", NethPot: "HT2", Sword: "LT2", Axe: "HT2", SMP: "LT2" } },
  { name: "Karl_Fransis", tiers: { Overall: "HT2", Vanilla: "HT3", UHC: "LT2", Pot: "HT2", NethPot: "LT2", Sword: "HT3", Axe: "LT2", SMP: "HT3" } },
  { name: "Bassari", tiers: { Overall: "HT2", Vanilla: "LT2", UHC: "HT2", Pot: "LT2", NethPot: "HT2", Sword: "LT2", Axe: "HT2", SMP: "LT2" } },
  { name: "Freezy", tiers: { Overall: "HT2", Vanilla: "HT2", UHC: "LT2", Pot: "HT3", NethPot: "LT2", Sword: "HT2", Axe: "LT2", SMP: "HT3" } },
  { name: "Meesalikeu", tiers: { Overall: "LT2", Vanilla: "LT2", UHC: "HT3", Pot: "LT2", NethPot: "LT2", Sword: "LT3", Axe: "HT2", SMP: "LT2" } },
  { name: "Emblue", tiers: { Overall: "LT2", Vanilla: "HT3", UHC: "LT2", Pot: "LT2", NethPot: "HT3", Sword: "LT2", Axe: "LT2", SMP: "LT3" } },
  { name: "Whitesushii", tiers: { Overall: "LT2", Vanilla: "LT2", UHC: "LT2", Pot: "HT3", NethPot: "LT3", Sword: "LT2", Axe: "LT3", SMP: "LT2" } },
  { name: "Speed", tiers: { Overall: "LT2", Vanilla: "HT2", UHC: "LT3", Pot: "LT2", NethPot: "LT2", Sword: "HT2", Axe: "LT2", SMP: "LT3" } },
  { name: "W3nn", tiers: { Overall: "LT2", Vanilla: "LT3", UHC: "HT3", Pot: "LT2", NethPot: "HT3", Sword: "LT3", Axe: "LT2", SMP: "LT3" } },
  { name: "EndCity", tiers: { Overall: "LT2", Vanilla: "LT2", UHC: "LT2", Pot: "LT3", NethPot: "LT2", Sword: "LT2", Axe: "LT3", SMP: "HT3" } },
  { name: "Sniping", tiers: { Overall: "HT2", Vanilla: "LT1", UHC: "HT2", Pot: "HT2", NethPot: "LT1", Sword: "LT2", Axe: "HT2", SMP: "LT2" } },
  { name: "Tommy_", tiers: { Overall: "HT3", Vanilla: "LT3", UHC: "HT3", Pot: "LT3", NethPot: "LT3", Sword: "HT3", Axe: "LT3", SMP: "LT2" } },
  { name: "Ph1LzA", tiers: { Overall: "HT3", Vanilla: "HT3", UHC: "LT3", Pot: "LT3", NethPot: "LT3", Sword: "LT3", Axe: "LT3", SMP: "HT2" } },
  { name: "Purpled", tiers: { Overall: "LT3", Vanilla: "LT3", UHC: "LT3", Pot: "HT4", NethPot: "LT3", Sword: "LT4", Axe: "LT3", SMP: "LT2" } },
  { name: "Antfrost", tiers: { Overall: "LT3", Vanilla: "HT4", UHC: "LT4", Pot: "LT3", NethPot: "HT4", Sword: "LT4", Axe: "LT3", SMP: "LT3" } },
  { name: "Quackity", tiers: { Overall: "LT4", Vanilla: "LT4", UHC: "HT4", Pot: "LT4", NethPot: "LT4", Sword: "LT4", Axe: "LT4", SMP: "LT3" } },
  { name: "Wilbur_Soot", tiers: { Overall: "LT4", Vanilla: "LT4", UHC: "LT4", Pot: "LT4", NethPot: "LT4", Sword: "HT5", Axe: "LT4", SMP: "LT3" } },
  { name: "Dream", tiers: { Overall: "HT2", Vanilla: "HT2", UHC: "HT3", Pot: "LT2", NethPot: "LT2", Sword: "HT3", Axe: "HT2", SMP: "HT1" } },
  { name: "GeorgeNotFound", tiers: { Overall: "LT4", Vanilla: "LT4", UHC: "LT4", Pot: "HT5", NethPot: "LT4", Sword: "LT5", Axe: "LT4", SMP: "LT3" } },
  { name: "Sapnap", tiers: { Overall: "HT3", Vanilla: "LT3", UHC: "HT3", Pot: "LT3", NethPot: "HT3", Sword: "LT3", Axe: "LT3", SMP: "HT2" } },
  { name: "Fundy", tiers: { Overall: "LT4", Vanilla: "HT4", UHC: "LT4", Pot: "LT4", NethPot: "LT4", Sword: "LT4", Axe: "HT4", SMP: "LT3" } },
  { name: "Skeppy", tiers: { Overall: "LT3", Vanilla: "LT3", UHC: "HT4", Pot: "HT3", NethPot: "LT3", Sword: "HT4", Axe: "LT3", SMP: "LT3" } },
  { name: "BadBoyHalo", tiers: { Overall: "LT4", Vanilla: "LT4", UHC: "LT4", Pot: "LT4", NethPot: "HT5", Sword: "LT4", Axe: "LT4", SMP: "LT4" } },
  { name: "Tubbo", tiers: { Overall: "LT3", Vanilla: "HT3", UHC: "LT3", Pot: "LT3", NethPot: "LT3", Sword: "LT3", Axe: "LT3", SMP: "LT2" } },
  { name: "Ranboo", tiers: { Overall: "LT4", Vanilla: "LT4", UHC: "HT4", Pot: "LT4", NethPot: "LT4", Sword: "LT4", Axe: "LT4", SMP: "LT3" } },
  { name: "Awesamdude", tiers: { Overall: "LT4", Vanilla: "LT4", UHC: "LT4", Pot: "HT4", NethPot: "LT4", Sword: "HT4", Axe: "LT4", SMP: "LT3" } },
  { name: "Nihachu", tiers: { Overall: "LT5", Vanilla: "LT5", UHC: "LT5", Pot: "LT5", NethPot: "LT5", Sword: "LT5", Axe: "LT5", SMP: "LT4" } },
  { name: "Slime", tiers: { Overall: "LT3", Vanilla: "LT3", UHC: "LT3", Pot: "LT3", NethPot: "LT3", Sword: "LT3", Axe: "LT3", SMP: "LT2" } },
];

// Sort tiers helper: lower index = better tier.
function tierRank(tier) {
  const idx = TIER_ORDER.indexOf(tier);
  return idx === -1 ? TIER_ORDER.length : idx;
}
