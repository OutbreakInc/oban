var Browser = require("zombie"),
    assert = require("assert"),
	Step = require("step");

// var browser = new Browser({ debug: true })
// browser.runScripts = false;

Browser.visit("http://localhost:8000/", { debug: true},
	function (e, browser, status) {
		// browser.pressButton(".newProjectBtn", function() {	
		// 	browser.fill(".projectName", "arm").pressButton(".createProject", function()
		// 	{
		// 		console.log(browser.html("#projectList"));
		// 	});
		// });

		// Step(
		// function(){
			browser.pressButton(".newProjectBtn", function() {	
				browser.fill(".projectName", "d").pressButton(".createProject", function()
				{
					console.log("assert1");
					assert.equal(browser.text(".modal-body .text-error"), "Duplicate project name");
					browser.pressButton(".modal-footer :first-child").
						then(function() {
							return browser.pressButton(".newProjectBtn");
						}).
						then(function() {
							return browser.wait(0.05);
						}).
						then(function() {
							return browser.fill(".projectName", "c").pressButton(".createProject");
						}).
						then(function() {
							assert.equal(browser.text(".modal-body .text-error"), "Duplicate project name");
							return browser.pressButton(".modal-footer :first-child");
						});
					});
				});
			});
		// }, function(err)
		// {
		// 	browser.pressButton(".newProjectBtn", function() {	
		// 		browser.fill(".projectName", "c").pressButton(".createProject", function()
		// 		{
		// 			console.log("passed 2")
		// 			assert.equal(browser.text(".modal-body .text-error"), "Duplicate project name");
		// 			browser.pressButton(".modal-footer :first-child");
		// 		});
		// 	});			
		// });
});