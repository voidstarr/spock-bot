USE spock_bot;

CREATE TABLE channel_messages (
    db_id INT NOT NULL AUTO_INCREMENT,
    id BIGINT UNSIGNED,
    server BIGINT UNSIGNED,
    channel BIGINT UNSIGNED,
    author BIGINT UNSIGNED,
    created_at DATE,
    body VARCHAR(2000),
    PRIMARY KEY ( db_id )
);

CREATE TABLE direct_messages (
    db_id INT NOT NULL AUTO_INCREMENT,
    id BIGINT UNSIGNED,
    channel BIGINT UNSIGNED,
    author BIGINT UNSIGNED,
    created_at DATE,
    body VARCHAR(2000),
    PRIMARY KEY ( db_id )
);
