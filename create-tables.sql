CREATE DATABASE IF NOT EXISTS spock_bot;

CREATE TABLE IF NOT EXISTS spock_bot.channel_messages (
    db_id INT NOT NULL AUTO_INCREMENT,
    id BIGINT UNSIGNED UNIQUE,
    server BIGINT UNSIGNED,
    channel BIGINT UNSIGNED,
    author BIGINT UNSIGNED,
    created_at DATETIME,
    body VARCHAR(2000),
    PRIMARY KEY ( db_id )
)
CHARACTER SET utf8mb4
COLLATE utf8mb4_bin;

CREATE TABLE IF NOT EXISTS spock_bot.direct_messages (
    db_id INT NOT NULL AUTO_INCREMENT,
    id BIGINT UNSIGNED UNIQUE,
    channel BIGINT UNSIGNED,
    author BIGINT UNSIGNED,
    created_at DATETIME,
    body VARCHAR(2000),
    PRIMARY KEY ( db_id )
)
CHARACTER SET utf8mb4
COLLATE utf8mb4_bin;

CREATE TABLE IF NOT EXISTS spock_bot.users (
    db_id INT NOT NULL AUTO_INCREMENT,
    id BIGINT UNSIGNED UNIQUE,
    username VARCHAR(32),
    discriminator VARCHAR(32),
    PRIMARY KEY ( db_id )
)
CHARACTER SET utf8mb4
COLLATE utf8mb4_bin;

