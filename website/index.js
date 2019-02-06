window.onload = function () {
	//create all the elements for the UROPs
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
		let department = document.createElement("div");
		summary.appendChild(date);
		summary.appendChild(term);
		summary.appendChild(contact);
		summary.appendChild(department);
		date.className = "viewer-elem-date";
		term.className = "viewer-elem-term";
		contact.className = "viewer-elem-contact";
		department.className = "viewer-elem-department";

		let title = document.createElement("div");
		let full = document.createElement("div");
		main.appendChild(title);
		main.appendChild(full);
		title.className = "viewer-elem-title";
		full.className = "viewer-elem-full";

		date.innerHTML = data[a].date;

		let contactSplit = data[a].contact.split(",");
		for (let b = 0; b < contactSplit.length; b++) {
			contact.innerHTML += "<a href=\"mailto:" + contactSplit[b] + "\">" + contactSplit[b] + "</a>";
			if (b < contactSplit.length - 1) {
				contact.innerHTML += "<br>";
			}
		}

		department.origHTML = data[a].department;
		department.innerHTML = department.origHTML;
		title.origHTML = data[a].project_title;
		full.origHTML = data[a].project_desc;
		title.innerHTML = title.origHTML;
		full.innerHTML = full.origHTML;

		//parsing for terms
		let termList = data[a].term.split(",");

		//the term element split by commas
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
				tagNode.className = "viewer-elem-term-elem-text nofocus noselect";

				tagNode.innerText = tag;
				console.log("Error parsing term tags for UROP:", data[a].project_title + ":", termList[b] + ".", "This UROP post will only be shown if no term filters are selected.");
			}
		}
	}

	//search bar and its handler
	let search = document.getElementById("header-search");
	search.oninput = function () {
		let text = search.value;

		//hide all elements which don't match
		for (let a = 0; a < data.length; a++) {
			let elem = document.getElementsByName("viewer-elem-" + a)[0];
			let title = elem.getElementsByClassName("viewer-elem-title")[0];
			let full = elem.getElementsByClassName("viewer-elem-full")[0];
			let department = elem.getElementsByClassName("viewer-elem-department")[0];

			//whenever hidden is removed, we'll also unhighlight the text, so it should be okay
			if (text == "") {
				elem.classList.remove("hidden-search");
				title.innerHTML = title.origHTML;
				full.innerHTML = full.origHTML;
				department.innerHTML = department.origHTML;
			} else {
				let reg = new RegExp("(" + text.replace(
						/[\[\]\\{}()+*?.$^|]/g,
						function (match) {
							return '\\' + match;
						}) +
					")", "gi");
				let show = reg.test(data[a].project_desc) |
					reg.test(data[a].project_title) |
					reg.test(data[a].department);
				if (!show) {
					elem.classList.add("hidden-search");
				} else {
					elem.classList.remove("hidden-search");

					//highlight text from search in both title and full
					//highlight all capitalizations of the search term
					title.innerHTML = title.origHTML.replace(reg, "<span class=\"highlighted\">$1</span>");
					full.innerHTML = full.origHTML.replace(reg, "<span class=\"highlighted\">$1</span>");
					department.innerHTML = department.origHTML.replace(reg, "<span class=\"highlighted\">$1</span>");
				}
			}
		}
	}

	//term filter
	let termNodes = document.getElementById("header").getElementsByClassName("header-terms-all");
	for (let a = 0; a < termNodes.length; a++) {
		let node = termNodes[a];
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

//function which is called every time one of the term filters is clicked to filter out the urop cells
function updateTermFilters() {
	let selected = document.getElementsByClassName("selected");
	let tags = [];

	//this variable is set when no tags are clicked; i.e. all posts should be shown
	let noTagsSelected = false;

	for (let a = 0; a < selected.length; a++) {
		tags.push(selected[a].id.split("header-terms-")[1]);
	}
	if (tags.length == 0) {
		noTagsSelected = true;
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

		//if the term split tags contain any terms not of the four terms and also no tags are selected, then show the post
		if (noTagsSelected) {
			for (let b = 0; b < data[a].termSplit.length; b++) {
				if (data[a].termSplit[b] != "fall" &&
					data[a].termSplit[b] != "iap" &&
					data[a].termSplit[b] != "spring" &&
					data[a].termSplit[b] != "summer") {
					show = true;
					break;
				}
			}
		}

		if (!show) {
			elem.classList.add("hidden-term");
		} else {
			elem.classList.remove("hidden-term");
		}
	}
}
