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
  });
}

function applyBoxShadowColorsBasedOnReviewCount() {
  const parentDivs = document.querySelectorAll('div[id^="panel_current"]');

  parentDivs.forEach(parentDiv => {
    const childDivs = parentDiv.querySelectorAll('.StoryPreviewItem__clickToExpand');
    childDivs.forEach(childDiv => {
      const reviewList = childDiv.querySelectorAll('[class^="StoryPreviewItemReviewList"]');

      let totalReviews = 0;
      let approvedCodeReviewCount = 0;
      let approvedQaReviewCount = 0;
      reviewList.forEach(review => {
        const spans = review.querySelectorAll('span');
        const reviewSpans = Array.from(spans).filter(span => span.parentElement === review);
        reviewSpans.forEach(reviewSpan => {
          const imgPassed = reviewSpan.querySelector('img[alt="Pass"]');
          const span = reviewSpan.querySelector('span[data-aid="StoryPreviewItemReview__reviewType"]');

          totalReviews++;

          if (imgPassed && imgPassed.alt === 'Pass' && span?.textContent === 'Code') {
            approvedCodeReviewCount++;
          }
          if (imgPassed && imgPassed.alt === 'Pass' && span?.textContent === 'Test (QA)') {
            approvedQaReviewCount++;
          }
        });
      });

      if (totalReviews == 0) {
        //in progress or unstarted
        const header = childDiv.querySelector('header');
        header.style.boxShadow = `inset 10px 0 0 0 #EEEEE4`;
        //TODO: Separate out in progress and unstarted from current sprint
      } else {
        if (approvedCodeReviewCount > 1) {
          if (approvedQaReviewCount > 0) {
            //resolved
            const header = childDiv.querySelector('header');
            header.style.boxShadow = `inset 10px 0 0 0 #99FC98`;
          } else {
            //acceptance
            const header = childDiv.querySelector('header');
            header.style.boxShadow = `inset 10px 0 0 0 #FDFD96`;
          }
        } else {
          //code review
          const header = childDiv.querySelector('header');
          header.style.boxShadow = `inset 10px 0 0 0 #A3D3E5`;
        }
      }
    });
  });
}


// Apply unique background colors after the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  applyUniqueBackgroundColors();
  applyBoxShadowColorsBasedOnReviewCount();
});

// If the page uses a dynamic framework, listen for changes to the DOM and apply unique background colors again
const observer = new MutationObserver(debounce(() => {
  applyUniqueBackgroundColors();
  applyBoxShadowColorsBasedOnReviewCount();
}, 500));

observer.observe(document.body, {
  childList: true,
  subtree: true
});