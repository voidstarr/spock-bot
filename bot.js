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


const regex_m = /\<[^\b\s]+/g; // removes mentions
const regex_w = /s^\s+|\s+$|\s+(?=\s)/g; // remove duplicate and trailing spaces

const adminUserId = config.adminUser;
const INFO_TEXT = 'Bot created by voidstar.\nPatched together with https://github.com/substack/node-markov and the discord.js libraries.\nSpock\'s lines obtained using this https://github.com/voidstarr/spock-lines\nBot source: https://bitbucket.org/voidstarr/spock-bot/';

const tableFlip = '(╯°□°）╯︵ ┻━┻';

client.on('ready', () => {
    client.user.setGame("with your heart");
    logger.debug(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {
    var args = msg.content.split(" ");

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
        logMessage(msg);
    } else if (msg.author.id == adminUserId && args[0] == '~!die') { // TODO: find a better way to do this
        db.destroy();
        client.destroy();
        logger.debug('logged out by ' + msg.author.id);
        process.exit(0);
    } else if (args[0] == '~!info') {
        msg.channel.send(INFO_TEXT);
    } else if (args[0] == '~!inspire') {
        axios.get('http://inspirobot.me/api?generate=true')
            .then(resp => msg.reply(resp.data))
            .catch(err => logger.error(err));
    } else if (msg.content == tableFlip) {
        msg.reply('┬─┬ノ( º _ ºノ)\nJoy be with you. Peace and contentment.');
    } else if (args[0] == '~!help') {
        msg.reply('Don\'t ask to ask; just ask.');
    } else if (args[0] == '~!db' && args.length == 2) {
        const cmd_usage = 'USAGE:\n' +
            '~!db rand\n' +
            '~!db <ID>\n' +
            '~!db @mention\n' +
            '~!db count';

        logger.debug('~!db command: ' + args);

        var db_id = "%";
        var author = "%";
        var order_by = "db_id";

        if (args[1] == 'count') {
            db('channel_messages')
                .count('db_id as a')
                .where('server', msg.guild.id)
                .then(resp => {
                    logger.debug('~!db resp:');
                    logger.debug('resp = ' + resp[0].a);
                    msg.channel.send('I have **' + resp[0].a + '** messages from this server stored in the ship\'s memory banks.');
                })
                .catch(err => {
                    logger.err(err)
                });
            return;
        } else if (msg.mentions.members.firstKey()) {
            author = msg.mentions.members.firstKey();
            order_by = 'rand()';
        } else if (args[1] == 'rand' || args[1] == 'random') {
            order_by = 'rand()';
        } else if (isFinite(args[1]) && !isNaN(args[1])) {
            db_id = args[1]
        } else {
            msg.channel.send(cmd_usage);
            return;
        }

        db('channel_messages')
            .where('server', msg.guild.id)
            .where('db_id', 'like', db_id)
            .where('author', 'like', author)
            .select('body', 'author', 'db_id')
            .orderByRaw(order_by + ' asc')
            .limit(1)
            .then(resp => {
                logger.debug('~!db resp:');
                logger.debug(resp + " len: " + resp.length);
                if (resp.length > 0) {
                    var resp_author = msg.guild.members.get(resp[0].author); // .user.username

                    if (resp_author === undefined) {
                        resp_author = resp[0].author;
                    } else {
                        resp_author = resp_author.user.username;
                    }
                    msg.channel.send('db_id(' + resp[0].db_id + '),author(' + resp_author +
                        '): ' + resp[0].body.replace(regex_m, '').replace(regex_w, '').trim());
                } else {
                    msg.channel.send('Invalid db_id. \:shrug:');
                }
            })
            .catch(err => {
                logger.error(err)
            });
    } else {
        logMessage(msg);
    }

});

client.on('error', msg => {
    logger.error(msg);
    db.destroy();
    process.exit(1);
});

client.on('warn', wrn => {
    logger.warn(wrn)
});


m.seed(s, function() {
    logger.debug('markov loaded');
    doLogin();
});


function logMessage(msg) {

    if (msg.author.id == client.user.id) {
        return;
    }

    logger.debug(msg.toString());

    var msgBody = msg.content;

    if (msg.attachments.size > 0) {
        logger.debug("msg.content empty; checking for attatchments etc");
        logger.debug("msg.attachments.size = ".concat(msg.attachments.size));
        msg.attachments.forEach((attach, id) => {
            logger.debug("msg.attachments: ".concat(id, " ", attach.url));
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
        db('channel_messages')
            .insert(messageObj)
            .then()
            .catch(err => {
                logger.error(err)
            });
    } else if (msg.channel instanceof Discord.DMChannel || msg.channel instanceof Discord.GroupDMChannel) {
        //console.log('msg type dm');
        db('direct_messages')
            .insert(messageObj)
            .then()
            .catch(err => {
                logger.error(err)
            });
    } else {
        logger.debug('something went wrong. could not determine type of message channel');
    }
}

function doLogin() {
    client.login(config.token);
}