import { h, render } from 'preact';
import { CountdownWidget } from './CountdownWidget.jsx';

function mountWidget(container) {
  if (!container || container.dataset.cdaMounted) return;

  const shop = container.dataset.shop || window?.Shopify?.shop || '';
  const productId = container.dataset.productId || '';
  const collectionIds = container.dataset.collectionIds || '';
  const apiUrl = container.dataset.apiUrl || '';

  if (!shop) return;

  container.dataset.cdaMounted = 'true';
  render(
    h(CountdownWidget, { shop, productId, collectionIds, apiUrl }),
    container
  );
}

function initAll() {
  const elements = document.querySelectorAll(
    '#cda-countdown-timer-widget, .cda-countdown-mount'
  );
  elements.forEach((el) => mountWidget(el));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAll);
} else {
  initAll();
}

// Support dynamic theme rendering or AJAX cart/page loads
window.ShopifyCountdownWidget = {
  init: initAll,
  mount: mountWidget,
};
