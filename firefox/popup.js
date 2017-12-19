var dataPort;
dataPort = browser.runtime.connect({ name: "popup-background" });

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
        savedDate: new Date(),
        category: ""
      });
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
          <div v-if="actions.includes('-')" class="mark-action fa fa-minus" title="remove from bookmarks"></div>
          <div v-if="actions.includes('o')" class="mark-action fa fa-external-link-square" title="open link"></div>
          <div v-if="actions.includes('e')" class="mark-action fa fa-pencil-square" title="edit"></div>
        </div>
      </div>
    </div>
  </div>
  `
});

Vue.component("sort-by", {
  data: function () {
    return {
      sortFeatureAll: ["Category", "Title", "URL", "Saved date"],
      sortFeature: 0,
      sortOrder: false
    }
  },
  computed: {
    sortFeatureDisplay: function() {
      return this.sortFeatureAll[this.sortFeature];
    },
    sortOrderButton: function () {
      return {
        fa: true,
        "fa-angle-double-up": this.sortOrder,
        "fa-angle-double-down": !this.sortOrder,
      }
    }
  },
  watch: {
    sortOrder: function () {
      console.log(this.sortOrder);
    }
  },
  methods: {
    update: function (item) {
      if (item == "feature") this.sortFeature = (this.sortFeature + 1) % this.sortFeatureAll.length;
      else this.sortOrder = !this.sortOrder;
      this.$emit("update", {
        sortFeature: this.sortFeature,
        sortOrder: this.sortOrder
      });
    }
  },
  template: `
  <div id="sort-by">
    Sort by:
    <div class="hsep"></div>
    <div id="sort-feature" @click="update('feature')">{{ sortFeatureDisplay }}</div>
    <div class="hsep"></div>
    <div id="sort-order" :class="sortOrderButton" @click="update('order')"></div>
  </div>
  `
});

Vue.component("content-list", {
  props: ["sortFeature", "sortOrder", "fullList"],
  methods: {
    clicktest: function() {
      console.log(this.sortFeature, this.sortOrder, this.fullList);
    }
  },
  template: `
  <div>
    <a-mark v-for="x in fullList" :mark="x" actions="-oe"></a-mark>
  </div>
  `
});

new Vue({
  el: "#app",
  data: {
    sortFeature: "category",
    sortOrder: true,
    currentTab: {},
    bookmarks: []
  },
  methods: {
    addBookmark: function (bookmark) {
      dataPort.postMessage({
        add: bookmark
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
      if (m.bookmarks) this.bookmarks = m.bookmarks;
    });

    dataPort.postMessage({});
  }
})
