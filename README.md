Github CodeBuild Webhook
------------------------

This project will setup an api gateway endpoint, which you can have your github repository connect to. This will start and update a commit with the current build status.
This will be triggered for any PR update, on any branch.

Installation
------------
Use the steps below to launch the stack directly into your AWS account. You can setup as much stacks as you want, as the stack is currently connected to 1 CodeBuild project.

1. First, we'll need to setup an [AWS CodeBuild](https://eu-west-1.console.aws.amazon.com/codebuild/home) project. Create a new project in the AWS console, and be sure to add a [`buildspec.yml`](http://docs.aws.amazon.com/codebuild/latest/userguide/build-spec-ref.html) file to your project with some steps. Here's an [example](https://github.com/svdgraaf/webhook-test/blob/master/buildspec.yml).
2. Create a github api token in your account here, so that the stack is allowed to use your account: [https://github.com/settings/tokens/new](https://github.com/settings/tokens/new). You can ofcourse choose to setup a seperate account for this.
3. Deploy the stack:

   [![Launch Awesomeness](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?region=eu-west-1#/stacks/new?stackName=serverless-build-trigger&templateURL=https://s3-eu-west-1.amazonaws.com/github-webhook-artifacts-eu-west-1/serverless/github-webhook/trigger/1494331984949-2017-05-09T12%3A13%3A04.949Z/compiled-cloudformation-template.json)

	(or use `sls deploy`).

4. Note the endpoint for the trigger in the Stack Output, eg: `https://[id].execute-api.eu-west-1.amazonaws.com/dev/trigger-build/`
5. Add that endpoint as a webhook on your project repository: `https://github.com/[username]/[repo-name]/settings/hooks/new`

   Be sure to to select __`Let me select individual events.`__ and then __`Pull request`__, so it's only triggered on PR updates. It will work if you forgot this step, it can possibly incur extra costs, because the lambda function will trigger each time.
6. Create a Pull Request on your project, and see the magic be invoked 😎
7. ...
8. Profit!

Architecture
------------
![Flow](https://raw.githubusercontent.com/svdgraaf/github-codebuild-webhook/master/architecture.png)

When you create a PR, a notification is send to the Api Gateway endpoint and the lambda step function is triggered. This will trigger the start of a build for your project, and set a status of `pending` on your specific commit. Then it will start checking your build status every X seconds. When the status of the build changes to `done` or `failed`, the github api is called and the PR status will be updated accordingly.

Example output
--------------
In the Example below, a PR is create, and a build is run which fails. Then, a new commit is pushed, which fixes the build. When you click on the 'details' link of the PR status, it will take you to the CodeBuild build log.

![AWS Codebuild Triggered after PR update](https://github.com/svdgraaf/github-codebuild-webhook/blob/master/example.gif?raw=true)

Todo
----
* Add (optional) junit parsing, so it can comment on files with (possible) issues.
* Perhaps make build project dynamic through apigateway variable if possible
