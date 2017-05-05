'use strict';

const _ = require('lodash');


class ServerlessDynamicResourceNames {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.hooks = {
      'before:deploy:deploy': this.makeResourceNamesDynamic.bind(this),
    };
  }

  makeResourceNamesDynamic() {
    const template = this.serverless.service.provider.compiledCloudFormationTemplate;

    // remove the RoleName, so CloudFormation will generate one for us
    delete template['Resources']['IamRoleLambdaExecution']['Properties']['RoleName'];

    // remove the name for loggroups, so CF will generate a name for us (actually)
    // those resources are not needed at all, but it's more work to remove them
    _.each(template['Resources'], function(resource, name){
      if(resource['Type'] == 'AWS::Logs::LogGroup') {
        delete resource['Properties']['LogGroupName']
        template['Resources'][name] = resource
      }

      if(resource['Type'] == 'AWS::Lambda::Function') {
        resource['Properties']['FunctionName'] = {
          "Fn::Sub": resource['Properties']['FunctionName'] + "-${AWS::StackName}"
        }
        template['Resources'][name] = resource
      }

    })

    this.serverless.cli.consoleLog('Made resource names dynamic');
  }
}

module.exports = ServerlessDynamicResourceNames;
