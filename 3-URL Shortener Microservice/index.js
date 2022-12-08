require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const mongoose = require('mongoose');

//Cosas incluidas en Node para facilitar
const bodyParser = require("body-parser");
const dns = require("dns");
const urlParser = require("url");

//Configuro MongoDB / mongoose
const mySecret = process.env['MONGO_URI']
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });
const port = process.env.PORT || 3000;
let urlSchema = new mongoose.Schema({ url: { type: String, required: true }})
var Url = mongoose.model("Url", urlSchema);


app.use(bodyParser.urlencoded({extended: false}))
app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.post('/api/shorturl/', function(req, res) {
  //console.log(req)
  const bodyUrl = req.body.url;
  //urlParser.parse(bodyUrl).hostname para que pase solamente el host del url, sacando el hhtps//.. etc
  //y lo paso a .dns para ver si es una url existente
  const lookUp = dns.lookup(urlParser.parse(bodyUrl).hostname,(err,add)=>{
    if (!add){
      res.json({ error: 'Invalid URL'})
    }else{
      const urlTest = new Url( { url: bodyUrl } )
      urlTest.save((err,data)=>{
        if(err) return console.error(err);
        res.json({ original_url: data.url, short_url: data.id})
      })
    }
  })
});

//En caso de intentar entrar con una ID de una, busco la id en la db, si encuentro data redirecciono al url original
app.get("/api/shorturl/:id",(req,res)=>{
  const id = req.params.id;
  Url.findById(id,(err,data)=>{
    if(!data){
      res.json({error: 'Invalid URL'})
    }else{
      res.redirect(data.url)
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
