require('dotenv').config();

const REDIRECT_URL = 'http://localhost:3000/redirect';
const http = require('http');
const express = require('express');
const api = require('instagram-node').instagram();
const request = require('request');
const app = express();

const sendError = (res, message) => {
    res.status(500).send({
        status: 'error',
        message
    })
}

const predict = (res, images) => res.status({
    status: 'success'
})

api.use({
    client_id: process.env.client_id,
    client_secret: process.env.client_secret
});


app.get('/auth', (req, res) => {
    res.redirect(api.get_authorization_url(REDIRECT_URL, {
        scope: ['basic', 'public_content'],
        state: '' 
    }));
});

app.get('/redirect', (req, res) => {
    api.authorize_user(req.query.code, REDIRECT_URL, function(err, {access_token}) {
        if (err) {
            console.log(err.body);
            res.send("Didn't work");
        }
        else {
            res.redirect(`http://localhost:8080/?access_token=${access_token}`);
        }
    });
});

app.get('/make-prediction', (req, res) => {
    const {access_token} = req.query;

    if(!access_token) {
        return sendError(res, 'You need to inform a valid access token');
    }

    request(
        `https://api.instagram.com/v1/users/self/media/recent/?access_token=${access_token}`, 
        (error, response, body)=> {
            body = JSON.parse(body);

            if(body.meta && body.meta.code == 400) {
               return sendError(res, body.meta.error_message);
            }
            
            const images = body.data.map(media => media.images.standard_resolution.url);

            return predict(images);
        }
    )
});
 
http.createServer(app).listen(3000, function(){
    console.log("Express server listening on port 3000");
});