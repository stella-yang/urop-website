import {
  getCookie,
  setCookie
} from "./index.cookie.js";

export function curryHandlePaneClicked(pane) {
  return (event) => {
    pane.classList.toggle(`starred`);

    // save the starred state
    let starredUrls = JSON.parse(getCookie(`starred`));
    const paneUrl = pane.querySelector(`.detail-link`).href;
    if (starredUrls.includes(paneUrl))
      starredUrls = starredUrls.filter(url => url !== paneUrl);
    else starredUrls.push(paneUrl);
    setCookie(`starred`, JSON.stringify(starredUrls), { "max-age": 2147483647 });
  };
}

function handleStarFilterClicked(event) {
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

export function initHeaderFilterStar(data) {
  document.querySelector(`.filter .star`)
  .addEventListener(`click`, handleStarFilterClicked);

  // get the starred panes and star them
  const starredCookie = getCookie(`starred`);
  if (starredCookie !== undefined) {
    const starredUrls = JSON.parse(starredCookie);
    for (let a = 0; a < data.length; a++) {
      if (starredUrls.includes(data[a].url)) {
        document.querySelector(`.pane-${a}`).classList.add(`starred`);
      }
    }
  } else {
    // set the cookie as empty
    setCookie(`starred`, JSON.stringify([]), { "max-age": 2147483647 });
  }
}
