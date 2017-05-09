Github CodeBuild Webhook
------------------------

This project will setup an api gateway endpoint, which you can have your github repository connect to. This will start and update a commit with the current build status.
This will be triggered for any PR update, on any branch.

Installation
------------
1. Setup an [AWS CodeBuild](https://eu-west-1.console.aws.amazon.com/codebuild/home) project (and add a `.codebuild.yml` file to your project)
2. Create a github api token here: [https://github.com/settings/tokens/new](https://github.com/settings/tokens/new)
3. Deploy the stack by pressing this button: [![Launch Awesomeness](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?region=eu-west-1#/stacks/new?stackName=serverless-build-trigger&templateURL=https://s3-eu-west-1.amazonaws.com/github-webhook-artifacts-eu-west-1/serverless/github-webhook/trigger/1494319871068-2017-05-09T08%3A51%3A11.068Z/compiled-cloudformation-template.json)
   (or with `sls deploy`).
4. Note the endpoint for the trigger in the Stack Output, eg: `https://[id].execute-api.eu-west-1.amazonaws.com/dev/trigger-build/`
5. Add that endpoint as a webhook on your project repository: `https://github.com/[username]/[repo-name]/settings/hooks/new`
   Be sure to to select `Let me select individual events.` and then `Pull request`, so it's only triggered on PR updates.
6. Create a PR, and see the magic be invoked :)


Architecture
------------
![Flow](https://raw.githubusercontent.com/svdgraaf/github-codebuild-webhook/master/architecture.png)

When you create a PR, a notification is send to the Api Gateway endpoint and the lambda step function is triggered. This will trigger the start of a build for your project, and set a status of `pending` on your specific commit. Then it will start checking your build status every X seconds. When the status of the build changes to `done` or `failed`, the github api is called and the PR status will be updated accordingly.


Example output
--------------
![Build pending](https://www.dropbox.com/s/ymyogjmy0w8oyyk/Screenshot%202017-04-11%2014.16.17.png?dl=1)
![Build succeeded](https://www.dropbox.com/s/7h2verouqexan5o/Screenshot%202017-04-11%2014.16.53.png?dl=1)

Todo
----
* Add (optional) junit parsing, so it can comment on files with (possible) issues.
* Perhaps make build project dynamic through apigateway variable if possible
