export const SEARCHABLE_FIELDS = [
  "title",
  "description",
  "prereqs",
  "faculty",
  "department",
  "contact",
];

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
          SEARCHABLE_FIELDS.forEach(fieldName =>
            show |= reg.test(pane.querySelector(`.${fieldName}`).textContent));
          if (!show) pane.classList.add(`hidden-by-search`);
          else {
            pane.classList.remove(`hidden-by-search`);

            // highlight text from search in both title and full
            // highlight all capitalizations of the search term
            resetSearchableFields(pane);
            SEARCHABLE_FIELDS.forEach(fieldName =>
              replaceInText(
                pane.querySelector(`.${fieldName}`),
                reg,
                `<span class=\"highlighted\">$1</span>`));
          }
        }
      }, 0);
    }
  };
};

export function initHeaderFilterSearch(data) {
  // search bar and its handler
  document.querySelector(`.search`).addEventListener(`input`, curryHandleSearchInput(data));
}
