#!/usr/bin/env node

const Discord = require("discord.js");
const client = new Discord.Client();
const querystring = require('querystring');
const util = require('util');
const fs = require('fs');
const axios = require('axios');
const markov = require('./markov');
const config = require('./config.json');

var log4js = require('log4js');
log4js.configure({
    appenders: {
        everything: {
            type: 'file',
            filename: 'logs/spock-bot.log',
            maxLogSize: 10485760,
            backups: 3,
            compress: true
        }
    },
    categories: {
        default: {
            appenders: ['everything'],
            level: 'all'
        }
    }
});

var logger = log4js.getLogger();
var m = markov(3);
var s = fs.createReadStream(__dirname + '/' + config.inputTextFile);
var db = require('knex')({
    client: 'mariadb',
    connection: {
        host: config.db_host,
        user: config.db_user,
        password: config.db_pass,
        db: config.db,
        charset: 'utf8mb4'
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
    logger.debug(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    if (msg.mentions.users.exists('id', client.user.id)) {
        var removedMention = msg.content.replace(Discord.MessageMentions.USERS_PATTERN, '').trim();
        logger.debug('pinged by ' + msg.author.username + ' -- ' + removedMention);
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
    } else if (msg.author.id == adminUserId && msg.content == '~!kill') {
        db.destroy();
        client.destroy();
        logger.debug('logged out by ' + msg.author.id);
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
    logger.error(msg);
    db.destroy();
    process.exit(1);
});

m.seed(s, function() {
    logger.debug('markov loaded');
    doLogin();
});

function logMessage(msg) {
    
    logger.debug(msg.toString());
    
    var msgBody = msg.content;

    if (msg.attachments.size > 0) {
        logger.debug("msg.content empty; checking for attatchments etc");
        logger.debug("msg.attachments.size = ".concat(msg.attachments.size));
        msg.attachments.forEach((attach, id) => {
            logger.debug("msg.attachments: ".concat(id," ",attach.url));
            msgBody += (" " + attach.url);
        });
    }

    logger.debug(msgBody);

    var messageObj = {
        id: msg.id,
        channel: msg.channel.id,
        server: msg.guild.id,
        author: msg.author.id,
        created_at: msg.createdAt,
        body: msgBody
    };

    if (msg.channel instanceof Discord.TextChannel) {
        //console.log('msg type guild message');
        db('channel_messages').insert(messageObj).then(data => {
            //console.log('db then: %s', data);
        }).catch(logger.error);
    } else if (msg.channel instanceof Discord.DMChannel || msg.channel instanceof Discord.GroupDMChannel) {
        //console.log('msg type dm');
        db('direct_messages').insert(messageObj).then(data => {
            //console.log('db then: %s', data);
        }).catch(logger.error);
    } else {
        logger.debug('something went wrong. could not determine type of message channel');
    }
}

function doLogin() {
    client.login(config.token);
}
