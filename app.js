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

app.post('/screenshot/variant/:variantId', (req, res) => {   
    let newBrowser , newPage, location
    const url = req.body.url || "www.google.com"
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
    .then(() => newPage.screenshot({type: "jpeg" }))
    .then((screenshot) => {
        const params = { Bucket: "sp-assets-staging", Key: `screenshots/variants/${req.params.variantId}`, Body: screenshot, ContentType: "image/jpeg", ACL: "public-read" }
        return s3.upload(params).promise();
    })
    .then(res => location = res.Location)
    .then(() => newBrowser.close())
    .then(() => res.status(201).json({type: "success", screenshotURL : location}))
});

app.listen(4000, () => console.log('server started'));
