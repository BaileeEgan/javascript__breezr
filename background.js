
/*chrome.contextMenus.create({
  title: "breezr note: %s", 
  contexts:["selection"], 
  onclick: function (info,tab) {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
		  chrome.tabs.sendMessage(tabs[0].id, {greeting: "addNote", body: info.selectionText});
		});
	}
});*/


chrome.contextMenus.create({
	title: "Delete Note",
	onclick: function (info,tab) {
		chrome.runtime.sendMessage({greeting: "deleteNote"});
	}
});


	
//	chrome.storage.sync.set({ "library": [] });
/*chrome.storage.sync.get('library', function(obj) {
	if (typeof obj.library === "undefined") {
		chrome.storage.sync.set({ "library": [] });
	}
})*/