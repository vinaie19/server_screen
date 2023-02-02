const { chromium } = require("playwright");
const AWS = require("aws-sdk");
require('dotenv').config()


AWS.config.update({
	accessKeyId: process.env.ACCESSKEYID,
	secretAccessKey: process.env.SECRETACCESSKEY
});
const ep = new AWS.Endpoint("https://sgp1.digitaloceanspaces.com/");
const s3 = new AWS.S3({ endpoint: ep });

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());

app.post('/screenshots/:Id', (req, res) => {   
    let newBrowser , newPage, location
    const url = req.body.url || "www.google.com"
    const locator = req.body.domElement
    chromium.launch()
    .then(browser => {
        newBrowser = browser
        return browser.newPage()
    })
    .then((page) => {
        newPage = page
        return newPage.setViewportSize({ width: 1280, height: 1080 })
    })
    .then(() => newPage.goto(url, {waitUntil: "networkidle0"}))
    .then(() => { 
        if(locator){
        return newPage.locator(locator).screenshot({type: "jpeg" })
        }else{
        return newPage.screenshot({type: "jpeg" })
        }
})
    .then((screenshot) => {
        const params = { Bucket: "sp-assets-staging", Key: `screenshots/${req.params.Id}`, Body: screenshot, ContentType: "image/jpeg", ACL: "public-read" }
        return s3.upload(params).promise();
    })
    .then(res => location = res.Location)
    .then(() => newBrowser.close())
    .then(() => res.status(201).json({type: "success", screenshotURL : location}))
    .catch((e) =>{
            res.status(400).json({
                type: "failure",
                message: e
            });
    })
});

app.listen(4000, () => console.log('server started'));
