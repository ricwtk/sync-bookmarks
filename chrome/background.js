// ---------------------------- Constants ----------------------------
var ACCESS_TOKEN = "";

// ------------------------- Variables --------------------------------
var bookmarks = [];
var dataPort;
var sortFeature = 0;
var sortOrder = false;
var useLocal = true;
var remoteAccount = "";

// ------------------------ Google Drive --------------------------
function extractAccessToken(str) {
  let x = new URL(str);
  let y = new URLSearchParams(x.hash.substring(1));
  return y.get("access_token");
}
function getRequestHeader() {
  let reqHeader = new Headers();
  reqHeader.set('Authorization', 'Bearer ' + ACCESS_TOKEN);
  return reqHeader;
}
function gDriveGetFileId() {
  let x = new URL("https://www.googleapis.com/drive/v3/files");
  x.search = new URLSearchParams([
    ["q", "name=\"syncbookmarks.json\""],
    ["spaces", "appDataFolder"],
    ["fields", "files(id,name)"]
  ]);
  let req = new Request(x.href, {
    method: "GET",
    headers: getRequestHeader()
  });
  return fetch(req).then(resp => {
    if (resp.status == 200) {
      return resp.json().then(resp => {
        if (resp.files.length > 0) {
          return resp.files[0];
        } else {
          return gDriveCreateFile();
        }
      });
    } else {
      throw resp.status;
    }
  });
}
function gDriveCreateFile() {
  let reqHeader = getRequestHeader();
  reqHeader.append("Content-Type", "application/json");
  let reqBody = {
    name: 'syncbookmarks.json',
    parents: ['appDataFolder']
  };
  let x = new URL("https://www.googleapis.com/drive/v3/files");
  x.search = new URLSearchParams([
    ["alt", "json"],
    ["fields", "id,name"]
  ]);
  let req = new Request(x.href, {
    method: "POST",
    headers: reqHeader,
    body: JSON.stringify(reqBody),
  });
  return fetch(req).then(resp => {
    if (resp.status == 200) {
      return resp.json();
    } else {
      throw resp.status;
    }
  });
}
function gDriveGetContent(file) {
  let x = new URL("https://www.googleapis.com/drive/v3/files/" + file.id);
  x.search = new URLSearchParams([
    ["alt", "media"]
  ]);
  let req = new Request(x.href, {
    method: "GET",
    headers: getRequestHeader()
  });
  return fetch(req).then(resp => {
    if (resp.status == 200) {
      return resp.text().then(res => {
        try {
          return JSON.parse(res);
        } catch (e) {
          return [];
        }
      });
    } else {
      throw resp.status;
    }
  });
}
function gDriveSetContent(file, content) {
  let x = new URL("https://www.googleapis.com/upload/drive/v3/files/" + file.id);
  x.search = new URLSearchParams([
    ["uploadType", "media"]
  ]);
  let req = new Request(x.href, {
    method: "PATCH",
    headers: getRequestHeader(),
    body: JSON.stringify(content)
  });
  return fetch(req).then((resp) => {
    if (resp.status == 200) {
      return resp.json();
    } else {
      throw resp.status;
    }
  })
}
function afterGoogleLogin(authResult) {
  ACCESS_TOKEN = authResult;
  if (!ACCESS_TOKEN) {
    throw "Authorization failure";
  } else {
    let x = new URL("https://www.googleapis.com/oauth2/v1/userinfo");
    x.search = new URLSearchParams([
      ["alt", "json"]
    ]);
    let req = new Request(x.href, {
      method: "GET",
      headers: getRequestHeader()
    });
    return fetch(req).then(r => {
      if (r.status == 200) {
        return r.json().then(profile => {
          remoteAccount = profile.email;
        });
      } else {
        throw r.status;
      }
    });
  }
}

// ----------------------- messaging service -------------------
function connected(p) {
  dataPort = p;
  dataPort.onMessage.addListener(m => {
    console.log("From popup.js", m);
    let retM = {};
    let mKeys = Object.keys(m);
    if (mKeys.includes("init")) {
      return sendToDataPort({
        bookmarks: bookmarks,
        sortFeature: sortFeature,
        sortOrder: sortOrder,
        useLocal: useLocal,
        remoteAccount: remoteAccount
      });
    }
    if (mKeys.includes("refresh")) {
      sendToDataPort({
        bookmarks: bookmarks,
        sortFeature: sortFeature,
        sortOrder: sortOrder,
        useLocal: useLocal,
        remoteAccount: remoteAccount,
        refresh: true
      })
      return getData(false).then(sendToDataPort);
    }
    if (mKeys.includes("setLocal")) return updateLocal(m.setLocal, true).then(() => getData(false)).then(sendToDataPort);
    if (["setSortFeature", "setSortOrder"].some( el => mKeys.includes(el) )) {
      if (mKeys.includes("setSortFeature")) sortFeature = m.setSortFeature;
      if (mKeys.includes("setSortOrder")) sortOrder = m.setSortOrder;
      syncToStorage({
        bookmarks: bookmarks,
        sortFeature: sortFeature,
        sortOrder: sortOrder
      })
    }
    if (["add", "remove", "addCat", "removeCat", "changeCustomTitle", "changeDescription"]
      .some( el => mKeys.includes(el) )) {
        return getData(false).then(d => {
          if (mKeys.includes("add")) {
            if (d.bookmarks.findIndex(bm => bm.url == m.add.url) < 0) 
              d.bookmarks.push(m.add);
          }
          if (mKeys.includes("remove")) d.bookmarks.splice(d.bookmarks.findIndex(bm => bm.url == m.remove), 1);
          if (mKeys.includes("addCat")) {
            let tbm = d.bookmarks.find(bm => bm.url == m.addCat.url);
            tbm.categories.push(m.addCat.newCat);
            tbm.categories = tbm.categories.filter((s,i,a) => a.indexOf(s) == i);
          }
          if (mKeys.includes("removeCat")) {
            let tbm = d.bookmarks.find(bm => bm.url == m.removeCat.url);
            let removeIdx = tbm.categories.indexOf(m.removeCat.removeCat);
            if (removeIdx > -1) tbm.categories.splice(removeIdx, 1);
          }
          if (mKeys.includes("changeCustomTitle")) {
            let tbm = d.bookmarks.find(bm => bm.url == m.changeCustomTitle.url);
            tbm.customTitle = m.changeCustomTitle.new;
          }
          if (mKeys.includes("changeDescription")) {
            let tbm = d.bookmarks.find(bm => bm.url == m.changeDescription.url);
            tbm.description = m.changeDescription.new;
          }
          return {
            bookmarks: d.bookmarks,
            sortFeature: d.sortFeature,
            sortOrder: d.sortOrder,
            useLocal: d.useLocal
          }
        }).then(d => {
          bookmarks = d.bookmarks;
          sortFeature = d.sortFeature;
          sortOrder = d.sortOrder;
          syncToStorage({
            bookmarks: d.bookmarks,
            sortFeature: d.sortFeature,
            sortOrder: d.sortOrder
          });
          sendToDataPort(d);
        });
      }
  });
}

function updateLocal(newLocal, interactive) {
  useLocal = newLocal;
  return new Promise(resolve => {
    chrome.storage.local.set({
      "sync-bookmarks-local-prefs": { "useLocal": useLocal }
    });
    resolve();
  });
}

function sendToDataPort(data) {
  try {
    if (dataPort) dataPort.postMessage(data);
  } catch (e) {
    console.log(e);
  }
}

function syncToStorage(data) {
  if (useLocal) {
    return chrome.storage.local.set({
      "sync-bookmarks-data": data
    });
  } else {
    gDriveGetFileId().then(file => gDriveSetContent(file, data));
  }
}

function getData(interactive) {
  if (useLocal) {
    ACCESS_TOKEN = "";
    return new Promise((resolve, reject) => {
      chrome.storage.local.get("sync-bookmarks-data", res => {
        let resContent = res["sync-bookmarks-data"];
        if (resContent) {
          let rcKeys = Object.keys(resContent);
          bookmarks = rcKeys.includes("bookmarks") ? resContent.bookmarks : [];
          sortFeature = rcKeys.includes("sortFeature") ? resContent.sortFeature : 0;
          sortOrder = rcKeys.includes("sortOrder") ? resContent.sortOrder : false;
        } else {
          bookmarks = [];
          sortFeature = 0;
          sortOrder = false;
        }
        resolve({
          bookmarks: bookmarks,
          sortFeature: sortFeature,
          sortOrder: sortOrder,
          useLocal: useLocal
        });
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      if (!ACCESS_TOKEN) {
        chrome.identity.getAuthToken({
          interactive: interactive
        }, token => {
          if (token == undefined) {
            console.log("Not logged in to Google");
            updateLocal(true, interactive).then(() => getData(false)).then(sendToDataPort);
          } else {
            console.log("Logged in to Google");
            resolve(afterGoogleLogin(token));
          }
        });
      } else {
        resolve();
      }
    }).then(gDriveGetFileId)
    .then(gDriveGetContent)
    .then(resp => {
      console.log(resp);
      let rKeys = Object.keys(resp);
      bookmarks = rKeys.includes("bookmarks") ? resp.bookmarks : [];
      sortFeature = rKeys.includes("sortFeature") ? resp.sortFeature : 0;
      sortOrder = rKeys.includes("sortOrder") ? resp.sortOrder : false;
      if (dataPort) dataPort.postMessage({
        bookmarks: bookmarks,
        sortFeature: sortFeature,
        sortOrder: sortOrder,
        useLocal: useLocal,
        remoteAccount: remoteAccount
      });
      return resp;
    }, err => {
      ACCESS_TOKEN = "";
      return getData(interactive);
    });
  }
}

chrome.runtime.onConnect.addListener(connected);

chrome.storage.local.get("sync-bookmarks-local-prefs", res => {
  let resContent = res["sync-bookmarks-local-prefs"];
  if (resContent)
    useLocal = Object.keys(resContent).includes("useLocal") ? resContent["useLocal"] : useLocal;
  console.log("useLocal", useLocal);
  getData(false).then(sendToDataPort);
});
