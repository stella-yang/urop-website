const TERM_CLASS_TO_LABEL = {
  "fall": "Fall",
  "iap": "IAP",
  "spring": "Spring",
  "summer": "Summer",
};

const SEARCHABLE_FIELDS = [
  "title",
  "description",
  "prereqs",
  "faculty",
  "department",
  "contact",
];

const TOP_BUTTON_THRESHOLD = 200;

const EMAIL_REGEX = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

// returns the cookie with the given name,
// or undefined if not found
function getCookie(name) {
  let matches = document.cookie.match(new RegExp(
    "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
  ));
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

function setCookie(name, value, options = {}) {

  options = {
    path: '/',
    // add other defaults here if necessary
    ...options
  };

  if (options.expires && options.expires.toUTCString) {
    options.expires = options.expires.toUTCString();
  }

  let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

  for (let optionKey in options) {
    updatedCookie += "; " + optionKey;
    let optionValue = options[optionKey];
    if (optionValue !== true) {
      updatedCookie += "=" + optionValue;
    }
  }

  document.cookie = updatedCookie;
}

function deleteCookie(name) {
  setCookie(name, "", {
    'max-age': -1
  })
}

// send xhr for data
function requestData(url, onResponse) {
  const xhr = new XMLHttpRequest();
  xhr.open(`GET`, url, true);
  xhr.onreadystatechange = () => {
    if (xhr.readyState !== 4) return;
    if (xhr.status !== 200) onResponse(null);
    else onResponse(xhr.responseText);
  };
  xhr.send();
};

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

function curryHandlePaneClicked(pane) {
  return (event) => {
    console.log(`Pane was clicked.`);

    pane.classList.toggle(`starred`);

    // save the starred state
    let starredUrls = JSON.parse(getCookie(`starred`));
    const paneUrl = pane.querySelector(`.detail-link`).href;
    if (starredUrls.includes(paneUrl)) {
      starredUrls = starredUrls.filter(url => url !== paneUrl);
    } else {
      starredUrls.push(paneUrl);
    }
    console.log("Set starred cookie:", starredUrls);
    setCookie(`starred`, JSON.stringify(starredUrls), { "max-age": 2147483647 });
  };
}

function createPane(info) {
  const pane = document.querySelector(`.template.pane`).cloneNode(true);
  pane.classList.remove(`template`);

  pane.querySelector(`.title`).innerHTML = info.title;
  pane.querySelector(`.detail-link`).href = info.url;
  pane.querySelector(`.description`).innerHTML = info.description;
  pane.querySelector(`.prereqs`).innerHTML = info.prereqs;

  // create terms tags
  const termsNode = pane.querySelector(`.terms`);
  if (info.term.length === 0) {
    termsNode.classList.add(`hidden`);
  } else {
    info.term.forEach((validTerm) => {
      const termNode = document.createElement(`div`);
      termNode.classList.add(`term`, `no-select`, `no-focus`, validTerm);
      termNode.innerHTML = TERM_CLASS_TO_LABEL[validTerm];
      termsNode.appendChild(termNode);
    });
  }

  pane.querySelector(`.faculty`).innerHTML = info.faculty_supervisor;
  pane.querySelector(`.department`).innerHTML = info.department;
  if (info.contact === "") {
    pane.querySelector(`.contact`).classList.add(`hidden`);
  } else {
    pane.querySelector(`.contact`).innerHTML = `<a href=\"mailto:${info.contact}\">${info.contact}</a>`;
  }
  if (info.apply_by === "") {
    pane.querySelector(`.due`).classList.add(`hidden`);
  } else {
    pane.querySelector(`.due`).innerHTML = "Due: " + info.apply_by;
  }
  if (info.apply_by_passed) {
    pane.querySelector(`.due`).classList.add(`passed`);
  }
  pane.querySelector(`.posted`).innerHTML = "Posted: " + info.posted;

  // allow for starring by clicking pane
  pane.addEventListener(`click`, curryHandlePaneClicked(pane));

  // disable detail-link from spawning click events
  pane.querySelectorAll(`a`).forEach((link) => { link.addEventListener(`click`, (event) => { event.stopPropagation(); }); });

  // initialize original innerHTML copies to facilitate search
  SEARCHABLE_FIELDS.forEach((fieldName) => {
    const field = pane.querySelector(`.${fieldName}`);
    field.origHTML = field.innerHTML;
  });

  return pane;
};

function resetSearchableFields(pane) {
  SEARCHABLE_FIELDS.forEach((fieldName) => {
    const field = pane.querySelector(`.${fieldName}`);
    field.innerHTML = field.origHTML;
  });
};

function curryHandleSearchInput(data) {
  return () => {
    const search = document.querySelector(`.search`);
    const text = search.value;

    // hide all elements which don't match
    for (let a = 0; a < data.length; a++) {
      // setTimeout for async and faster search
      setTimeout(() => {
        // only keep on processing if the current text is the same as the search bar still, which might not be the case if they type too fast
        if (text != search.value) {
          return;
        }

        const pane = document.querySelector(`.pane-${a}`);

        // whenever hidden is removed, we'll also unhighlight the text, so it should be okay
        if (text.length == 0) {
          pane.classList.remove(`hidden-by-search`);
          resetSearchableFields(pane);
        } else {
          const reg = new RegExp(`(` + text.replace(
              /[\[\]\\{}()+*?.$^|]/g,
              function(match) {
                return '\\' + match;
              }) +
            `)`, `gi`);
          let show = false;
          SEARCHABLE_FIELDS.forEach((fieldName) => { show |= reg.test(pane.querySelector(`.${fieldName}`).textContent); });
          if (!show) {
            pane.classList.add(`hidden-by-search`);
          } else {
            pane.classList.remove(`hidden-by-search`);

            // highlight text from search in both title and full
            // highlight all capitalizations of the search term
            resetSearchableFields(pane);
            SEARCHABLE_FIELDS.forEach((fieldName) => { replaceInText(pane.querySelector(`.${fieldName}`), reg, `<span class=\"highlighted\">$1</span>`); });
          }
        }
      }, 0);
    }
  };
};

function handleTermFiltersUpdate(data) {
  const selectedTerms = document.querySelectorAll(`.term.selected`);
  const showingTerms = [];
  selectedTerms.forEach((termNode) => { showingTerms.push(termNode.textContent.toLowerCase()); });
  console.log(`Applying term filter: ${showingTerms}`);

  // if no tags clicked, then all posts are shown, even if the term tags were not parsed
  // conditionally show hints
  if (showingTerms.length === 0) {
    document.querySelector(`.hint-term`).classList.add(`no-display`);
  } else {
    document.querySelector(`.hint-term`).classList.remove(`no-display`);
  }

  // hide all elements which don't match
  for (let a = 0; a < data.length; a++) {
    const pane = document.querySelector(`.pane-${a}`);
    let show = showingTerms.length === 0;
    if (!show) {
      data[a].term.forEach((term) => { show |= showingTerms.includes(term); });
    }

    if (!show) {
      pane.classList.add(`hidden-by-term`);
    } else {
      pane.classList.remove(`hidden-by-term`);
    }
  }
};

function testApplyMobileStyling() {
  // detect if mobile and apply separate styling
  if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) ||
    /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
    document.body.classList.add(`mobile`);
    document.documentElement.classList.add(`mobile`);
  }
}

function handleStarFilterClicked(event) {
  console.log(`Star filter clicked.`);
  const star = document.querySelector(`.filter .star`);
  star.classList.toggle(`selected`);

  if (star.classList.contains(`selected`)) {
    document.querySelectorAll(`.pane`).forEach((pane) => {
      if (pane.classList.contains(`starred`)) {
        pane.classList.remove(`hidden-by-star`);
      } else {
        pane.classList.add(`hidden-by-star`);
      }
    });

    // show the end hint
    document.querySelector(`.hint-star`).classList.remove(`no-display`);
  } else {
    document.querySelectorAll(`.pane`).forEach((pane) => {
      pane.classList.remove(`hidden-by-star`);
    });

    document.querySelector(`.hint-star`).classList.add(`no-display`);
  }
}

// when the user clicks on the button, scroll to the top of the document
function scrollToTop() {
  document.body.scrollTop = 0;
  document.documentElement.scrollTop = 0;
}

function handleSubscribeInput() {
  const textField = document.querySelector(`.subscribe input`);
  const subscribeButton = document.querySelector(`.subscribe .button`);
  const text = textField.value;
  if (EMAIL_REGEX.test(text)) {
    // if not disabled, check whether it should be selected or not
    requestData(`/subscription/check/${text}`, (responseText) => {
      const inList = JSON.parse(responseText);
      subscribeButton.classList.remove(`disabled`);

      if (inList) {
        subscribeButton.classList.add(`selected`);
      } else {
        subscribeButton.classList.remove(`selected`);
      }
    });
  } else {
    subscribeButton.classList.add(`disabled`);
    subscribeButton.classList.remove(`selected`);
  }

  // save state of this input as a cookie
  setCookie(`subscribe-email`, text, { "max-age": 2147483647 })
}

function handleSubscribeToggle() {
  const textField = document.querySelector(`.subscribe input`);
  const subscribeButton = document.querySelector(`.subscribe .button`);
  const text = textField.value;
  if (EMAIL_REGEX.test(text)) {
    requestData(`/subscription/toggle/${text}`, () => {
      // reload sub count
      requestData(`/subscription/count.json`, (responseText) => {
        subscribeButton.classList.toggle(`selected`);
        document.querySelector(`.subscribe .count`).innerHTML = JSON.parse(responseText);
      });
    });
  }
}

function handleLoadData(data) {
  // create all the elements for the UROPs
  const viewer = document.querySelector(`.viewer`);
  for (let a = 0; a < data.length; a++) {
    const pane = createPane(data[a]);
    pane.classList.add(`pane-${a}`);
    viewer.appendChild(pane);
  }

  // get the starred panes and star them
  const starredCookie = getCookie(`starred`);
  if (starredCookie !== undefined) {
    const starredUrls = JSON.parse(starredCookie);
    console.log("Got starred cookie:", starredUrls);
    for (let a = 0; a < data.length; a++) {
      if (starredUrls.includes(data[a].url)) {
        document.querySelector(`.pane-${a}`).classList.add(`starred`);
      }
    }
  } else {
    // set the cookie as empty
    setCookie(`starred`, JSON.stringify([]), { "max-age": 2147483647 });
  }

  // search bar and its handler
  document.querySelector(`.search`).addEventListener(`input`, curryHandleSearchInput(data));

  // term filters
  document.querySelectorAll(`.filter .term`).forEach((termNode) => {
    termNode.addEventListener(`click`, () => {
      termNode.classList.toggle(`selected`);
      handleTermFiltersUpdate(data);
    });
  });

  // star filter
  document.querySelector(`.filter .star`).addEventListener(`click`, handleStarFilterClicked);

  // when the user scrolls down 100px from the top of the document, show the button
  document.querySelector(`.top-button`).addEventListener(`click`, scrollToTop);
  window.addEventListener(`scroll`, () => {
    if (document.body.scrollTop > TOP_BUTTON_THRESHOLD || document.documentElement.scrollTop > TOP_BUTTON_THRESHOLD) {
      document.querySelector(`.top-button`).classList.remove(`no-display`);
    } else {
      document.querySelector(`.top-button`).classList.add(`no-display`);
    }
  });

  // prep the subscription form
  document.querySelector(`.subscribe input`).addEventListener(`input`, handleSubscribeInput);
  document.querySelector(`.subscribe input`).addEventListener(`keypress`, (event) => {
    if (event.key === "Enter") {
      handleSubscribeToggle();
    }
  });
  const subscribeEmailCookie = getCookie(`subscribe-email`);
  if (subscribeEmailCookie !== undefined) {
    console.log("Loaded subscribe email cookie:", subscribeEmailCookie);
    document.querySelector(`.subscribe input`).value = subscribeEmailCookie;
  }
  handleSubscribeInput();
  document.querySelector(`.subscribe .button`).addEventListener(`click`, handleSubscribeToggle);

  // we are done loading the website, so reveal it now
  document.body.classList.remove(`loading`);
  console.log(`Data load complete.`);
}

window.addEventListener(`load`, () => {
  testApplyMobileStyling();

  // load the urops via a request to /data.json
  requestData(`/data.json`, (responseText) => {
    const data = JSON.parse(responseText);
    console.log("Received data:", data);
    handleLoadData(data);
  });

  // load the sub count
  requestData(`/subscription/count.json`, (responseText) => {
    const subCount = JSON.parse(responseText);
    console.log("Loaded subscriber count:", responseText);
    document.querySelector(`.subscribe .count`).innerHTML = subCount;
  });
});
