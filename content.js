// content.js

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function applyUniqueBackgroundColors() {
  const ownerElements = document.querySelectorAll('.owner');
  const colorMap = {};

  function getColor(title) {
    const colors = [
      '#0EA5E9',
      '#D946EF',
      '#F43F5E',
      '#EAB308',
      '#8B5CF6',
      '#64748B',
      '#C2410C',
      // Add more colors if needed
    ];

    if (!colorMap[title]) {
      colorMap[title] = colors[Object.keys(colorMap).length % colors.length];
    }

    return colorMap[title];
  }

  ownerElements.forEach((element) => {
    if (element.classList.contains('row')) return;
    const title = element.getAttribute('title');
    const backgroundColor = getColor(title);

    // Update the owner element's background color
    element.style.backgroundColor = backgroundColor;

    // Add a colored left border to the ticket card
    const headerElement = element.closest('header');
    if (headerElement) {
      headerElement.style.boxShadow = `inset 4px 0 0 0 ${backgroundColor}`;
    }
  });
}

// Apply unique background colors after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  applyUniqueBackgroundColors();
});

// If the page uses a dynamic framework, listen for changes to the DOM and apply unique background colors again
const observer = new MutationObserver(debounce(() => {
  applyUniqueBackgroundColors();
}, 500));

observer.observe(document.body, {
  childList: true,
  subtree: true
});