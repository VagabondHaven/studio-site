// Developer-site helpers, added to every page under /_dev/ by the Worker (src/worker.js):
// a small bar (My creations, Print, Save as PDF, Publish) and the picture swap for the comment tool (window.VSSwap).
(function () {
  if (window.__vsDev) return; window.__vsDev = true;
  var m = location.pathname.match(/^\/_dev\/([a-z0-9-]+)\//);
  var slug = m && m[1] !== 'media' ? m[1] : '';
  // "My creations" (/_dev/) is only the list: no comment tool and no fonts and colours there, only on a creation itself.
  if (!slug && /^\/_dev\/?(index\.html)?$/.test(location.pathname)) { window.__vsComments = true; window.__vsDesign = true; }

  // "Replace this picture now" in the comment tool: the Studio saves the picture in your repository and points the
  // page at it. The developer site shows it for good after Cloudflare has published the change (about a minute).
  window.VSSwap = function (o) {
    return fetch('/api/swap', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ page: o.page, oldSrc: o.oldSrc, name: o.name, image: o.data }) })
      .then(function (r) { return r.json().catch(function () { return {}; }); })
      .then(function (j) { if (j.error || !j.ok) throw new Error(j.error || 'Could not save the picture.'); return j; });
  };

  function toast(t, ms) {
    var d = document.createElement('div'); d.className = 'vs-toast'; d.textContent = t; document.body.appendChild(d);
    setTimeout(function () { d.remove(); }, ms || 6000);
  }
  if (!slug) return; // "My creations" has its own buttons

  var bar = document.createElement('div');
  bar.className = 'vs-bar';
  bar.innerHTML = '<a href="/_dev/">My creations</a><button type="button" data-a="print">Print</button><button type="button" data-a="pdf">Save as PDF</button><button type="button" data-a="publish" class="vs-main">Publish</button><button type="button" data-a="help" class="vs-help" aria-label="How does this page work?" title="How does this page work?">?</button>';
  document.body.appendChild(bar);
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var a = b.dataset.a;
    if (a === 'help') { tour(); return; }
    if (a === 'print') window.print();
    if (a === 'pdf') { toast('In the print window, choose "Save as PDF" as the printer (on a phone: Share, then Print or Save to Files).', 9000); setTimeout(function () { window.print(); }, 400); }
    if (a === 'publish') {
      if (b.dataset.sure !== '1') { b.dataset.sure = '1'; b.textContent = 'Publish for everyone?'; setTimeout(function () { b.dataset.sure = ''; b.textContent = 'Publish'; }, 4000); return; }
      b.disabled = true; b.textContent = 'Publishing...';
      fetch('/api/publish', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ slug: slug }) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          b.disabled = false; b.dataset.sure = ''; b.textContent = 'Publish';
          if (j.error) toast(j.error); else toast((j.note || 'Published.') + ' Address: ' + j.url, 10000);
        }, function () { b.disabled = false; b.textContent = 'Publish'; toast('No connection. Please try again.'); });
    }
  });

  // ---- First visit: a short tour of the buttons on this page (again with "?" in the bar) ----------------------
  var L = (document.documentElement.lang || navigator.language || 'en').slice(0, 2).toLowerCase();
  var TXT = {
    en: { next: 'Next', done: 'Got it', skip: 'Skip', steps: [
      ['#ds .ds-open', 'Fonts and colours', 'Try other fonts and colours on your creation here. Nothing changes for good while you try. When you like a look, press "Make this the standard design", and Claude makes it permanent.'],
      ['.cm-open', 'Comments', 'Press this, then click any text or picture and write what should change. You can also swap a picture right away. When you are done, tell Claude in the chat: "I left comments, please make the changes."'],
      ['.vs-bar', 'Your creation', '"My creations" lists everything you have made. "Print" and "Save as PDF" are for paper or sending it on. "Publish" puts this creation on your live site, for everyone to see.']] },
    sv: { next: 'Nästa', done: 'Uppfattat', skip: 'Hoppa över', steps: [
      ['#ds .ds-open', 'Typsnitt och färger', 'Här provar du andra typsnitt och färger på det du skapat. Inget ändras för gott medan du provar. När du gillar ett utseende trycker du på "Make this the standard design", så gör Claude det permanent.'],
      ['.cm-open', 'Kommentarer', 'Tryck här och klicka sedan på valfri text eller bild och skriv vad som ska ändras. Du kan också byta en bild direkt. När du är klar skriver du till Claude i chatten: "Jag har lämnat kommentarer, gör ändringarna."'],
      ['.vs-bar', 'Det du skapat', '"My creations" visar allt du har gjort. "Print" och "Save as PDF" är för papper eller för att skicka vidare. "Publish" lägger ut det här på din livesida, så att alla kan se det.']] },
    de: { next: 'Weiter', done: 'Verstanden', skip: 'Überspringen', steps: [
      ['#ds .ds-open', 'Schriften und Farben', 'Hier probierst du andere Schriften und Farben für deine Kreation aus. Solange du probierst, ändert sich nichts dauerhaft. Wenn dir ein Look gefällt, drück auf "Make this the standard design", und Claude macht ihn dauerhaft.'],
      ['.cm-open', 'Kommentare', 'Drück hier, dann klick auf einen Text oder ein Bild und schreib, was sich ändern soll. Ein Bild kannst du auch gleich austauschen. Wenn du fertig bist, schreib Claude im Chat: "Ich habe Kommentare hinterlassen, bitte setz sie um."'],
      ['.vs-bar', 'Deine Kreation', '"My creations" zeigt alles, was du gemacht hast. "Print" und "Save as PDF" sind für Papier oder zum Weiterschicken. "Publish" stellt diese Kreation auf deine Live-Seite, für alle sichtbar.']] }
  };
  var tx = TXT[L] || TXT.en, KEY = 'vs-tour-seen';
  function tour() {
    var steps = tx.steps.filter(function (st) { var el = document.querySelector(st[0]); return el && el.getClientRects().length; });
    if (!steps.length) return;
    var i = 0, ring = document.createElement('div'), tip = document.createElement('div');
    ring.className = 'vs-ring'; tip.className = 'vs-tip'; tip.setAttribute('role', 'dialog');
    document.body.appendChild(ring); document.body.appendChild(tip);
    function end() { ring.remove(); tip.remove(); removeEventListener('resize', show); try { localStorage.setItem(KEY, '1'); } catch (e) {} }
    function show() {
      var st = steps[i], el = document.querySelector(st[0]); if (!el) { end(); return; }
      var r = el.getBoundingClientRect(), pad = 6;
      ring.style.left = (r.left - pad) + 'px'; ring.style.top = (r.top - pad) + 'px'; ring.style.width = (r.width + 2 * pad) + 'px'; ring.style.height = (r.height + 2 * pad) + 'px';
      tip.innerHTML = '<b></b><p></p><div class="vs-tip-acts"><span class="vs-tip-n">' + (i + 1) + ' / ' + steps.length + '</span>' +
        (i < steps.length - 1 ? '<button type="button" class="vs-tip-skip"></button>' : '') + '<button type="button" class="vs-tip-next"></button></div>';
      tip.querySelector('b').textContent = st[1]; tip.querySelector('p').textContent = st[2];
      tip.querySelector('.vs-tip-next').textContent = i < steps.length - 1 ? tx.next : tx.done;
      var sk = tip.querySelector('.vs-tip-skip'); if (sk) { sk.textContent = tx.skip; sk.onclick = end; }
      tip.querySelector('.vs-tip-next').onclick = function () { i++; if (i < steps.length) show(); else end(); };
      // place the bubble next to the button: to its right if there is room, else below, else above
      var w = Math.min(320, innerWidth - 24), tw = tip.offsetWidth || w, th = tip.offsetHeight || 160, x, y;
      if (r.right + 16 + tw < innerWidth) { x = r.right + 16; y = Math.min(Math.max(12, r.top + r.height / 2 - th / 2), innerHeight - th - 12); tip.dataset.side = 'right'; }
      else if (r.bottom + 16 + th < innerHeight) { x = Math.min(Math.max(12, r.right - tw), innerWidth - tw - 12); y = r.bottom + 16; tip.dataset.side = 'below'; }
      else { x = Math.min(Math.max(12, r.left), innerWidth - tw - 12); y = Math.max(12, r.top - th - 16); tip.dataset.side = 'above'; }
      tip.style.left = x + 'px'; tip.style.top = y + 'px';
      tip.querySelector('.vs-tip-next').focus();
    }
    addEventListener('resize', show);
    show();
  }
  var seen = false; try { seen = localStorage.getItem(KEY) === '1'; } catch (e) {}
  if (!seen) addEventListener('load', function () { setTimeout(tour, 700); });
})();
