'use strict';

var AWS = require('aws-sdk')
var codebuild = new AWS.CodeBuild();
var GitHubApi = require("github");

var github = new GitHubApi();
github.authenticate({
    type: "basic",
    username: process.env.GITHUB_USERNAME,
    password: process.env.GITHUB_KEY
});

// get the region where this lambda is running
var region = process.env.AWS_DEFAULT_REGION;

// time in minutes for which we'll keep updating the commit after the build is finished
var diff_timelength = 60 * 5 * 1000;

// this function will be triggered by the github webhook
module.exports.trigger_build = (event, context, callback) => {

  // parse the github json event
  var body = JSON.parse(event.body);
  var response;

  // we only act on pull_request changes (can be any)
  if('pull_request' in body) {

    var head = body.pull_request.head;
    var repo = head.repo;

    var params = {
      projectName: process.env.BUILD_PROJECT,
      sourceVersion: head.sha
    };

    // start the codebuild process for this project
    codebuild.startBuild(params, function(err, data) {
      if (err) {
        console.log(err, err.stack);
        response = {
          statusCode: 501,
          body: JSON.stringify("Build start failed"),
        };
      } else {

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
        response = {
          statusCode: 201,
          body: JSON.stringify("Build pending"),
        };

      }
    });
  } else {
    console.log('this was not a pull-request message');
    response = {
      statusCode: 412,
      body: JSON.stringify("failed"),
    };
  }
  callback(null, response);
}


module.exports.check_build_status = (event, context, callback) => {
  // get the build statuses for the given project name
  var params = {
    projectName: process.env.BUILD_PROJECT
  };

  // list all builds, loop through. If it's a github build, update the commit
  // for that build with the state of the codebuild status
  codebuild.listBuildsForProject(params, function(err, data) {
    if (err) {
      console.log(err, err.stack);
      context.fail(err)
    } else {
      // list all the build statuses
      codebuild.batchGetBuilds(data, function(err, data) {
        if (err) {
          console.log(err, err.stack);
          context.fail(err)
        } else {
          for (let build of data.builds) {
            if(build.source.type != 'GITHUB') {
              continue;
            }
            // console.log(((new Date()) - new Date(build.endTime)), diff_timelength);

            // because we run every X minutes, we only check the builds that we're finished in the last
            // X minutes, so we don't call the github api unneeded
            if(((new Date) - new Date(build.endTime)) > diff_timelength) {
              console.log('Build [' + build.id + '] was updated more than X amount of time ago, skip it')
              continue
            }

            // the build was complete, and updated in the last X minutes, let's update the git commit status
            if(build.buildComplete) {

              // get the necessary variables for the github call
              var url = build.source.location.split('/');
              var repo = url[url.length-1].replace('.git', '');
              var username = url[url.length-2];

              console.log('Found commit identifier: ' + build.sourceVersion);
              var state = '';

              // map the codebuild status to github state
              switch(build.buildStatus) {
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

              // call the github repo with the actual status
              github.repos.createStatus({
                owner: username,
                repo: repo,
                sha: build.sourceVersion,
                state: state,
                target_url: 'https://' + region + '.console.aws.amazon.com/codebuild/home?region=' + region + '#/builds/' + build.id + '/view/new',
                context: 'CodeBuild',
                description: 'Build ' + build.buildStatus + '...'
              }).catch(function(err){
                console.log(err);
                context.fail(data);
              });
            }
          }
          context.succeed('Succeeded')
        }
      });
    }
  });
}
