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
	$("#lang_mode, #continuous_mode, #random_mode, #voice_speed_slow, #voice_speed_normal, #voice_speed_fast").change(app.settingsChanged);

	if (window.localStorage.getItem("langMode")) {
            console.log(app.langMode);
	    
            app.langMode = window.localStorage.getItem("langMode");
            $('#lang_mode').val(app.langMode);
	    app.queryUrl = 'http://' + app.langMode + '.wikipedia.org/w/api.php';

	    switch (app.langMode) {
	    case "en":
		app.locale = "en-GB";
		break;
	    case "zh":
		app.locale = "zh-CN";
		break;
	    case "de":
		app.locale = "de-DE";
		break;
	    case "fi":
		app.locale = "fi-FI";
		break;
	    case "fr":
		app.locale = "fr-FR";
		break;
	    case "ja":
		app.locale = "ja-JP";
		break;
	    case "kr":
		app.locale = "kr-KR";
		break;
	    default:
		break;
	    }
	    console.log(app.langMode);
	}	
	// reading the configuration
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
	    app.voiceSpeed = window.localStorage.getItem("voiceSpeed");
	    // update the element
	    switch (app.voiceSpeed) {
	    case app.VOICE_SPEED_SLOW:
		console.log("slow");
		$("#voice_speed_slow").prop("checked", true);
		break;
	    case app.VOICE_SPEED_NORMAL:
		console.log("normal");
		$("#voice_speed_normal").prop("checked", true);
		break;
	    case app.VOICE_SPEED_FAST:
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
	    app.showInitScreen("Welcome, press the above image to start the Talk.");
	}
    },
    showInitScreen: function(message) {
	console.log("showInitScreen");
	
	$("#mainbutton img").attr("src", "img/Wikipedia_logo_silver.png");
	$("#mainbutton").button();
	$("#wikitalk_console").text(message);

	// domaemon, enable the settings
	$("#settings_button").removeClass('ui-disabled');

	$("#wikitalk_console_container").show();
	$("#wikitalk_title_container").hide(); // app.title
	$("#wikitalk_content_container").hide(); // app.content
	
    },
    showSpeakScreen: function(title, content) {
	console.log("showSpeakScreen");
	

	$("#mainbutton img").attr("src", "img/Wikipedia_logo_blue.png");
	$("#mainbutton").button();
	$("#wikitalk_console").text("PLAY_STATE"); // PLAY_STATE

	$("#wikitalk_console_container").hide();
	$("#wikitalk_title").text(title); // app.title
	$("#wikitalk_content").text(content); // app.content
	$("#wikitalk_title_container").show(); // app.title
	$("#wikitalk_content_container").show(); // app.content

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

	    TTS.speak({
		text: ""
            }, function () {
	    }, function (reason) {
		app.fail(reason);
	    });	
	    
	    navigator.notification.beep(1);
	    app.showInitScreen("Finished reading an article.");

	    break;
	default:
	    app.state = "WAIT_STATE";
	    app.showInitScreen("Unknown Error");
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

	app.queryData = {
	    "action": "query",
	    "prop": "extracts",
	    "format": "json",
	    "exlimit": "max",
	    "explaintext": true,
	    "exsectionformat": "plain",
	    "exintro": true,
	    "titles": app.title,
	    "indexpageids": true
	};

	console.log(app.queryData);

	// http://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&explaintext=true&exsectionformat=wiki&titles=Kyoto&exintro=false
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

	app.showSpeakScreen(app.title, app.content);

	TTS.speak({
	    text: app.content,
	    locale: app.langMode,
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
	    app.actionWikiTalk(); // PLAY_STATE to WAIT_STATE
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

	app.langMode = $('#lang_mode').val();
	window.localStorage.setItem("langMode", app.langMode);

	app.continuousMode = $('#continuous_mode').val();
	window.localStorage.setItem("continuousMode", app.continuousMode);

	app.randomMode = $('#random_mode').val();
	window.localStorage.setItem("randomMode", app.randomMode);

        if ($("#voice_speed_slow").is(":checked")) {
	    app.voiceSpeed = app.VOICE_SPEED_SLOW;
        } else if ($("#voice_speed_normal").is(":checked")) {
	    app.voiceSpeed = app.VOICE_SPEED_NORMAL;
	} else if ($("#voice_speed_fast").is(":checked")) {
	    app.voiceSpeed = app.VOICE_SPEED_FAST;
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
    langMode: "en",
    locale: "en_GB",
    randomMode: "on",
    continuousMode: "on",
    VOICE_SPEED_SLOW: "80",
    VOICE_SPEED_NORMAL: "90",
    VOICE_SPEED_FAST: "100",
    voiceSpeed: 90
};

$('#wikitalk_console').focus(function() {
    this.blur();
});

