/*
Created by Stuart Knightley for the W3C while working for Opera Software ASA
Modified by Marcos Caceres, right after quitting Opera Software ASA 
*/
(function () {  
    var data = {};
    var SPEC_PAGE;
    var errors = [];
	
	if (window.SPEC_URL == undefined) {
      SPEC_PAGE = "../";
    } else {
      SPEC_PAGE = SPEC_URL;
    }

    //fires a synthetic event at some target, otherwise fires it at the
    //window object.
    function fireEvent(name, target) {
      target = target || window;
      var event = document.createEvent("Events");
      event.initEvent(name, false, true);
      target.dispatchEvent(event);
    }

    $(document).ready(function () {
      var $loadSpec = $('<div>Loading data: <progress></progress></div>');
	  // Define console if it isn't already
      if (typeof console == 'undefined') {
        console = {
          log: function () {},
          error: function (msg) {
            errors.push(msg);
          }
        };
      }

      // Returns a function that changes the loading message for the given
      // element, based on the xhr result.
      var handleError = function (filename, $infoEl) {
        return function (xhr, status, err) {
          var errText = (status == 'error') ? 'file not found' : (status == 'parsererror') ? 'parse error' : status;
          $infoEl.addClass('bad').text('Loading "' + filename + '" failed: ' + errText);
        };
      }
	  
	  // Add progress indicator for data that we're loading
      $("#tests").html($loadSpec.fadeIn(1000));
	
	  function loadSpec(){
		  $.ajax({
			url: SPEC_PAGE,
			dataType: "html",
			success: function (ret) {
			  data.spec = $($.parseHTML(ret));
			  start();
			},
			error: handleError(SPEC_PAGE, $loadSpec)
		  });
	  }

      // Get the data!
      $.ajax({
        url: "test-suite.xml",
        dataType: "xml",
        success: function (ret) {
          $loadSpec.fadeOut(1000);
          data.tests = ret;
        },
        error: handleError("test-suite.xml", $loadSpec),
      }).then(loadSpec);
    });

    function start() {
      var $processing,
	  	  products,
		  temp,
		  assertions,
		  unknownProducts,
		  tests,
		  unknownAssertions; 
	  
	  if (!data.tests || !data.spec) {
        console.log("data not ready");
        return;
      }
      
	  $processing = $('<progress max="100" value="0">... Proccessing data...</progress>');
      $("#tests").after($processing).fadeIn();

	  products = parseProducts(data.spec);

      temp = parseAssertions(data.spec, products);
      assertions = temp.assertions;
      unknownProducts = temp.unknownProducts;

      temp = parseTests(data.tests, assertions);
      tests = temp.tests;
      unknownAssertions = temp.unknownAssertions;

      buildTabs(products, assertions, tests, unknownProducts, unknownAssertions);

      $processing.fadeOut("slow");
    }

    ///////////////////////////
    // UI building functions //
    ///////////////////////////

    function buildTabs(products, assertions, tests, unknownProducts, unknownAssertions) {
      var $container = $('#tests').addClass('tabs');

      // Build overview tab without the 'unknown' product
      var overview = buildOverviewTab(products, assertions,
      tests, unknownAssertions);

      // If there are unknown products add them to the array
      if (count(unknownProducts.assertions) > 0) products['unknown-product'] = unknownProducts;
      // If there are unknown products add them to the array
      if (count(unknownAssertions) > 0) products['unknown-assertions'] = {
        id: 'unknown-assertions',
        class: '',
        desc: '<span class="bad">These assertions, listed in test-suite.xml, were not found in the specification.</span>',
        assertions: unknownAssertions
      };

      // Create all the tabs we need
      var $tabs = $('<ul>');
      $tabs.append('<li><a href="#overview">Overview</a></li>');
      for (var prod in products) {
        var id = products[prod].id;
        $tabs.append('<li><a href="#' + id + '">' + capitalise(id) + '</a></li>');
      }

      $container.append($tabs);
      $container.append(overview);

      for (var prod in products) {
        $container.append(buildProductTab(products[prod]));
      }

      $tabs.idTabs(true);
      parseHash($tabs);

      $('a.hash').click(function () {
        // Timeout so the hash has time to change
        setTimeout(function () {
          parseHash($tabs)
        }, 100);
      });
    }

    function buildOverviewTab(products, assertions, tests, unknownAssertions) {
      var $pane = $('<div>').attr('id', 'overview');

      var numAss = count(assertions);
      var numTested = 0;

      // Counts how many assertions are tested to calculate coverage.
      for (var ass in assertions) {
        if (assertions[ass].tests.length !== 0) numTested += 1;
      }
      $pane.append('<h3>' + numAss + ' assertions, ' +
        tests.length + ' tests, ' +
        Math.round((numTested / numAss) * 100) + '% coverage');

      // Generates a list of the products found
      var numProducts = count(products);
      $pane.append('<h4>' + numProducts + ' product' + ((numProducts === 1) ? '' : 's') + '</h4>');
      var $prods = $('<ul>');
      for (var p in products) {
        // Calculate the coverage for each product
        var numTested = 0;
        var numAss = count(products[p].assertions);
        var tests = 0;
        for (var ass in products[p].assertions) {
          if (products[p].assertions[ass].tests.length !== 0) {
            numTested += 1;
            tests += products[p].assertions[ass].tests.length;
          }
        }
        $prods.append($('<li>').text(capitalise(p) + ' (' + numAss + ' assertions, ' +
          tests + ' tests, ' +
          Math.round((numTested / numAss) * 100) + '% coverage)'));
      }
      $pane.append($prods);

      // Display info about about assertions without tests
      var numUnknown = count(unknownAssertions);
      if (numUnknown !== 0) {
        $pane.append('<p class="bad">Tests for ' + numUnknown +
          ' unknown assertions');
      }

      // Display all the errors that occured during processing. If console.error
      // is defined by the browser then this list will appear in the console.
      if (errors.length !== 0) {
        $errors = $('<ul>');
        for (var e = 0; e < errors.length; e++)
        $errors.append('<li class="bad">' + errors[e] + '</li>');

        $pane.append('<p>The following errors occured during processing:</p>');
        $pane.append($errors);
      }

      $pane.append('<p><small>This information was generated from the <a href="' +
        SPEC_PAGE + '">specification</a> and <a href="test-suite.xml">test-suite.xml</a></small></p>');

      return $pane;
    }

    function buildProductTab(prod) {
      var $pane = $('<div>').attr('id', prod.id);

      $pane.append('<h3>' + prod.id + '</h3>');
      $pane.append('<blockquote>' + prod.desc + '</blockquote>');
      //$pane.append($('<a href="#" class="toggleTests">Show all tests</a>').toggle(showTests, hideTests));
      $pane.append('<hr>');

      var $asses = $('<div>');
      for (var a in prod.assertions) {
        var ass = prod.assertions[a];
        var $ass = $('<div>');
        $ass.append('<h4 id="' + ass.id + '"><a class="hash" href="#' + prod.id + '/' + ass.id + '/tests">#</a> <a href="' + SPEC_PAGE + '#' + ass.id + '">' + ass.id + '</a></h4>');
        $ass.append('<blockquote>' + ass.desc + '</blockquote>');

        if (ass.tests.length === 0) {
          $ass.append('<span class="bad">This assertion has no tests associated with it.</span>');
        } else {
          var $tests = $('<dl>')//.hide();
          for (var t in ass.tests) {
            var test = ass.tests[t];
            // get the directory the widget is contained in
            var dir = test.src.split('/');
            dir.pop();
            dir = dir.join('/');
            $tests.append('<dt id="' + test.id + '"><a class="hash" href="#' +
              prod.id + '/' + ass.id + '/' + test.id +
              '">#</a> ' + test.id +
              ' (<a class="download" href="' + test.src +
              '">download</a>, <a class="files" href="' + dir + '">files</a>) ' +
              ((test.expected) ? 'Expected: ' + test.expected : '') +
              '</dt>');
            $tests.append('<dd><p>' + test.desc + '</p></dd>');
          }

          //$ass.append($('<a href="#" class="toggleTests">Show</a>').toggle(showTests, hideTests));
          $ass.append(" " + ass.tests.length + ' test' + ((ass.tests.length === 1) ? '' : 's'));
          $ass.append($tests);
        }

        $asses.append($ass);
        $asses.append('<hr/>');
      }

      $pane.append($asses);
      return $pane;
    }

    function showTests() {
      var $this = $(this);
      $this.text($this.text().replace('Show', 'Hide'));
      $this.parent().find('dl').show();
      return false;
    }

    function hideTests() {
      var $this = $(this);
      $this.text($this.text().replace('Hide', 'Show'));
      $this.parent().find('dl')//.hide();
      return false;
    }

    function parseHash($tabs) {
      var hash = location.hash;
      if (hash.length <= 1) return false;

      var parts = hash.split('/');

      if (parts[0]) {
        var tab = $tabs.find('a[href="' + parts[0] + '"]')
        tab.click();
        $("html, body").scrollTop(tab.offset().top);
      } else return;

      var ass;
      if (parts[1]) {
        ass = $('#' + parts[1]).parent()

        // Need to show the tests first so that scrolling works
        if (parts[2]) {
          showTests.call(ass.find('.toggleTests'));
          if (parts[2] != "tests") {
            $("html, body").scrollTop(ass.find('#' + parts[2]).offset().top);
          } else $("html, body").scrollTop(ass.offset().top);
        }
      } else return;

    }

    ///////////////////////
    // Parsing functions //
    ///////////////////////

    function parseProducts($spec) {
      var products = {};

      var $prodLinks = $spec.find('a[class*="product-"]');
      $prodLinks.each(function () {
        var id = $(this).attr('href').substring(1);
        if (!products[id]) {
          var klass = $(this).attr('class').match(/(product-[a-z]+)/i);
          // Gets the description of the anchor
          products[id] = {
            id: id,
            class: klass[0],
            desc: rewriteAnchors($spec.find('#' + id).parent()),
            assertions: []
          };
        }
      });

      return products;
    }

    function parseAssertions(spec, products) {
      var $spec = $(spec);
      var assertions = {};

      var unknownProducts = {
        id: 'unknown-product',
        class: '',
        desc: '<span class="bad">These assertions did not specifiy a product</span>',
        assertions: []
      };

      // Create a selector to extract which product each ass is for
      var prodClasses = [];
      var prodClassesIndex = {};
      for (var prod in products) {
        prodClasses.push('.' + products[prod].class);
        prodClassesIndex[products[prod].class] = products[prod].id;
      }
      var prodSelector = prodClasses.join(',');

      // Find all assertion paragraphs
      $spec.find('*[id^="ta-"]').each(function () {
        var $this = $(this);
        // To hold this assertion's data
        var a = {
          id: $this.attr('id'),
          desc: $this.html(),
          tests: []
        };

        // Find the product for this assertion
        var $prod = $this.find(prodSelector);
        if ($this.is(prodSelector)) {
          $prod = $prod.add($this);
        }
        if ($prod.length === 0) {
          console.error('Assertion ' + a.id + ' has no products (see Unknown tab)',
          $this);

          unknownProducts.assertions.push(a);
        } else {
          // It's possible that an assertion belongs to multiple products
          $prod.each(function () {
            var prod = $(this).attr('href');
            // if there's an href then strip the # and assign to product
            if (prod) {
              prod = products[prod.substring(1)].assertions;
              // Check for duplicates
              if (prod.length === 0 || prod[prod.length - 1].id != a.id) prod.push(a);
            } else { // otherwise, we try with the class name
              for (var i in prodClasses) {
                var klass = prodClasses[i];
                if ($(this).is(klass)) {
                  prod = products[prodClassesIndex[klass.substring(1)]].assertions;
                  // Check for duplicates
                  if (prod.length === 0 || prod[prod.length - 1].id != a.id) prod.push(a);
                }
              }
            }

          });
        }

        a.desc = rewriteAnchors($this);
        assertions[a.id] = a;
      });

      return {
        assertions: assertions,
        unknownProducts: unknownProducts
      };
    }

    function parseTests(tests, assertions) {
      var $tests = $(tests);
      var tests = [];
      var unknownAssertions = {};

      $tests.find('test').each(function () {
        var $this = $(this);
        var t = {
          id: $this.attr('id'),
          src: $this.attr('src'),
          desc: $this.text()
        };

        var ex = $this.attr('expected');
        if (ex) t.expected = ex;

        // get the id of the assertion this is for
        var assId = $this.attr('for');

        var ass = assertions[assId];
        if (ass) {
          ass.tests.push(t);
          tests.push(t);
        } else {
          console.error('Test ' + t.id + ' is for an unknown assertion (' +
            assId + ')');
          unknownAssertions[assId] = unknownAssertions[assId] || {
            id: assId,
            desc: '',
            tests: []
          };
          unknownAssertions[assId].tests.push(t);
        }
      });

      return {
        tests: tests,
        unknownAssertions: unknownAssertions
      };

    }

    /// Prepends all anchors with SPEC_PAGE, so that they point to the right place
    function rewriteAnchors(html) {
      html = $(html);
      html.find('a[href^="#"]').each(function () {
        $(this).attr('href', SPEC_PAGE + $(this).attr('href'));
      })

      return html.html();
    }

    /// Counts the number of properties and object has
    function count(obj) {
      var c = 0;
      for (var k in obj) if (obj.hasOwnProperty(k)) c++;
      return c;
    }

    function capitalise(word) {
      word = word.replace('-', ' ');
      return word.substr(0, 1).toUpperCase() + word.substr(1);
    }

  })();

  /* idTabs ~ Sean Catchpole - Version 2.2 - MIT/GPL */ (function () {
    var dep = {
      "jQuery": "http://code.jquery.com/jquery-latest.min.js"
    };
    var init = function () {
      (function ($) {
        $.fn.idTabs = function () {
          var s = {};
          for (var i = 0; i < arguments.length; ++i) {
            var a = arguments[i];
            switch (a.constructor) {
              case Object:
                $.extend(s, a);
                break;
              case Boolean:
                s.change = a;
                break;
              case Number:
                s.start = a;
                break;
              case Function:
                s.click = a;
                break;
              case String:
                if (a.charAt(0) == '.') s.selected = a;
                else if (a.charAt(0) == '!') s.event = a;
                else s.start = a;
                break;
            }
          }
          if (typeof s['return'] == "function") s.change = s['return'];
          return this.each(function () {
            $.idTabs(this, s);
          });
        }
        $.idTabs = function (tabs, options) {
          var meta = ($.metadata) ? $(tabs).metadata() : {};
          var s = $.extend({}, $.idTabs.settings, meta, options);
          if (s.selected.charAt(0) == '.') s.selected = s.selected.substr(1);
          if (s.event.charAt(0) == '!') s.event = s.event.substr(1);
          if (s.start == null) s.start = -1;
          var showId = function () {
            if ($(this).is('.' + s.selected)) return s.change;
            var id = "#" + this.href.split('#')[1];
            var aList = [];
            var idList = [];
            $("a", tabs).each(function () {
              if (this.href.match(/#/)) {
                aList.push(this);
                idList.push("#" + this.href.split('#')[1]);
              }
            });
            if (s.click && !s.click.apply(this, [id, idList, tabs, s])) return s.change;
            for (i in aList) $(aList[i]).removeClass(s.selected);
            for (i in idList) $(idList[i])//.hide();
            $(this).addClass(s.selected);
            $(id).show();
            return s.change;
          }
          var list = $("a[href*='#']", tabs).unbind(s.event, showId).bind(s.event, showId);
          list.each(function () {
            $("#" + this.href.split('#')[1])//.hide();
          });
          var test = false;
          if ((test = list.filter('.' + s.selected)).length);
          else if (typeof s.start == "number" && (test = list.eq(s.start)).length);
          else if (typeof s.start == "string" && (test = list.filter("[href*='#" + s.start + "']")).length);
          if (test) {
            test.removeClass(s.selected);
            test.trigger(s.event);
          }
          return s;
        }
        $.idTabs.settings = {
          start: 0,
          change: false,
          click: null,
          selected: ".selected",
          event: "!click"
        };
        $.idTabs.version = "2.2";
        $(function () {
          $(".idTabs").idTabs();
        });
      })(jQuery);
    }
    var check = function (o, s) {
      s = s.split('.');
      while (o && s.length) o = o[s.shift()];
      return o;
    }
    var head = document.getElementsByTagName("head")[0];
    var add = function (url) {
      var s = document.createElement("script");
      s.type = "text/javascript";
      s.src = url;
      head.appendChild(s);
    }
    var s = document.getElementsByTagName('script');
    var src = s[s.length - 1].src;
    var ok = true;
    for (d in dep) {
      if (check(this, d)) continue;
      ok = false;
      add(dep[d]);
    }
    if (ok) return init();
    add(src);
}());