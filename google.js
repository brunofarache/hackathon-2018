require('dotenv').config();

const vision = require('@google-cloud/vision');
const client = new vision.ImageAnnotatorClient();

function detect(url) {
    return new Promise((resolve, reject) => {
        client
        .labelDetection(url)
        .then(results => {
            const labels = results[0].labelAnnotations;
            var descriptions = labels.map((label) => {
                return label.description;
            });
    
            throw new Error('iuiu');
            resolve(descriptions);
            
        }).catch(reject);
    })
}