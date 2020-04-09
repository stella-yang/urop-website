import {
  getCookie,
  setCookie
} from "./index.cookie.js";

export function initHeaderDarkMode() {
  const darkModeCookie = getCookie(`dark-mode`);
  let darkMode;
  if (darkModeCookie !== undefined) darkMode = JSON.parse(darkModeCookie);
  else darkMode = window.matchMedia(`(prefers-color-scheme: dark)`).matches;
  if (darkMode) document.documentElement.classList.add(`dark-mode`);
	else document.documentElement.classList.remove(`dark-mode`);
	
	const setDarkModeCookie = function() {
		setCookie(`dark-mode`,
		JSON.stringify(
			document.documentElement.classList.contains(`dark-mode`)
		), { "max-age": 2147483647 });
	};
	setDarkModeCookie();
  document.querySelector(`.splash .dark-mode-toggle`).addEventListener(`click`, () => {
    document.documentElement.classList.toggle(`dark-mode`);
    setDarkModeCookie();
  });
}
