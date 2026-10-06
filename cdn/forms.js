/*
 * Luna Atelier — standalone order and stock-alert forms.
 * Mirrors src/webhook/{validation,payload,adapter}.js and src/components/RequestForm.jsx;
 * keep them in sync. Flow: form -> validation -> request body -> API adapter.
 * The webhook URL and secret live on the server only (server/lib/webhook.js).
 */
(function () {
  /* ---- Validation (src/webhook/validation.js) ---- */

  function validateName(raw) {
    var value = raw.trim().replace(/\s+/g, ' ');
    if (!value) return { error: 'Adınızı yazın.' };
    if (value.length < 2) return { error: 'Adınız en az 2 karakter olmalı.' };
    if (value.length > 80) return { error: 'Adınız en fazla 80 karakter olabilir.' };
    return { value: value };
  }

  function validateProduct(raw, slugs) {
    if (slugs.indexOf(raw) === -1) return { error: 'Bir ürün seçin.' };
    return { value: raw };
  }

  // Goes into the payload as a number, not text.
  function validateQuantity(raw) {
    var value = raw.trim();
    if (!value) return { error: 'Adedi yazın.' };
    if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 99) {
      return { error: 'Adet 1 ile 99 arasında bir tam sayı olmalı.' };
    }
    return { value: Number(value) };
  }

  // Turkish mobile number; goes into the payload as +905XXXXXXXXX.
  function validatePhone(raw) {
    if (!raw.trim()) return { error: 'Telefon numaranızı yazın.' };
    var match = /^[\d\s()+-]+$/.test(raw) && raw.replace(/\D/g, '').match(/^(?:90|0)?(5\d{9})$/);
    if (!match) return { error: 'Geçerli bir cep telefonu numarası yazın (ör. 0532 123 45 67).' };
    return { value: '+90' + match[1] };
  }

  // On a Turkish keyboard with Caps Lock on, the "i" key types "İ"; toLowerCase() turns it into "i" + a combining
  // dot (U+0307) and corrupts the address. So "İ" becomes "i" first, and the address may carry ASCII only.
  var EMAIL_PATTERN = /^[a-z0-9_%+-]+(?:\.[a-z0-9_%+-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/;

  function validateEmail(raw) {
    var value = raw.trim().replace(/İ/g, 'i').toLowerCase();
    if (!value) return { error: 'E-posta adresinizi yazın.' };
    if (!EMAIL_PATTERN.test(value)) return { error: 'Geçerli bir e-posta adresi yazın (ör. ad@ornek.com).' };
    return { value: value };
  }

  // KVKK consent: no request is sent unless the box is ticked. The value is a boolean, not text.
  function validateConsent(raw) {
    if (raw !== true) return { error: 'Devam etmek için kişisel verilerinizin işlenmesine onay verin.' };
    return { value: true };
  }

  var validators = {
    name: validateName,
    product: validateProduct,
    quantity: validateQuantity,
    phone: validatePhone,
    email: validateEmail,
    consent: validateConsent
  };

  // kind.fields: field names in form order. kind.optional: fields that may stay empty; empty becomes null.
  function validateRequest(raw, kind, slugs) {
    var values = {};
    var errors = {};
    kind.fields.forEach(function (field) {
      var result = kind.optional.indexOf(field) !== -1 && !raw[field].trim() ? { value: null } : validators[field](raw[field], slugs);
      if (result.error) errors[field] = result.error;
      else values[field] = result.value;
    });
    return { values: values, errors: errors };
  }

  /* ---- Request body (src/webhook/payload.js) ---- */

  // path: endpoint. fields: form fields in order. optional: may stay empty. body: fields of the request body in order.
  var requestKinds = {
    order: {
      path: '/api/order',
      fields: ['name', 'product', 'quantity', 'phone', 'email', 'consent'],
      optional: ['email'],
      body: ['name', 'productId', 'phone', 'email', 'quantity', 'consent', 'source']
    },
    'stock-alert': {
      path: '/api/stock-request',
      fields: ['name', 'product', 'email', 'consent'],
      optional: [],
      body: ['name', 'productId', 'email', 'consent', 'source']
    }
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

  // productName is not sent: the server writes the name from its own catalogue.
  function buildRequestBody(kind, values, product, source) {
    var all = {
      name: values.name,
      productId: productSlug(product),
      phone: values.phone,
      email: values.email,
      quantity: values.quantity,
      consent: values.consent,
      source: source
    };
    var body = {};
    requestKinds[kind].body.forEach(function (key) { body[key] = all[key]; });
    return body;
  }

  /* ---- API adapter (src/webhook/adapter.js) ---- */

  var TIMEOUT_MS = 8000;

  function createMockAdapter(fail) {
    return {
      send: function (path, body) {
        console.info('[api:mock]', JSON.stringify({ path: path, body: body }));
        return new Promise(function (resolve) {
          setTimeout(function () { resolve({ ok: !fail }); }, 400);
        });
      }
    };
  }

  function createHttpAdapter(base) {
    return {
      send: function (path, body) {
        return fetch(base + path, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(TIMEOUT_MS)
        }).then(function (response) {
          // The server's Turkish message and field errors, if any, are carried to the form.
          return response.json().catch(function () { return {}; }).then(function (data) {
            return { ok: response.ok, message: data.message, errors: data.errors };
          });
        }).catch(function () { return { ok: false }; });
      }
    };
  }

  // Unlike the React build, an empty URL means the mock adapter: this page usually runs from file://,
  // where there is no /api. The API sends no CORS headers, so a real URL works only when the page is
  // served from that same origin.
  function createAdapter(url) {
    if (!url || url.indexOf('mock:') === 0) return createMockAdapter(url === 'mock:fail');
    return createHttpAdapter(url.replace(/\/$/, ''));
  }

  var meta = document.querySelector('meta[name="atolyekart:api-url"]');
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
    var fields = requestKinds[kind].fields;
    var button = form.querySelector('button');

    function rawValue(name) {
      var control = form.elements[name];
      return control.type === 'checkbox' ? control.checked : control.value;
    }
    var status = form.querySelector('.request-status');

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
      fields.forEach(function (name) { raw[name] = rawValue(name); });
      var result = validateRequest(raw, requestKinds[kind], slugs);
      fields.forEach(function (name) { showError(name, result.errors[name]); });
      status.textContent = '';
      var invalid = Object.keys(result.errors)[0];
      if (invalid) {
        form.elements[invalid].focus();
        return;
      }

      var product = products[slugs.indexOf(result.values.product)];
      var body = buildRequestBody(kind, result.values, product, 'cdn');

      button.disabled = true;
      adapter.send(requestKinds[kind].path, body).then(function (response) {
        button.disabled = false;
        if (response.ok) form.reset();
        // The server applies the same rules again; if it rejects, its field errors and message are shown.
        else if (response.errors) fields.forEach(function (name) { showError(name, response.errors[name]); });
        status.textContent = response.ok ? successTexts[kind] : (response.message || failureText);
      });
    });
  });
})();
