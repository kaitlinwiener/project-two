# Project Two - Kaitlin Wiener

https://kw-ga-project2.herokuapp.com/

Technologies Used: Express, Node, Express, ejs, Express-ejs-layouts, express-session, method-override, mongoose, mongodb, body-parser, CSS, HTML, Javascript, JQuery

The Approach Taken:
- started by creating a basic CRUD app for Articles. Built an article Schema and implemented the ability to create, view, edit, and delete articles. When creating and editing articles I had the current date logged
- created user Schema and built ability to login and sign up users and set the req.session.currentUser to the username of the person logged in
- updated Article Schema to automatically include the author as the person logged in
- ability for users to log out by deleting the session
- created navbar across all the pages, later used res.controllers to store the current page and change the navbar accordingly
- had the home page choose an article at random to display as the featured article
- created ability to comment by adding into the articleSchema an array of comments, each comment being an object with a body an author (the current logged in user) and a Date. Had the comments arranged undernearth the corresponding article in reverse chronological order (similar to how the articles are viewed)
- added ability to sort articles by category and by author by rendering different arrays of articles based on the query (so if req.query.category then render all of the articles that have category equal to req.query.category)
- used javascript to only be able to edit articles if logged in and to edit if you are signed in as the owner (me)
- implemented bcrypt to successfully encrypt all user passwords
- then attempted to implement the need for edits to be ratified by 80% of users - I did this by changing my Schema to include an array of bodies, dates, and authors as opposed to just a single one (left the title and category as single strings because they cannot be edited)
  - I then added a key in the schema called approved which includes a boolean a yes number, a no number, and a voted array of Strings.
  - When an article is first created the boolean status is set automatically to true. When an article is edited, the body, date, and author changed are pushed on to their respective arrays. And an approved object with boolean false is pushed to the approved array.
  - When the status of the last object in the approved array is false (the article is under edits) the user is not able to make further edits (the edit button is not shown) and instead there appears two buttons that allow the user to vote yes or no.
  - When the user votes their username is pushed onto the voted array and the buttons are no longer displayed.
  - Both the original and the proposed edits of the article are available to all users until >80% of users vote yes to the changes or >20% vote no.
- I then used Materialize for the majority of the styling - which helped to make the site responsive


Installation Instructions: the app is available at the above website

Unsolved Problems:
- I would like to further work on styling and get more comfortable with CSS, that is definitely a major weakness for me still
- I would have liked to store more user information and create a user profile page. At this point I only require a username and login
