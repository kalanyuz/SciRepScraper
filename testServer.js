var express = require('express');
var app = express();

// app.use(express.static(__dirname + '/public'));
// routing functions
// app.get('/', function (req, res) {
//   res.send('Hello World!');
// });
// app.use(express.static('/Users/kalanyuz/Pictures/'));
app.use(express.static('./'));

app.listen(8080);
