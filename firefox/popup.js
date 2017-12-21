var dataPort;
dataPort = browser.runtime.connect({ name: "popup-background" });
const sortFeatureAll = ["Category", "Title", "URL", "Saved date"];
const sortFeatureAllKeys = ["category", "title", "url", "savedDate"];

Vue.component("a-mark", {
  props: ["mark", "actions"],
  data: function () {
    return {
      showPopup: false,
      popupText: ""
    }
  },
  methods: {
    popText: function (el) {
      this.showPopup = true;
      this.popupText = el.target.textContent;
    },
    hidePop: function (el) {
      if (el.target != this.$refs.popupText) this.showPopup = false;
    },
    addBookmark: function () {
      this.$emit("add", {
        favIconUrl: this.mark.favIconUrl,
        title: this.mark.title,
        url: this.mark.url,
        savedDate: new Date().toISOString(),
        category: ""
      });
    },
    removeBookmark: function () {
      this.$emit("remove", this.mark.url);
    },
    openBookmark: function () {
      try {
        window.open(this.mark.url, "_blank");
      } catch (e) {
        this.showPopup = true;
        this.popupText = "The following URLs cannot be opened from script due to limitation of webextension: 'chrome: URLs', 'javascript: URLs', 'data: URLs', 'file: URLs'";
      }
    }
  },
  template: `
  <div class="mark-wrapper">
    <div class="popup-text" v-if="showPopup" @click="hidePop">
      <div ref="popupText">{{ popupText }}</div>
    </div>
    <div class="a-mark">
      <img class="mark-favicon" :src="mark.favIconUrl" v-if="mark.favIconUrl">
      <div class="mark-desc">
        <div class="mark-title" :title="mark.title" @click="popText">{{ mark.title }}</div>
        <div class="mark-url" :title="mark.url" @click="popText">{{ mark.url }}</div>
        <div class="mark-actions">
          <div v-if="actions.includes('+')" class="mark-action fa fa-plus" title="bookmark this" @click="addBookmark"></div>
          <div v-if="actions.includes('-')" class="mark-action fa fa-minus" title="remove from bookmarks" @click="removeBookmark"></div>
          <div v-if="actions.includes('o')" class="mark-action fa fa-external-link-square" title="open link" @click="openBookmark"></div>
          <div v-if="actions.includes('e')" class="mark-action fa fa-pencil-square" title="edit"></div>
        </div>
      </div>
    </div>
  </div>
  `
});

Vue.component("sort-by", {
  props: ["sortFeature", "sortOrder"],
  computed: {
    sortFeatureDisplay: function() {
      return sortFeatureAll[this.sortFeature];
    },
    sortOrderButton: function () {
      return {
        fa: true,
        "fa-sort-alpha-desc": this.sortFeature != 3 && this.sortOrder,
        "fa-sort-alpha-asc": this.sortFeature != 3 && !this.sortOrder,
        "fa-sort-numeric-desc": this.sortFeature == 3 && this.sortOrder,
        "fa-sort-numeric-asc": this.sortFeature == 3 && !this.sortOrder
      }
    }
  },
  methods: {
    changeSortFeature: function () {
      this.$emit("changesortfeature");
    },
    changeSortOrder: function () {
      this.$emit("changesortorder");
    }
  },
  template: `
  <div id="sort-by">
    Sort by:
    <div class="hsep"></div>
    <div id="sort-feature" @click="changeSortFeature">{{ sortFeatureDisplay }}</div>
    <div class="hsep"></div>
    <div id="sort-order" :class="sortOrderButton" @click="changeSortOrder"></div>
  </div>
  `
});

Vue.component("content-list", {
  props: ["sortFeature", "sortOrder", "fullList"],
  computed: {
    rearrangedList: function() {
      let sortFeature = sortFeatureAllKeys[this.sortFeature];
      let sections = this.fullList.map(x => {
        if (sortFeature == "category") return x[sortFeature];
        else if (sortFeature == "title") return x[sortFeature].length > 0 ? x[sortFeature][0].toUpperCase() : "";
        else if (sortFeature == "url") {
          let startAt = x[sortFeature].indexOf("://");
          if (startAt > -1) startAt += 3;
          else startAt = 0;
          return x[sortFeature][startAt].toUpperCase();
        } else if (sortFeature == "savedDate") return x[sortFeature].slice(0,10);
      });
      sections = sections.filter((s,i,a) => a.indexOf(s) == i);
      let newList = this.fullList.map(x => Object.assign({}, x));
      newList.sort((a,b) => {
        let secondarySortFeature = sortFeature == "category" ? "title" : sortFeature;
        let result = a[secondarySortFeature].localeCompare(b[secondarySortFeature]);
        return this.sortOrder ? -1*result : result;
      });

      sections = sections.map(x => {
        return {
          sectionName: x,
          bookmarks: newList.filter(y => {
            let compareString;
            if (sortFeature == "category") {
              compareString = y[sortFeature];
            } else if (sortFeature == "title") {
              compareString = y[sortFeature][0].toUpperCase();
            } else if (sortFeature == "url") {
              let startAt = y[sortFeature].indexOf("://");
              if (startAt > -1) startAt += 3;
              else startAt = 0;
              compareString = y[sortFeature][startAt].toUpperCase();
            } else if ("savedDate") {
              compareString = y[sortFeature].slice(0,10);
            }
            return compareString == x;
          })
        };
      });
      sections.sort((a,b) => {
        let result = a.sectionName.localeCompare(b.sectionName);
        return this.sortOrder ? -1*result : result;
      })
      return sections;
    },
    noSection: function () {
      let sortFeature = sortFeatureAllKeys[this.sortFeature];
      if (sortFeature == "category") return "Uncategorised";
      else if (sortFeature == "title") return "No Name";
    }
  },
  methods: {
    removeBookmark: function (mark) {
      this.$emit("remove", mark.url);
    }
  },
  template: `
  <div>
    <a-mark v-if="rearrangedList.length == 0"
      :mark="{ favIconUrl: 'icons/icon.png', title: 'Bookmarks are displayed here', url: 'together with their URL' }"
      actions="">
    </a-mark>
    <template v-for="section in rearrangedList">
      <div class="subheadline">{{ section.sectionName ? section.sectionName : noSection }}</div>
      <a-mark v-for="x in section.bookmarks" :mark="x" actions="-oe" @remove="removeBookmark(x)"></a-mark>
    </template>
  </div>
  `
});

new Vue({
  el: "#app",
  data: {
    sortFeature: 0,
    sortOrder: true,
    currentTab: {},
    bookmarks: []
  },
  computed: {
    currentTabAction: function () {
      if (this.bookmarks.findIndex(bm => bm.url == this.currentTab.url) == -1) return "+";
      else return "-";
    }
  },
  methods: {
    addBookmark: function (bookmark) {
      dataPort.postMessage({
        add: bookmark
      });
    },
    removeBookmark: function (url) {
      dataPort.postMessage({
        remove: url
      });
    },
    changeSortFeature: function () {
      this.sortFeature = ( this.sortFeature+1 ) % sortFeatureAll.length;
      dataPort.postMessage({ setSortFeature: this.sortFeature });
    },
    changeSortOrder: function () {
      this.sortOrder = !this.sortOrder;
      dataPort.postMessage({ setSortOrder: this.sortOrder });
    }
  },
  created: function () {
    browser.tabs.query({
      currentWindow: true,
      active: true
    }).then(res => {
      this.currentTab = res[0];
    });

    dataPort.onMessage.addListener(m => {
      console.log("From background.js", JSON.parse(JSON.stringify(m)));
      let mKeys = Object.keys(m);
      if (mKeys.includes("bookmarks")) this.bookmarks = m.bookmarks;
      if (mKeys.includes("sortFeature")) this.sortFeature = m.sortFeature;
      if (mKeys.includes("sortOrder")) this.sortOrder = m.sortOrder;
    });

    dataPort.postMessage({});
  }
})
