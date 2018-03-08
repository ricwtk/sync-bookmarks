// ---------- pop text ----------
function popText(innerNode) {
  var el = document.getElementById("popup-text");
  while (el.lastChild) el.removeChild(el.lastChild);
  el.appendChild(innerNode);
  el.parentNode.classList.remove("hide");
}

// ---------- update current tab ----------
function updateCurrentTab() {
  var ct = document.getElementById("current-tab");
  while (ct.lastChild) ct.removeChild(ct.lastChild);
  ct.appendChild(createAMark({
    mark: currentTab,
    actions: (bookmarks.findIndex(bm => bm.url == currentTab.url) == -1) ? "+" : "-",
    add: () => {
      dataPort.postMessage({
        add: {
          favIconUrl: currentTab.favIconUrl,
          title: currentTab.title,
          url: currentTab.url,
          savedDate: new Date().toISOString(),
          categories: [],
          customTitle: "",
          description: ""
        }
      });
    },
    remove: () => {
      dataPort.postMessage({
        remove: currentTab.url
      });
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
    });
    markDetails.lastChild.appendChild(document.createElement("div"));
    markDetails.lastChild.lastChild.classList.add("cat-display", "hide");
    let notCat = Array.from(param.allCat).filter(c => !param.mark.categories.includes(c)).sort((a,b) => a.localeCompare(b));
    for (var i=0; i < notCat.length; i++) {
      markDetails.lastChild.lastChild.appendChild(document.createElement("span"));
      markDetails.lastChild.lastChild.lastChild.classList.add("tag", "edit");
      markDetails.lastChild.lastChild.lastChild.appendChild(document.createTextNode(notCat[i]));
      markDetails.lastChild.lastChild.lastChild.appendChild(document.createElement("i"));
      markDetails.lastChild.lastChild.lastChild.lastChild.classList.add("fa", "fa-plus-circle");
      markDetails.lastChild.lastChild.lastChild.lastChild.addEventListener("click", (ev) => {
        console.log(ev.target.previousSibling.textContent);
        dataPort.postMessage({
          addCat: {
            url: param.mark.url,
            newCat: ev.target.previousSibling.textContent
          }
        });
      })
    }
    // ... for edit
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
    markDetails.appendChild(document.createElement("div"));
    markDetails.lastChild.appendChild(document.createElement("div"));
    markDetails.lastChild.lastChild.classList.add("section-title");
    markDetails.lastChild.lastChild.innerText = "Description";
    markDetails.lastChild.lastChild.appendChild(document.createElement("i"));
    markDetails.lastChild.lastChild.lastChild.classList.add("fa", "fa-pencil", "action");
    markDetails.lastChild.lastChild.lastChild.addEventListener("click", () => {
      markDetails.getElementsByClassName("desc-display")[0].classList.toggle("hide");
      let edit = markDetails.getElementsByClassName("desc-edit")[0];
      edit.getElementsByTagName("textarea")[0].value = param.mark.description;
      edit.classList.toggle("hide");
    });
    markDetails.lastChild.appendChild(document.createElement("div"));
    markDetails.lastChild.lastChild.classList.add("desc-display");
    markDetails.lastChild.lastChild.innerText = param.mark.description;
    markDetails.lastChild.appendChild(document.createElement("div"));
    markDetails.lastChild.lastChild.classList.add("desc-edit", "hide");
    markDetails.lastChild.lastChild.appendChild(document.createElement("textarea"));
    markDetails.lastChild.lastChild.appendChild(document.createElement("i"));
    markDetails.lastChild.lastChild.lastChild.classList.add("fa", "fa-check", "action");
    markDetails.lastChild.lastChild.lastChild.addEventListener("click", () => {
      let display = markDetails.getElementsByClassName("desc-display")[0];
      display.classList.remove("hide");
      let edit = markDetails.getElementsByClassName("desc-edit")[0];
      param.mark.description = edit.getElementsByTagName("textarea")[0].value;
      edit.classList.add("hide");
      // update in details
      display.innerText = param.mark.description;
      // send to background.js
      dataPort.postMessage({
        changeDescription: {
          url: param.mark.url,
          new: param.mark.description
        }
      });
    });
    markDetails.lastChild.lastChild.appendChild(document.createElement("i"));
    markDetails.lastChild.lastChild.lastChild.classList.add("fa", "fa-times", "action");
    markDetails.lastChild.lastChild.lastChild.addEventListener("click", () => {
      markDetails.getElementsByClassName("desc-display")[0].classList.remove("hide");
      markDetails.getElementsByClassName("desc-edit")[0].classList.add("hide");
    });
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
    base.lastChild.appendChild(markDetails);
    //   </div>
    // </div>
  }
  return base;
}
// Vue.component("a-mark", {
//   props: ["mark", "actions", "allCat"],
//   data: function () {
//     return {
//       showDetails: false,
//       edit: {},
//       allowEdit: {
//         customTitle: false,
//         categories: false,
//         description: false
//       }
//     };
//   },
//   computed: {
//     sortedCat: function () {
//       return Array.from(this.mark.categories).sort((a,b) => a.localeCompare(b));
//     },
//     notCat: function () {
//       return this.allCat.filter(c => !this.mark.categories.includes(c)).sort((a,b) => a.localeCompare(b));
//     }
//   },
//   created: function () {
//     this.edit = {
//       customTitle: this.mark.customTitle,
//       description: this.mark.description
//     }
//   },
//   methods: {
//     clickText: function (el) {
//       this.$emit("clicktext", el.target.textContent);
//     },
//     addBookmark: function () {
//       this.$emit("add", {
//         favIconUrl: this.mark.favIconUrl,
//         title: this.mark.title,
//         url: this.mark.url,
//         savedDate: new Date().toISOString(),
//         categories: [],
//         customTitle: "",
//         description: ""
//       });
//     },
//     removeBookmark: function () {
//       this.$emit("remove", this.mark.url);
//     },
//     openBookmark: function () {
//       try {
//         window.open(this.mark.url, "_blank");
//       } catch (e) {
//         this.$emit("error",
//           `The following URLs cannot be opened from script due to limitation of
//            webextension:
//            <span class="tag">about: URLs</span>
//            <span class="tag">chrome: URLs</span>
//            <span class="tag">javascript: URLs</span>
//            <span class="tag">data: URLs</span>
//            <span class="tag">file: URLs</span>`);
//       }
//     },
//     toggleDetails: function () {
//       this.showDetails = !this.showDetails;
//     },
//     toggleEdit: function (key) {
//       this.allowEdit[key] = !this.allowEdit[key];
//       if (!this.allowEdit[key]) {
//         this.edit[key] = this.mark[key];
//       } else {
//         Vue.nextTick(() => {
//           this.$refs[key.toLowerCase() + "Input"].focus();
//         });
//       }
//     },
//     accept: function (key) {
//       this.$emit("change"+key.toLowerCase(), { url: this.mark.url, new: this.edit[key] });
//       this.allowEdit[key] = !this.allowEdit[key];
//     },
//     reject: function (key) {
//       this.edit[key] = this.mark[key];
//       this.allowEdit[key] = !this.allowEdit[key];
//     },
//     monitorInput: function (el) {
//       let catEntry = el.target.value;
//       if (catEntry[catEntry.length-1] == ",") {
//         let newCat = catEntry.slice(0, catEntry.length-1)
//         this.addCat(newCat);
//         el.target.value = "";
//       }
//     },
//     enterCat: function (el) {
//       let catEntry = el.target.value;
//       this.addCat(catEntry);
//       el.target.value = "";
//     },
//     addCat: function (newCat) {
//       this.$emit("addcat", { url: this.mark.url, newCat: newCat });
//       this.mark.categories.push(newCat);
//       this.mark.categories = this.mark.categories.filter((s,i,a) => a.indexOf(s) == i);
//     },
//     removeCat: function (el) {
//       this.$emit("removecat", { url: this.mark.url, removeCat: el.target.dataset.tagname });
//       let removeIdx = this.mark.categories.indexOf(el.target.dataset.tagname);
//       if (removeIdx > -1) this.mark.categories.splice(removeIdx, 1);
//     },
//     addExistingCat: function (el) {
//       this.addCat(el.target.dataset.tagname);
//     },
//   },
//   template: `
//   <div class="mark-wrapper">
//     <div class="a-mark">
//       <div class="mark-primary-title">
//         <img class="mark-favicon" :src="mark.favIconUrl" v-if="mark.favIconUrl">
//         <div class="mark-desc">
//           <div class="mark-title" :title="mark.title" @click="clickText">{{ mark.customTitle ? mark.customTitle : mark.title }}</div>
//           <div class="mark-url" :title="mark.url" @click="clickText">{{ mark.url }}</div>
//         </div>
//       </div>
//       <div class="mark-actions">
//         <div class="mark-actions-left">
//           <div v-if="actions.includes('+')" class="mark-action fa fa-plus" title="bookmark this" @click="addBookmark"></div>
//           <div v-if="actions.includes('-')" class="mark-action fa fa-minus" title="remove bookmark" @click="removeBookmark"></div>
//           <div v-if="actions.includes('o')" class="mark-action fa fa-external-link-square" title="open link" @click="openBookmark"></div>
//         </div>
//         <div class="mark-actions-right">
//           <div v-if="actions.includes('e')" class="mark-action fa fa-angle-down" title="show details" @click="toggleDetails"></div>
//         </div>
//       </div>
//       <div class="mark-details" v-if="showDetails && actions.includes('e')">
//         <div>
//           <div class="section-title">Default title</div>
//           <div class="text-display">&#8203;{{ mark.title }}</div>
//         </div>
//         <div>
//           <div class="section-title">URL</div>
//           <div class="text-display">&#8203;{{ mark.url }}</div>
//         </div>
//         <div>
//           <div class="section-title">Title<i class="fa fa-pencil action" @click="toggleEdit('customTitle')"></i></div>
//           <div class="text-display" v-if="!allowEdit.customTitle">&#8203;{{ mark.customTitle }}</div>
//           <div class="text-edit" v-else>
//             <input type="text" v-model="edit.customTitle" @keyup.esc.stop="reject('customTitle')" @keyup.enter.stop="accept('customTitle')" ref="customtitleInput">
//             <i class="fa fa-check action" @click="accept('customTitle')"></i>
//             <i class="fa fa-times action" @click="reject('customTitle')"></i>
//           </div>
//         </div>
//         <div>
//           <div class="section-title">Categories <i class="fa fa-pencil action" @click="toggleEdit('categories')"></i></div>
//           <div class="cat-display">
//             &#8203;
//             <span v-for="cat in sortedCat" :class="{ tag: true, edit: allowEdit.categories }">
//               {{ cat }}
//               <i v-if="allowEdit.categories" class="fa fa-times-circle" :data-tagname="cat" @click="removeCat"></i>
//             </span>
//           </div>
//           <input v-if="allowEdit.categories" type="text" placeholder="Use comma (,) or 'Enter' to end or save a category." @input="monitorInput" @change="enterCat" @keyup.esc.stop="toggleEdit('categories')" ref="categoriesInput">
//           <div v-if="allowEdit.categories" class="cat-display">
//             <span v-for="cat in notCat" class="tag edit">
//               {{ cat }}
//               <i class="fa fa-plus-circle" :data-tagname="cat" @click="addExistingCat"></i>
//             </span>
//           </div>
//         </div>
//         <div>
//           <div class="section-title">Description <i class="fa fa-pencil action" @click="toggleEdit('description')"></i></div>
//           <div class="desc-display" v-if="!allowEdit.description">{{ mark.description }}</div>
//           <div class="desc-edit" v-else>
//             <textarea v-model="edit.description" @keyup.esc.stop="reject('description')" ref="descriptionInput"></textarea>
//             <i class="fa fa-check action" @click="accept('description')"></i>
//             <i class="fa fa-times action" @click="reject('description')"></i>
//           </div>
//         </div>
//       </div>
//     </div>
//   </div>
//   `
// });

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
  }
}

// Vue.component("content-list", {
//   props: ["sortFeature", "sortOrder", "fullList"],
//   computed: {
//     rearrangedList: function() {
//       let sortFeature = sortFeatureAllKeys[this.sortFeature];
//       if (this.fullList.length == 0) return [];
//       let sections = this.fullList.map(x => {
//         if (sortFeature == "categories") return x[sortFeature];
//         else if (sortFeature == "title") {
//           let sortRef = x.customTitle ? x.customTitle : x.title;
//           return sortRef.length > 0 ? sortRef[0].toUpperCase() : "";
//         } else if (sortFeature == "url") {
//           let startAt = x[sortFeature].indexOf("://");
//           if (startAt > -1) startAt += 3;
//           else startAt = 0;
//           return x[sortFeature][startAt].toUpperCase();
//         } else if (sortFeature == "savedDate") return x[sortFeature].slice(0,10);
//       });
//       if (sortFeature == "categories") sections = Array.prototype.concat(...sections, "");
//       sections = sections.filter((s,i,a) => a.indexOf(s) == i);
//       let newList = this.fullList.map(x => Object.assign({}, x));
//       newList.sort((a,b) => {
//         let secondarySortFeature = sortFeature == "categories" ? "title" : sortFeature;
//         let result = a[secondarySortFeature].localeCompare(b[secondarySortFeature]);
//         return this.sortOrder ? -1*result : result;
//       });

//       sections = sections.map(x => {
//         return {
//           sectionName: x,
//           bookmarks: newList.filter(y => {
//             let compareString;
//             if (sortFeature == "categories") {
//               if (x) return y[sortFeature].includes(x);
//               else return y[sortFeature].length == 0;
//             } else if (sortFeature == "title") {
//               let sortRef = y.customTitle ? y.customTitle : y.title;
//               return sortRef.length > 0 ? sortRef[0].toUpperCase() == x : "" == x;
//             } else if (sortFeature == "url") {
//               let startAt = y[sortFeature].indexOf("://");
//               if (startAt > -1) startAt += 3;
//               else startAt = 0;
//               return y[sortFeature][startAt].toUpperCase() == x;
//             } else if ("savedDate") {
//               return y[sortFeature].slice(0,10) == x;
//             }
//           })
//         };
//       });
//       sections.sort((a,b) => {
//         let result = a.sectionName.localeCompare(b.sectionName);
//         return this.sortOrder ? -1*result : result;
//       })
//       return sections;
//     },
//     noSection: function () {
//       let sortFeature = sortFeatureAllKeys[this.sortFeature];
//       if (sortFeature == "categories") return "Uncategorised";
//       else if (sortFeature == "title") return "No Name";
//     },
//     allCat: function () {
//       return Array.prototype.concat(...this.fullList.map(bm => bm.categories)).filter((s,i,a) => a.indexOf(s) == i).sort((a,b) => a.localeCompare(b));
//     }
//   },
//   methods: {
//     removeBookmark: function (mark) {
//       this.$emit("remove", mark.url);
//     },
//     clickText: function (text) {
//       this.$emit("clicktext", text);
//     },
//     showError: function (err) {
//       this.$emit("error", err);
//     },
//     changeCustomTitle: function (m) {
//       this.$emit("changecustomtitle", m);
//     },
//     changeDescription: function (m) {
//       this.$emit("changedescription", m);
//     },
//     addCat: function (m) {
//       this.$emit("addcat", m);
//     },
//     removeCat: function (m) {
//       this.$emit("removecat", m);
//     }
//   },
//   template: `
//   <div>
//     <a-mark v-if="rearrangedList.length == 0"
//       :mark="{ favIconUrl: 'icons/icon.png', title: 'Bookmarks are displayed here', url: 'together with their URL' }"
//       actions="">
//     </a-mark>
//     <template v-for="section in rearrangedList">
//       <div class="subheadline">{{ section.sectionName ? section.sectionName : noSection }}</div>
//       <a-mark v-for="x in section.bookmarks" :mark="x" actions="-oe"
//         :all-cat="allCat"
//         @remove="removeBookmark(x)"
//         @clicktext="clickText"
//         @error="showError"
//         @changecustomtitle="changeCustomTitle"
//         @changedescription="changeDescription"
//         @addcat="addCat"
//         @removecat="removeCat">
//       </a-mark>
//     </template>
//   </div>
//   `
// });

// ---------- update sign in status ----------
function updateSignInStatus() {
  var el = document.getElementById("sign-in-status");
  if (useLocal) el.innerText = "Saved on local machine";
  else el.innerText = "Signed in as " + remoteAccount;
  el = document.getElementById("sign-in-out");
  if (useLocal) {
    el.classList.remove("fa-sign-out");
    el.classList.add("fa-google");
    el.title = "Sign in to Google";
  } else {
    el.classList.add("fa-sign-out");
    el.classList.remove("fa-google");
    el.title = "Save on local machine";
  }
}

// Vue.component("misc-section", {
//   props: ["useLocal", "remoteAccount"],
//   methods: {
//     showHelp: function () {
//       window.open("https://ricwtk.github.io/sync-bookmarks");
//     },
//     signInOut: function () {
//       this.$emit("signinout", !this.useLocal);
//     }
//   },
//   template: `
//   <div class="misc-section">
//     <div class="sign-in-status">
//       <template v-if="useLocal">
//         Saved on local machine
//       </template>
//       <template v-else>
//         Signed in as <b>{{ remoteAccount }}</b>
//       </template>
//     </div>
//     <div class="buttons-section">
//       <div :class="{ fa: true, 'fa-google': useLocal, 'fa-sign-out': !useLocal }"
//         :title="useLocal ? 'Sign in to Google' : 'Save on local machine'"
//         @click="signInOut">
//       </div>
//       <div class="fa fa-home" title="Homepage"
//         @click="showHelp"></div>
//     </div>
//   </div>
//   `
// })

// new Vue({
//   el: "#app",
//   data: {
//     sortFeature: 0,
//     sortOrder: true,
//     currentTab: {},
//     bookmarks: [],
//     showPopup: false,
//     popupText: "",
//     useLocal: true,
//     remoteAccount: ""
//   },
//   computed: {
//     currentTabAction: function () {
//       if (this.bookmarks.findIndex(bm => bm.url == this.currentTab.url) == -1) return "+";
//       else return "-";
//     },
//     allCat: function () {
//       return Array.prototype.concat(...this.bookmarks.map(bm => bm.categories)).filter((s,i,a) => a.indexOf(s) == i).sort((a,b) => a.localeCompare(b));
//     }
//   },
//   methods: {
//     addBookmark: function (bookmark) {
//       dataPort.postMessage({
//         add: bookmark
//       });
//     },
//     removeBookmark: function (url) {
//       dataPort.postMessage({
//         remove: url
//       });
//     },
//     changeSortFeature: function () {
//       this.sortFeature = ( this.sortFeature+1 ) % sortFeatureAll.length;
//       dataPort.postMessage({ setSortFeature: this.sortFeature });
//     },
//     changeSortOrder: function () {
//       this.sortOrder = !this.sortOrder;
//       dataPort.postMessage({ setSortOrder: this.sortOrder });
//     },
//     popText: function (text) {
//       this.showPopup = true;
//       this.popupText = text;
//     },
//     hidePop: function (el) {
//       if (el.target != this.$refs.popupText) this.showPopup = false;
//     },
//     addCat: function (param) {
//       dataPort.postMessage({
//         addCat: param
//       });
//     },
//     removeCat: function (param) {
//       dataPort.postMessage({
//         removeCat: param
//       });
//     },
//     changeCustomTitle: function (param) {
//       dataPort.postMessage({
//         changeCustomTitle: param
//       });
//     },
//     changeDescription: function (param) {
//       dataPort.postMessage({
//         changeDescription: param
//       });
//     },
//     signInOut: function (param) {
//       dataPort.postMessage({
//         setLocal: param
//       })
//     }
//   },
//   created: function () {
//     browser.tabs.query({
//       currentWindow: true,
//       active: true
//     }).then(res => {
//       this.currentTab = res[0];
//     });

//     dataPort.onMessage.addListener(m => {
//       console.log("From background.js", JSON.parse(JSON.stringify(m)));
//       let mKeys = Object.keys(m);
//       if (mKeys.includes("bookmarks")) this.bookmarks = m.bookmarks;
//       if (mKeys.includes("sortFeature")) this.sortFeature = m.sortFeature;
//       if (mKeys.includes("sortOrder")) this.sortOrder = m.sortOrder;
//       if (mKeys.includes("useLocal")) this.useLocal = m.useLocal;
//       if (mKeys.includes("remoteAccount")) this.remoteAccount = m.remoteAccount;
//     });

//     dataPort.postMessage({});
//     dataPort.postMessage({ refresh: true });
//   }
// })

// ---------- initialisation ----------
var sortFeature = 0;
var sortOrder = true;
var currentTab = {};
var bookmarks = [];
var showPopup = false;
var popupText = "";
var useLocal = true;
var remoteAccount = "";
var dataPort = browser.runtime.connect({ name: "popup-background" });
const sortFeatureAll = ["Categories", "Title", "URL", "Saved date"];
const sortFeatureAllKeys = ["categories", "title", "url", "savedDate"];
const sortOrderAll = ["fa-sort-alpha-desc", "fa-sort-alpha-asc", "fa-sort-numeric-desc", "fa-sort-numeric-asc"]

browser.tabs.query({
  currentWindow: true,
  active: true
}).then(res => {
  currentTab = res[0];
  updateCurrentTab();
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

dataPort.postMessage({});
dataPort.postMessage({ refresh: true });

// ---------- add listener to sort feature and order ----------
var el = document.getElementById("sort-feature");
el.addEventListener("click", () => {
  sortFeature = ( sortFeature+1 ) % sortFeatureAll.length;
  dataPort.postMessage({ setSortFeature: sortFeature });
  updateSort();
});

var el = document.getElementById("sort-order");
el.addEventListener("click", () => {
  sortOrder = !sortOrder;
  dataPort.postMessage({ setSortOrder: sortOrder });
  updateSort();
});

updateSort();

// ---------- add listener to misc section ----------
document.getElementById("go-home").addEventListener("click", () => window.open("https://ricwtk.github.io/sync-bookmarks"));
document.getElementById("sign-in-out").addEventListener("click", () => dataPort.postMessage({setLocal: !useLocal}));

// update ui
updateSignInStatus();
updateContentList();

document.getElementById("popup-text").parentNode.addEventListener("click", (ev) => {
  if (ev.target.classList.contains("popup-text")) {
    ev.target.classList.add("hide");
  }
});