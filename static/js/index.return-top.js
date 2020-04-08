export function initReturnTop() {
  const TOP_BUTTON_THRESHOLD = 200;

  document.querySelector(`.return-top`).addEventListener(`click`, () => {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  });

  // When the user scrolls down 100px from the top of the document, show the button.
  window.addEventListener(`scroll`, () => {
    if (document.body.scrollTop > TOP_BUTTON_THRESHOLD ||
      document.documentElement.scrollTop > TOP_BUTTON_THRESHOLD)
      document.querySelector(`.return-top`).classList.remove(`no-display`);
    else document.querySelector(`.return-top`).classList.add(`no-display`);
  });
}
