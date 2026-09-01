/**
 * Real player tier data pulled from the live MCTiers.com API (v2):
 *   GET https://mctiers.com/api/v2/mode/overall?count=50&from=0
 *   GET https://mctiers.com/api/v2/mode/overall?count=50&from=50
 *
 * This is a snapshot (top 100 players by overall points) fetched by the
 * user directly since this sandbox's network policy blocks mctiers.com.
 * Tiers will drift over time as MCTiers re-tests players — re-fetch those
 * endpoints (bump `&from=` by 50 to page further down the list) and re-run
 * the conversion if you want to refresh this file, or just use the in-app
 * "Add custom player" form to add/update individual players.
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
  {"uuid":"7b333d2f-0a08-49d1-bb27-1a01af2e22a2","name":"hicew","region":"NA","points":104,"tiers":{"Pot":"HT2","Vanilla":"LT1","Sword":"HT4","NethPot":"LT3","SMP":"LT3","Axe":"LT4"}},
  {"uuid":"a70221c2-ba72-4154-add9-9183a373713e","name":"CroneCrafter","region":"EU","points":103,"tiers":{"Pot":"LT3","Vanilla":"LT3","SMP":"HT3","Mace":"LT3","UHC":"LT1","NethPot":"HT3","Sword":"LT3","Axe":"LT3"}},
  {"uuid":"1246a0ec-662b-45de-bb0b-d68cb1cce800","name":"JokingDK","region":"EU","points":102,"tiers":{"Axe":"LT3","Mace":"HT4","SMP":"HT2","UHC":"LT3","Pot":"LT3","NethPot":"HT3","Sword":"LT3","Vanilla":"LT2"}},
  {"uuid":"026cf46a-4260-4d11-bd4f-914b6c0d41a5","name":"Ra1gn","region":"NA","points":101,"tiers":{"SMP":"LT3","Vanilla":"LT4","Pot":"LT3","NethPot":"LT3","Sword":"LT3","Axe":"HT1","UHC":"LT3"}},
  {"uuid":"4c80b1f8-019a-409e-a84c-4c58db07a1f1","name":"ImRedz","region":"EU","points":101,"tiers":{"SMP":"LT3","NethPot":"LT3","Axe":"LT1","Sword":"LT3","Pot":"LT3","Vanilla":"LT3","UHC":"LT3"}},
  {"uuid":"23dbc31b-768b-418d-ab88-7295ce259015","name":"Takvo","region":"EU","points":100,"tiers":{"SMP":"HT3","Pot":"LT3","Sword":"HT2","Axe":"HT3","Mace":"LT2","NethPot":"HT3","UHC":"LT3"}},
  {"uuid":"4a2253f0-d361-43a4-830d-31d634e28d26","name":"fwaggy","region":"AS","points":100,"tiers":{"UHC":"LT2","Pot":"LT3","SMP":"HT2","Sword":"HT4","Axe":"LT2","NethPot":"LT3"}},
  {"uuid":"a956af6b-8ac2-41e1-9825-58c2eddf2940","name":"Bqnnyy","region":"EU","points":100,"tiers":{"NethPot":"HT2","Sword":"HT1","Pot":"HT3"}},
  {"uuid":"ca5c672a-148e-482c-9c8e-88af45c9d30c","name":"Mxthi","region":"NA","points":100,"tiers":{"UHC":"LT3","NethPot":"LT3","Axe":"HT4","Pot":"HT1","Sword":"LT2"}},
  {"uuid":"7091f820-8fbd-45f2-a7a7-4c09910c3795","name":"FoodChuckster123","region":"EU","points":99,"tiers":{"UHC":"HT2","Axe":"HT3","NethPot":"LT3","Sword":"LT3","Mace":"LT4","Pot":"LT3","Vanilla":"LT4","SMP":"HT3"}},
  {"uuid":"a5730eb9-4949-4279-839f-1022d64b937f","name":"CorruptNoob","region":"NA","points":99,"tiers":{"UHC":"LT3","SMP":"LT1","Vanilla":"HT3","NethPot":"LT3","Axe":"LT3","Sword":"LT3","Pot":"LT3","Mace":"LT3"}},
  {"uuid":"5e24102f-a2b8-46a3-92e0-932a52dc90f2","name":"K1RBE","region":"NA","points":98,"tiers":{"Pot":"LT3","Mace":"LT3","Axe":"LT4","Sword":"LT3","UHC":"LT3","NethPot":"LT3","Vanilla":"HT1","SMP":"HT4"}},
  {"uuid":"8f195a1b-482a-46b5-b006-ee3797167532","name":"SWORDART0NLINE","region":"NA","points":98,"tiers":{"NethPot":"HT3","Sword":"LT2","UHC":"HT3","Vanilla":"LT3","SMP":"LT2","Mace":"LT3","Pot":"HT3","Axe":"LT3"}},
  {"uuid":"3979d47b-602b-4c75-9af1-a11d06a2056e","name":"ph4ntic","region":"NA","points":96,"tiers":{"Vanilla":"HT4","Sword":"HT3","SMP":"LT2","Axe":"LT3","UHC":"LT3","Pot":"HT2","NethPot":"HT3"}},
  {"uuid":"89dcab80-bb97-4145-ae83-28ab9551a1e5","name":"TripleYoshiMeow","region":"NA","points":96,"tiers":{"SMP":"LT3","Sword":"HT2","UHC":"LT2","Axe":"LT3","NethPot":"LT3","Pot":"LT3"}},
  {"uuid":"d4d8bc5d-cff2-47df-a420-2a5af665e2b1","name":"xUltimate_","region":"EU","points":96,"tiers":{"NethPot":"HT3","Vanilla":"LT3","SMP":"HT2","UHC":"LT3","Axe":"HT3","Pot":"HT3","Sword":"LT2","Mace":"HT4"}},
  {"uuid":"72ed359a-e52d-4564-b0aa-57d90384a61b","name":"Captain_C08","region":"EU","points":94,"tiers":{"Pot":"LT3","Mace":"HT1","SMP":"HT3","NethPot":"LT3","Sword":"LT3","Vanilla":"LT3"}},
  {"uuid":"9b9cd51d-0efb-45c8-9776-7150ffd1b838","name":"lilbizo","region":"NA","points":93,"tiers":{"Pot":"HT4","Sword":"LT3","SMP":"LT1","Axe":"LT3","NethPot":"LT2","Vanilla":"LT3","UHC":"LT3"}},
  {"uuid":"6c0e6473-8947-4531-ab53-e51f3dfa558a","name":"KhalihMortimer","region":"NA","points":91,"tiers":{"Axe":"LT4","SMP":"HT4","Mace":"HT1","Pot":"LT4","UHC":"LT3","NethPot":"LT4","Vanilla":"LT3","Sword":"LT3"}},
  {"uuid":"e04c9947-c559-4bb6-9bd9-6a9ceb7023df","name":"sincerelyray","region":"NA","points":91,"tiers":{"Axe":"LT1","SMP":"LT3","Pot":"LT3","Sword":"HT3","UHC":"LT3","NethPot":"LT3"}},
  {"uuid":"3886f86a-3566-4dd9-aef1-ac2108f1d8a7","name":"supersuperpig","region":"NA","points":90,"tiers":{"Axe":"HT1","UHC":"LT2","Sword":"HT4"}},
  {"uuid":"5832125a-e11d-4927-ab31-a4577d103650","name":"FriendlyIbra","region":"EU","points":90,"tiers":{"Pot":"HT3","Vanilla":"HT3","SMP":"LT2","Axe":"HT3","Sword":"HT3","NethPot":"HT3","UHC":"LT3","Mace":"HT3"}},
  {"uuid":"5a7e7d65-2dc5-431c-8dc9-1660425f8ab6","name":"SmiGuy","region":"NA","points":90,"tiers":{"Sword":"HT2","Pot":"HT1"}},
  {"uuid":"91781d8c-da01-4d19-a62c-9373786b6cf6","name":"Waltersillo","region":"NA","points":90,"tiers":{"SMP":"LT3","Sword":"HT3","Vanilla":"HT3","NethPot":"LT3","Axe":"HT3","Pot":"HT3"}},
  {"uuid":"811b22e6-3d08-4967-bf9d-c99d12a4c751","name":"FatalDeath","region":"NA","points":89,"tiers":{"Pot":"LT2","SMP":"LT4","Vanilla":"LT4","NethPot":"HT2","Sword":"LT3","Axe":"LT4"}},
  {"uuid":"0f2e2924-f4f8-4745-87c5-084e7c71abe2","name":"1Wenzy","region":"EU","points":88,"tiers":{"NethPot":"LT3","Axe":"HT3","Mace":"HT4","UHC":"LT2","Pot":"HT3","Vanilla":"LT3","Sword":"LT3","SMP":"HT3"}},
  {"uuid":"2e838c05-7d1c-4d3e-962e-ff90e3627db8","name":"Sizierung","region":"EU","points":88,"tiers":{"Sword":"HT3","Mace":"HT4","Vanilla":"LT3","NethPot":"LT3","Axe":"HT3","UHC":"LT3","Pot":"LT3","SMP":"LT3"}},
  {"uuid":"65e118a8-33b6-4631-b9d5-10896692080f","name":"SnowyYoshi","region":"AS","points":88,"tiers":{"Pot":"HT3","Vanilla":"HT2","Sword":"HT3","Axe":"HT3","UHC":"HT3","SMP":"LT3","NethPot":"LT3","Mace":"LT3"}},
  {"uuid":"369fdb62-3287-44a2-bb06-fc9323db0776","name":"Axzll","region":"NA","points":87,"tiers":{"Axe":"LT3","Mace":"LT3","Sword":"LT3","NethPot":"HT4","SMP":"LT3","Pot":"LT3","UHC":"LT1"}},
  {"uuid":"753a20ab-9c75-4a5a-aaae-5927299ebdf7","name":"PUFFIERZ","region":"EU","points":86,"tiers":{"Axe":"HT4","Mace":"HT2","NethPot":"LT3","Vanilla":"HT3","Pot":"LT3","Sword":"HT4","SMP":"LT3","UHC":"LT3"}},
  {"uuid":"84272c24-aca9-4ef3-bb7a-4a8f81256b3e","name":"TooDrew","region":"NA","points":86,"tiers":{"NethPot":"LT3","UHC":"LT3","Mace":"LT5","Vanilla":"LT3","Pot":"LT3","Axe":"LT3","Sword":"HT4","SMP":"LT3"}},
  {"uuid":"d56a6990-9eba-4440-915b-ca7694d12390","name":"Madlogg","region":"NA","points":86,"tiers":{"NethPot":"LT3","UHC":"LT2","Axe":"HT1"}},
  {"uuid":"d5850820-5333-4a33-90b9-e28f5d8bd2a9","name":"rEeFwOn","region":"NA","points":86,"tiers":{"Vanilla":"LT3","NethPot":"HT3","UHC":"HT3","Sword":"LT2","Axe":"LT2","SMP":"LT2"}},
  {"uuid":"3076c468-b5fd-4769-9915-326e24b4054e","name":"PropertyOfRelyks","region":"NA","points":85,"tiers":{"Sword":"LT3","UHC":"HT4","Vanilla":"LT4","Pot":"HT3","SMP":"HT1","Axe":"HT5"}},
  {"uuid":"745f7fba-a531-4c0e-90e6-3f348187c44a","name":"Gqlm","region":"NA","points":85,"tiers":{"NethPot":"HT3","Vanilla":"LT2","Pot":"HT2","Axe":"LT4","SMP":"LT3","UHC":"LT3","Sword":"LT3"}},
  {"uuid":"747f9acc-aba0-4583-9951-a6f87e724018","name":"DiosDelCoseno","region":"NA","points":84,"tiers":{"Axe":"HT3","Vanilla":"HT3","Sword":"LT3","Pot":"HT5","NethPot":"LT3","UHC":"HT2","Mace":"HT5","SMP":"HT3"}},
  {"uuid":"868bf721-270e-4337-9083-d8140e054da8","name":"Rivise","region":"AU","points":84,"tiers":{"Sword":"LT3","Axe":"HT3","UHC":"LT2","SMP":"LT2","Vanilla":"HT4","Pot":"HT3","NethPot":"LT3"}},
  {"uuid":"1de575e5-c3dc-450c-97b4-c560c3dc4afe","name":"brhh","region":"NA","points":82,"tiers":{"Vanilla":"LT3","UHC":"LT2","SMP":"HT3","Sword":"LT3","Pot":"HT3","Mace":"HT4","NethPot":"HT3","Axe":"HT3"}},
  {"uuid":"2f707f5b-bf78-4d3a-ada8-af00179e32c9","name":"Ibrahimblaze","region":"AS","points":82,"tiers":{"Pot":"HT3","UHC":"HT3","Sword":"LT3","SMP":"HT2","Vanilla":"HT5","NethPot":"HT3","Axe":"LT3"}},
  {"uuid":"36a75ae2-4317-418e-acb3-c2e0fd041d91","name":"idns","region":"NA","points":82,"tiers":{"Mace":"HT4","UHC":"HT2","Sword":"LT3","Axe":"LT3","SMP":"LT3","Pot":"HT3","Vanilla":"LT3","NethPot":"LT3"}},
  {"uuid":"86e93c86-3a06-4b90-b02a-d2a371b85a26","name":"Camcal","region":"NA","points":82,"tiers":{"Vanilla":"LT1","Sword":"HT4","Pot":"HT4","UHC":"LT3","SMP":"LT3","Mace":"LT4","NethPot":"LT3"}},
  {"uuid":"a0080011-dc32-4228-b579-8e90b491f542","name":"Denji_Ryomen","region":"EU","points":82,"tiers":{"Axe":"LT3","UHC":"LT3","Sword":"HT3","NethPot":"LT3","Vanilla":"LT2","Pot":"HT3","SMP":"LT3","Mace":"LT3"}},
  {"uuid":"bc7088e4-ddf5-4b77-83b1-0fdcfc1d8c49","name":"Viruslmao","region":"NA","points":82,"tiers":{"Vanilla":"HT3","SMP":"LT2","Axe":"LT3","NethPot":"LT3","Mace":"LT3","UHC":"LT3","Sword":"LT3","Pot":"HT3"}},
  {"uuid":"cc1d3161-befd-483e-bfcd-17fb78fbf74e","name":"Turbinial","region":"NA","points":82,"tiers":{"NethPot":"LT3","UHC":"LT3","SMP":"HT3","Pot":"HT3","Vanilla":"LT3","Sword":"LT3","Mace":"LT2","Axe":"LT3"}},
  {"uuid":"d10649d3-b323-4b6a-9aad-38bf66cf81e8","name":"meteorinto","region":"NA","points":82,"tiers":{"Vanilla":"LT3","UHC":"LT3","Mace":"LT4","Axe":"LT2","Pot":"LT3","SMP":"HT3","NethPot":"LT3","Sword":"LT2"}},
  {"uuid":"ed63dc95-f7fe-413e-b8f9-5d30d1802f76","name":"LEONALtheLION","region":"NA","points":82,"tiers":{"Pot":"HT3","Axe":"LT3","Mace":"HT4","Sword":"LT2","SMP":"LT2","NethPot":"HT3","UHC":"LT3","Vanilla":"LT3"}},
  {"uuid":"c0a1ead3-a52a-4715-9418-248233438d44","name":"Error454","region":"EU","points":81,"tiers":{"UHC":"LT3","NethPot":"LT3","Axe":"HT3","SMP":"HT2","Vanilla":"HT5","Mace":"LT3","Pot":"LT3","Sword":"HT3"}},
  {"uuid":"d9f81987-5a9e-4b14-81cf-469ab60dccce","name":"LuisBack","region":"EU","points":81,"tiers":{"NethPot":"LT1","Sword":"HT4","Pot":"HT2"}},
  {"uuid":"0f6fbcd9-1026-40f7-a7da-73176df110a9","name":"Jxydon","region":"AS","points":80,"tiers":{"Axe":"LT3","SMP":"HT3","Pot":"LT3","Mace":"HT2","NethPot":"LT3","Sword":"LT3","Vanilla":"LT3","UHC":"LT3"}},
  {"uuid":"123c07ee-c058-4ee5-bced-678c4bfd5de1","name":"Ricardoxx_","region":"NA","points":80,"tiers":{"Axe":"LT3","Vanilla":"LT3","Pot":"LT3","Mace":"LT3","Sword":"HT4","UHC":"HT2","NethPot":"LT3","SMP":"LT3"}},
];

// Sort tiers helper: lower index = better tier.
function tierRank(tier) {
  const idx = TIER_ORDER.indexOf(tier);
  return idx === -1 ? TIER_ORDER.length : idx;
}
