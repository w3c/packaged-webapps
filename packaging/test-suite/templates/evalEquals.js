function evalEquals(prop, value, comparison)
{
	if(window.widget){
		comparison = comparison || "equal";
		var particle = (comparison === "equal") ? " to " : " than ";
		try
		{
			if ((comparison === "equal" && eval(prop) === value) ||
				(comparison === "greater" && eval(prop) > value) ||
				(comparison === "less" && eval(prop) < value)
			)
			{
				var msg = "Test "+id+" passed because property "+prop+" was "+comparison+particle+value
				pass(msg);
				return;
			}
			fail("Test "+id+" failed because property "+prop+" was not "+comparison+particle+value);
		} catch (e) {
			fail("Test "+id+" failed because "+e.message);
		}
	}
}

evalEquals("document.characterSet", "utf-8", "less");
