//infrastructure for tests
var reason  = document.getElementById("reason"); 	
var body    = document.body; 	
var verdict = document.getElementById("verdict"); 

/*Called if the test passed */	
window.pass = function(msg)
{ 	
	document.body.style.backgroundColor = "green"; 		
	verdict.innerHTML = "PASS";
	reason.innerHTML  = msg.replace("\n","<br>");;	
}

/*Called if the test failed */	
window.fail = function(msg)
{
	document.body.style.backgroundColor = "red"; 		
	verdict.innerHTML = "FAIL";
	reason.innerHTML = msg.replace("\n","<br>");
}  