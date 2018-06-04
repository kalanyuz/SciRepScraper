var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

// TODO: async library and promises?

//creates new cookie jar
var j = request.jar();
var output = [];

var coreURL = 'http://mts-srep.nature.com/';
var mainURL = 'http://mts-srep.nature.com/cgi-bin/main.plex';
var loginDetails = {
  url: mainURL,
  form: {
    'form_type' : 'login_results',
    'j_id' : 110,
    'ms_id_key' : '15ftdRK61w0uYJQjudLsliMaIQ',
    'login' : 'yaskoike',
    'password' : '50klab54'
  },
  jar: j,
  headers: {
  'User-Agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4) AppleWebKit/601.5.17 (KHTML, like Gecko) Version/9.1 Safari/601.5.17'
  }
}

request({url: mainURL, jar:j}, function (error, response, body) {
  if (error)
    return console.log(error)

  console.log("logging in to Scientific Reports");
  // console.log(j.getCookieString('http://mts-srep.nature.com/cgi-bin/main.plex'));

  request.post(loginDetails, function (error, response, body) {
    if (error) {
      sciRepLogout(j)
      return console.error(error)
    }
    console.log("logged in to Scientific Reports");
    console.log(breakLine);
    // console.log(j.getCookieString('http://mts-srep.nature.com/cgi-bin/main.plex'));
    var $ = cheerio.load(body)

    if ($('a:contains("Post Decision")').length != 1) {
      sciRepLogout(j)
      return console.log('HTML structure mismatched , Author Tasks not found')
    } else {

      var pdPage = $('a:contains("Post Decision")').attr('href');
      request.get({url: coreURL + pdPage, jar: j}, function (error, response, body) {
        if (error) {
          sciRepLogout(j)
          return console.log('Link access error: Post decision')
        }
        var $ = cheerio.load(body)
        // console.log('http://mts-srep.nature.com/' + pdPage);
        if ($('a:contains("Check Status")').length > 0) {
          var pdCount = $('a:contains("Check Status")').length
          console.log('Found ' + pdCount + ' Post Decision manuscript(s)')
          console.log(breakLine)
          $('a:contains("Check Status")').each(function (index, element) {
            var manuscriptPage = $(element).attr('href');
            var lastManuscript = index == pdCount-1 ? true: false;
            var manuscriptResult = handleManuscriptPage(manuscriptPage, lastManuscript, appendOutput);
          }); // <-- each manuscript
        } else {
          console.log('cries')
        }

      })
    }

  })

})

function handleManuscriptPage(manuscriptPagePath, final, callback) {
  request.get({url: coreURL + manuscriptPagePath, jar: j}, function (error, response, body) {
    if (error) {
      sciRepLogout(j);
      return console.error('Link acess error: Manuscript ' + error);
    }
    var $ = cheerio.load(body);

    var rowHeaders = ['Manuscript #','Current Revision','Current Stage','Title'];
    var manuscriptData = {};
    //conduct heavy search once and do detailed search from here
    $('table tr th:contains("Manuscript #")').closest('table').children('tr').each(function (rowIndex, element){
      rowHeaders.forEach(function (header) {
        if ($(element).children('th:contains("'+ header + '")').length > 0) {
          manuscriptData[header.toString()] = $(element).children('th:contains("'+ header + '")').next('td').text().replace('\n','');
        }
      });
    });
    //conduct another heavy search to find the status table, gets only the latest information
    var stageTableHeaders = ['Status', 'Date'];
    $('table tr:contains("Approximate Duration")').next('tr').children('td').slice(1,3).each(function (rowIndex, element) {
      manuscriptData[stageTableHeaders[rowIndex].toString()] = $(element).text().replace('\n','');
    });

    callback(final, manuscriptData);
  });
} //<--- end handleManuscriptPage

function appendOutput(final, manuscriptInfo) {
  output.push(manuscriptInfo);
  for (var property in manuscriptInfo) {
    console.log(property + " : " + manuscriptInfo[property]);
  }
  console.log(breakLine);
  if (final) {
    //JSON output here?
    sciRepLogout(j);
  }
}

function sciRepLogout(cookieObject) {
  request.get({url: 'http://mts-srep.nature.com/cgi-bin/main.plex?form_type=logout', jar: j}, function(error) {
    if (error) {
      console.log(breakLine);
      console.error('Error logging out: ' + error);
    } else {
      console.log('Logout completed');
      console.log(breakLine);
    }
  });
}

var breakLine = '-------------------------------------------------';
