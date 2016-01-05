#!/usr/bin/env node

/*jshint multistr: true */

var doc = "\n\
Usage:\n\
    twitter-autoremove [-e EXCLUDE_LIST] [-d DELAY] [-fir]\n\
    twitter-autoremove -h | --help | --version\n\
\n\
Autoremove twitter friends according to certain conditions.\n\
You should provide a file listing list of friends who will\n\
NOT be removed no matter what via option -e\n\
Consumer secret and access token must be passed via environment\n\
variables like so:\n\
TWITTER_CONSUMER_KEY=xxx TWITTER_CONSUMER_SECRET=xxx\\\n\
TWITTER_ACCESS_TOKEN_KEY=xxx TWITTER_ACCESS_TOKEN_SECRET=xxx twitter-autoremove\n\
\n\
Options:\n\
    -e EXCLUDE_LIST   List of friends who will not be removed.\n\
    -d DELAY          Delay between removal in seconds. Set this\n\
                      carefully to avoid twitter API limit. [default: 100].\n\
    -f                Remove friends who are also followers.\n\
                      Default to false. [default: false].\n\
    -i                Output id instead of screen name [default: false]\n\
    -r                If this option is set, friends will be removed from\n\
                      the most recently added. Default to false so friends\n\
                      will be removed from the oldest.[default: false]\n\
    -h --help         Show this screen.\n\
    --version         Show version.\n\
";

var Twitter = require('twitter');
var async = require('async');
var docopt = require('docopt');
var parseInt = require('parse-int');
var lineReader = require('line-reader');
var _ = require('lodash');

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

var DELAY = 100;

function main(args) {
    async.auto({
        validateInputs: function(next, res) {
            var delay = parseInt(args['-d']);
            if (delay > 0) DELAY = delay;
            next();
        },
        excludedList: function(next, res) {
            var excludedFile = args['-e'];
            if (excludedFile) {
                var lines = [];
                lineReader.eachLine(excludedFile, function(line, last) {
                    lines.push(line);
                }, function(err) {
                    if (err) {
                        next('Cannot open ' + excludedFile);
                    } else next(null, lines);
                });
            } else next(null, []);
        },
        followerIds: function(next, res) {
            if (!args['-f']) {
                client.get('followers/ids', function(_error, _res) {
                    if (_error) {
                        next(_error);
                    } else next(null, _res.ids);
                });
            } else next(null, []);
        },
        friendIds: function(next, res) {
            client.get('friends/ids', function(_error, _res) {
                if (_error) {
                    next(_error);
                    return;
                } else next(null, _res.ids);
            });
        },
        sortedFriendIds: ['friendIds', function(next, res) {
            if (args['-r']) {
                next(null, _(res.friendIds).reverse().value());
            } else next(null, res.friendIds);
        }],
        friendNotFollower: ['sortedFriendIds', 'followerIds', function(next, res) {
            var result = res.sortedFriendIds;
            if (!args['-f']) {
                result = _.filter(result, function(e) {
                    return res.followerIds.indexOf(e) == -1;
                });
            }
            next(null, result);
        }],
        remove: ['friendNotFollower', function(next, res) {
            var toBeRemoved = res.friendNotFollower;

            async.whilst(
                function() {
                    return toBeRemoved.length > 0;
                },
                function(_next) {
                    async.waterfall([
                        function(__next) {
                            var e = toBeRemoved.pop();
                            client.get('users/lookup', {
                                user_id: String(e)
                            }, function(__error, __res) {
                                __next(__error, __res && __res[0]);
                            });
                        },
                        function(info, __next) {
                            if (res.excludedList.indexOf(info.screen_name) != -1) {
                                _next();
                                return;
                            }
                            client.post('friendships/destroy', {
                                user_id: info.id
                            }, function(__error, __res) {
                                if (__error) {
                                    __next(__error);
                                    return;
                                }
                                if (args['-i']) {
                                    console.log(__res.id);
                                } else console.log(__res.screen_name);
                                process.stderr.write("DELAY " + DELAY);
                                setTimeout(__next, DELAY * 1000);
                            });
                        }
                    ], _next);
                },
                next
            );
        }],
    }, function(err, res) {
        if (err) {
            process.stderr.write("Error: " + JSON.stringify(err) + "\n");
            process.exit(1);
        }
    });
}

if (require.main === module) {
    var kwargs = {
        name: "twitter-autoremove",
        version: "twitter-autoremove 0.1.4"
    };
    var args = docopt.docopt(doc, kwargs);
    main(args);
}
