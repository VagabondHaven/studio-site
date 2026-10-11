// Developer-site helpers, added to every page under /_dev/ by the Worker (src/worker.js):
// a small bar (My creations, Print, Save as PDF, Publish) and the picture swap for the comment tool (window.VSSwap).
(function () {
  if (window.__vsDev) return; window.__vsDev = true;
  var m = location.pathname.match(/^\/_dev\/([a-z0-9-]+)\//);
  var slug = m && m[1] !== 'media' ? m[1] : '';

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
  bar.innerHTML = '<a href="/_dev/">My creations</a><button type="button" data-a="print">Print</button><button type="button" data-a="pdf">Save as PDF</button><button type="button" data-a="publish" class="vs-main">Publish</button>';
  document.body.appendChild(bar);
  bar.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    var a = b.dataset.a;
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
})();
