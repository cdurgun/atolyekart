/*
 * Luna Atelier — standalone catalogue QR code.
 * Mirrors src/components/CatalogQR.jsx; keep the two in sync.
 * Needs the global `qrcode` from qrcode-generator (loaded from jsDelivr in index.html).
 */
(function () {
  var slot = document.querySelector('[data-catalog-qr]');
  if (!slot || typeof qrcode !== 'function') return;

  // Optional override: <meta name="atolyekart:catalog-url" content="https://…">
  function catalogUrl() {
    var meta = document.querySelector('meta[name="atolyekart:catalog-url"]');
    if (meta && meta.content) return meta.content;
    var url = new URL(window.location.href);
    url.search = '';
    url.hash = 'urunler';
    return url.href;
  }

  var qr = qrcode(0, 'M');
  qr.addData(catalogUrl());
  qr.make();

  // No quiet zone inside the SVG; the light page background around it provides one.
  var count = qr.getModuleCount();
  var path = '';
  for (var row = 0; row < count; row++) {
    for (var col = 0; col < count; col++) {
      if (qr.isDark(row, col)) path += 'M' + col + ' ' + row + 'h1v1h-1z';
    }
  }

  var svg = slot.querySelector('svg');
  svg.setAttribute('viewBox', '0 0 ' + count + ' ' + count);
  svg.querySelector('path').setAttribute('d', path);
  slot.hidden = false;
})();
