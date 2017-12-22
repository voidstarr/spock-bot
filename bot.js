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
var db = require('knex')({
    client: 'mariadb',
    connection: {
        host: config.db_host,
        user: config.db_user,
        password: config.db_pass,
        db: config.db
    },
    pool: {
        min: 0,
        max: 7
    }
});


const adminUserId = config.adminUser;
const INFO_TEXT = 'Bot created by voidstar.\nPatched together with https://github.com/substack/node-markov and the discord.js libraries.\nSpock\'s lines obtained using this https://github.com/voidstarr/spock-lines\nBot source: https://bitbucket.org/voidstarr/spock-bot/';

const tableFlip = '(╯°□°）╯︵ ┻━┻';


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (msg.mentions.users.exists('id', client.user.id)) {
        var removedMention = msg.content.replace(Discord.MessageMentions.USERS_PATTERN, '').trim();
        console.log('pinged by ' + msg.author.username + ' -- ' + removedMention);
        var res = '';
        if (removedMention.toLowerCase().startsWith('google')) {
            var ggl = removedMention.substr(removedMention.indexOf(' ') + 1);
            res = m.respond(ggl).join(' ');
            res = res + ' -- http://lmgtfy.com/?' + querystring.stringify({
                q: ggl
            });
        } else {
            res = m.respond(removedMention).join(' ');
        }
        msg.reply(res);
    } else if (msg.author.id == adminUserId && msg.content == '~!die') {
        db.destroy();
        client.destroy();
        console.log('logged out by ' + msg.author.id);
        process.exit(0);
    } else if (msg.content == '~!info') {
        msg.reply(INFO_TEXT);
    } else if (msg.content == '~!inspire') {
        axios.get('http://inspirobot.me/api?generate=true')
            .then(resp => msg.reply(resp.data))
            .catch(err => console.log(err));
    } else if (msg.content == tableFlip) {
        msg.reply('┬─┬ノ( º _ ºノ)\nJoy be with you. Peace and contentment.');
    } else if (msg.content == '~!help') {
        msg.reply('Don\'t ask to ask; just ask.');
    }

    logMessage(msg);
});

client.on('error', msg => {
    console.log(msg);
    db.destroy();
    process.exit(1);
});

m.seed(s, function() {
    console.log('markov loaded');
    doLogin();
});

function logMessage(msg) {
    var messageObj = {
        id: msg.id,
        channel: msg.channel.id,
        server: msg.guild.id,
        author: msg.author.id,
        created_at: msg.createdAt,
        body: msg.content
    };
    if (msg.channel instanceof Discord.TextChannel) {
        //console.log('msg type guild message');
        db('channel_messages').insert(messageObj).then(data => {
            //console.log('db then: %s', data);
        }).catch(e => {
            console.log('db err: %s', e);
        });
    } else if (msg.channel instanceof Discord.DMChannel || msg.channel instanceof Discord.GroupDMChannel) {
        //console.log('msg type dm');
        db('direct_messages').insert(messageObj).then(data => {
            //console.log('db then: %s', data);
        }).catch(e => {
            console.log('db err: %s', e);
        });
    } else {
        console.log('something went wrong. could not determine type of message channel');
    }
}

function doLogin() {
    client.login(config.token);
}
