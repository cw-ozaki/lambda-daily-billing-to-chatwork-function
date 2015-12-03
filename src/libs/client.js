'use strict';
// require
var ChatWork = require('simple-cw-node');
var Bluebird = require('bluebird');
var config = require('config');
// initialize
var token = config['token'];
if (!token) {
  throw new Error('Error: `token` has not been set in the configuration.');
}
var roomId = config['roomId'];
if (!roomId) {
  throw new Error('Error: `roomId` has not been set in the configuration.');
}
var client = Bluebird.promisifyAll(new ChatWork());
client.init({token: token});

module.exports = {
  post: function(message) {
    return client.postAsync('rooms/' + roomId + '/messages', {
      body: message
    });
  }
};