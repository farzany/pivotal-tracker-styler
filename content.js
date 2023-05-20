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

const authorsColorMap = {};

function applyUniqueColorsForAuthors() {
  const ownerElements = Array.from(document.querySelectorAll('.owner'));
  
  const authors = ownerElements
    .map((element) => element.getAttribute('title'))
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();
  
  function getColor(title) {
    const colors = [
      '#0EA5E9',
      '#D946EF',
      '#F43F5E',
      '#FBBF24',
      '#8B5CF6',
      '#22C55E',
      '#64748B',
      // Add more colors if needed
    ];

    const index = authors.indexOf(title);

    if (index === -1) {
      return colors[6]; // default color
    }

    return colors[index % colors.length];
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
  chrome.storage.local.get('displayTicketStatus', (result) => {
    const displayTicketStatus = result['displayTicketStatus'] !== undefined ? result['displayTicketStatus'] : false;

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
      
      if (displayTicketStatus) {
        header.classList.add('status');
      } else {
        header.classList.remove('status');
        return;
      }

      const parentDiv = header.parentElement;
      const accepted = parentDiv.classList.contains('accepted');
      const started = parentDiv.classList.contains('started');
      const finished = parentDiv.classList.contains('finished');

      if (accepted) {
        header.classList.add('accepted');
      } else if (totalReviews === 0) {
        if (started || finished) {
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
  });
}

function addCodeBlockLineNumbers() {
  const codeBlocks = document.querySelectorAll('pre code');

  codeBlocks.forEach((block) => {
    const alreadyNumbered = block.querySelector('.line');

    if (!alreadyNumbered) {
      const content = block.innerHTML.trim();
      const lines = content.split('\n');
      const wrappedLines = lines.map((line) => {
        const lineContent = line.trim() === '' ? '&nbsp;' : line;
        return `<span class="line">${lineContent}</span>`;
      });
      block.innerHTML = wrappedLines.join('');
    }
  });
}

function displaySprintRemainder() {
  chrome.storage.local.get('displaySprintRemainder', (result) => {
    const displaySprintRemainder = result['displaySprintRemainder'] !== undefined ? result['displaySprintRemainder'] : false;
    if (!displaySprintRemainder) { return; }
    
    const sprintEndElements = document.querySelectorAll('[data-aid="IterationMarker__length"]:not([data-processed])');

    sprintEndElements.forEach(element => {
      const dateRangeText = element.textContent.trim();
      const endDateText = dateRangeText.split(' - ')[1];
    
      const [day, monthName] = endDateText.split(' ');
  
      const currentYear = (new Date()).getFullYear();
      const monthIndex = new Date(Date.parse(monthName +" 1, 2012")).getMonth();
      const endDate = new Date(currentYear, monthIndex, day);
  
      const today = new Date();
      today.setHours(0, 0, 0, 0);
  
      const diffInDays = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
  
      if (diffInDays >= 0) {
        const remainingDaysText = ` / ${diffInDays} Days Left`;
        element.textContent += remainingDaysText;
      }
  
      element.setAttribute('data-processed', 'true');
    });
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
    style: `.unstarted [data-aid="StoryPreviewItem__preview"] {
      background-color: #E2E8F0 !important;
      color: #475569 !important;
    }`,
    defaultChecked: true
  },
  'hideTicketSelectors': {
    style: '.selector { display: none !important; }',
    defaultChecked: false
  },
  'hideRejectButton': {
    style: "[class*='StoryPreviewItemButtons'] .state.button.reject { display: none !important; }",
    defaultChecked: true
  }
};

function init() {
  applyUniqueColorsForAuthors();
  displayTicketStatus();
  addCodeBlockLineNumbers();
  displaySprintRemainder();
  customStylingOptions('hideTicketSelectors', options['hideTicketSelectors'].defaultChecked, options['hideTicketSelectors'].style);
  customStylingOptions('dimUnstartedTickets', options['dimUnstartedTickets'].defaultChecked, options['dimUnstartedTickets'].style);
  customStylingOptions('hideRejectButton', options['hideRejectButton'].defaultChecked, options['hideRejectButton'].style);
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
      } else if (key === 'displayTicketStatus') {
        displayTicketStatus();
      } else if (key === 'displaySprintRemainder') {
        displaySprintRemainder();
      }
    }
  }
});

const fastObserver = new MutationObserver(debounce(() => {
  applyUniqueColorsForAuthors();
  displayTicketStatus();
  displaySprintRemainder();
}, 100));

const slowObserver = new MutationObserver(debounce(() => {
  addCodeBlockLineNumbers();
}, 500));

fastObserver.observe(document.body, {
  childList: true,
  subtree: true
});

slowObserver.observe(document.body, {
  childList: true,
  subtree: true
});
