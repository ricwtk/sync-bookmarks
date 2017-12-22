var dataPort;
dataPort = browser.runtime.connect({ name: "popup-background" });
const sortFeatureAll = ["Categories", "Title", "URL", "Saved date"];
const sortFeatureAllKeys = ["categories", "title", "url", "savedDate"];

Vue.component("a-mark", {
  props: ["mark", "actions"],
  methods: {
    clickText: function (el) {
      this.$emit("clicktext", el.target.textContent);
    },
    addBookmark: function () {
      this.$emit("add", {
        favIconUrl: this.mark.favIconUrl,
        title: this.mark.title,
        url: this.mark.url,
        savedDate: new Date().toISOString(),
        categories: [],
        customTitle: "",
        description: ""
      });
    },
    removeBookmark: function () {
      this.$emit("remove", this.mark.url);
    },
    openBookmark: function () {
      try {
        window.open(this.mark.url, "_blank");
      } catch (e) {
        this.$emit("error",
          `The following URLs cannot be opened from script due to limitation of
           webextension:
           <span class="tag">about: URLs</span>
           <span class="tag">chrome: URLs</span>
           <span class="tag">javascript: URLs</span>
           <span class="tag">data: URLs</span>
           <span class="tag">file: URLs</span>`);
      }
    },
    editBookmark: function () {
      this.$emit("edit", this.mark);
    }
  },
  template: `
  <div class="mark-wrapper">
    <div class="a-mark">
      <img class="mark-favicon" :src="mark.favIconUrl" v-if="mark.favIconUrl">
      <div class="mark-desc">
        <div class="mark-title" :title="mark.title" @click="clickText">{{ mark.title }}</div>
        <div class="mark-url" :title="mark.url" @click="clickText">{{ mark.url }}</div>
        <div class="mark-actions">
          <div v-if="actions.includes('+')" class="mark-action fa fa-plus" title="bookmark this" @click="addBookmark"></div>
          <div v-if="actions.includes('-')" class="mark-action fa fa-minus" title="remove bookmark" @click="removeBookmark"></div>
          <div v-if="actions.includes('o')" class="mark-action fa fa-external-link-square" title="open link" @click="openBookmark"></div>
          <div v-if="actions.includes('e')" class="mark-action fa fa-pencil-square" title="edit" @click="editBookmark"></div>
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
      if (this.fullList.length == 0) return [];
      let sections = this.fullList.map(x => {
        if (sortFeature == "categories") return x[sortFeature];
        else if (sortFeature == "title") return x[sortFeature].length > 0 ? x[sortFeature][0].toUpperCase() : "";
        else if (sortFeature == "url") {
          let startAt = x[sortFeature].indexOf("://");
          if (startAt > -1) startAt += 3;
          else startAt = 0;
          return x[sortFeature][startAt].toUpperCase();
        } else if (sortFeature == "savedDate") return x[sortFeature].slice(0,10);
      });
      if (sortFeature == "categories") sections = Array.prototype.concat(...sections, "");
      sections = sections.filter((s,i,a) => a.indexOf(s) == i);
      let newList = this.fullList.map(x => Object.assign({}, x));
      newList.sort((a,b) => {
        let secondarySortFeature = sortFeature == "categories" ? "title" : sortFeature;
        let result = a[secondarySortFeature].localeCompare(b[secondarySortFeature]);
        return this.sortOrder ? -1*result : result;
      });

      sections = sections.map(x => {
        return {
          sectionName: x,
          bookmarks: newList.filter(y => {
            let compareString;
            if (sortFeature == "categories") {
              if (x) return y[sortFeature].includes(x);
              else return y[sortFeature].length == 0;
            } else if (sortFeature == "title") {
              return y[sortFeature][0].toUpperCase() == x;
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
        let result = a.sectionName.localeCompare(b.sectionName);
        return this.sortOrder ? -1*result : result;
      })
      return sections;
    },
    noSection: function () {
      let sortFeature = sortFeatureAllKeys[this.sortFeature];
      if (sortFeature == "categories") return "Uncategorised";
      else if (sortFeature == "title") return "No Name";
    }
  },
  methods: {
    removeBookmark: function (mark) {
      this.$emit("remove", mark.url);
    },
    clickText: function (text) {
      this.$emit("clicktext", text);
    },
    showError: function (err) {
      this.$emit("error", err);
    },
    clickEdit: function (mark) {
      this.$emit("edit", mark);
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
      <a-mark v-for="x in section.bookmarks" :mark="x" actions="-oe"
        @remove="removeBookmark(x)"
        @clicktext="clickText"
        @error="showError"
        @edit="clickEdit">
      </a-mark>
    </template>
  </div>
  `
});

Vue.component("bookmark-edit", {
  props: ["mark", "allCat"],
  computed: {
    notCat: function () {
      return this.allCat.filter(c => !this.mark.categories.includes(c));
    }
  },
  methods: {
    hide: function (el) {
      if (el.target == this.$el) this.$emit("hide");
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
      this.$emit("addcat", { url: this.mark.url, newCat: newCat });
      this.mark.categories.push(newCat);
      this.mark.categories = this.mark.categories.filter((s,i,a) => a.indexOf(s) == i);
    },
    removeCat: function (el) {
      this.$emit("removecat", { url: this.mark.url, removeCat: el.target.dataset.tagname });
      let removeIdx = this.mark.categories.indexOf(el.target.dataset.tagname);
      if (removeIdx > -1) this.mark.categories.splice(removeIdx, 1);
    },
    addOldCat: function (el) {
      this.addCat(el.target.dataset.tagname);
    }
  },
  template: `
    <div class="bm-edit-wrapper" @click="hide">
      <div class="bm-edit">
        <div class="a-mark">
          <img class="mark-favicon" :src="mark.favIconUrl" v-if="mark.favIconUrl">
          <div class="mark-desc">
            <div class="mark-title" :title="mark.title">{{ mark.title }}</div>
            <div class="mark-url" :title="mark.url">{{ mark.url }}</div>
          </div>
        </div>
        <div class="title-edit">
          Title: <input type="text" v-model="mark.customTitle">
        </div>
        <div class="cat-edit">
          <div class="cat-display">
            Categories:
            <span v-for="cat in mark.categories" class="tag">
              {{ cat }}
              <span class="tag-sep"></span>
              <i class="tag-action fa fa-times" @click="removeCat" :data-tagname="cat"></i>
            </span>
          </div>
          <div class="cat-input"><i class="fa fa-plus-circle"></i><input type="text" @input="monitorInput" @change="enterCat"></div>
          <div class="more-cat-display">
            <span v-for="cat in notCat" class="tag">
              {{ cat }}
              <span class="tag-sep"></span>
              <i class="tag-action fa fa-plus" @click="addOldCat" :data-tagname="cat"></i>
            </span>
          </div>
        </div>
        <div class="desc-edit">
          Description:
          <textarea v-model="mark.description" rows="5">
        </div>
      </div>
    </div>
  `
})

new Vue({
  el: "#app",
  data: {
    sortFeature: 0,
    sortOrder: true,
    currentTab: {},
    bookmarks: [],
    showPopup: false,
    popupText: "",
    showEdit: false,
    bookmarkToEdit: {}
  },
  computed: {
    currentTabAction: function () {
      if (this.bookmarks.findIndex(bm => bm.url == this.currentTab.url) == -1) return "+";
      else return "-";
    },
    allCat: function () {
      return Array.prototype.concat(...this.bookmarks.map(bm => bm.categories)).filter((s,i,a) => a.indexOf(s) == i).sort((a,b) => a.localeCompare(b));
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
    },
    popText: function (text) {
      this.showPopup = true;
      this.popupText = text;
    },
    hidePop: function (el) {
      if (el.target != this.$refs.popupText) this.showPopup = false;
    },
    popEdit: function (mark) {
      this.showEdit = true;
      this.bookmarkToEdit = mark;
    },
    addCat: function (param) {
      dataPort.postMessage({
        addCat: param
      });
    },
    removeCat: function (param) {
      dataPort.postMessage({
        removeCat: param
      });
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
