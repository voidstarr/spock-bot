# SpockBot
(with room for the kitchen sink)
## Installation
```
git clone https://bitbucket.org/voidstarr/spock-bot.git
cd spock-bot.git
npm install
```

### How to use
Fiddle with the config:
Put your bot token in the token field.
Put the user id of the administrative user in the adminUser field.

inputTextFile field within config.json specifies the seed for the markov generator. I created a *(poorly written)* script to scrape Spock's lines from Star Trek: TOS located [here](https://github.com/voidstarr/spock-lines).

Some spaghetti database code exists for message archiving. Config fields for database connection should be self explanatory. (Currently, mariadb is hard coded.)
```
db_host
db_user
db_pass
db
```
The create-tables.sql file only creates tables, you'll have to create a database. I'll flesh this out eventually.

*Poorly curated* logs are created in the logs directory.

Functionality of this bot:
* Snarky responses in response to an @mention
* ~!info gives some informational text
* @mention followed by google <some string> returns a snarky comment and a lmgtfy link
* ~!inspire grabs a random image from inspirobot
* other snarky goodies
