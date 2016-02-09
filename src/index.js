'use strict';
// require
var AWS      = require('aws-sdk');
var Bluebird = require('bluebird');
var _        = require('lodash');
var config   = require('config');
var client   = require('./libs/client');
var moment   = require('moment');
var numeral  = require('numeral');

var sts = Bluebird.promisifyAll(new AWS.STS({apiVersion: '2011-06-15'}));

/**
 * AWS Lambda entry point
 *
 * @param {Object} event lambda event object
 * @param {Object} context lambda context
 */
exports.handler = function(event, context) {
  return Bluebird.resolve().then(function() {
    // get payment account role
    var params = {
      RoleArn: config.get('paymentRoleArn'),
      RoleSessionName: 'DailyBillintTemporarySession',
      DurationSeconds: 900
    };
    return sts.assumeRoleAsync(params);
  }).then(function(data) {
    // update aws configuration
    AWS.config.credentials = sts.credentialsFrom(data);
    AWS.config.update({region: 'us-east-1'});

    return config.get('accounts');

  }).map(function(account) {
    // get billing metrics
    var cloudwatch = Bluebird.promisifyAll(new AWS.CloudWatch({apiVersion: '2010-08-01'}));
    var params = {
      EndTime: moment(moment().format('YYYY-MM-DD 5:00:00')).unix(),
      MetricName: 'EstimatedCharges',
      Namespace: 'AWS/Billing',
      Period: 3600,
      StartTime: moment(moment().add(-2, 'days').format('YYYY-MM-DD 5:00:00')).unix(),
      Statistics: ['Maximum'],
      Dimensions: [
        {
          Name: 'LinkedAccount',
          Value: account.id.toString()
        },
        {
          Name: 'Currency',
          Value: 'USD'
        }
      ]
    };
    if (config.get('paymentRoleArn').match(new RegExp('arn:aws:iam::' + account.id))) {
      params.Dimensions = [params.Dimensions[1]];
    }
    return cloudwatch.getMetricStatisticsAsync(params).then(function(data) {
      return _.extend(data, {
        AccountId: account.id,
        AccountName: account.name
      });
    });

  }).map(function(data) {
    // transform to billing info
    var pointMap = data.Datapoints.reduce(function(acc, point) {
      var p = moment(moment().add(-1, 'days').format('YYYY-MM-DD 5:00:00')).unix();
      var t = moment(point['Timestamp']).unix();
      var o = acc[t < p ? 0 : 1] || {};
      o[t] = point['Maximum'];
      acc[t < p ? 0 : 1] = o;
      return acc;
    }, {});
    var points1 = Object.keys(pointMap[0] || {}).map(function(v) {
      return pointMap[0][v];
    });
    var points2 = Object.keys(pointMap[1] || {}).map(function(v) {
      return pointMap[1][v];
    });
    return {
      id: data.AccountId,
      name: data.AccountName,
      dayBefore: (points1[points1.length-1] || 0) - (points1[0] || 0),
      daily: (points2[points2.length-1] || 0) - (points2[0] || 0),
      total: (points2[points2.length-1] || 0)
    };
    
  }).then(function(billingInfos) {
    // post to chatwork
    var compiled = _.template('[info][title]<%= date %> のAWS費用が確定しました[/title]<%= body %>[/info]');
    var message  = compiled({
      date: moment().add(-1, 'days').format('YYYY-MM-DD'),
      body: billingInfos.map(function(billingInfo) {
        return billingInfo.name + '：' +
                 '昨日 ' + numeral(billingInfo.dayBefore).format('$0,0.00') + '　' +
                 '今日 ' + numeral(billingInfo.daily).format('$0,0.00') + '　' +
                 '合計 ' + numeral(billingInfo.total).format('$0,0.00');
      }).join('[hr]')
    });

    return client.post(message);

  }).then(function() {
    context.succeed();

  }).catch(function(err) {
    context.fail(err);

  });

};