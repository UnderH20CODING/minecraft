/**
 * Real player tier data pulled from the live MCTiers.com API (v2):
 *   GET https://mctiers.com/api/v2/mode/overall?count=50&from=0
 *
 * This is a snapshot (top 50 players by overall points) fetched by the user
 * directly since this sandbox's network policy blocks mctiers.com. Tiers
 * will drift over time as MCTiers re-tests players — re-fetch that endpoint
 * (optionally with `&from=50`, `&from=100`, ... to page further down the
 * list) and re-run the conversion if you want to refresh this file, or just
 * use the in-app "Add custom player" form to add/update individual players.
 *
 * Tier format: HT1 "High Tier 1" (best) down to LT5 "Low Tier 5" (worst).
 * Gamemodes: Vanilla, UHC, Pot, NethPot, Sword, Axe, SMP, Mace.
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

const GAME_MODES = ["Overall", "Vanilla", "UHC", "Pot", "NethPot", "Sword", "Axe", "SMP", "Mace"];

const PLAYERS = [
  {"uuid":"d219c8ee-d32e-4da2-b22e-0aa69d36c88a","name":"Marlowww","region":"NA","points":450,"tiers":{"Vanilla":"HT1","UHC":"LT1","Axe":"LT1","Pot":"HT1","NethPot":"HT1","SMP":"HT1","Mace":"HT1","Sword":"HT1"}},
  {"uuid":"06ec3577-3299-45fa-bbdf-613b1f86c8ab","name":"ItzRealMe","region":"NA","points":330,"tiers":{"Sword":"HT3","Pot":"HT1","Vanilla":"HT1","UHC":"LT2","NethPot":"HT1","SMP":"HT1","Mace":"LT2","Axe":"LT2"}},
  {"uuid":"7e8a77ca-daf1-4224-ae1d-2df8bab1eccb","name":"coldified","region":"EU","points":326,"tiers":{"SMP":"HT1","NethPot":"LT2","Pot":"LT1","Sword":"LT1","Vanilla":"LT3","UHC":"HT1","Axe":"LT1","Mace":"LT1"}},
  {"uuid":"ebd7af32-759e-41e2-b227-9eeb8576d609","name":"Swight","region":"NA","points":290,"tiers":{"Mace":"LT2","Vanilla":"LT3","UHC":"HT1","Axe":"HT1","SMP":"HT1","Pot":"LT2","NethPot":"HT2","Sword":"LT2"}},
  {"uuid":"4004ec59-536b-4f8a-b829-ee8c91f3bd86","name":"janekv","region":"EU","points":260,"tiers":{"Pot":"HT1","UHC":"LT2","Vanilla":"HT4","Mace":"LT3","Sword":"HT2","Axe":"LT2","SMP":"HT1","NethPot":"HT1"}},
  {"uuid":"653bb064-799a-4bc7-9835-83cce16ddd83","name":"BlvckWlf","region":"EU","points":226,"tiers":{"Axe":"HT2","Sword":"HT3","NethPot":"LT3","Vanilla":"LT3","SMP":"HT1","Pot":"LT2","UHC":"HT1","Mace":"HT2"}},
  {"uuid":"f4aa6afa-d90c-4dd2-97b2-ed453b8c99fe","name":"Kylaz","region":"NA","points":226,"tiers":{"SMP":"HT3","NethPot":"HT1","Sword":"HT1","UHC":"LT3","Pot":"HT1","Axe":"LT2","Vanilla":"LT3"}},
  {"uuid":"b86e6260-895d-443d-8f00-a808eea23294","name":"ninorc15","region":"EU","points":196,"tiers":{"Pot":"LT2","Axe":"HT3","Sword":"LT2","Mace":"LT2","Vanilla":"LT3","NethPot":"LT2","SMP":"HT3","UHC":"HT3"}},
  {"uuid":"72b76cea-3abb-4ef2-b4b4-bd6786ec921e","name":"Lurrn","region":"EU","points":186,"tiers":{"Axe":"LT4","Vanilla":"HT2","UHC":"LT3","Sword":"LT2","Pot":"HT1","NethPot":"HT1"}},
  {"uuid":"746db6cd-f626-4a91-902f-43e34867d93a","name":"Arsakha","region":"ME","points":177,"tiers":{"NethPot":"LT3","Mace":"LT3","UHC":"HT3","SMP":"HT1","Sword":"LT3","Pot":"HT3","Vanilla":"LT3","Axe":"HT3"}},
  {"uuid":"ed42d02b-cc94-49b5-ae07-b169b7cefb97","name":"yMiau","region":"EU","points":177,"tiers":{"Vanilla":"LT3","Pot":"LT3","Sword":"HT3","Axe":"HT2","NethPot":"LT3","Mace":"LT3","UHC":"HT1","SMP":"LT1"}},
  {"uuid":"96eafb3d-e5df-4487-a314-e8ee0aba6c80","name":"Juan_Clean","region":"NA","points":165,"tiers":{"Sword":"HT3","UHC":"HT1","SMP":"LT3","NethPot":"LT3","Axe":"LT1","Pot":"LT3"}},
  {"uuid":"bb21bd55-eb29-48c3-87bc-865b5749714b","name":"Deivi_17","region":"EU","points":165,"tiers":{"Vanilla":"LT4","SMP":"HT3","Mace":"HT4","NethPot":"HT1","UHC":"LT3","Pot":"LT1","Sword":"LT2","Axe":"LT4"}},
  {"uuid":"bb4f57a3-50bc-461c-a28f-88a36e6d0aaa","name":"Freekee_Fang","region":"NA","points":165,"tiers":{"Mace":"LT2","SMP":"LT1","NethPot":"LT2","Vanilla":"HT3","Axe":"HT3","Sword":"LT2","UHC":"HT2","Pot":"HT3"}},
  {"uuid":"ad00f5b8-1c24-4a79-b0f4-f4351154af3c","name":"Legendarryy","region":"NA","points":162,"tiers":{"SMP":"HT1","Vanilla":"LT3","NethPot":"HT3","UHC":"HT2","Sword":"LT2","Pot":"LT2","Axe":"HT3","Mace":"LT3"}},
  {"uuid":"4245d301-d6e8-4268-bc4c-dc88270e0fcb","name":"Spawnplayer","region":"NA","points":152,"tiers":{"NethPot":"HT3","Pot":"HT3","Vanilla":"LT3","UHC":"HT2","Mace":"HT4","Sword":"LT2","SMP":"HT1","Axe":"HT3"}},
  {"uuid":"aa79513a-23c4-4b3b-95f8-2b3944fe01ea","name":"DivineRevival","region":"EU","points":146,"tiers":{"UHC":"HT3","Pot":"HT3","NethPot":"HT3","Sword":"LT2","Mace":"HT3","Axe":"LT2","SMP":"HT1","Vanilla":"LT3"}},
  {"uuid":"a59dc025-bb66-4129-bc7c-cd9cce9f2e79","name":"sashia2m","region":"EU","points":144,"tiers":{"NethPot":"HT1","SMP":"LT3","UHC":"LT3","Mace":"LT4","Axe":"HT3","Sword":"LT3","Pot":"LT1"}},
  {"uuid":"c20d2591-d405-4872-9dbe-989a0ecc6d34","name":"Frxnkey","region":"NA","points":143,"tiers":{"Vanilla":"HT2","Axe":"HT2","UHC":"HT1","Sword":"HT4","Pot":"LT3","SMP":"LT4","NethPot":"LT3"}},
  {"uuid":"ae851e5a-0bab-4c1d-b20c-269fdc57d275","name":"Hosthan","region":"EU","points":142,"tiers":{"Sword":"LT2","NethPot":"LT3","UHC":"HT1","Pot":"LT3","Vanilla":"LT3","Axe":"HT2","SMP":"LT3"}},
  {"uuid":"07009f1a-a60f-4485-90fb-eba801a5f3d0","name":"Inapplicable","region":"EU","points":140,"tiers":{"Pot":"HT1","Sword":"LT2","Vanilla":"HT1"}},
  {"uuid":"4bb70487-9146-4fc7-89ec-971808e414b9","name":"michaelcycle00","region":"NA","points":140,"tiers":{"Pot":"LT2","Vanilla":"HT1","Sword":"HT1"}},
  {"uuid":"92cf161d-5e56-4c95-94f9-c0764681b0fb","name":"DiViiN3__TgsHalo","region":"NA","points":137,"tiers":{"UHC":"LT3","Pot":"LT1","Sword":"LT2","Vanilla":"LT3","Axe":"LT4","SMP":"HT2","NethPot":"LT2"}},
  {"uuid":"05aee938-19b6-41a9-a3d2-8470d597cdf9","name":"Flowtives","region":"NA","points":136,"tiers":{"Mace":"LT3","UHC":"HT1","Axe":"LT3","SMP":"HT3","Pot":"HT3","NethPot":"LT2","Vanilla":"LT3","Sword":"HT3"}},
  {"uuid":"ec1635cd-9a24-49d2-a2d0-368b648e5cdb","name":"Dishwasher1221","region":"SA","points":136,"tiers":{"UHC":"HT3","Sword":"HT4","Pot":"LT3","NethPot":"LT3","Vanilla":"LT3","SMP":"LT3","Axe":"HT4"}},
  {"uuid":"7f232535-593a-4be4-950a-b9b91bec1982","name":"SkywarsDaniel_12","region":"EU","points":135,"tiers":{"Sword":"LT2","UHC":"HT1","NethPot":"LT3","Axe":"LT1"}},
  {"uuid":"423e06b9-1073-433a-a7bd-28db129a6ffe","name":"Svoen","region":"EU","points":131,"tiers":{"Axe":"LT3","Vanilla":"LT3","Sword":"LT2","Pot":"HT3","SMP":"HT3","Mace":"HT4","UHC":"LT3","NethPot":"LT3"}},
  {"uuid":"3421e1a5-e89d-4994-b0cb-15bfbde70170","name":"TryH4rdd","region":"EU","points":130,"tiers":{"Pot":"HT1","Vanilla":"LT3","Sword":"HT1"}},
  {"uuid":"9e6263cc-1027-413f-a568-5588d4cca022","name":"ViviKaiMC","region":"NA","points":130,"tiers":{"SMP":"LT3","Axe":"HT1","UHC":"HT1"}},
  {"uuid":"ff7e19bd-4311-4993-85b8-8f1ca009e7bc","name":"Prusso","region":"NA","points":127,"tiers":{"Axe":"LT3","UHC":"LT2","NethPot":"HT3","Pot":"HT2","Sword":"LT1","Vanilla":"LT3","SMP":"LT3"}},
  {"uuid":"ff41b8ac-6e76-4b87-961b-983b0e359e8e","name":"Reflex50","region":"EU","points":126,"tiers":{"NethPot":"HT1","SMP":"LT3","UHC":"LT3","Axe":"HT4","Vanilla":"LT3","Sword":"HT2","Pot":"HT3"}},
  {"uuid":"5aa6827e-5977-4c3d-9e6b-f7a87080ff02","name":"ShadowZeuss","region":"NA","points":125,"tiers":{"Vanilla":"LT3","Mace":"HT4","UHC":"HT3","Sword":"LT3","Pot":"LT3","Axe":"LT1","NethPot":"LT3","SMP":"LT3"}},
  {"uuid":"57816331-5e7a-4f36-9e6d-02f12168f8cd","name":"Evantii","region":"NA","points":124,"tiers":{"Sword":"LT3","SMP":"LT3","UHC":"LT3","Pot":"LT2","Vanilla":"HT1","NethPot":"LT3","Mace":"LT3","Axe":"LT3"}},
  {"uuid":"1f92d0b8-0507-41a6-b6aa-d612ab55a9e8","name":"360Mall","region":"AS","points":122,"tiers":{"Axe":"HT3","SMP":"LT2","Vanilla":"LT3","UHC":"LT2","Mace":"LT3","Sword":"HT3","Pot":"HT2","NethPot":"LT3"}},
  {"uuid":"f887648c-96a6-4441-876e-6aa7aba4cc6a","name":"SixtyFive65","region":"AU","points":121,"tiers":{"SMP":"LT1","Axe":"LT2","Pot":"LT3","Sword":"LT2","NethPot":"LT3","UHC":"LT2"}},
  {"uuid":"3b653c04-f2d9-422a-87e7-ccf8b146c350","name":"TheRandomizer","region":"NA","points":116,"tiers":{"NethPot":"LT3","SMP":"LT3","Mace":"LT3","UHC":"LT3","Vanilla":"HT4","Pot":"LT3","Axe":"HT1","Sword":"LT3"}},
  {"uuid":"4b0f3d7e-b343-4e4a-8929-a87ddb8f0307","name":"FerreMC","region":"EU","points":116,"tiers":{"SMP":"HT2","Sword":"HT4","NethPot":"LT3","Vanilla":"LT3","Axe":"LT2","UHC":"HT2","Pot":"LT3"}},
  {"uuid":"75e0902d-8e37-4c78-bee9-b0a9da93f380","name":"xzTito","region":"NA","points":116,"tiers":{"Pot":"HT3","UHC":"LT2","Sword":"HT2","SMP":"HT2","NethPot":"HT3","Axe":"LT3","Mace":"LT3"}},
  {"uuid":"c9468221-f170-4cbe-85f6-48fe00fdeb26","name":"C0RZZ","region":"NA","points":115,"tiers":{"Axe":"LT2","Sword":"LT3","UHC":"LT1","Pot":"HT3","SMP":"HT3","Mace":"LT4","Vanilla":"LT3","NethPot":"HT3"}},
  {"uuid":"f2694f04-e177-4d58-bfac-f6eec7b2c951","name":"UccDawg","region":"EU","points":114,"tiers":{"SMP":"LT3","NethPot":"LT3","Mace":"LT4","Axe":"LT3","UHC":"HT4","Sword":"LT2","Pot":"LT3","Vanilla":"LT1"}},
  {"uuid":"8ef74061-685b-49e7-b765-2fd310729dba","name":"badspelhr","region":"AU","points":112,"tiers":{"Sword":"LT2","Vanilla":"LT3","NethPot":"LT3","SMP":"LT2","Pot":"HT2","Axe":"LT3","UHC":"LT2"}},
  {"uuid":"e63d9c3d-4957-49b4-9f61-f82b01befba8","name":"Stooky","region":"NA","points":110,"tiers":{"SMP":"LT3","NethPot":"LT3","UHC":"LT3","Mace":"HT3","Vanilla":"LT3","Sword":"HT3","Axe":"HT1","Pot":"LT3"}},
  {"uuid":"54682523-e021-4a02-9c23-ad3210a0b134","name":"AdamAdiss","region":"EU","points":107,"tiers":{"Vanilla":"HT3","Pot":"LT3","NethPot":"LT3","Sword":"HT3","Mace":"LT1","Axe":"LT3","UHC":"HT3","SMP":"LT3"}},
  {"uuid":"96d933c7-360c-4ba5-aa7f-2559bd798a7f","name":"JackerAcid","region":"NA","points":106,"tiers":{"Axe":"HT1","SMP":"LT3","Pot":"LT3","Sword":"HT3","UHC":"LT2"}},
  {"uuid":"b6d5d921-7afd-4552-a33c-36b3a194511e","name":"Kingbubr","region":"EU","points":106,"tiers":{"UHC":"HT2","Pot":"LT2","SMP":"LT2","NethPot":"HT3","Axe":"LT3","Sword":"LT2"}},
  {"uuid":"04bb1574-db3b-4561-a085-c3801f869130","name":"Alexandzr","region":"SA","points":105,"tiers":{"Axe":"LT2","Sword":"LT3","Pot":"LT3","UHC":"LT1","SMP":"LT3","NethPot":"HT3"}},
  {"uuid":"162ea92e-8010-44e2-9797-8751dc521072","name":"SuchSkills_Mx","region":"NA","points":105,"tiers":{"Pot":"LT1","Sword":"HT1"}},
  {"uuid":"226bc8e3-119c-46f8-8fc1-487228c2b4f1","name":"Tqmen","region":"EU","points":105,"tiers":{"Sword":"LT1","Pot":"HT1"}},
  {"uuid":"7155768f-91b7-4341-932c-579438f584b1","name":"Mentaider","region":"EU","points":105,"tiers":{"Pot":"HT2","NethPot":"LT1","Sword":"HT2"}},
  {"uuid":"d4a00333-a836-4a21-b494-e0c27164a150","name":"Twohandsrevy","region":"NA","points":105,"tiers":{"Sword":"LT1","Vanilla":"HT1"}},
];

// Sort tiers helper: lower index = better tier.
function tierRank(tier) {
  const idx = TIER_ORDER.indexOf(tier);
  return idx === -1 ? TIER_ORDER.length : idx;
}
