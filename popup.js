function setupToggle(toggleId, defaultValue = false) {
  const toggle = document.querySelector(`input#${toggleId}`);

  chrome.storage.local.get(toggleId, (result) => {
    toggle.checked = result[toggleId] !== undefined ? result[toggleId] : defaultValue;
  });

  toggle.addEventListener('change', (event) => {
    const isChecked = event.target.checked;

    chrome.storage.local.set({
      [toggleId]: isChecked
    });

    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        [toggleId]: isChecked
      });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  setupToggle('hideTicketSelectors');
  setupToggle('dimUnstartedTickets', true);
  // Add more toggles by calling setupToggle with their respective IDs
});