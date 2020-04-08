import { curryHandlePaneClicked } from "./index.header.filter.star.js";
import { SEARCHABLE_FIELDS } from "./index.header.filter.search.js";

function createPane(info) {
	const TERM_CLASS_TO_LABEL = {
		"fall": "Fall",
		"iap": "IAP",
		"spring": "Spring",
		"summer": "Summer",
	};

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

export function initViewer(data) {
	// create all the elements for the UROPs
  const viewer = document.querySelector(`.viewer`);
  for (let a = 0; a < data.length; a++) {
    const pane = createPane(data[a]);
    pane.classList.add(`pane-${a}`);
    viewer.appendChild(pane);
  }
}
