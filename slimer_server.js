// BASE SETUP
// =============================================================================

// call the packages we need
var express    	= require('express');        // call express
var app        	= express();                 // define our app using express
var bodyParser 	= require('body-parser');
var driver = require('node-phantom-simple');

// configure app to use bodyParser()
// this will let us get the data from a POST
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = process.env.PORT || 8888;        // set our port

// ROUTES FOR OUR API
// =============================================================================
var router = express.Router();              // get an instance of the express Router

// test route to make sure everything is working (accessed at GET http://localhost:9999/)
router.post('/', function(req, res) {
	// create global objects for storage and return
	var outObj = [];
	var reqres = [];

	outObj.req = [];
	outObj.res = [];
	outObj.html = '';
	outObj.jpeg = '';
	
	// get the post variables
	var _url = req.body.url;
	var _useragent = req.body.useragent;
	var _delay = req.body.delay;
	var _wd = req.body.width;
	var _ht = req.body.height;

	// var options = {
	// 	path: require('slimerjs').path,
	// 	parameters: {
	// 		'ignore-ssl-errors': 'yes', 
	// 		'ssl-protocol': 'any'
	// 	}
	// };

	driver.create({path: require('slimerjs').path}, function (err, browser) {
		return browser.createPage(function (err, page) {

		// page.captureContent = [ /css/, /image/ ];

        // captureTypes = [ /.*/ ];

		// console.log("UserAgent has been set to " + _useragent);
        page.set('settings', {userAgent: _useragent}, function(err){ if(err){ console.log(err); } });

		// console.log("Screenshot size has been set to " + _wd + "x" + _ht);
        page.set('viewportSize', {width: _wd, height: _ht}, function(err){ if(err){ console.log(err); } });

        // set capture content types
        // page.set('captureContent', captureTypes, function(err){ if(err){ console.log(err); } });

        // gather all request objects
        page.onResourceRequested = function(requestData, networkRequest) {
            // console.log("Resources Being Requested.");
            outObj.req.push(requestData);
        };

        // gather all response objects
        page.onResourceReceived = function(responseData) {
            if(responseData.stage == 'end'){
            	outObj.res.push(responseData);
            }
        };

        page.onLoadFinished = function(status){
        	// render the site screenshot in base64 encoded and save it for later
		    page.renderBase64('jpeg', function(err, imagedata){
				outObj.jpeg = imagedata;
		    });

		    // get page html
		    page.get('content', function(err, html){
		    	outObj.html = html;
		    });
		};

        return page.open(_url, function (err,status) {

	        	function sortByKey(array, key) {
		            return array.sort(function(a, b) {
		                var x = a[key]; var y = b[key];
		                return ((x < y) ? -1 : ((x > y) ? 1 : 0));
		            });
		        }

		        var sorted_req = sortByKey(outObj.req, 'id');
		        var sorted_res = sortByKey(outObj.res, 'id');

		        for (var i = 0; i <= outObj.req.length-1; i++)
		            reqres.push({req: sorted_req[i], res: sorted_res[i]});

		        setTimeout(function(){
		        	res.json({
			            status: status,
			            reqres: reqres,
			            jpg: outObj.jpeg,
			            html: outObj.html
			        });
			        browser.exit();
		        }, _delay);
	  		});
		});
	});
});

// REGISTER OUR ROUTES -------------------------------
// all of our routes will be prefixed with /
app.use('/', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('API Server started on port ' + port);
