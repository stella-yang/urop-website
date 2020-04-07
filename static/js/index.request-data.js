// send xhr for data
export function requestData(url, onResponse) {
  const xhr = new XMLHttpRequest();
  xhr.open(`GET`, url, true);
  xhr.onreadystatechange = () => {
    if (xhr.readyState !== 4) return;
    if (xhr.status !== 200) onResponse(null);
    else onResponse(xhr.responseText);
  };
  xhr.send();
};
