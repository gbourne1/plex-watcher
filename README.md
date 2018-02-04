# plex-watcher
Plex Watcher allows you to know when someone starts, stops, or pauses watching movies on your Plex server. You can be notifed via desktop notification or email. Also you can view the activity via the logs.

## Install from NPM
* NodeJS: Download NodeJS [here](https://nodejs.org/en/download/)
* Run: `npm i -g plex-watcher`

### Run
* Run: `plex-watcher [arguments]`
* Either configure the .env (see below) or use the command line arguments
* Run with arguments example: `plex-watcher --hostname=192.168.1.1 --port=35000 --username=myname --password=12345 --notify=true --emailSend=true --email=gmail --emailPort=465 --emailAddress=my@email.com --emailPassword=s2edwd223 --timer=5000 --v`
* If argument not found, will look for them in the .env file
* Use flag '--v' for verbose to the console

## Install from Github
### Dependencies
* Git: If a Mac, should already be installed. If Windows, install from [here](https://git-scm.com/download/win).

### Get the code
* Clone the repository by running: `git clone https://github.com/gbourne1/plex-watcher.git`
* Run: `npm install`

### Start the Plex Watcher
* Run: npm run start
* Use -- before arguments. For example: `npm run start -- --hostname=192.168.1.1 --port=35000 --username=myname --password=12345 --notify=true --emailSend=true --email=gmail --emailPort=465 --emailAddress=my@email.com --emailPassword=s2edwd223 --timer=5000`
* Use flag '--v' for verbose to the console

## Configure .env
1. Copy the .env-example to .env
2. Modify the .env file and add settings for Plex Server and/or Email

The Plex settings requires your username, password, URL/IP of the Plex server, and port. The (either external or internal) and port can be found under Settings->Server->Remote Access.

You may also set the frequency of checking of activity by setting TIMER_MILLISECONDS. The default time is 5 minutes.

## Notifications
* If you want desktop notification, set SEND_NOTIFY=true otherwise set SEND_NOTIFY=false. 
* If you want an email notification, set SEND_EMAIL=ture otherwise set SEND_EMAIL=false.

### Setting email
1. Enter the email service (i.e. gmail)
2. The port (gmail is 465)
3. Your email address
4. Your email password. You can either use your regular password or if you have 2-FA enabled, you must generate an app password [here](https://myaccount.google.com/u/1/apppasswords)

## Logs
The logs can be viewed as a running tail [here](http://localhost:5000/tail)
