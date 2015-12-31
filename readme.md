# twitter-autoremove
Autoremove unwanted twitter friends.

## Install
```
npm install -g twitter-autoremove
```

## Usage
```
    twitter-autoremove -h

    Usage:
        twitter-autoremove [-e EXCLUDE_LIST] [-d DELAY] [-fi]
        twitter-autoremove -h | --help | --version

    Autoremove twitter friends according to certain conditions.
    You should provide a file listing list of friends who will
    NOT be removed no matter what via option -e
    Consumer secret and access token must be passed via environment
    variables like so:
    TWITTER_CONSUMER_KEY=xxx TWITTER_CONSUMER_SECRET=xxx\
    TWITTER_ACCESS_TOKEN_KEY=xxx TWITTER_ACCESS_TOKEN_SECRET=xxx twitter-autoremove

    Options:
        -e EXCLUDE_LIST   List of friends who will not be removed.
        -d DELAY          Delay between removal in seconds. Set this
                          carefully to avoid twitter API limit. [default: 150].
        -f                Remove friends who are also followers.
                          Default to false. [default: false].
        -i                Output id instead of screen name [default: false]
        -r                If this option is set, friends will be removed from
                          the most recently added. Default to false so friends
                          will be removed from the oldest.[default: false]
        -h --help         Show this screen.
        --version         Show version.
```

The file which contains the list of friends who must not be removed should have
one Twitter screen name per line.

## Examples
Remove friends with 10 seconds delay

```
    twitter-autoremove -d 10
```

Print out removed friends by id instead of screenname

```
    twitter-autoremove -i
```

BECAREFUL: Remove all friends

```
    twitter-autoremove -f
```


## License
MIT © [Ha.Minh](https://github.com/minhhh)

