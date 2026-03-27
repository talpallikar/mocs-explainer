// ---------- Theme ----------
const toggle = document.getElementById('theme-toggle');
toggle.addEventListener('click', () => {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// ---------- State ----------
let activeView = 'overview';
let activeSeason = MOCS_DATA.seasons.find(s => s.current) || MOCS_DATA.seasons[0];

// ---------- Season selector ----------
const seasonSelect = document.getElementById('season-select');
MOCS_DATA.seasons.forEach(s => {
  const opt = document.createElement('option');
  opt.value = s.id;
  opt.textContent = s.label + (s.current ? ' (current)' : '');
  seasonSelect.appendChild(opt);
});
seasonSelect.value = activeSeason.id;
seasonSelect.addEventListener('change', () => {
  activeSeason = MOCS_DATA.seasons.find(s => s.id === seasonSelect.value);
  render();
});

// ---------- Tabs ----------
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.tab.active').classList.remove('active');
    btn.classList.add('active');
    activeView = btn.dataset.view;
    render();
  });
});

// ---------- Helpers ----------
function fmtDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shortDate(iso) {
  const d = new Date(iso + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function seasonProgress(season) {
  const start = new Date(season.start + 'T00:00:00').getTime();
  const end = new Date(season.end + 'T00:00:00').getTime();
  const now = Date.now();
  if (now < start) return 0;
  if (now > end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function daysLeft(season) {
  const end = new Date(season.end + 'T00:00:00').getTime();
  const now = Date.now();
  const d = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
  return d > 0 ? d : 0;
}

// ---------- Render ----------
const main = document.getElementById('main-content');

function render() {
  // Update season badge
  const badge = document.getElementById('season-badge');
  if (activeSeason.current) {
    badge.textContent = 'Live';
    badge.style.background = '';
  } else {
    badge.textContent = 'Archived';
    badge.style.background = 'var(--muted)';
  }

  const views = {
    overview: renderOverview,
    'earning-qps': renderEarningQPs,
    prelims: renderPrelims,
    quals: renderQuals,
    showcase: renderShowcase,
    season: renderSeasonInfo,
  };

  main.innerHTML = '';
  const archiveBanner = !activeSeason.current
    ? `<div class="archive-banner">You are viewing <strong>${activeSeason.label}</strong> (archived). Switch to the current season using the dropdown above.</div>`
    : '';
  main.innerHTML = archiveBanner;

  const content = document.createElement('div');
  views[activeView](content);
  main.appendChild(content);
}

// ---------- OVERVIEW ----------
function renderOverview(el) {
  const s = activeSeason;
  const progress = seasonProgress(s);
  const remaining = daysLeft(s);

  el.innerHTML = `
    <section>
      <h2>How MOCS Qualification Works</h2>
      <p class="intro">The Magic Online Championship Series funnels thousands of players through a multi-tier system toward an 8-player, $50,000 Champions Showcase &mdash; with two World Championship seats on the line.</p>
    </section>

    ${s.current ? `
    <section>
      <h2>${s.label}</h2>
      <div class="season-progress">
        <div class="progress-labels">
          <span>${shortDate(s.start)}</span>
          <span>${remaining} days left</span>
          <span>${shortDate(s.end)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
      </div>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">${s.rotatingFormat}</span>
          <span class="stat-label">Rotating format</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${s.showcaseFormats.length}</span>
          <span class="stat-label">Showcase formats</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${progress}%</span>
          <span class="stat-label">Season complete</span>
        </div>
      </div>
    </section>
    ` : ''}

    <section>
      <h2>The Qualification Tree</h2>
      <div class="diagram">
        <!-- Tier 0: Regular play -->
        <div class="diagram-col">
          <div class="diagram-tier">
            <div class="diagram-node node-play" data-goto="earning-qps">
              <span class="node-icon">&#127183;</span>
              <div class="node-title">Leagues &amp; Drafts</div>
              <div class="node-sub">Earn 1&ndash;5 QPs per event</div>
              <span class="node-badge" style="background:var(--tier-play)">Daily play</span>
            </div>
          </div>
        </div>

        <div class="diagram-connector">
          <div class="connector-line"></div>
          <div class="arrow-label">Earn QPs</div>
        </div>

        <!-- Tier 1: Prelims & Challenges -->
        <div class="diagram-col">
          <div class="diagram-tier">
            <div class="diagram-node node-prelim" data-goto="prelims">
              <span class="node-icon">&#128221;</span>
              <div class="node-title">Preliminaries</div>
              <div class="node-sub">4-0 = 40 QPs</div>
              <span class="node-badge" style="background:var(--tier-prelim)">20 Tix</span>
            </div>
            <div class="diagram-node node-prelim" data-goto="prelims">
              <span class="node-icon">&#9876;</span>
              <div class="node-title">Format Challenges</div>
              <div class="node-sub">1st = 50 QPs</div>
              <span class="node-badge" style="background:var(--tier-prelim)">25-30 Tix</span>
            </div>
          </div>
        </div>

        <div class="diagram-connector">
          <div class="connector-line"></div>
          <div class="arrow-label">40 QPs</div>
        </div>

        <!-- Tier 2: Showcase Challenges / LCEs + Quals -->
        <div class="diagram-col">
          <div class="diagram-tier">
            <div class="diagram-node node-qual" data-goto="showcase" data-scroll="showcase-challenges">
              <span class="node-icon">&#9878;</span>
              <div class="node-title">Showcase Challenges</div>
              <div class="node-sub">Top 8 &rarr; token</div>
              <span class="node-badge" style="background:var(--tier-qual)">40 QPs</span>
            </div>
            <div class="diagram-node node-qual" data-goto="showcase" data-scroll="last-chance">
              <span class="node-icon">&#9888;</span>
              <div class="node-title">Last Chance Events</div>
              <div class="node-sub">5-0 &rarr; token</div>
              <span class="node-badge" style="background:var(--tier-qual)">40 QPs + 30 Tix</span>
            </div>
            <div class="diagram-node node-qual" data-goto="quals">
              <span class="node-icon">&#127919;</span>
              <div class="node-title">Quals &amp; Supers</div>
              <div class="node-sub">Top 2/4 &rarr; RCs</div>
              <span class="node-badge" style="background:var(--tier-qual)">40 QPs</span>
            </div>
          </div>
        </div>

        <div class="diagram-connector">
          <div class="connector-line"></div>
          <div class="arrow-label">Tokens &middot; LB Pts</div>
        </div>

        <!-- Tier 3: Three paths to Showcase -->
        <div class="diagram-col">
          <div class="diagram-tier">
            <div class="diagram-node node-showcase" data-goto="showcase" data-scroll="showcase-qualifiers">
              <span class="node-icon">&#127941;</span>
              <div class="node-title">Showcase Qualifiers</div>
              <div class="node-sub">4 winners advance</div>
              <span class="node-badge" style="background:var(--tier-showcase)">Token entry</span>
            </div>
            <div class="diagram-node node-showcase" data-goto="showcase" data-scroll="showcase-opens">
              <span class="node-icon">&#127922;</span>
              <div class="node-title">Showcase Opens</div>
              <div class="node-sub">2 winners advance</div>
              <span class="node-badge" style="background:var(--tier-showcase)">Open entry</span>
            </div>
            <div class="diagram-node node-showcase" data-goto="showcase" data-scroll="leaderboard">
              <span class="node-icon">&#128200;</span>
              <div class="node-title">Leaderboard</div>
              <div class="node-sub">Top 2 advance</div>
              <span class="node-badge" style="background:var(--tier-showcase)">Season-long</span>
            </div>
          </div>
        </div>

        <div class="diagram-connector">
          <div class="connector-line"></div>
          <div class="arrow-label">4 + 2 + 2</div>
        </div>

        <!-- Tier 4: Champions Showcase -->
        <div class="diagram-col">
          <div class="diagram-tier">
            <div class="diagram-node node-final" data-goto="showcase" data-scroll="champions-showcase">
              <span class="node-icon">&#9733;</span>
              <div class="node-title">Champions Showcase</div>
              <div class="node-sub">8 players &middot; $50K prize pool</div>
              <span class="node-badge" style="background:var(--tier-final)">Season Final</span>
            </div>
          </div>
        </div>

        <div class="diagram-connector">
          <div class="connector-line"></div>
          <div class="arrow-label">Top 2</div>
        </div>

        <!-- Tier 5: Worlds -->
        <div class="diagram-col">
          <div class="diagram-tier">
            <div class="diagram-node node-worlds" data-goto="showcase" data-scroll="champions-showcase">
              <span class="node-icon">&#127942;</span>
              <div class="node-title">World Championship</div>
              <div class="node-sub">Top 2 from each Showcase</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section>
      <h2>Key Numbers</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">40</span>
          <span class="stat-label">QPs to enter top events</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">$50K</span>
          <span class="stat-label">Showcase prize pool</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">8</span>
          <span class="stat-label">Showcase competitors</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">2</span>
          <span class="stat-label">Worlds seats per season</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">~17 wk</span>
          <span class="stat-label">Season length</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">3/yr</span>
          <span class="stat-label">Seasons per year</span>
        </div>
      </div>
    </section>

    <section>
      <h2>Two Parallel Paths</h2>
      <div class="info-card">
        <p><strong>MOCS Path:</strong> Showcase Challenges/LCEs &rarr; Showcase Qualifiers &rarr; Champions Showcase &rarr; World Championship</p>
        <p style="margin-top:0.5rem"><strong>Tabletop Path:</strong> Qualifiers/Super Qualifiers &rarr; Regional Championships &rarr; Pro Tour</p>
        <p style="margin-top:0.5rem;color:var(--muted);font-size:0.85rem">Top 8 finishes in both paths earn Leaderboard points, which also feed into the Showcase.</p>
      </div>
    </section>
  `;

  // Make diagram nodes clickable
  el.querySelectorAll('.diagram-node[data-goto]').forEach(node => {
    node.addEventListener('click', () => {
      const target = node.dataset.goto;
      document.querySelector('.tab.active').classList.remove('active');
      document.querySelector(`.tab[data-view="${target}"]`).classList.add('active');
      activeView = target;
      render();
      // Scroll to section if specified
      if (node.dataset.scroll) {
        setTimeout(() => {
          const heading = document.getElementById(node.dataset.scroll);
          if (heading) heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    });
  });
}

// ---------- EARNING QPs ----------
function renderEarningQPs(el) {
  el.innerHTML = `
    <section>
      <h2>Earning Qualifier Points</h2>
      <p class="intro">Qualifier Points (QPs) are the currency of the MOCS system. You need <strong>40 QPs</strong> to enter Qualifiers, Super Qualifiers, Showcase Challenges, and Last Chance Events. QPs reset at the end of each season.</p>
    </section>

    <section>
      <h2>QP Earning Comparison</h2>
      <div style="margin-bottom:1.5rem">
        <div class="bar-row">
          <span class="bar-label">Challenge 1st</span>
          <div class="bar-track"><div class="bar-fill" style="width:100%"></div></div>
          <span class="bar-count">50</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">Preliminary 4-0</span>
          <div class="bar-track"><div class="bar-fill" style="width:80%"></div></div>
          <span class="bar-count">40</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">Limited Chall. 6-0</span>
          <div class="bar-track"><div class="bar-fill" style="width:80%"></div></div>
          <span class="bar-count">40</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">Challenge 2nd</span>
          <div class="bar-track"><div class="bar-fill" style="width:80%"></div></div>
          <span class="bar-count">40</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">Preliminary 3-1</span>
          <div class="bar-track"><div class="bar-fill" style="width:40%"></div></div>
          <span class="bar-count">20</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">Preliminary 2-2</span>
          <div class="bar-track"><div class="bar-fill" style="width:20%"></div></div>
          <span class="bar-count">10</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">League 5-0</span>
          <div class="bar-track"><div class="bar-fill" style="width:10%"></div></div>
          <span class="bar-count">5</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">SE Draft 1st</span>
          <div class="bar-track"><div class="bar-fill" style="width:6%"></div></div>
          <span class="bar-count">3</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">Draft League 3-0</span>
          <div class="bar-track"><div class="bar-fill" style="width:4%"></div></div>
          <span class="bar-count">2</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">League 3-2</span>
          <div class="bar-track"><div class="bar-fill" style="width:2%"></div></div>
          <span class="bar-count">1</span>
        </div>
      </div>
      <div class="info-card callout">
        <strong>Fastest path:</strong> A single 4-0 Preliminary gets you to 40 QPs in one event. Through leagues alone, you'd need eight 5-0 finishes.
      </div>
    </section>

    <section>
      <h2>Constructed Leagues</h2>
      <div class="info-card">
        <div class="entry-line">Entry: 10 Tix / 100 PP &middot; 5 matches</div>
        <table class="prize-table">
          <thead><tr><th>Record</th><th>QPs</th></tr></thead>
          <tbody>
            <tr><td>5-0</td><td>5</td></tr>
            <tr><td>4-1</td><td>2</td></tr>
            <tr><td>3-2</td><td>1</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Competitive Sealed League</h2>
      <div class="info-card">
        <div class="entry-line">Entry: 24 Tix / 240 PP &middot; 5 matches</div>
        <table class="prize-table">
          <thead><tr><th>Record</th><th>QPs</th></tr></thead>
          <tbody>
            <tr><td>5-0</td><td>5</td></tr>
            <tr><td>4-1</td><td>2</td></tr>
            <tr><td>3-2</td><td>1</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Draft Events</h2>
      <div class="info-card">
        <div class="entry-line">Draft League: 12 Tix / 120 PP &middot; 3 matches</div>
        <table class="prize-table">
          <thead><tr><th>Record</th><th>QPs</th></tr></thead>
          <tbody>
            <tr><td>3-0</td><td>2</td></tr>
          </tbody>
        </table>
      </div>
      <div class="info-card">
        <div class="entry-line">Single Elimination Draft: 15 Tix / 150 PP &middot; 8 players</div>
        <table class="prize-table">
          <thead><tr><th>Finish</th><th>QPs</th></tr></thead>
          <tbody>
            <tr><td>1st</td><td>3</td></tr>
            <tr><td>2nd</td><td>1</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Cube &amp; Phantom Events</h2>
      <div class="info-card">
        <div class="entry-line">Cube Phantom Swiss League: 10 Tix / 100 PP &middot; 3 matches</div>
        <table class="prize-table">
          <thead><tr><th>Record</th><th>QPs</th></tr></thead>
          <tbody>
            <tr><td>3-0</td><td>2</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// ---------- PRELIMS & CHALLENGES ----------
function renderPrelims(el) {
  el.innerHTML = `
    <section>
      <h2>Preliminaries</h2>
      <p class="intro">4-round Swiss events &mdash; the most efficient way to reach the 40 QP threshold in a single event.</p>
      <div class="info-card">
        <div class="entry-line">Constructed: 20 Tix / 200 PP &middot; Limited: 30 Tix / 300 PP &middot; 12&ndash;256 players</div>
        <div class="entry-line">Formats: Standard, Modern, Legacy, Vintage, Pioneer, Pauper, Sealed</div>
        <table class="prize-table">
          <thead><tr><th>Record</th><th>QPs</th><th>Prizes (Constructed)</th></tr></thead>
          <tbody>
            <tr class="highlight"><td>4-0</td><td>40</td><td>400 PP, 5 Treasure Chests</td></tr>
            <tr><td>3-1</td><td>20</td><td>200 PP, 3 Treasure Chests</td></tr>
            <tr><td>2-2</td><td>10</td><td>100 PP</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Format Challenges</h2>
      <p class="intro">Weekend Swiss+Top 8 events with larger fields and bigger prizes.</p>

      <h3 class="subsection">Large Challenges (64+ players)</h3>
      <div class="info-card">
        <div class="entry-line">Entry: 30 Tix / 300 PP</div>
        <table class="prize-table">
          <thead><tr><th>Finish</th><th>QPs</th><th>PP</th><th>Chests</th></tr></thead>
          <tbody>
            <tr class="highlight"><td>1st</td><td>50</td><td>500</td><td>100</td></tr>
            <tr><td>2nd</td><td>40</td><td>400</td><td>75</td></tr>
            <tr><td>3rd&ndash;4th</td><td>30</td><td>300</td><td>50</td></tr>
            <tr><td>5th&ndash;8th</td><td>20</td><td>200</td><td>25</td></tr>
          </tbody>
        </table>
        <p class="table-note">Prize guarantee: players completing Swiss with exactly 2 losses receive PP to cover their entry.</p>
      </div>

      <h3 class="subsection">Small Challenges (32+ players)</h3>
      <div class="info-card">
        <div class="entry-line">Entry: 25 Tix / 250 PP</div>
        <table class="prize-table">
          <thead><tr><th>Finish</th><th>QPs</th><th>PP</th><th>Chests</th></tr></thead>
          <tbody>
            <tr class="highlight"><td>1st</td><td>50</td><td>350</td><td>100</td></tr>
            <tr><td>2nd</td><td>40</td><td>250</td><td>75</td></tr>
            <tr><td>3rd&ndash;4th</td><td>30</td><td>200</td><td>50</td></tr>
            <tr><td>5th&ndash;8th</td><td>20</td><td>150</td><td>25</td></tr>
          </tbody>
        </table>
      </div>

      <h3 class="subsection">Format Challenge Trials (16+ players)</h3>
      <div class="info-card">
        <div class="entry-line">Entry: 25 Tix / 250 PP &middot; 1st place earns 40 QPs</div>
      </div>
    </section>

    <section>
      <h2>Limited Challenges &amp; Phantom Sealed Trials</h2>
      <div class="info-card">
        <div class="entry-line">Limited Challenge: 35 Tix / 350 PP &middot; 32+ players &middot; 6 rounds</div>
        <table class="prize-table">
          <thead><tr><th>Record</th><th>QPs</th></tr></thead>
          <tbody>
            <tr class="highlight"><td>6-0</td><td>40</td></tr>
            <tr><td>5-1</td><td>30</td></tr>
            <tr><td>4-2</td><td>20</td></tr>
            <tr><td>3-3</td><td>10</td></tr>
          </tbody>
        </table>
      </div>
      <div class="info-card">
        <div class="entry-line">Phantom Sealed Trial: 25 Tix / 250 PP &middot; 24&ndash;64 players &middot; 5 rounds</div>
        <table class="prize-table">
          <thead><tr><th>Record</th><th>QPs</th></tr></thead>
          <tbody>
            <tr class="highlight"><td>5-0</td><td>40</td></tr>
            <tr><td>4-1</td><td>20</td></tr>
            <tr><td>3-2</td><td>10</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  `;
}

// ---------- QUALS & SUPERS ----------
function renderQuals(el) {
  el.innerHTML = `
    <section>
      <h2>Qualifiers</h2>
      <p class="intro">Spend 40 QPs to compete for tabletop Regional Championship invitations and Leaderboard points.</p>
      <div class="info-card">
        <div class="entry-line">Entry: 40 QPs &middot; 33&ndash;672 players &middot; Swiss + Top 8</div>
        <table class="prize-table">
          <thead><tr><th>Finish</th><th>PP</th><th>Chests</th><th>Set</th><th>LB Pts</th><th>Invitation</th></tr></thead>
          <tbody>
            <tr class="highlight"><td>1st</td><td>900</td><td>200</td><td>Premium</td><td>8</td><td>Regional Champ</td></tr>
            <tr class="highlight"><td>2nd</td><td>750</td><td>150</td><td>Premium</td><td>7</td><td>Regional Champ</td></tr>
            <tr><td>3rd&ndash;4th</td><td>600</td><td>100</td><td>Regular</td><td>6</td><td>&mdash;</td></tr>
            <tr><td>5th&ndash;8th</td><td>450</td><td>50</td><td>Regular</td><td>5</td><td>&mdash;</td></tr>
            <tr><td>9th&ndash;16th</td><td>300</td><td>25</td><td>&mdash;</td><td>&mdash;</td><td>&mdash;</td></tr>
            <tr><td>17th&ndash;32nd</td><td>300</td><td>15</td><td>&mdash;</td><td>&mdash;</td><td>&mdash;</td></tr>
            <tr><td>33rd&ndash;64th</td><td>150</td><td>5</td><td>&mdash;</td><td>&mdash;</td><td>&mdash;</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Super Qualifiers</h2>
      <p class="intro">Higher stakes &mdash; more flexible entry, larger fields, Top 4 earn Regional Championship invitations.</p>
      <div class="info-card">
        <div class="entry-line">Entry: 40 QPs OR 40 Tix OR 400 PP &middot; 129&ndash;672 players &middot; Swiss + Top 8</div>
        <table class="prize-table">
          <thead><tr><th>Finish</th><th>PP</th><th>Chests</th><th>Set</th><th>LB Pts</th><th>Invitation</th></tr></thead>
          <tbody>
            <tr class="highlight"><td>1st</td><td>900</td><td>200</td><td>Premium</td><td>10</td><td>Regional Champ</td></tr>
            <tr class="highlight"><td>2nd</td><td>900</td><td>200</td><td>Premium</td><td>9</td><td>Regional Champ</td></tr>
            <tr class="highlight"><td>3rd&ndash;4th</td><td>750</td><td>150</td><td>Premium</td><td>8</td><td>Regional Champ</td></tr>
            <tr><td>5th&ndash;8th</td><td>600</td><td>100</td><td>Regular</td><td>7</td><td>&mdash;</td></tr>
            <tr><td>9th&ndash;16th</td><td>400</td><td>50</td><td>&mdash;</td><td>&mdash;</td><td>&mdash;</td></tr>
            <tr><td>17th&ndash;32nd</td><td>400</td><td>25</td><td>&mdash;</td><td>&mdash;</td><td>&mdash;</td></tr>
            <tr><td>33rd&ndash;64th</td><td>400</td><td>10</td><td>&mdash;</td><td>&mdash;</td><td>&mdash;</td></tr>
            <tr><td>65th&ndash;128th</td><td>200</td><td>5</td><td>&mdash;</td><td>&mdash;</td><td>&mdash;</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Where This Path Leads</h2>
      <div class="flow-horizontal">
        <div class="flow-step">Qualifier / Super Qualifier</div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-step">Regional Championship</div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-step">Pro Tour</div>
      </div>
      <div class="info-card callout">
        Top 8 finishes also earn Leaderboard points, feeding into the Champions Showcase path.
      </div>
    </section>
  `;
}

// ---------- SHOWCASE PATH ----------
function renderShowcase(el) {
  const s = activeSeason;
  el.innerHTML = `
    <section>
      <h2>Showcase Path Overview</h2>
      <p class="intro">Three routes into the 8-player Champions Showcase.</p>
      <div class="flow-horizontal">
        <div class="flow-step">Showcase Challenges<br><small>Top 8 &rarr; token</small></div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-step">Showcase Qualifiers<br><small>Winner &rarr; Showcase</small></div>
        <div class="flow-arrow">&rarr;</div>
        <div class="flow-step">Champions Showcase<br><small>8 players, $50K</small></div>
      </div>
    </section>

    <section id="showcase-challenges">
      <h2>Step 1: Showcase Challenges</h2>
      <div class="info-card">
        <div class="entry-line">Entry: 40 QPs &middot; 33&ndash;672 players &middot; Swiss + Top 8</div>
        <div class="entry-line">3 per season &middot; ${s.label} formats: ${s.showcaseFormats.join(', ')}</div>
        <p><strong>Top 8 earn a Format Championship Token</strong> for the corresponding Showcase Qualifier.</p>
        <table class="prize-table">
          <thead><tr><th>Finish</th><th>PP</th><th>Chests</th><th>Set</th><th>LB Pts</th><th>Token</th></tr></thead>
          <tbody>
            <tr class="highlight"><td>1st</td><td>900</td><td>200</td><td>Premium</td><td>8</td><td>Yes</td></tr>
            <tr class="highlight"><td>2nd</td><td>750</td><td>150</td><td>Premium</td><td>7</td><td>Yes</td></tr>
            <tr><td>3rd&ndash;4th</td><td>600</td><td>100</td><td>Regular</td><td>6</td><td>Yes</td></tr>
            <tr><td>5th&ndash;8th</td><td>450</td><td>50</td><td>Regular</td><td>5</td><td>Yes</td></tr>
            <tr><td>9th&ndash;16th</td><td>300</td><td>25</td><td>&mdash;</td><td>&mdash;</td><td>&mdash;</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section id="last-chance">
      <h2>Backup: Last Chance Events</h2>
      <div class="info-card">
        <div class="entry-line">Entry: 40 QPs + 30 Tix / 300 PP &middot; 16&ndash;672 players &middot; 5-round Swiss</div>
        <div class="entry-line">End of season &middot; 4 events (one per format)${s.lastChanceDates.length ? ' &middot; ' + s.lastChanceDates.map(shortDate).join(', ') : ''}</div>
        <table class="prize-table">
          <thead><tr><th>Record</th><th>PP</th><th>Token</th></tr></thead>
          <tbody>
            <tr class="highlight"><td>5-0</td><td>600</td><td>Yes</td></tr>
            <tr><td>4-1</td><td>450</td><td>&mdash;</td></tr>
            <tr><td>3-2</td><td>300</td><td>&mdash;</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section id="showcase-qualifiers">
      <h2>Step 2: Showcase Qualifiers</h2>
      <div class="info-card">
        <div class="entry-line">Entry: Format Championship Token &middot; 8&ndash;64 players &middot; Swiss + Top 8</div>
        <div class="entry-line">4 per season (one per format)${s.showcaseQualifierDates.length ? ' &middot; ' + s.showcaseQualifierDates.map(shortDate).join(', ') : ''}</div>
        <p><strong>Winner earns Champions Showcase + Pro Tour + Regional Championship invitations.</strong></p>
        <table class="prize-table">
          <thead><tr><th>Finish</th><th>PP</th><th>Chests</th><th>LB Pts</th><th>Invitations</th></tr></thead>
          <tbody>
            <tr class="highlight"><td>1st</td><td>900</td><td>200</td><td>&mdash;</td><td>Showcase + PT + RC</td></tr>
            <tr><td>2nd</td><td>750</td><td>150</td><td>12</td><td>&mdash;</td></tr>
            <tr><td>3rd&ndash;4th</td><td>600</td><td>100</td><td>10</td><td>&mdash;</td></tr>
            <tr><td>5th&ndash;8th</td><td>450</td><td>50</td><td>7</td><td>&mdash;</td></tr>
          </tbody>
        </table>
        <p class="table-note">Winners cannot enter further Showcase Qualifiers or Opens that season. All Top 8 receive a Format Avatar.</p>
      </div>
    </section>

    <section id="showcase-opens">
      <h2>Alternate: Showcase Opens</h2>
      <div class="info-card">
        <div class="entry-line">Entry: 40 Tix / 400 PP (no QPs needed!) &middot; 33&ndash;672 players &middot; Sealed + Top 8 Draft</div>
        <div class="entry-line">2 per season${s.showcaseOpenDates.length ? ' &middot; ' + s.showcaseOpenDates.map(shortDate).join(', ') : ''}</div>
        <p><strong>Winner earns Champions Showcase + Pro Tour + Regional Championship invitations.</strong></p>
        <table class="prize-table">
          <thead><tr><th>Finish</th><th>PP</th><th>Chests</th><th>LB Pts</th><th>Invitations</th></tr></thead>
          <tbody>
            <tr class="highlight"><td>1st</td><td>900</td><td>200</td><td>&mdash;</td><td>Showcase + PT + RC</td></tr>
            <tr><td>2nd</td><td>750</td><td>150</td><td>8</td><td>&mdash;</td></tr>
            <tr><td>3rd&ndash;4th</td><td>600</td><td>100</td><td>7</td><td>&mdash;</td></tr>
            <tr><td>5th&ndash;8th</td><td>450</td><td>50</td><td>6</td><td>&mdash;</td></tr>
          </tbody>
        </table>
        <p class="table-note">Winner of the first Open cannot enter the second. Open entry requires no QPs &mdash; anyone can enter.</p>
      </div>
    </section>

    <section id="leaderboard">
      <h2>Leaderboard</h2>
      <div class="info-card">
        <p>Leaderboard points accumulate from Top 8 finishes across qualifying events:</p>
        <table class="prize-table compact">
          <thead><tr><th>Event</th><th>1st</th><th>2nd</th><th>3rd&ndash;4th</th><th>5th&ndash;8th</th></tr></thead>
          <tbody>
            <tr><td>Showcase Qualifier</td><td>&mdash;</td><td>12</td><td>10</td><td>7</td></tr>
            <tr><td>Super Qualifier</td><td>10</td><td>9</td><td>8</td><td>7</td></tr>
            <tr><td>Qualifier</td><td>8</td><td>7</td><td>6</td><td>5</td></tr>
            <tr><td>Showcase Challenge</td><td>8</td><td>7</td><td>6</td><td>5</td></tr>
            <tr><td>Showcase Open</td><td>&mdash;</td><td>8</td><td>7</td><td>6</td></tr>
          </tbody>
        </table>
        <p style="margin-top:0.75rem"><strong>Top 2 uninvited players</strong> at season's end earn Champions Showcase + Pro Tour invitations.</p>
        <p style="margin-top:0.5rem"><strong>Tiebreakers:</strong> 1) Most Top 8 finishes, 2) Highest single-event points, 3) Most QPs during season.</p>
      </div>
    </section>

    <section id="champions-showcase">
      <h2>Champions Showcase</h2>
      <div class="info-card">
        <div class="entry-line">8 players: 4 Showcase Qualifier winners + 2 Open winners + 2 Leaderboard qualifiers</div>
        <div class="entry-line">Format: Vintage Cube Draft (3 rounds) + Modern Constructed (3 rounds)</div>
        <div class="entry-line">Prize pool: $50,000</div>
        <table class="prize-table">
          <thead><tr><th>Achievement</th><th>Prize</th></tr></thead>
          <tbody>
            <tr><td>Participation</td><td>$500</td></tr>
            <tr><td>1st match win</td><td>+$1,000</td></tr>
            <tr><td>2nd match win</td><td>+$2,000</td></tr>
            <tr><td>3rd match win (pod winner)</td><td>+$4,000 + Worlds invite</td></tr>
            <tr class="highlight"><td>Championship match winner</td><td>+$4,000</td></tr>
          </tbody>
        </table>
        <p class="table-note">If one player wins both pods, they are Champion. Otherwise the two pod winners play a Bo3 Modern playoff. Top 2 earn World Championship seats.</p>
      </div>
    </section>
  `;
}

// ---------- SEASON INFO ----------
function renderSeasonInfo(el) {
  const s = activeSeason;
  const progress = seasonProgress(s);
  const remaining = daysLeft(s);

  el.innerHTML = `
    <section>
      <h2>${s.label}</h2>
      ${s.current ? `
      <div class="season-progress">
        <div class="progress-labels">
          <span>${fmtDate(s.start)}</span>
          <span>${remaining} days remaining</span>
          <span>${fmtDate(s.end)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progress}%"></div>
        </div>
      </div>
      ` : `
      <div class="info-card">
        <div class="entry-line">${fmtDate(s.start)} &ndash; ${fmtDate(s.end)}</div>
      </div>
      `}
    </section>

    <section>
      <h2>Season Details</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-value">${s.rotatingFormat}</span>
          <span class="stat-label">Rotating format</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${s.showcaseFormats.length}</span>
          <span class="stat-label">Showcase formats</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">${s.current ? remaining : 0}</span>
          <span class="stat-label">Days left</span>
        </div>
      </div>
      <div class="info-card" style="margin-top:1rem">
        <p><strong>Showcase formats:</strong> ${s.showcaseFormats.join(', ')}</p>
        ${s.notes ? `<p style="margin-top:0.5rem;color:var(--muted);font-size:0.85rem">${s.notes}</p>` : ''}
      </div>
    </section>

    <section>
      <h2>Key Dates</h2>
      <div class="info-card">
        <table class="prize-table">
          <thead><tr><th>Event</th><th>Dates</th></tr></thead>
          <tbody>
            <tr><td>Season window</td><td>${fmtDate(s.start)} &ndash; ${fmtDate(s.end)}</td></tr>
            ${s.lastChanceDates.length ? `<tr><td>Last Chance Events</td><td>${s.lastChanceDates.map(shortDate).join(', ')}</td></tr>` : ''}
            ${s.showcaseQualifierDates.length ? `<tr><td>Showcase Qualifiers</td><td>${s.showcaseQualifierDates.map(shortDate).join(', ')}</td></tr>` : ''}
            ${s.showcaseOpenDates.length ? `<tr><td>Showcase Opens</td><td>${s.showcaseOpenDates.map(shortDate).join(', ')}</td></tr>` : ''}
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>All Seasons</h2>
      <div class="info-card">
        <table class="prize-table">
          <thead><tr><th>Season</th><th>Dates</th><th>Rotating Format</th><th>Status</th></tr></thead>
          <tbody>
            ${MOCS_DATA.seasons.map(sz => `
              <tr${sz.current ? ' class="highlight"' : ''}>
                <td>${sz.label}</td>
                <td>${shortDate(sz.start)} &ndash; ${shortDate(sz.end)}</td>
                <td>${sz.rotatingFormat}</td>
                <td>${sz.current ? 'Active' : 'Archived'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Format Rotation</h2>
      <div class="info-card">
        <p>Showcase Challenges always feature Modern, Legacy, and Standard. The 4th format rotates:</p>
        <table class="prize-table compact">
          <thead><tr><th>Season</th><th>4th Format</th></tr></thead>
          <tbody>
            <tr><td>Season 1</td><td>Vintage</td></tr>
            <tr><td>Season 2</td><td>Pauper</td></tr>
            <tr><td>Season 3</td><td>Pioneer</td></tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2>Eligibility Notes</h2>
      <div class="info-card">
        <ul class="changes-list">
          <li>Minimum age 13 to compete in MTGO events</li>
          <li>Players under 18 can win digital prizes but cannot receive tabletop invitations or compete in Champions Showcase</li>
          <li>Minimum age 18 for Champions Showcase participation</li>
          <li>If a Leaderboard invitee already holds a Pro Tour invitation, that invite passes down</li>
        </ul>
      </div>
    </section>
  `;
}

// ---------- Boot ----------
render();
