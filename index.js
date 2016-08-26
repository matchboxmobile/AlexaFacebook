var Alexa = require('alexa-sdk');
var FB = require('facebook-node');
var util = require('util');

// Messages used for Alexa to tell the user
var repeatWelcomeMessage = "you should be able to read your feed, and make a post using this skill.";

var welcomeMessage = "Welcome to facebook test skill, " + repeatWelcomeMessage;

var stopSkillMessage = "Ok, see you next time!";

var helpText = "You can say things like read my feed, or make a post, what would you like to do?";

var tryLaterText = "Please try again later."

var noAccessToken = "There was a problem getting the correct token for this skill, " + tryLaterText;

var accessToken = "";

// Create a new session handler
var Handler = {
    'NewSession': function () {

        // Access token is pass through from the session information
        accessToken = this.event.session.user.accessToken;
        
        // If we have an access token we can continue.
        if (accessToken) {
            FB.setAccessToken(accessToken);
            this.emit(':ask', welcomeMessage, repeatWelcomeMessage);
        }
        else {
            // If we dont have an access token, we close down the skill. This should be handled better for a real skill.
            this.emit(':tell', noAccessToken, tryLaterText);
        }
    },

    // Read fb feed handler
    'readFeedIntent': function () {
        var alexa = this;

        // Again check if we have an access token
        if (accessToken) {
            // Call into FB module and get my feed
            FB.api("/me/feed", function (response) {
                if (response && !response.error) {
                    // If we have data
                    if (response.data) {
                        var output = "";
                        var max = 3;

                        // Take the top three posts and parse them to be read out by Alexa.
                        for (var i = 0; i < response.data.length; i++) {
                            if (i < max) {
                                output += "Post " + (i + 1) + " " + response.data[i].message + ". ";
                            }
                        }
                        alexa.emit(':ask', output, output);
                    } else {
                        // REPORT PROBLEM WITH PARSING DATA
                    }
                } else {
                    // Handle errors here.
                    console.log(response.error);
                }
            });
        } else {
            this.emit(':tell', noAccessToken, tryLaterText);
        }
    },

    // Write a post to Facebook feed handler.
    'writePostIntent': function () {

        var alexa = this;

        // Chack if we have access tokens.
        if (accessToken) {
            FB.api("/me/feed", "POST",
            {
                // Message to be posted
                "message": "This is Alexa, I can now access a whole new world of information, good luck!"
            }, function (response) {
                if (response && !response.error) {
                    // Alexa output for successful post
                    alexa.emit(':tell', "Post successfull");
                } else {
                    console.log(response.error);
                    // Output for Alexa, when there is an error.
                    alexa.emit(':ask', "There was an error posting to your feed, please try again");
                }
            });

        }else{
            this.emit(':tell', noAccessToken, tryLaterText);
        }
    },

    'AMAZON.CancelIntent': function () {
        // Triggered wheen user asks Alexa top cancel interaction
        this.emit(':tell', stopSkillMessage);
    },

    'AMAZON.StopIntent': function () {
        // Triggered wheen user asks Alexa top stop interaction
        this.emit(':tell', stopSkillMessage);
    },

    // Triggered wheen user asks Alexa for help
    'AMAZON.HelpIntent': function () {
        this.emit(':ask', helpText, helpText);
    },

    // Triggered when no intent matches Alexa request
    'Unhandled': function () {
        this.emit(':ask', helpText, helpText);
    }
};

// Add handlers.
exports.handler = function (event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(Handler);
    alexa.execute();
};
