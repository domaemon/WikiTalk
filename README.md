# TL;DR

WikiTalk is a simple application that keeps reading Wikipedia artciles for you. It may be suitable for you if you are interested in learning new languages or eager to get random wisdom from Wikipedia. The initial version of this application was released on Google Play Store in 2010. Major restructuring took place in the summer of 2020 and the version 2 got released in August 2020.

# Github

This repository contains the whole source of WikiTalk app that is available on Google Play Store. The sourcce code will hopefully give you a hint how you can release a mobile app that was based on Cordova on Google Play Store.

# Building the App
## Development

This application uses following framework.

* Appache Cordova
* Jquery Mobile
* Media Wiki API
* Javascript and CSS

## Environment

The tool that was used to develop this App were as follows:

* Mac OS Catalina
* homebrew
* Android Studio for Relasing app on Google Play store
* Android Emulator for testing purposes
* Mac Emacs as an Editor

# Build Steps

Currently, it is tested only on Android. As of 2020-08-11, the following steps 

cordova platform add android@9.0.0

cordova plugin add cordova-plugin-whitelist
cordova plugin add cordova-plugin-network-information
cordova plugin add cordova-plugin-dialogs
cordova plugin add cordova-plugin-splashscreen
cordova plugin add https://github.com/vilic/cordova-plugin-tts.git

# Wikipeida Media API

The app fetches an wikipedia article random for the initial attempt. From the second time, it will either a) continue to fetch the article randomly or finds a related article inside the current article.

For example, in the case of receiving random arcicles from Wikipeida, following API was used.

http://en.wikipedia.org/w/api.php?action=query&list=random&format=json&rnnamespace=0&rnlimit=1

# References

* [Cordova](https://cordova.apache.org/)
* [Jquery Mobile](https://jquerymobile.com/)
* [MediaWiki Action API](https://www.mediawiki.org/wiki/API:Query)
* [Signing App for Google Play Store](https://developer.android.com/studio/publish?hl=ja)