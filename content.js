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

function applyUniqueColorsForAuthors() {
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

function displayTicketStatus() {
  const storyItems = document.querySelectorAll('.StoryPreviewItem__clickToExpand');

  storyItems.forEach(storyItem => {
    const owner = storyItem.querySelector('.owner');
    const reviewList = storyItem.querySelectorAll('[class^="StoryPreviewItemReviewList"]');

    let totalReviews = 0;
    let approvedCodeReviewCount = 0;
    let approvedQaReviewCount = 0;

    reviewList.forEach(review => {
      const reviewSpans = Array.from(review.children).filter(child => child.tagName === 'SPAN');

      reviewSpans.forEach(reviewSpan => {
        const imgPassed = reviewSpan.querySelector('img[alt="Pass"]');
        const span = reviewSpan.querySelector('span[data-aid="StoryPreviewItemReview__reviewType"]');

        totalReviews++;

        if (imgPassed) {
          if (span.textContent === 'Code') {
            approvedCodeReviewCount++;
          } else if (span.textContent === 'Test (QA)') {
            approvedQaReviewCount++;
          }
        }
      });
    });

    const header = storyItem.querySelector('header');
    header.classList.add('status')

    if (totalReviews === 0) {
      if (owner) {
        header.classList.add('inProgress');
      }
    } else if (approvedCodeReviewCount > 1) {
      if (approvedQaReviewCount > 0) {
        header.classList.add('resolved');
      } else {
        header.classList.add('acceptance');
      }
    } else {
      header.classList.add('review');
    }
  });
}

function toggleTicketSelectors() {
  chrome.storage.local.get('hideTicketSelectors', (result) => {
    const hideTicketSelectors = result.hideTicketSelectors || false;

    const styleTagId = 'toggle-selectors-style';
    let styleTag = document.getElementById(styleTagId);
  
    if (hideTicketSelectors) {
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleTagId;
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = '.selector { display: none !important; }';
    } else {
      if (styleTag) {
        styleTag.textContent = '';
      }
    }
  });
}

function init() {
  applyUniqueColorsForAuthors();
  displayTicketStatus();
  toggleTicketSelectors();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Request listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (typeof request.hideTicketSelectors !== 'undefined') {
    toggleTicketSelectors();
  }
});

// If the page uses a dynamic framework, listen for changes to the DOM and apply unique background colors again
const observer = new MutationObserver(debounce(() => {
  applyUniqueColorsForAuthors();
  displayTicketStatus();
}, 500));

observer.observe(document.body, {
  childList: true,
  subtree: true
});
