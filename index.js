
$(document).ready(function() {
	chrome.storage.sync.get('library', function(obj) {
		if (obj.library) {
			var html = "";
			library = obj.library;
			for (var i = 0; i < library.length; i++) {
				var note = library[i];
				
				html += "<h2 class = 'notetitle'>"+ note.title + "</h2>";
				html += "<ul>";
				
				
				var schol_url = "https://scholar.google.com/scholar?hl=en&as_sdt=0%2C15&q=" + note.title.replace(" ", "+").replace("'", "%27").replace(",", "%2C").replace(":", "%3A").replace("/", "%2F").replace(";", "%3B").replace("-", '"-"') + "&btnG=";
				html += "<li class = 'notescholar'><a target='_blank' href = '" + schol_url + "'>Google Scholar</a></li>";
				
				if (note.year) {
					html += "<li class = 'noteyear'>(" + note.year + ")</li>";
				}
				if (note.journal) {
					html += "<li class = 'notejournal'>Published in: " + note.journal + "</li>";
				}
				html += "<li class = 'noteurl'><a target='_blank' href = '" + note.url + "'>" + note.url + "</a></li>";
				
				html += "<li class = 'notedate'>Date Added: " + note.date + "</li>";
				html += "<li class = 'notekeywords'><b>Keywords: " + note.keywords + "</b></li>";
				
				if (note.notes.length > 0){
					html += "<li><b>Notes:</b></li>";
					html += "<ul>";
					for (var j = 0; j < note.notes.length; j++) {
						html += "<li class = 'notenotes'>" + note.notes[j] + "</li>";
					}
					html += "</ul>";
				}
				
				html += "</ul>";
			}
			
			$("#index").html(html);
		}
	});
});