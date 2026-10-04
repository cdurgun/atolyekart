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

  function validateEmail(raw) {
    var value = raw.trim().toLowerCase();
    if (!value) return { error: 'E-posta adresinizi yazın.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return { error: 'Geçerli bir e-posta adresi yazın (ör. ad@ornek.com).' };
    return { value: value };
  }

  var validators = {
    name: validateName,
    product: validateProduct,
    quantity: validateQuantity,
    phone: validatePhone,
    email: validateEmail
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

  /* ---- Payload (src/webhook/payload.js) ---- */

  // fields: form fields in order. optional: may stay empty. body: fields of the request body in order.
  var requestKinds = {
    order: {
      event: 'order.requested',
      fields: ['name', 'product', 'quantity', 'phone', 'email'],
      optional: ['email'],
      body: ['event', 'name', 'productId', 'productName', 'phone', 'email', 'quantity', 'source']
    },
    'stock-alert': {
      event: 'stock_alert.requested',
      fields: ['name', 'product', 'email'],
      optional: [],
      body: ['event', 'name', 'productId', 'productName', 'email', 'source']
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

  // The body carries only the fields of the contract (webhook-format.md).
  function buildRequestEvent(kind, values, product, source) {
    var all = {
      event: requestKinds[kind].event,
      name: values.name,
      productId: productSlug(product),
      productName: product.name,
      phone: values.phone,
      email: values.email,
      quantity: values.quantity,
      source: source
    };
    var payload = {};
    requestKinds[kind].body.forEach(function (key) { payload[key] = all[key]; });
    return payload;
  }

  /* ---- Webhook adapter (src/webhook/adapter.js) ---- */

  var TIMEOUT_MS = 5000;

  // The browser sends no X-Atolyekart-Signature: a secret cannot live in client code.
  function webhookHeaders(payload) {
    return {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Atolyekart-Event': payload.event
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
    var fields = requestKinds[kind].fields;
    var button = form.querySelector('button');
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
      fields.forEach(function (name) { raw[name] = form.elements[name].value; });
      var result = validateRequest(raw, requestKinds[kind], slugs);
      fields.forEach(function (name) { showError(name, result.errors[name]); });
      status.textContent = '';
      var invalid = Object.keys(result.errors)[0];
      if (invalid) {
        form.elements[invalid].focus();
        return;
      }

      var product = products[slugs.indexOf(result.values.product)];
      var payload = buildRequestEvent(kind, result.values, product, 'cdn');

      button.disabled = true;
      adapter.send(payload).then(function (response) {
        button.disabled = false;
        if (response.ok) form.reset();
        status.textContent = response.ok ? successTexts[kind] : failureText;
      });
    });
  });
})();
