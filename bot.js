const Discord = require("discord.js");
const client = new Discord.Client();
const querystring = require('querystring');
const util = require('util');
const fs = require('fs');
const axios = require('axios');
const markov = require('./markov');
const config = require('./config.json');
var m = markov(3);
var s = fs.createReadStream(__dirname + '/' + config.inputTextFile);

const adminUserId = config.adminUser;
const INFO_TEXT = 'Bot created by voidstar.\nPatched together with https://github.com/substack/node-markov and the discord.js libraries.\nSpock\'s lines obtained using this https://github.com/voidstarr/spock-lines\nBot source: https://bitbucket.org/voidstarr/spock-bot/';


client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  });

client.on('message', msg => {
    if (msg.mentions.users.exists('id', client.user.id)){
        var removedMention = msg.content.replace(Discord.MessageMentions.USERS_PATTERN,'').trim();
        console.log('pinged by ' + msg.author.username + ' -- ' + removedMention);
        var res = '';
        if (removedMention.toLowerCase().startsWith('google')){
            var ggl = removedMention.substr(removedMention.indexOf(' ')+1);
            res = m.respond(ggl).join(' ');
            res = res + ' -- http://lmgtfy.com/?' + querystring.stringify({q: ggl});
        } else {
            res = m.respond(removedMention).join(' ');
        } 
        msg.reply(res);
    } else if (msg.author.id == adminUserId && msg.content == '~!die'){
        client.destroy();
        console.log('logged out by ' + msg.author.id);
        process.exit(0);
    } else if (msg.content == '~!info') {
        msg.reply(INFO_TEXT);
    } else if (msg.content == '~!inspire') {
        axios.get('http://inspirobot.me/api?generate=true')
            .then(resp => msg.reply(resp.data))
            .catch(err => console.log(err));
    }
});

client.on('error', msg => {
    console.log(msg);
    process.exit(1);
});

m.seed(s, function () {
    console.log('markov loaded');
    doLogin();
});

function doLogin() {
    client.login(config.token);
}
