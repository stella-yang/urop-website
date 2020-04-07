import { initReturnTop } from "./index.return-top.js";
import {
  getCookie,
  setCookie,
  deleteCookie
} from "./index.cookie.js";
import { requestData } from "./index.request-data.js";
import { testApplyMobileStyling } from "./index.mobile.js";

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

const EMAIL_REGEX = /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i;

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
  selectedTerms.forEach(termNode =>
    showingTerms.push(termNode.textContent.toLowerCase()));
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

function createPane(info) {
  const pane = document.querySelector(`.viewer>template`).content
    .cloneNode(true).querySelector(`.pane`);

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
  initReturnTop();

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

  // We are done loading the website, so reveal it now.
  document.body.classList.add(`loaded`);
}

window.addEventListener(`load`, () => {
  testApplyMobileStyling();

  // Load the urops via a request to /data.json.
  requestData(`/data.json`, (responseText) =>
    handleLoadData(JSON.parse(responseText)));

  // Load the sub count.
  requestData(`/subscription/count.json`, (responseText) =>
    document.querySelector(`.subscribe .count`).innerHTML = JSON.parse(responseText));
});
