import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apigateway from '@aws-cdk/aws-apigateway';
import * as dynamodb from '@aws-cdk/aws-dynamodb';
import { JsonSchemaType } from '@aws-cdk/aws-apigateway';
import { JsonSchemaVersion } from '@aws-cdk/aws-apigateway';
import * as s3 from '@aws-cdk/aws-s3';
import { Duration } from '@aws-cdk/core';
import { CfnOutput, Construct, Stack, StackProps } from '@aws-cdk/core';
import * as path from 'path';



export class CdkpipelinesDemoStack extends cdk.Stack {
  public readonly urlOutput: CfnOutput;
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    

    //Configurations
    const dynamoDBTableName = "qnaMaster";  

    var codeBucketName = "rajesh.ds.code";
    var key = "cdk/index.zip";

    var lambdaDuration = 60;
    var memorySize = 512;
    var lambdaBotName = "hrbotCDK1";

    var apiGatewayName = "cdkAPI1";
    //End of Configuration

    //Existing assets
    const byName = s3.Bucket.fromBucketName(this, 'BucketByName', codeBucketName);
    const table = dynamodb.Table.fromTableName(this, 'Table', dynamoDBTableName)
    //

    //Lambda function
     const backend = new lambda.Function(this, lambdaBotName, {
        runtime: lambda.Runtime.NODEJS_12_X,
        handler: 'index.handler',
        code: lambda.Code.fromBucket(byName, key),
        memorySize: memorySize,
        timeout: Duration.seconds (lambdaDuration),
        environment: {
          TABLE_NAME: dynamoDBTableName
        }
    });
   // **********NEED FIX***************
   // table.grantReadWriteData(this.backend)
    
    const api = new apigateway.LambdaRestApi(this, apiGatewayName, {
      handler: backend,
      proxy: false
    });
    this.urlOutput = new CfnOutput(this, 'Url', {
      value: api.url,
    });
    api.root.addMethod('ANY');
    const queries = api.root.addResource('queries');

    // We define the JSON Schema for the transformed valid response
    const responseModel = api.addModel('ResponseModel', {
      contentType: 'application/json',
      modelName: 'ResponseModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT4,
        title: 'pollResponse',
        type: JsonSchemaType.OBJECT,
        properties: {
          state: { type: JsonSchemaType.STRING },
          greeting: { type: JsonSchemaType.STRING }
        }
      }
    });

    // We define the JSON Schema for the transformed error response
    const errorResponseModel = api.addModel('ErrorResponseModel', {
      contentType: 'application/json',
      modelName: 'ErrorResponseModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT4,
        title: 'errorResponse',
        type: JsonSchemaType.OBJECT,
        properties: {
          state: { type: JsonSchemaType.STRING },
          message: { type: JsonSchemaType.STRING }
        }
      }
    });
  
    const integration = new apigateway.LambdaIntegration(backend, {
      proxy: false,
      requestParameters: {
        // You can define mapping parameters from your method to your integration
        // - Destination parameters (the key) are the integration parameters (used in mappings)
        // - Source parameters (the value) are the source request parameters or expressions
        // @see: https://docs.aws.amazon.com/apigateway/latest/developerguide/request-response-data-mappings.html
        'integration.request.querystring.userId': 'method.request.querystring.userId',
        'integration.request.querystring.qnaId': 'method.request.querystring.qnaId'
      },
      allowTestInvoke: true,
      requestTemplates: {
        // You can define a mapping that will build a payload for your integration, based
        //  on the integration parameters that you have specified
        // Check: https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html
        'application/json': JSON.stringify({  qnaId: "$util.escapeJavaScript($input.params('qnaId'))", userId: "$util.escapeJavaScript($input.params('userId'))" })
      },
      // This parameter defines the behavior of the engine is no suitable response template is found
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      integrationResponses: [
        {
          // Successful response from the Lambda function, no filter defined
          //  - the selectionPattern filter only tests the error message
          // We will set the response status code to 200
          statusCode: "200",
          responseTemplates: {
            // This template takes the "message" result from the Lambda function, and embeds it in a JSON response
            // Check https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-mapping-template-reference.html
            'application/json': JSON.stringify({ status: 'ok', Results: '$util.escapeJavaScript($input.body)' })
          },
          responseParameters: {
            // We can map response parameters
            // - Destination parameters (the key) are the response parameters (used in mappings)
            // - Source parameters (the value) are the integration response parameters or expressions
            'method.response.header.Content-Type': "'application/json'",
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Credentials': "'true'"
          }
        },
        {
          // For errors, we check if the error message is not empty, get the error data
          selectionPattern: '(\n|.)+',
          // We will set the response status code to 200
          statusCode: "400",
          responseTemplates: {
              'application/json': JSON.stringify({ state: 'error', message: "$util.escapeJavaScript($input.path('$.errorMessage'))" })
          },
          responseParameters: {
              'method.response.header.Content-Type': "'application/json'",
              'method.response.header.Access-Control-Allow-Origin': "'*'",
              'method.response.header.Access-Control-Allow-Credentials': "'true'"
          }
        }
      ]

    });

    queries.addMethod('GET', integration, {
      // We can mark the parameters as required
      requestParameters: {
        'method.request.querystring.qnaId': true,
        'method.request.querystring.userId': true
      },
      methodResponses: [
        {
          // Successful response from the integration
          statusCode: '200',
          // Define what parameters are allowed or not
          responseParameters: {
            'method.response.header.Content-Type': true,
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true
          },
          // Validate the schema on the response
          responseModels: {
            'application/json': responseModel
          }
        },
        {
          // Same thing for the error responses
          statusCode: '400',
          responseParameters: {
            'method.response.header.Content-Type': true,
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true
          },
          responseModels: {
            'application/json': errorResponseModel
          }
        }
      ]


    });
    
    
    
    
  }
}