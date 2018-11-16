import express from 'express';
import uploader from '../server.js';

var app = express();

var port = process.env.PORT || 3000;

app.use(express.static('sample'));
app.use('/js', express.static('./bin'));

app.use('/upload', uploader());

/*
app.get('/', function (req, res) {
  res.send('Hello World!')
})
*/



app.put('/upload', (req, res) => {
    
    console.log('-------------****');
    //console.log(JSON.stringify(req.headers));
    console.log(req.uploader);
    console.log('-------------**--');

       

    res.send('OK');

    
});

app.listen(port, function () {
    console.log('app listening on port ' + port + '!');
});



