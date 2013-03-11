/** 
@author Marcos Caceres
TODO: need a better way to get the userAgentsNames. 
**/

/* 
this is here just for debugging purposes, it stops browsers without a console interface 
from crashing the script.
*/

window.console = window.console || {log: function(){}};

/*
Base objects for processable Documents. 
A processsable document is HTML or XML document that needs 
special processing.
*/
function ProcessableDocument(aChild, type, aProcessor){
	 if(!aChild || typeof(aChild) != "object"){	 
	 	throw "First Argument must be an object";
	 }
	 
	 
	 //private protectect attribute
	 var listeners = {};
	 var obj       = this;
	 var uri; 
	 
	 var PROCESSING_DONE    = "ProcessingDone";	
	 var PROCESSING_ERROR   = "ProcessingError";
	 var PROCESSING_WARNING = "ProcessingWarning";
	 
	 /*inner function broadcasts
	   events to listeners*/
	 function broadCastEvent(eventID, arg){ 
	 	  arg = arg || aChild;
		  var callBacks = listeners[eventID]; 
		  for(var i in callBacks){
			callBacks[i](arg);
		  }
	 }
	 
	 var process = function(aDoc){
		try{
	  		var broadCaster = broadCastEvent; 
			aProcessor(aDoc, broadCaster);
			broadCastEvent(PROCESSING_DONE);
		}catch(e){
			broadCastEvent(PROCESSING_ERROR, e); 
		}
	 }
	
	 aChild.init = function(params){
		 if (!params.uri){
	 		throw "Error: a URI is required as an argument when creating a ProcessableDocument";
		 }
		 uri = aChild.uri  = params.uri;
		 return aChild;
	 }
	 	

	 var addListener = function(aListener, aWhatToListenFor){
		 if(!aListener instanceof Function){
			throw "a listener must be a function " + aListener + " treid to listen for " +  aWhatToListenFor;  
		  }
		  if(!listeners[aWhatToListenFor]){
		      listeners[aWhatToListenFor] = new Array(); 
		  }
		  listeners[aWhatToListenFor].push(aListener); 
 	 } 
	
	aChild.on = function(eventName, aListener){
		addListener(aListener, eventName)
	}
	
	aChild.load = function(){
		if(!uri){
			throw "Error: no URI to load!"	
		}
		$.get(uri,null, function(doc){process(doc)},type); 	
	}
	 
  }


 function TestSuite(){
	//private attributes
	var spec;
	var type 		    = "xml";
	var obj             = this;
	var resultsSets     = {}; 
	var testIdentifiers = {}; 
	var size            = 0; 
	var testsDB		    = {}
	
	//custom processor for test suite results
	var processor  = function(xml, broadCaster){
		//get the specification for this test suite
		var specURI = $(xml).find("testsuite").attr("spec"); 
		spec        = new Specification().init({uri: specURI});
		spec.on("ProcessingDone", specLoaded);
		//process the tests
		var tests = $(xml).find("test");
		var duplicateTests = new Array(); 
		tests.each(function(){
						var id    = $(this).attr("id");
						var src   = $(this).attr("src");
						var forID = $(this).attr("for");
						var desc  = $(this).text();
						var type  = ($(this).attr("type")) ? $(this).attr("type") : "mandatory"; 
						if(testIdentifiers[id]){
							duplicateTests.push(id);	
						}else{
							size++;
							testIdentifiers[id] = id;
							if(!testsDB[forID]){
								testsDB[forID] = new Array();	
							}
							var testObj = {'id': id, 'src': src, 'desc': desc, 'type': type}
							testsDB[forID].push(testObj);
						}
					});  
		
		if(duplicateTests.length > 0){
			var message = "Duplicate test(s) found in test suite: ";
			message = message + duplicateTests.join(", ") + ".";
			var error   = new Error(message);
			error.duplicates = duplicateTests; 	
			broadCaster("PROCESSING_WARNING", error);
		}
	 }
	
	this.stats = function(){
		return {'size': size, mandatory: 0, optional: 0}  
	}
	
	var verifyTestsAgainstSpec = function(){
		  var verified = {};
		  var notFound = new Array(); 
		  //check that each test is really testing for something in the spec
		  for(var i in testsDB){
			if(!verified[i]){
				if(spec.hasAssertion(i)){
					verified[i] = "yes"; 
				}else{
					notFound.push(i);	
				}
			}
	        if (notFound.size > 0){
	 		  throw "Found tests for assertions that are not in the spec: " + notFound.toString(); 
		    }
		  }  
	}
	
	this.getTestsForAssertion = function(id){
		if(!testsDB[id]){ 
			throw "This assertion has not been tested"
		}
		return testsDB[id]; 	
	}
	
	this.hasTest = function(id){
		if(testIdentifiers[id]){
			return true;
		}
		return false;
	}
	
	this.getSpec = function(){
		return spec; 
	}
	
	this.getSize = function(){
		return size;
	}
	
	this.addResultSet = function(aResultSet){
		if(!resultsSets[aResultSet.id] ){ 
			resultsSets[aResultSet.id] = aResultSet.id;	
			try{
				aResultSet.verifyAgainstTestSuite(obj);
			}catch(e){
				console.log("Could not verify result set: "  + e);
			}
		}else{
			throw "Result set for " + aResultSet.id + " already in test suite"; 	
		}
	}
	 
	 var specLoaded = function(aSpec){	
		//verify that the tests relate to assertions
		verifyTestsAgainstSpec(); 
	 } 
	 
	 var handleError = function(error){
		 throw error;
	  }
	 
	//Set up interface inheritance 
	new ProcessableDocument(this, type, processor); 
}
 
function TSResultsTable(aElement){
	var testLocations = {}; 
	var testSuite;  
	var indicator = $("<p id='loader'><img src='../../widgets-shared/images/dashboard/bar.gif' " +
			"alt='...loading...'></p>"); 
	aElement.append(indicator); 
	var progress = $("<p></p>"); 
	aElement.append(progress);
	
    var display    = $("<table class='TSResult-display' border='0' cellspacing='0' cellpadding='0'>" +
    		"<caption>User Agents and Test Results</caption></table>");
    aElement.append(display.hide());
    var tHead      = $("<thead></thead>");
	var tHeadRow   = $("<tr></tr>");
 	display.append(tHead.append(tHeadRow));
	
	var updateProgress = function(txt){
	  	 progress.text("..."+ txt + "...");
	}
	
	this.updateResults = function(aResultSet){
		var ua_id = aResultSet.userAgent.id; 
		updateHeaders(ua_id);
		 
	    //used to create background for cells using the user agent's id
		var style = "";	
		try{ 
			var canvas = document.createElement("canvas"); 
			canvas.setAttribute("width", "100");
			canvas.setAttribute("height", "100");
			var ctx = canvas.getContext('2d');	
			ctx.globalAlpha = 0.2;
			ctx.font = "12pt Arial";
			ctxfillStyle    = '#00f';
			ctx.translate(-33, 55);
			ctx.rotate(-.60);
			ctx.clearRect(0,0,200,200)
			ctx.fillText(ua_id, 20, 50);
			var dataURL = canvas.toDataURL();
			style = "background-image:url('" +dataURL+ "')";  
		}catch(e){
		   
		}

		var tblBodyObj = display.find("tbody");
		var rows = tblBodyObj[0].rows
		
		for (var i=0; i<rows.length; i++) {
			var row      = rows[i];
			var newCell  = $(row.insertCell(-1));
			var testCell = $(row).find("td[id^='test-']"); 
			var testid; 
			if(testCell.size() === 1){
				var attrValue = testCell.attr("id"); 
				var firstDash = attrValue.indexOf("-") + 1; 
				var testid    = attrValue.substring(firstDash);
			}else{
				testid = null;
			}
			
			var result;			
			try{
				if(testid){
					result  = aResultSet.getResult(testid);
				}else{
					result  = {"testid": "-1", "verdict": "no-test", "desc": ""};
				}
				newCell.html(result.verdict);
				if(result.desc != ""){
					var comment = $("<img src='../../widgets-shared/images/resultmatrix/comment.png' alt='"
									+ $(result.desc).text() +"' class='comment' />"); 
					newCell.append(comment) 
					newCell.attr("title", result.desc);
				}
				newCell.attr("class", result.verdict + " " + ua_id)
				
			}catch(e){	
				console.log(e);
				newCell.attr("class", "untested " + ua_id)
				newCell.html("untested")
			}
			newCell.attr("style", style)
		}
		
	}
	
	updateProgress("Downloading test results"); 
	
	var removeProgress = function(){
		$(indicator).hide(); 
		$(progress).hide(); 
		$(display).show();
	}
	
	var updateHeaders = function(value){
		var th = "<th>" + value + "</th>" 
		tHeadRow.append(th);
	}
	
	
	this.showWarning = function(e){
		updateProgress(e.message); 	
	}
	
	this.specReady = function(aSpec){
		 updateProgress("spec added")
		 var assertions = aSpec.mustAssertions();
		 updateHeaders("Conformance Requirement"); 
		 updateHeaders("Test Cases from Test Suite");
		 var count = 1; 
		 
		 $(assertions).each(
			function(){
				//rewrite the Links back to the spec 
				$(this).find("a").each(function(){
					$(this).attr("href", aSpec.uri + $(this).attr("href"));});
				
				var asrtID  = $(this).attr("id"); 
				var tests; 
				try{ 
					tests   = testSuite.getTestsForAssertion(asrtID); 
				}catch(e){
					console.log("Could not find tests for assertion: "  + asrtID);
				}
				var asrtLink= count++ + ". <a href='"+ aSpec.uri + "#" + asrtID + "'>" + asrtID + "</a>: "  
				var asrt    = $(this); 
				var html;
						
				if(tests){
					html    = "<tr class='testset' id='" + asrtID +"'><td class='confreq' rowspan='" 
							   + tests.length +"'><p>" + asrtLink + " " 
							   + $(this).html() + "</p></td>";
					for(var i in tests){
						
						var testObj  =  tests[i]; 
						var testFile = testObj.src.substring(testObj.src.lastIndexOf('/') 
								+ 1, testObj.src.length )
						var testSrc  = testObj.src.substring(0, testObj.src.lastIndexOf('/') +1) 
						var testCases= testSuite.uri.substring(0, testSuite.uri.lastIndexOf('/') +1)
						var testlink =  "<p class='testid'>Test " + testObj.id + "</p>"+
						                "<p class='files'><strong>files:</strong> <a href = '"
						                    + testCases  + testObj.src +"'>" + testFile 
										+ "</a>" 
						testlink     += " / <a href = '" + testCases  + testSrc + "'>source</a></p>"  	
						var td       = "<td class='testcase' id='test-" + testObj.id + "'>"  + 
										testlink + "<p><strong>Test Condition:</strong> " + 
										testObj.desc +"</p>" + "</td>"
						if(i <= 1){
							td += "</tr>";
						}else{
							td =  "<tr>" + td;	
							if(tests.length-1 == i){
								td = td + "</tr>";
							}
						}
						html += td;
					}
				}else{//this assertion has not been tested
					html  = "<tr id='" + asrtID +"'><td>" + asrtLink + " " 
							   + $(this).html() + "</td>";
					html += "<td>There is currently no test for this assertion.</td></tr>"
				}
								
				$(display).append($(html));
		    }			
		 )
		 
		removeProgress();
	 }	

	 var updateProgress = function(txt){
	  	 progress.text("..."+ txt + "...");
	 }
	 	
	this.addTestSuite = function(aTestSuite){
		testSuite = aTestSuite;
	}
	 
}
 
 function DashBoard(){
	 //used for creating Gage and bar chart. 
	 var chartURI = "http://chart.apis.google.com/chart?"
	 var listeners = {}
	 var element; 
	 var indicator = $("<img src='../../widgets-shared/images/dashboard/bar.gif' alt='...loading...'>"); 
	 var progress  = $("<p id='progress'></p>");
	 var assertions; 
	 var obj = this;
	 var testSuite;  
	 var display    = $("<table id='dashboard-display' cellpadding='0' cellspacing='0' border='0' "+ 
			 			"style=\"width:100%\"><caption>Conformance Dashboard</caption><thead><tr> "
			 			 +"<th>User Agent</th><th>Conformance Level</th><th>Breakdown of Test Results</th>" +
			 			 "</thead></table>");
	 
	 var states 	= {IDLE: 0, INIT: 1, LOADED_TESTSUITE: 2, LOADING_TESTS: 3} ; 
	 var state 		= states.IDLE; 
	 	 
	 this.init = function(params){
		 this.uri = params.uri;
		 element = params.display; 
		 element.append(indicator);
		 element.append(progress);
		 $(display).hide();
	 	 $(element).append(display);
		 testSuite = params.testsuite; 
		 var up    = updateProgress; 
		 var obj   = this;
		 testSuite.on("ProcessingDone", function(ts){
									up("Downloading specification");		 
									obj.addTestSuite(ts);
									}); 
		 return this; 	 
	 }	 
	 
	 var updateProgress = function(txt){
	  	 progress.text("..."+ txt + "...");
	 }
	 
	 
	this.showWarning = function(e){
		for(var i in e){
			console.log(i)	
		}
		updateProgress(e.message); 	
	
	}
	 
	 
	 var removeProgress = function(){
		$(indicator).hide(); 
		$(progress).hide(); 
		$(display).show();
	 }
	 
	 var visulizeResultSet = function(ua,stats){
		  var size  = testSuite.getSize();
		  var avg   = Math.round( stats.pass / size  * 100.0 );  
		  var label = ua.id + " (" +  avg  + "%)";
		  var html = "<tr>"; 
		  html    += "<td class='ua'><a href='"+ ua.downloadURI +"'>" + ua.name + "</a></td>"
		  //google meter
		  var googleMeter =  "<img alt='" + label + "' src='" + chartURI 
		  					  + "chs=350x200&cht=gom&chd=t:" + avg + 
		  					  "&chl=" + label + "&chco=FF0000,FFFF00,00FF00' " +
		  					  		"lowsrc='../../widgets-shared/images/dashboard/loading.gif' >";
		  html    += "<td>" + googleMeter + "</td>"
		  
		  //google pie chart
		  var chl      = new Array(); //labels 
		  var chd      = new Array(); //data
		  var chco     = new Array(); //colors
		  var untested = 100;  
		  var alt = "";
		  //constant for colors. 
		  var colors =  {"pass"      : "00FF00",
		                 "fail"      : "FF0000", 
					     "incomplete": "996699",  
					     "cannottest": "EFA82C", 
					     "untested"  : "CCCCCC88"}
		  for(var i in stats){
			  var avg  = (Math.round( stats[i] / size  * 100.0 ));
			  console.log(i + ": " + (stats[i] / size  * 100.0))
			  if ( avg > 0) { 
				  chd.push(avg) 
				  alt += i + " = " + avg + ", ";
				  untested = untested - avg;
				  chl.push(i + "(" +  avg + "%)"); 
				  chco.push(colors[i]);
			  }
		  }
		  
		  if(untested > 0) {
			  chl.push("untested" + "(" + untested + "%)"); 
			  chd.push(untested); 
			  chco.push(colors["untested"]);
		  	  alt += "untested = " + untested +  ".";
		  } 
		  
		  var chltxt  = "&chl=" + chl.toString().replace(/,/gi, "|"); 
		  var chdtxt  = "&chd=t:" + chd.toString(); 
		  var chcotxt = "&chco=" + chco; 
		  var googlePie = "<img src='" + chartURI  + "chs=550x175&cht=p3" 
		  +  chdtxt + chltxt + chcotxt +"' alt='" + alt +"'>"; 
		  html    += "<td>" + googlePie + "</td>"
		  html    += "</tr>" 
		  display.append($(html))
	 }
	 
	 this.addTestSuite = function(aTestSuite){
		 testSuite = aTestSuite;
		 updateProgress("test suite processed"); 
	 }
	 
	 this.addResultSet = function(aResultSet){
		if(testSuite){ 
			 if(state < states.LOADING_TESTS) {
				removeProgress();
				state = state.LOADING_TESTS
			  }
			  visulizeResultSet(aResultSet.userAgent, aResultSet.stats())	  
		}else{
			throw "Can't add tests without first having added a test suite"; 	
		}
	 }
	 
	 this.specReady = function(aSpec){
		 updateProgress("specification ready, processing conformance requirements")
		 assertions = aSpec.mustAssertions();
	 }
	 
	var generateRow = function(aUA){
		var rowHTML  = "<tr>" 
		rowHTML     += "<td class='ua-sname'>" + aUA.shortname + "</td>";
		rowHTML     += "<td class='ua-conformance'> </td>" 
	}
		 
 }
 
/*
Specification class
*/ 
function Specification(aURI){ 
  	var type 		 = "html";
	var assertions   = {}
	var obj      	 = this;
	var assertionsDB = {};
	var titleElem; 
	
	this.__defineGetter__("title", function(){
        return titleElem.innerHTML;
    });
    
    this.__defineSetter__("title", function(){});
	
	this.hasAssertion = function(aID){ 
		if(assertionsDB[aID]){
			return true;	
		};
		return false;
	}
	
	this.mustAssertions = function(){
		return assertions.musts;	
	} 
	
	var processor = function(html){
		//build up database
		assertions.doc    = document.createElement("html");
		assertions.doc.innerHTML = html; 
		assertions.all    = $(html).find("p:has(em[class=ct])");
		assertions.musts  = assertions.doc.querySelectorAll('p[id^="ta-"]');
	
		//set spec's title; 
		titleElem =  assertions.doc.querySelector('title');
		
		$(assertions.musts).each(
		 function(){
				 var ta = $(this).attr("id");
				 if(!assertionsDB[ta]){
					 assertionsDB[ta] = this;
				  }else{
					throw "Repeated testable assertion id: " + ta;   
				  }
			}
		);
	}
	new ProcessableDocument(this,type,processor);
 } 
 
 function ResultSet(aURI) {
	  this.userAgent;
	  var obj      		   = this;
	  var resultsDB        = {all: {_length: 0}};
	  var type			   = "xml";
	  
	  /*GETTTERS*/
	  this.getResult = function(id){
		if (resultsDB.all[id]) {
			return  resultsDB.all[id];
		}
		throw "Requested result is not in results set:" + id; 
	  }
	  
	  /* UTILS */
	  this.verifyAgainstTestSuite = function(aTestSuite){
		    var notFound = new Array(); 
			for(var j in resultsDB.all){
			  	var forTest = (resultsDB.all[j]).testid;
				if(forTest){
					var verified = aTestSuite.hasTest(forTest); 
					if(!verified){
						notFound.push(forTest);
						this.removeResult(forTest); 
					}		 
				}
			}
			if(notFound.length > 0){
				var message =  "Results for a test that is not in the test suite found: '" + 
				       notFound.toString() + "' on product " + obj.userAgent.name;	
				console.log(message)	
			} 
	   }
	  
	  //returns a custom statistics object. 
	  this.stats = function(){
		 var stats = {}; 
		 for(var i in resultsDB){
			 if(i != "all"){
			 	stats[i] =  resultsDB[i]._length;
			 }
		  }
		 return stats;
	  }
	  
	  this.specReady = function(aSpec){
		  	obj.load();
	  }
	  
	  this.removeResult = function(id){
		  for(var i in resultsDB){
			  if(resultsDB[i][id]){
				  delete resultsDB[i][id];
				  resultsDB[i]._length--; 
			  }
		  }
	  }
	    
	  var processor = function(xml){
		  function UserAgent(id, name, downlaodURI){
			this.id = id;
			this.name = name;
			this.downloadURI = downlaodURI;
	 	  }
		  //Store the UA 
		  var name		     = $(xml).find("results").attr("product");
		  var id 			 = $(xml).find("results").attr("id");
		  var href 			 = $(xml).find("results").attr("href");
		  obj.userAgent      = new UserAgent(id, name, href);
		  
		  //process results 
		  var resultXML 	 = $(xml).find("result");
		  
		  resultXML.each( function() 
			{
			  var testid    = $(this).attr("for"); 
			  var verdict   = $(this).attr("verdict");
			  var desc 	    = $(this).text(); 
			  var result    = {"testid": testid, "verdict": verdict, "desc": desc};
			  if(!resultsDB[verdict]){
				resultsDB[verdict] = new Object();
				resultsDB[verdict]._length = 0; 
			  }
			  resultsDB[verdict][testid] = result;
			  resultsDB[verdict]._length++; 
			  resultsDB.all[testid] = result;
			  resultsDB.all._length++;
		    });
	  }  
	  new ProcessableDocument(this, type, processor);
 }

 //

function init(){
	var testSuite = new TestSuite().init({'uri': "../test-suite/test-suite.xml"});
	var dashboard = new DashBoard().init({'display': $("#dashboard"), 'testsuite': testSuite});
	var tsresults = new TSResultsTable($("#results")) 
	testSuite.on("ProcessingDone",tsresults.addTestSuite);
	testSuite.on("ProcessingDone",loadSpec);
	testSuite.on("ProcessingError",dashboard.showWarning);
	
	testSuite.load();
		
	function loadSpec(aTestSuite){
		var spec = aTestSuite.getSpec(); 
		spec.on("ProcessingDone",dashboard.specReady);
		spec.on("ProcessingDone",tsresults.specReady);
		spec.on("ProcessingWarning",dashboard.showWarning);
		spec.on("ProcessingWarning",tsresults.showWarning);
		
		//update the various places where the name of the spec is used
		spec.on("ProcessingDone",updateTitles)
		
		for(var i in userAgentsNames){
			var dataURI = "results/" + userAgentsNames[i].toLowerCase() + ".xml"; 
			var result  =  new ResultSet().init({"uri": dataURI });
			result.on("ProcessingDone",testSuite.addResultSet);
			result.on("ProcessingDone",dashboard.addResultSet);
		 	result.on("ProcessingDone",tsresults.updateResults);
			spec.on("ProcessingDone",result.specReady);
		}
		spec.load()
	}
	
}

function updateTitles(spec){
	var specTile = spec.title; 
	$(".specname").each(function(index, element) {
    	element.innerHTML = specTile;    
    });	
}

function setUpGoogleCharts(aCallBack){
	 //google.setOnLoadCallback(aCallBack);
	 //google.load("visualization", "1", {packages:["imagebarchart"]});
}

$(document).ready(init)