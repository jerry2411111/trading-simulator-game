// First-run Alpaca key setup wizard.
const STEPS = [
  'Open alpaca.markets (button below) and click <b>Sign Up</b>.',
  'Sign up with your email and a password, then confirm the email they send you.',
  'If it asks for bank details or ID, skip it: you only need a free <b>paper</b> (practice) account.',
  'In the dashboard, make sure the <b>"Paper Trading"</b> view is selected (top of the page).',
  'Find <b>"API Keys"</b> and click <b>"Generate New Keys"</b>.',
  'Copy the <b>Key ID</b> (starts with "PK") and the <b>Secret Key</b>. The secret is shown only once, so paste it here right away.',
];

const CONNECTED = {
  sip: 'Connected ✓ Full-market data.',
  iex: 'Connected ✓ IEX data only: second-by-second charts will be thinner (IEX is a small share of total trading). The game still works.',
};

export function showSetup(root, { reason = '', onDone, onCancel = null }) {
  root.hidden = false;
  root.innerHTML = `
    <div class="window setup">
      <div class="titlebar">TapeTrainer Setup</div>
      <div class="window-body setup-body">
        <section>
          ${reason ? `<p class="notice">${reason}</p>` : ''}
          <h1>TapeTrainer replays REAL market data.</h1>
          <p>Every game replays real trades from real US stocks on a random day since 2024. The data comes
          from Alpaca, a US broker that gives free historical market data. To download it, you need your own
          free Alpaca key. It takes about 3 minutes, costs nothing, needs no bank account or ID, and works
          from any country. Your key and data stay on your computer; TapeTrainer never sends them anywhere else.</p>
        </section>
        <section>
          <ol>${STEPS.map((s) => `<li>${s}</li>`).join('')}</ol>
          <a class="button" href="https://alpaca.markets" target="_blank" rel="noopener">Open alpaca.markets ↗</a>
          <p class="small">Alpaca may change its website; if a step looks different, look for 'API Keys' on the
          Paper Trading dashboard. <a href="https://docs.alpaca.markets/" target="_blank" rel="noopener">Alpaca docs</a></p>
        </section>
        <form id="key-form" autocomplete="off">
          <label>Key ID <input name="key_id" spellcheck="false" placeholder="PK…" required></label>
          <label>Secret Key
            <span class="row">
              <input name="secret" type="password" spellcheck="false" required>
              <button type="button" id="toggle-secret">Show</button>
            </span>
          </label>
          <div class="row">
            <button type="submit" class="primary">Connect</button>
            ${onCancel ? '<button type="button" id="cancel-setup">Cancel</button>' : ''}
          </div>
          <p id="key-result" role="status"></p>
        </form>
      </div>
    </div>`;

  const form = root.querySelector('#key-form');
  const result = root.querySelector('#key-result');
  const submit = form.querySelector('[type=submit]');
  root.querySelector('#toggle-secret').onclick = (e) => {
    const hidden = form.secret.type === 'password';
    form.secret.type = hidden ? 'text' : 'password';
    e.target.textContent = hidden ? 'Hide' : 'Show';
  };
  if (onCancel) root.querySelector('#cancel-setup').onclick = () => { root.hidden = true; onCancel(); };

  form.onsubmit = async (e) => {
    e.preventDefault();
    submit.disabled = true;
    result.className = '';
    result.textContent = 'Connecting…';
    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key_id: form.key_id.value, secret: form.secret.value }),
      });
      const body = await res.json();
      if (!body.ok) {
        result.className = 'bad';
        result.textContent = body.message || "That key didn't work.";
        return;
      }
      form.secret.value = '';
      result.className = 'good';
      result.textContent = CONNECTED[body.feed];
      submit.textContent = 'Start';
      submit.disabled = false;
      form.onsubmit = (ev) => { ev.preventDefault(); root.hidden = true; onDone(body.feed); };
    } catch {
      result.className = 'bad';
      result.textContent = "Couldn't reach the TapeTrainer server. Is it still running?";
    } finally {
      submit.disabled = false;
    }
  };
}
