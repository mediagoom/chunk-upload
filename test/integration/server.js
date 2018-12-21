#!/usr/bin/env node

const App = require('./app');


let server = undefined;

const port = process.env.PORT || 3000;

const app = App({base_path : './uploader'});


process.on('SIGINT', function() {
    console.log('RECEIVED SIGINT');
    server.close();
});

process.on('SIGTERM', function() {
    console.log('RECEIVED SIGTERM');
    server.close();
});

server = app.listen(port, function () {
    console.log('app listening on port ' + port + '!');
});



