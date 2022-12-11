var express = require('express');
var cors = require('cors');
require('dotenv').config()
var multer = require('multer')
var upload = multer({ dest: 'uploads/' })
var app = express();

app.use(cors());
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});
//No se pide que almacene nada en una DB, solamente devolver informacion del archivo subido, recomendando usar MULTER
app.post("/api/fileanalyse", upload.single('upfile'), (req, res) => {
  //var fileName = req.file.originalname;
  //var fileType = req.file.mimetype;
  //var fileSize = req.file.size;
  res.json({
    "name": req.file.originalname,
    "type": req.file.mimetype,
    "size": req.file.size
  })
})

const port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Your app is listening on port ' + port)
});

