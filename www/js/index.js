/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 * (C) Makoto SUGANO, makoto.sugano@gmail.com
 */

// See https://cordova.apache.org/docs/en/latest/cordova/events/events.html#deviceready
document.addEventListener('deviceready', onDeviceReady, false);

function onDeviceReady() {
    // Cordova is now initialized. Have fun!

    console.log('Running cordova-' + cordova.platformId + '@' + cordova.version);
    app.init();
}

var app = {
    init: function() {
	// domaemon
	document.addEventListener("offline", this.onOffLine, false);
	document.addEventListener("backbutton", this.onBackKeyDown, false);
	
	$("#mainbutton").on("vclick", app.actionWikiTalk);
	$("#summary_mode, #continuous_mode, #random_mode, #voice_speed_slow, #voice_speed_normal, #voice_speed_fast").change(app.settingsChanged);
	
	// reading the configuration
	if (window.localStorage.getItem("summaryMode")) {
	    app.summaryMode = window.localStorage.getItem("summaryMode");
	    $('#summary_mode').val(app.summaryMode);
	    console.log(app.summaryMode);
	}
	if (window.localStorage.getItem("continuousMode")) {
	    app.continuousMode = window.localStorage.getItem("continuousMode");
	    $('#continuous_mode').val(app.continuousMode);
	    console.log(app.continuousMode);
	}
	if (window.localStorage.getItem("randomMode")) {
	    app.randomMode = window.localStorage.getItem("randomMode");
	    $('#random_mode').val(app.randomMode);
	    console.log(app.randomMode);
	}
	if (window.localStorage.getItem("voiceSpeed")) {
	    console.log("voiceSpeed changed");
	    app.voiceSpeed = window.localStorage.getItem("voiceSpeed");
	    // update the element
	    switch (app.voiceSpeed) {
	    case "60":
		console.log("slow");
		$("#voice_speed_slow").prop("checked", true);
		break;
	    case "80":
		console.log("normal");
		$("#voice_speed_normal").prop("checked", true);
		break;
	    case "100":
		console.log("fast");
		$("#voice_speed_fast").prop("checked", true);
	    break;
	    default:
		console.log("not recognized");
	    }
	}
	
	// UPDATE STATE
	app.state = app.checkConnection();
    
	if (app.state == "NO_CONNECTION_STATE") {
	    app.showInitScreen("Connect to network and try again.");
	} else {
	    app.showInitScreen("Welcome, press the above image.");
	}
    },
    showInitScreen: function(message) {
	console.log("showInitScreen");
	
	$("#mainbutton img").attr("src", "img/Wikipedia_logo_silver.png");
	$("#mainbutton").button();
	$("#wikitalk_console").text(message);

	// domaemon, enable the settings
	$("#settings_button").removeClass('ui-disabled');
    },
    showSpeakScreen: function(title) {
	console.log("showSpeakScreen");

	$("#mainbutton img").attr("src", "img/Wikipedia_logo_blue.png");
	$("#mainbutton").button();
	$("#wikitalk_console").text(title);

	// domaemon, disable the settings
	$("#settings_button").addClass('ui-disabled');
    },
    actionWikiTalk: function() {
	console.log("actionWikiTalk");
	console.log(app.state);

	switch(app.state) {
	case "WAIT_STATE":
	    app.state = app.checkConnection();
	    
	    if (app.state == "NO_CONNECTION_STATE") {
		app.showInitScreen("Connect to network and try again.");
	    } else {
		app.state = "PLAY_STATE";
		$.mobile.loading( "show", { text: 'Fetching...', textVisible: true, theme: 'b' } );
		app.fetchAndReadArticle();
	    }
	    break;
	case "PLAY_STATE":
	    app.state = "WAIT_STATE";
	    app.showInitScreen("Stop.");
	    navigator.notification.beep(1);	    
	    break;
	default:
	    app.state = "WAIT_STATE";
	    app.showInitScreen("");
	    break;
	}
    },
    fetchAndReadArticle: function() {
	app.fetchArticle1A();
    },
    fetchArticle1A: function() { // Fetching Random Article Titles
	console.log("fetchArticle1A");
	
	app.queryData = {
	    "action": "query", // query
	    "list": "random", // random mode
	    "format": "json", // json
	    "rnnamespace": 0, // https://en.wikipedia.org/wiki/Wikipedia:Namespace
	    "rnlimit": 1
	};
	
	// http://en.wikipedia.org/w/api.php?action=query&list=random&format=json&rnnamespace=0&rnlimit=1
	$.getJSON(app.queryUrl, app.queryData, app.fetchArticle2);
    },
    fetchArticle1B: function(data) { // Fetching Related Article from Titles (Continuous)
	console.log("fetchArticle1B");

	app.queryData = {
	    "action": "query", // query
	    "prop": "links", // links
	    "format": "json", // json
	    "plnamespace": 0, // https://en.wikipedia.org/wiki/Wikipedia:Namespace
	    "pllimit": 500,
	    "titles": app.title,
	    "indexpageids": "" // returns pageids section for conveinience
	};

	// http://en.wikipedia.org/w/api.php?action=query&prop=iwlinks&format=json&plnamespace=0&pllimit=500&titles=Kyoto&indexpageids
	$.getJSON(app.queryUrl, app.queryData, app.fetchArticle2);
    },
    fetchArticle2: function(data) { // Fetching Content from the Title
	console.log("fetchArticle2");

	if (typeof data.query.random != "undefined") { // from 1A
	    app.title = data.query.random[0].title;
	} else { // from 1B
	    var pageId = data.query.pageids[0];
	    
	    // using random number
	    // this should improve, deadlinks are also counted here. domaemon.
	    var pageLength = data.query.pages[pageId].links.length;
	    app.title = data.query.pages[pageId].links[Math.floor(Math.random()*pageLength)].title;
	}

	var summary = true;

	if (app.summaryMode == "on") {
	    summary = true;
	} else if (app.summaryMode == "off") {
	    summary = false;
	}

	app.queryData = {
	    "action": "query",
	    "prop": "extracts",
	    "format": "json",
	    "exlimit": 10,
	    "exintro": summary, //
	    "explaintext": true,
	    "exsectionformat": "wiki",
	    "titles": app.title,
	    "indexpageids": true
	};

	// http://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&explaintext=true&exsectionformat=wiki&titles=Kyoto
	$.getJSON(app.queryUrl, app.queryData, app.readArticle1);
    },
    readArticle1: function(data) { // prep for reading multi paragraphs.
	console.log("readArticle1");
	// console.log(JSON.stringify(data));

	$.mobile.loading( "hide" );
	
	var pageId = data.query.pageids[0];

	if (pageId == -1) {
	    navigator.notification.beep(1);
	    app.showInitScreen("The page does not exist: " + app.title);

	    return;
	}
	
	app.content = data.query.pages[pageId].extract;
	console.log(app.content);

	app.showSpeakScreen(app.title);

	TTS.speak({
	    text: app.content,
	    locale: 'en-GB',
	    rate: app.voiceSpeed / 100 // devided by 100 - defaul value 80/100
        }, function () {
	    app.readArticle2(); // reading ended.
        }, function (reason) {
	    app.fail(reason);
        });	
    },
    readArticle2: function() { // reading finished.
	if (app.continuousMode == "on") {
	    app.fetchArticle1B();
	} else {
	    navigator.notification.beep(1);	    
	    app.showInitScreen("Finished reading an article.");
	}
    },
    fail: function(reason) {
	console.log(JSON.stringify(reason));
    },
    checkConnection: function() {
	var networkState = navigator.connection.type;
	
	if (networkState == Connection.NONE) {
	    return "NO_CONNECTION_STATE";
	} else {
	    return "WAIT_STATE";
	}
    },
    settingsChanged: function() {
	console.log("settingsChanged");

	app.summaryMode = $('#summary_mode').val();
	window.localStorage.setItem("summaryMode", app.summaryMode);
	app.continuousMode = $('#continuous_mode').val();
	window.localStorage.setItem("continuousMode", app.continuousMode);
	app.randomMode = $('#random_mode').val();
	window.localStorage.setItem("randomMode", app.randomMode);

        if ($("#voice_speed_slow").is(":checked")) {
	    app.voiceSpeed = "60";
        } else if ($("#voice_speed_normal").is(":checked")) {
	    app.voiceSpeed = "80";
	} else if ($("#voice_speed_fast").is(":checked")) {
	    app.voiceSpeed = "100";
	}
	window.localStorage.setItem("voiceSpeed", app.voiceSpeed);
    },
    onQuit: function(buttonIndex) {
	if (buttonIndex == 1) {
	    navigator.app.exitApp();
	}
    },
    onBackKeyDown: function() {
	navigator.notification.confirm("Quit WikiTalk?", app.onQuit, "WikiTalk")
    },
    onOutOfNetwork: function() {
	app.showInitScreen("Connect to network and try again.");
    },
    onOffLine: function() {
	navigator.notification.beep(1);	    

	navigator.notification.alert(
	    'Connect to network and try again.', // message
	    app.onOutOfNetwork,                  // callback
	    'WikiTalk',                          // title
	    'OK'                                 // buttonName
	);
    },
    content: null,
    queryUrl: 'http://en.wikipedia.org/w/api.php',
    queryData: null,
    title: "Kyoto",
    status: "NO_CONNECTION_STATE",
    randomMode: "on",
    summaryMode: "on",
    continuousMode: "on",
    voiceSpeed: "80"
};

$('#wikitalk_console').focus(function() {
    this.blur();
});

