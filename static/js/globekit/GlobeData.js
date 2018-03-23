var GlobeData = function(globeKitView) {
    var self = this;

    var eventId = 0;
    var eventTimeout = -1;
    var insignificantEventId = 0;
    var ambientEventViews = [];
    var lastEvent = null;
    var eventAnimation = null;
    var currentCategory = null;

    var overallSpeed = 1.5;

    var categoryId = 0;
    var significantEventCount = 0;
    var relevantEvents = [];

    this.start = function() {
        this.addCities();
        relevantEvents.push(GlobeData.categories[(categoryId + 1) % GlobeData.categories.length].significantEvents[0]);
        this.triggerNextEvent();
    }

    this.addCities = function() {
        var cityPoints = [];
        for (var i=0; i<GlobeDataCities.length; i++) {
            var city = GlobeDataCities[i];

            var pos = vec3.fromValues(
                city.rectifiedPos["0"],
                city.rectifiedPos["1"],
                city.rectifiedPos["2"]
            );

            cityPoints.push(pos);
        }

        globeKitView.addPoints(cityPoints);
    }

    this.categoryDidChange = function(category) {
        for (var i=0; i<GlobeData.globeKey.items.length; i++) {
            var item = GlobeData.globeKey.items[i];

            if (item.category == category) {
                item.select();
                continue;
            }

            item.deselect();
        }
    }

    this.triggerNextEvent = function() {

        // Get current category
        var category = GlobeData.categories[categoryId];
        var leadingEvent = category.significantEvents[category.significantEventId];

        category.significantEventId = (category.significantEventId + 1) % category.significantEvents.length;
        significantEventCount++;

        leadingEvent.progress = significantEventCount / leadingEvent.category.significantEventMax;

        if (significantEventCount == category.significantEventMax) {
            categoryId = (categoryId + 1) % GlobeData.categories.length;
            significantEventCount = 0;
        }

        relevantEvents.push(leadingEvent);

        // Need four to start with
        if (relevantEvents.length < 4) {
            this.triggerNextEvent();
            return;
        }

        if (relevantEvents.length == 5) {
            relevantEvents.shift();
        }

        var playingEvent = relevantEvents[1];

        if (relevantEvents[0].category != playingEvent.category) {
            self.categoryDidChange(playingEvent.category);
        }

        GlobeData.globeKey.setProgressForCategory(playingEvent.progress, playingEvent.category);

        // Get bezier points
        var p0 = relevantEvents[0].origin.randomPos
        var p1 = relevantEvents[1].origin.randomPos
        var p2 = relevantEvents[2].origin.randomPos
        var p3 = relevantEvents[3].origin.randomPos

        // Animation configuration
        var time = GlobeData.getTimeForAnimationType(playingEvent.animationType);
        var nextEvent = relevantEvents[2];
        var animationTime = time;

        // Play takeover or arc animation
        if (playingEvent.animationType == GlobeAnimationType.takeover) {
            time *= (nextEvent.animationType == GlobeAnimationType.takeover) ? 1.2 : 0.8;
            self.playTakeoverEvent(playingEvent);
        }
        else if (playingEvent.animationType == GlobeAnimationType.arc) {
            time *= (nextEvent.animationType == GlobeAnimationType.arc) ? 1.5 : 1.0;
            self.playArcEvent(playingEvent);
        }

        // Rotate camera toward event
        if (eventAnimation) eventAnimation.cancel();
        eventAnimation = new GK.Animation((animationTime * 2.5 / 1000.0) * overallSpeed);
        eventAnimation.updateFn = function(value) {
            var pos = GK.Spline.pointOnCurve(p0, p1, p2, p3, value);

            var PI2 = Math.PI * 2.0;

            vec3.normalize(pos, pos);
            var lngRad = Math.asin(pos[1]);
            var latRad = GK.LatLng.radiansForPosition(pos[0], pos[2]);

            var yaw = globeKitView.scene.camera.yaw;

            var latPos = (latRad + PI2) % PI2;
            var latNeg = (latRad - PI2) % PI2;
            var latPosDelta = Math.abs(yaw - latPos);
            var latNegDelta = Math.abs(yaw - latNeg);

            latRad = latNeg;
            if (latPosDelta < latNegDelta) {
                latRad = latPos;
            }

            globeKitView.scene.camTargetYaw = latRad;
            globeKitView.scene.camTargetPitch = -lngRad;
        };
        eventAnimation.start();

        // Trigger next significant event
        GK.setTimeout(function(){
            self.triggerNextEvent();
        }, time * overallSpeed);

        // Trigger two insignificant (dot) events as well
        GK.setTimeout(function() {
            self.triggerNextInsignificantEvent()
        }, (1200 + 800 * Math.random()) * overallSpeed);
        GK.setTimeout(function() {
            self.triggerNextInsignificantEvent()
        }, (800 + 1200 * Math.random()) * overallSpeed);
    }

    this.triggerNextInsignificantEvent = function() {
        var globeEvent = GlobeData.insignificantEvents[insignificantEventId % GlobeData.insignificantEvents.length];

        for (var i=0; i<GlobeData.insignificantEvents.length; i++) {
            globeEvent = GlobeData.insignificantEvents[insignificantEventId % GlobeData.insignificantEvents.length];
            if (globeEvent.category == currentCategory) break;
            insignificantEventId++;
        }

        this.playDotEvent(globeEvent);
        insignificantEventId++;
    }

    this.playDotEvent = function(e) {
        var canvas = globeKitView.canvas;
        var camera = globeKitView.scene.camera;

        if (e.origin == null) return;

        var globeCenter = (canvas.width * 0.5) + (canvas.width * camera.sceneOffset[0] * 0.5);
        var view = new GlobeData.AmbientEventView(e, globeKitView, e.leftSide);
        view.addClassName("ambient");

        view.onHide = function(view) {
            var idx = ambientEventViews.indexOf(view);
            if (idx != -1) ambientEventViews.splice(idx, 1);
        }

        // De-emphasize
        var pos = camera.getScreenPos(e.origin.pos, canvas.width, canvas.height);
        for (var j=0; j<ambientEventViews.length; j++) {
            var ambientEventView = ambientEventViews[j];

            var otherEvent = ambientEventView.ambientEvent;
            var otherPos = camera.getScreenPos(otherEvent.origin.pos, canvas.width, canvas.height);
            var dist = vec2.distance(pos, otherPos);

            if (Math.abs(dist) < ambientEventView.getWidth()) {
                return false;
            }
        }

        globeKitView.scene.showEventAtCoords(e.origin.coords, 1.3 * overallSpeed, 0.2 * overallSpeed);
        ambientEventViews.push(view);
        view.show(1, 2500);

        return true;
    }

    this.playArcEvent = function(e) {
        this.updateArcEvent(e);

        var scene = globeKitView.scene;
        var canvas = scene.canvas;
        var camera = scene.camera;

        // De-emphasize existing events
        var pos = camera.getScreenPos(e.origin.pos, canvas.width, canvas.height);
        for (var j=0; j<ambientEventViews.length; j++) {
            var ambientEventView = ambientEventViews[j];

            var otherEvent = ambientEventView.ambientEvent;
            var otherPos = camera.getScreenPos(otherEvent.origin.pos, canvas.width, canvas.height);
            var dist = vec2.distance(pos, otherPos);

            if (Math.abs(dist) < ambientEventView.getWidth()) {
                ambientEventView.hideNow();
            }
        }

        var globeCenter = (canvas.width * 0.5) + (canvas.width * camera.sceneOffset[0] * 0.5);

        var view = new GlobeData.AmbientEventView(e, globeKitView, e.leftSide);
        view.addClassName("pulse-arc");
        view.onHide = function(view) {
            var idx = ambientEventViews.indexOf(view);
            if (idx != -1) ambientEventViews.splice(idx, 1);
        }

        ambientEventViews.push(view);
        view.show(250, 2400);

        // Animate pulse arc in
        scene.publisherEvent.alpha = 1.0;
        scene.publisherEvent.progress = 0.0;

        var a = new GK.Animation(4.0);
        a.updateFn = function(value) {
            scene.publisherEvent.progress = value;
        };
        a.completeFn = function() {
        };

        a.start();
    }

    this.updateArcEvent = function(e) {
        //var numOtherCities = Math.min(e.arcConnections.length, 3);
        var numOtherCities = e.arcConnections.length;
        var otherCities = e.arcConnections.slice(0, numOtherCities);
        var centerCity = e.origin;

        var scene = globeKitView.scene;
        scene.publisherEvent.updateLocations(centerCity, otherCities);
    }

    this.playTakeoverEvent = function(e) {
        var canvas = globeKitView.canvas;
        var scene = globeKitView.scene;
        var camera = scene.camera;

        // De-emphasize existing events
        var pos = camera.getScreenPos(e.origin.pos, canvas.width, canvas.height);
        for (var j=0; j<ambientEventViews.length; j++) {
            var ambientEventView = ambientEventViews[j];

            var otherEvent = ambientEventView.ambientEvent;
            var otherPos = camera.getScreenPos(otherEvent.origin.pos, canvas.width, canvas.height);
            var dist = vec2.distance(pos, otherPos);

            if (Math.abs(dist) < ambientEventView.getWidth()) {
                ambientEventView.hideNow();
            }
        }

        var offset = vec2.fromValues(0.0, 0.0);

        var city = e.origin;
        var worldPos = city.pos
        var screenPos = camera.getScreenPos(worldPos, canvas.width, canvas.height);
        var globeCenter = (canvas.width * 0.5) + (canvas.width * camera.sceneOffset[0] * 0.5);

        var view = new GlobeData.AmbientEventView(e, globeKitView, e.leftSide);
        view.addClassName("takeover");
        view.onHide = function(view) {
            var idx = ambientEventViews.indexOf(view);
            if (idx != -1) ambientEventViews.splice(idx, 1);
        }

        ambientEventViews.push(view);
        view.show(500 * overallSpeed, 3900 * overallSpeed);

        scene.epicenter.createGeometry(worldPos);
        globeKitView.scene.highlightCoords(city.coords, 2.0 * overallSpeed);
        //globeKitView.scene.zoomToCoords(city.coords, offset, 5.0);
        globeKitView.scene.showEventAtCoords(e.origin.coords, 4.0 * overallSpeed, 0.5 * overallSpeed);

        GK.setTimeout(function(){
            globeKitView.scene.unHighlightCoords(2.0 * overallSpeed);
        }, 3500 * overallSpeed);
    }

    this.getInsignificantEventByCosTheta = function() {
        var camera = globeKitView.scene.camera;
        var distances = [];

        for (var i=0; i<GlobeData.insignificantEvents.length; i++) {
            var globeEvent = GlobeData.insignificantEvents[i];
            var cosTheta = vec3.dot(globeEvent.origin.pos, camera.leftVector);

            if (cosTheta > 0.0) {
                distances.push({
                    globeEvent: globeEvent,
                    theta: cosTheta
                });
            }
        }

        distances.sort(function(a, b) {
            return b.theta - a.theta;
        });

        if (distances.length == 0) {
            return null;
        }

        return distances[0].globeEvent;
    }
}

GlobeData.getTimeForAnimationType = function(animationType) {
    if (animationType == GlobeAnimationType.takeover) {
        return 4000;
    }
    else if (animationType == GlobeAnimationType.arc) {
        return 2500;
    }
    else if (animationType == GlobeAnimationType.dot) {
        return 1500;
    }
    return 0;
}

// ----------------------
// Fetch and process data
// ----------------------

GlobeData.events = [];
GlobeData.cities = [];
GlobeData.categories = [];
GlobeData.eventHistory = [];
GlobeData.significantEvents = [];
GlobeData.insignificantEvents = [];
GlobeData.SIGNIFICANT_EVENT_MAX = 5;

GlobeData.sheetDidLoad = function(sheetData) {
    let title = sheetData["feed"]["title"]["$t"];
    var entries = sheetData["feed"]["entry"];

    if (title == "LOCATIONS") {
        for (var i=0; i<entries.length; i++) {
            var entry = entries[i];
            GlobeData.cities.push(new GlobeData.City(entry));
        }
    }
    else if (title == "EVENTS") {
        for (var i=0; i<entries.length; i++) {
            var entry = entries[i];
            GlobeData.events.push(new GlobeData.Event(entry));
        }
    }
    else if (title == "CATEGORIES") {
        for (var i=0; i<entries.length; i++) {
            var entry = entries[i];
            var category = new GlobeData.Category(entry);
            GlobeData.categories.push(category);
        }
    }
}

GlobeData.processData = function() {
    function getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    for (var i=0; i<GlobeData.events.length; i++) {
        var globeEvent = GlobeData.events[i];

        var eventOriginString = globeEvent.originText.trim().toLowerCase();
        var eventArcConnectionStrings = globeEvent.arcConnectionsText.split("/");
        var eventCategoryString = globeEvent.categoryText.trim().toLowerCase();

        var center = vec3.fromValues(0.0, 0.0, 0.0);

        // Assign categories
        for (var j=0; j<GlobeData.categories.length; j++) {
            var category = GlobeData.categories[j];
            var categoryString = category.categoryText.trim().toLowerCase();

            if (eventCategoryString == categoryString) {
                globeEvent.category = category;

                // Keep a count of significant events
                var significantEvent = (
                    globeEvent.animationType == GlobeAnimationType.takeover ||
                    globeEvent.animationType == GlobeAnimationType.arc
                );

                if (significantEvent) {
                    category.significantEvents.push(globeEvent);
                }
                else {
                    category.insignificantEvents.push(globeEvent);
                }
            }

            category.significantEventMax = Math.min(category.significantEvents.length, GlobeData.SIGNIFICANT_EVENT_MAX);
        }

        // Assign origin
        for (var k=0; k<GlobeData.cities.length; k++) {
            var city = GlobeData.cities[k];
            var cityIdString = city.idText.trim().toLowerCase();
            if (eventOriginString == cityIdString) {
                globeEvent.origin = city;
            }

            // Assign connections
            for (var l=0; l<eventArcConnectionStrings.length; l++) {
                var eventArcConnectionString = eventArcConnectionStrings[l].trim().toLowerCase();
                if (eventArcConnectionString == cityIdString) {
                    globeEvent.arcConnections.push(city);
                }
            }
        }
    }

    // Sort events by category
    var sortedEvents = [];
    for (var i=0; i<GlobeData.categories.length; i++) {
        var category = GlobeData.categories[i];
        for (var j=0; j<GlobeData.events.length; j++) {
            var globeEvent = GlobeData.events[j];
            if (globeEvent.category == category) {
                sortedEvents.push(globeEvent);
            }
        }
    }

    // Assign sorted events
    GlobeData.events = sortedEvents;

    // Get (in)significant events
    for (var i=0; i<GlobeData.events.length; i++) {
        var globeEvent = GlobeData.events[i];

        // Keep track of (in)significant events
        var significantEvent = (
            globeEvent.animationType == GlobeAnimationType.takeover ||
            globeEvent.animationType == GlobeAnimationType.arc
        );

        if (significantEvent) {
            GlobeData.significantEvents.push(globeEvent);
            globeEvent.origin.randomPos = vec3.create();
            vec3.rotateX(globeEvent.origin.randomPos, globeEvent.origin.pos, center, getRandomFloat(-0.1, 0.1));
        }
        else {
            GlobeData.insignificantEvents.push(globeEvent);
        }
    }

    var ul = document.getElementById("globe-key-list");
    GlobeData.globeKey = new GlobeData.GlobeKey(ul, GlobeData.categories);

    setTimeout(function() {
        GlobeData.globeKey.show();
    }, 750);
}

GlobeData.GlobeKey = function(list, categories) {
    this.items = [];
    this.list = list;

    for (var i=0; i<categories.length; i++) {
        var category = categories[i];
        var item = new GlobeData.GlobeKeyItem(category);
        this.list.appendChild(item.li);
        this.items.push(item);
    }

    this.setProgressForCategory = function(progress, category) {
        for (var i=0; i<GlobeData.globeKey.items.length; i++) {
            var item = GlobeData.globeKey.items[i];
            if (item.category == category) {
                item.setProgress(progress);
                break;
            }
        }
    }

    this.show = function() {
        list.classList.add("in");
    }
}

GlobeData.GlobeKeyItem = function(category) {
    this.category = category;

    this.li = document.createElement("li");
    this.li.setAttribute("data-category", category.getCategorySlug());

    var span = document.createElement("span");
    span.innerHTML = category.categoryText;

    var progressDiv = document.createElement("div");
    progressDiv.innerHTML =
        '<div class="progress">' +
            '<svg class="bg" width="12" height="12"><circle cx="6" cy="6" r="5" stroke="#cccccc" stroke-width="1" fill="none"></circle></svg>' +
            '<svg class="fg" width="12" height="12"><circle cx="6" cy="6" r="5" stroke="#888888" stroke-width="1" fill="none"></circle></svg>' +
        '</div>';

    this.li.appendChild(span);
    this.li.appendChild(progressDiv);

    this.fgSvg = progressDiv.getElementsByTagName("svg")[1];

    this.select = function() {
        this.li.classList.add("selected");
    }

    this.deselect = function() {
        this.li.classList.remove("selected");
    }

    this.setProgress = function(progress) {
        this.fgSvg.style.strokeDashoffset = 30.0 - (30.0 * progress);
    }
}

// ----------------------
// Data models
// ----------------------

var GlobeAnimationType = {
    takeover: 0,
    dot: 1,
    arc: 2
}

GlobeData.Category = function(entryData) {
    this.categoryText = entryData["gsx$category"]["$t"];
    this.priorityText = entryData["gsx$priority"]["$t"];
    this.priority = parseInt(this.priorityText);

    this.significantEvents = [];
    this.significantEventId = 0;

    this.insignificantEvents = [];
    this.insignificantEventId = 0;

    this.categoryEventMax = 0;

    this.getCategorySlug = function() {
        var text = this.categoryText.trim();
        text = text.replace(/\s+/g, '-').toLowerCase();
        return text;
    }
}

GlobeData.Event = function(entryData) {
    this.categoryText = entryData["gsx$category"]["$t"];
    this.eventText = entryData["gsx$event"]["$t"];
    this.publisherText = entryData["gsx$publisher"]["$t"];
    this.animationText = entryData["gsx$animation"]["$t"];
    this.originText = entryData["gsx$origin"]["$t"];
    this.sideText = entryData["gsx$side"]["$t"];
    this.arcConnectionsText = entryData["gsx$arcconnections"]["$t"];

    this.arcConnections = [];
    this.origin = null;
    this.category = null;

    var sideText = this.sideText.trim().toLowerCase();
    this.leftSide = (sideText == "left") ? true : false;
    this.played = false;

    var animationTextLower = this.animationText.toLowerCase();
    this.animationType = GlobeAnimationType[animationTextLower];

    this.getCityText = function(){
        return (this.origin) ? this.origin.cityText : this.originText;
    }
}

GlobeData.City = function(entryData) {
    this.idText = entryData["gsx$id"]["$t"];
    this.cityText = entryData["gsx$city"]["$t"];

    var latLngText = entryData["gsx$coordinates"]["$t"].split(",");
    var lat = parseFloat(latLngText[0].trim());
    var lng = parseFloat(latLngText[1].trim());

    this.coords = new GK.LatLng(lat, lng);
    this.pos = GK.LatLng.toWorld(this.coords);
}

// ----------------------
// HTML callouts
// ----------------------

GlobeData.AmbientEventView = function(ambientEvent, globeKitView, leftSide) {
    var self = this;

    this.ambientEvent = ambientEvent;

    var inTimeout = -1;
    var outTimeout = -1;

    var div = null;
    var contentsDiv = null;
    var innerDiv = null;

    this.onHide = null;

    var __init__ = function() {
        var str = "{{publisherText}} <span>{{eventText}}</span><em>{{cityText}}</em>"
        str = str.replace("{{publisherText}}", ambientEvent.publisherText);
        str = str.replace("{{eventText}}", ambientEvent.eventText);
        str = str.replace("{{cityText}}", ambientEvent.getCityText());

        contentsDiv = document.createElement("div");
        contentsDiv.classList.add("contents");

        innerDiv = document.createElement("div");
        innerDiv.classList.add("inner-contents");
        innerDiv.innerHTML = str;

        div = document.createElement("div");
        div.classList.add("ambient-callout");
        if (leftSide) div.classList.add("left");

        div.appendChild(contentsDiv);
        contentsDiv.appendChild(innerDiv);
    }

    this.addClassName = function(className) {
        div.classList.add(className);
    }

    this.show = function(delay, length) {
        length = length || 4000;

        globeKitView.canvas.parentNode.appendChild(div);
        globeKitView.attachElementToPosition(div, this.ambientEvent.origin.pos);

        inTimeout = GK.setTimeout(function(){
            div.classList.add("in");
        }, 250 + delay);

        outTimeout = GK.setTimeout(function(){
            div.classList.remove("in");
            outTimeout = GK.setTimeout(function() {
                if (self.onHide) self.onHide(self);
                globeKitView.unattachElement(div);
                if (div.parentNode) {
                    div.parentNode.removeChild(div);
                }
            }, 500);
        }, length);
    }

    this.hideNow = function() {
        div.classList.remove("in");
        GK.clearTimeout(inTimeout);
        GK.clearTimeout(outTimeout);

        outTimeout = GK.setTimeout(function() {
            if (self.onHide) self.onHide(self);
            globeKitView.unattachElement(div);
            if (div.parentNode) {
                div.parentNode.removeChild(div);
            }
        }, 750);
    }

    this.emphasize = function() {
        div.classList.add("emphasize");
    }

    this.deEmphasize = function() {
        div.classList.add("deemphasize");
    }

    this.getWidth = function() {
        return div.offsetWidth;
    }

    __init__();
}

var GlobeDataCities = [
  {
    "name": "Kabul",
    "country": "Afghanistan",
    "pop": 3160266,
    "name_ascii": "Kabul",
    "lat": 34.51669029,
    "lng": 69.18326005,
    "pos": {
      "0": 0.770174503326416,
      "1": 0.5666462779045105,
      "2": 0.29281938076019287
    },
    "rectifiedPos": {
      "0": 0.769404947757721,
      "1": 0.5702426433563232,
      "2": 0.2878182530403137
    }
  },
  {
    "name": "Algiers",
    "country": "Algeria",
    "pop": 2665831.5,
    "name_ascii": "Algiers",
    "lat": 36.7630648,
    "lng": 3.05055253,
    "pos": {
      "0": 0.042633090168237686,
      "1": 0.598507285118103,
      "2": 0.7999821305274963
    },
    "rectifiedPos": {
      "0": 0.046734437346458435,
      "1": 0.6021153330802917,
      "2": 0.7970401644706726
    }
  },
  {
    "name": "Huambo",
    "country": "Angola",
    "pop": 986000,
    "name_ascii": "Huambo",
    "lat": -12.74998533,
    "lng": 15.76000932,
    "pos": {
      "0": 0.26491135358810425,
      "1": -0.22069717943668365,
      "2": 0.9386771321296692
    },
    "rectifiedPos": {
      "0": 0.2713542878627777,
      "1": -0.21772289276123047,
      "2": 0.9375305771827698
    }
  },
  {
    "name": "Rosario",
    "country": "Argentina",
    "pop": 1094784.5,
    "name_ascii": "Rosario",
    "lat": -32.95112954,
    "lng": -60.66630762,
    "pos": {
      "0": -0.7315420508384705,
      "1": -0.5439234972000122,
      "2": 0.41108810901641846
    },
    "rectifiedPos": {
      "0": -0.7323530912399292,
      "1": -0.5426619648933411,
      "2": 0.4113112688064575
    }
  },
  {
    "name": "Yerevan",
    "country": "Armenia",
    "pop": 1097742.5,
    "name_ascii": "Yerevan",
    "lat": 40.18115074,
    "lng": 44.51355139,
    "pos": {
      "0": 0.535629391670227,
      "1": 0.6452063918113708,
      "2": 0.5448026061058044
    },
    "rectifiedPos": {
      "0": 0.536348283290863,
      "1": 0.6481617093086243,
      "2": 0.5405709147453308
    }
  },
  {
    "name": "Newcastle",
    "country": "Australia",
    "pop": 816285.5,
    "name_ascii": "Newcastle",
    "lat": -32.84534788,
    "lng": 151.8150122,
    "pos": {
      "0": 0.39681366086006165,
      "1": -0.5423732995986938,
      "2": -0.740520179271698
    },
    "rectifiedPos": {
      "0": 0.405335009098053,
      "1": -0.5426619648933411,
      "2": -0.7356775999069214
    }
  },
  {
    "name": "Perth",
    "country": "Australia",
    "pop": 1206108,
    "name_ascii": "Perth",
    "lat": -31.95501463,
    "lng": 115.8399987,
    "pos": {
      "0": 0.7636299729347229,
      "1": -0.5292532444000244,
      "2": -0.3698110580444336
    },
    "rectifiedPos": {
      "0": 0.7604578137397766,
      "1": -0.5260332226753235,
      "2": -0.3807794153690338
    }
  },
  {
    "name": "Vienna",
    "country": "Austria",
    "pop": 2065500,
    "name_ascii": "Vienna",
    "lat": 48.20001528,
    "lng": 16.36663896,
    "pos": {
      "0": 0.18781735002994537,
      "1": 0.7454761862754822,
      "2": 0.6395232081413269
    },
    "rectifiedPos": {
      "0": 0.1871720254421234,
      "1": 0.7465633749961853,
      "2": 0.6384432315826416
    }
  },
  {
    "name": "Khulna",
    "country": "Bangladesh",
    "pop": 1447669.5,
    "name_ascii": "Khulna",
    "lat": 22.839987,
    "lng": 89.56000077,
    "pos": {
      "0": 0.9215652942657471,
      "1": 0.3881588578224182,
      "2": 0.007077240385115147
    },
    "rectifiedPos": {
      "0": 0.9246492981910706,
      "1": 0.3805530369281769,
      "2": 0.01424785889685154
    }
  },
  {
    "name": "Cochabamba",
    "country": "Bolivia",
    "pop": 804138,
    "name_ascii": "Cochabamba",
    "lat": -17.41001097,
    "lng": -66.16997685,
    "pos": {
      "0": -0.8728417158126831,
      "1": -0.29920750856399536,
      "2": 0.3855155408382416
    },
    "rectifiedPos": {
      "0": -0.8713653087615967,
      "1": -0.29377588629722595,
      "2": 0.3929608464241028
    }
  },
  {
    "name": "Nova Iguacu",
    "country": "Brazil",
    "pop": 844583,
    "name_ascii": "Nova Iguacu",
    "lat": -22.74002155,
    "lng": -43.46996708,
    "pos": {
      "0": -0.6344968676567078,
      "1": -0.38655033707618713,
      "2": 0.6693224906921387
    },
    "rectifiedPos": {
      "0": -0.6358742713928223,
      "1": -0.3680105209350586,
      "2": 0.6784041523933411
    }
  },
  {
    "name": "Joao Pessoa",
    "country": "Brazil",
    "pop": 803441.5,
    "name_ascii": "Joao Pessoa",
    "lat": -7.10113513,
    "lng": -34.87607117,
    "pos": {
      "0": -0.5674172639846802,
      "1": -0.1236211359500885,
      "2": 0.8140979409217834
    },
    "rectifiedPos": {
      "0": -0.5824993252754211,
      "1": -0.120817631483078,
      "2": 0.803801953792572
    }
  },
  {
    "name": "Natal",
    "country": "Brazil",
    "pop": 980588,
    "name_ascii": "Natal",
    "lat": -6.983825664,
    "lng": -60.26994938,
    "pos": {
      "0": -0.8619286417961121,
      "1": -0.12158914655447006,
      "2": 0.4922347664833069
    },
    "rectifiedPos": {
      "0": -0.8575305342674255,
      "1": -0.120817631483078,
      "2": 0.5000444650650024
    }
  },
  {
    "name": "Belem",
    "country": "Brazil",
    "pop": 1787368.5,
    "name_ascii": "Belem",
    "lat": -1.450003236,
    "lng": -48.48002303,
    "pos": {
      "0": -0.7484849095344543,
      "1": -0.025304628536105156,
      "2": 0.6626688838005066
    },
    "rectifiedPos": {
      "0": -0.745425283908844,
      "1": -0.022744284942746162,
      "2": 0.6662010550498962
    }
  },
  {
    "name": "Ouagadougou",
    "country": "Burkina Faso",
    "pop": 992228.5,
    "name_ascii": "Ouagadougou",
    "lat": 12.37031598,
    "lng": -1.524723756,
    "pos": {
      "0": -0.025990555062890053,
      "1": 0.2142293006181717,
      "2": 0.9764375686645508
    },
    "rectifiedPos": {
      "0": -0.023975364863872528,
      "1": 0.21171948313713074,
      "2": 0.9770363569259644
    }
  },
  {
    "name": "Phnom Penh",
    "country": "Cambodia",
    "pop": 1466000,
    "name_ascii": "Phnom Penh",
    "lat": 11.55003013,
    "lng": 104.9166345,
    "pos": {
      "0": 0.9467340111732483,
      "1": 0.20022352039813995,
      "2": -0.25220078229904175
    },
    "rectifiedPos": {
      "0": 0.9496471285820007,
      "1": 0.19245241582393646,
      "2": -0.24724969267845154
    }
  },
  {
    "name": "Douala",
    "country": "Cameroon",
    "pop": 1622041,
    "name_ascii": "Douala",
    "lat": 4.060409769,
    "lng": 9.709991006,
    "pos": {
      "0": 0.16823790967464447,
      "1": 0.07080821692943573,
      "2": 0.983199954032898
    },
    "rectifiedPos": {
      "0": 0.16846734285354614,
      "1": 0.07554849982261658,
      "2": 0.9828078150749207
    }
  },
  {
    "name": "Calgary",
    "country": "Canada",
    "pop": 1012661,
    "name_ascii": "Calgary",
    "lat": 51.08299176,
    "lng": -114.0799982,
    "pos": {
      "0": -0.5735265016555786,
      "1": 0.7780566811561584,
      "2": -0.2563105523586273
    },
    "rectifiedPos": {
      "0": -0.5785431265830994,
      "1": 0.7721567153930664,
      "2": -0.2627961039543152
    }
  },
  {
    "name": "Ottawa",
    "country": "Canada",
    "pop": 978564.5,
    "name_ascii": "Ottawa",
    "lat": 45.4166968,
    "lng": -75.7000153,
    "pos": {
      "0": -0.6801962852478027,
      "1": 0.7122306227684021,
      "2": 0.17337967455387115
    },
    "rectifiedPos": {
      "0": -0.6842312812805176,
      "1": 0.7060193419456482,
      "2": 0.18265876173973083
    }
  },
  {
    "name": "Yangquan",
    "country": "China",
    "pop": 851801.5,
    "name_ascii": "Yangquan",
    "lat": 37.86997398,
    "lng": 113.5700081,
    "pos": {
      "0": 0.7235474586486816,
      "1": 0.6138715744018555,
      "2": -0.31565919518470764
    },
    "rectifiedPos": {
      "0": 0.720908522605896,
      "1": 0.6177052855491638,
      "2": -0.3142150938510895
    }
  },
  {
    "name": "Hechi",
    "country": "China",
    "pop": 3275189.5,
    "name_ascii": "Hechi",
    "lat": 23.09653465,
    "lng": 109.6091129,
    "pos": {
      "0": 0.8664979338645935,
      "1": 0.3922814726829529,
      "2": -0.3087013363838196
    },
    "rectifiedPos": {
      "0": 0.8629636764526367,
      "1": 0.39867129921913147,
      "2": -0.31041088700294495
    }
  },
  {
    "name": "Mudangiang",
    "country": "China",
    "pop": 954957.5,
    "name_ascii": "Mudangiang",
    "lat": 44.57501691,
    "lng": 129.5900122,
    "pos": {
      "0": 0.5489404797554016,
      "1": 0.7018424868583679,
      "2": -0.45396190881729126
    },
    "rectifiedPos": {
      "0": 0.5419451594352722,
      "1": 0.7060193419456482,
      "2": -0.4558861255645752
    }
  },
  {
    "name": "Urumqi",
    "country": "China",
    "pop": 1829612.5,
    "name_ascii": "Urumqi",
    "lat": 43.80501223,
    "lng": 87.57500565,
    "pos": {
      "0": 0.7210533618927002,
      "1": 0.6922063231468201,
      "2": 0.030536197125911713
    },
    "rectifiedPos": {
      "0": 0.7216222286224365,
      "1": 0.6919511556625366,
      "2": 0.021562781184911728
    }
  },
  {
    "name": "Barranquilla",
    "country": "Colombia",
    "pop": 1521245.5,
    "name_ascii": "Barranquilla",
    "lat": 10.95998863,
    "lng": -74.79996688,
    "pos": {
      "0": -0.9474146366119385,
      "1": 0.19012345373630524,
      "2": 0.25740745663642883
    },
    "rectifiedPos": {
      "0": -0.9452740550041199,
      "1": 0.19245241582393646,
      "2": 0.2634749412536621
    }
  },
  {
    "name": "Lubumbashi",
    "country": "Congo (Kinshasa)",
    "pop": 1114317,
    "name_ascii": "Lubumbashi",
    "lat": -11.6800248,
    "lng": 27.48001745,
    "pos": {
      "0": 0.4518844187259674,
      "1": -0.2024458944797516,
      "2": 0.8688015341758728
    },
    "rectifiedPos": {
      "0": 0.4595469534397125,
      "1": -0.1984805315732956,
      "2": 0.8656916618347168
    }
  },
  {
    "name": "Havana",
    "country": "Cuba",
    "pop": 2082458.5,
    "name_ascii": "Havana",
    "lat": 23.13195884,
    "lng": -82.36418217,
    "pos": {
      "0": -0.9114481210708618,
      "1": 0.3928501307964325,
      "2": 0.1221931129693985
    },
    "rectifiedPos": {
      "0": -0.9142757058143616,
      "1": 0.3805530369281769,
      "2": 0.13884982466697693
    }
  },
  {
    "name": "Quito",
    "country": "Ecuador",
    "pop": 1550407,
    "name_ascii": "Quito",
    "lat": -0.214988181,
    "lng": -78.50005111,
    "pos": {
      "0": -0.9799180030822754,
      "1": -0.003752242773771286,
      "2": 0.19936566054821014
    },
    "rectifiedPos": {
      "0": -0.9804407358169556,
      "1": -0.0030730124562978745,
      "2": 0.19679047167301178
    }
  },
  {
    "name": "El Giza",
    "country": "Egypt",
    "pop": 2681863,
    "name_ascii": "El Giza",
    "lat": 30.00998863,
    "lng": 31.19002356,
    "pos": {
      "0": 0.4484504163265228,
      "1": 0.5001509785652161,
      "2": 0.740770697593689
    },
    "rectifiedPos": {
      "0": 0.4474719762802124,
      "1": 0.503899872303009,
      "2": 0.7388191819190979
    }
  },
  {
    "name": "Addis Ababa",
    "country": "Ethiopia",
    "pop": 2928864.5,
    "name_ascii": "Addis Ababa",
    "lat": 9.033310363,
    "lng": 38.70000443,
    "pos": {
      "0": 0.6174879670143127,
      "1": 0.15700866281986237,
      "2": 0.770750880241394
    },
    "rectifiedPos": {
      "0": 0.6193100810050964,
      "1": 0.15370222926139832,
      "2": 0.7699549794197083
    }
  },
  {
    "name": "Helsinki",
    "country": "Finland",
    "pop": 836728.5,
    "name_ascii": "Helsinki",
    "lat": 60.17556337,
    "lng": 24.93412634,
    "pos": {
      "0": 0.20966829359531403,
      "1": 0.8675534129142761,
      "2": 0.45098811388015747
    },
    "rectifiedPos": {
      "0": 0.204918771982193,
      "1": 0.8720074892044067,
      "2": 0.4445348381996155
    }
  },
  {
    "name": "Guatemala",
    "country": "Guatemala",
    "pop": 1009469,
    "name_ascii": "Guatemala",
    "lat": 14.62113466,
    "lng": -90.52696558,
    "pos": {
      "0": -0.967575192451477,
      "1": 0.25242629647254944,
      "2": -0.008899315260350704
    },
    "rectifiedPos": {
      "0": -0.9682163000106812,
      "1": 0.2500004768371582,
      "2": -0.0075471168383955956
    }
  },
  {
    "name": "Conakry",
    "country": "Guinea",
    "pop": 1494000,
    "name_ascii": "Conakry",
    "lat": 9.531522846,
    "lng": -13.68023503,
    "pos": {
      "0": -0.23323798179626465,
      "1": 0.16559021174907684,
      "2": 0.9582170844078064
    },
    "rectifiedPos": {
      "0": -0.2227129489183426,
      "1": 0.17311085760593414,
      "2": 0.9593912363052368
    }
  },
  {
    "name": "Kalyan",
    "country": "India",
    "pop": 1576614,
    "name_ascii": "Kalyan",
    "lat": 19.25023195,
    "lng": 73.16017493,
    "pos": {
      "0": 0.9036036729812622,
      "1": 0.3296944797039032,
      "2": 0.2734994888305664
    },
    "rectifiedPos": {
      "0": 0.9073962569236755,
      "1": 0.3253427743911743,
      "2": 0.26605287194252014
    }
  },
  {
    "name": "Cilacap",
    "country": "Indonesia",
    "pop": 1174964,
    "name_ascii": "Cilacap",
    "lat": -7.718819561,
    "lng": 109.0154024,
    "pos": {
      "0": 0.9368646144866943,
      "1": -0.13431167602539062,
      "2": -0.32287007570266724
    },
    "rectifiedPos": {
      "0": 0.9370313882827759,
      "1": -0.120817631483078,
      "2": -0.32768160104751587
    }
  },
  {
    "name": "Shiraz",
    "country": "Iran",
    "pop": 1240000,
    "name_ascii": "Shiraz",
    "lat": 29.62996014,
    "lng": 52.57001054,
    "pos": {
      "0": 0.6902577877044678,
      "1": 0.494396448135376,
      "2": 0.5283146500587463
    },
    "rectifiedPos": {
      "0": 0.6888079047203064,
      "1": 0.4868102967739105,
      "2": 0.5371772646903992
    }
  },
  {
    "name": "Dublin",
    "country": "Ireland",
    "pop": 1013988,
    "name_ascii": "Dublin",
    "lat": 53.33306114,
    "lng": -6.248905682,
    "pos": {
      "0": -0.06499986350536346,
      "1": 0.8021203279495239,
      "2": 0.5936143398284912
    },
    "rectifiedPos": {
      "0": -0.07129775732755661,
      "1": 0.7965548634529114,
      "2": 0.6003473997116089
    }
  },
  {
    "name": "Kawasaki",
    "country": "Japan",
    "pop": 1372025.5,
    "name_ascii": "Kawasaki",
    "lat": 35.52998761,
    "lng": 139.705002,
    "pos": {
      "0": 0.5263107419013977,
      "1": 0.5811289548873901,
      "2": -0.6207141876220703
    },
    "rectifiedPos": {
      "0": 0.523774266242981,
      "1": 0.5862925052642822,
      "2": -0.6179980635643005
    }
  },
  {
    "name": "Mombasa",
    "country": "Kenya",
    "pop": 840834,
    "name_ascii": "Mombasa",
    "lat": -4.040026022,
    "lng": 39.68991817,
    "pos": {
      "0": 0.6370454430580139,
      "1": -0.07045333832502365,
      "2": 0.7675997614860535
    },
    "rectifiedPos": {
      "0": 0.6298621892929077,
      "1": -0.08167560398578644,
      "2": 0.7724006175994873
    }
  },
  {
    "name": "Antananarivo",
    "country": "Madagascar",
    "pop": 1544216.5,
    "name_ascii": "Antananarivo",
    "lat": -18.91663735,
    "lng": 47.5166239,
    "pos": {
      "0": 0.6976433396339417,
      "1": -0.3241921365261078,
      "2": 0.6389000415802002
    },
    "rectifiedPos": {
      "0": 0.7006261348724365,
      "1": -0.3311493992805481,
      "2": 0.6320309042930603
    }
  },
  {
    "name": "Ciudad Juárez",
    "country": "Mexico",
    "pop": 1343000,
    "name_ascii": "Ciudad Juarez",
    "lat": 31.69037701,
    "lng": -106.4900481,
    "pos": {
      "0": -0.8159010410308838,
      "1": 0.5253287553787231,
      "2": -0.2415267527103424
    },
    "rectifiedPos": {
      "0": -0.8200765252113342,
      "1": 0.5207943320274353,
      "2": -0.23716600239276886
    }
  },
  {
    "name": "Guadalajara",
    "country": "Mexico",
    "pop": 2919294.5,
    "name_ascii": "Guadalajara",
    "lat": 20.67001609,
    "lng": -103.3300342,
    "pos": {
      "0": -0.9104213118553162,
      "1": 0.3529852628707886,
      "2": -0.21571844816207886
    },
    "rectifiedPos": {
      "0": -0.9140204787254333,
      "1": 0.34388166666030884,
      "2": -0.21520212292671204
    }
  },
  {
    "name": "Maputo",
    "country": "Mozambique",
    "pop": 1318806.5,
    "name_ascii": "Maputo",
    "lat": -25.95527749,
    "lng": 32.58916296,
    "pos": {
      "0": 0.484284907579422,
      "1": -0.43766945600509644,
      "2": 0.7575708627700806
    },
    "rectifiedPos": {
      "0": 0.47486475110054016,
      "1": -0.4399673640727997,
      "2": 0.7621890902519226
    }
  },
  {
    "name": "Quezon City",
    "country": "Philippines",
    "pop": 2761720,
    "name_ascii": "Quezon City",
    "lat": 14.6504352,
    "lng": 121.0299662,
    "pos": {
      "0": 0.8290374279022217,
      "1": 0.25292110443115234,
      "2": -0.4987262487411499
    },
    "rectifiedPos": {
      "0": 0.827991783618927,
      "1": 0.2500004768371582,
      "2": -0.5019256472587585
    }
  },
  {
    "name": "Chelyabinsk",
    "country": "Russia",
    "pop": 1018802,
    "name_ascii": "Chelyabinsk",
    "lat": 55.15499127,
    "lng": 61.43866817,
    "pos": {
      "0": 0.5018274784088135,
      "1": 0.8207006454467773,
      "2": 0.2731660306453705
    },
    "rectifiedPos": {
      "0": 0.5049086213111877,
      "1": 0.8197198510169983,
      "2": 0.2704194486141205
    }
  },
  {
    "name": "Novosibirsk",
    "country": "Russia",
    "pop": 1213100.5,
    "name_ascii": "Novosibirsk",
    "lat": 55.02996014,
    "lng": 82.96004187,
    "pos": {
      "0": 0.5688270330429077,
      "1": 0.8194518685340881,
      "2": 0.0702458918094635
    },
    "rectifiedPos": {
      "0": 0.56903076171875,
      "1": 0.8197198510169983,
      "2": 0.06529466062784195
    }
  },
  {
    "name": "Jeddah",
    "country": "Saudi Arabia",
    "pop": 2939723,
    "name_ascii": "Jeddah",
    "lat": 21.51688946,
    "lng": 39.21919755,
    "pos": {
      "0": 0.5882244110107422,
      "1": 0.3667754828929901,
      "2": 0.7207411527633667
    },
    "rectifiedPos": {
      "0": 0.5977204442024231,
      "1": 0.3622874915599823,
      "2": 0.7151769399642944
    }
  },
  {
    "name": "Cape Town",
    "country": "South Africa",
    "pop": 2823929,
    "name_ascii": "Cape Town",
    "lat": -33.92001097,
    "lng": 18.43498816,
    "pos": {
      "0": 0.26241186261177063,
      "1": -0.5580349564552307,
      "2": 0.7872337698936462
    },
    "rectifiedPos": {
      "0": 0.2788822054862976,
      "1": -0.5590805411338806,
      "2": 0.7808032035827637
    }
  },
  {
    "name": "Kharkiv",
    "country": "Ukraine",
    "pop": 1338063.5,
    "name_ascii": "Kharkiv",
    "lat": 49.99998293,
    "lng": 36.25002478,
    "pos": {
      "0": 0.38008686900138855,
      "1": 0.7660442590713501,
      "2": 0.5183725953102112
    },
    "rectifiedPos": {
      "0": 0.3753444254398346,
      "1": 0.7721567153930664,
      "2": 0.5127285122871399
    }
  },
  {
    "name": "Oakland",
    "country": "United States",
    "pop": 953044,
    "name_ascii": "Oakland",
    "lat": 37.76892071,
    "lng": -122.2211034,
    "pos": {
      "0": -0.6687498092651367,
      "1": 0.6124783754348755,
      "2": -0.4214783012866974
    },
    "rectifiedPos": {
      "0": -0.6616089344024658,
      "1": 0.6177052855491638,
      "2": -0.42510443925857544
    }
  },
  {
    "name": "Kansas City",
    "country": "United States",
    "pop": 955272.5,
    "name_ascii": "Kansas City",
    "lat": 39.10708851,
    "lng": -94.60409422,
    "pos": {
      "0": -0.7734644412994385,
      "1": 0.630771815776825,
      "2": -0.0622870996594429
    },
    "rectifiedPos": {
      "0": -0.7720546722412109,
      "1": 0.6330559849739075,
      "2": -0.05631769448518753
    }
  }
]
