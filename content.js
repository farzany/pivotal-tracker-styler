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

    const parentDiv = header.parentElement;
    const accepted = parentDiv.classList.contains('accepted');
    const started = parentDiv.classList.contains('started');

    if (accepted) {
      header.classList.add('accepted');
    } else if (totalReviews === 0) {
      if (owner || started) {
        header.classList.add('inProgress');
      } else {
        header.classList.add('unstarted');
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

function customStylingOptions(toggleId, defaultValue, style) {
  chrome.storage.local.get(toggleId, (result) => {
    const toggled = result[toggleId] !== undefined ? result[toggleId] : defaultValue;

    const styleTagId = `${toggleId}-style`;
    let styleTag = document.getElementById(styleTagId);
  
    if (toggled) {
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleTagId;
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = style;
    } else {
      if (styleTag) {
        styleTag.textContent = '';
      }
    }
  });
}

const options = {
  'dimUnstartedTickets': {
    style: `[data-aid="StoryPreviewItem__preview"].status.unstarted {
      background-color: #E2E8F0 !important;
      color: #475569 !important;
    }`,
    defaultChecked: true
  },
  'hideTicketSelectors': {
    style: '.selector { display: none !important; }',
    defaultChecked: false
  }
};

function init() {
  applyUniqueColorsForAuthors();
  displayTicketStatus();
  customStylingOptions('hideTicketSelectors', options['hideTicketSelectors'].defaultChecked, options['hideTicketSelectors'].style);
  customStylingOptions('dimUnstartedTickets', options['dimUnstartedTickets'].defaultChecked, options['dimUnstartedTickets'].style);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') {
    for (const key in changes) {
      if (key in options) {
        const style = options[key].style;
        const defaultChecked = options[key].defaultChecked;

        customStylingOptions(key, defaultChecked, style);
      }
    }
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
