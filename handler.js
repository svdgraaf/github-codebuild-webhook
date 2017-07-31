'use strict';

var AWS = require('aws-sdk');
var codebuild = new AWS.CodeBuild();

var GitHubApi = require("github");
var github = new GitHubApi();
var BUILD_ACTIONS = [
    "opened",
    "reopened",
    "synchronize"
];

// setup github client
github.authenticate({
    type: "basic",
    username: process.env.GITHUB_USERNAME,
    password: process.env.GITHUB_ACCESS_TOKEN
});

// get the region where this lambda is running
var region = process.env.AWS_DEFAULT_REGION;

// this function will be triggered by the github webhook
module.exports.start_build = (event, context, callback) => {

  var response = {
    pull_request: {},
    build: {}
  };

  // we only act on pull_request changes (can be any, but we don't need those)
  if('pull_request' in event) {

    if(BUILD_ACTIONS.indexOf(event.action) >= 0) {

      response.pull_request = event.pull_request
      var head = event.pull_request.head;
      var base = event.pull_request.base;
      var repo = base.repo;

      var params = {
        projectName: process.env.BUILD_PROJECT,
        sourceVersion: 'pr/' + event.pull_request.number
      };

      // start the codebuild process for this project
      codebuild.startBuild(params, function(err, data) {
        if (err) {
          console.log(err, err.stack);
          callback(err);
        } else {

          response.build = data.build;

          // all is well, mark the commit as being 'in progress'
          github.repos.createStatus({
            owner: repo.owner.login,
            repo: repo.name,
            sha: head.sha,
            state: 'pending',
            target_url: 'https://' + region + '.console.aws.amazon.com/codebuild/home?region=' + region + '#/builds/' + data.build.id + '/view/new',
            context: 'CodeBuild',
            description: 'Build is running...'
          }).then(function(data){
            console.log(data);
          });
          callback(null, response);
        }
      });
    } else {
      callback("Event is not a build action")
    }
  } else {
    callback("Not a PR");
  }
}

module.exports.check_build_status = (event, context, callback) => {
  var response = event;
  var params = {
    ids: [event.build.id]
  }
  codebuild.batchGetBuilds(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      context.fail(err)
      callback(err);
    } else {
      response.build = data.builds[0]
      callback(null, response);
    }
  });
}

module.exports.build_done = (event, context, callback) => {
  // get the necessary variables for the github call
  var base = event.pull_request.base;
  var head = event.pull_request.head;
  var repo = base.repo;

  console.log('Found commit identifier: ' + head.sha);

  // map the codebuild status to github state
  var buildStatus = event.build.buildStatus;
  var state = '';
  switch(buildStatus) {
    case 'SUCCEEDED':
      state = 'success';
      break;
    case 'FAILED':
      state = 'failure';
      break;
    case 'FAULT':
    case 'STOPPED':
    case 'TIMED_OUT':
      state = 'error'
    default:
      state = 'pending'
  }
  console.log('Github state will be', state);

  github.repos.createStatus({
    owner: repo.owner.login,
    repo: repo.name,
    sha: head.sha,
    state: state,
    target_url: 'https://' + region + '.console.aws.amazon.com/codebuild/home?region=' + region + '#/builds/' + event.build.id + '/view/new',
    context: 'CodeBuild',
    description: 'Build ' + buildStatus + '...'
  }).catch(function(err){
    console.log(err);
    context.fail(data);
  });
}
