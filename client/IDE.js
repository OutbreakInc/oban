////////////////////////////////////////////////////////////////

Array.prototype.merge = function(appendage)
{
	var arr = appendage;
	arr.unshift(0);
	arr.unshift(appendage.length + 1);
	Array.prototype.splice.apply(this, arr);
	return(this);
}

Function.prototype.ob_bind = function(thisObj)
{
	var __method = this, args = Array.prototype.slice.call(arguments, 1);
	return(function(){Array.prototype.merge.call(arguments, args); return(__method.apply(thisObj, arguments));});
};

String.prototype.trim = function()
{
	var	str = String.prototype.replace.call(this, /^\s\s*/, ''), ws = /\s/, i = str.length;
	while(ws.test(String.prototype.charAt.call(str, --i)));
	return(String.prototype.slice.call(str, 0, i + 1));
};

String.prototype.padFront = function(length, char)
{
	var l = this.length;
	var s = this;
	if(char == undefined)	char = " ";
	if(length > l)
	{
		for(var i = 0; i < (length - l); i++)
			s = char + s;
	}
	return(s);
};

var Range = require("ace/range").Range;

Date.prototype.months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
Date.prototype.toCompactString = function()
{
	var tzHours = (Date.prototype.getTimezoneOffset.call(this) / -60);
	return(		Date.prototype.getDate.call(this).toString().padFront(2, "0") +
				Date.prototype.months[Date.prototype.getMonth.call(this)] +
				Date.prototype.getFullYear.call(this) +
				"/" +
				Date.prototype.getHours.call(this).toString().padFront(2, "0") +
				Date.prototype.getMinutes.call(this).toString().padFront(2, "0") +
				Date.prototype.getSeconds.call(this).toString().padFront(2, "0") +
				((tzHours >= 0)? "+" : "") +
				tzHours
			);
};

if(JSON == undefined){JSON = {"parse": function(str){return(eval("(" + str + ")"));}};}

////////////////////////////////

function setBreakpoint(line, isSet)
{
	if (isSet)
	{
		document.socket.emit("gdb_break", line);
	}
	else
	{
		document.socket.emit("gdb_command", "clear " + line);
	}
}

function createElement(type, classes)
{
	var e = document.createElement(type);
	e.className += (" " + classes);
	return(e);
}

EditorTab.prototype =
{
	tabElem: null,
	editElem: null,
	editor: null,
	tabContainer: null,
	selected: false,
	
	Select: function(selected)
	{
		this.selected = selected;
		if(selected)
		{
			$(this.pageElem).removeClass("startHidden");
			this.editor.focus();
			this.editor.resize();
		}
		else
		{
			$(this.pageElem).addClass("startHidden");
			this.editor.blur();
		}
	},
	Remove: function()
	{
		$(this.pageElem).remove();
	},
}
function EditorTab(tabContainer, sourceFile)
{
	this.pageElem = document.createElement("div");
	this.pageElem.className += " tabPage";
	this.editElem = document.createElement("div");
	this.editElem.className += " editor";
	this.pageElem.appendChild(this.editElem);
	this.tabContainer = tabContainer;
	this.tabContainer.appendChild(this.pageElem);
	
	$(this.pageElem).addClass("startHidden");
	
	this.editor = ace.edit(this.editElem);
	
	this.editor.setTheme("ace/theme/chrome");
	
	this.editElem.style.fontSize="11px";
	
	var ACECPlusPlusMode = require("ace/mode/c_cpp").Mode;
	var session = this.editor.getSession();
	
	session.setValue("int main(void)\n{\n\twhile(true)\n\t{\n\t\tLED1 = (led = !led);\n\t}\n}");
	session.setMode(new ACECPlusPlusMode());
	
	setTimeout(function()
		{
			console.log("Settings applied.");
			
			this.editor.setBehavioursEnabled(false);
			this.editor.setShowPrintMargin(false);
			this.editor.setHighlightActiveLine(false);
			this.editor.setSelectionStyle("line");
			this.editor.session.setUseSoftTabs(false);
			
		}.ob_bind(this), 100);

	this.editor.on("guttermousedown", function(e)
	{
		var target = e.domEvent.target;
			
		if (target.className.indexOf("ace_gutter-cell") == -1) 
			return; 
		if (!e.editor.isFocused()) 
			return; 
		if (e.clientX > 25 + target.getBoundingClientRect().left) 
			return; 
		var row = e.getDocumentPosition().row;
		var line = row + 1;
		if( e.editor.session.getBreakpoints()[row] ) {
			e.editor.session.clearBreakpoint(row);
			setBreakpoint(line, false);
		}
		else {
			e.editor.session.setBreakpoint(row);
			setBreakpoint(line, true);
		}
		e.stop();
	});
}

TabView.prototype =
{
	collection: null,
	title: null,
	page: null,
	tab: null,
	
	onTabClicked: function(event)
	{
		this.collection.SelectTab(this);
	},
};
function TabView(collection, title, page)
{
	this.collection = collection;
	this.title = title;
	this.page = page;
	
	var tab = $(
	'<li class="tab tabActive">\
<span class="tabBody"><span class="tabText">' + title + '</span></span>\
<span class="closeButton lastActive"></span>\
</li>');
	tab.click(this.onTabClicked.ob_bind(this));
	
	tab.children(".closeButton").click(function(event)
		{
			event.stopImmediatePropagation();	//prevent switching to a tab about to close
			this.collection.RemoveTab(this);
		}.ob_bind(this));
	this.tab = tab[0];
	$("#tabBar").append(tab);
}

TabCollection.prototype =
{
	currentTab: null,
	tabs: null,
	
	CreateTab: function(title)
	{
		if(this.tabs.length == 0)
			$("#tabFirst").removeClass("startHidden");
		
		var e = new EditorTab($(".documentView")[0]);
		var t = new TabView(this, title, e);
		this.tabs.push(t);
		return(t);
	},
	RemoveTab: function(tabView)
	{
		var index = this.tabs.indexOf(tabView);
		if(index == -1)
			return;
		
		this.tabs.splice(index, 1);	//remove the tab
		$(tabView.tab).remove();
		tabView.page.Remove();
		
		if(this.tabs.length == 0)
			$("#tabFirst").addClass("startHidden");
		else if(tabView == this.currentTab)
			this.SelectTab(this.tabs[(index == 0)? 1 : (index - 1)]);
		else
			this.SelectTab(this.currentTab);	//re-draw tab bar
		
		return(tabView);
	},
	SelectTab: function(tabView)
	{
		this.currentTab = tabView;
		
		//update tab bar
		var tabElems = $("#tabBar > li");
		$("#tabFirst").attr("class", (tabElems[0] == tabView.tab)? "firstActive" : "firstInactive");
		
		for(var i = 0; i < tabElems.length; i++)
		{
			var trans = $(tabElems[i]).children(".closeButton");
			var it = (tabElems[i] == tabView.tab);
			
			trans.attr("class", "closeButton");	//wipe out any other classes
			
			$(tabElems[i]).removeClass("tabActive").addClass("tabInactive");
			if(it)
				$(tabElems[i]).removeClass("tabInactive").addClass("tabActive");
			
			if((i + 1) == tabElems.length)
				trans.addClass(it? "lastActive" : "lastInactive");
			else if(it)
				trans.addClass("nextInactive");
			else
				trans.addClass((tabElems[i + 1] == tabView.tab)? "nextActive" : "bothInactive");
		}
		
		//update pages
		for(var i = 0; i < this.tabs.length; i++)
			this.tabs[i].page.Select(false);
		tabView.page.Select(true);
	}
};
function TabCollection()
{
	this.tabs = [];
}

var gTabs = new TabCollection();

$(document).ready(function()
{
	var tree = new YAHOO.widget.TreeView(document.getElementById("varTree"));
	tree.render();
	
	//hack, will need to be applied to each node as it's created
	$(".callstackView li").click(function(event)
		{
			console.log(event);
			$(".callstackView li").removeClass("selected");
			$(event.currentTarget).addClass("selected");
		});
	
	
	gTabs.CreateTab("kuy/project/main.cpp");
	var t = gTabs.CreateTab("kuy/veryverylongprojectname/main.cpp");
	gTabs.CreateTab("kuy/foo/main.cpp");
	gTabs.SelectTab(t);

	var socket = io.connect();
	this.socket = socket;
	$(".callstackView").html("");
	socket.on("gdb_message", function(data)
	{
		console.log(data);
		$(".callstackView").append(data);
	});

	var breakPointMark;

	socket.on("gdb_break", function(data)
	{
		if (data.line)
		{
			var line = parseInt(data.line, 10);
			var row = line - 1;

			var range = new Range(row, 0, row, 100);

			if (breakPointMark)
			{
				gTabs.currentTab.page.editor.session.removeMarker(breakPointMark);
			}

			breakPointMark = 
				gTabs.currentTab.page.editor.session.addMarker(
					range, "ace_selection", "background");
		}

		if (data.stack)
		{
			// show stack in bottom right
		}

	});

	$("#continueButton").click(function(event)
	{
		socket.emit("gdb_command", "c");

		return false;
	});

	$("#gdbInput").keyup(function(event)
	{
		if (event.keyCode === 13)
		{
			console.log("sending ", $("#gdbInput").val());
			socket.emit("gdb_command", $("#gdbInput").val());
			$("#gdbInput").val("");
		}
	});

	var ctrlDown = false;
	var ctrlKey = 17, cKey = 67;

	$("#gdbInput").keydown(function(e)
	{
		if (e.keyCode == ctrlKey) ctrlDown = true;
	}).keyup(function(e)
	{
		if (e.keyCode == ctrlKey) ctrlDown = false;
	});

	$("#gdbInput").keydown(function(e)
	{
		if (ctrlDown && (e.keyCode == cKey))
		{
			socket.emit("gdb_sigint");
		}
	});
});
