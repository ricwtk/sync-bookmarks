var dataPort;
dataPort = chrome.runtime.connect({ name: "popup-background" });
const sortFeatureAll = ["Categories", "Title", "URL", "Saved date"];
const sortFeatureAllKeys = ["categories", "title", "url", "savedDate"];

Vue.component("a-mark", {
  props: ["mark", "actions", "allCat"],
  data: function () {
    return {
      showDetails: false,
      edit: {},
      allowEdit: {
        customTitle: false,
        categories: false,
        description: false
      }
    };
  },
  computed: {
    sortedCat: function () {
      if (this.mark.categories) {
        return Array.from(this.mark.categories).sort((a,b) => a.localeCompare(b));
      } else {
        return [];
      }
    },
    notCat: function () {
      if (this.allCat) {
        return this.allCat.filter(c => !this.mark.categories.includes(c)).sort((a,b) => a.localeCompare(b));
      } else {
        return [];
      }
    }
  },
  created: function () {
    this.edit = {
      customTitle: this.mark.customTitle,
      description: this.mark.description
    }
  },
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
    toggleDetails: function () {
      this.showDetails = !this.showDetails;
    },
    toggleEdit: function (key) {
      this.allowEdit[key] = !this.allowEdit[key];
      if (!this.allowEdit[key]) {
        this.edit[key] = this.mark[key];
      } else {
        Vue.nextTick(() => {
          this.$refs[key.toLowerCase() + "Input"].focus();
        });
      }
    },
    accept: function (key) {
      this.$emit("change"+key.toLowerCase(), { url: this.mark.url, new: this.edit[key] });
      this.allowEdit[key] = !this.allowEdit[key];
    },
    reject: function (key) {
      this.edit[key] = this.mark[key];
      this.allowEdit[key] = !this.allowEdit[key];
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
    addExistingCat: function (el) {
      this.addCat(el.target.dataset.tagname);
    },
  },
  render: function (createElement) {
    const makeMarkPrimaryTitle = () => {
      let children = [];
      if (this.mark.favIconUrl) {
        children.push(createElement("img", {
          attrs: {
            class: "mark-favicon",
            src: this.mark.favIconUrl
          }
        }));
      }
      children.push(createElement(
        "div",
        { class: "mark-desc" },
        [
          createElement(
            "div",
            {
              class: "mark-title",
              title: this.mark.title,
              on: { click: this.clickText }
            },
            this.mark.customTitle ? this.mark.customTitle : this.mark.title
          ),
          createElement(
            "div",
            {
              class: "mark-url",
              title: this.mark.url,
              on: { click: this.clickText }
            },
            this.mark.url
          )
        ]
      ));
      return createElement("div", { class: "mark-primary-title" }, children)
    };

    const makeMarkActions = () => {
      let leftChildren = [];
      if (this.actions.includes("+")) {
        leftChildren.push(createElement("div", { 
          class: "mark-action fa fa-plus",
          title: "bookmark this",
          on: { click: this.addBookmark }
        }));
      }
      if (this.actions.includes("-")) {
        leftChildren.push(createElement(
          "div",
          { 
            class: "mark-action fa fa-minus",
            title: "remove bookmark",
            on: { click: this.removeBookmark }
          }
        ));
      }
      if (this.actions.includes("o")) {
        leftChildren.push(createElement(
          "div",
          { 
            class: "mark-action fa fa-external-link-square",
            title: "open link",
            on: { click: this.openBookmark }
          }
        ));
      }

      let rightChildren = [];
      if (this.actions.includes("e")) {
        leftChildren.push(createElement(
          "div",
          { 
            class: "mark-action fa fa-angle-down",
            title: "show details",
            on: { click: this.toggleDetails }
          }
        ));
      }

      return createElement(
        "div",
        { class: "mark-actions" },
        [
          createElement(
            "div",
            { class: "mark-actions-left" },
            leftChildren
          ),
          createElement(
            "div",
            { class: "mark-actions-right" },
            rightChildren
          ),
        ]
      )
    }

    const makeMarkDetails = () => {
      let children = [];
      // default title
      children.push(createElement("div", {},
        [
          createElement("div", { class: "section-title" }, "Default title"),
          createElement("div", { class: "text-display" }, this.mark.title),
        ]
      ));
      // url
      children.push(createElement("div", {},
        [
          createElement("div", { class: "section-title" }, "URL"),
          createElement("div", { class: "text-display" }, this.mark.url),
        ]
      ));
      // title
      children.push(createElement("div", {},
        [
          createElement("div", { class: "section-title"}, [ 
            "Title", 
            createElement("i", { class: "fa fa-pencil action", on: { click: () => this.toggleEdit("customTitle") } }) 
          ]),
          this.allowEdit.customTitle 
            ? 
            createElement("div", { class: "text-edit"}, [
              createElement("input", { 
                attrs: { type: "text" },
                ref: "customtitleInput",
                domProps: { value: this.edit.customTitle },
                on: {
                  keyup: (ev) => {
                    if (ev.keyCode == 27) {
                      this.reject("customTitle");
                      ev.stopPropagation();
                    } else if (ev.keyCode == 13) {
                      this.accept("customTitle");
                      ev.stopPropagation();
                    }
                  },
                  input: (ev) => {
                    this.edit.customTitle = ev.target.value;
                  }
                }
              }),
              createElement("i", {
                class:"fa fa-check action",
                on: { click: () => this.accept("customTitle") }
              }),
              createElement("i", {
                class:"fa fa-times action",
                on: { click: () => this.reject("customTitle") }
              })
            ])
            :
            createElement("div", { class: "text-display"}, this.mark.customTitle)
        ]
      ));
      //categories
      children.push(createElement("div", {}, 
        [
          createElement("div", { class: "section-title" }, [
            "Categories",
            createElement("i", { 
              class: "fa fa-pencil action",
              on: { click: () => this.toggleEdit("categories") }
            })
          ]),
          createElement("div", { class: "cat-display" }, 
            this.sortedCat.map((el) => createElement("span", {
              class: {
                tag: true,
                edit: this.allowEdit.categories
              }
            }, [
              el,
              this.allowEdit.categories ?
              createElement("i", {
                attrs: {
                  class: "fa fa-times-circle",
                  "data-tagname": el
                },
                on: { click: this.removeCat } 
              }) : null
            ]))
          ),
          this.allowEdit.categories ? 
          createElement("input", {
            attrs: {
              type: "text",
              placeholder: "Use comma (,) or 'Enter' to end or save a category."
            },
            ref: "categoriesInput",
            on: {
              input: this.monitorInput,
              change: this.enterCat,
              keyup: (ev) => {
                if (ev.keyCode == 27) {
                  this.toggleEdit("categories");
                  ev.stopPropagation();
                }
              }
            }
          }) : null,
          this.allowEdit.categories ?
          createElement("div", { class: "cat-display" },
            this.notCat.map(el => createElement("span", { class: "tag edit" }, [
              el,
              createElement("i", {
                attrs: {
                  class: "fa fa-plus-circle",
                  "data-tagname": el
                },
                on: { click: this.addExistingCat }
              })
            ]))
          ) : null
        ]
      ))
      // description
      children.push(createElement("div", {},
        [
          createElement("div", { class: "section-title"}, [ 
            "Description", 
            createElement("i", { 
              class: "fa fa-pencil action", 
              on: { click: () => this.toggleEdit("description") } }) 
          ]),
          this.allowEdit.description 
            ? 
            createElement("div", { class: "desc-edit"}, [
              createElement("textarea", { 
                ref: "descriptionInput",
                domProps: { value: this.edit.description },
                on: {
                  keyup: (ev) => {
                    if (ev.keyCode == 27) {
                      this.reject("description");
                      ev.stopPropagation();
                    }
                  },
                  input: (ev) => {
                    this.edit.description = ev.target.value;
                  }
                }
              }),
              createElement("i", {
                class:"fa fa-check action",
                on: { click: () => this.accept("description") }
              }),
              createElement("i", {
                class:"fa fa-times action",
                on: { click: () => this.reject("description") }
              })
            ])
            :
            createElement("div", { class: "desc-display"}, this.mark.description)
        ]
      ));

      return createElement("div", { class: "mark-details" }, children);
    }
    
    return createElement("div", { class: "mark-wrapper" }, [
      createElement("div", { class: "a-mark" }, [
        makeMarkPrimaryTitle(),
        makeMarkActions(),
        this.showDetails && this.actions.includes('e') ? makeMarkDetails() : null
      ])
    ])
  },
  // template: `
  // <div class="mark-wrapper">
  //   <div class="a-mark">
  //     <div class="mark-primary-title">
  //       <img class="mark-favicon" :src="mark.favIconUrl" v-if="mark.favIconUrl">
  //       <div class="mark-desc">
  //         <div class="mark-title" :title="mark.title" @click="clickText">{{ mark.customTitle ? mark.customTitle : mark.title }}</div>
  //         <div class="mark-url" :title="mark.url" @click="clickText">{{ mark.url }}</div>
  //       </div>
  //     </div>
  //     <div class="mark-actions">
  //       <div class="mark-actions-left">
  //         <div v-if="actions.includes('+')" class="mark-action fa fa-plus" title="bookmark this" @click="addBookmark"></div>
  //         <div v-if="actions.includes('-')" class="mark-action fa fa-minus" title="remove bookmark" @click="removeBookmark"></div>
  //         <div v-if="actions.includes('o')" class="mark-action fa fa-external-link-square" title="open link" @click="openBookmark"></div>
  //       </div>
  //       <div class="mark-actions-right">
  //         <div v-if="actions.includes('e')" class="mark-action fa fa-angle-down" title="show details" @click="toggleDetails"></div>
  //       </div>
  //     </div>
  //     <div class="mark-details" v-if="showDetails && actions.includes('e')">
  //       <div>
  //         <div class="section-title">Default title</div>
  //         <div class="text-display">&#8203;{{ mark.title }}</div>
  //       </div>
  //       <div>
  //         <div class="section-title">URL</div>
  //         <div class="text-display">&#8203;{{ mark.url }}</div>
  //       </div>
  //       <div>
  //         <div class="section-title">Title<i class="fa fa-pencil action" @click="toggleEdit('customTitle')"></i></div>
  //         <div class="text-display" v-if="!allowEdit.customTitle">&#8203;{{ mark.customTitle }}</div>
  //         <div class="text-edit" v-else>
  //           <input type="text" v-model="edit.customTitle" @keyup.esc.stop="reject('customTitle')" @keyup.enter.stop="accept('customTitle')" ref="customtitleInput">
  //           <i class="fa fa-check action" @click="accept('customTitle')"></i>
  //           <i class="fa fa-times action" @click="reject('customTitle')"></i>
  //         </div>
  //       </div>
  //       <div>
  //         <div class="section-title">Categories <i class="fa fa-pencil action" @click="toggleEdit('categories')"></i></div>
  //         <div class="cat-display">
  //           &#8203;
  //           <span v-for="cat in sortedCat" :class="{ tag: true, edit: allowEdit.categories }">
  //             {{ cat }}
  //             <i v-if="allowEdit.categories" class="fa fa-times-circle" :data-tagname="cat" @click="removeCat"></i>
  //           </span>
  //         </div>
  //         <input v-if="allowEdit.categories" type="text" placeholder="Use comma (,) or 'Enter' to end or save a category." @input="monitorInput" @change="enterCat" @keyup.esc.stop="toggleEdit('categories')" ref="categoriesInput">
  //         <div v-if="allowEdit.categories" class="cat-display">
  //           <span v-for="cat in notCat" class="tag edit">
  //             {{ cat }}
  //             <i class="fa fa-plus-circle" :data-tagname="cat" @click="addExistingCat"></i>
  //           </span>
  //         </div>
  //       </div>
  //       <div>
  //         <div class="section-title">Description <i class="fa fa-pencil action" @click="toggleEdit('description')"></i></div>
  //         <div class="desc-display" v-if="!allowEdit.description">{{ mark.description }}</div>
  //         <div class="desc-edit" v-else>
  //           <textarea v-model="edit.description" @keyup.esc.stop="reject('description')" ref="descriptionInput"></textarea>
  //           <i class="fa fa-check action" @click="accept('description')"></i>
  //           <i class="fa fa-times action" @click="reject('description')"></i>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // </div>
  // `
});

Vue.component("sort-by", {
  props: ["sortFeature", "sortOrder", "contentLoading"],
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
    },
    refreshContent: function () {
      this.$emit("refreshcontent");
    }
  },
  render: function (createElement) {
    return createElement("div", { attrs: { id: "sort-by" } }, [
      createElement("div", { 
        class: {
          fa: true,
          "fa-refresh": true,
          "fa-spin": this.contentLoading
        }, 
        on: { click: this.refreshContent } 
      }),
      createElement("div", { class: "flex-fill" }),
      "Sort by:",
      createElement("div", { attrs: { class: "hsep" } }),
      createElement("div", { 
        attrs: { id: "sort-feature" },
        on: { click: this.changeSortFeature }
      }, this.sortFeatureDisplay),
      createElement("div", { attrs: { class: "hsep" } }),
      createElement("div", { 
        attrs: { id: "sort-order" },
        class: this.sortOrderButton,
        on: { click: this.changeSortOrder }
      })
    ])
  },
  // template: `
  // <div id="sort-by">
  //   <div class="fa fa-refresh"></div>
  //   <div class="flex-fill"></div>
  //   Sort by:
  //   <div class="hsep"></div>
  //   <div id="sort-feature" @click="changeSortFeature">{{ sortFeatureDisplay }}</div>
  //   <div class="hsep"></div>
  //   <div id="sort-order" :class="sortOrderButton" @click="changeSortOrder"></div>
  // </div>
  // `
});

Vue.component("content-list", {
  props: ["sortFeature", "sortOrder", "fullList"],
  computed: {
    rearrangedList: function() {
      let sortFeature = sortFeatureAllKeys[this.sortFeature];
      if (this.fullList.length == 0) return [];
      let sections = this.fullList.map(x => {
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
        let result = a.sectionName.localeCompare(b.sectionName);
        return this.sortOrder ? -1*result : result;
      })
      return sections;
    },
    noSection: function () {
      let sortFeature = sortFeatureAllKeys[this.sortFeature];
      if (sortFeature == "categories") return "Uncategorised";
      else if (sortFeature == "title") return "No Name";
    },
    allCat: function () {
      return Array.prototype.concat(...this.fullList.map(bm => bm.categories)).filter((s,i,a) => a.indexOf(s) == i).sort((a,b) => a.localeCompare(b));
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
    changeCustomTitle: function (m) {
      this.$emit("changecustomtitle", m);
    },
    changeDescription: function (m) {
      this.$emit("changedescription", m);
    },
    addCat: function (m) {
      this.$emit("addcat", m);
    },
    removeCat: function (m) {
      this.$emit("removecat", m);
    }
  },
  render:  function (createElement) {
    let children = [];
    if (this.rearrangedList.length == 0) {
      children.push(createElement("a-mark", {
        props: {
          mark: {
            favIconUrl: "icons/icon.png",
            title: "Bookmarks are displayed here",
            url: "together with their URL"
          },
          actions: ""
        }
      }))
    } else {
      this.rearrangedList.forEach((section) => {
        children.push(createElement("div", { class: "subheadline" }, section.sectionName ? section.sectionName : this.noSection))
        children.push(...section.bookmarks.map((x) => createElement("a-mark", {
          props: {
            mark: x,
            actions: "-oe",
            "all-cat": this.allCat,
          },
          on: {
            remove: () => this.removeBookmark(x),
            clicktext: this.clickText,
            error: this.showError,
            changecustomtitle: this.changeCustomTitle,
            changedescription: this.changeDescription,
            addcat: this.addCat,
            removecat: this.removeCat
          }
        })));
      })
    }
    return createElement("div", {}, children);
  },
  // template: `
  // <div>
  //   <a-mark v-if="rearrangedList.length == 0"
  //     :mark="{ favIconUrl: 'icons/icon.png', title: 'Bookmarks are displayed here', url: 'together with their URL' }"
  //     actions="">
  //   </a-mark>
  //   <template v-for="section in rearrangedList">
  //     <div class="subheadline">{{ section.sectionName ? section.sectionName : noSection }}</div>
  //     <a-mark v-for="x in section.bookmarks" :mark="x" actions="-oe"
  //       :all-cat="allCat"
  //       @remove="removeBookmark(x)"
  //       @clicktext="clickText"
  //       @error="showError"
  //       @changecustomtitle="changeCustomTitle"
  //       @changedescription="changeDescription"
  //       @addcat="addCat"
  //       @removecat="removeCat">
  //     </a-mark>
  //   </template>
  // </div>
  // `
});

Vue.component("misc-section", {
  props: ["useLocal", "remoteAccount"],
  methods: {
    showHelp: function () {
      window.open("https://ricwtk.github.io/sync-bookmarks");
    },
    signInOut: function () {
      this.$emit("signinout", !this.useLocal);
    }
  },
  render: function (createElement) {
    let children = [];
    if (this.useLocal) {
      children.push(createElement("div", { class: "sign-in-status" }, "Saved on local machine"));
    } else {
      children.push(createElement("div", { class: "sign-in-status" }, [
        "Signed in as ",
        createElement("b", this.remoteAccount)
      ]));
    }

    children.push(createElement("div", { class: "buttons-section" }, [
      createElement("div", {
        class: {
          fa: true,
          "fa-google": this.useLocal,
          "fa-sign-out": !this.useLocal
        },
        title: this.useLocal ? "Sign in to Google" : "Save on local machine",
        on: { click: this.signInOut }
      }),
      createElement("div", {
        class: "fa fa-home",
        title: "Homepage",
        on: { click: this.showHelp }
      })
    ]));

    return createElement("div", { class: "misc-section" }, children);
  },
  // template: `
  // <div class="misc-section">
  //   <div class="sign-in-status">
  //     <template v-if="useLocal">
  //       Saved on local machine
  //     </template>
  //     <template v-else>
  //       Signed in as <b>{{ remoteAccount }}</b>
  //     </template>
  //   </div>
  //   <div class="buttons-section">
  //     <div :class="{ fa: true, 'fa-google': useLocal, 'fa-sign-out': !useLocal }"
  //       :title="useLocal ? 'Sign in to Google' : 'Save on local machine'"
  //       @click="signInOut">
  //     </div>
  //     <div class="fa fa-home" title="Homepage"
  //       @click="showHelp"></div>
  //   </div>
  // </div>
  // `
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
    useLocal: true,
    remoteAccount: "",
    contentLoading: false
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
      this.bookmarks.push(bookmark);
      dataPort.postMessage({
        add: bookmark
      });
    },
    removeBookmark: function (url) {
      this.bookmarks.splice(this.bookmarks.findIndex(bm => bm.url == url), 1)
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
    refreshContent: function () {
      this.contentLoading = true;
      dataPort.postMessage({ refresh: true });
    },
    popText: function (text) {
      this.showPopup = true;
      this.popupText = text;
    },
    hidePop: function (el) {
      if (el.target != this.$refs.popupText) this.showPopup = false;
    },
    addCat: function (param) {
      let tbm = this.bookmarks.find(bm => bm.url == param.url);
      tbm.categories.push(param.newCat);
      tbm.categories = tbm.categories.filter((s,i,a) => a.indexOf(s) == i);
      dataPort.postMessage({
        addCat: param
      });
    },
    removeCat: function (param) {
      let tbm = this.bookmarks.find(bm => bm.url == param.url);
      let removeIdx = tbm.categories.indexOf(param.removeCat);
      if (removeIdx > -1) tbm.categories.splice(removeIdx, 1);
      dataPort.postMessage({
        removeCat: param
      });
    },
    changeCustomTitle: function (param) {
      let tbm = this.bookmarks.find(bm => bm.url == param.url);
      tbm.customTitle = param.new;
      dataPort.postMessage({
        changeCustomTitle: param
      });
    },
    changeDescription: function (param) {
      let tbm = this.bookmarks.find(bm => bm.url == param.url);
      tbm.description = param.new;
      dataPort.postMessage({
        changeDescription: param
      });
    },
    signInOut: function (param) {
      dataPort.postMessage({
        setLocal: param
      })
    }
  },
  created: function () {
    chrome.tabs.query({
      currentWindow: true,
      active: true
    }, res => {
      this.currentTab = res[0];
    });

    dataPort.onMessage.addListener(m => {
      console.log("From background.js", JSON.parse(JSON.stringify(m)));
      let mKeys = Object.keys(m);
      if (mKeys.includes("bookmarks")) this.bookmarks = m.bookmarks;
      if (mKeys.includes("sortFeature")) this.sortFeature = m.sortFeature;
      if (mKeys.includes("sortOrder")) this.sortOrder = m.sortOrder;
      if (mKeys.includes("useLocal")) this.useLocal = m.useLocal;
      if (mKeys.includes("remoteAccount")) this.remoteAccount = m.remoteAccount;
      if (mKeys.includes("refresh")) setTimeout(() => { this.contentLoading = false; }, 1000);
    });

    // dataPort.postMessage({});
    // dataPort.postMessage({ refresh: true });
    dataPort.postMessage({ init: true });
  },
  render: function (createElement) {
    return createElement("div", {}, [
      createElement("a-mark", {
        props: {
          mark: this.currentTab,
          actions: this.currentTabAction,
        },
        on: {
          add: this.addBookmark,
          remove: this.removeBookmark,
          clicktext: this.popText
        }
      }),
      createElement("div", { class: "headline" }, [
        createElement("i", { class: "fa fa-bookmark" }),
        createElement("div", { class: "hsep" }),
        "Bookmarks"
      ]),
      createElement("sort-by", {
        props: {
          "sort-feature": this.sortFeature,
          "sort-order": this.sortOrder,
          "content-loading": this.contentLoading
        },
        on: {
          changesortfeature: this.changeSortFeature,
          changesortorder: this.changeSortOrder,
          refreshcontent: this.refreshContent
        }
      }),
      createElement("content-list", {
        props: {
          "sort-feature": this.sortFeature,
          "sort-order": this.sortOrder,
          "full-list": this.bookmarks,
        },
        on: {
          remove: this.removeBookmark,
          clicktext: this.popText,
          error: this.popText,
          changecustomtitle: this.changeCustomTitle,
          changedescription: this.changeDescription,
          addcat: this.addCat,
          removecat: this.removeCat
        }
      }),
      this.showPopup ? createElement("div", {
        class: "popup-text",
        on: { click: this.hidePop }
      }, [
        createElement("div", { ref: "popupText" }, this.popupText)
      ]) : null,
      createElement("misc-section", {
        props: {
          "use-local": this.useLocal,
          "remote-account": this.remoteAccount,
        },
        on: { signinout: this.signInOut }
      })
    ])
  }
})
