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
      v_app.sortFeature = rKeys.includes("webSortFeature") ? resp.webSortFeature : 0;
      v_app.sortOrder = rKeys.includes("webSortOrder") ? resp.webSortOrder : false;
      v_app.arrangement = rKeys.includes("webGrid") ? resp.webGrid : false;
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
      webSortFeature: v_app.sortFeature,
      webSortOrder: v_app.sortOrder,
      webGrid: v_app.arrangement
    })
  });
}

var keyupListeners = [];
function listenToKey(ev) {
  if (keyupListeners.length > 0) keyupListeners[0].listener(ev);
}
function removeKeyupListener(identifier) {
  let removeIdx = keyupListeners.findIndex(kl => kl.identifier == identifier);
  keyupListeners.splice(removeIdx, 1);
}
function addKeyupListener(identifier, listener) {
  keyupListeners.splice(0, 0, {
    identifier: identifier,
    listener: listener
  });
}
window.addEventListener("keyup", listenToKey);

Vue.component("single-bookmark", {
  props: ["bookmark", "allCategories", "arrangement"],
  data: function () {
    return {
      showDetails: false,
      edit: {},
      allowEdit: {
        customTitle: false,
        categories: false,
        description: false
      }
    }
  },
  computed: {
    sortedCat: function () {
      return Array.from(this.bookmark.categories).sort((a,b) => a.localeCompare(b));
    },
    notCat: function () {
      return this.allCategories.filter(c => !this.bookmark.categories.includes(c));
    }
  },
  created: function () {
    this.edit = {
      customTitle: this.bookmark.customTitle,
      description: this.bookmark.description
    };
  },
  methods: {
    toggleDetails: function () {
      this.showDetails = !this.showDetails;
      if (this.showDetails) {
        window.addEventListener("click", this.clickListener);
        addKeyupListener("details", (ev) => {
          if (ev.keyCode == 27) this.toggleDetails();
        });
      } else {
        window.removeEventListener("click", this.clickListener);
        removeKeyupListener("details");
      }
    },
    clickListener: function (ev) {
      if (!this.$el.contains(ev.target)) this.toggleDetails();
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
    clickText: function (ev) {
      let title = "";
      let cl = Array.from(ev.target.classList);
      if (cl.includes("bm-title")) title = "Title";
      if (cl.includes("bm-url")) title = "URL";
      this.$emit("clicktext", { title: title, message: ev.target.textContent });
    },
    accept: function (key) {
      this.$emit("change"+key.toLowerCase(), { url: this.bookmark.url, new: this.edit[key] });
      this.allowEdit[key] = !this.allowEdit[key];
    },
    reject: function (key) {
      this.edit[key] = this.bookmark[key];
      this.allowEdit[key] = !this.allowEdit[key];
    },
    toggleEdit: function (key) {
      this.allowEdit[key] = !this.allowEdit[key];
      if (!this.allowEdit[key]) {
        this.edit[key] = this.bookmark[key];
      } else {
        Vue.nextTick(() => {
          this.$refs[key.toLowerCase() + "Input"].focus();
        });
      }
    },
    removeCat: function (el) {
      this.$emit("removecat", { url: this.bookmark.url, remove: el.target.dataset.tagname });
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
    addExistingCat: function (el) {
      this.addCat(el.target.dataset.tagname);
    },
    addCat: function (newCat) {
      this.$emit("addcat", { url: this.bookmark.url, newCat: newCat });
    },
  },
  template: `
    <div :class="{ 'card-box': true, 'arrange-grid': arrangement && !showDetails, 'show-details': showDetails }">
      <div class="single-bookmark">
        <div class="primary-title" @click="toggleDetails">
          <img v-if="bookmark.favIconUrl" class="favicon" :src="bookmark.favIconUrl">
          <div class="desc">
            <div class="bm-title" @click.stop="clickText">{{ bookmark.customTitle ? bookmark.customTitle : bookmark.title }}</div>
            <div class="bm-url" @click.stop="clickText">{{ bookmark.url }}</div>
          </div>
        </div>
        <div class="actions-group" @click="toggleDetails">
          <div>
            <div class="fa fa-minus" @click.stop="removeBookmark"></div>
            <div class="fa fa-external-link-square" @click.stop="openBookmark"></div>
          </div>
          <div>
            <div :class="{ fa: true, 'fa-angle-down': !showDetails, 'fa-angle-up': showDetails }" @click.stop="toggleDetails"></div>
          </div>
        </div>
        <div class="details" v-if="showDetails">
          <div>
            <div class="section-title">Default title</div>
            <div class="text-display">&#8203;{{ bookmark.title }}</div>
          </div>
          <div>
            <div class="section-title">URL</div>
            <div class="text-display">&#8203;{{ bookmark.url }}</div>
          </div>
          <div>
            <div class="section-title">Title <i class="fa fa-pencil action" @click="toggleEdit('customTitle')"></i></div>
            <div class="text-display" v-if="!allowEdit.customTitle">&#8203;{{ bookmark.customTitle }}</div>
            <div class="text-edit" v-else>
              <input type="text" v-model="edit.customTitle" @keyup.esc.stop="reject('customTitle')" @keyup.enter.stop="accept('customTitle')" ref="customtitleInput">
              <i class="fa fa-check action" @click="accept('customTitle')"></i>
              <i class="fa fa-times action" @click="reject('customTitle')"></i>
            </div>
          </div>
          <div>
            <div class="section-title">Categories <i class="fa fa-pencil action" @click="toggleEdit('categories')"></i></div>
            <div class="cat-display">
              &#8203;
              <span v-for="cat in sortedCat" :class="{ tag: true, edit: allowEdit.categories }">
                {{ cat }}
                <i v-if="allowEdit.categories" class="fa fa-times-circle" :data-tagname="cat" @click="removeCat"></i>
              </span>
            </div>
            <input v-if="allowEdit.categories" type="text" placeholder="Use comma (,) or 'Enter' to end or save a category." @input="monitorInput" @change="enterCat" @keyup.esc.stop="toggleEdit('categories')" ref="categoriesInput">
            <div v-if="allowEdit.categories" class="cat-display">
              <span v-for="cat in notCat" class="tag edit">
                {{ cat }}
                <i class="fa fa-plus-circle" :data-tagname="cat" @click="addExistingCat"></i>
              </span>
            </div>
          </div>
          <div>
            <div class="section-title">Description <i class="fa fa-pencil action" @click="toggleEdit('description')"></i></div>
            <div class="desc-display" v-if="!allowEdit.description">{{ bookmark.description }}</div>
            <div class="desc-edit" v-else>
              <textarea v-model="edit.description" @keyup.esc.stop="reject('description')" ref="descriptionInput"></textarea>
              <i class="fa fa-check action" @click="accept('description')"></i>
              <i class="fa fa-times action" @click="reject('description')"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
});

Vue.component("single-section", {
  props: ["section", "info"],
  methods: {
    clickText: function (param) {
      this.$emit("clicktext", param);
    },
    showError: function (param) {
      this.$emit("error", param);
    },
    removeCat: function (param) {
      this.$emit("removecat", param);
    },
    addCat: function (param) {
      this.$emit("addcat", param);
    },
    changeCustomTitle: function (param) {
      this.$emit("changecustomtitle", param);
    },
    changeDescription: function (param) {
      this.$emit("changedescription", param);
    },
    removeBookmark: function (param) {
      this.$emit("removebookmark", param);
    }
  },
  template: `
  <div class="sc">
    <div class="sc-title">{{ section.name }}</div>
    <div :class="{ 'sc-content': true, 'arrange-grid': info.arrangement }">
      <single-bookmark v-for="bm in section.bookmarks"
        :bookmark="bm"
        :all-categories="info.allCategories"
        :arrangement="info.arrangement"
        @clicktext="clickText"
        @error="showError"
        @addcat="addCat"
        @changecustomtitle="changeCustomTitle"
        @changedescription="changeDescription"
        @removecat="removeCat"
        @removebookmark="removeBookmark">
      </single-bookmark>
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
        addKeyupListener("global-actions", (ev) => {
          if (ev.keyCode == 27) this.closeMenu();
        });
      });
    },
    closeMenu: function () {
      this.showMenu = false;
      window.removeEventListener("click", this.closeMenu);
      removeKeyupListener("global-actions");
    },
    refresh: function () {
      this.$emit("refresh");
    },
    goHome: function () {
      window.open("../", "_self");
    }
  },
  template: `
    <div id="global-actions">
      <template v-if="showMenu">
        <div class="g-action-button fa fa-times" @click="closeMenu"></div>
        <div class="g-action-button fa fa-refresh" @click="refresh"></div>
        <div class="g-action-button fa fa-home" @click="goHome"></div>
      </template>
      <div v-else class="g-action-button fa fa-bars" @click="openMenu"></div>
    </div>
  `
});

Vue.component("message", {
  props: ["title", "message", "prompt"],
  methods: {
    close: function () {
      this.$emit("close");
    },
    hide: function (ev) {
      if (ev.target == this.$el) this.close();
    },
    activate: function (p) {
      if (p.click) p.click();
      this.close();
    }
  },
  template: `
  <div class="message-wrapper" @click="hide">
    <div class="content">
      <div class="title" v-if="title" v-html="title"></div>
      <div class="message" v-html="message"></div>
      <div class="prompt" v-if="prompt">
        <div v-for="p in prompt" @click="activate(p)" v-html="p.text"></div>
      </div>
    </div>
  </div>
  `
});

Vue.component("display-settings", {
  props: ["sortFeature", "sortOrder", "arrangement"],
  data: function () {
    return {
      sortFeatureAll: ["Categories", "Title", "URL", "Saved date"],
    }
  },
  computed: {
    sortOrderIcon: function () {
      return {
        fa: true,
        "fa-sort-alpha-desc": this.sortFeature != 3 && this.sortOrder,
        "fa-sort-alpha-asc": this.sortFeature != 3 && !this.sortOrder,
        "fa-sort-numeric-desc": this.sortFeature == 3 && this.sortOrder,
        "fa-sort-numeric-asc": this.sortFeature == 3 && !this.sortOrder
      }
    },
    arrangeIcon: function () {
      return {
        fa: true,
        "fa-th": this.arrangement,
        "fa-th-list": !this.arrangement
      }
    }
  },
  methods: {
    changeSortOrder: function () {
      this.$emit("changesortorder", !this.sortOrder);
    },
    changeSortFeature: function () {
      this.$emit("changesortfeature", ( this.sortFeature+1 ) % this.sortFeatureAll.length)
    },
    changeArrangement: function () {
      this.$emit("changearrangement", !this.arrangement);
    }
  },
  template: `
  <div class="card-box">
    <div class="ds">
      <div :class="sortOrderIcon" @click="changeSortOrder"></div>
      <div @click="changeSortFeature">{{ sortFeatureAll[sortFeature] }}</div>
      <div :class="arrangeIcon" @click="changeArrangement"></div>
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
    arrangement: false,
    signedIn: false,
    email: "",
    messageTitle: "",
    message: "",
    messagePrompt: [],
    sortFeatureAllKeys: ["categories", "title", "url", "savedDate"]
  },
  computed: {
    allCategories: function () {
      return Array.prototype.concat(...this.bookmarks.map(bm => bm.categories)).filter((s,i,a) => a.indexOf(s) == i).sort((a,b) => a.localeCompare(b));
    },
    rearrangedList: function () {
      let sortFeature = this.sortFeatureAllKeys[this.sortFeature];
      if (this.bookmarks.length == 0) return [];
      let sections = this.bookmarks.map(x => {
        if (sortFeature == "categories") return x[sortFeature];
        else if (sortFeature == "title") {
          let sortRef = x.customTitle ? x.customTitle : x.title;
          return sortRef.length > 0 ? sortRef[0].toUpperCase() : "";
        } else if (sortFeature == "url") {
          let startAt = x[sortFeature].indexOf("://");
          if (startAt > -1) startAt += 3;
          else startAt = 0;
          return x[sortFeature][startAt].toUpperCase();
        } else if (sortFeature == "savedDate") return x[sortFeature].slice(0,10);
      });
      if (sortFeature == "categories") sections = Array.prototype.concat(...sections, "");
      sections = sections.filter((s,i,a) => a.indexOf(s) == i);
      let newList = this.bookmarks.map(x => Object.assign({}, x));
      newList.sort((a,b) => {
        let secondarySortFeature = sortFeature == "categories" ? "title" : sortFeature;
        let result = a[secondarySortFeature].localeCompare(b[secondarySortFeature]);
        return this.sortOrder ? -1*result : result;
      });

      sections = sections.map(x => {
        return {
          name: x,
          bookmarks: newList.filter(y => {
            let compareString;
            if (sortFeature == "categories") {
              if (x) return y[sortFeature].includes(x);
              else return y[sortFeature].length == 0;
            } else if (sortFeature == "title") {
              let sortRef = y.customTitle ? y.customTitle : y.title;
              return sortRef.length > 0 ? sortRef[0].toUpperCase() == x : "" == x;
            } else if (sortFeature == "url") {
              let startAt = y[sortFeature].indexOf("://");
              if (startAt > -1) startAt += 3;
              else startAt = 0;
              return y[sortFeature][startAt].toUpperCase() == x;
            } else if ("savedDate") {
              return y[sortFeature].slice(0,10) == x;
            }
          })
        };
      });
      sections.sort((a,b) => {
        let result = a.name.localeCompare(b.name);
        return this.sortOrder ? -1*result : result;
      })
      return sections.map(s => {
        if (!s.name) s.name = sortFeature == "categories" ? "Uncategorised" : sortFeature == "title" ? "No Name" : "";
        return s;
      });
    }
  },
  methods: {
    openSyncBookmarksHome: () => window.open("../", "_self"),
    clickOnAccount: function () {
      if (this.signedIn) signOutAccount();
      else signInAccount();
    },
    refreshFromDatabase: function () {
      getFileId().then(getFileContent).then(resp => {
        let rKeys = Object.keys(resp);
        this.bookmarks = rKeys.includes("bookmarks") ? resp.bookmarks : [];
        this.sortFeature = rKeys.includes("webSortFeature") ? resp.webSortFeature : 0;
        this.sortOrder = rKeys.includes("webSortOrder") ? resp.webSortOrder : false;
        this.arrangment = rKeys.includes("webGrid") ? resp.webGrid : false;
      });
    },
    showError: function (message) {
      this.setMessage("Error", message, []);
    },
    closeMessage: function () {
      this.messageTitle = "";
      this.message = "";
      this.messagePrompt = [];
      removeKeyupListener("message");
    },
    showText: function (m) {
      this.setMessage(m.title, m.message, []);
    },
    setMessage: function (title, message, prompt) {
      this.messageTitle = title;
      this.message = message;
      this.messagePrompt = prompt;
      addKeyupListener("message", (ev) => {
        if (ev.keyCode == 27) this.closeMessage();
      })
    },
    closeMessageByKey: function (ev) {
      if (ev.keyCode == 27) this.closeMessage();
    },
    addCat: function (m) {
      let tbm = this.bookmarks.find(bm => bm.url == m.url);
      tbm.categories.push(m.newCat);
      tbm.categories = tbm.categories.filter((s,i,a) => a.indexOf(s) == i);
      getFileId().then(updateFileContent);
    },
    removeCat: function (m) {
      let tbm = this.bookmarks.find(bm => bm.url == m.url);
      let removeIdx = tbm.categories.indexOf(m.remove);
      if (removeIdx > -1) tbm.categories.splice(removeIdx, 1);
      getFileId().then(updateFileContent);
    },
    changeSortFeature: function (sortFeature) {
      this.sortFeature = sortFeature;
      getFileId().then(updateFileContent);
    },
    changeSortOrder: function (sortOrder) {
      this.sortOrder = sortOrder;
      getFileId().then(updateFileContent);
    },
    changeArrangement: function (arrangement) {
      this.arrangement = arrangement;
      getFileId().then(updateFileContent);
    },
    changeCustomTitle: function (param) {
      let tbm = this.bookmarks.find(bm => bm.url == param.url);
      tbm.customTitle = param.new;
      getFileId().then(updateFileContent);
    },
    changeDescription: function (param) {
      let tbm = this.bookmarks.find(bm => bm.url == param.url);
      tbm.description = param.new;
      getFileId().then(updateFileContent);
    },
    removeBookmark: function (param) {
      this.setMessage(
        "Remove bookmark?",
        "Do you want to remove bookmark " + param + "?",
        [{
          text: "Remove",
          click: () => {
            this.bookmarks.splice(this.bookmarks.findIndex(bm => bm.url == param), 1);
            getFileId().then(updateFileContent);
          }
        }, {
          text: "Keep"
        }]
      );
    }
  }
})
