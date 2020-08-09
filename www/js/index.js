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
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {

	// domaemon
	document.addEventListener("offline", this.onOffLine, false);
	document.addEventListener("backbutton", this.onBackKeyDown, false);
        $("#mainbutton").on("vclick", app.wikitalkInit);
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
	    case "85":
		console.log("slow");
		$("#voice_speed_slow").prop("checked", true);
		break;
	    case "100":
		console.log("normal");
		$("#voice_speed_normal").prop("checked", true);
		break;
	    case "115":
		console.log("fast");
		$("#voice_speed_fast").prop("checked", true);
		break;
	    default:
		console.log("not recognized");
	    }
	}

	// initial checking of the network connection
	if (app.checkConnection()) {
            // navigator.tts.startup(app.ttsStartupInitWin, app.fail);
	    app.resetHandling("Welcome, press the above image.");
	} else {
	    app.resetHandling("Connect to network and try again.");
	    // navigator.notification.beep(1); onOffLine shall take care.
	}
	
	window.plugins.speechRecognition.getSupportedLanguages(
	    function(languages){
		// display the json array
		console.log(languages);
		navigator.splashscreen.hide();
	    },
	    function(error){
		console.log("Could not retrieve the languages : " + error);
	    }
	);
        console.log('Received Event: ' + id);
    },
    fail: function(result) {
	console.log(JSON.stringify(result));
    },
    ttsSpeakWin: function(result) {
	console.log("ttsSpeakWin");
	console.log(JSON.stringify(result));
	app.readParagraph();
    },
    ttsSpeakWin: function() {
	console.log("ttsSpeakWin");
	app.readParagraph();
    },
    ttsSpeedWin: function(result) {
	console.log("ttsSpeedWin");
	console.log(JSON.stringify(result));
    },
    searchNextPage: function() {
	console.log("searchNextPage");
	app.queryUrl = 'http://en.wikipedia.org/w/api.php';
	app.queryData = {
	    "action": "query", // query
	    "prop": "links", // links
	    "format": "json", // json
	    "plnamespace": 0, // https://en.wikipedia.org/wiki/Wikipedia:Namespace
	    "pllimit": 500,
	    "titles": app.title,
	    "indexpageids": "" // returns pageids section for conveinience
	};

	// http://en.wikipedia.org/w/api.php?action=query&prop=links&format=json&plnamespace=0&pllimit=500&titles=Kyoto&indexpageids=

	$.mobile.loading( "show", { text: 'Fetching...', textVisible: true, theme: 'b' } );
	$.getJSON(app.queryUrl, app.queryData, app.getJsonRelatedLinks);
    },
    readParagraph: function() {
	var paragraphMax = 1;

	if (app.summaryMode == "off") {
	    paragraphMax = app.paragraphList.length;
	} else if (app.summaryMode == "on") {
	    paragraphMax = 1;
	}

	if (app.paragraphId < paragraphMax) {
	    app.content = jQuery(app.paragraphList[app.paragraphId]).text();
	    while (app.content != (app.content = app.content.replace(/\([^\(\)]*\)/g, "")));
	    while (app.content != (app.content = app.content.replace(/\[[^\[\]]*\]/g, "")));
	    // not the right place, but for now here comes the speed setting.
	    // [OLD] navigator.tts.speed(app.voiceSpeed, app.ttsSpeedWin, app.fail);
	    // [OLD] navigator.tts.speak(app.content, app.ttsSpeakWin, app.fail);
	    TTS.speak({
		text: app.content,
		locale: 'en-GB',
		rate: app.voiceSpeed / 100
            }, function () {
		console.log("ttsSpeakWin");
		app.ttsSpeakWin();
            }, function (reason) {
		app.fail();
            });
	    
	    app.paragraphId += 1;
	} else {
	    app.paragraphId = 0;
	    if (app.continuousMode == "on") {
		app.searchNextPage();
	    } else {
		app.resetHandling("Finished reading an article.");
		navigator.notification.beep(1);	    
	    }
	}
    },
    resetHandling: function(message) {
	if (app.status == "PLAY_STATE") {
	    app.ttsStop();
	    app.status = "READY_STATE";
	}
	$("#mainbutton img").attr("src", "img/Wikipedia_logo_silver.png");
	$("#mainbutton").button();
	$("#wikitalk_console").text(message);
	$("#settings_button").removeClass('ui-disabled');
    },
    getJsonParagraphs: function(data) {
	console.log("getJsonParagraphs");
	var pageId = data.query.pageids[0];

	$.mobile.loading( "hide" );

	if (app.status != "PLAY_STATE") {
	    return;
	}

	if (pageId == -1) {
	    app.resetHandling("The page does not exist: " + app.title);
	    navigator.notification.beep(1);	    
	} else {
	    // update the article title
	    $("#wikitalk_console").text(app.title);
	    app.paragraphList = $('<div>' + data.query.pages[pageId].extract + '</div>').children('p');
	    app.paragraphId = 0;
	    app.readParagraph();
	}
    },
    getJsonRelatedLinks: function(data) {
	console.log("getJsonRelatedLinks");
	console.log(data);
	var pageId = data.query.pageids[0];

	$.mobile.loading( "hide" );

	if (pageId == -1) {
	    app.resetHandling("Link does not exist.");
	    navigator.notification.beep(1);	    
	} else {
	    // using random number
	    // this should improve, deadlinks are also counted here. domaemon.
	    var pageLength = data.query.pages[pageId].links.length;
	    app.title = data.query.pages[pageId].links[Math.floor(Math.random()*pageLength)].title;
	    app.queryUrl = 'http://en.wikipedia.org/w/api.php';
	    app.queryData = {
		"action": "query",
		"prop": "extracts",
		"format": "json",
		"exlimit": 10,
		"exsectionformat": "plain",
		"titles": app.title,
		"indexpageids": ""
	    };
	    // http://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exlimit=10&titles=Kyoto&indexpageids=

	    $.mobile.loading( "show", { text: 'Fetching...', textVisible: true, theme: 'b' } );
	    $.getJSON(app.queryUrl, app.queryData, app.getJsonParagraphs);
	}
    },
    // Extract contents from the specific titles. Can include multiple articles.
    getJsonRandomLinks: function(data) {
	console.log("getJsonRandomLinks");

	$.mobile.loading( "hide" );

	app.title = data.query.random[0].title;
	console.log(app.title);
	    app.queryUrl = 'http://en.wikipedia.org/w/api.php';
	    app.queryData = {
		"action": "query",
		"prop": "extracts",
		"format": "json",
		"exlimit": 10,
		"exsectionformat": "plain",
		"titles": app.title,
		"indexpageids": ""
	    };

	$.mobile.loading( "show", { text: 'Fetching...', textVisible: true, theme: 'b' } );
	$.getJSON(app.queryUrl, app.queryData, app.getJsonParagraphs);
    },
    ttsStartupInitWin: function(result) {
	console.log("ttsStartupInitWin");
	// navigator.tts.setLanguage("en-US", function(result) { console.log(result); }, app.fail);

	app.status = "READY_STATE";
    },
    ttsStartupHalfway: function() {
	console.log("ttsStartupHalfway");
	// navigator.tts.setLanguage("en-US", function(result) { console.log(result); }, app.fail);

	// now, continue to the normal procedure.
	app.status = "READY_STATE";
	app.wikitalkInit();
	
    },
    ttsStopWin: function(result) {
	console.log("ttsStopWin");
    },
    ttsStop: function() {
	console.log("ttsStop");
        // [OLD] navigator.tts.stop(app.ttsStopWin, app.fail);
	TTS.speak('Stop Reading.', function () {
	    app.ttsStopWin;
	}, function (reason) {
	    app.fail;
	});
    },
    recognizeSpeech: function() {
	console.log("recognizeSpeech");
	var maxMatches = 1;
	var promptString = "Speak Now"; // optional
	var language = "en-US";         // optional
	
	navigator.SpeechRecognizer.startRecognize(function(result){
            // alert(result);
	    console.log(result[0]);
	    // remove the rubbish, must be a bug on the Google side.
	    app.title = result[0].replace(/[\(\)]/g, "");
	    app.queryUrl = 'http://en.wikipedia.org/w/api.php?action=query&prop=extracts&format=json&exlimit=10&exsectionformat=plain&indexpageids=';
	    app.queryData = {titles: app.title};

	    $.mobile.loading( "show", { text: 'Fetching...', textVisible: true, theme: 'b' } );
	    $.getJSON(app.queryUrl, app.queryData, app.getJsonParagraphs);
	}, function(errorMessage){
            console.log("Error message: " + errorMessage);
	    app.resetHandling("Speech not recognized.");
	}, maxMatches, promptString, language);
    },
    wikitalkInit: function() {
	console.log("wikitalkInit");

	app.status = app.checkStatus();
	
	
	

	if (!app.checkConnection()) {
	    app.status = "NOT_READY_STATE";
	    app.resetHandling("Connect to network and try again.");
	    navigator.notification.beep(1);	    
	} else {
	    if (app.status == "PLAY_STATE") {
		app.resetHandling("Stop.");
		navigator.notification.beep(1);	    
	    } else if (app.status == "READY_STATE") {
		$("#mainbutton img").attr("src", "img/Wikipedia_logo_blue.png");
		$("#mainbutton").button();
		app.status = "PLAY_STATE";
		// domaemon, disable the settings
		$("#settings_button").addClass('ui-disabled');

		if (app.randomMode == "on") {
		    // alert("Random Mode");
		    app.queryUrl = 'http://en.wikipedia.org/w/api.php';

		    app.queryData = {
			"action": "query", // query
			"list": "random", // random mode
			"format": "json", // json
			"rnnamespace": 0, // https://en.wikipedia.org/wiki/Wikipedia:Namespace
			"rnlimit": 1
		    };

		    // http://en.wikipedia.org/w/api.php?action=query&list=random&format=json&rnnamespace=0&rnlimit=1

		    $.mobile.loading( "show", { text: 'Fetching...', textVisible: true, theme: 'b' } );
		    $.getJSON(app.queryUrl, {}, app.getJsonRandomLinks);
		} else if (app.randomMode == "off") {
		    app.recognizeSpeech();
		}
	    } else if (app.status == "NOT_READY_STATE") {
		// should start the engine and comeback here with 
		// 1) ttsStartup
		// 2) comeback here.
		app.ttsStartupHalfway();
	    }
	}
    },
    checkConnection: function() {
	var networkState = navigator.connection.type;
	
	if (networkState == Connection.NONE) {
	    return false;
	} else {
	    return true;
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
	app.resetHandling("Connect to network and try again.");
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
    queryUrl: null,
    queryData: null,
    paragraphId: 0,
    paragraphList: [],
    title: "Kyoto",
    status: "NOT_READY_STATE",
    randomMode: "on",
    summaryMode: "on",
    continuousMode: "on",
    voiceSpeed: "100"
};

$('#wikitalk_console').focus(function() {
    this.blur();
});
