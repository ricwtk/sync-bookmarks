function checkSignInStatus() {
  gapi.load("client:auth2", () => {
    gapi.client.init({
      clientId: "903494531768-84hjq7n2u76kvogs6cesll2nms4eo93h.apps.googleusercontent.com",
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
      scope: "https://www.googleapis.com/auth/drive.appfolder email"
    }).then(() => {
      accountStatusListener(gapi.auth2.getAuthInstance().isSignedIn.get());
      gapi.auth2.getAuthInstance().isSignedIn.listen(accountStatusListener);
    });
  });
}
function accountStatusListener(signedIn) {
  if (signedIn) {
    v_app.signedIn = true;
    v_app.email = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile().getEmail();
    getFileId().then(getFileContent).then(resp => {
      let rKeys = Object.keys(resp);
      v_app.bookmarks = rKeys.includes("bookmarks") ? resp.bookmarks : [];
      v_app.sortFeature = rKeys.includes("sortFeature") ? resp.sortFeature : 0;
      v_app.sortOrder = rKeys.includes("sortOrder") ? resp.sortOrder : false;
    });
  } else {
    v_app.signedIn = false;
    v_app.bookmarks = [];
  }
}
function signInAccount() {
  gapi.auth2.getAuthInstance().signIn();
}
function signOutAccount() {
  gapi.auth2.getAuthInstance().signOut();
}

function getFileId() {
  return gapi.client.drive.files.list({
    q: "name=\"syncbookmarks.json\"",
    spaces: "appDataFolder",
    fields: "files(id)"
  }).then(resp => {
    let files = resp.result.files;
    // console.log(files.map(f => f.id));
    if (files.length < 1) {
      // create file
      return createFile().then(getFileId);
    } else {
      return files[0].id;
    }
  })
}
function createFile() {
  return gapi.client.drive.files.create({
    name: "syncbookmarks.json",
    parents: ["appDataFolder"],
    fields: "id, name"
  });
}
function getFileContent(fileId) {
  return gapi.client.drive.files.get({
    fileId: fileId,
    alt: "media"
  }).then(resp => {
    return resp.result;
  });
}
function updateFileContent(fileId) {
  return gapi.client.request({
    path: "/upload/drive/v3/files/" + fileId,
    method: "PATCH",
    params: {
      uploadType: "media"
    },
    body: JSON.stringify({
      bookmarks: v_app.bookmarks,
      sortFeature: v_app.sortFeature,
      sortOrder: v_app.sortOrder
    })
  });
}

Vue.component("single-bookmark", {
  props: ["bookmark", "allCategories"],
  data: function () {
    return {
      showDetails: false
    }
  },
  computed: {
    notCat: function () {
      return this.allCategories.filter(c => !this.bookmark.categories.includes(c));
    }
  },
  methods: {
    toggleDetails: function () {
      this.showDetails = !this.showDetails;
    },
    openBookmark: function () {
      try {
        window.open(this.bookmark.url, "_blank");
      } catch (e) {
        this.$emit("error", "URL (" + this.bookmark.url + ") cannot be opened from script due to browser limitation");
      }
    },
    removeBookmark: function () {
      this.$emit("removebookmark", this.bookmark.url);
    },
    clickText: function (el) {
      this.$emit("clicktext", el.target.textContent);
    },
    monitorInput: function (el) {
      let catEntry = el.target.value;
      if (catEntry[catEntry.length-1] == ",") {
        let newCat = catEntry.slice(0, catEntry.length-1)
        this.addCat(newCat);
        el.target.value = "";
      }
    },
    enterCat: function (el) {
      let catEntry = el.target.value;
      this.addCat(catEntry);
      el.target.value = "";
    },
    addCat: function (newCat) {
      this.$emit("addcat", { url: this.bookmark.url, newCat: newCat });
      this.bookmark.categories.push(newCat);
      this.bookmark.categories = this.bookmark.categories.filter((s,i,a) => a.indexOf(s) == i);
    },
  },
  template: `
    <div class="single-bookmark">
      <div class="overview">
        <img v-if="bookmark.favIconUrl" class="favicon" :src="bookmark.favIconUrl">
        <div class="desc">
          <div class="bm-title" @click="clickText">{{ bookmark.customTitle ? bookmark.customTitle : bookmark.title }}</div>
          <div class="bm-url" @click="clickText">{{ bookmark.url }}</div>
          <div class="actions-group">
            <div class="fa fa-minus" @click="removeBookmark"></div>
            <div class="fa fa-external-link-square" @click="openBookmark"></div>
          </div>
        </div>
        <div class="fa fa-caret-down" @click="toggleDetails"></div>
      </div>
      <div class="details" v-if="showDetails">
        <div class="title-edit">
          Custom title: <input type="text" v-model="bookmark.customTitle">
        </div>
        <div class="cat-edit">
          <div class="cat-display">
            Categories:
            <span v-for="cat in bookmark.categories" class="tag">
              {{ cat }}
              <i class="fa fa-times" :data-tagname="cat"></i>
            </span>
          </div>
          <div class="cat-input">
            <i class="fa fa-plus"></i>
            <input type="text" @input="monitorInput" @change="enterCat">
          </div>
          <div class="more-cat-display">
          <span v-for="cat in notCat" class="tag">
            {{ cat }}
            <i class="tag-action fa fa-plus" :data-tagname="cat"></i>
          </span>
          </div>
        </div>
        <div class="desc-edit">
          Description:
          <textarea v-model="bookmark.description" rows="5">
        </div>
      </div>
    </div>
  `
});

Vue.component("global-actions", {
  data: function () {
    return {
      showMenu: false
    };
  },
  methods: {
    openMenu: function () {
      this.showMenu = true;
      Vue.nextTick(() => {
        window.addEventListener("click", this.closeMenu);
      });
    },
    closeMenu: function () {
      this.showMenu = false;
      window.removeEventListener("click", this.closeMenu);
    },
    refresh: function () {
      this.$emit("refresh");
    },
    goHome: function () {
      window.open("../", "_self");
    },
    openSettings: function () {
      this.$emit("showsettings");
    }
  },
  template: `
    <div id="global-actions">
      <template v-if="showMenu">
        <div class="g-action-button fa fa-times" @click="closeMenu"></div>
        <div class="g-action-button fa fa-cog" @click="openSettings"></div>
        <div class="g-action-button fa fa-refresh" @click="refresh"></div>
        <div class="g-action-button fa fa-home" @click="goHome"></div>
      </template>
      <div v-else class="g-action-button fa fa-bars" @click="openMenu"></div>
    </div>
  `
});

Vue.component("message", {
  props: ["message", "type"],
  computed: {
    msgCls: function () {
      return {
        message: true,
        "error-message": this.type == "error"
      }
    }
  },
  methods: {
    close: function () {
      this.$emit("close");
    }
  },
  template: `
  <div class="message-wrapper">
    <div :class="msgCls">
      {{ message }}
      <span class="close-message fa fa-times" title="close message" @click="close"></span>
    </div>
  </div>
  `
});

Vue.component("setting-screen", {
  props: ["sortBy", "sortOrder"],
  data: function () {
    return {
      sortFeatureAll: ["Categories", "Title", "URL", "Saved date"],
      sortFeatureAllKeys: ["categories", "title", "url", "savedDate"]
    }
  },
  computed: {
    sortFeatureDisplay: function() {
      return this.sortFeatureAll[this.sortBy];
    },
    sortOrderClass: function () {
      return {
        "ss-sort-order": true,
        fa: true,
        "fa-sort-alpha-desc": this.sortBy != 3 && this.sortOrder,
        "fa-sort-alpha-asc": this.sortBy != 3 && !this.sortOrder,
        "fa-sort-numeric-desc": this.sortBy == 3 && this.sortOrder,
        "fa-sort-numeric-asc": this.sortBy == 3 && !this.sortOrder
      }
    }
  },
  methods: {
    hide: function (el) {
      if (el.target == this.$el) this.$emit("hide");
    },
    changeSortBy: function () {
      this.$emit("changesortby", ( this.sortBy+1 ) % this.sortFeatureAll.length);
    },
    changeSortOrder: function () {
      this.$emit("changesortorder", !this.sortOrder);
    }
  },
  template: `
    <div class="ss-wrapper" @click="hide">
      <div class="ss">
        <div class="ss-title">Settings</div>
        <div class="ss-sort">
          <div class="ss-sort-by" @click="changeSortBy">{{ sortFeatureDisplay }}</div>
          <div :class="sortOrderClass" @click="changeSortOrder"></div>
        </div>
      </div>
    </div>
  `
});

v_app = new Vue({
  el: "#wrapper",
  data: {
    bookmarks: [],
    sortFeature: 0,
    sortOrder: false,
    signedIn: false,
    email: "",
    message: "",
    messageType: "info",
    showSettingsScreen: true
  },
  computed: {
    allCategories: function () {
      return Array.prototype.concat(...this.bookmarks.map(bm => bm.categories)).filter((s,i,a) => a.indexOf(s) == i).sort((a,b) => a.localeCompare(b));
    }
  },
  methods: {
    openSyncBookmarksHome: () => window.open("../", "_self"),
    clickOnAccount: function () {
      if (this.signedIn) signOutAccount();
      else signInAccount();
    },
    removeWindow: function (wid, tid) {
      console.log("removeWindow", wid, tid);
      if (tid == undefined) {
        let conf = confirm("Delete the window?");
        if (conf) this.savedWindows.splice(wid, 1);
      } else {
        let conf = confirm("Delete tab: " + this.savedWindows[wid].tabs[tid].title + "?");
        if (conf) {
          this.savedWindows[wid].tabs.splice(tid, 1);
          if (this.savedWindows[wid].tabs.length == 0) this.savedWindows.splice(wid, 1);
        }
      }
      // save to database
      getFileId().then(updateFileContent);
    },
    refreshFromDatabase: function () {
      getFileId().then(getFileContent).then(resp => {
        let rKeys = Object.keys(resp);
        v_app.bookmarks = rKeys.includes("bookmarks") ? resp.bookmarks : [];
        v_app.sortFeature = rKeys.includes("sortFeature") ? resp.sortFeature : 0;
        v_app.sortOrder = rKeys.includes("sortOrder") ? resp.sortOrder : false;
      });
    },
    showError: function (message) {
      this.setMessage(message, "error");
    },
    closeMessage: function () {
      this.message = "";
    },
    showText: function (text) {
      this.setMessage(text, "info");
    },
    setMessage: function (message, type) {
      this.message = message;
      this.messageType = type;
      // setTimeout(() => {
      //   if (this.message == message) this.message = "";
      // }, 3000);
    },
    addCat: function (m) {
      let tbm = this.bookmarks.find(bm => bm.url == m.url);
      tbm.categories.push(m.newCat);
      tbm.categories = tbm.categories.filter((s,i,a) => a.indexOf(s) == i);
      getFileId().then(updateFileContent);
    },
    showSettings: function () {
      this.showSettingsScreen = true;
    },
    changeSortFeature: function (sortFeature) {
      this.sortFeature = sortFeature;
      getFileId().then(updateFileContent);
    },
    changeSortOrder: function (sortOrder) {
      this.sortOrder = sortOrder;
      getFileId().then(updateFileContent);
    }
  }
})
