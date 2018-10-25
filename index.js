require('dotenv').config();

var http = require('http');
var express = require('express');
var api = require('instagram-node').instagram();
var app = express();

api.use({
    client_id: process.env.client_id,
    client_secret: process.env.client_secret
});

var redirect_uri = 'http://localhost:3000/redirect';

app.get('/auth', (req, res) => {
    res.redirect(api.get_authorization_url(redirect_uri, {
        scope: ['basic', 'public_content'],
        state: '' 
    }));
});

app.get('/redirect', (req, res) => {
    api.authorize_user(req.query.code, redirect_uri, function(err, result) {
        if (err) {
            console.log(err.body);
            res.send("Didn't work");
        }
        else {
            var token = result.access_token;
            console.log('Access token is ' + token);
            api.use({ access_token: token });
            res.redirect('http://localhost:8080/?access_token=' + token);
        }
    });
});
 
http.createServer(app).listen(3000, function(){
    console.log("Express server listening on port 3000");
});