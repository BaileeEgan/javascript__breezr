$(document).ready(function () {
	var TRUE_HTML = $("body").html();
	var ignorePar = false;
	
	var current_note = null;
	var page_info = null;
	
	
	var clearReader = function () {
		$(".breezrspan").replaceWith(function() { return $(this).contents(); });
		
	}
	var applyReader = function () {
		var counter = 0;
		var textLength = 100;
		var index = 0;
		$("p").each(function() {
		  var html = $(this).html();
		  var newHTML = "";

		  var specialChar = false;
		  var inTag = false;
		  var inPar = false;
		  
		  for (var i = 0; i < html.length; i++) {
			var char = html[i];
			
			if (char == "<") inTag = true;
			if (char == ">" && inTag) { inTag = false; continue; }
			
			if (!inTag && char  != " ") {
				//var index = Math.floor((counter % (textLength * 2)) / textLength);
				var prop = (counter % (textLength)) / (textLength);
				
				var color1 = [255, 0, 140];
				var color2 = [140, 60, 240];
				
				var c = (Math.sin(2 * Math.PI * prop + Math.PI / 2) + 1) / 2; 

				var r = 0;
				var g = 0;
				var b = 0;
				
				if (c == 0) { index = (index == 0) ? 1 : 0; }

				if (index == 0) {
					r = Math.floor(color1[0] * c);
					g = Math.floor(color1[1] * c);
					b = Math.floor(color1[2] * c);

				}
				else {				
					r = Math.floor(color2[0] * c);
					g = Math.floor(color2[1] * c);
					b = Math.floor(color2[2] * c);
				}

				var color = "rgb(" + r + "," + g + "," + b + ")";
				var span1 = "<span class = 'breezrspan' style = 'color: " + color + "'>";
				var span2 = "</span>";
				
				if (char == "&") {
					specialChar = true;
					newHTML += span1;
				}
				
				
		  if (char == "." && i + 1 < html.length && html[i + 1] == " ") {
				index = (index == 0) ? 1 : 0;
				counter = (1 - index) * textLength;
				newHTML += span1 + char + span2;
				
			}
				
		  else if (!specialChar) {
			newHTML += span1 + char + span2;
			}
		  else {
			newHTML += char;
		  }
		  
		  if (char == ";" && specialChar) {
					specialChar = false;
					newHTML += span2;
				}
				counter++;
				
			}
			else if (!inTag) {
				newHTML += " ";
			}
		  }
		  $(this).html(newHTML);
		})
	};
	
	var getPageInfo = function () {
		page_info = null;
		d = new Date();
		page_info = {
			"title": $("meta[name='citation_title']").attr("content"),
			"journal": $("meta[name='citation_journal_title']").attr("content"),
			"year": $("meta[name='citation_online_date']").attr("content"),
			"url": window.location.href,
			"date": (d.getDate())  + "/" + (d.getMonth() + 1) + "/" + (d.getFullYear() % 1000),
			"pdf": $("meta[name='citation_pdf_url']").attr("content"),
		};
		
		if (page_info.year) {
			page_info.year = page_info.year.substr(0, 4);
		}
	}
	
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
		if (request.greeting == "getPageInfo") {
			getPageInfo();
			sendResponse(page_info);
		}
		
		if (request.greeting == "getReaderStatus") {
			var reader_status = false;
			if ($(".breezrspan").length > 0) {
				reader_status = true;
			}
			
			sendResponse(reader_status);
		}
		
		if (request.greeting == "toggleReader") {
			applyReader();
			chrome.storage.sync.set({ "reader_status": true });
			
		}
		if (request.greeting == "clearReader") {
			clearReader();
			chrome.storage.sync.set({ "reader_status": false });
		}
		
		/*if (request.greeting == "addNote") {
			getPageInfo();
			if (page_info) {
				chrome.storage.sync.get('library', function(obj) {
					if (obj.library) {
						var library = obj.library;
						var match = -1;
						for (var i = 0; i < library.length; i++) {
							if (page_info.title && library[i].title == page_info.title) {
								match = i;
								break;
							}
						}
						if (match > -1) {
							library[match].notes.push(request.body);
						}
						else {
							var new_note = {
								title: page_info.title,
								year: page_info.year,
								journal: page_info.journal,
								url: page_info.url,
								date: page_info.date,
								keywords: [],
								notes: [],
								pdf_links: [],
							};
							new_note.notes.push(request.body);
							library.push(new_note);
						}
						chrome.storage.sync.set({ "library": library });
					}
					else if (page_info.url && page_info.url.indexOf(".pdf") != -1) {
						if (library[i].pdf_links.indexOf(page_info.url) != -1) {
							library[i].notes.push(request.body);
							chrome.storage.sync.set({ "library": library });
							break;
						}
					}
				})
			}
		}*/
		
	});

});
