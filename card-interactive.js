/* ─────────────────────────────────────────────────────────────
   Heartsays · Interactive card engine  v4
   Birthday:     env → greet → balloons → cake → bouquet → polaroid → letter → close
   Anniversary:  env → msg → cake → letter → close
   ───────────────────────────────────────────────────────────── */
(function(){
  var q = new URLSearchParams(location.search);

  // ── card-content locale ──
  // Only the card's own copy (letter, captions, on-card buttons) is ever
  // localized — the app around it (checkout, step titles) stays English and
  // never reaches this file. LANG comes from ?lang= on this URL (the sender
  // flow / RecipientCard set it from the card's stored language). Missing or
  // 'en' skips the fetch entirely and main() runs immediately with L={}, so
  // every t() call below just returns its English fallback — i.e. today's
  // behaviour, unchanged.
  var LANG = q.get('lang') || '';
  var LOCALE_V = '1';   // bump whenever public/locales/*.json changes
  // Same bday/anniv normalization TYPE uses below, computed early because the
  // fetch has to start before main() (and its own TYPE) exists.
  var LOCALE_FLOW = (q.get('type') === 'anniv') ? 'anniv' : 'bday';
  function startEngine(main){
    if (!LANG || LANG === 'en') { main({}); return; }
    // Versioned for the same reason the script tag is: browsers cache by URL,
    // so without this a corrected translation would never reach a device that
    // already holds the old file. Bump LOCALE_V when any locale JSON changes.
    fetch('/locales/' + LOCALE_FLOW + '.json?v=' + LOCALE_V)
      .then(function(r){ return r.ok ? r.json() : {}; })
      .then(function(all){ main(all[LANG] || {}); })
      .catch(function(){ main({}); });
  }

  startEngine(function main(L){
  // ── translate helper ──
  // Looks up a dotted path (e.g. 'balloons.cue') in the loaded locale dict; 
  // falls back to the English text already baked into this file whenever the
  // locale is 'en', hasn't got that key yet, or failed to load.
  function t(path, fallback){
    var cur = L;
    var parts = path.split('.');
    for (var i = 0; i < parts.length; i++){
      cur = cur && cur[parts[i]];
    }
    return (cur !== undefined && cur !== null && cur !== '') ? cur : fallback;
  }

  var TYPE = (q.get('type') === 'anniv') ? 'anniv' : 'bday';
  document.body.dataset.type = TYPE;
  // Birthday-only style pick ("Cute & Sweet" vs "Classic") — see the
  // body[data-type="bday"][data-style="cute"] override in the stylesheet.
  document.body.dataset.style = q.get('style') === 'cute' ? 'cute' : 'classic';
  var AUTO = (q.get('autoplay') === '1');     // sender preview: plays start→finish and loops
  var GUIDE = (q.get('guide') === '1');       // recipient final card: fully tap-driven
  var PREVIEW = (q.get('preview') === '1');   // landing "see what's inside": plays ONCE, no loop
  // The parent React page (BirthdayFlow) owns audio for this embed instead —
  // it plays a persistent, off-DOM <video> started synchronously inside the
  // real tap that navigates Hub→Preview, which is the only way to get sound
  // actually running the instant the screen appears (a same-origin postMessage
  // or an in-frame timer both land outside that gesture's call stack, and iOS
  // silently refuses to start audio outside one). Card-local audio would just
  // double up with that, so it's disabled here, and the on-card sound toggle
  // (redundant with the parent's own Play/Mute row) is hidden.
  var EXT_AUDIO = (q.get('extaudio') === '1');
  if (EXT_AUDIO) {
    var soundBtnEl = document.getElementById('sound-btn');
    if (soundBtnEl) soundBtnEl.style.display = 'none';
    // Drop the media too, not just the controls. The <video> carries
    // preload="auto" and the mp3 is fetched below, so without this the embed
    // still pulls ~3.2MB of audio it will never play — which on the landing
    // page is 3.2MB on every visit, on the connection where it matters most.
    var extVid = document.getElementById('bday-audio-video');
    if (extVid) extVid.preload = 'none';
  }

  // Recipient-only "Make one too" CTA on the close screen (never in the sender
  // preview or the landing sample, where it would leak out of the funnel).
  if (GUIDE) document.body.classList.add('show-make-one');

  // Notify the embedding modal (landing page) when the one-shot preview ends or
  // is replayed, so it can arm/disarm the CTA's idle nudge. No-op everywhere
  // else (only the preview modal listens for these).
  function previewPost(ev){
    if (!PREVIEW) return;
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ event: ev, props: {} }, location.origin);
      }
    } catch (e) { /* never break the card */ }
  }

  // ── lifecycle bridge (parent flow's preview tune) ──
  // Ungated, unlike previewPost above: the sender preview needs these too, so
  // the tune can follow the card instead of running on its own clock. The
  // parent flow is the only listener and whitelists by event name, so this is
  // inert on the recipient page and in the landing modal.
  function lifePost(state){
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ event: 'preview_lifecycle', props: { state: state } }, location.origin);
      }
    } catch (e) { /* never break the card */ }
  }

  // ── analytics bridge ──
  // Forward recipient interaction milestones to the parent React page, which
  // owns the Mixpanel SDK (one SDK, one identity — see analytics_plan §6).
  // No-ops in the sender preview (only the recipient /c page mounts a listener)
  // and when the card isn't embedded in an iframe.
  function mpPost(event, props){
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ event: event, props: props || {} }, location.origin);
      }
    } catch (e) { /* analytics must never break the card */ }
  }
  var _lastRevealIdx = 0; // s-env (index 0) is the cover, not a reveal
  var _fullyRevealedSent = false; // fire the milestone once per session, not per replay
  var _maxPopped = 0;             // deepest balloon count reported, same reason
  function mpReveal(i){
    if (!GUIDE) return;                 // only the recipient card reports reveals
    if (i > _lastRevealIdx){
      _lastRevealIdx = i;
      // reveal_name travels with the index because the index alone is
      // positional: the birthday card went 6 screens -> 8 in the rebuild, so
      // the same reveal_index now points at a different beat and any chart
      // keyed on it silently mis-reports across that date. The screen id is
      // stable, so prefer it when segmenting.
      mpPost('card_reveal_tapped', {
        reveal_index: i,
        reveal_name: screens[i],
        reveal_total: screens.length - 1
      });
    }
    // Both milestones are deduped per session so replays ("Watch again") don't
    // inflate the funnel — _lastRevealIdx already guards reveal_tapped.
    if (i === screens.length - 1 && !_fullyRevealedSent){
      _fullyRevealedSent = true;
      mpPost('card_fully_revealed', { reveal_total: screens.length - 1 });
    }
  }

  var FROM  = q.get('from')  || '';
  var P1 = q.get('p1'), P2 = q.get('p2');
  var NAME  = q.get('name')  || P1 || '';
  if (TYPE === 'anniv' && P1) NAME = P2 ? (P1 + ' & ' + P2) : P1;
  var YEARS = q.get('years');
  var CELEB_EMOJI = q.get('celeb') || '';
  // Sender-uploaded photos, added after payment (see /api/card/photos).
  // Absent on every card made before the feature and on any card whose sender
  // skipped it — the polaroid beat falls back to its emoji, unchanged.
  var PHOTOS = [];
  for (var phI = 1; phI <= 5; phI++) {
    var phU = q.get('ph' + phI);
    if (phU) PHOTOS.push(phU);
  }
  var CHAR = q.get('char') || '';            // character key (best friend, partner, …)
  var CHAR_LABEL = q.get('charlabel') || ''; // "your Best Friend"
  var CAKE = q.get('cake') || 'vanilla';     // cake key

  var HA = (typeof window !== 'undefined') ? window.HeartArt : null;
  function charHTML(){ return (HA && CHAR) ? HA.characterHTML(CHAR) : ''; }
  function charOrEmoji(scale){
    var html = charHTML();
    if (!html) return null;
    return '<div style="width:120px;height:120px;transform:scale(' + (scale || 1) + ');transform-origin:center;">' + html + '</div>';
  }

  // target date for countdown (defaults to ~6 days out)
  var DATE = q.get('date');
  var target;
  if (DATE) {
    // "YYYY-MM-DD" must be read in the viewer's LOCAL timezone. `new Date(DATE)`
    // would parse a date-only ISO string as UTC midnight, so an IST viewer would
    // see the countdown end at 05:30 local instead of local midnight.
    var dparts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(DATE);
    if (dparts) {
      target = new Date(+dparts[1], +dparts[2] - 1, +dparts[3]);
    } else {
      target = new Date(DATE);
    }
    if (isNaN(target)) target = null;
  }
  if (!target) { target = new Date(); target.setDate(target.getDate() + 6); target.setHours(9,0,0,0); }

  // screen list differs by type
  // Birthday runs a sequence of short, interactive beats (greeting → balloon
  // pop → cake → bouquet → polaroid → letter), each carrying a few words
  // rather than paragraphs. The old text-heavy s-msg/s-celebrate slides are
  // dropped for bday; anniversary keeps its original flow untouched.
  var screens = TYPE === 'bday'
    ? ['s-env','s-greet','s-balloons','s-cake','s-bouquet','s-polaroid','s-letter','s-close']
    : ['s-env','s-msg','s-cake','s-letter','s-close'];

  // ── messages ──
  var defMsgBday = [
    {ico:'🎂', t:'Today the world got a little brighter — because it’s the day it got <em>you.</em>'},
    {ico:'🎈', t:'I hope this year is loud in all the best ways: big laughs, good people, zero boring Tuesdays.'},
    {ico:'💛', t:'Before the cake and the candles — I just wanted you to feel <em>how loved you are.</em>'}
  ];
  var defMsgAnniv = [
    {ico:'💞', t:'Of all the people, in all the years — somehow it’s been <em>us.</em> And I’d choose it again.'},
    {ico:'✨', t:'Every ordinary day with you turned out to be the good old days. I just didn’t know it yet.'},
    {ico:'🥂', t:'Before the toast and the looking-back — I wanted you to feel <em>how grateful I am for us.</em>'}
  ];
  var MSGS = [];
  for (var i = 1; i <= 6; i++) { var m = q.get('m' + i); if (m) MSGS.push({ico: q.get('mi' + i) || '💌', t:m}); }
  if (!MSGS.length) MSGS = (TYPE === 'anniv') ? defMsgAnniv : defMsgBday;

  var BDAY_NOTE_FALLBACK = t('letter.fallbackNote',
    'Happy birthday, {name}.\n\nYou’re the only person I know who can make a\nTuesday feel like a festival. This year I hope\nthe world is as generous to you as you’ve always\nbeen to everyone lucky enough to know you.\n\nHere’s to another trip around the sun.'
  ).replace('{name}', NAME || 'you');
  var NOTE = q.get('note') || (TYPE === 'anniv'
    ? 'Four years ago I had no idea what we were\nstarting. I just knew you laughed too loud at\nyour own jokes and I never wanted you to stop.\n\nToday I can’t imagine a single ordinary morning\nwithout you in it. Thank you for every year,\nand for every one still coming.'
      + (FROM ? '\n\n— ' + FROM : '')
    : BDAY_NOTE_FALLBACK + (FROM ? '\n— ' + FROM : ''));

  // ── static DOM setup ──
  function $(id){ return document.getElementById(id); }

  // birthday countdown name
  if (NAME) $('bday-name-env').textContent = NAME;
  else if (TYPE === 'bday') $('bday-name-env').textContent = t('env.defaultName', 'You');

  // cake celebrate-msg
  if (TYPE === 'anniv') {
    $('celebrate-msg').innerHTML = P1
      ? 'Happy Anniversary,<br><em>' + P1 + '!</em>'
      : 'Happy Anniversary!';
    $('tap-cue').innerHTML = '<span class="pinch">🩷</span> Tap to fill with love!';
  } else {
    var celebMsgEl = $('celebrate-msg');
    if (celebMsgEl) {
      var celebTmpl = t('cake.celebrateMsg', 'Happy Birthday,\n{name}!');
      var celebParts = celebTmpl.split('{name}');
      celebMsgEl.innerHTML = celebParts[0].replace(/\n/g, '<br>')
        + '<em id="bday-name-cake">' + esc(NAME || 'friend') + '</em>'
        + (celebParts[1] || '').replace(/\n/g, '<br>');
    }
  }

  // close screen
  if (TYPE === 'anniv') {
    $('close-line').innerHTML = 'A Pinky Promise? 🤙';
    var closeSub = $('close-sub');
    closeSub.style.display = '';
    closeSub.textContent = 'A million promises kept, and a billion more to go.' + (FROM ? ' — ' + FROM : '');
    $('anniv-cd-label').textContent = YEARS ? 'Your ' + YEARS + ' arrives in' : 'Your anniversary arrives in';
    $('arch-for').textContent = (P1 || 'you') + ' 🩷';
  } else {
    $('close-line').innerHTML = FROM
      ? (function(){
          var sealTmpl = t('close.sealedWithFrom', 'Sealed with love,\n{from}');
          var sealParts = sealTmpl.split('{from}');
          return sealParts[0].replace(/\n/g, '<br>') + '<em>' + esc(FROM) + '</em>' + (sealParts[1] || '').replace(/\n/g, '<br>');
        })()
      : t('close.sealedNoFrom', 'Sealed with love 🥰');
    var closeArt = charOrEmoji(0.9);
    if (closeArt) { $('close-char').innerHTML = closeArt; $('celeb-char').innerHTML = charOrEmoji(1) || ''; }
    else if (CELEB_EMOJI) { $('close-char').textContent = CELEB_EMOJI; $('celeb-char').textContent = CELEB_EMOJI; }
  }

  // letter character — the chosen friend signs off *below* the letter text.
  // Box is sized to the scaled art (74px) so it never overlaps the writing.
  var letterCharHTML = charHTML();
  if (letterCharHTML) {
    $('letter-char').innerHTML =
      '<div style="width:120px;height:120px;transform:scale(.617);transform-origin:top left">' + letterCharHTML + '</div>';
  } else {
    $('letter-char').textContent = CELEB_EMOJI || (TYPE === 'anniv' ? '🌹' : '🎂');
  }

  // ── starfield (birthday) ──
  if (TYPE === 'bday') {
    var sky = $('sky');
    var seed = 1337;
    var rnd = function(){ seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (var si = 0; si < 48; si++) {
      var st = document.createElement('span');
      st.className = 'star' + (rnd() > 0.72 ? ' pink' : '');
      var sz = 1 + rnd() * 2.2;
      st.style.cssText = 'left:' + (rnd()*100) + '%;top:' + (rnd()*100) + '%;width:' + sz + 'px;height:' + sz + 'px;opacity:' + (0.15+rnd()*.55).toFixed(2) + ';animation-delay:' + (rnd()*4).toFixed(2) + 's';
      sky.appendChild(st);
    }
  }

  // ── floating hearts (anniversary) ──
  if (TYPE === 'anniv') {
    var sky2 = $('sky');
    var hg = ['🩷','💗','💝','✨'];
    for (var hi = 0; hi < 14; hi++) {
      var h = document.createElement('span');
      h.className = 'fheart';
      h.textContent = hg[hi % hg.length];
      h.style.left = (4 + Math.random()*92) + '%';
      h.style.top = (30 + Math.random()*70) + '%';
      h.style.fontSize = (10 + Math.random()*14) + 'px';
      h.style.setProperty('--dur', (8 + Math.random()*7) + 's');
      h.style.setProperty('--delay', (-Math.random()*10) + 's');
      h.style.setProperty('--dx', ((Math.random()*40)-20) + 'px');
      h.style.setProperty('--op', (0.25 + Math.random()*0.35).toFixed(2));
      h.style.setProperty('--sc', (0.8 + Math.random()*0.5).toFixed(2));
      sky2.appendChild(h);
    }
  }

  // ── progress dots ──
  var pdotsEl = $('pdots');
  screens.forEach(function(){ var d = document.createElement('i'); pdotsEl.appendChild(d); });

  // ════════ AUDIO ════════
  // pageHidden guards every sound path so the card falls silent the instant it
  // stops being the visible page. The autoplay preview loops forever and
  // re-triggers the melody each cycle; a card iframe can outlive its on-screen
  // life — kept alive by bfcache, an in-app browser backgrounding the previous
  // page, or a detached iframe awaiting GC after a route change — and without
  // this it would keep playing out loud over whatever page the visitor moved to.
  var AC = null, muted = false, gainMaster = null, pageHidden = false, celebrationPlayed = false;

  // ── bday: real muxed audio+video track ──
  // A <video> element with an actual video track is exempt from iOS's
  // silent-switch mute (confirmed: plain Web Audio here was silenced with
  // the phone muted, even fully unblocked/'running'). This is the same tune
  // muxed against a static frame purely for that exemption. Falls back to
  // the Web-Audio mp3-buffer/synth system further below only if this
  // element fails to load (unsupported codec, network error) — everything
  // downstream of playHappyBirthday() still works unchanged in that case.
  var bdayVideoEl = (TYPE === 'bday' && !EXT_AUDIO) ? document.getElementById('bday-audio-video') : null;
  // Attach the source here rather than in the markup — see the note on the
  // element. Embeds that don't own audio (landing samples, the sender preview
  // whose parent plays the tune) never touch it, so they never fetch it.
  if (bdayVideoEl) bdayVideoEl.src = '/audio/birthday-video.m4v';
  var bdayVideoFailed = false;
  if (bdayVideoEl) bdayVideoEl.addEventListener('error', function(){ bdayVideoFailed = true; });
  function playViaVideo(){
    if (!bdayVideoEl || bdayVideoFailed) return null;
    bdayVideoEl.muted = muted;
    var p = bdayVideoEl.play();
    return (p && p.then) ? p : Promise.resolve();
  }
  // Loop watcher: polls AC.currentTime (not wall-clock) against the next
  // scheduled replay time, so pausing (AC.suspend() freezes AC.currentTime
  // itself) can never cause an early/duplicate replay — the check simply
  // stops advancing while suspended and picks up exactly where it left off.
  var celebrationLoopWatcher = null, celebrationNextAt = 0;
  function scheduleCelebrationLoop(durationSec, replay){
    celebrationNextAt = AC.currentTime + durationSec;
    if (celebrationLoopWatcher) return;
    celebrationLoopWatcher = setInterval(function(){
      if (!AC || pageHidden || AC.state !== 'running') return;
      if (AC.currentTime >= celebrationNextAt) replay();
    }, 250);
  }
  function ensureAudio(){
    if (AC) return AC;
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); }
    catch{ return null; }
    gainMaster = AC.createGain(); gainMaster.gain.value = muted ? 0 : 0.5;
    gainMaster.connect(AC.destination);
    return AC;
  }

  // ── real birthday track (public/audio/birthday.mp3) ──
  // Fetched + decoded as early as possible (well before the user opens the
  // card) so it's ready the instant playHappyBirthday() wants it. Falls back
  // to the synthesized _doPlayBirthday() tune if the file is missing, the
  // fetch fails, or decodeAudioData rejects (e.g. an unsupported browser) —
  // silence would be a worse failure mode than the chiptune version.
  var bdayMusicBuffer = null, bdayMusicLoading = null, bdayMusicSource = null;
  function loadBdayMusic(){
    if (bdayMusicLoading) return bdayMusicLoading;
    bdayMusicLoading = fetch('/audio/birthday.mp3')
      .then(function(r){ if (!r.ok) throw new Error('fetch failed'); return r.arrayBuffer(); })
      .then(function(buf){
        var ctx = ensureAudio();
        if (!ctx) return null;
        return new Promise(function(resolve){
          ctx.decodeAudioData(buf, function(decoded){ bdayMusicBuffer = decoded; resolve(decoded); }, function(){ resolve(null); });
        });
      })
      .catch(function(){ return null; });
    return bdayMusicLoading;
  }
  if (TYPE === 'bday' && !EXT_AUDIO) loadBdayMusic();
  function playBdayMusicBuffer(){
    if (!AC || !gainMaster || !bdayMusicBuffer) return false;
    try {
      if (bdayMusicSource) { try { bdayMusicSource.stop(); } catch{} }
      bdayMusicSource = AC.createBufferSource();
      bdayMusicSource.buffer = bdayMusicBuffer;
      bdayMusicSource.loop = true; // native loop — no polling needed for the real track
      bdayMusicSource.connect(gainMaster);
      bdayMusicSource.start(0);
      return true;
    } catch { return false; }
  }
  function tone(freq, start, dur, peak, type){
    if (!AC) return;
    var o = AC.createOscillator(), g = AC.createGain();
    o.type = type || 'triangle'; o.frequency.value = freq;
    var t0 = AC.currentTime + start;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak || 0.3, t0 + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(gainMaster);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }
  var N = {G4:392,A4:440,B4:493.88,C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99,
           C4:261.63,E4:329.63,F4:349.23,A3:220,E3:164.81,G3:196};
  function _doPlayBirthday(){
    var b = 0.42, t = 0.05;
    [['G4',.5],['G4',.5],['A4',1],['G4',1],['C5',1],['B4',2],
     ['G4',.5],['G4',.5],['A4',1],['G4',1],['D5',1],['C5',2],
     ['G4',.5],['G4',.5],['G5',1],['E5',1],['C5',1],['B4',1],['A4',2],
     ['F5',.5],['F5',.5],['E5',1],['C5',1],['D5',1],['C5',3]
    ].forEach(function(s){ var d=s[1]*b; tone(N[s[0]],t,d*.95,.32,'triangle'); t+=d; });
    return t + 0.6; // + a short breath before it loops
  }
  function startBdayAudio(){
    if (playBdayMusicBuffer()) return; // real track — loops itself natively
    if (bdayMusicBuffer === null && bdayMusicLoading) {
      // Not decoded yet (slow network) — wait for it rather than falling back
      // immediately, so the common case still gets the real track.
      bdayMusicLoading.then(function(){
        if (!playBdayMusicBuffer()) scheduleCelebrationLoop(_doPlayBirthday(), function(){ _doPlayBirthday(); });
      });
      return;
    }
    scheduleCelebrationLoop(_doPlayBirthday(), function(){ _doPlayBirthday(); }); // fallback: synthesized tune, looped
  }
  function playHappyBirthday(){
    if (pageHidden) return;
    var viaVideo = playViaVideo();
    if (viaVideo) {
      viaVideo.then(function(){ celebrationPlayed = true; }).catch(function(){ /* blocked — gesture retry below will retry */ });
      return;
    }
    if (!ensureAudio()) return;
    // WebKit/iOS can report 'interrupted' (its own non-spec state for a
    // blocked/interrupted context), not just 'suspended' — checked for
    // 'suspended' specifically here originally, which silently missed it
    // (confirmed on real WebKit: state was 'interrupted', not 'suspended',
    // so this branch never ran and resume() was never even attempted).
    if (AC.state !== 'running'){
      AC.resume().then(function(){ if (AC.state === 'running') { celebrationPlayed = true; startBdayAudio(); } });
    } else {
      celebrationPlayed = true;
      startBdayAudio();
    }
  }
  function _doPlayRomance(){
    var b = 0.55, t = 0.05;
    var prog = [['A3','C4','E4'],['F4','A4','C5'],['C4','E4','G4'],['G4','B4','D5']];
    for (var rep = 0; rep < 2; rep++){
      prog.forEach(function(ch){
        ch.forEach(function(n,i){ tone(N[n]||330,t+i*.018,b*3*.93,.085,'sine'); });
        tone((N[ch[0]]||220)/2,t,b*3.1,.11,'sine'); t+=b*3;
      });
    }
    function melo(freq,start,dur){
      if (!AC) return;
      var o=AC.createOscillator(),g=AC.createGain(),lfo=AC.createOscillator(),lg=AC.createGain();
      o.type='sine'; o.frequency.value=freq; lfo.frequency.value=5.2; lg.gain.value=3.5;
      lfo.connect(lg); lg.connect(o.frequency);
      var t0=AC.currentTime+start;
      g.gain.setValueAtTime(.0001,t0); g.gain.linearRampToValueAtTime(.14,t0+.07);
      g.gain.setValueAtTime(.14,t0+dur*.75); g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
      o.connect(g); g.connect(gainMaster);
      lfo.start(t0); o.start(t0); lfo.stop(t0+dur+.05); o.stop(t0+dur+.05);
    }
    var mt = 0.05;
    [['E5',1.5],['D5',.5],['C5',1],['C5',1],['A4',1],['C5',1],
     ['B4',1],['G4',.5],['A4',.5],['G4',1],['B4',.5],['D5',1],['E5',1.5],
     ['E5',1.5],['C5',.5],['D5',1],['C5',1.5],['A4',1.5],
     ['B4',.5],['A4',.5],['G4',1],['E4',1],['A4',3]
    ].forEach(function(m){ melo(N[m[0]]||440,mt,m[1]*b*.91); mt+=m[1]*b; });
    return Math.max(t, mt) + 0.6; // + a short breath before it loops
  }
  function playRomance(){
    if (pageHidden || !ensureAudio()) return;
    if (AC.state !== 'running'){
      AC.resume().then(function(){ if (AC.state === 'running') { celebrationPlayed = true; scheduleCelebrationLoop(_doPlayRomance(), playRomance); } });
    } else {
      celebrationPlayed = true;
      scheduleCelebrationLoop(_doPlayRomance(), playRomance);
    }
  }
  // Plays once per card open — moved to startCard() below so the tune starts
  // as the card opens instead of being held back until the candle/meter
  // moment deep in the sequence. The guard keeps that later call (still there,
  // harmless) from replaying it.
  //
  // celebrationPlayed is only set true once audio is *confirmed* running
  // (see playHappyBirthday/playRomance above) — not just attempted. That
  // matters because the AUTO preview's first attempt fires from a setTimeout
  // (after(1800, startCard)), not a real tap: iOS Safari silently refuses to
  // resume an AudioContext outside a synchronous user-gesture handler, so
  // that first attempt can fail with no error, just staying 'suspended'
  // forever. If we'd marked it played anyway, the retry below could never
  // fire and the card would stay silent on iOS for the rest of the session
  // (confirmed: works on desktop Safari/Chrome, not on an iPhone). This
  // still no-ops instantly everywhere the first attempt already worked.
  function playCelebration(){
    if (celebrationPlayed) return;
    if (EXT_AUDIO) { celebrationPlayed = true; return; }
    if (TYPE==='anniv') playRomance(); else playHappyBirthday();
  }
  function retryAudioOnGesture(){
    if (celebrationPlayed) {
      ['pointerdown','touchstart','click'].forEach(function(ev){ document.removeEventListener(ev, retryAudioOnGesture); });
      return;
    }
    playCelebration(); // routes to the video path first (playHappyBirthday), Web Audio only as fallback
  }
  ['pointerdown','touchstart','click'].forEach(function(ev){
    document.addEventListener(ev, retryAudioOnGesture, { passive: true });
  });

  function toggleMute(){
    muted = !muted;
    $('sound-btn').textContent = muted ? '🔇' : '🔊';
    if (bdayVideoEl && !bdayVideoFailed) {
      bdayVideoEl.muted = muted;
      if (!muted) playCelebration(); // first tap might land here instead of Play — same unlock chance
      reportPlaybackState();
      return;
    }
    if (gainMaster) gainMaster.gain.value = muted ? 0 : 0.5;
    // Same reasoning as togglePlay above: this control can be the very first
    // tap a user makes, and it never called resume() before — leaving a
    // blocked context stuck forever if Mute (not Play/Pause) was the first
    // thing tapped.
    if (AC && AC.state !== 'running') {
      AC.resume().then(function(){ if (AC.state === 'running') playCelebration(); });
    }
    reportPlaybackState();
  }
  $('sound-btn').setAttribute('aria-label', t('a11y.toggleSound', 'Toggle sound'));
  $('sound-btn').addEventListener('click', toggleMute);

  // ── pause audio when the card isn't the visible page ──
  // Suspending the AudioContext (and flagging hidden so the looping melody
  // trigger can't force-resume it) makes the card silent the moment it leaves
  // the screen, and resume when it returns. pagehide covers bfcache entry and
  // the iframe-removal / navigation cases where visibilitychange may not fire.
  function syncAudioToVisibility(){
    pageHidden = document.hidden;
    if (bdayVideoEl && !bdayVideoFailed) {
      if (pageHidden) { if (!bdayVideoEl.paused) bdayVideoEl.pause(); }
      else if (playing && bdayVideoEl.paused) { bdayVideoEl.play().catch(function(){}); } // respect an explicit pause
      return;
    }
    if (!AC) return;
    if (pageHidden){ if (AC.state === 'running') AC.suspend(); }
    else if (AC.state !== 'running' && playing){ AC.resume(); } // respect an explicit pause
  }
  document.addEventListener('visibilitychange', syncAudioToVisibility);
  window.addEventListener('pagehide', function(){
    pageHidden = true;
    if (bdayVideoEl && !bdayVideoEl.paused) bdayVideoEl.pause();
    if (AC && AC.state === 'running') AC.suspend();
  });
  window.addEventListener('pageshow', syncAudioToVisibility);

  // ════════ ENGINE ════════
  var cur = -1, timers = [], ivals = [];
  function after(ms, fn){ var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers(){ timers.forEach(clearTimeout); timers=[]; ivals.forEach(clearInterval); ivals=[]; }
  // Recipient cards are fully tap-driven: no idle auto-advance. armIdle is kept
  // as a no-op so the (AUTO-only) callers below stay untouched — the sender
  // preview still plays on its own timers; the recipient never auto-advances.
  function armIdle(){ /* intentionally does nothing — recipient taps to advance */ }
  function idx(id){ return screens.indexOf(id); }
  function setProgress(i){
    document.querySelectorAll('#pdots i').forEach(function(d,k){ d.classList.toggle('on',k===i); });
  }
  function reveal(el, withScale){
    el.classList.add('show');
    // Clear any inline visibility:hidden (set on celebMsg in enter('s-cake'))
    // rather than forcing 'visible' — a forced inline visible would override the
    // inactive-screen hide and leave this button tappable after we navigate away
    // (e.g. on replay), re-introducing tap-through screen skips.
    el.style.visibility = '';
    var from = withScale ? {opacity:0,transform:'scale(.85)'} : {opacity:0};
    var to   = withScale ? {opacity:1,transform:'none'}       : {opacity:1};
    try { el.animate([from,to],{duration:450,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'}); } catch{}
    el.style.opacity = '1';
    if (withScale) el.style.transform = 'none';
    // No inline pointer-events: the `.screen.active .cta.show` rule makes revealed
    // CTAs tappable only while their screen is active. An inline 'auto' here would
    // persist after navigating away and re-expose the tap-through skip on replay.
  }
  function go(i){
    if (i === cur) return;
    clearTimers(); cur = i;
    screens.forEach(function(id,k){ $(id).classList.toggle('active',k===i); });
    setProgress(i); enter(i);
    mpReveal(i);
  }

  // ── remote playback controls (sender-preview control bar) ──
  // ponytail: this is a "restart the current screen" pause, not a frame-
  // accurate freeze/resume — clearTimers() drops the exact remaining delay of
  // whatever was about to fire, so resuming re-runs enter(cur) from that
  // screen's own start (e.g. a typewriter letter restarts its reveal). Good
  // enough for a preview scrub; revisit with per-timer remaining-time
  // tracking in `after()` if true frame-accurate pause is ever needed.
  var playing = true;
  function togglePlay(){
    if (bdayVideoEl && !bdayVideoFailed) {
      // Same "either direction unlocks" reasoning as the Web-Audio branch
      // below: if we've never confirmed the video is actually playing yet,
      // treat this tap — Play or Pause, whichever it nominally is — as the
      // unlock attempt rather than a real pause of nothing.
      if (!celebrationPlayed) {
        playing = true;
        playCelebration();
        enter(cur); // the visual timeline resumes here too — see the AC branch below
        reportPlaybackState();
        return;
      }
      playing = !playing;
      // EXT_AUDIO: this element was never started (see playCelebration above)
      // and must stay that way — the parent page's own video is the real
      // audio, and playing this dormant one too would double it up. Only the
      // visual timeline advances/freezes here in that mode.
      if (!playing) { clearTimers(); if (!EXT_AUDIO) bdayVideoEl.pause(); }
      else { enter(cur); if (!EXT_AUDIO) bdayVideoEl.play().catch(function(){}); }
      reportPlaybackState();
      return;
    }
    // If audio was never actually confirmed running (the AUTO preview's first
    // attempt is blocked on iOS — see playHappyBirthday above), the control
    // defaults to showing "Pause" (playing=true from the start), so a real
    // user's first, most natural tap is Pause — which historically only ever
    // called AC.suspend(), never resume(). That tap did nothing, and only a
    // *second* tap (hitting Play afterward) reached the resume() call —
    // confirmed on real WebKit: one Pause tap left it 'interrupted', the next
    // Play tap made it 'running'. Treat *either* direction of this control as
    // the unlock attempt when audio isn't confirmed running yet, so the very
    // first tap works regardless of which way it nominally points.
    // Note: pausing suspends AC below, so `AC.state !== 'running'` is true
    // again on the very next real pause→resume, not just the true first tap —
    // without the `enter(cur)` here, every resume after the first pause fell
    // into this branch and never restarted the visual timeline, leaving the
    // preview looking permanently stuck on Play.
    if (!AC || AC.state !== 'running') {
      var ctx = ensureAudio();
      if (ctx) {
        if (ctx.state !== 'running') { ctx.resume().then(function(){ if (ctx.state === 'running') playCelebration(); }); }
        else { playCelebration(); }
      }
      playing = true; // we just started it — don't immediately show "paused"
      enter(cur);
      reportPlaybackState();
      return;
    }
    playing = !playing;
    if (!playing) {
      clearTimers();
      AC.suspend();
    } else {
      AC.resume().catch(function(){});
      enter(cur);
    }
    reportPlaybackState();
  }
  function reportPlaybackState(){
    window.parent.postMessage({ event: 'playback_state', props: { playing: playing, muted: muted } }, location.origin);
  }
  window.addEventListener('message', function(e){
    if (e.origin !== location.origin) return;
    var msg = e.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.cmd === 'toggle-play') togglePlay();
    else if (msg.cmd === 'toggle-mute') toggleMute();
    else if (msg.cmd === 'get-state') reportPlaybackState();
  });
  // Same-origin hook for the parent's on-phone playback controls. They can't
  // go through postMessage above: delivery is async, so the call would land
  // outside the click's own stack and iOS refuses to start audio there.
  window.togglePlay = togglePlay;

  // ── countdown ──
  var passed = Date.now() >= target.getTime();
  var opening = false;
  var openCta = $('open-cta');
  function pad(n){ return (n<10?'0':'') + n; }

  if (TYPE === 'bday'){
    // The birthday cover is a QR-in-heart now, not a countdown — see the
    // .qr-cover block in card-interactive.html. The QR is rendered by
    // /api/qr (the card page has no bundler and `qrcode` has no browser
    // build), and encodes ?qr= when the parent supplies the real share URL.
    // In the sender preview no card exists yet, so it falls back to the site
    // itself rather than showing a dead code.
    var qrImg = $('qr-img');
    if (qrImg){
      var payload = q.get('qr') || location.origin;
      qrImg.src = '/api/qr?d=' + encodeURIComponent(payload) + '&fg=%23ffffff';
    }
    // "Can't wait? Peek now" only made sense next to a running countdown \u2014
    // with the QR cover there's nothing to wait for, so it just opens.
    openCta.textContent = t('env.openCta', "Open your card \ud83c\udf81");
  } else {
    function tickAnniv(){
      var diff = Math.max(0, target.getTime() - Date.now());
      $('cd-d').textContent  = pad(Math.floor(diff/86400000));
      $('cd-hh').textContent = pad(Math.floor(diff%86400000/3600000));
      $('cd-mm').textContent = pad(Math.floor(diff%3600000/60000));
      $('cd-ss').textContent = pad(Math.floor(diff%60000/1000));
    }
    if (passed){
      $('anniv-countdown').innerHTML = '<div class="cd-ready">Today’s the day. 💞</div>';
      openCta.textContent = 'Open 💌';
    } else {
      tickAnniv();
      // Standalone interval (not in `ivals`) — see the birthday note above.
      setInterval(tickAnniv, 1000);
    }
    var envEl = $('env');
    envEl.addEventListener('click', startCard);
    envEl.addEventListener('keydown', function(e){ if (e.key==='Enter'||e.key===' ') startCard(); });
  }
  openCta.addEventListener('click', startCard);

  function startCard(){
    if (opening || cur > 0) return;
    opening = true;
    ensureAudio();
    if (AC && AC.state !== 'running') AC.resume();
    try { playCelebration(); } catch{}
    if (TYPE === 'bday'){
      go(1);
    } else {
      $('env').classList.add('open');
      after(900, function(){ go(1); });
    }
  }

  // ── messages ──
  var deck = $('msg-deck'), mdotsEl = $('mdots'), msgCta = $('msg-cta');
  var slides = [], msgIdx = 0;

  MSGS.forEach(function(mm){
    var el = document.createElement('div');
    el.className = 'msg-slide';
    el.innerHTML = '<div class="ico">' + (mm.ico||'💌') + '</div><div class="txt">' + mm.t + '</div>';
    deck.appendChild(el); slides.push(el);
    mdotsEl.appendChild(document.createElement('i'));
  });

  // character slide (birthday only, appended after messages)
  if (TYPE === 'bday'){
    var cs = document.createElement('div');
    cs.className = 'msg-slide char-slide';
    var charVisual = charOrEmoji(1);
    cs.innerHTML = (charVisual
        ? '<div class="char-art">' + charVisual + '</div>'
        : '<div class="char-emoji">' + (CELEB_EMOJI || '🎂') + '</div>')
      + (NAME ? '<div class="char-note" style="font-weight:600;font-size:15px">Made for ' + NAME + ' 🩷</div>' : '')
      + (CHAR_LABEL ? '<div class="char-note">From ' + CHAR_LABEL + '</div>' : '');
    deck.appendChild(cs); slides.push(cs);
    mdotsEl.appendChild(document.createElement('i'));
  }

  function showSlide(n){
    slides.forEach(function(el,k){
      el.classList.remove('active','prev');
      if (k===n) el.classList.add('active');
      else if (k<n) el.classList.add('prev');
    });
    mdotsEl.querySelectorAll('i').forEach(function(d,k){ d.classList.toggle('on',k===n); });
    var last = n >= slides.length-1;
    msgCta.innerHTML = last
      ? (TYPE==='anniv' ? 'To the celebration →' : "Let’s Celebrate! 🎉")
      : 'Next →';
  }
  // In autoplay (sender preview) the deck advances on its own timer and manual
  // taps/swipes are ignored, so the preview plays identically every replay.
  // For the recipient (GUIDE) the deck is fully tap-driven: each tap advances
  // one message — there is no idle auto-advance.
  function nextMsg(){
    if (AUTO) return;
    if (msgIdx < slides.length-1){ msgIdx++; showSlide(msgIdx); armIdle(nextMsg); }
    else { go(idx('s-cake')); }  // s-msg is anniversary-only now
  }
  function prevMsg(){ if (AUTO) return; if (msgIdx > 0){ msgIdx--; showSlide(msgIdx); armIdle(nextMsg); } }
  msgCta.addEventListener('click', nextMsg);

  // swipe
  var sx = 0;
  deck.addEventListener('touchstart', function(e){ sx=e.changedTouches[0].clientX; },{passive:true});
  deck.addEventListener('touchend',   function(e){
    var dx = e.changedTouches[0].clientX - sx;
    if (dx < -40) nextMsg(); else if (dx > 40) prevMsg();
  },{passive:true});
  var mdx2 = 0, mdown = false;
  deck.addEventListener('mousedown', function(e){ mdown=true; mdx2=e.clientX; });
  window.addEventListener('mouseup', function(e){
    if (!mdown) return; mdown=false;
    var dx = e.clientX - mdx2;
    if (dx < -45) nextMsg(); else if (dx > 45) prevMsg();
  });

  // ── celebrate (birthday) ──
  function buildLights(){
    var row = $('lights-row');
    row.querySelectorAll('.lbulb').forEach(function(b){ b.remove(); });
    var cols = ['#FF4081','#FF6D00','#FFEA00','#69F0AE','#40C4FF','#E040FB','#FF80AB','#B2FF59'];
    var n = Math.floor((window.innerWidth + 44) / 32);
    for (var i = 0; i < n; i++){
      var b = document.createElement('div'); b.className = 'lbulb';
      b.style.left = ((i/(n-1))*100) + '%';
      var col = cols[i % cols.length];
      var stem = document.createElement('div'); stem.className = 'lbulb-stem';
      var glass = document.createElement('div'); glass.className = 'lbulb-glass';
      glass.style.background = col; glass.style.color = col;
      glass.style.animationDelay = (Math.random()*1.4).toFixed(2) + 's';
      b.appendChild(stem); b.appendChild(glass); row.appendChild(b);
    }
  }
  $('lights-btn').addEventListener('click', function(){
    document.body.classList.add('lights-on');
    buildLights();
    go(idx('s-cake'));
  });

  // ── cake ──
  var cake = $('cake'), tapCue = $('tap-cue'), celebMsg = $('celebrate-msg'), cakeCta = $('cake-cta');
  var blown = false;
  if (cakeCta) cakeCta.textContent = t('cake.cta', 'Special Message 💌');
  var hbBannerEl = $('hb-banner');
  if (hbBannerEl) hbBannerEl.textContent = t('cake.banner', '🎂 HAPPY BIRTHDAY 🎂');
  var tapCueTextEl = $('tap-cue-text');
  if (tapCueTextEl) tapCueTextEl.textContent = t('cake.tapCue', 'Tap the candles to blow them out');
  cake.setAttribute('aria-label', t('a11y.blowCandles', cake.getAttribute('aria-label')));

  function buildCake(){
    // Render the chosen cake (CSS art) — lit candles, ready to tap.
    cake.style.width = '170px';
    cake.style.height = '185px';
    cake.innerHTML = (HA && HA.cakeHTML) ? HA.cakeHTML(CAKE, 3) : '';
  }
  function blowCandles(){
    if (blown) return; blown = true;
    cake.classList.add('blown');
    cake.querySelectorAll('.whs-flame-el').forEach(function(f){
      f.style.animation='none'; f.style.opacity='0';
      f.style.transform='translateX(-50%) scale(.2) translateY(6px)'; f.style.boxShadow='none';
    });
    tapCue.style.opacity = '0';
    try { playCelebration(); } catch{}
    after(420, function(){
      tapCue.style.display = 'none';
      celebMsg.style.display = '';
      reveal(celebMsg, true);
      launchBalloons();
      confettiBurst();
      after(900, function(){
        cakeCta.style.display = '';
        reveal(cakeCta);
        armIdle(function(){ go(cur + 1); });
      });
    });
  }
  cake.addEventListener('click', blowCandles);
  cake.addEventListener('keydown', function(e){ if (e.key==='Enter'||e.key===' ') blowCandles(); });
  cakeCta.addEventListener('click', function(){ go(cur + 1); });

  // ── love meter (anniversary) ──
  var meter = $('meter'), mFill = $('meter-fill'), mBadge = $('meter-badge'), mDone = $('meter-done');
  function resetMeter(){
    mFill.style.height='8%'; mBadge.style.bottom='8%'; mBadge.textContent='🤍';
    mDone.classList.remove('show');
    var mw = $('meter-wrap'); mw.classList.remove('meter-collapse'); mw.style.display='';
  }
  function fillMeter(){
    if (blown) return; blown = true;
    tapCue.style.opacity = '0';
    var val = 0;
    var iv = setInterval(function(){
      val = Math.min(val+2, 100);
      var h = 8 + val*.92;
      mFill.style.height = h+'%'; mBadge.style.bottom = h+'%'; mBadge.textContent = val+'%';
      if (val >= 100){
        clearInterval(iv);
        mBadge.textContent = '💖'; mDone.classList.add('show');
        try { playCelebration(); } catch{}
        after(650, function(){
          var mw = $('meter-wrap'); mw.classList.add('meter-collapse');
          after(460, function(){
            mw.style.display='none'; tapCue.style.display='none';
            celebMsg.style.display=''; reveal(celebMsg,true);
            launchBalloons(); confettiBurst();
            after(900, function(){ cakeCta.style.display=''; reveal(cakeCta); armIdle(function(){ go(idx('s-letter')); }); });
          });
        });
      }
    }, 24);
    ivals.push(iv);
  }
  meter.addEventListener('click', fillMeter);
  meter.addEventListener('keydown', function(e){ if (e.key==='Enter'||e.key===' ') fillMeter(); });

  function launchBalloons(){
    var wrap = $('balloons'); wrap.innerHTML='';
    var cols = TYPE==='anniv'
      ? ['#E0457B','#FF5CA8','#F4A6B8','#C2185B','#FF8FC0','#EBA9BB','#D83F87']
      : ['#E11D63','#D97706','#EBA9BB','#F4C57A','#6D28D9','#2E8B57','#F59E0B'];
    for (var i = 0; i < 11; i++){
      var b = document.createElement('div'); b.className='balloon';
      b.style.background='radial-gradient(circle at 32% 28%,rgba(255,255,255,.7),'+cols[i%cols.length]+' 70%)';
      b.style.left=(Math.random()*100)+'%';
      b.style.setProperty('--dur',(4+Math.random()*3)+'s');
      b.style.setProperty('--rot',((Math.random()*24)-12)+'deg');
      b.style.animationDelay=(Math.random()*.8)+'s';
      wrap.appendChild(b);
      (function(el){ requestAnimationFrame(function(){ el.classList.add('fly'); }); })(b);
    }
  }
  function confettiBurst(){
    var sky = $('sky');
    var cols = TYPE==='anniv'
      ? ['#E0457B','#FF5CA8','#F4A6B8','#C2185B','#FF8FC0','#FBDCE8']
      : ['#E11D63','#D97706','#EBA9BB','#F4C57A','#6D28D9','#2E8B57'];
    for (var i = 0; i < 46; i++){
      var s = document.createElement('span');
      s.style.cssText = 'position:absolute;left:'+(Math.random()*100)+'%;top:-16px;width:'+(6+Math.random()*5)+'px;height:'+(9+Math.random()*7)+'px;border-radius:1px;background:'+cols[i%cols.length]+';opacity:0';
      sky.appendChild(s);
      (function(el){
        var dx=Math.random()*80-40, rot=Math.random()*720-360;
        el.animate([
          {transform:'translate(0,0) rotate(0)',opacity:1,offset:0},
          {transform:'translate('+dx+'px,'+(window.innerHeight+60)+'px) rotate('+rot+'deg)',opacity:1,offset:1}
        ],{duration:2600+Math.random()*1600,easing:'cubic-bezier(.2,.6,.4,1)',delay:Math.random()*500,fill:'forwards'});
        setTimeout(function(){ el.remove(); }, 5000);
      })(s);
    }
  }

  // ── letter ──
  var letterEl = $('letter-text'), letterCta = $('letter-cta');
  var letterCaptionEl = $('letter-caption');
  if (letterCaptionEl) letterCaptionEl.textContent = t('letter.caption', 'A letter just for you');
  if (letterCta) letterCta.textContent = t('letter.cta', 'One last thing →');
  function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  // Render partial text as paragraph blocks (\n\n = new .lp block, \n = <br>)
  function renderLetter(partial, withPen){
    var parts = partial.split(/\n\n+/);
    var pen = withPen ? '<span class="pen"></span>' : '';
    var html = parts.map(function(p,i){
      var body = esc(p).replace(/\n/g,'<br>');
      // keep caret inline at the tail of the last paragraph
      if (i === parts.length-1) body += pen;
      return '<span class="lp">' + body + '</span>';
    }).join('');
    letterEl.innerHTML = html;
  }
  function typeLetter(){
    letterEl.innerHTML=''; letterCta.classList.remove('show');
    letterCta.style.opacity=''; letterCta.style.pointerEvents='';
    var txt = NOTE, k = 0;
    (function step(){
      renderLetter(txt.slice(0,k), k < txt.length);
      if (k < txt.length){ k++; after(42, step); }
      else {
        renderLetter(txt, false);
        after(500, function(){ reveal(letterCta); });
        if (AUTO) after(2400, function(){ go(idx('s-close')); });
      }
    })();
  }
  letterCta.addEventListener('click', function(){ go(idx('s-close')); });

  // ── close ──
  $('pinky-chip').addEventListener('click', heartBurst);
  function heartBurst(){
    var el = $('close-burst'); el.innerHTML='';
    var g = TYPE==='anniv' ? ['💗','💖','🌹','✨','💞'] : ['💛','🧡','✨','💗','🎂'];
    for (var i = 0; i < 16; i++){
      var s = document.createElement('span');
      s.textContent = g[i%g.length];
      s.style.cssText = 'left:'+(42+Math.random()*16)+'%;top:'+(40+Math.random()*12)+'%;font-size:'+(14+Math.random()*16)+'px';
      var ang=Math.random()*Math.PI*2, dist=90+Math.random()*120;
      s.animate([
        {transform:'translate(0,0) scale(.4)',opacity:0},
        {opacity:1,offset:.2},
        {transform:'translate('+(Math.cos(ang)*dist)+'px,'+(Math.sin(ang)*dist-40)+'px) scale(1.1)',opacity:0}
      ],{duration:1500+Math.random()*500,easing:'cubic-bezier(.22,1,.36,1)'});
      el.appendChild(s);
    }
  }

  // ══ birthday beats: greeting · balloon pop · bouquet · polaroid ══
  function next(){ go(cur + 1); }

  // Greeting — the name gets its own moment, then one question. "No" is a
  // joke button that dodges the tap; both roads lead onward.
  var greetTitleEl = $('greet-title');
  if (greetTitleEl) {
    var greetTmpl = t('greet.title', 'Happy Birthday,\n{name}');
    var greetParts = greetTmpl.split('{name}');
    greetTitleEl.innerHTML = greetParts[0].replace(/\n/g, '<br>')
      + '<span id="greet-name">' + esc(NAME || 'friend') + '</span>'
      + (greetParts[1] || '').replace(/\n/g, '<br>');
  }
  var greetAskEl = $('greet-ask');
  if (greetAskEl) greetAskEl.textContent = t('greet.ask', "Are you excited for what's next?");
  var greetYesEl = $('greet-yes');
  if (greetYesEl) greetYesEl.textContent = t('greet.yes', 'Yes');
  var greetNoEl = $('greet-no');
  if (greetNoEl) greetNoEl.textContent = t('greet.no', 'No');
  if ($('greet-art')) $('greet-art').textContent = CELEB_EMOJI || '🧸';
  if ($('greet-yes')) $('greet-yes').addEventListener('click', next);
  // "No" dodges the tap rather than accepting it — the joke is that it can't
  // be chosen. It has to move on pointerdown/touchstart, i.e. *before* the
  // click resolves: reacting to 'click' (as this first did) means the tap
  // already landed, so it reads as a button that twitches after you press it
  // rather than one that runs away. preventDefault stops the tap turning into
  // a click on the button it just vacated.
  var noBtn = $('greet-no');
  if (noBtn) {
    var dodgeNo = function(e){
      if (e && e.cancelable) e.preventDefault();
      hop();
    };
    // Split out so the preview can drive the same hop on a timer without a
    // real event — see the s-greet demo below.
    var hop = function(){
      // Keep it inside the card: offsets are capped, and each hop is measured
      // against the stage so it can't wander off the edge of the screen.
      var stage = noBtn.closest('.screen') || document.body;
      var sr = stage.getBoundingClientRect();
      var cur = noBtn._dx || 0, curY = noBtn._dy || 0;
      // Measure the untranslated origin ONCE. Deriving it from the live rect
      // each hop (rect minus current translate) breaks as soon as the
      // transform also scales — the rect reflects the scale, so the origin
      // drifts a little every time and the button walks itself off the card.
      if (!noBtn._origin){
        var t0 = noBtn.style.transform; noBtn.style.transform = '';
        var o = noBtn.getBoundingClientRect();
        noBtn._origin = { x: o.left, y: o.top, w: o.width, h: o.height };
        noBtn.style.transform = t0;
      }
      var og = noBtn._origin;
      // Pick an absolute spot anywhere in the card rather than nudging from
      // where it already is: successive small offsets kept landing it in the
      // same neighbourhood, so the hops looked repetitive.
      var pad = 10;
      var minX = sr.left + pad - og.x, maxX = sr.right - pad - og.w - og.x;
      var minY = sr.top + pad - og.y, maxY = sr.bottom - pad - og.h - og.y;
      var nx = minX + Math.random() * Math.max(0, maxX - minX);
      var ny = minY + Math.random() * Math.max(0, maxY - minY);
      // Never pick a spot that's basically where it already was.
      if (Math.abs(nx - cur) < 40 && Math.abs(ny - curY) < 40) {
        nx = (nx - cur > 0) ? Math.min(maxX, cur + 90) : Math.max(minX, cur - 90);
        ny = (ny - curY > 0) ? Math.min(maxY, curY + 70) : Math.max(minY, curY - 70);
      }
      noBtn._dx = nx; noBtn._dy = ny;
      // Small rotation on each hop, matching myheartcraft.com's — it reads as
      // the button flinching away rather than sliding.
      noBtn.style.transform = 'translate(' + nx + 'px,' + ny + 'px) rotate(' +
        ((Math.random() * 2 - 1) * 14).toFixed(1) + 'deg) scale(' +
        (0.92 + Math.random() * 0.16).toFixed(2) + ')';
    };
    noBtn._hop = hop;
    noBtn._reset = function(){
      noBtn._dx = 0; noBtn._dy = 0; noBtn.style.transform = '';
      noBtn._origin = null; // re-measure next time; layout may have changed
    };
    ['pointerdown', 'touchstart', 'mouseenter'].forEach(function(ev){
      noBtn.addEventListener(ev, dodgeNo, { passive: false });
    });
    // Never let it actually resolve, however the tap gets through.
    noBtn.addEventListener('click', function(e){ e.preventDefault(); e.stopPropagation(); });
  }

  // A flat single-colour oval read as a placeholder rather than a balloon.
  // Each one is now a small inline SVG: a real tapered balloon silhouette
  // (not just a rounded rect), a radial gradient shading from a bright
  // highlight down to a deeper edge tone for a glossy 3D look, a satin
  // ribbon bow at the knot, and two curled ribbon tails instead of a plain
  // straight string.
  var POP_COLOR_DEEP = {
    '#FF5CA8': '#D93E86', '#F4C57A': '#DDA24B',
    '#7FC7A5': '#57A67D', '#8FB6E8': '#5F90CE'
  };
  function balloonSVG(color, idx){
    var deep = POP_COLOR_DEEP[color] || color;
    var gid = 'balGrad' + idx;
    return ''
      + '<svg viewBox="0 0 58 130" aria-hidden="true">'
      +   '<defs>'
      +     '<radialGradient id="' + gid + '" cx="34%" cy="26%" r="80%">'
      +       '<stop offset="0%" stop-color="#fff" stop-opacity=".95"/>'
      +       '<stop offset="32%" stop-color="' + color + '"/>'
      +       '<stop offset="100%" stop-color="' + deep + '"/>'
      +     '</radialGradient>'
      +   '</defs>'
      +   '<g fill="none" stroke="' + deep + '" stroke-width="1.7" stroke-linecap="round" opacity=".85">'
      +     '<path d="M25 100 C 15 106, 26 113, 14 120 C 6 125, 16 130, 9 136"/>'
      +     '<path d="M33 100 C 43 106, 32 113, 44 120 C 52 125, 42 130, 49 136"/>'
      +   '</g>'
      +   '<path d="M29 2 C 46 2 55 17 55 35 C 55 56 44 70 33 74 L 32 79 L 26 79 L 25 74'
      +         ' C 14 70 3 56 3 35 C 3 17 12 2 29 2 Z" fill="url(#' + gid + ')" stroke="rgba(0,0,0,.14)"/>'
      +   '<ellipse cx="19" cy="20" rx="7.5" ry="12" fill="rgba(255,255,255,.65)" transform="rotate(-24 19 20)"/>'
      // Ribbon bow, tied at the knot: two satin loops + a centre wrap, drawn
      // over the balloon's bottom point so the tails above read as emerging
      // from behind it.
      +   '<path d="M29 78 C 21 72, 8 74, 7 84 C 6 93, 17 96, 29 85 Z" fill="' + color + '" stroke="' + deep + '" stroke-width="1"/>'
      +   '<path d="M29 78 C 37 72, 50 74, 51 84 C 52 93, 41 96, 29 85 Z" fill="' + color + '" stroke="' + deep + '" stroke-width="1"/>'
      +   '<ellipse cx="16" cy="82" rx="3.4" ry="2.2" fill="rgba(255,255,255,.5)" transform="rotate(-18 16 82)"/>'
      +   '<ellipse cx="42" cy="82" rx="3.4" ry="2.2" fill="rgba(255,255,255,.5)" transform="rotate(18 42 82)"/>'
      +   '<path d="M29 76 C 24 79, 24 88, 29 92 C 34 88, 34 79, 29 76 Z" fill="' + deep + '"/>'
      + '</svg>';
  }

  var POPPED = 0, POP_TOTAL = 4;
  // One word per balloon — the sentence assembles as they pop, each word
  // landing where its balloon was.
  var POP_WORDS = [
    t('balloons.word1', 'You'), t('balloons.word2', 'are'),
    t('balloons.word3', 'SO'), t('balloons.word4', 'special')
  ];
  var POP_SIZES = ['1.35rem', '1.35rem', '2.5rem', '2rem'];
  // Where the words settle once every balloon is gone — centred, evenly spaced.
  var POP_ROWS = ['26%', '40%', '58%', '78%'];
  function buildBalloons(){
    var stage = $('pop-stage'); if (!stage) return;
    stage.innerHTML = '';
    POPPED = 0;
    $('pop-count').textContent = t('balloons.count', '{n}/4 POPPED').replace('{n}', '0');
    $('pop-cue').textContent = t('balloons.cue', 'Pop all 4 balloons');
    $('pop-cue').style.opacity = '1';
    $('pop-cta').classList.remove('show');
    $('pop-cta').style.display = 'none';
    var cols = ['#FF5CA8','#F4C57A','#7FC7A5','#8FB6E8'];
    var spots = [[8,10],[58,4],[14,52],[62,46]];
    for (var b = 0; b < POP_TOTAL; b++){
      (function(k){
        var el = document.createElement('div');
        el.className = 'pop-balloon';
        el.innerHTML = balloonSVG(cols[k], k);
        el.style.left = spots[k][0] + '%';
        el.style.top = spots[k][1] + '%';
        el.style.animationDelay = (k * .35) + 's';

        // Sits under the balloon, centred on it, revealed when it pops.
        var w = document.createElement('div');
        w.className = 'pop-word';
        w.textContent = POP_WORDS[k];
        w.style.fontSize = POP_SIZES[k];
        // Dead centre of the balloon — the word lands exactly where it burst,
        // not below the string.
        w.style.left = 'calc(' + spots[k][0] + '% + 29px)'; // balloon is 58px wide
        w.style.top = 'calc(' + spots[k][1] + '% + 36px)';  // and 72px tall
        stage.appendChild(w);
        el._word = w;

        el.addEventListener('click', function(){ popOne(el); });
        stage.appendChild(el);
      })(b);
    }
  }
  function popOne(el){
    if (el.classList.contains('popped')) return;
    el.classList.add('popped');
    confettiAt(el);
    POPPED++;
    $('pop-count').textContent = t('balloons.count', '{n}/4 POPPED').replace('{n}', String(POPPED));
    if (el._word) el._word.classList.add('show');
    // Deduped like the reveal events: a replay ("Watch again") rebuilds the
    // balloons and would otherwise re-fire all four, inflating the metric for
    // anyone who watches twice.
    if (POPPED > _maxPopped){
      _maxPopped = POPPED;
      mpPost('card_balloon_popped', { popped: POPPED, total: POP_TOTAL });
    }
    if (POPPED >= POP_TOTAL){
      $('pop-cue').style.opacity = '0';
      // Each word appeared where its balloon burst, which leaves them
      // scattered. Once the sentence is complete they slide into a centred
      // stack so it reads as a line rather than four loose words.
      after(520, function(){
        var ws = $('pop-stage').querySelectorAll('.pop-word');
        for (var i = 0; i < ws.length; i++){
          ws[i].style.left = '50%';
          ws[i].style.top = POP_ROWS[i];
        }
      });
      after(1400, function(){
        $('pop-cta').style.display = '';
        reveal($('pop-cta'));
        if (AUTO) after(1800, next);
      });
    }
  }
  function confettiAt(el){
    var stage = $('pop-stage');
    var cols = ['#FF5CA8','#F4C57A','#7FC7A5','#8FB6E8','#D83F87'];
    for (var c = 0; c < 14; c++){
      var bit = document.createElement('div');
      bit.className = 'confetti-bit';
      bit.style.background = cols[c % cols.length];
      bit.style.left = (parseFloat(el.style.left) + 6) + '%';
      bit.style.top = (parseFloat(el.style.top) + 8) + '%';
      stage.appendChild(bit);
      (function(node){
        var ang = Math.random() * Math.PI * 2, dist = 40 + Math.random() * 70;
        try {
          node.animate([
            {transform:'translate(0,0) rotate(0)', opacity:1},
            {transform:'translate(' + Math.cos(ang)*dist + 'px,' + (Math.sin(ang)*dist + 50) + 'px) rotate(' + (Math.random()*540) + 'deg)', opacity:0}
          ], {duration: 900 + Math.random()*500, easing:'cubic-bezier(.22,1,.36,1)'});
        } catch{}
        setTimeout(function(){ node.remove(); }, 1500);
      })(bit);
    }
  }
  if ($('pop-cta')) {
    $('pop-cta').textContent = t('balloons.cta', 'Keep going →');
    $('pop-cta').addEventListener('click', next);
  }

  // Bouquet — art ringed by short tags, a few words each (never sentences).
  function buildTags(){
    var field = $('tag-field'); if (!field) return;
    field.innerHTML = '';
    var who = NAME || 'you';
    var tags = [
      t('bouquet.tag1', 'Happy Birthday, {name} 🎂').replace('{name}', who),
      t('bouquet.tag2', 'You are so loved 💛'),
      t('bouquet.tag3', 'My favourite person ✨'),
      t('bouquet.tag4', 'Wishing you joy 🌸'),
      t('bouquet.tag5', 'Always in my heart 💗'),
      t('bouquet.tag6', "Here's to you 🥂")
    ];
    var spots = [[2,6],[62,2],[0,40],[64,36],[8,74],[58,70]];
    tags.forEach(function(t, k){
      var el = document.createElement('div');
      el.className = 'love-tag';
      el.textContent = t;
      el.style.left = spots[k][0] + '%';
      el.style.top = spots[k][1] + '%';
      field.appendChild(el);
      after(220 + k * 260, function(){ el.classList.add('show'); });
    });
    after(220 + tags.length * 260 + 400, function(){
      $('bouquet-cta').style.display = '';
      reveal($('bouquet-cta'));
      if (AUTO) after(2000, next);
    });
  }
  var bouquetCapEl = $('bouquet-cap');
  if (bouquetCapEl) bouquetCapEl.textContent = t('bouquet.caption', 'Your Birthday Bouquet 💐');
  if ($('bouquet-cta')) {
    $('bouquet-cta').textContent = t('bouquet.cta', 'One more →');
    $('bouquet-cta').addEventListener('click', next);
  }
  if ($('polaroid-cta')) {
    $('polaroid-cta').textContent = t('polaroid.cta', 'Read your letter 💌');
    // Moving on ends the slideshow — nothing should keep ticking behind a
    // screen the reader has left.
    $('polaroid-cta').addEventListener('click', function(){ stopPolaroidPhotos(); next(); });
  }
  var polaroidLine1El = $('polaroid-line1');
  if (polaroidLine1El) polaroidLine1El.textContent = t('polaroid.line1', 'Lots of love for you ❤');

  /* ── Sender photos in the polaroid frame ──────────────────────
     Cross-fades through them on a timer, and on tap for anyone who wants to
     go faster. One photo just sits there — no dots, no timer. Rebuilds
     cleanly on replay: the old timer is cleared first and the click handler
     is assigned, not added, so repeat visits can't stack either one. */
  var polaroidTimer = null;
  function stopPolaroidPhotos(){
    if (polaroidTimer) { clearInterval(polaroidTimer); polaroidTimer = null; }
  }
  function mountPolaroidPhotos(box){
    stopPolaroidPhotos();
    box.textContent = '';
    box.classList.add('has-photos');

    var imgs = PHOTOS.map(function(src, i){
      var im = document.createElement('img');
      im.src = src;
      im.alt = '';
      // Only the first is eager — the rest sit behind a fade the viewer has
      // not reached, and these cards are usually opened on mobile data.
      im.loading = i === 0 ? 'eager' : 'lazy';
      if (i === 0) im.className = 'on';
      box.appendChild(im);
      return im;
    });
    if (imgs.length < 2) return;

    var dots = document.createElement('div');
    dots.className = 'polaroid-dots';
    imgs.forEach(function(_, i){
      var d = document.createElement('i');
      if (i === 0) d.className = 'on';
      dots.appendChild(d);
    });
    box.appendChild(dots);

    var at = 0;
    function show(n){
      at = (n + imgs.length) % imgs.length;
      imgs.forEach(function(im, i){ im.classList.toggle('on', i === at); });
      dots.querySelectorAll('i').forEach(function(d, i){ d.classList.toggle('on', i === at); });
    }
    polaroidTimer = setInterval(function(){ show(at + 1); }, 2000);
    box.onclick = function(){ show(at + 1); };
  }

  // ── per-screen enter ──
  function enter(i){
    var id = screens[i];
    if (id === 's-greet'){
      // The sender preview plays hands-free, so nobody is there to discover
      // that "No" runs away. myheartcraft.com demos it for them: their button
      // hops ~7 times on its own, then settles just before the slide moves on.
      if (AUTO){
        var nb = $('greet-no');
        if (nb && nb._reset){
          nb._reset();
          for (var h = 0; h < 7; h++) after(900 + h * 430, nb._hop);
          after(900 + 7 * 430 + 260, nb._reset);
        }
        after(4600, next);
      }
    }
    else if (id === 's-balloons'){
      buildBalloons();
      // The preview plays itself: pop them on a timer so the sender sees the
      // whole beat without touching anything. Recipients pop them by hand.
      if (AUTO) [0,1,2,3].forEach(function(k){
        after(900 + k * 700, function(){
          var els = document.querySelectorAll('#pop-stage .pop-balloon');
          if (els[k]) popOne(els[k]);
        });
      });
    }
    else if (id === 's-bouquet'){
      $('bouquet-cta').classList.remove('show');
      $('bouquet-cta').style.display = 'none';
      buildTags();
    }
    else if (id === 's-polaroid'){
      if ($('polaroid-photo')) {
        if (PHOTOS.length) mountPolaroidPhotos($('polaroid-photo'));
        else $('polaroid-photo').textContent = CELEB_EMOJI || '🐰';
      }
      if ($('polaroid-line2')) {
        var pl2Tmpl = t('polaroid.line2', '');
        $('polaroid-line2').textContent = pl2Tmpl
          ? pl2Tmpl.replace('{name}', NAME || '')
          : 'Once again, Happy Birthday' + (NAME ? ', ' + NAME : '') + '!';
      }
      $('polaroid-cta').classList.remove('show');
      $('polaroid-cta').style.display = 'none';
      after(900, function(){
        $('polaroid-cta').style.display = '';
        reveal($('polaroid-cta'));
        if (AUTO) after(2200, next);
      });
    }
    else if (id === 's-env'){
      if (AUTO) after(1800, startCard);
      else armIdle(startCard);                       // recipient: tap to open (no auto-advance)
    }
    else if (id === 's-msg'){
      msgIdx=0; showSlide(0);
      if (AUTO){
        var step = function(){
          if (msgIdx < slides.length-1){ msgIdx++; showSlide(msgIdx); after(2400, step); }
          else after(1800, function(){ go(idx('s-cake')); });
        };
        after(2400, step);
      } else {
        armIdle(nextMsg);                            // recipient: tap per message (no auto-advance)
      }
    }
    else if (id === 's-celebrate'){
      var toCake = function(){
        document.body.classList.add('lights-on');
        buildLights();
        go(idx('s-cake'));
      };
      if (AUTO){
        after(1500, function(){
          document.body.classList.add('lights-on');
          buildLights();
          after(500, function(){ go(idx('s-cake')); });
        });
      } else {
        armIdle(toCake);                             // recipient: tap the lights (no auto-advance)
      }
    }
    else if (id === 's-cake'){
      blown=false; cake.classList.remove('blown');
      cake.innerHTML = '';
      celebMsg.classList.remove('show');
      celebMsg.style.display='none'; celebMsg.style.opacity=''; celebMsg.style.transform='';
      celebMsg.style.pointerEvents=''; celebMsg.style.visibility='hidden';
      tapCue.style.opacity=''; tapCue.style.display='';
      cakeCta.classList.remove('show'); cakeCta.style.opacity=''; cakeCta.style.display='none'; cakeCta.style.pointerEvents='';
      $('balloons').innerHTML='';
      if (TYPE==='anniv'){
        resetMeter();
        if (AUTO){ after(1500,fillMeter); after(6800,function(){ go(idx('s-letter')); }); }
        else armIdle(fillMeter);                     // recipient: tap to fill (no auto-advance)
      } else {
        buildCake();
        if (AUTO){ after(1500,blowCandles); after(4400,function(){ go(cur + 1); }); }
        else armIdle(blowCandles);                   // recipient: tap to blow out (no auto-advance)
      }
    }
    else if (id === 's-letter'){
      // The final letter never auto-advances for the recipient — typeLetter only
      // schedules the s-close jump when AUTO (sender preview). Recipients must tap.
      after(450, typeLetter);
    }
    else if (id === 's-close'){
      after(900, heartBurst);
      // Sender preview loops; the landing preview plays once and rests on the
      // close screen (with its "Watch again" button), signalling the modal.
      if (AUTO && !PREVIEW) after(3400, restart);
      if (PREVIEW) after(1400, function(){ previewPost('card_preview_finished'); });
      // The sender preview loops (above), so it never rests; the one-shot
      // preview does — tell the parent so its tune stops with the card.
      if (!AUTO || PREVIEW) lifePost('finished');
    }
  }

  // ── replay ──
  // Single source of truth for restarting the experience, so a manual
  // "Watch again" tap and the autoplay loop reset to *exactly* the same
  // state every time — the message deck always replays from slide 0.
  function restart(){
    // Both the autoplay loop and the manual "Watch again" land here, so this
    // is the one place that has to take the parent's tune back to the top —
    // otherwise the card restarts and the music carries on mid-phrase.
    lifePost('started');
    clearTimers();
    opening = false;
    if (TYPE==='anniv') $('env').classList.remove('open');
    document.body.classList.remove('lights-on');
    msgIdx = 0; showSlide(0);
    cur = -1; go(0);
  }
  $('replay').textContent = t('close.replay', '↻ Watch again');
  var makeOneEl = $('make-one-cta');
  if (makeOneEl) makeOneEl.textContent = t('close.makeOne', 'Make one for someone you love →');
  $('replay').addEventListener('click', function(){ previewPost('card_preview_replayed'); restart(); });

  // kick off
  // A fresh run: first boot, and every remount (style switch, fullscreen
  // swap). Tells the parent to take the tune back to the top with us.
  lifePost('started');
  var startAt = parseInt(q.get('s'), 10);
  go((startAt >= 0 && startAt < screens.length) ? startAt : 0);
  }); // end startEngine(main)
})();
