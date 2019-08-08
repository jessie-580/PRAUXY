// Install body-parser and Express
const express = require('express')
const app = express()

var bodyParser = require('body-parser')
var multer  = require('multer');
var fs = require("fs");

const MongoClient = require('mongodb').MongoClient;
const url = "mongodb://localhost:27017/";

const _PM = require('../proxy/proxy');

// Use req.query to read values!!
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const storage = multer.diskStorage({ // notice you are calling the multer.diskStorage() method here, not multer()
    destination: function(req, file, cb) {
        cb(null, 'tmp/')
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname)
    }
});
var upload = multer({ storage })

app.use('/assets', express.static("./dashboard/frontend/assets"));

app.get("/", (req, res) => {
    res.sendFile("./dashboard/frontend/index.html", {root: "./"})
})

app.get("/new", (req, res) => {
    res.sendFile("./dashboard/frontend/new.html", {root: "./"})
})

/*

MongoDB Schema:
{
    name: "Visual Studio Code",
    short: "vsc",
    image: "vsc.png",
    port: 8443,
    requiresAuthentication: true
}

*/

app.get('/api/all', (req, res) => {
    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbo = db.db("homerouter");
        dbo.collection("applications").find({}).toArray(function(err, result) {
            if (err) throw err;
            res.json(result);
            db.close();
        });
    });
})

app.post('/api/new', upload.single('icon'), (req, res) => {
    const name = req.body.name;
    const shortName = req.body.short;
    const isImage = req.file ? true : false;
    const port = req.body.port;
    const requiresAuthentication = req.body.ra;
    const image = req.file.originalname;

    const newApp = {name: name, image: image, shortName: shortName, isImage: isImage, port: port, requiresAuthentication: requiresAuthentication};
    var file = __dirname + '/frontend/assets/apps/' + req.file.originalname;

    fs.renameSync(req.file.path, file);

    MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
        var dbo = db.db("homerouter");

        dbo.collection("applications").insertOne(newApp, function(err, result) {
            if (err) throw err;

            _PM.add(shortName, port);

            res.redirect("http://home.kentonvizdos.com")
            db.close();
        });
    });
    
})

app.listen(8081, () => console.log('Dashboard Server Started'))