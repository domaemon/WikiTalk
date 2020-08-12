# TL;DR

WikiTalk is a simple application that keeps reading Wikipedia artciles for you. It may be suitable for you if you are interested in learning new languages or eager to get wisdom from Wikipedia. The initial version of this application was released on Google Play Store in 2010.

# Github

This repository contains the source for WikiTalk application that is released on Google Play Store. This application is developed based on:

* Appache Cordova
* Jquery Mobile

The language that is used is:

* Javascript

# Build

Currently, it is tested only on Android. As of 2020-08-11, the following steps 

cordova platform add android@9.0.0

cordova plugin add cordova-plugin-whitelist
cordova plugin add cordova-plugin-network-information
cordova plugin add cordova-plugin-dialogs
cordova plugin add cordova-plugin-splashscreen
cordova plugin add https://github.com/vilic/cordova-plugin-tts.git

# References




pi.php?action=query
        &generator=categorymembers
        &gcmtitle=Category:Lakes
        &prop=info

http://en.wikipedia.org/w/api.php?action=query&list=random&format=json&rnnamespace=0&rnlimit=1

http://en.wikipedia.org/w/api.php?action=query&list=random&format=json&rnnamespace=0&rnlimit=1&generator=categorymembers&gcmtitle=Category:Lakes&prop=info 

https://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&explaintext=true&exsectionformat=wiki&titles=Kyoto&exintro=false
cordova plugin add https://github.com/vilic/cordova-plugin-tts

