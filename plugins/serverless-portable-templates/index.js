'use strict';

const _ = require('lodash');


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

    _.each(template['Resources'], function(resource, name){

      // remove the name for loggroups, so CF will generate a name for us (actually)
      // those resources are not needed at all, but it's more work to remove them
      if(resource['Type'] == 'AWS::Logs::LogGroup') {
        delete resource['Properties']['LogGroupName']
        template['Resources'][name] = resource
      }

      // replace the service name with the stack name so the functions will be unique
      // per account
      if(resource['Type'] == 'AWS::Lambda::Function') {
        resource['Properties']['FunctionName'] = resource['Properties']['FunctionName'].replace(serviceName, "#{AWS::StackName}")
        template['Resources'][name] = resource
      }

    })

    this.serverless.cli.consoleLog('Made template portable');
  }
}

module.exports = ServerlessPortableTemplates;
