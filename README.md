# exerciseTracker


To run must have Node installed. 
Open a terminal from the root directory of project and run the following commands:

npm i express

npm i mongoose

npm i body-parser

npm i dotenv

To run program type:
node index.js

and open a webbrowser to 'localhost:3000'


Connects to a Mongo Database storing User records with username from first form. The exercise form creates an exercise records linked to the user based on their User record's primary _id. 


The returned response from POST /api/users with form data username will be an object with username and _id properties.

You can make a GET request to /api/users to get a list of all users.
Each element in the array returned from GET /api/users is an object literal containing a user's username and _id.

You can POST to /api/users/:_id/exercises with form data description, duration, and optionally date. If no date is supplied, the current date will be used.
The response returned from POST /api/users/:_id/exercises will be the user object with the exercise fields added.

You can make a GET request to /api/users/:_id/logs to retrieve a full exercise log of any user.
A request to a user's log GET /api/users/:_id/logs returns a user object with count property representing the number of exercises that belong to that user(unfiltered).

A GET request to /api/users/:id/logs will return the user object with a log array of all the exercises added.

Each item in the log array that is returned from GET /api/users/:id/logs is an object that should have a description, duration, and date properties.

The date property of any object in the log array that is returned from GET /api/users/:id/logs is converted to a String

You can add from, to and limit parameters to a GET /api/users/:_id/logs request to retrieve part of the log of any user. 

Ensures that from and to are dates in yyyy-mm-dd format and limit is an integer of how many logs to send back.

HTML and CSS provided by freecodecamp.org
