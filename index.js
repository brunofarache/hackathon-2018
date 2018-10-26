require('dotenv').config();

const http = require('http');
const express = require('express');
var cors = require('cors')
const api = require('instagram-node').instagram();
const request = require('request');
const app = express();
const { predict } = require('./instagram');
var bodyParser = require('body-parser');

const sendError = (res, message) => {
    res.status(500).send({
        status: 'error',
        message
    })
}

var port = 3000;

if (process.env.PORT) {
    port = process.env.PORT;
}

app.use(cors());
app.use(bodyParser.json());

api.use({
    client_id: process.env.client_id,
    client_secret: process.env.client_secret
});

var redirectURL = 'http://localhost:' + port;

if (process.env.REDIRECT_URL) {
    redirectURL = process.env.REDIRECT_URL;
}

redirectURL += '/redirect';

app.get('/auth', (req, res) => {
    res.redirect(api.get_authorization_url(redirectURL, {
        scope: ['basic', 'public_content'],
        state: '' 
    }));
});

var liferayURL = 'http://localhost:8080';

if (process.env.LIFERAY_URL) {
    liferayURL = process.env.LIFERAY_URL;
}

app.get('/redirect', (req, res) => {
    api.authorize_user(req.query.code, redirectURL, function(err, result) {
        if (err) {
            console.log(err.body);
            res.send("Didn't work");
        }
        else {
            console.log('Access token: ' + result.access_token);
            res.redirect(`${liferayURL}/?access_token=${result.access_token}&name=${result.user.full_name}&username=${result.user.username}`);
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

            return predict(res, images);
        }
    )
});

app.post('/bot', (req, res) => {
    var weight = req.body.queryResult.parameters.weight;
    var height = req.body.queryResult.parameters.height;
    var smokes = req.body.queryResult.parameters.smokes;

    console.log(req.body);

    var result = {
        "fulfillmentText": ""
    }
    
    var imc = weight / (height * height);

    if (smokes == 'true') {
        result.fulfillmentText = "Ih mi amigo, usted fuma, su seguro costará 3000 reales al mes.";
    }
    else if (imc < 18.5) {
        result.fulfillmentText = "¡Usted está desnutrido! Su seguro costará 650 reales al mes.";
    }
    else if (imc > 25) {
        result.fulfillmentText = "Usted está con sobrepeso! Su seguro costará 650 reales al mes.";
    }
    else {
        result.fulfillmentText = "Usted está con el peso normal, el seguro costará 350 reales al mes.";
    }

    var resultJson = JSON.stringify(result);
    console.log('result' + resultJson);
    res.send(resultJson);
});
 
http.createServer(app).listen(port, function(){
    console.log("Express server listening on port: " + port);
});
