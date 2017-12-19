var bookmarks = [{"favIconUrl":"https://www.google.com/images/icons/product/chrome-32.png","title":"chrome.tabs - Google Chrome","url":"https://developer.chrome.com/extensions/tabs#method-query","savedDate":"2017-12-19T14:14:03.693Z","category":""}];
var dataPort;

function connected(p) {
  dataPort = p;
  dataPort.onMessage.addListener(m => {
    console.log("From popup.js", m);
    let retM = {};
    if (m.add) {
      // check if new url is already on the list
      bookmarks.push(m.add);
    }
    if (m.remove) bookmarks.splice(m.remove, 1);
    dataPort.postMessage({ bookmarks: bookmarks });
  });
}

browser.runtime.onConnect.addListener(connected);
