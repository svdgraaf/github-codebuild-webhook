'use strict';

const _ = require('lodash');
const chalk = require('chalk');


class ServerlessPortableTemplates {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.hooks = {
      'before:deploy:deploy': this.makePortableTemplate.bind(this)
    };
  }

  makePortableTemplate() {
    const template = this.serverless.service.provider.compiledCloudFormationTemplate;
    var serviceName = this.serverless.service.service;

    // remove the RoleName, so CloudFormation will generate one for us
    delete template['Resources']['IamRoleLambdaExecution']['Properties']['RoleName'];

  }
}

module.exports = ServerlessPortableTemplates;
