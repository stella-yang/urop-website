function handleTermFiltersUpdate(data) {
  const selectedTerms = document.querySelectorAll(`.term.selected`);
  const showingTerms = [];
  selectedTerms.forEach(termNode =>
    showingTerms.push(termNode.textContent.toLowerCase()));

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

export function initHeaderFilterTerm(data) {
  // term filters
  document.querySelectorAll(`.filter .term`).forEach((termNode) => {
    termNode.addEventListener(`click`, () => {
      termNode.classList.toggle(`selected`);
      handleTermFiltersUpdate(data);
    });
  });
}
