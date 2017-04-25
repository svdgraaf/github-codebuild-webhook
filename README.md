Github CodeBuild Webhook
------------------------

This project will setup an api gateway endpoint, which you can have your github repository connect to. This will start and update a commit with the current build status.
This will be triggered for any PR update, on any branch.

Installation
------------
1. Setup an AWS CodeBuild project (add a `.codebuild.yml` to your project)
2. Create a github api token here: https://github.com/settings/tokens/new
3. Deploy the stack [![Launch Awesomeness](https://s3.amazonaws.com/cloudformation-examples/cloudformation-launch-stack.png)](https://console.aws.amazon.com/cloudformation/home?region=eu-west-1#/stacks/new?stackName=serverless-build-webhook&templateURL=https://s3-eu-west-1.amazonaws.com/github-webhook-dev-serverlessdeploymentbucket-5l4ryu7zj2v7/serverless/github-webhook/dev/1493103367747-2017-04-25T06%3A56%3A07.747Z/compiled-cloudformation-template.json) or with `sls deploy`
4. Note the endpoint for the trigger in the Stack Output, eg: `https://[id].execute-api.eu-west-1.amazonaws.com/dev/trigger`
5. Add that endpoint as a webhook on your repository: https://github.com/[username]/[repo-name]/settings/hooks/new
   Be sure to to select `Let me select individual events.` and then `Pull request`, so it's only triggered on PR updates.
6. Create a PR, and see the magic be invoked :)

How does it wor
----------------
When you create a PR, a notification is send to the Api Gateway endpoint, the lambda function is triggered. This will start the build for your project, and set a status of `pending` on your specific commit.
Then a cloudwatch event is triggered every minute, and it checks for the latest build updates. If a build is updated, it updates the state for your commit with the build status.

Examples
--------
![Build pending](https://www.dropbox.com/s/ymyogjmy0w8oyyk/Screenshot%202017-04-11%2014.16.17.png?dl=1)
![Build succeeded](https://www.dropbox.com/s/7h2verouqexan5o/Screenshot%202017-04-11%2014.16.53.png?dl=1)


Caveats
-------
Unfortunately, it's currently not possible to trigger on an AWS CloudBuild event which would make everything a lot more responsive. Now it can take up to a minute before the update of your build is visible.
One other would be to have the lambda function keep checking for the codebuild status every X seconds, and keep the lambda open, but that would only work for short running build plans. Also, this would be more costly.
