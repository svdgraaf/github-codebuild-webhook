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

// this function will be triggered by the github webhook
module.exports.start_build = (event, context, callback) => {

  var response;

  // we only act on pull_request changes (can be any, but we don't need those)
  if('pull_request' in event) {

    var head = event.pull_request.head;
    var repo = head.repo;

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

        var build = data.build;

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
        callback(null, build);
      }
    });
  } else {
    callback("Not a PR");
  }
}

module.exports.check_build_status = (event, context, callback) => {
  var params = {
    ids: [event.id]
  }
  codebuild.batchGetBuilds(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      context.fail(err)
      callback(err);
    } else {
      callback(null, data.builds[0]);
    }
  });
}

module.exports.build_done = (event, context, callback) => {
  // get the necessary variables for the github call
  var url = event.source.location.split('/');
  var repo = url[url.length-1].replace('.git', '');
  var username = url[url.length-2];

  console.log('Found commit identifier: ' + event.sourceVersion);
  var state = '';

  // map the codebuild status to github state
  switch(event.buildStatus) {
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
    owner: username,
    repo: repo,
    sha: event.sourceVersion,
    state: state,
    target_url: 'https://' + region + '.console.aws.amazon.com/codebuild/home?region=' + region + '#/builds/' + event.id + '/view/new',
    context: 'CodeBuild',
    description: 'Build ' + event.buildStatus + '...'
  }).catch(function(err){
    console.log(err);
    context.fail(data);
  });
}
