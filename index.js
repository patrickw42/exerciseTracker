const express = require("express");
const app = express();
const cors = require("cors");
app.use(cors());
require("dotenv").config();

//make public static so html can easily access css file
app.use(express.static("public"));
//open index.html file when root directory of app open (localhost:3000)
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

//used to parse url params
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));

const mongoose = require("mongoose");
//connect to mongo with output success/fail msg uses MONGO_URI from .env file
mongoose.connect(
  process.env.MONGO_URI,
  { useNewUrlParser: true, useUnifiedTopology: true },
  (err) => {
    if (err) return console.log("not connected to database");
    console.log("succesfully connected to database");
  }
);

//import Schemas and create Module
const USER = require("./models/users");
const EXERCISE = require("./models/exercises");

/*
You can POST to /api/users with form data username to create a new user.
The returned response from POST /api/users with form data username will be
an object with username and _id properties.
SEEMS TO WORK
*/
app.post("/api/users", (req, res) => {
  //create new record using username recieved from posted form
  const user = new USER({
    username: req.body.username,
  });
  //can't return whole doc because included _v prop (version?)
  user.save((err, doc) => {
    if (err) console.error(err);
    else res.json({ username: doc.username, _id: doc._id });
  });
});

/*

You can POST to /api/users/:_id/exercises with form data description,
duration, and optionally date. If no date is supplied, the current date
will be used. Returns json object with username(matching id), description,
duration (both unchanged as strings), and date (formatted as toDateString())
test: "The response returned from POST /api/users/:_id/exercises will be the user
object with the exercise fields added."
  SEEMS TO WORK. IF :_id NOT FOUND IN USERS TABLE name OUTPUT AS "unknown"
*/
app.post("/api/users/:_id/exercises", (req, res) => {
  //extract values from the form
  const id = req.params["_id"];
  const { description, duration } = req.body;
  //if date not provided use current date.
  let { date } = req.body;
  if (!date) date = Date.now();

  //extract username from USERS model using findById()
  USER.findById(id, (err, userData) => {
    //return error message if user not found
    if (err || !userData)
      return res.send("error: unknown user please try again");
    //create new exercise object with values posted in form and userObject using EXERCISE model
    const exercise = new EXERCISE({
      userId: userData["_id"],
      description,
      duration,
      date: new Date(date),
    });
    //saving date as Date object passing in yyyy-mm-dd string format from form or Date.now() if not provided

    //save new exercise record
    exercise.save((err, data) => {
      //return json with error msg (in case description or duration not filled in)
      if (err)
        return res.json({
          error:
            ":_id (User ID), description, and duration(number) are all required fields, please go back and re-enter.",
        });
      //respond with object with _id and username from USERS record, and date.toDateString() as well as duration and description unchanged from save object
      return res.json({
        username: userData.username,
        description: data.description,
        duration: data.duration,
        date: data.date.toDateString(),
        _id: userData["_id"],
      });
    }); //end of save()
  }); //end of findById()
});
/*
"You can make a GET request to /api/users to get a list of all users.
The GET request to /api/users returns an array.
Each element in the array returned from GET /api/users is an object literal
containing a user's username and _id."
SEEMS TO WORK
*/
app.get("/api/users", (req, res) => {
  const userArr = [];
  //callback to .find() allows us to iterate over USER records matching first
  //arg ( {} will match all records).
  USER.find({}, (err, users) => {
    if (err) console.error(err);
    //to hold user objects
    const userArr = [];
    // 'users' in callback is array of records found
    users.map((user) => {
      userArr.push({ username: user.username, _id: user._id });
    });
    //return array after pushing all records found
    res.send(userArr);
  });
});

/*
"You can make a GET request to /api/users/:_id/logs to retrieve a full
exercise log of any user.
A request to a user's log GET /api/users/:_id/logs returns a user object
with a count property representing the number of exercises that belong to
that user.
A GET request to /api/users/:id/logs will return the user object with a log
array of all the exercises added."
"Each item in the log array that is returned from GET /api/users/:id/logs is
an object that should have a description, duration, and date properties."
I THINK THE ABOVE WORKS!!
"The description property of any object in the log array that is returned
from GET /api/users/:id/logs should be a string.
The duration property of any object in the log array that is returned from
GET /api/users/:id/logs should be a number.
The date property of any object in the log array that is returned from
GET /api/users/:id/logs should be a string.
Use the dateString format of the Date API."

"You can add from, to and limit parameters to a GET /api/users/:_id/logs
request to retrieve part of the log of any user. from and to are dates in
yyyy-mm-dd format. limit is an integer of how many logs to send back."

*/
app.get("/api/users/:id/logs", (req, res) => {
  //extract id from url params
  const { id } = req.params;
  // extract to, from, and limit from optional params
  let { from, to, limit } = req.query;

  //ignore limit if not Number
  if (!/^\d$/.test(limit)) limit = null;
  //ignore to or from if not in format 'yyyy-mm-dd'
  const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
  if (!regex.test(to)) to = null;
  if (!regex.test(from)) from = null;
  //convert from and to from yyyy-mm-dd to Date() first must remove - , then extract day, month, year to create new Date object to use for searchQuery
  if (from) {
    const newFrom = from.replaceAll("-", "");
    const fromYear = +newFrom.substring(0, 4);
    const fromMonth = +newFrom.substring(4, 6);
    const fromDay = +newFrom.substring(6, 8);
    from = new Date(fromYear, fromMonth - 1, fromDay);
  }
  if (to) {
    const newTo = to.replaceAll("-", "");
    const toYear = +newTo.substring(0, 4);
    const toMonth = +newTo.substring(4, 6);
    const toDay = +newTo.substring(6, 8);
    to = new Date(toYear, toMonth - 1, toDay);
  }

  //get the count of all user's exercise records nest eveything within callback so we can use count later
  EXERCISE.countDocuments({ userId: id }, function (err, count) {
    //'count' will ref the count of all user's exercise logs need to do here before filtered based on params
    //get username based on id using findById nesting everything else within callback so we can access name
    USER.findById(id, (err, userRecord) => {
      if (err) res.send("error - user not found");
      //extract json object from mongoose record found
      const userObj = userRecord.toObject();
      //create searchObj to pass to .find() dynamically
      let searchObj = { userId: id };
      //if to and from params both exist use them
      if (to && from)
        searchObj = {
          userId: id,
          date: { $gte: from, $lte: to },
        };
      //else check one by one to see if just one exists
      // notice syntax of searchObj we can specify conditional functions 'date: { $lte: new Date(to)}}' nest inside {} since '$lte' is function less than or equal to  ':' specifies arg passed to function
      else {
        if (to) searchObj = { userId: id, date: { $lte: to } };
        if (from) searchObj = { userId: id, date: { $gte: from } };
      }
      //iterate over EXERCISES using .find() to find all records that match searchObj with userId(and dates?)
      EXERCISE.find(searchObj, (err, exercises) => {
        //to limit records added to array
        let currCount = 0;
        //to hold logs (arrray of exercise objects)
        const exerciseArr = [];
        //for each record in array add it's description, duration, and date.toDateString() to new object
        if (exercises)
          for (let i = 0; i < exercises.length; i++) {
            const ex = exercises[i];
            let record = {
              description: ex.description,
              duration: ex.duration,
              date: ex.date.toDateString(),
            };
            //if limit  passed & currCount reachs limit stop
            // do above push/increment incase limit = 0
            if (limit && currCount >= limit) break;
            //add to exerciseArr and increment currCount
            exerciseArr.push(record);
            currCount++;
          }

        /*build our log object using exerciseArr, _id and username from User record and count in format:
    {  username:
       count:
       _id:
       log: [exerciseArr] }
 */
        const logObj = {
          username: userRecord.username,
          count: count,
          _id: userRecord["_id"],
          log: exerciseArr,
        };
        //pass to res.json to return Log Object
        res.json(logObj);
      }); //end of .find()
    }); // end of .findById()
  }); //end of countDocuments()
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
