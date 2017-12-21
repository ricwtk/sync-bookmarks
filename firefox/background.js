// var bookmarks = [{"favIconUrl":"https://www.google.com/images/icons/product/chrome-32.png","title":"chrome.tabs - Google Chrome","url":"https://developer.chrome.com/extensions/tabs#method-query","savedDate":"2017-12-19T14:14:03.693Z","category":""}];
var bookmarks = [];
var dataPort;
var sortFeature = 1;
var sortOrder = false;

function connected(p) {
  dataPort = p;
  dataPort.onMessage.addListener(m => {
    console.log("From popup.js", m);
    let retM = {};
    let mKeys = Object.keys(m);
    if (mKeys.includes("add")) bookmarks.push(m.add);
    if (mKeys.includes("remove")) bookmarks.splice(bookmarks.findIndex(bm => bm.url == m.remove), 1);
    if (mKeys.includes("setSortFeature")) sortFeature = m.setSortFeature;
    if (mKeys.includes("setSortOrder")) sortOrder = m.setSortOrder;
    dataPort.postMessage({
      bookmarks: bookmarks,
      sortFeature: sortFeature,
      sortOrder: sortOrder
    });
  });
}

browser.runtime.onConnect.addListener(connected);
