'use strict';

var AWS = require('aws-sdk');
var codebuild = new AWS.CodeBuild();

var GitHubApi = require("github");
var github = new GitHubApi();

// setup github client
github.authenticate({
    type: "basic",
    username: process.env.GITHUB_USERNAME,
    password: process.env.GITHUB_ACCESS_TOKEN
});

// get the region where this lambda is running
var region = process.env.AWS_DEFAULT_REGION;
var repo = process.env.GITHUB_REPOSITORY.split('/');


module.exports.resource = (event, context, callback) => {
  console.log("REQUEST RECEIVED:\n" + JSON.stringify(event));

  // For Delete requests, immediately send a SUCCESS response.
  if (event.RequestType == "Delete") {
      // TODO remove webhook from repo
      sendResponse(event, context, "SUCCESS");
      return;
  } else {
    var data = {
      owner: repo[3],
      repo: repo[4],
      name: 'web',
      events: ['pull_request'],
      active: true,
      config: {
        url: event.ResourceProperties.Endpoint,
        content_type:"json"
      }
    };

    if(event.RequestType == "Create") {
      github.repos.createHook(data).then(function(data){
        sendResponse(event, context, "SUCCESS", {});
      }).catch(function(err){
        console.log(err);
        sendResponse(event, context, "FAILED", {});
      });

    } else {
      // TODO: support editing hooks by id
      // https://mikedeboer.github.io/node-github/#api-repos-editHook
      sendResponse(event, context, "SUCCESS", {});
    }
  }
}

// Send response to the pre-signed S3 URL
function sendResponse(event, context, responseStatus, responseData) {

    var responseBody = JSON.stringify({
        Status: responseStatus,
        Reason: "See the details in CloudWatch Log Stream: " + context.logStreamName,
        PhysicalResourceId: context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: responseData
    });

    console.log("RESPONSE BODY:\n", responseBody);

    var https = require("https");
    var url = require("url");

    var parsedUrl = url.parse(event.ResponseURL);
    var options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.path,
        method: "PUT",
        headers: {
            "content-type": "",
            "content-length": responseBody.length
        }
    };

    console.log("SENDING RESPONSE...\n");

    var request = https.request(options, function(response) {
        console.log("STATUS: " + response.statusCode);
        console.log("HEADERS: " + JSON.stringify(response.headers));
        // Tell AWS Lambda that the function execution is done
        context.done();
    });

    request.on("error", function(error) {
        console.log("sendResponse Error:" + error);
        // Tell AWS Lambda that the function execution is done
        context.done();
    });

    // write data to request body
    request.write(responseBody);
    request.end();
}
