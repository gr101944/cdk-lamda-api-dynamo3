# Welcome to your CDK TypeScript project!

## What does it do?

This project creates a CDK pipeline to deploy an API Gateway and Lambda function to a particular account, region and stage of your choice (dev, preprod, prod, etc)

Lambda pulls code from an existing S3 library stored in zip format

DynamoDB table is an eisting table which is used as env variable in the lambda function

The access to Lambda to access DynamoDB did not work. It is WIP.


### Initialize repository

cdk init --language=typescript

### Download Modules

npm i @aws-cdk/aws-apigateway @aws-cdk/aws-lambda @aws-cdk/aws-codepipeline @aws-cdk/aws-codepipeline-actions @types/aws-lambda @aws-cdk/pipelines
(down load all other NPM folders like S3, DynamoDB, API Gateway etc)

### Bootstrap - replace accountno with AWS account number. Bootstrapping needs to be done once per (Account and Region) combination

npx cdk bootstrap  --profile default --cloudformation-execution-policies arn:aws:iam::aws:policy/AdministratorAccess aws://accountno/us-east-1

### Deploy modules, 'default' below is the AWS profile, it may be different and you have to choose what you have in your profile, stackname as in the 'bin' folder
  
npx cdk deploy "stack name"
  
This will create an empty Pipeline
  
### Add Stage for actual deployment of resources
* Add the stage in the cdkpipelines-demo-pipeline-stack
* npm run build
* git add .
* git commit -m "message"
* git push origin master (set your origin properly)
  
New pipeline will start and will deploy resources in the target stage
  
  


## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template


