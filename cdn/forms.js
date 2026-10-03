/*
 * Luna Atelier — standalone order and stock-alert forms.
 * Mirrors src/webhook/{validation,payload,adapter}.js and src/components/RequestForm.jsx;
 * keep them in sync. Flow: form -> validation -> payload -> webhook adapter.
 */
(function () {
  /* ---- Validation (src/webhook/validation.js) ---- */

  function validateName(raw) {
    var value = raw.trim().replace(/\s+/g, ' ');
    if (!value) return { error: 'Adınızı yazın.' };
    if (value.length < 2) return { error: 'Adınız en az 2 karakter olmalı.' };
    return { value: value };
  }

  function validateProduct(raw, slugs) {
    if (slugs.indexOf(raw) === -1) return { error: 'Bir ürün seçin.' };
    return { value: raw };
  }

  // Turkish mobile number; goes into the payload as +905XXXXXXXXX.
  function validatePhone(raw) {
    if (!raw.trim()) return { error: 'Telefon numaranızı yazın.' };
    var match = /^[\d\s()+-]+$/.test(raw) && raw.replace(/\D/g, '').match(/^(?:90|0)?(5\d{9})$/);
    if (!match) return { error: 'Geçerli bir cep telefonu numarası yazın (ör. 0532 123 45 67).' };
    return { value: '+90' + match[1] };
  }

  function validateEmail(raw) {
    var value = raw.trim().toLowerCase();
    if (!value) return { error: 'E-posta adresinizi yazın.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return { error: 'Geçerli bir e-posta adresi yazın (ör. ad@ornek.com).' };
    return { value: value };
  }

  // contact: 'phone' or 'email'. Field order matches the form.
  function validateRequest(raw, contact, slugs) {
    var fields = ['name', 'product', contact];
    var results = {
      name: validateName(raw.name),
      product: validateProduct(raw.product, slugs)
    };
    results[contact] = contact === 'phone' ? validatePhone(raw[contact]) : validateEmail(raw[contact]);
    var values = {};
    var errors = {};
    fields.forEach(function (field) {
      if (results[field].error) errors[field] = results[field].error;
      else values[field] = results[field].value;
    });
    return { values: values, errors: errors };
  }

  /* ---- Payload (src/webhook/payload.js) ---- */

  var requestKinds = {
    order: { event: 'order.requested', contact: 'phone' },
    'stock-alert': { event: 'stock_alert.requested', contact: 'email' }
  };

  var turkishLetters = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u' };

  // The slug is the image file name without its extension; without an image it comes from the name.
  function productSlug(product) {
    if (product.image) return product.image.split('/').pop().replace(/\.[^.]+$/, '');
    return product.name
      .toLocaleLowerCase('tr')
      .replace(/[çğıöşü]/g, function (letter) { return turkishLetters[letter]; })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function productObject(product, baseUrl) {
    return {
      slug: productSlug(product),
      name: product.name,
      category: product.category,
      // "1.250,50 TL" -> 1250.5
      price: { amount: Number(product.price.replace(/[^\d,]/g, '').replace(',', '.')), currency: 'TRY' },
      image_url: product.image ? new URL(product.image, baseUrl).href : null
    };
  }

  function eventId() {
    var bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    var hex = Array.prototype.map.call(bytes, function (byte) { return ('0' + byte.toString(16)).slice(-2); }).join('');
    return 'evt_' + hex.slice(0, 8) + '-' + hex.slice(8, 12) + '-' + hex.slice(12, 16) + '-' + hex.slice(16, 20) + '-' + hex.slice(20);
  }

  // context: { source, pageUrl, baseUrl }
  function buildEvent(event, data, context) {
    return {
      id: eventId(),
      event: event,
      version: '1',
      occurred_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      source: context.source,
      page_url: context.pageUrl,
      data: data
    };
  }

  function buildRequestEvent(kind, values, product, context) {
    var customer = { name: values.name };
    customer[requestKinds[kind].contact] = values[requestKinds[kind].contact];
    return buildEvent(
      requestKinds[kind].event,
      { product: productObject(product, context.baseUrl), customer: customer },
      context
    );
  }

  /* ---- Webhook adapter (src/webhook/adapter.js) ---- */

  var TIMEOUT_MS = 5000;

  // The browser sends no X-Atolyekart-Signature: a secret cannot live in client code.
  function webhookHeaders(payload) {
    return {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Atolyekart-Event': payload.event,
      'X-Atolyekart-Delivery': payload.id
    };
  }

  function createMockAdapter(fail) {
    return {
      send: function (payload) {
        console.info('[webhook:mock]', JSON.stringify({ headers: webhookHeaders(payload), body: payload }));
        return new Promise(function (resolve) {
          setTimeout(function () { resolve({ ok: !fail }); }, 400);
        });
      }
    };
  }

  function createHttpAdapter(url) {
    return {
      send: function (payload) {
        return fetch(url, {
          method: 'POST',
          headers: webhookHeaders(payload),
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(TIMEOUT_MS)
        }).then(
          function (response) { return { ok: response.ok }; },
          function () { return { ok: false }; }
        );
      }
    };
  }

  // Empty URL -> mock adapter; "mock:fail" simulates a failed delivery.
  function createAdapter(url) {
    if (!url || url.indexOf('mock:') === 0) return createMockAdapter(url === 'mock:fail');
    return createHttpAdapter(url);
  }

  var meta = document.querySelector('meta[name="atolyekart:webhook-url"]');
  var adapter = createAdapter(meta && meta.content);

  /* ---- Forms (src/components/RequestForm.jsx) ---- */

  var successTexts = {
    order: 'Sipariş talebiniz alındı. Sizi telefonla arayacağız.',
    'stock-alert': 'Kaydınız alındı. Ürün stoğa girdiğinde e-postayla haber vereceğiz.'
  };
  var failureText = 'Gönderilemedi. Lütfen yeniden deneyin.';

  // Product data comes from the cards on the page; there is no second copy.
  var products = Array.prototype.map.call(document.querySelectorAll('.product-card'), function (card) {
    var image = card.querySelector('img.product-image');
    return {
      name: card.querySelector('.product-name').textContent,
      category: card.querySelector('.product-category').textContent,
      price: card.querySelector('.product-price').textContent,
      image: image ? image.getAttribute('src') : null
    };
  });
  var slugs = products.map(productSlug);

  Array.prototype.forEach.call(document.querySelectorAll('[data-request-form]'), function (form) {
    var kind = form.getAttribute('data-request-form');
    var contact = requestKinds[kind].contact;
    var fields = ['name', 'product', contact];
    var button = form.querySelector('button');
    var status = form.querySelector('.request-status');
    // A failed delivery is sent again with the same id.
    var failed = null;

    function showError(name, message) {
      var control = form.elements[name];
      var error = document.getElementById(kind + '-' + name + '-error');
      error.textContent = message || '';
      error.hidden = !message;
      if (message) {
        control.setAttribute('aria-invalid', 'true');
        control.setAttribute('aria-describedby', error.id);
      } else {
        control.removeAttribute('aria-invalid');
        control.removeAttribute('aria-describedby');
      }
    }

    fields.forEach(function (name) {
      form.elements[name].addEventListener('input', function () {
        showError(name);
        status.textContent = '';
      });
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var raw = {};
      fields.forEach(function (name) { raw[name] = form.elements[name].value; });
      var result = validateRequest(raw, contact, slugs);
      fields.forEach(function (name) { showError(name, result.errors[name]); });
      status.textContent = '';
      var invalid = Object.keys(result.errors)[0];
      if (invalid) {
        form.elements[invalid].focus();
        return;
      }

      var product = products[slugs.indexOf(result.values.product)];
      var payload = buildRequestEvent(kind, result.values, product, {
        source: 'cdn',
        pageUrl: window.location.href,
        baseUrl: document.baseURI
      });
      if (failed && JSON.stringify(failed.data) === JSON.stringify(payload.data)) payload = failed;

      button.disabled = true;
      adapter.send(payload).then(function (response) {
        button.disabled = false;
        failed = response.ok ? null : payload;
        if (response.ok) form.reset();
        status.textContent = response.ok ? successTexts[kind] : failureText;
      });
    });
  });
})();
