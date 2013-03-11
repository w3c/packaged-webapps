/*
Generates the result set for a test suite
pass        The test passes
fail        The test fails
uncertain   The tester is uncertain whether the test passes or fails
invalid     The tester believes the test is invalid.
na          The test is not applicable.
*/

var fs = require('fs');
var jsdom = require("jsdom"); 

jsdom.env("<html><head></head><body></body></html>", function(errors, window) {
	var script = window.document.createElement("script"); 
	script.src = "http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js";
	script.onload = function(){
		var data = fs.readFileSync("test-suite.xml", "utf8"); 
		var xml = window.$(data);
		var tests = window.$(xml).find("test")
		try{
		    var set = '<results \n  testsuite="http://dev.w3.org/2006/waf/widgets/test-suite/test-suite.xml" \n id="xxx"\n  product="some product" \n  href="http://homepage">\n'; 
		    set += "<!-- write: pass or fail (case sensitive) in each of the verdict attributes --> \n"
			for(var i = 0; i < tests.length; i++ ){
				var test = tests[i];
				set += "<result for=\"" + test.id + "\"" + " verdict=\"pass\"/> \n";
			}
		   set += "</results>"
			fs.writeFileSync("resultset.xml", set); 
		}catch(e){
			console.log(e);
		}
	}  
	window.document.getElementsByTagName("head")[0].appendChild(script); 
})

/*
jsdom.env("<p>hello</p>", ["http://ajax.googleapis.com/ajax/libs/jquery/1/jquery.min.js"], 
	function(errors,window) { 
			
	}
); //end setting up environment. 
*/
