$(document).ready(function () {
	var reader_status = false;
	var title_status = false;
	var current_note = null;
	var library = null;
	var pdf_mode = false;
	var delete_note_id = -1;
	
	var theme = {};
	theme.font_color = "midnightblue";
	theme.font_color_highlight = "red";
	
	theme.background_color = "white";
	theme.background_color_highlight = "lavender";
	theme.border_color = "dodgerblue";
	
	var updatePopup = function () {
		
		// Formatting
		$(".breezrnavbutton").css("background", theme.background_color);
		$(".breezrnavbutton").css("border-top-color", theme.border_color);
		$(".breezrnavbutton").css("color", theme.font_color);
		
		// Close loader
		$("#breezrLoader").hide();
		
		// Show buttons
		$("#breezrAddNote").show();
		$("#breezrCurrentNote").show();
		$("#breezrOpenNotes").show();
		
		$("#breezrReaderToggle").show();
		$("#breezrOpenNotes div").hide();
		$("#breezrOpenNotes input").hide();
		
		$("#breezrIndex").show();
		if (page_info.pdf) {
			$("#breezrSave").show();
		}
		
		// Update library length
		$("#breezrOpenNotesButton").html("Open Notes (" + library.length + ")");
		
		// Update current page info
		if (page_info.title) {
			
			$("#breezrCurrentNote").hide();
			$("#breezrAddNote").show();
					
			// Check match against library
			for (var i = 0; i < library.length; i++) {
				if (library[i].title == page_info.title) {
					// Set current note if match is found
					current_note = library[i];
					
					// Adjust UI
					$("#breezrCurrentNote").show();
					$("#breezrAddNote").hide();
					
					// Update contents of current note
					updateCurrentNote();
					
					break;
				}
			}
		}
		else if (pdf_mode) {
			for (var i = 0; i < library.length; i++) {
				if (library[i].pdf_links.indexOf(page_info.url) != -1) {
					current_note = library[i];
					break;
				}
			}
			
			if (current_note) {
				updateCurrentNote();
				$("#breezrCurrentNote").show();
				$("#breezrLoader").show();
				$("#breezrLoader").html("PDF linked");

			}
			else {
				$("#breezrCurrentNote").hide();
				
				$("#breezrLoader").show();
				$("#breezrLoader").html("PDF mode is ON");
			}
			$("#breezrAddNote").hide();
			$("#breezrReaderToggle").hide();
		}
		else {
			$("#breezrAddNote").hide();
			$("#breezrCurrentNote").hide();
			$("#breezrLoader").show();
			$("#breezrLoader").html("No page info found");
			$("#breezrReaderToggle").show();
		}
	}
	
	
	
	chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
		var activeTab = tabs[0];
		chrome.tabs.sendMessage(activeTab.id, {greeting: "getPageInfo"}, function (response) { 
			page_info = response;
			
			if (!page_info.title && page_info.url.indexOf(".pdf") != -1) {
				pdf_mode = true;
			}
			$("#breezrLoader").hide();
			
			chrome.storage.sync.get('library', function(obj) {
				if (obj.library) {
					library = obj.library;
					
					$("#breezrLoader").hide();
					updatePopup();
				}
			});
			
		});
		chrome.tabs.sendMessage(activeTab.id, {greeting: "getReaderStatus"}, function (response) {
			reader_status = response;
			if (reader_status) {
				$("#breezrReaderToggle").html("Reader: ACTIVATED");
			}
			else {
				$("#breezrReaderToggle").html("Reader: INACTIVATED");
			}
		});
		$(".breezrnavbutton").hide();
		$("#breezrLoader").show();
	});
	
	
	chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

		if (request.greeting == "deleteNote" && delete_note_id != -1) {
			if (library[delete_note_id].title == current_note.title) {
				current_note = null;
			}
			library.splice(delete_note_id, 1);
			updateLibrary();
			updatePopup();
			updateNoteList();
			delete_note_id = -1;
		}

	});
	
	$("#breezrReaderToggle").click(function () {
		if (!reader_status) {
			chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
				var activeTab = tabs[0];
				chrome.tabs.sendMessage(activeTab.id, {greeting: "toggleReader"});
			});
			$("#breezrReaderToggle").html("Reader: ACTIVATED");
			reader_status = true;
		}
		else if (reader_status) {
			chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
				var activeTab = tabs[0];
				chrome.tabs.sendMessage(activeTab.id, {greeting: "clearReader"});
			});
			$("#breezrReaderToggle").html("Reader: INACTIVATED");
			reader_status = false;
		}
			
	});
	
	var addNote = function () {
		// Check if there is no note with associated title
		var checkMatch = function (title) {
			for (var i = 0; i < library.length; i++) {
				if (library[i].title == title) {
					return true;
				}
			}
			return false;
		}
		
		// If there is no match, then make new note, set to current note
		if (!checkMatch(page_info.title)) {
			new_note = {
				title: page_info.title,
				year: page_info.year,
				journal: page_info.journal,
				url: page_info.url,
				date: page_info.date,
				keywords: [],
				notes: [],
				pdf_links: [],
			};
			current_note = new_note;
			
			//Update and sync library
			library.push(new_note);
			chrome.storage.sync.set({ "library": library });
			updatePopup();
		}
	}
	
	$("#breezrAddNote").click(function () {
		var new_note = null;
		
		// Check if page has title
		if (page_info.title) {
			addNote();
		}
		else if ($("#breezrAddNote").html() == "New Note") {
			$("#breezrAddNote").html("No contents found");
			setTimeout(function () {$("#breezrAddNote").html("New Note");}, 1000);
		}
	});
	
	$("#breezrOpenNotesButton").click(function () {
		updateNoteList();
		
		$("#breezrOpenNotes div").toggle();
		$("#breezrOpenNotes input").toggle();
		
		if ($("#breezrOpenNotes div").is(":visible")) {
			$("#breezrOpenNotes").css("background",  theme.background_color);
			$("#breezrOpenNotesButton").css("background", theme.background_color_highlight);
		}
		else {
			$("#breezrOpenNotes").css("background", theme.background_color_highlight);
			$("#breezrOpenNotesButton").css("background",  theme.background_color_highlight);
			$("#breezrOpenNotes input").val("Search notes");
		}
	});
	
	var updateCurrentNote = function () {
		var info_html = "";
		$("#breezrCurrentNoteTitle").html(current_note.title);
		
		if (current_note.journal) info_html += current_note.journal;
		
		if (current_note.year) info_html += " (" + current_note.year + ")";
		$("#breezrCurrentNoteInfo").html(info_html);
		$("#breezrCurrentNoteKeywords").html("Keywords: <span>" + current_note.keywords + "</span>");
		
		var note_html = "";
		for (var j = 0; j < current_note.notes.length; j++) {
			if (j != 0) note_html += "<br />";
			note_html += "+  <span class = 'breezrNotesNote'>" + current_note.notes[j] + "</span>";
		}
		$("#breezrCurrentNoteNotesSection").html(note_html);
	}
	
	var updateNoteList = function () {
		var note_html = "";
		for (var i = 0; i < library.length; i++) {
			note_html += "<li class = 'breezrlibrarynote breezrhover' href = '" + library[i].url + "'>";
			var title_split = library[i].title.split(" ");
			var subtitle = "";
			var charcount = 0;
			for (var j = 0; j < title_split.length; j++) {
				if (charcount + title_split[j].length < 60) {
					subtitle += title_split[j] + " ";
					charcount += title_split[j].length;
				}
				else {
					break;
				}
			}
			note_html += subtitle + "... <i>added " + library[i].date + "</i>";
			note_html += "</li>";
		}
		$("#breezrOpenNotes ul").html(note_html);
	}
	
	var updateLibrary = function () {
		for (var i = 0; i < library.length; i++) {
			if (library[i].title == current_note.title) {
				library[i] = current_note;
			}
		}
		chrome.storage.sync.set({ "library": library });
	}
	
	var searchNotes = function (keyword) {
		keyword = keyword.toLowerCase()
		var matches = []
		for (var i = 0; i < library.length; i++) {
			var note = library[i];
			var match = null;
			if (note.title.toLowerCase().indexOf(keyword) != -1) {
				match = { "note": note, "type": "title" };
			}
			for (var j = 0; j < note.keywords.length; j++) {
				if (note.keywords[j].toLowerCase().indexOf(keyword) != -1) {	
					match = { "note": note, "type": "keyword" };
					break;
				}
			}
			for (var j = 0; j < note.notes.length; j++) {
				if (note.notes[j].toLowerCase().indexOf(keyword) != -1){
					match = { "note": note, "type": "notes" };
					break;
				}
			}
			if (match) {
				matches.push(match);
			}
		}
		return matches;
	}
	
	$("#breezrNoteInput").keydown(function (e) {
		if (e.keyCode == 13) {
			if ($(this).val().length > 1) {
				current_note.notes.push($(this).val());
				$(this).val("");
				updateLibrary();
				updateCurrentNote();
			}
			else {
				$(this).val("");
				$(this).blur("");
			}
		}
	});
	
	$(document).on("click", ".breezrNotesNote",function () {
		var id = $(this).index(".breezrNotesNote");
		var text = $(this).text();
		if (text.length > 0) {
			$(this).html("<input type = 'text' class = 'breezrNotesNoteInput' id = 'breezrNotesNoteInput_" + id + "' value = '" + id +"' />");
			$("#breezrNotesNoteInput_" + id).focus();
			$("#breezrNotesNoteInput_" + id).val(text);
		}
	});
	
	$(document).on("keydown focusout", ".breezrNotesNoteInput",function (e) {
		var id = parseInt($(this).attr("id").split("_")[1])
		if (e.type == "focusout" || (e.type == "keydown" && e.keyCode == 13)) {
			if ($(this).val().length > 0) {
				current_note.notes[id] = $(this).val();
				updateLibrary();
				updateCurrentNote();
			}
			else {
				current_note.notes.splice(id, 1);
				updateLibrary();
				updateCurrentNote();
			}
		}
	});
	
	
	$("#breezrOpenNotesSearch").focus(function () {
		if ($(this).val() == "Search notes") {
			$(this).val("");
		}
	});
	
	$("#breezrOpenNotesSearch").keyup(function (e) {
		var note_html = "";
		var val = $("#breezrOpenNotesSearch").val();
		if (val.length > 2) {
			var matches = searchNotes(val);
			for (var i = 0; i < matches.length; i++) {
				var note = matches[i].note;
				note_html += "<li class = 'breezrlibrarynote breezrhover' href = '" + note.url + "'>";
				
				var title_split = note.title.split(" ");
				var subtitle = "";
				var charcount = 0;
				for (var j = 0; j < title_split.length; j++) {
					if (charcount + title_split[j].length < 60) {
						subtitle += title_split[j] + " ";
						charcount += title_split[j].length;
					}
					else {
						break;
					}
				}
				note_html += "<b>In " + matches[i].type + ":</b> ";
				note_html += subtitle + "... <i>added " + note.date + "</i>";
				note_html += "</li>";
			}
		}
		$("#breezrOpenNotes ul").html(note_html);
		
		if (e.keyCode == 13 && (val.length == 0 || $("#breezrOpenNotes li").length == 0)) {
			updateNoteList();
			$(this).val("Search notes");
			$("#breezrOpenNotesSearch").blur();
		}
	});
	
	$("#breezrOpenNotesSearch").blur(function () {
		if ($(this).val() == "" || $("#breezrOpenNotes li").length == 0) {
			$(this).val("Search notes");
			updateNoteList();
		}
	});
	
	$(document).on("mouseenter", ".breezrhover",function () {
		if ($(this).attr("id") == "breezrOpenNotesButton") {
			if (!$("#breezrOpenNotes div").is(":visible")) {
				$("#breezrOpenNotes").css("background", theme.background_color_highlight);
				$(this).css("background", theme.background_color_highlight);
			}
			else {
				$(this).css("background", theme.background_color_highlight);
			}
		}
		else {
			$(this).css("background", theme.background_color_highlight);
		}
	});
	$(document).on("mouseleave", ".breezrhover",function () {
		if ($(this).attr("id") == "breezrOpenNotesButton") {
			$(this).css("background", theme.background_color);
			$("#breezrOpenNotes").css("background", theme.background_color);
		}
		else {
			$(this).css("background",  theme.background_color);
		}
	});
	
	// 
	$(document).on("click", ".breezrlibrarynote",function () {
		if (pdf_mode) {
			// Remove link from previous note
			for (var i = 0; i < library.length; i++) {
				if (library[i].pdf_links.indexOf(page_info.url) != -1) {
					library[i].pdf_links.splice(i, 1);
				}
			}
			
			// Add link to new note
			current_note = library[$(this).index()];
			current_note.pdf_links.push(page_info.url);
			updateLibrary();
			updatePopup();
			
			// Adjust UI message
			$("#breezrLoader").html("PDF link has been changed");
			setTimeout(function () { $("#breezrLoader").html("PDF is linked"); }, 1000);
		}
		else {
			chrome.tabs.create({ url: $(this).attr("href") });
		}
	});
	
	// Code for deleting notes
	$(document).on("mouseenter", ".breezrlibrarynote",function () {
		delete_note_id = $(this).index();
	});
	$(document).on("mouseleave", ".breezrlibrarynote",function () {
		delete_note_id = -1;
	});
	
	$(document).on("click", "#breezrCurrentNoteKeywords",function () {
		if (current_note && $("#breezrCurrentNoteKeywords input").length == 0) {
			var val = "";
			for (var i = 0; i < current_note.keywords.length; i++) {
				if (i != 0) {
					val += ",";
				}
				val += current_note.keywords[i];
			}
			$("#breezrCurrentNoteKeywords span").html("<input type = 'text' id ='#breezrCurrentNoteKeywordsInput' value = '" + val + "' />");
		}
	});
	
	$(document).on("keyup", "#breezrCurrentNoteKeywords input",function (e) {
		if (e.keyCode == 13) {
			if (current_note) {
				val = $(this).val();
				val = val.replace(" , ", ",").replace(", ", ",").replace(" ,", ",");
				current_note.keywords = val.split(",");
				updateLibrary();
				updateCurrentNote();
			}
		}
	});
	
	$(document).on("blur", "#breezrCurrentNoteKeywords input",function () {
		if (current_note) {
			val = $(this).val();
			val = val.replace(" , ", ",").replace(", ", ",").replace(" ,", ",");
			current_note.keywords = val.split(",");
			updateLibrary();
			updateCurrentNote();
		}
	});
	
	
	$(document).on("click", "#breezrSave",function () {
		if (page_info && page_info.pdf) {
			chrome.tabs.create({ url: page_info.pdf });
		}
		else if ($("#breezrSave").html() == "Save PDF") {
			$("#breezrSave").html("No PDF found");
			setTimeout(function () {$("#breezrSave").html("Save PDF");}, 1000);
		}
	});
	$(document).on("click", "#breezrIndex",function () {
		window.open(chrome.runtime.getURL('index.html'));
	});
		
});