/**
 * MCTiers Draft — auction-style draft game.
 * State lives entirely in memory (`state`), rendered into three screens.
 */

const state = {
  drafters: [], // { id, name, budget, startingBudget, roster: [{player, price}] }
  picksPerDrafter: 4,
  gamemode: "Overall",
  pool: [], // remaining undrafted players
  customPlayers: [],

  // draft-in-progress
  nominatorIndex: 0,
  nominatedPlayer: null,
  currentBid: 0,
  currentBidderIndex: null,
  activeBidders: [], // indexes still allowed to act this auction
  actingIndex: null,
  locked: false, // true once an auction has resolved, to ignore stale/duplicate clicks
  log: [],
};

let nextDrafterId = 1;

// ---------- Utilities ----------

function tierClass(tier) {
  if (!tier) return "tnone";
  const n = tier.slice(2);
  return "t" + n;
}

function formatTier(tier) {
  if (!tier) return "Unranked";
  const pos = tier[0] === "H" ? "High" : "Low";
  return `${pos} Tier ${tier.slice(2)}`;
}

function playerTierForMode(player, mode) {
  if (mode === "Overall") {
    // best (lowest rank index) tier across all modes, as a stand-in for "overall"
    let best = null;
    for (const t of Object.values(player.tiers)) {
      if (best === null || tierRank(t) < tierRank(best)) best = t;
    }
    return best;
  }
  return player.tiers[mode] || null;
}

function avatarUrl(player, size) {
  if (!player.uuid) return null;
  return `https://mc-heads.net/avatar/${player.uuid}/${size || 32}`;
}

function avatarImgHtml(player, size) {
  const url = avatarUrl(player, size);
  if (!url) return `<div class="avatar avatar-fallback" style="width:${size || 32}px;height:${size || 32}px;"></div>`;
  return `<img class="avatar" src="${url}" width="${size || 32}" height="${size || 32}" alt="" loading="lazy" onerror="this.classList.add('avatar-fallback');this.removeAttribute('src');">`;
}

function allTierBadgesHtml(player) {
  const modes = GAME_MODES.filter(m => m !== "Overall" && player.tiers[m]);
  if (modes.length === 0) return `<span class="tier-badge tnone">Unranked</span>`;
  return modes
    .sort((a, b) => tierRank(player.tiers[a]) - tierRank(player.tiers[b]))
    .map(m => `<span class="tier-badge ${tierClass(player.tiers[m])}" title="${m}">${m.slice(0, 3)} ${player.tiers[m]}</span>`)
    .join("");
}

function allPlayers() {
  return [...PLAYERS, ...state.customPlayers];
}

// Players eligible for a given gamemode/kit — "Overall" allows everyone,
// any specific kit only includes players who have actually been tested/tiered in it.
function playersForMode(mode) {
  const players = allPlayers();
  if (mode === "Overall") return players;
  return players.filter(p => !!p.tiers[mode]);
}

function activeDrafters() {
  return state.drafters.filter(d => d.roster.length < state.picksPerDrafter);
}

function isFull(drafter) {
  return drafter.roster.length >= state.picksPerDrafter;
}

function maxBidFor(drafter) {
  const picksNeededAfterThis = state.picksPerDrafter - drafter.roster.length - 1;
  return drafter.budget - picksNeededAfterThis;
}

function setHtml(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function addLog(msg, cls) {
  state.log.push({ msg, cls });
  renderLog();
}

// ---------- Screen switching ----------

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

// ============================================================
// SETUP SCREEN
// ============================================================

function initSetupScreen() {
  const gamemodeSelect = document.getElementById("gamemode-select");
  gamemodeSelect.innerHTML = GAME_MODES.map(m => `<option value="${m}">${m}</option>`).join("");
  gamemodeSelect.addEventListener("change", renderPoolList);

  const customTier = document.getElementById("custom-tier");
  customTier.innerHTML = TIER_ORDER.map(t => `<option value="${t}">${formatTier(t)}</option>`).join("");

  addDrafterRow("Player 1");
  addDrafterRow("Player 2");

  document.getElementById("add-drafter").addEventListener("click", () => {
    addDrafterRow(`Player ${document.querySelectorAll(".drafter-row").length + 1}`);
  });

  document.getElementById("pool-search").addEventListener("input", renderPoolList);
  document.getElementById("pool-select-all").addEventListener("click", () => setAllPoolChecks(true));
  document.getElementById("pool-select-none").addEventListener("click", () => setAllPoolChecks(false));

  document.getElementById("custom-add-btn").addEventListener("click", addCustomPlayer);

  document.getElementById("start-draft").addEventListener("click", startDraft);

  renderPoolList();
}

function addDrafterRow(defaultName) {
  const list = document.getElementById("drafter-list");
  const row = document.createElement("div");
  row.className = "drafter-row";
  row.innerHTML = `
    <input type="text" class="drafter-name" value="${defaultName}">
    <button type="button" class="remove-drafter">✕</button>
  `;
  row.querySelector(".remove-drafter").addEventListener("click", () => {
    if (document.querySelectorAll(".drafter-row").length <= 2) {
      showSetupError("You need at least 2 drafters.");
      return;
    }
    row.remove();
  });
  list.appendChild(row);
}

let poolChecks = {}; // name -> bool

function renderPoolList() {
  const search = document.getElementById("pool-search").value.trim().toLowerCase();
  const mode = document.getElementById("gamemode-select").value;
  const list = document.getElementById("pool-list");
  const players = playersForMode(mode)
    .filter(p => search === "" || p.name.toLowerCase().includes(search))
    .sort((a, b) => tierRank(playerTierForMode(a, mode)) - tierRank(playerTierForMode(b, mode)));

  list.innerHTML = "";
  for (const p of players) {
    if (!(p.name in poolChecks)) poolChecks[p.name] = true;
    const item = document.createElement("label");
    item.className = "pool-item";
    item.innerHTML = `
      <input type="checkbox" ${poolChecks[p.name] ? "checked" : ""}>
      ${avatarImgHtml(p, 28)}
      <span class="pname">${p.name}</span>
      <span class="pregion">${p.region || ""}</span>
      <span class="pool-tiers">${allTierBadgesHtml(p)}</span>
    `;
    item.querySelector("input").addEventListener("change", e => {
      poolChecks[p.name] = e.target.checked;
      updatePoolCount();
    });
    list.appendChild(item);
  }
  updatePoolCount();
}

function setAllPoolChecks(val) {
  const mode = document.getElementById("gamemode-select").value;
  for (const p of playersForMode(mode)) poolChecks[p.name] = val;
  renderPoolList();
}

function updatePoolCount() {
  const mode = document.getElementById("gamemode-select").value;
  const eligible = playersForMode(mode);
  const n = eligible.filter(p => poolChecks[p.name]).length;
  document.getElementById("pool-count").textContent =
    mode === "Overall"
      ? `${n} selected`
      : `${n} selected · ${eligible.length} players tested for ${mode}`;
}

function addCustomPlayer() {
  const nameInput = document.getElementById("custom-name");
  const name = nameInput.value.trim();
  if (!name) return;
  const mode = document.getElementById("gamemode-select").value === "Overall"
    ? "Vanilla"
    : document.getElementById("gamemode-select").value;
  const tier = document.getElementById("custom-tier").value;
  state.customPlayers.push({ name, region: "??", tiers: { [mode]: tier } });
  poolChecks[name] = true;
  nameInput.value = "";
  renderPoolList();
}

function showSetupError(msg) {
  document.getElementById("setup-error").textContent = msg;
  setTimeout(() => { document.getElementById("setup-error").textContent = ""; }, 3500);
}

function startDraft() {
  const names = [...document.querySelectorAll(".drafter-name")].map(i => i.value.trim()).filter(Boolean);
  if (names.length < 2) return showSetupError("You need at least 2 drafters.");
  if (new Set(names.map(n => n.toLowerCase())).size !== names.length) {
    return showSetupError("Drafter names must be unique.");
  }

  const startingBudget = parseInt(document.getElementById("starting-budget").value, 10);
  const picksPerDrafter = parseInt(document.getElementById("picks-per-drafter").value, 10);
  if (!startingBudget || startingBudget < 1) return showSetupError("Starting budget must be at least $1.");
  if (!picksPerDrafter || picksPerDrafter < 1) return showSetupError("Picks per drafter must be at least 1.");
  if (startingBudget < picksPerDrafter) {
    return showSetupError(`Budget must be at least $${picksPerDrafter} so everyone can afford ${picksPerDrafter} players at $1 minimum each.`);
  }

  const gamemode = document.getElementById("gamemode-select").value;
  const selectedNames = new Set(Object.entries(poolChecks).filter(([, v]) => v).map(([k]) => k));
  const pool = playersForMode(gamemode).filter(p => selectedNames.has(p.name));

  if (pool.length < names.length * picksPerDrafter) {
    const modeNote = gamemode === "Overall" ? "" : ` who have tested for ${gamemode}`;
    return showSetupError(`Not enough players selected${modeNote} (${pool.length}) to fill ${names.length} drafters × ${picksPerDrafter} picks.`);
  }

  state.drafters = names.map(n => ({
    id: nextDrafterId++,
    name: n,
    budget: startingBudget,
    startingBudget,
    roster: [],
  }));
  state.picksPerDrafter = picksPerDrafter;
  state.gamemode = gamemode;
  state.pool = shuffle(pool);
  state.nominatorIndex = 0;
  state.nominatedPlayer = null;
  state.currentBid = 0;
  state.currentBidderIndex = null;
  state.activeBidders = [];
  state.actingIndex = null;
  state.log = [];

  showScreen("screen-draft");
  addLog(`Draft started: ${names.length} drafters, $${startingBudget} each, ${picksPerDrafter} picks, ${gamemode} gamemode.`);
  beginNominationPhase();
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============================================================
// DRAFT SCREEN
// ============================================================

function beginNominationPhase() {
  const active = activeDrafters();
  if (active.length === 0 || state.pool.length === 0) {
    return endDraft();
  }
  // advance nominatorIndex to next active drafter
  while (isFull(state.drafters[state.nominatorIndex])) {
    state.nominatorIndex = (state.nominatorIndex + 1) % state.drafters.length;
  }
  state.nominatedPlayer = null;
  document.getElementById("auction-card").classList.add("hidden");
  document.getElementById("nominate-controls").classList.remove("hidden");
  renderNominationBanner();
  renderSidebar();
}

function renderNominationBanner() {
  const nominator = state.drafters[state.nominatorIndex];
  document.getElementById("nomination-banner").innerHTML =
    `It's <b>${nominator.name}</b>'s turn to nominate a player.`;
  renderNominateSearch();
}

function renderNominateSearch() {
  document.getElementById("nominate-search").value = "";
  document.getElementById("nominate-search-results").innerHTML = "";
}

function poolSearchHandler() {
  const q = document.getElementById("nominate-search").value.trim().toLowerCase();
  const results = document.getElementById("nominate-search-results");
  if (!q) { results.innerHTML = ""; return; }
  const matches = state.pool.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8);
  results.innerHTML = matches.map(p =>
    `<div class="sr-item" data-name="${p.name}">${avatarImgHtml(p, 22)} ${p.name} <span class="tier-badge ${tierClass(playerTierForMode(p, state.gamemode))}">${playerTierForMode(p, state.gamemode) || "—"}</span></div>`
  ).join("");
  results.querySelectorAll(".sr-item").forEach(el => {
    el.addEventListener("click", () => {
      const player = state.pool.find(p => p.name === el.dataset.name);
      startAuction(player);
    });
  });
}

function nominateRandom() {
  if (state.pool.length === 0) return endDraft();
  const player = state.pool[Math.floor(Math.random() * state.pool.length)];
  startAuction(player);
}

function startAuction(player) {
  state.locked = false;
  state.nominatedPlayer = player;
  state.pool = state.pool.filter(p => p.name !== player.name);
  state.activeBidders = state.drafters.map((_, i) => i).filter(i => !isFull(state.drafters[i]));
  if (state.activeBidders.length === 1) {
    // Only one drafter still has open roster slots — they win uncontested at the minimum bid.
    state.currentBid = 1;
    state.currentBidderIndex = state.activeBidders[0];
    state.actingIndex = state.activeBidders[0];
  } else {
    state.currentBid = 0;
    state.currentBidderIndex = null;
    state.actingIndex = state.nominatorIndex;
  }

  document.getElementById("nominate-controls").classList.add("hidden");
  document.getElementById("auction-card").classList.remove("hidden");

  setHtml("auction-avatar", avatarImgHtml(player, 72));
  setText("auction-name", player.name);
  const tier = playerTierForMode(player, state.gamemode);
  setHtml("auction-tier", `<span class="tier-badge ${tierClass(tier)}">${formatTier(tier)}</span> — ${state.gamemode}`);
  setHtml("auction-all-tiers", allTierBadgesHtml(player));
  setText("auction-region", player.region ? `Region: ${player.region}` : "");

  addLog(`${state.drafters[state.nominatorIndex].name} nominated ${player.name}.`);
  renderAuction();
}

function renderAuction() {
  document.getElementById("current-bid-amount").textContent = `$${state.currentBid}`;
  document.getElementById("current-bid-holder").textContent =
    state.currentBidderIndex !== null ? `held by ${state.drafters[state.currentBidderIndex].name}` : "no bids yet";

  if (state.activeBidders.length <= 1) {
    return resolveAuction();
  }

  const acting = state.drafters[state.actingIndex];
  document.getElementById("auction-turn").innerHTML = `Waiting on <b>${acting.name}</b> — bid higher or pass`;

  const actions = document.getElementById("auction-actions");
  const minBid = state.currentBid + 1;
  const maxBid = Math.max(minBid, maxBidFor(acting));
  const canBid = maxBidFor(acting) >= minBid;
  const isOpeningBid = state.currentBid === 0;

  let html = "";
  if (canBid) {
    // quick-bid buttons
    const quickAmounts = [minBid, minBid + 1, minBid + 4].filter((v, i, arr) => v <= maxBid && arr.indexOf(v) === i);
    for (const amt of quickAmounts) {
      html += `<button class="bid-btn" data-amt="${amt}">Bid $${amt}</button>`;
    }
    html += `
      <div class="bid-custom">
        <span>$</span>
        <input type="number" id="custom-bid-input" min="${minBid}" max="${maxBid}" value="${minBid}">
        <button class="bid-btn" id="custom-bid-btn">Bid</button>
      </div>
    `;
  } else {
    html += `<span class="hint">${acting.name} can't afford to raise (needs $1 reserved per remaining pick).</span>`;
  }
  if (!isOpeningBid || !canBid) {
    html += `<button class="bid-btn pass" id="pass-btn">Pass</button>`;
  }
  actions.innerHTML = html;

  actions.querySelectorAll(".bid-btn[data-amt]").forEach(btn => {
    btn.addEventListener("click", () => placeBid(parseInt(btn.dataset.amt, 10)));
  });
  const customBtn = document.getElementById("custom-bid-btn");
  if (customBtn) {
    customBtn.addEventListener("click", () => {
      const val = parseInt(document.getElementById("custom-bid-input").value, 10);
      if (val >= minBid && val <= maxBid) placeBid(val);
    });
  }
  const passBtn = document.getElementById("pass-btn");
  if (passBtn) passBtn.addEventListener("click", passTurn);
}

function placeBid(amount) {
  if (state.locked) return;
  state.currentBid = amount;
  state.currentBidderIndex = state.actingIndex;
  addLog(`${state.drafters[state.actingIndex].name} bids $${amount} on ${state.nominatedPlayer.name}.`);
  advanceTurn();
}

function passTurn() {
  if (state.locked) return;
  addLog(`${state.drafters[state.actingIndex].name} passes.`);
  state.activeBidders = state.activeBidders.filter(i => i !== state.actingIndex);
  advanceTurn();
}

function advanceTurn() {
  if (state.activeBidders.length <= 1) {
    return renderAuction();
  }
  let idx = state.actingIndex;
  do {
    idx = (idx + 1) % state.drafters.length;
  } while (!state.activeBidders.includes(idx));
  state.actingIndex = idx;
  renderAuction();
}

function resolveAuction() {
  if (state.locked) return;
  state.locked = true;
  document.getElementById("auction-actions").innerHTML = "";
  const player = state.nominatedPlayer;
  if (state.currentBidderIndex === null) {
    // shouldn't normally happen (nominator always opens), but handle gracefully
    addLog(`No bids on ${player.name} — returned to pool unassigned.`, "");
    return afterAuctionResolved();
  }
  const winner = state.drafters[state.currentBidderIndex];
  winner.budget -= state.currentBid;
  winner.roster.push({ player, price: state.currentBid });
  addLog(`${winner.name} wins ${player.name} for $${state.currentBid}!`, "win");
  afterAuctionResolved();
}

function afterAuctionResolved() {
  renderSidebar();
  state.nominatorIndex = (state.nominatorIndex + 1) % state.drafters.length;
  setTimeout(beginNominationPhase, 400);
}

function renderLog() {
  const list = document.getElementById("log-list");
  list.innerHTML = state.log.slice().reverse().map(e => `<li class="${e.cls || ""}">${e.msg}</li>`).join("");
}

function renderSidebar() {
  const sidebar = document.getElementById("draft-sidebar");
  sidebar.innerHTML = state.drafters.map((d, i) => {
    const full = isFull(d);
    const active = state.nominatedPlayer === null && i === state.nominatorIndex && !full;
    return `
      <div class="drafter-card ${active ? "active" : ""} ${full ? "full" : ""}">
        <div class="drafter-card-head">
          <span class="dname">${d.name}</span>
          <span class="dbudget">$${d.budget}</span>
        </div>
        <ul class="drafter-roster">
          ${d.roster.map(r => `<li>${avatarImgHtml(r.player, 18)}<span>${r.player.name}</span><span class="price">$${r.price}</span></li>`).join("")}
        </ul>
        <div class="drafter-picks-left">${d.roster.length}/${state.picksPerDrafter} picks${full ? " — full" : ""}</div>
      </div>
    `;
  }).join("");
}

// ============================================================
// RESULTS SCREEN
// ============================================================

function endDraft() {
  showScreen("screen-results");

  const scored = state.drafters.map(d => {
    const score = d.roster.reduce((sum, r) => {
      const tier = playerTierForMode(r.player, state.gamemode);
      return sum + (TIER_SCORE[tier] || 0);
    }, 0);
    return { d, score };
  }).sort((a, b) => b.score - a.score);

  const top = scored[0];
  document.getElementById("results-summary").innerHTML = `
    <div class="winner-name">${top ? `${top.d.name} has the strongest roster!` : "Draft complete"}</div>
    <div class="winner-note">Ranked by ${state.gamemode} tier power score — the real winner is whoever wins the actual PvP matches.</div>
  `;

  document.getElementById("results-rosters").innerHTML = scored.map(({ d, score }) => `
    <div class="results-card">
      <h3>${d.name}</h3>
      <div class="score-line">Power score: ${score.toFixed(1)} · Spent $${d.startingBudget - d.budget} · $${d.budget} left</div>
      <ul>
        ${d.roster.map(r => {
          return `<li class="results-player"><span class="results-player-main">${avatarImgHtml(r.player, 22)}<span>${r.player.name}</span><span class="price">$${r.price}</span></span><span class="results-player-tiers">${allTierBadgesHtml(r.player)}</span></li>`;
        }).join("") || "<li>No players drafted</li>"}
      </ul>
    </div>
  `).join("");
}

document.getElementById("restart-btn")?.addEventListener("click", () => location.reload());

// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  initSetupScreen();
  document.getElementById("nominate-random").addEventListener("click", nominateRandom);
  document.getElementById("nominate-search").addEventListener("input", poolSearchHandler);
  showScreen("screen-setup");
});
