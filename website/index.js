window.onload = function () {
	//elements
	let viewer = document.getElementById("viewer");
	for (let a = 0; a < data.length; a++) {

		let elem = document.createElement("div");
		viewer.appendChild(elem);
		elem.setAttribute("name", "viewer-elem-" + a);
		elem.className = "viewer-elem";

		let summary = document.createElement("div");
		let main = document.createElement("div");
		elem.appendChild(summary);
		elem.appendChild(main);
		summary.className = "viewer-elem-summary";
		main.className = "viewer-elem-main";

		let date = document.createElement("div");
		let term = document.createElement("div");
		let contact = document.createElement("div");
		summary.appendChild(date);
		summary.appendChild(term);
		summary.appendChild(contact);
		date.className = "viewer-elem-date";
		term.className = "viewer-elem-term";
		contact.className = "viewer-elem-contact";

		let title = document.createElement("div");
		let full = document.createElement("div");
		main.appendChild(title);
		main.appendChild(full);
		title.className = "viewer-elem-title";
		full.className = "viewer-elem-full";

		date.innerHTML = data[a].date;
		contact.innerHTML = "<a href=\"mailto:" + data[a].contact + "\">" + data[a].contact + "</a>";
		title.origHTML = data[a].project_title;
		full.origHTML = data[a].project_desc;
		//full.origHTML = full.origHTML.replace("\n", "<br><br>");
		//full.origHTML = full.origHTML.replace("Prerequisites:", "<b>Prerequisites:</b>");
		title.innerHTML = title.origHTML;
		full.innerHTML = full.origHTML;

		//parsing for terms
		let termList = data[a].term.split(",");
		data[a].termSplit = [];
		for (let b = 0; b < termList.length; b++) {
			let tag = termList[b].trim().toLowerCase();
			data[a].termSplit.push(tag);

			if (tag == "fall" || tag == "iap" || tag == "spring" || tag == "summer") {
				let tagNode = document.createElement("div");
				term.appendChild(tagNode);
				tagNode.className = "header-terms-all viewer-elem-term-elem nofocus noselect";
				tagNode.textContent = termList[b].trim();
				tagNode.style.borderColor = "var(--" + tag + ")";
				tagNode.style.backgroundColor = "var(--" + tag + ")";
			} else {
				//error processing terms, just display string instead
				let tagNode = document.createElement("div");
				term.appendChild(tagNode);

				tagNode.innerText = tag;
				console.log("Error parsing term tags for UROP:", data[a].project_title + ":", termList[b]);
			}
		}
	}

	//search bar
	let search = document.getElementById("header-search");
	search.oninput = function () {
		let text = search.value;

		if (text == "") {
			return;
		}

		//hide all elements which don't match
		for (let a = 0; a < data.length; a++) {
			let elem = document.getElementsByName("viewer-elem-" + a)[0];
			let title = elem.getElementsByClassName("viewer-elem-title")[0];
			let full = elem.getElementsByClassName("viewer-elem-full")[0];
			let show = data[a].project_desc.includes(text) |
				data[a].project_title.includes(text);
			if (!show) {
				elem.classList.add("hidden");

				//unhighlight text
			} else {
				elem.classList.remove("hidden");

				//highlight text from search in both title and full
				title.innerHTML = title.origHTML.replace(text, "<span class=\"highlighted\">" + text + "</span>");
				full.innerHTML = full.origHTML.replace(text, "<span class=\"highlighted\">" + text + "</span>");
			}
		}
	}

	//term filter
	let termNodes = document.getElementById("header").getElementsByClassName("header-terms-all");
	for (let a = 0; a < termNodes.length; a++) {
		let node = termNodes[a];
		let tag = node.textContent.toLowerCase();
		termNodes[a].onclick = function () {
			if (node.classList.contains("selected")) {
				node.classList.remove("selected");
			} else {
				node.classList.add("selected");
			}

			updateTermFilters();
		}
	}
	updateTermFilters();
}

function updateTermFilters() {
	let selected = document.getElementsByClassName("selected");
	let tags = [];
	for (let a = 0; a < selected.length; a++) {
		tags.push(selected[a].id.split("header-terms-")[1]);
	}
	if (tags.length == 0) {
		tags = ["fall", "iap", "spring", "summer"];
	}

	//hide all elements which don't match
	for (let a = 0; a < data.length; a++) {
		let elem = document.getElementsByName("viewer-elem-" + a)[0];
		let show = false;
		for (let b = 0; b < data[a].termSplit.length; b++) {
			if (tags.includes(data[a].termSplit[b])) {
				show = true;
				break;
			}
		}
		if (!show) {
			elem.classList.add("hidden");
		} else {
			elem.classList.remove("hidden");
		}
	}
}