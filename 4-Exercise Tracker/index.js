require('dotenv').config();
const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors')
const app = express()

app.use(cors())
app.use(express.json());
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(bodyParser.urlencoded({extended: false}));

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
//Configuro MongoDB/Mongoose
const mySecret = process.env['MONGO_URI']
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });
const port = process.env.PORT || 3000;

//Creo los schema y models para MongoDb
const Schema = mongoose.Schema;

const exerciseSchema = new Schema({
  userId: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: Number, min: 1, required: true },
  date: { type: Date, default: Date.now }
})
const userSchema = new Schema({
  username: { type: String, unique: true, required: true }
})

let Exercise = mongoose.model('Exercise', exerciseSchema);
let User = mongoose.model('User', userSchema);

//Creo un nuevo usuario en la DB, checkeo si ya existe
app.post("/api/users", (req, res) => {
  //Caso de no introducir un usuario
  if (req.body.username === '') {
    return res.json({error: 'Usuario Requerido el campo no puede quedar en blanco'});
  }
  //En caso de que no exista creo un nuevo usuario con su respectivo ID
  let username = req.body.username;
  User.findOne({username: username}, (err, data) => {
      if (!err & data === null) {
        let newUser = new User({ username: username});
        newUser.save(function (err, data) {
          if (!err) {
            let _id = data['_id'];
            return res.json({
              username: username,
              _id: _id
            });
          }
        });
      } else {
        res.json("Usuario existente");
      } 
  });
});

//Encuentro usuario por su ID
app.get('/api/users', function (req, res) {
  User.find({}, function (err, data) {
      if (!err) {
        return res.json(data);
      }
  })
})

//Data introducida en la zona de "Add exercises"
app.post('/api/users/:_id/exercises', async function (req, res) {

  //Check de que todos los campos estén completos
  if(req.params._id === '0' || req.body.description === '' || req.body.duration === ''){
    return res.json({ error: 'Los campos de _id-description-duration no pueden estar en blanco'})
  }
  //Para mayor facilidad almaceno los parametros del request en variables
  let userId = req.params._id;
  let description = req.body.description;
  let duration = req.body.duration;

  let date;
  
  if (req.body.date) {
    const str = req.body.date.split("-");
    date =new Date(str[0], str[1] - 1, str[2])
  } else {
    date = new Date()
  }
  
  if (isNaN(duration)) {
    return res.json({error: 'Duration debe ser un numero'});
  }

  if (date == "Invalid Date") {
    return res.json({error: 'Fecha inexistente'});
  }  

  const findOne = await User.findById(userId);
  
  User.findById(userId, async function (err, data) {
    if (!err && data !== null) {
      let newExercise = new Exercise({
        userId: userId,
        description: description,
        duration: duration,
        date: date
      })

      await newExercise.save();
      
    } else {
      return res.json({error: 'username no encontrado'});
    }
  })
        
  res.send({
    _id: findOne._id,
    username: findOne.username,
    description: description,
    duration: +duration,
    date: date.toDateString()           
  }) 
}) 

app.get('/api/users/:_id/exercises', function (req, res) {
  res.redirect('/api/users/' + req.params._id + '/logs');
})

app.get("/api/users/:id/logs", (req, res) => {
  const { from, to, limit } = req.query;
  const {id} = req.params;
  User.findById(id, (err, userData) => {
    if(err || !userData) {
      res.send("Usuario no encontrado");
    }else{
      let dateObj = {}
      if(from){
        dateObj["$gte"] = new Date(from)
      }
      if(to){
        dateObj["$lte"] = new Date(to)
      }
      let filter = {
        userId: id
      }
      if(from || to ){
        filter.date = dateObj
      }
      let nonNullLimit = limit ?? 500
      Exercise.find(filter).limit(+nonNullLimit).exec((err, data) => {
        if(err || !data){
          res.json([])
        }else{
          const count = data.length
          const rawLog = data
          const {username, _id} = userData;
          const log= rawLog.map((l) => ({
            description: l.description,
            duration: l.duration,
            date: l.date.toDateString()
          }))
          res.json({username, count, _id, log})
        }
      })
    } 
  })
})


app.use((req, res, next) => {
  return next({ status: 404, message: 'not found'})
})
