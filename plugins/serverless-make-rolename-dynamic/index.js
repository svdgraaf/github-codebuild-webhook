'use strict';

const _ = require('lodash');

class ServerlessMakeRolenameDynamic {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.hooks = {
      'before:deploy:deploy': this.makeRolenameDynamic.bind(this),
    };
  }

  makeRolenameDynamic() {
    const template = this.serverless.service.provider.compiledCloudFormationTemplate;

    // remove the RoleName, so CloudFormation will generate one for us
    delete template['Resources']['IamRoleLambdaExecution']['Properties']['RoleName']

    this.serverless.cli.consoleLog('Made IAM Rolename dynamic');
  }
}

module.exports = ServerlessMakeRolenameDynamic;
