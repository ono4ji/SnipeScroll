var snipescroll = {
	initToolbarButton: function(){
		var cu = document.getElementById("snipescroll-toolbar-button");
		if(cu){
			var prefs = Components.classes["@mozilla.org/preferences-service;1"]
		                          .getService(Components.interfaces.nsIPrefService).getBranch("extensions.snipescroll.");
			cu.setAttribute("snipescrollOn",prefs.getBoolPref("scrollable"));
		}
	},

	onToolbarButtonCommand: function(e) {
		var cu = document.getElementById("snipescroll-toolbar-button");
		if (cu){
			var prefs = Components.classes["@mozilla.org/preferences-service;1"]
			                    .getService(Components.interfaces.nsIPrefService).getBranch("extensions.snipescroll.");
			if( prefs.getBoolPref("scrollable") ){
				prefs.setBoolPref("scrollable", false);
				cu.setAttribute("snipescrollOn",false);
			}else{
				prefs.setBoolPref("scrollable", true);
				cu.setAttribute("snipescrollOn",true);
			}
		}
	},
	
	onclick: function(event){
		if( snipescroll.isScrollable(event) ){
			snipescroll.scroll(event);
		}
	},
	
	isScrollable: function(event){
		//Application.console.log("event.detail " + event.detail + ",event.target " + event.target + ",event.currentTarget " + event.currentTarget);
		//Application.console.log("event.clientX " + event.clientX + ", event.pageX " + event.pageX + ",event.layerX " + event.layerX + ",event.screenX " + event.screenX);
		//Application.console.log("event.clientY " + event.clientY + ", event.pageY " + event.pageY + ",event.layerY " + event.layerY + ",event.screenY " + event.screenY);
		
		var prefs = Components.classes["@mozilla.org/preferences-service;1"]
		                    .getService(Components.interfaces.nsIPrefService).getBranch("extensions.snipescroll.");
		if( !prefs.getBoolPref("scrollable") ){
			return false;
		}
		
		var clickMode = prefs.getIntPref("clickmode");
		if( (clickMode == 1 && event.button == 1 && event.detail == 1) || //middle click
		    (clickMode == 2 && event.button == 2 && event.detail == 2) ){ //double right click

			var t = event.target;
			if((!(t instanceof XULElement)) && (t instanceof HTMLElement || t instanceof Element)){
				event.preventDefault();
				event.stopPropagation();
				
				if( clickMode == 2 ){
					var contextMenu = document.getElementById("contentAreaContextMenu");
					contextMenu.hidePopup();
					document.addEventListener("contextmenu" , snipescroll.preventContextmenu ,false);
				}
				return true;
			}else{
				return false;
			}
		}
	},
	
	preventContextmenu: function(event){
		event.preventDefault();
		event.stopPropagation();
		document.removeEventListener("contextmenu" , snipescroll.preventContextmenu ,false);
	},
	
	scroll: function(event){
		const PANEL_HALF_WIDTH = 24;
		const PANEL_WIDTH = PANEL_HALF_WIDTH * 2;
		
		Components.utils.import('resource://snipescroll-modules/animationManager.js');
		animationManager.removeAllTasks();

		var panel = document.getElementById("snipescroll-arrow");
		panel.style.opacity = 1;
		
		panel.openPopup(gBrowser, "overlap", event.clientX-PANEL_HALF_WIDTH, event.clientY+PANEL_HALF_WIDTH, false, false);
		panel.moveTo(event.screenX-PANEL_WIDTH, event.screenY);

		var prefs = Components.classes["@mozilla.org/preferences-service;1"]
		                    .getService(Components.interfaces.nsIPrefService).getBranch("extensions.snipescroll.");
		var topspan = prefs.getIntPref("topspan");

		var currentHeight = event.pageY - event.clientY;
		var move = event.clientY - topspan;

		var body = event.originalTarget.ownerDocument.body;
		var doc = event.originalTarget.ownerDocument.documentElement;
		var scrollTarget = (doc.scrollHeight != doc.clientHeight) ? doc : body;

		var maxHeight = scrollTarget.scrollHeight - scrollTarget.clientHeight;
		move = Math.min( move ,maxHeight - currentHeight);
		move = Math.max( move , 0);

		//Application.console.log("maxHeight " + maxHeight + ",move" + move);
		//Application.console.log("doc.scrollHeight:" + doc.scrollHeight + ",body.scrollHeight:" +body.scrollHeight);
		//Application.console.log("doc.clientHeight:" + doc.clientHeight + ",body.clientHeight:" +body.clientHeight);
		//Application.console.log("currentH:" + currentHeight + ",maxHeight:" +maxHeight+ ",move:" + move);
		//Application.console.log("zoom:" + gBrowser.mCurrentBrowser.markupDocumentViewer.fullZoom);
		var zoom = gBrowser.mCurrentBrowser.markupDocumentViewer.fullZoom;
		
		var task = function(aTime, aBeginningValue, aTotalChange, aDuration) {
			var dmove = (aTime / aDuration * aTotalChange);
			scrollTarget.scrollTop = parseInt(aBeginningValue + dmove);
			panel.moveTo(event.screenX-PANEL_WIDTH, event.screenY - dmove * zoom );
			//Application.console.log("scrollTop:" + parseInt(aBeginningValue + dmove) + ",moveTo:" + parseInt(event.screenY - dmove * zoom));
			
			if(aTime >= aDuration){
				snipescroll.hidePopup();
			}
			return aTime > aDuration;
		};

		animationManager.addTask(task, currentHeight, move, 250);
	},
	
	hidePopup: function(){
		Components.utils.import('resource://snipescroll-modules/animationManager.js');
		var panel = document.getElementById("snipescroll-arrow");
		
		var task = function(aTime, aBeginningValue, aTotalChange, aDuration) {
			panel.style.opacity = (aBeginningValue - aTime / aDuration * aTotalChange);
			if(aTime >= aDuration){
				panel.hidePopup();
			}
			return aTime > aDuration;
		};
		animationManager.addTask(task, 1, 1, 250);
	},
	
};

document.addEventListener("mouseup", snipescroll.onclick, false);