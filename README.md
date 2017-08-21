# Github CodeBuild Webhook

This project will setup an api gateway endpoint, which you can have your github
repository connect to. This will start and update a commit with the current
build status. This will be triggered for any PR update, on any branch.

# Setup

1.  Setup an [AWS CodeBuild](https://console.aws.amazon.com/codebuild/home)
    project.
2.  Create a GitHub API token [here](https://github.com/settings/tokens/new).
    Make sure to grant "repo" and "admin:repo_hook" permissions.
3.  Create SecureString parameters in the AWS SSM Parameter Store for the
    GitHub username and access token. For example:

    ```shell
    aws ssm put-parameter --name /path/to/github-username --value <GITHUB_USERNAME> --type SecureString
    aws ssm put-parameter --name /path/to/github-access-token --value <GITHUB_ACCESS_TOKEN> --type SecureString
    ```

4.  Get the KMS key ID used to encrypt the SSM parameters. For example:

    ```shell
    aws kms describe-key --key-id alias/aws/ssm
    ```

# Deploying with Serverless
To deploy this service with Serverless:

1.  Clone this repository
2.  `npm install` dependencies
3.  Run `serverless deploy`

```shell
export BUILD_PROJECT="your_codebuild_application_name"
export GITHUB_REPOSITORY="https://github.com/owner/repository"
export SSM_GITHUB_USERNAME="/path/to/github-username"          # Path in SSM
export SSM_GITHUB_ACCESS_TOKEN="/path/to/github-access-token"  # Path in SSM
export KMS_SSM_KEYID="kms-key-id-used-by-ssm"
```

4.  Run `serverless deploy`

serverless deploy -v
```

# Architecture

![Flow](https://raw.githubusercontent.com/svdgraaf/github-codebuild-webhook/master/architecture.png)

When you create a PR, a notification is sent to the API Gateway endpoint and
the lambda step function is triggered. This will trigger the start of a build
for your project, and set a status of `pending` on your specific commit. Then
it will start checking your build status every X seconds. When the status of
the build changes to `done` or `failed`, the github api is called and the PR
status will be updated accordingly.

# Example output

In the Example below, a PR is create, and a build is run which fails. Then, a
new commit is pushed, which fixes the build. When you click on the 'details'
link of the PR status, it will take you to the CodeBuild build log.

![AWS Codebuild Triggered after PR update](https://github.com/svdgraaf/github-codebuild-webhook/blob/master/example.gif?raw=true)

# Todo

*   Add (optional) junit parsing, so it can comment on files with (possible)
    issues.
*   Perhaps make build project dynamic through apigateway variable if possible.
*   Doublecheck `editHook` functionality.
*   Add `deleteHook` functionality.
*   Support option to run the build only when an authorized user requests the
    build via a comment on the PR.
