(function (){

$(document).ready(function(){
    // Define console if it isn't already
    if(typeof console == 'undefined')
    {
        console = {
            log: function(){},
            error: function(msg){errors.push(msg);}
        };
    }

var style = [
'.info-ta-show{background: -webkit-gradient(linear, left top, left bottom, from(#FFF), to(#EBEDFC)); border-radius:0.5em;border:1px solid #CCC;margin-left:-2.56em;padding-left:2.56em;box-shadow: 1px 1px 2px #666;}',
'.info-button{text-shadow: #fff 1px 1px 1px; box-shadow: 1px 1px 2px #666; position:absolute; left: 0px; padding: 2px; display:block;width:60px;background:#CCC;margin:-1px 0;text-align:center;color:#333;text-decoration:none;font-size:0.8em;border-radius:1em;}',
'.info-button:hover,.info-button:focus,.info-ta-show .info-button{background:#CCC !important;}',
'.info-pane{display:none;font-size: 0.8em;}',
'.info-ta-show .info-pane{display:block;}'
    ]

    // Add styles for this page
    $('head').append('<style>'+style.join('')+'</style>');

    // Returns a function that changes the loading message for the given
    // element, based on the xhr result.
    var handleError = function(filename, $infoEl)
    {
        return function(xhr, status, err) {
            var errText = (status == 'error') ? 'file not found' : (status == 'parsererror') ? 'parse error' : status;
            $infoEl.addClass('bad').text('Loading "'+filename+'" failed: '+errText);
        };
    };

    var assertions = parseAssertions();

    // Get the data!
    $.ajax({
        url: "test-suite/test-suite.xml",
        dataType: "xml",
        success: function(ret){
            //$loadSuite.remove();
            parseTests(ret, assertions);
            start(assertions);
        },
        //error: handleError("test-suite.xml", $loadSuite)
    });
});

function start(assertions)
{
    // info button
    var b = $('<a>').attr('class', 'info-button').click(function(e){
        var par = $(this).parent();
		e.preventDefault();
        if (par.hasClass('info-ta-hide'))
        {
            par.removeClass('info-ta-hide');
            par.addClass('info-ta-show');
            return false;
        }
        else if (par.hasClass('info-ta-show'))
        {
            par.removeClass('info-ta-show');
            par.addClass('info-ta-hide');
            return false;
        }

        var assId = par.attr('id');

        var tests = assertions[assId].tests;
        var list = $('<dl>');
        for (var i = 0; i < tests.length; i++)
        {
            var t = tests[i];
            list.append('<dt>Test <a href="test-suite/Overview.html#'+assId+'">'+
                t.id+'</a> (<a href="test-suite/'+t.src+'">download</a>)</dt><dd>'+t.desc+'</dd>');
        }

        par.addClass('info-ta-show').append($('<div>').addClass('info-pane').append(list));
    });

    for (var ass in assertions)
    {
        if(assertions.hasOwnProperty(ass))
        {
            $('#'+ass).prepend(b.clone(true).attr('href', '#'+ass).text("Tests:" + assertions[ass].tests.length));
        }
    }
    return false;
}

function parseAssertions()
{
    var assertions = {};

    // Find all assertion paragraphs
    $('p[id^="ta-"]').each(function(){
        var $this = $(this);
        // To hold this assertion's data
        var a = {
            id: $this.attr('id'),
            desc: $this.html(),
            tests: []
        };

        assertions[a.id] = a;
    });

    return assertions;
}

function parseTests(tests, assertions)
{
    var $tests = $(tests);
    var tests = [];
    var unknownAssertions = {};

    $tests.find('test').each(function(){
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
        if (ass)
        {
            ass.tests.push(t);
            tests.push(t);
        }
        else
        {
            console.error('Test '+t.id+' is for an unknown assertion ('+
                assId+')');
            unknownAssertions[assId] = unknownAssertions[assId] || {
                id: assId, desc: '', tests: []
            };
            unknownAssertions[assId].tests.push(t);
        }
    });

    return {tests: tests, unknownAssertions: unknownAssertions};

}

})();
