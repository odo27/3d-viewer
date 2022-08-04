process.umask(0);
var express = require('express');
var multer = require('multer');
var bodyParser = require('body-parser');
var app = express();

const path = require('path');
const fs = require('fs');

const mysql = require('mysql');
const conn = {
  host: '34.64.245.91',
  port: '3306',
  user: 'root',
  password: 'qwerasdf12',
  database: 'ict'
};

let connection = mysql.createConnection(conn);
connection.connect()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, __dirname + '/public/tempDir')
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
})

var upload = multer({
  storage: storage
});

var upload2 = multer({
  storage: multer.diskStorage({
    destination: function(req, file, cb) {
      cb(null, __dirname+'/public/userDrive/ict_test_id');
    },
    filename: function(req, file, cb) {
      cb(null, file.originalname);
    }
  })
});

app.use(express.static('public'))

app.listen(8080, function() {
  console.log("express started on port 8080");
});

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/public/index.html');
})

app.post('/test/save', upload.array('IMG_FILE'), function(req, res) {
  console.log(req.body.path);
  console.log(req.files);
  console.log(req.files.length);

  for (let i=0; i<req.files.length; i++) {
	  var oldname = __dirname + '/public/tempDir/' + req.files[i].originalname;
	  var newname = __dirname + '/public/userDrive/' + req.body.path + '/' + req.files[i].originalname;
	  console.log(oldname);
	  console.log(newname);
    fs.rename(__dirname + '/public/tempDir/' + req.files[i].originalname, __dirname + '/public/userDrive/' + req.body.path + '/' + req.files[i].originalname, function (err) {
      if (err) {
        return console.error(err);
      }
    })
  }

  res.redirect('/drive.html?' + req.body.path);
})

app.post('/directory', function(req, res) {
  console.log(req.body.directoryName);
  var directoryPath = path.join(__dirname, 'public/userDrive', req.body.directoryName);
  fs.readdir(directoryPath, function(err, files) {
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }
    console.log(files);
    res.send(files);
    res.end();
    files.forEach(function(file) {
      console.log(file);
    });
  });

})

app.post('/process/create', function(req, res) {
  var query = "SELECT EXISTS (SELECT * from ict.user where id='" + req.body.id + "' limit 1) as success;";
  connection.query(query, function(err, results, fields) {
    if (results[0].success) {
      res.redirect('/idExist.html');
    } else {
      var createUserInfo = "INSERT INTO ict.user VALUES ('" + req.body.name + "', '" + req.body.email + "', '" + req.body.id + "', '" + req.body.password + "');";
      connection.query(createUserInfo, function(err, results, fields) {
        fs.mkdir(path.join(__dirname, 'public/userDrive', req.body.id), 0777, (err) => {
          if (err) {
            return console.log(err);
          }
          console.log('directory created successfully!');
        })
        res.redirect('/index.html');
      });
    };
  });
});

app.post('/process/login', function(req, res) {
  var query = "SELECT EXISTS (SELECT * from ict.user where id='" + req.body.id + "' limit 1) as success;";
  connection.query(query, function(err, results, fields) {
    if (results[0].success) {
      var getPassword = "SELECT password from ict.user where id='"+ req.body.id + "';";
      connection.query(getPassword, function(err, results, fields) {
        if (req.body.password == results[0].password) {
          res.redirect('/drive.html?' + req.body.id);
        }
        else {
          res.redirect('/wrongPassword.html');
        }
      })
    } else {
      res.redirect('/idNoExist.html');
    };
  });
})

app.get('/download/:id/:file', function(req, res){
  console.log(req.query);
  var file = __dirname + '/public/userDrive/' + req.params.id + '/' + req.params.file;
  if (req.params.file != undefined || req.params.id != undefined) {
	  res.download(file);
  }
});

app.get('/download/:file', function(req, res){
  var file = __dirname + '/' + req.params.file;
  res.download(file);
});

app.get('/myfiles/:id', function(req, res){
  console.log(req.params.id);
  var directoryPath = __dirname + '/public/userDrive/' + req.params.id;
  fs.readdir(directoryPath, function(err, files) {
    if (err) {
      return console.log('Unable to scan directory: ' + err);
    }
    console.log(files);
    res.send(files);
  });
});

app.post('/upload', upload2.single('file'), function(req, res) {
  console.log('here');
  res.sendStatus(200);
});

app.get('/vision', function(req, res) {
  res.sendFile(__dirname + '/public/vision.html');
});

app.get('/reconstruction', function(req, res) {
  res.sendFile(__dirname + '/public/reconstruction.html');
});
