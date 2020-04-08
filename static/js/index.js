import { initReturnTop } from "./index.return-top.js";
import { requestData } from "./index.request-data.js";
import { testApplyMobileStyling } from "./index.mobile.js";
import { initHeaderDarkMode } from "./index.header.dark-mode.js";
import { initHeaderFilterStar } from "./index.header.filter.star.js";
import { initHeaderFilterTerm } from "./index.header.filter.term.js";
import { initHeaderSubscribe } from "./index.header.subscribe.js";
import { initViewer } from "./index.viewer.js";
import { initHeaderFilterSearch } from "./index.header.filter.search.js";

function handleLoadData(data) {

  // Imported initializers.
  initViewer(data);
  initReturnTop();
  initHeaderDarkMode();
  initHeaderFilterStar(data);
  initHeaderFilterTerm(data);
  initHeaderFilterSearch(data);
  initHeaderSubscribe();

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
