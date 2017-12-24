// var bookmarks = [{"favIconUrl":"https://www.google.com/images/icons/product/chrome-32.png","title":"chrome.tabs - Google Chrome","url":"https://developer.chrome.com/extensions/tabs#method-query","savedDate":"2017-12-19T14:14:03.693Z","category":""}];
var bookmarks = [];
var dataPort;
var sortFeature = 0;
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
    if (mKeys.includes("addCat")) {
      let tbm = bookmarks.find(bm => bm.url == m.addCat.url);
      tbm.categories.push(m.addCat.newCat);
      tbm.categories = tbm.categories.filter((s,i,a) => a.indexOf(s) == i);
    }
    if (mKeys.includes("removeCat")) {
      let tbm = bookmarks.find(bm => bm.url == m.removeCat.url);
      let removeIdx = tbm.categories.indexOf(m.removeCat.removeCat);
      if (removeIdx > -1) tbm.categories.splice(removeIdx, 1);
    }
    if (mKeys.includes("changeCustomTitle")) {
      let tbm = bookmarks.find(bm => bm.url == m.changeCustomTitle.url);
      tbm.customTitle = m.changeCustomTitle.customTitle;
    }
    if (mKeys.includes("changeDescription")) {
      let tbm = bookmarks.find(bm => bm.url == m.changeDescription.url);
      tbm.description = m.changeDescription.description;
    }
    dataPort.postMessage({
      bookmarks: bookmarks,
      sortFeature: sortFeature,
      sortOrder: sortOrder
    });
  });
}

browser.runtime.onConnect.addListener(connected);
