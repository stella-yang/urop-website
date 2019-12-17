const TERM_CLASS_TO_LABEL = {
  "fall": "Fall",
  "iap": "IAP",
  "spring": "Spring",
  "summer": "Summer",
};

// send xhr for data
const requestData = (url, onResponse) => {
  const xhr = new XMLHttpRequest();
  xhr.open(`GET`, url, true);
  xhr.onreadystatechange = () => {
    if (xhr.readyState !== 4) return;
    if (xhr.status !== 200) onResponse(null);
    else onResponse(xhr.responseText);
  };
  xhr.send();
};

// when the user clicks on the button, scroll to the top of the document
function scrollToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

// replace text in textnodes
function replaceInText(element, pattern, replacement) {
  for (let node of element.childNodes) {
    switch (node.nodeType) {
      case Node.ELEMENT_NODE:
        replaceInText(node, pattern, replacement);
        break;
      case Node.TEXT_NODE:
        let newNode = document.createElement(`span`);
        newNode.innerHTML = node.textContent.replace(pattern, replacement);
        node.replaceWith(newNode);
        break;
    }
  }
}

// function which is called every time one of the term filters is clicked to filter out the urop cells
function filterPostings(data) {
  let selected = document.getElementsByClassName(`selected`);
  let tags = [];

  // this variable is set when no tags are clicked; i.e. all posts should be shown
  let noTagsSelected = false;

  for (let a = 0; a < selected.length; a++) {
    tags.push(selected[a].id.split(`header-terms-`)[1]);
  }
  if (tags.length == 0) {
    noTagsSelected = true;
    tags = [`fall`, `iap`, `spring`, `summer`];
  }

  // hide all elements which don't match
  for (let a = 0; a < data.length; a++) {
    let elem = document.getElementsByName(`viewer-elem-` + a)[0];
    let show = false;
    for (let b = 0; b < data[a].termSplit.length; b++) {
      if (tags.includes(data[a].termSplit[b])) {
        show = true;
        break;
      }
    }

    // if the term split tags contain any terms not of the four terms and also no tags are selected, then show the post
    if (noTagsSelected) {
      for (let b = 0; b < data[a].termSplit.length; b++) {
        if (data[a].termSplit[b] != `fall` &&
          data[a].termSplit[b] != `iap` &&
          data[a].termSplit[b] != `spring` &&
          data[a].termSplit[b] != `summer`) {
          show = true;
          break;
        }
      }
    }

    if (!show) {
      elem.classList.add(`hidden-term`);
    } else {
      elem.classList.remove(`hidden-term`);
    }
  }
}

function testApplyMobileStyling() {
  // detect if mobile and apply separate styling
  if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
    document.body.classList.add(`mobile`);
    document.documentElement.classList.add(`mobile`);
  }
}

const createPane = (info) => {
  const pane = document.querySelector(`.template.pane`).cloneNode(true);
  pane.classList.remove(`template`);

  pane.querySelector(`.title`).innerHTML = info.title;
  pane.querySelector(`.detail-link`).href = info.detail_url;
  pane.querySelector(`.description`).innerHTML = info.description;
  pane.querySelector(`.prereqs`).innerHTML = info.prereqs;

  // create terms tags
  const termsNode = pane.querySelector(`.terms`);
  if (info.term.length === 0) {
    termsNode.classList.add(`hidden`);
  } else {
    for (let a = 0; a < info.term.length; a++) {
      const termNode = document.createElement(`div`);
      termNode.classList.add(`term`);
      termNode.classList.add(info.term[a]);
      termNode.innerHTML = TERM_CLASS_TO_LABEL[info.term[a]];
      termsNode.appendChild(termNode);
    }
  }

  pane.querySelector(`.faculty`).innerHTML = info.faculty_supervisor;
  pane.querySelector(`.department`).innerHTML = info.department;
  if (info.contact === "") {
    pane.querySelector(`.contact`).classList.add(`hidden`);
  } else {
    pane.querySelector(`.contact`).innerHTML = `<a href=\`mailto:` + info.contact + `\`>` + info.contact + `</a>`;
  }
  if (info.apply_by === "") {
    pane.querySelector(`.due`).classList.add(`hidden`);
  } else {
    pane.querySelector(`.due`).innerHTML = "Due: " + info.apply_by;
  }
  pane.querySelector(`.posted`).innerHTML = "Posted: " + info.posted;

  return pane;
};

function onDataLoad(data) {
  // create all the elements for the UROPs
  const viewer = document.querySelector(`.viewer`);
  for (let a = 0; a < data.length; a++) {
    const pane = createPane(data[a]);
    viewer.appendChild(pane);

    // elem.setAttribute(`name`, `viewer-elem-` + a);
    // elem.className = `viewer-elem`;

    // let summary = document.createElement(`div`);
    // let main = document.createElement(`div`);
    // elem.appendChild(summary);
    // elem.appendChild(main);
    // summary.className = `viewer-elem-summary`;
    // main.className = `viewer-elem-main`;

    // let date = document.createElement(`div`);
    // let term = document.createElement(`div`);
    // let contact = document.createElement(`div`);
    // let department = document.createElement(`div`);
    // summary.appendChild(date);
    // summary.appendChild(term);
    // summary.appendChild(contact);
    // summary.appendChild(department);
    // date.className = `viewer-elem-date`;
    // term.className = `viewer-elem-term`;
    // contact.className = `viewer-elem-contact`;
    // department.className = `viewer-elem-department`;

    // let star = document.createElement(`div`);
    // summary.appendChild(star);
    // star.className = `header-terms-star viewer-elem-star noselect nofocus`;
    // star.innerText = `☆`;
    // star.onclick = function() {
    //   if (star.classList.contains(`filled`)) {
    //     star.innerText = `☆`;
    //     star.classList.remove(`filled`);
    //   } else {
    //     star.innerText = `★`;
    //     star.classList.add(`filled`);
    //   }
    // }

    // let title = document.createElement(`div`);
    // let full = document.createElement(`div`);
    // main.appendChild(title);
    // main.appendChild(full);
    // title.className = `viewer-elem-title`;
    // full.className = `viewer-elem-full`;

    // date.innerHTML = data[a].apply_by;

    // let contactSplit = data[a].contact.split(`,`);
    // for (let b = 0; b < contactSplit.length; b++) {
    //   contact.innerHTML += `<a href=\`mailto:` + contactSplit[b] + `\`>` + contactSplit[b] + `</a>`;
    //   if (b < contactSplit.length - 1) {
    //     contact.innerHTML += `<br>`;
    //   }
    // }

    // department.innerHTML = data[a].department;
    // title.innerHTML = data[a].title;
    // full.innerHTML = data[a].description;

    // // used in search
    // department.origHTML = department.innerHTML;
    // title.origHTML = title.innerHTML;
    // full.origHTML = full.innerHTML;

    // // parsing for terms
    // let termList = data[a].term.split(`/`);

    // // the term element split by commas
    // data[a].termSplit = [];

    // for (let b = 0; b < termList.length; b++) {
    //   let tag = termList[b].trim().toLowerCase();
    //   data[a].termSplit.push(tag);

    //   if (tag == `fall` || tag == `iap` || tag == `spring` || tag == `summer`) {
    //     let tagNode = document.createElement(`div`);
    //     term.appendChild(tagNode);
    //     tagNode.className = `header-terms-all viewer-elem-term-elem nofocus noselect`;
    //     tagNode.textContent = termList[b].trim();
    //     tagNode.style.borderColor = `var(--` + tag + `)`;
    //     tagNode.style.backgroundColor = `var(--` + tag + `)`;
    //   } else {
    //     // error processing terms, just display string instead
    //     let tagNode = document.createElement(`div`);
    //     term.appendChild(tagNode);
    //     tagNode.className = `viewer-elem-term-elem-text nofocus noselect`;

    //     tagNode.innerText = tag;
    //     console.log(`Error parsing term tags for UROP:`, data[a].project_title + `:`, termList[b] + `.`, `This UROP post will only be shown if no term filters are selected.`);
    //   }
    // }
  }

  // // search bar and its handler
  // let search = document.getElementById(`header-search`);
  // search.oninput = function() {
  //   let text = search.value;

  //   // hide all elements which don't match
  //   for (let a = 0; a < data.length; a++) {
  //     // setTimeout for async and faster search
  //     setTimeout(function() {
  //       // only keep on processing if the current text is the same as the search bar still, which might not be the case if they type too fast
  //       if (text != search.value) {
  //         return;
  //       }

  //       let elem = document.getElementsByName(`viewer-elem-` + a)[0];
  //       let title = elem.getElementsByClassName(`viewer-elem-title`)[0];
  //       let full = elem.getElementsByClassName(`viewer-elem-full`)[0];
  //       let department = elem.getElementsByClassName(`viewer-elem-department`)[0];

  //       // whenever hidden is removed, we'll also unhighlight the text, so it should be okay
  //       if (text.length == 0) {
  //         elem.classList.remove(`hidden-search`);
  //         title.innerHTML = title.origHTML;
  //         full.innerHTML = full.origHTML;
  //         department.innerHTML = department.origHTML;
  //       } else {
  //         let reg = new RegExp(`(` + text.replace(
  //             /[\[\]\\{}()+*?.$^|]/g,
  //             function(match) {
  //               return '\\' + match;
  //             }) +
  //           `)`, `gi`);
  //         let show = reg.test(title.textContent) |
  //           reg.test(full.textContent) |
  //           reg.test(department.textContent);
  //         if (!show) {
  //           elem.classList.add(`hidden-search`);
  //         } else {
  //           elem.classList.remove(`hidden-search`);

  //           // highlight text from search in both title and full
  //           // highlight all capitalizations of the search term
  //           title.innerHTML = title.origHTML;
  //           full.innerHTML = full.origHTML;
  //           department.innerHTML = department.origHTML;
  //           replaceInText(title, reg, `<span class=\"highlighted\">$1</span>`);
  //           replaceInText(full, reg, `<span class=\"highlighted\">$1</span>`);
  //           replaceInText(department, reg, `<span class=\"highlighted\">$1</span>`);
  //         }
  //       }
  //     }, 0);
  //   }
  // }

  // // term filter
  // let termNodes = document.getElementById(`header`).getElementsByClassName(`header-terms-all`);
  // for (let a = 0; a < termNodes.length; a++) {
  //   let node = termNodes[a];
  //   termNodes[a].onclick = function() {
  //     if (node.classList.contains(`selected`)) {
  //       node.classList.remove(`selected`);
  //     } else {
  //       node.classList.add(`selected`);
  //     }

  //     filterPostings(data);
  //   }
  // }
  // filterPostings(data);

  // // star filter
  // let starFilter = document.getElementById(`header-terms-star`);
  // starFilter.onclick = function() {
  //   if (starFilter.classList.contains(`header-terms-star-filled`)) {
  //     starFilter.innerHTML = `☆`;
  //     starFilter.classList.remove(`header-terms-star-filled`);

  //     for (let a = 0; a < data.length; a++) {
  //       document.getElementsByName(`viewer-elem-` + a)[0].classList.remove(`hidden-star`);
  //     }
  //   } else {
  //     starFilter.innerHTML = `★`;
  //     starFilter.classList.add(`header-terms-star-filled`);

  //     // hide all elements which don't match
  //     for (let a = 0; a < data.length; a++) {
  //       let elem = document.getElementsByName(`viewer-elem-` + a)[0];
  //       if (!elem.getElementsByClassName(`viewer-elem-star`)[0].classList.contains(`filled`)) {
  //         elem.classList.add(`hidden-star`);
  //       } else {
  //         elem.classList.remove(`hidden-star`);
  //       }
  //     }
  //   }
  // };

  // we are done loading the website, so reveal it now
  document.body.classList.remove(`loading`);

  // when the user scrolls down 100px from the top of the document, show the button
  // window.addEventListener(`scroll`, () => {
  //   let scrollBoundary = 100;
  //   if (document.body.scrollTop > scrollBoundary || document.documentElement.scrollTop > scrollBoundary) {
  //     document.getElementById(`top-button`).style.display = `block`;
  //   } else {
  //     document.getElementById(`top-button`).style.display = `none`;
  //   }
  // });
}

window.addEventListener(`load`, () => {
  testApplyMobileStyling();

  // load the urops via a request to /data.json
  let data = null;
  requestData(`/data.json`, (responseText) => {
    data = JSON.parse(responseText);
    console.log("Received data:", data);
    onDataLoad(data);
  });
});