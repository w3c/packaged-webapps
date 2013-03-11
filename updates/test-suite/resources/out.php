<?php

/* 
 * path to the location where the resources reside
 * The update xml generated will have reference to this location
 * so that the runtime could request this resource
 */
define ("BASE", "http://people.opera.com/harig/wupdres/resources/");

/* Constants */
define("UDD_FAIL", '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="'. BASE . 'fail.wgt">
<details>A basic widget update that shows FAIL</details>
</update-info>');
define("UDD_PASS", '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'pass.wgt">
<details>A basic widget update that shows PASS.</details>
</update-info>');
define("UDD_NONE", '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'none.wgt">
<details>A basic widget update that shows None. Verify other pass conditions elsewhere mentioned.</details>
</update-info>');
define("UDD_NULL", '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="42.0" src="'. BASE . 'does-not-exist">
<details>UDD with same version info and not-existing src, so that widget is not updated</details>
</update-info>');
define("HDR_CT_UDD", "Content-Type: application/xml");
define("HDR_CT_WUPD", "Content-Type: application/widget");

$debug = 0;
$httpStatus = "";
$httpHeaders = array();
$httpResponse = "";

foreach($_GET as $getItem => $getVal)
{
	switch($getItem)
	{
		case "udd-pass":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = UDD_PASS;
			break;
		case "udd-fail":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = UDD_FAIL;
			break;
		case "udd-none":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = UDD_NONE;
			break;
		case "udd-malformed":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="'. BASE . 'fail.wgt" />
<details>A basic widget update with ill-formed XML</details>
</update-info>';
			break;
		case "udd-binary":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = @file_get_contents("fail.wgt");
			break;
		case "udd-details-xml-lang":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'none.wgt">
<details>Generic details content.</details>
<details xml:lang="en">PASS</details>
</update-info>';
			break;
		case "udd-details-content":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'none.wgt">
<details><a>P</a><b>A<c>S</c>S</b></details>
</update-info>';
			break;
		case "udd-details-multiple":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'none.wgt">
<details>This details element is used.(PASS)</details>
<details>This details element is ignored.(FAIL)</details>
</update-info>';
			break;
		case "udd-details-whitespace":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'none.wgt">
<details>
P
A
S
S
</details>
</update-info>';
			break;
		case "udd-dir-ltr":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" dir="ltr" version="999.0" src="' . BASE . 'pass.wgt">
<details>dir is ignored on update-info element</details>
</update-info>';
			break;
		case "udd-dir-rtl":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" dir="rtl" version="999.0" src="' . BASE . 'pass.wgt">
<details>dir is ignored on update-info element</details>
</update-info>';
			break;
		case "udd-dir-lro":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" dir="lro" version="999.0" src="' . BASE . 'pass.wgt">
<details>dir is ignored on update-info element</details>
</update-info>';
			break;
		case "udd-dir-rlo":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" dir="rlo" version="999.0" src="' . BASE . 'pass.wgt">
<details>dir is ignored on update-info element</details>
</update-info>';
			break;
		case "udd-udi-invalid-href":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src=":">
<details>href attribute is invalid</details>
</update-info>';
			break;
		case "udd-lesser-version":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="21.0.1 beta" src="' . BASE . 'fail.wgt">
<details>update-info element version is lesser than current.</details>
</update-info>';
			break;
		case "udd-multiple-udi-ignored":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'fail.wgt">
<details>Multiple update-info elements, UDD is ignored (invalid XML).</details>
</update-info>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'fail.wgt"/>';
			break;
		case "udd-unknown-attrib-ignored":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" randomattrib="something123" src="' . BASE . 'pass.wgt">
<details>An unknown attribute on update-info element is ignored.</details>
</update-info>';
			break;
		case "udd-none":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'none.wgt">
<details>A basic widget update that is neutral. Other conditions need to be verified manually.</details>
</update-info>';
			break;
		case "udd-non-root":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<x>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'fail.wgt">
<details>update-info element not at the root of the document.</details>
</update-info>
</x>';
			break;
		case "udd-no-version":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" src="' . BASE . 'fail.wgt">
<details>update-info element does not have a version.</details>
</update-info>';
			break;
		case "udd-wrong-ns":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.uknown.org/ns/widgets" version="999.0" src="' . BASE . 'fail.wgt">
<details>widget update source document which is not in W3C namespace.</details>
</update-info>';
			break;
		case "udd-same-version":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="42.0" src="' . BASE . 'fail.wgt">
<details>update-info element version is same as current.</details>
</update-info>';
			break;
		case "udd-src-invalid-wgt":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'invalid.wgt">
<details>An invalid widget (no config.xml)</details>
</update-info>';
			break;
		case "udd-src-relative":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="pass.wgt">
<details>A relative URI as src should be resolved to an absolute URI with ref. to this UDD.</details>
</update-info>';
			break;
		case "udd-changed-id":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="'. BASE . 'pass.wgt">
<details>The old widget has an id attribute but this one does not. This should not cause a failure to update.</details>
</update-info>';
			break;
		case "udi-same-version":
			array_push($httpHeaders, HDR_CT_WUPD);
			$httpResponse = @file_get_contents("wgt_same_version.wgt");
			break;
		case "udd-udi-204":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'out.php?udi-204">
<details>The src returns a HTTP 204 with content.</details>
</update-info>';
			break;
		case "udd-udi-301":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'out.php?udi-301">
<details>update source redirect should be followed</details>
</update-info>';
			break;
		case "udd-udi-302":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'out.php?udi-302">
<details>update source redirect should be followed</details>
</update-info>';
			break;
		case "udd-udi-401":
			if (!isset($_SERVER['PHP_AUTH_USER'])) 
			{
			$httpStatus = "HTTP/1.1 401 Authorisation required";
			array_push($httpHeaders, 'WWW-Authenticate: Basic realm="Enter udd401 as the username"');
			$httpResponse = "Requires HTTP authentication to access the widget update document.";
			}
			else 
			{
				array_push($httpHeaders, HDR_CT_UDD);
				if ($_SERVER['PHP_AUTH_USER'] === "udd401")
				{
					$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'pass.wgt">
<details>HTTP authentication done. User:' .  $_SERVER['PHP_AUTH_USER'] . '</details>
</update-info>';
				}
				else
				{
					$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'fail.wgt">
<details>HTTP authentication incorrect; Got ' . $_SERVER['PHP_AUTH_USER'] . ' as the user.</details>
</update-info>';
				}
			}
			break;
		case "udd-udi-xml-lang-ignored":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" xml:lang="unknown" version="999.0" src="' . BASE . 'pass.wgt">
<details>xml:lang is ignored on update-info element</details>
</update-info>';
			break;
		case "udd-udi-unknown-attrib-ignored":
			array_push($httpHeaders, HDR_CT_UDD);
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" foo="bar $%$%$%$ baz" version="999.0" src="' . BASE . 'pass.wgt">
<details>dir is ignored on update-info element</details>
</update-info>';
			break;
		case "udd-wrong-ct":
			array_push($httpHeaders, "Content-type: text/plain");
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'fail.wgt">
<details>This document would not be sent with MIME type application/xml</details>
</update-info>';
			break;
		case "udd-udi-wrong-ct":
			array_push($httpHeaders, "Content-type: text/plain");
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'fail-wrong-ct.wgt">
<details>The src provides a good update with an incorrect content type; so no update should happen.</details>
</update-info>';
			break;
		case "udd-301":
			$httpStatus = "HTTP/1.1 301 Moved";
			array_push($httpHeaders, "Location: " . BASE . "out.php?udd-pass");
			break;
		case "udd-302":
			$httpStatus = "HTTP/1.1 302 Temporarily moved";
			array_push($httpHeaders, "Location: " . BASE . "out.php?udd-pass");
			break;
		case "udd-303":
			$httpStatus = "HTTP/1.1 303 See other";
			array_push($httpHeaders, "Location: " . BASE . "out.php?udd-pass");
			break;
		case "udd-204":
			$httpStatus = "HTTP/1.1 204 No content";
			array_push($httpHeaders, HDR_CT_UDD);
			array_push($httpHeaders, "Content-Length:" . strlen(UDD_FAIL));
			$httpResponse = UDD_FAIL;
			break;
		case "udd-206":
			$httpStatus = "HTTP/1.1 206 Partial content";
			array_push($httpHeaders, HDR_CT_UDD);
			array_push($httpHeaders, "Content-Range: bytes 0-" . strlen(UDD_FAIL));
			array_push($httpHeaders, "Content-Length:" . strlen(UDD_FAIL));
			$httpResponse = UDD_FAIL;
			break;
		case "udd-304":
			$httpStatus = "HTTP/1.1 304 Not modified";
			array_push($httpHeaders, HDR_CT_UDD);
			array_push($httpHeaders, "Content-Length:" . strlen(UDD_FAIL));
			$httpResponse = UDD_FAIL;
			break;
		case "udd-proper-304":
			if (isset($_SERVER["HTTP_IF_MODIFIED_SINCE"]))
			{
				$httpStatus = "HTTP/1.1 304 Not modified";
				array_push($httpHeaders, "Content-Length:" . strlen(UDD_FAIL));
				$httpResponse = UDD_FAIL;
			}
			else
			{
				array_push($httpHeaders, HDR_CT_UDD);
				array_push($httpHeaders, "Last-modified:" .   gmdate('r', (gmmktime() + (int)($getVal))));
				array_push($httpHeaders, "Content-Length:" . strlen(UDD_NULL));
				$httpResponse = UDD_PASS;
			}
			break;
		case "udd-410":
			$httpStatus = "HTTP/1.1 410 Gone";
			array_push($httpHeaders, HDR_CT_UDD);
			array_push($httpHeaders, "Content-Length:" . strlen(UDD_FAIL));
			$httpResponse = UDD_FAIL;
			break;
		case "udd-none-delayed":
			sleep(10);
			array_push($httpHeaders, "Content-type: application/xml");
			array_push($httpHeaders, "Content-Length:" . strlen(UDD_NONE));
			$httpResponse = UDD_NONE;
			break;
		case "udd-if-none-match":
			array_push($httpHeaders, HDR_CT_UDD);
			if (isset($_SERVER["HTTP_IF_NONE_MATCH"]))
			{
				$httpResponse = UDD_PASS;
			}
			else
			{
				array_push($httpHeaders, "Etag:\"firstcheck\"");
				$httpResponse = UDD_NULL;
			}
			break;
		case "udd-if-modified-since":
			array_push($httpHeaders, HDR_CT_UDD);
			if (isset($_SERVER["HTTP_IF_MODIFIED_SINCE"]))
			{
				$httpResponse = UDD_PASS;
			}
			else
			{
				array_push($httpHeaders, "Last-modified:" .   gmdate('r', (gmmktime() + (int)($getVal))));
				$httpResponse = UDD_NULL;
			}
			break;
		case "udd-accept-language":
			array_push($httpHeaders, HDR_CT_UDD);
			if (isset($_SERVER["HTTP_ACCEPT_LANGUAGE"]))
			{
				$httpResponse = UDD_PASS;
			}
			else
			{
				$httpResponse = UDD_NONE;
			}
			break;
		case "udd-expires-in":
			array_push($httpHeaders, HDR_CT_UDD);
			array_push($httpHeaders, "Expires:" . gmdate('r', (gmmktime() + (int)($getVal))));
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'none.wgt">
<details>This test passes if the UA did not check for update before 5 mins of the first update check.</details>
</update-info>';
			break;
		case "udd-cache-control":
			array_push($httpHeaders, HDR_CT_UDD);
			array_push($httpHeaders, "Cache-Control:" . ($getVal));
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'none.wgt">
<details>This test passes if the UA caches this request as needed by the internal update scheduling.</details>
</update-info>';
			break;
		case "udd-pragma":
			array_push($httpHeaders, HDR_CT_UDD);
			array_push($httpHeaders, "Pragma:" . ($getVal));
			$httpResponse = '<?xml version="1.0" encoding="UTF-8" ?>
<update-info xmlns="http://www.w3.org/ns/widgets" version="999.0" src="' . BASE . 'none.wgt">
<details>This test passes if the UA caches this request as needed by the internal update scheduling.</details>
</update-info>';
			break;
		case "udi-301":
			$httpStatus = "HTTP/1.1 301 Moved";
			array_push($httpHeaders, "Location:" . BASE . "pass.wgt"); 
			break;
		case "udi-302":
			$httpStatus = "HTTP/1.1 302 Temporarily moved";
			array_push($httpHeaders, "Location:" . BASE . "pass.wgt"); 
			break;
		case "udi-204":
			$httpStatus = "HTTP/1.1 204 No content";
			array_push($httpHeaders, HDR_CT_WUPD);
			$httpResponse = @file_get_contents("fail.wgt");
			break;
		case "udi-401":
			if (!isset($_SERVER['PHP_AUTH_USER'])) 
			{
				$httpStatus = "HTTP/1.1 401 Authorisation required";
				array_push($httpHeaders, 'WWW-Authenticate: Basic realm="Enter udi401 as the username"');
				$httpResponse = "Requires HTTP authentication to access the widget update src.";
			}
			else 
			{
				array_push($httpHeaders, HDR_CT_WUPD);
				if ($_SERVER['PHP_AUTH_USER'] === "udi401")
				{
					$httpResponse = @file_get_contents("pass.wgt");
				}
				else
				{
					$httpResponse = @file_get_contents("fail.wgt");
				}
			}
			break;
		default:
			$httpResponse = "Nothing interesting here...";
			break;
	}
}	

if($httpStatus === "") 
	$httpStatus = "HTTP/1.1 200 OK";
if ($debug)
{
	print($httpStatus . "\n");
	print("Date: " . gmdate("r"));
}
else
{
	header($httpStatus, true);
	header("Date: " . gmdate("r"), true);
}
foreach($httpHeaders as $hdr)
{
	if ($debug)
		print($hdr . "\n");
	else
		header($hdr, true);
}
print $httpResponse;
exit;
?>
