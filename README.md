# lambda-daily-billing-to-chatwork-function

[![Build Status](https://travis-ci.org/cw-ozaki/lambda-daily-billing-to-chatwork-function.svg?branch=develop)](https://travis-ci.org/cw-ozaki/lambda-daily-billing-to-chatwork-function)
[![Dependency Status](https://david-dm.org/cw-ozaki/lambda-daily-billing-to-chatwork-function.png?theme=shields.io)](https://david-dm.org/cw-ozaki/lambda-daily-billing-to-chatwork-function)
[![devDependency Status](https://david-dm.org/cw-ozaki/lambda-daily-billing-to-chatwork-function/dev-status.png?theme=shields.io)](https://david-dm.org/cw-ozaki/lambda-daily-billing-to-chatwork-function#info=devDependencies)

Daily billing notification to chatwork.

![image](https://cloud.githubusercontent.com/assets/7764002/11554955/d29d979c-99df-11e5-9598-143a9a96db2f.png)



## Get started

```sh
$ git clone https://github.com/cw-ozaki/lambda-daily-billing-to-chatwork-function
$ cd lambda-daily-billing-to-chatwork-function
$ echo '{
  "token": "[ChatWork API Token]",
  "roomId": [ChatWork Room ID],
  "paymentRoleArn": "[AWS Payment Account ARN]",
  "accounts": [
    {
      "id": [AWS Account ID],
      "name": "[AWS Account Name]"
    }
  ]
}' > config/local.json
$ npm install
$ npm start
```

## Configuration

You will generate `config/local.json`.

| name | type | value |
| :--: | :--: | :--: |
| CHATWORK_API_TOKEN | string | [ChatWork API Token](http://developer.chatwork.com/ja/authenticate.html) |
| CHATWORK_SEND_ROOM_ID | number | ID of the room to be sent to the ChatWork |
| ARN | string | Payment account of Role ARN |
| ACCOUNT_ID | number | Account ID to display the billing information |
| ACCOUNT_NAME | string | Account Name to display the billing information |

## IAM Role

Role that specified in the ARN of configuration sts: should allow AssumeRole.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::[Account ID of Execute Lambda Function]:role/[Role of Execute Lambda Function]"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

## License

MIT

## Copyright

Copyright (c) 2015 ChatWork.inc
