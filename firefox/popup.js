// ---------- pop text ----------
function popText(innerNode) {
  var el = document.getElementById("popup-text");
  while (el.lastChild) el.removeChild(el.lastChild);
  el.appendChild(innerNode);
  el.parentNode.classList.remove("hide");
}

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
  }));
}

// ---------- create simple ----------
function createSimple(param) {
  // param.{class title click}
  var el = document.createElement("div");
  el.classList.add(...param.class);
  el.title = param.title;
  el.addEventListener("click", param.click);
  return el;
}

// ---------- create a mark ----------
function createAMark(param) {
  // param.{mark actions allCat add remove}
  var base = document.createElement("div");
  base.classList.add("mark-wrapper");
  base.appendChild(document.createElement("div"));
  base.lastChild.classList.add("a-mark");
  // <div class="mark-wrapper">
  //   <div class="a-mark">

  var title = document.createElement("div");
  title.classList.add("mark-primary-title");
  if (param.mark.favIconUrl) {
    title.appendChild(document.createElement("img"));
    title.lastChild.classList.add("mark-favicon");
    title.lastChild.src = param.mark.favIconUrl;
  }
  title.appendChild(document.createElement("div"));
  title.lastChild.classList.add("mark-desc");
  title.lastChild.appendChild(document.createElement("div"));
  title.lastChild.lastChild.classList.add("mark-title");
  title.lastChild.lastChild.title = param.mark.customTitle ? param.mark.customTitle : param.mark.title;
  title.lastChild.lastChild.innerText = param.mark.customTitle ? param.mark.customTitle : param.mark.title;
  title.lastChild.lastChild.addEventListener("click", (ev) => { popText( document.createTextNode(ev.target.textContent) ) });
  title.lastChild.appendChild(document.createElement("div"));
  title.lastChild.lastChild.classList.add("mark-url");
  title.lastChild.lastChild.title = param.mark.url;
  title.lastChild.lastChild.innerText = param.mark.url;
  title.lastChild.lastChild.addEventListener("click", (ev) => { popText( document.createTextNode(ev.target.textContent) ) });
  base.lastChild.appendChild(title);
  //     <div class="mark-primary-title">
  //       <img class="mark-favicon" :src="mark.favIconUrl" v-if="mark.favIconUrl">
  //       <div class="mark-desc">
  //         <div class="mark-title" :title="mark.title" @click="clickText">{{ mark.customTitle ? mark.customTitle : mark.title }}</div>
  //         <div class="mark-url" :title="mark.url" @click="clickText">{{ mark.url }}</div>
  //       </div>
  //     </div>

  var markActions = document.createElement("div");
  markActions.classList.add("mark-actions");
  markActions.appendChild(document.createElement("div"));
  markActions.lastChild.classList.add("mark-actions-left");
  
  if (param.actions.includes("+")) 
    markActions.lastChild.appendChild(createSimple({
      class: ["mark-action", "fa", "fa-plus"], 
      title: "bookmark this", 
      click: param.add
    }));
  if (param.actions.includes("-"))
    markActions.lastChild.appendChild(createSimple({
      class: ["mark-action", "fa", "fa-minus"], 
      title: "remove bookmark", 
      click: param.remove
    }));
  if (param.actions.includes("o"))
    markActions.lastChild.appendChild(createSimple({
      class: ["mark-action", "fa", "fa-external-link-square"], 
      title: "open link", 
      click: () => {
        try {
          window.open(param.mark.url, "_blank");
        } catch (e) {
          var errorMsg = document.createElement("span");
          errorMsg.appendChild(document.createTextNode("The following URLs cannot be opened from script due to limitation of webextension:"));
          errorMsg.appendChild(document.createElement("br"));
          var tags = ["about: URLs", "chrome: URLs", "javascript: URLs", "data: URLs", "file: URLs"];
          for (var i = 0; i < tags.length; i++) {
            errorMsg.appendChild(document.createElement("span"));
            errorMsg.lastChild.classList.add("tag");
            errorMsg.lastChild.innerText = tags[i];
          }
          popText(errorMsg);
        }
      }
    }));
  markActions.appendChild(document.createElement("div"));
  markActions.lastChild.classList.add("mark-actions-right");
  if (param.actions.includes("e"))
    markActions.lastChild.appendChild(createSimple({
      class: ["mark-action", "fa", "fa-angle-down"], 
      title: "show details", 
      click: () => {
        base.getElementsByClassName("mark-details")[0].classList.toggle("hide");
      } 
    }));
  base.lastChild.appendChild(markActions);
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

  if (param.actions.includes("e")) {
    var markDetails = document.createElement("div");
    markDetails.classList.add("mark-details", "hide");
    //     <div class="mark-details" v-if="showDetails && actions.includes('e')">
    markDetails.appendChild(document.createElement("div"));
    markDetails.lastChild.appendChild(document.createElement("div"));
    markDetails.lastChild.lastChild.classList.add("section-title");
    markDetails.lastChild.lastChild.innerText = "Default title";
    markDetails.lastChild.appendChild(document.createElement("div"));
    markDetails.lastChild.lastChild.classList.add("text-display");
    markDetails.lastChild.lastChild.innerText = param.mark.title;
    //       <div>
    //         <div class="section-title">Default title</div>
    //         <div class="text-display">&#8203;{{ mark.title }}</div>
    //       </div>
    markDetails.appendChild(document.createElement("div"));
    markDetails.lastChild.appendChild(document.createElement("div"));
    markDetails.lastChild.lastChild.classList.add("section-title");
    markDetails.lastChild.lastChild.innerText = "URL";
    markDetails.lastChild.appendChild(document.createElement("div"));
    markDetails.lastChild.lastChild.classList.add("text-display");
    markDetails.lastChild.lastChild.innerText = param.mark.url;
    //       <div>
    //         <div class="section-title">URL</div>
    //         <div class="text-display">&#8203;{{ mark.url }}</div>
    //       </div>
    markDetails.appendChild(document.createElement("div"));
    markDetails.lastChild.appendChild(document.createElement("div"));
    markDetails.lastChild.lastChild.classList.add("section-title");
    markDetails.lastChild.lastChild.innerText = "Title";
    markDetails.lastChild.lastChild.appendChild(document.createElement("i"));
    markDetails.lastChild.lastChild.lastChild.classList.add("fa", "fa-pencil", "action");
    markDetails.lastChild.lastChild.lastChild.addEventListener("click", () => {
      markDetails.getElementsByClassName("custom-title-display")[0].classList.toggle("hide");
      let edit = markDetails.getElementsByClassName("custom-title-edit")[0];
      edit.getElementsByTagName("input")[0].value = param.mark.customTitle;
      edit.classList.toggle("hide");
    });
    markDetails.lastChild.appendChild(document.createElement("div"));
    markDetails.lastChild.lastChild.classList.add("text-display", "custom-title-display");
    markDetails.lastChild.lastChild.innerText = param.mark.customTitle;
    markDetails.lastChild.appendChild(document.createElement("div"));
    markDetails.lastChild.lastChild.classList.add("text-edit", "custom-title-edit", "hide");
    markDetails.lastChild.lastChild.appendChild(document.createElement("input"));
    markDetails.lastChild.lastChild.lastChild.type = "text";
    markDetails.lastChild.lastChild.appendChild(document.createElement("i"));
    markDetails.lastChild.lastChild.lastChild.classList.add("fa", "fa-check", "action");
    markDetails.lastChild.lastChild.lastChild.addEventListener("click", () => {
      let display = markDetails.getElementsByClassName("custom-title-display")[0];
      display.classList.remove("hide");
      let edit = markDetails.getElementsByClassName("custom-title-edit")[0];
      param.mark.customTitle = edit.getElementsByTagName("input")[0].value;
      edit.classList.add("hide");
      // update in details
      display.innerText = param.mark.customTitle;
      // update in title
      let mainDisplay = title.getElementsByClassName("mark-title")[0];
      mainDisplay.title = param.mark.customTitle ? param.mark.customTitle : param.mark.title;
      mainDisplay.innerText = param.mark.customTitle ? param.mark.customTitle : param.mark.title;
      // send to background.js
      dataPort.postMessage({
        changeCustomTitle: {
          url: param.mark.url,
          new: param.mark.customTitle
        }
      });
    });
    markDetails.lastChild.lastChild.appendChild(document.createElement("i"));
    markDetails.lastChild.lastChild.lastChild.classList.add("fa", "fa-times", "action");
    markDetails.lastChild.lastChild.lastChild.addEventListener("click", () => {
      markDetails.getElementsByClassName("custom-title-display")[0].classList.remove("hide");
      markDetails.getElementsByClassName("custom-title-edit")[0].classList.add("hide");
    });
    //       <div>
    //         <div class="section-title">Title<i class="fa fa-pencil action" @click="toggleEdit('customTitle')"></i></div>
    //         <div class="text-display" v-if="!allowEdit.customTitle">&#8203;{{ mark.customTitle }}</div>
    //         <div class="text-edit" v-else>
    //           <input type="text" v-model="edit.customTitle" @keyup.esc.stop="reject('customTitle')" @keyup.enter.stop="accept('customTitle')" ref="customtitleInput">
    //           <i class="fa fa-check action" @click="accept('customTitle')"></i>
    //           <i class="fa fa-times action" @click="reject('customTitle')"></i>
    //         </div>
    //       </div>
    markDetails.appendChild(document.createElement("div"));
    markDetails.lastChild.appendChild(document.createElement("div"));
    markDetails.lastChild.lastChild.classList.add("section-title");
    markDetails.lastChild.lastChild.innerText = "Categories";
    markDetails.lastChild.lastChild.appendChild(document.createElement("i"));
    markDetails.lastChild.lastChild.lastChild.classList.add("fa", "fa-pencil", "action");
    markDetails.lastChild.lastChild.lastChild.addEventListener("click", () => {
      var fc = markDetails.getElementsByClassName("cat-display")[0];
      var tags = fc.childNodes;
      for (var i = 0; i < tags.length; i++) {
        tags[i].classList.toggle("edit");
        if (tags[i].classList.contains("edit")) {
          tags[i].appendChild(document.createElement("i"));
          tags[i].lastChild.classList.add("fa", "fa-times-circle");
          tags[i].lastChild.addEventListener("click", (ev) => {
            dataPort.postMessage({
              removeCat: {
                url: param.mark.url,
                removeCat: ev.target.previousSibling.textContent
              }
            });
          })
        } else {
          tags[i].removeChild(tags[i].lastChild);
        }
      }
      fc.nextSibling.classList.toggle("hide");
      fc.nextSibling.nextSibling.classList.toggle("hide");
    });
    markDetails.lastChild.appendChild(document.createElement("div"));
    markDetails.lastChild.lastChild.classList.add("cat-display");
    let sortedCat = Array.from(param.mark.categories).sort((a,b) => a.localeCompare(b));
    for (var i=0; i < sortedCat.length; i++) {
      markDetails.lastChild.lastChild.appendChild(document.createElement("span"));
      markDetails.lastChild.lastChild.lastChild.classList.add("tag");
      markDetails.lastChild.lastChild.lastChild.innerText = sortedCat[i];
    }
    markDetails.lastChild.appendChild(document.createElement("input"));
    markDetails.lastChild.lastChild.classList.add("hide");
    markDetails.lastChild.lastChild.type = "text"
    markDetails.lastChild.lastChild.placeholder="Use comma (,) or 'Enter' to end or save a category."
    markDetails.lastChild.lastChild.addEventListener("keyup", (ev) => {
      if (ev.keyCode == 188 || ev.keyCode == 13) {
        let el = markDetails.getElementsByClassName("cat-display")[0];
        let val = el.nextSibling.value;
        val = val.replace(",", "");
        dataPort.postMessage({
          addCat: {
            url: param.mark.url,
            newCat: val
          }
        });
        el.nextSibling.value = "";
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

// ---------- update sort ----------
function updateSort() {
  var sortOrderIdx;
  document.getElementById("sort-feature").innerText = sortFeatureAll[sortFeature];
  var el = document.getElementById("sort-order");
  el.classList.remove(...sortOrderAll);  
  if (sortFeature != 3) {
    if (sortOrder) sortOrderIdx = 0;
    else sortOrderIdx = 1;
  } else {
    if (sortOrder) sortOrderIdx = 2;
    else sortOrderIdx = 3;
  }
  el.classList.add(sortOrderAll[sortOrderIdx]);
}

// Vue.component("sort-by", {
//   props: ["sortFeature", "sortOrder"],
//   computed: {
//     sortFeatureDisplay: function() {
//       return sortFeatureAll[this.sortFeature];
//     },
//     sortOrderButton: function () {
//       return {
//         fa: true,
//         "fa-sort-alpha-desc": this.sortFeature != 3 && this.sortOrder,
//         "fa-sort-alpha-asc": this.sortFeature != 3 && !this.sortOrder,
//         "fa-sort-numeric-desc": this.sortFeature == 3 && this.sortOrder,
//         "fa-sort-numeric-asc": this.sortFeature == 3 && !this.sortOrder
//       }
//     }
//   },
//   methods: {
//     changeSortFeature: function () {
//       this.$emit("changesortfeature");
//     },
//     changeSortOrder: function () {
//       this.$emit("changesortorder");
//     }
//   },
//   template: `
//   <div id="sort-by">
//     Sort by:
//     <div class="hsep"></div>
//     <div id="sort-feature" @click="changeSortFeature">{{ sortFeatureDisplay }}</div>
//     <div class="hsep"></div>
//     <div id="sort-order" :class="sortOrderButton" @click="changeSortOrder"></div>
//   </div>
//   `
// });

// ---------- update content list ----------
function updateContentList() {
  var base = document.getElementById("content-list");
  while (base.lastChild) base.removeChild(base.lastChild);
  let sf = sortFeatureAllKeys[sortFeature];
  let sections;
  if (bookmarks.length == 0) sections = [];
  else {
    sections = bookmarks.map(x => {
      if (sf == "categories") return x[sf];
      else if (sf == "title") {
        let sortRef = x.customTitle ? x.customTitle : x.title;
        return sortRef.length > 0 ? sortRef[0].toUpperCase() : "";
      } else if (sf == "url") {
        let startAt = x[sf].indexOf("://");
        if (startAt > -1) startAt += 3;
        else startAt = 0;
        return x[sf][startAt].toUpperCase();
      } else if (sf == "savedDate") return x[sf].slice(0,10);
    });
    if (sf == "categories") sections = Array.prototype.concat(...sections, "");
    sections = sections.filter((s,i,a) => a.indexOf(s) == i);
    let newList = bookmarks.map(x => Object.assign({}, x));
    newList.sort((a,b) => {
      let secondarySortFeature = sf == "categories" ? "title" : sf;
      let result = a[secondarySortFeature].localeCompare(b[secondarySortFeature]);
      return sortOrder ? -1*result : result;
    });

    sections = sections.map(x => {
      return {
        sectionName: x,
        bookmarks: newList.filter(y => {
          let compareString;
          if (sf == "categories") {
            if (x) return y[sf].includes(x);
            else return y[sf].length == 0;
          } else if (sf == "title") {
            let sortRef = y.customTitle ? y.customTitle : y.title;
            return sortRef.length > 0 ? sortRef[0].toUpperCase() == x : "" == x;
          } else if (sf == "url") {
            let startAt = y[sf].indexOf("://");
            if (startAt > -1) startAt += 3;
            else startAt = 0;
            return y[sf][startAt].toUpperCase() == x;
          } else if ("savedDate") {
            return y[sf].slice(0,10) == x;
          }
        })
      };
    });
    sections.sort((a,b) => {
      let result = a.sectionName.localeCompare(b.sectionName);
      return sortOrder ? -1*result : result;
    });
  }

  if (sections.length == 0) {
    base.appendChild(createAMark({
      mark: {
        favIconUrl: "icons/icon.png", 
        title: "Bookmarks are displayed here",
        url: "together with their URL",
      },
      actions: ""
    }));
  } else {
    var noSection;
    if (sf == "categories") noSection = "Uncategorised";
    else if (sf == "title") noSection = "No Name";
    function generateRemoveFunction(removeUrl) {
      return () => dataPort.postMessage({
        remove: removeUrl
      });
    }
    for (var i = 0; i < sections.length; i++) {
      base.appendChild(document.createElement("div"));
      base.lastChild.classList.add("subheadline");
      base.lastChild.innerText = sections[i].sectionName ? sections[i].sectionName : noSection;
      for (var j = 0; j < sections[i].bookmarks.length; j++) {
        base.appendChild(createAMark({
          mark: sections[i].bookmarks[j],
          actions: "-oe",
          remove: generateRemoveFunction(sections[i].bookmarks[j].url),
          allCat: Array.prototype.concat(...bookmarks.map(bm => bm.categories)).filter((s,i,a) => a.indexOf(s) == i).sort((a,b) => a.localeCompare(b))
        }))
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
  render: function (createElement) {
    return createElement("div", { attrs: { id: "sort-by" } }, [
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
  //   Sort by:
  //   <div class="hsep"></div>
  //   <div id="sort-feature" @click="changeSortFeature">{{ sortFeatureDisplay }}</div>
  //   <div class="hsep"></div>
  //   <div id="sort-order" :class="sortOrderButton" @click="changeSortOrder"></div>
  // </div>
  // `
});

dataPort.onMessage.addListener(m => {
  console.log("From background.js", JSON.parse(JSON.stringify(m)));
  let mKeys = Object.keys(m);
  if (mKeys.includes("bookmarks")) {
    bookmarks = m.bookmarks;
    updateCurrentTab();
    updateContentList();
  }
  if (mKeys.includes("sortFeature")) {
    sortFeature = m.sortFeature;
    updateSort();
    updateContentList();
  }
  if (mKeys.includes("sortOrder")) {
    sortOrder = m.sortOrder;
    updateSort();
    updateContentList();
  }
  if (mKeys.includes("useLocal")) {
    useLocal = m.useLocal;
    updateSignInStatus();
  }
  if (mKeys.includes("remoteAccount")) {
    remoteAccount = m.remoteAccount;
    updateSignInStatus();
  }
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

updateSort();

// ---------- add listener to misc section ----------
document.getElementById("go-home").addEventListener("click", () => window.open("https://ricwtk.github.io/sync-bookmarks"));
document.getElementById("sign-in-out").addEventListener("click", () => dataPort.postMessage({setLocal: !useLocal}));

    dataPort.postMessage({});
    dataPort.postMessage({ refresh: true });
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
        },
        on: {
          changesortfeature: this.changeSortFeature,
          changesortorder: this.changeSortOrder
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
});