/*
 * Luna Atelier — standalone category filter.
 * Mirrors src/components/CategoryFilter.jsx and the filtering in src/App.jsx; keep them in sync.
 * Cards that do not match are taken out of the list (not hidden), so the list's structural
 * selectors (li + li, :last-child:nth-child(odd)) behave as in the React version.
 * Loaded after forms.js, which reads the product data from the full list.
 */
(function () {
  var filter = document.querySelector('.category-filter');
  var list = document.querySelector('.product-list');
  if (!filter || !list) return;

  var items = Array.prototype.slice.call(list.children);
  var buttons = Array.prototype.slice.call(filter.querySelectorAll('button'));

  buttons.forEach(function (button) {
    button.addEventListener('click', function () {
      var category = button.getAttribute('data-category');
      buttons.forEach(function (other) {
        other.setAttribute('aria-pressed', String(other === button));
      });
      items.forEach(function (item) {
        var matches = !category || item.querySelector('.product-category').textContent === category;
        if (matches) list.appendChild(item);
        else if (item.parentNode) list.removeChild(item);
      });
    });
  });
})();
