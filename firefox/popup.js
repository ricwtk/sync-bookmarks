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
          <div v-if="actions.includes('+')" class="mark-action fa fa-plus" title="bookmark this"></div>
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
      sortFeatureAll: ["Category", "Title", "URL", "Saved data"],
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
  template: `
  <div id="sort-by">
    Sort by:
    <div class="hsep"></div>
    <div id="sort-feature" @click="sortFeature=(sortFeature+1)%sortFeatureAll.length">{{ sortFeatureDisplay }}</div>
    <div class="hsep"></div>
    <div id="sort-order" :class="sortOrderButton" @click="sortOrder=!sortOrder"></div>
  </div>
  `
});

Vue.component("content-list", {
  props: ["sortFeature", "sortOrder"],
  created: function() {
    console.log(this.sortFeature, this.sortOrder);
  },
  template: `
  <div>{{ sortFeature }}</div>
  <div>{{ sortOrder }}</div>
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
  created: function () {
    browser.tabs.query({
      currentWindow: true,
      active: true
    }).then(res => {
      this.currentTab = res[0];
    });
  }
})
