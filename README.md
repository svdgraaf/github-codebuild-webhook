Github CodeBuild Webhook
------------------------

This project will setup an api gateway endpoint, which you can have your github repository connect to. This will start and update a commit with the current build status.
This will be triggered for any PR update, on any branch.

Setup
-----
1. Setup an [AWS CodeBuild](https://console.aws.amazon.com/codebuild/home) project.
2. Create a Github API token [here](https://github.com/settings/tokens/new). Make sure to grant "repo" and "admin:repo_hook" permissions.

Installation
------------
Use the steps below to launch the stack directly into your AWS account. You can setup as much stacks as you want, as the stack is currently connected to 1 CodeBuild project.

1. Deploy the stack:

   [![Launch Awesomeness](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?region=eu-west-1#/stacks/new?stackName=serverless-build-trigger&templateURL=https://s3-eu-west-1.amazonaws.com/github-webhook-artifacts-eu-west-1/serverless/github-webhook/trigger/1494331984949-2017-05-09T12%3A13%3A04.949Z/compiled-cloudformation-template.json)

	(or use `sls deploy`).

2. Create a Pull Request on your project, and see the magic be invoked 😎
3. ...
4. Profit!

Deploying with Serverless
--------------------------
If you would like to deploy this service with Serverless:

1. Clone this repository
2. `npm install` dependencies
3. Run `serverless deploy`

```shell
export GITHUB_USERNAME=your_username
export GITHUB_REPOSITORY=https://github.com/owner/repository
export GITHUB_ACCESS_TOKEN=your_access_token
export BUILD_PROJECT=your_codebuild_application_name

serverless deploy -v
```

Architecture
------------
![Flow](https://raw.githubusercontent.com/svdgraaf/github-codebuild-webhook/master/architecture.png)

When you create a PR, a notification is sent to the API Gateway endpoint and the lambda step function is triggered. This will trigger the start of a build for your project, and set a status of `pending` on your specific commit. Then it will start checking your build status every X seconds. When the status of the build changes to `done` or `failed`, the github api is called and the PR status will be updated accordingly.

Example output
--------------
In the Example below, a PR is create, and a build is run which fails. Then, a new commit is pushed, which fixes the build. When you click on the 'details' link of the PR status, it will take you to the CodeBuild build log.

![AWS Codebuild Triggered after PR update](https://github.com/svdgraaf/github-codebuild-webhook/blob/master/example.gif?raw=true)

Todo
----
* Add (optional) junit parsing, so it can comment on files with (possible) issues.
* Perhaps make build project dynamic through apigateway variable if possible
