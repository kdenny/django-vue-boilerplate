"use strict";

var Site = Site || {};
Site = {
    globeData: null,
    globeKitView: null,
    globeKitContainer: null,

    introDone: false,
    camPower: 0.0,
    camZ: 42.0,

    init: function() {
        Site.globeKitContainer = document.getElementById("globekit-canvas-container")

        Site.globeKitView = new GK.View({
            canvas: document.getElementById("globekit-canvas"),
            textureDir: "static/textures",
            modelsDir: "static/bin",
            sceneOffset: vec2.fromValues(0.33, 0.0),
            clearColor: vec4.fromValues(249.0/255.0, 249.0/255.0, 249.0/255.0, 1.0),
            antialias: false,
            alpha: false,
            onload: function(){
                Site.playIntroAnimation();
            }
        });

        Site.globeData = new GlobeData(Site.globeKitView);
        //Site.globeData.load();
        GlobeData.processData();

        Site.windowDidResize();
        Site.addEventListeners();
        Site.configureDrawables();
    },

    /*
    rectifyPoints: function() {
        var globe = Site.globeKitView.scene.globe;

        for (var i=0; i<GlobeDataCities.length; i++) {
            var city = GlobeDataCities[i];
            var latLng = new GK.LatLng(city.lat, city.lng);
            var pos = GK.LatLng.toWorld(latLng);

            var distances = [];
            var vertexCount = globe.model.vertices.length / 7;
            for (var j=0; j<vertexCount; j++) {
                var idx = j * 7;

                var otherPos = vec3.create();
                otherPos[0] = globe.model.vertices[idx+0];
                otherPos[1] = globe.model.vertices[idx+1];
                otherPos[2] = globe.model.vertices[idx+2];

                var dist = vec3.dist(pos, otherPos);
                distances.push({dist: dist, pos: otherPos});
            }

            distances.sort(function(a, b) {
                return a.dist - b.dist;
            });

            city.pos = pos;
            city.rectifiedPos = distances[0].pos;
        }
    },
    */

    addCities: function() {
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

        Site.globeKitView.addPoints(cityPoints);
    },

    addEventListeners: function() {
        window.addEventListener("resize", GK.debounce(function() {
            Site.windowDidResize();
        }, 75));

        window.addEventListener("orientationchange", function() {
            Site.windowDidResize();
        });

        window.addEventListener("mousemove", function(e){
            if (!Site.introDone) return;

            var globeX = Site.globeKitView.canvas.width * 0.5 + (Site.globeKitView.canvas.width * 0.165);
            var globeY = Site.globeKitView.canvas.height * 0.5;

            var m = vec2.fromValues(e.clientX, e.clientY);
            var g = vec2.fromValues(globeX, globeY);
            var d = 1.0 - (vec2.distance(m, g) / Site.globeKitView.canvas.width);

            d = GK.Ease.smoothstep(0.5, 1.0, d);
            Site.globeKitView.scene.camTargetZ = Site.camZ - (3.0 * d * Site.camPower);
        });
    },

    windowDidResize: function() {
        var width = Site.globeKitContainer.offsetWidth;
        var height = Site.globeKitContainer.offsetHeight;

        Site.globeKitView.canvas.width = width;
        Site.globeKitView.canvas.height = height;
        Site.globeKitView.resize();

        Site.globeKitView.scene.globe.pointSize = Site.getGlobePointSize();

        if (window.innerWidth < 768) {
            Site.globeKitView.scene.camera.sceneOffset = vec2.fromValues(0.0, 0.25);
            Site.globeKitView.scene.camTargetZ = 62.0;
            Site.camZ = 62.0;
        } else {
            Site.globeKitView.scene.camera.sceneOffset = vec2.fromValues(0.33, 0.0);
            Site.globeKitView.scene.camTargetZ = 42.0;
            Site.camZ = 42.0;
        }
    },

    getGlobePointSize: function() {
        return Site.globeKitView.canvas.height * 0.00185;
    },

    configureDrawables: function() {
        var scene = Site.globeKitView.scene;

        // Set camera Z
        scene.camera.position = vec3.fromValues(0.0, 0.0, Site.camZ);

        // Colors
        var white = vec3.fromValues(1,1,1);
        var dark = vec3.fromValues(100/255, 100/255, 100/255);
        var gray = vec3.fromValues(200/255, 200/255, 200/255);
        var darkBlue = vec3.fromValues(135/255, 140/255, 157/255);
        var brightBlue = vec3.fromValues(18/255, 53/255, 144/255);

        // Hide everything before intro
        scene.globe.alpha = 0.0;
        scene.globe.noisePower = 12.0;
        scene.points.alpha = 0.0;
        scene.quad.alpha = 0.0;
        scene.dimension.alpha = 0.0;
        scene.publisherEvent.progress = 0.0;

        // Color configuration
        scene.globe.pointSize = Site.getGlobePointSize();
        scene.globe.color1 = gray;
        scene.globe.color2 = gray;
        scene.globe.crestColor = dark;
        scene.globe.takeoverColor = brightBlue;
        scene.globe.scatterColor = dark;

        // Location dots
        scene.points.color1 = dark;
        scene.points.pointSize = 64.0;

        scene.epicenter.color1 = dark;
        scene.epicenter.color2 = dark;
    },

    playIntroAnimation: function(){
        var scene = Site.globeKitView.scene;
        scene.setYawPitch(1.5, -0.6);
        scene.globe.offsetPower = 1.0;

        var offsetStart = scene.globe.offsetPower;
        var offsetEnd = 0.0;
        var offsetDelta = offsetEnd - offsetStart;

        var pointSizeStart = scene.globe.pointSize * 1.2;
        var pointSizeEnd = scene.globe.pointSize;
        var pointSizeDelta = pointSizeEnd - pointSizeStart;

        var camZStart = Site.camZ * 0.75;
        var camZEnd = Site.camZ;
        var camZDelta = camZEnd - camZStart;

        var noisePowerStart = scene.globe.noisePower;
        var noisePowerEnd = 2.0;
        var noisePowerDelta = noisePowerEnd - noisePowerStart;

        scene.yawSpeed = 0.03;
        scene.pitchSpeed = -0.0004;

        var pulsed = false;
        var eventsStarted = false
        var introAnim = new GK.Animation(4.2);
        introAnim.updateFn = function(value) {
            var easedValue = GK.Ease.inOutQuad(value);
            var alphaValue = GK.Ease.smoothstep(0.0, 0.3, value);

            // Animate rotation speed down
            scene.yawSpeed = -(0.03 - (0.03 * GK.Ease.outSine(value)));
            scene.pitchSpeed = -(0.0004 - (0.0004 * GK.Ease.outSine(value)));

            // Animate particles
            var ps = GK.Ease.smoothstep(0.56, 1.0, easedValue);
            var op = GK.Ease.smoothstep(0.56, 1.0, easedValue);
            scene.globe.offsetPower = offsetStart + (op * offsetDelta);
            scene.globe.pointSize = pointSizeStart + (ps * pointSizeDelta);
            scene.globe.alpha = alphaValue;

            var n = GK.Ease.smoothstep(0.75, 1.0, easedValue);
            scene.globe.noisePower = noisePowerStart + (n * noisePowerDelta);

            // Animate camera
            var z = GK.Ease.smoothstep(0.6, 1.0, easedValue);
            Site.camZ = camZStart + (z * camZDelta);
            Site.globeKitView.scene.camera.position = vec3.fromValues(0.0, 0.0, Site.camZ);

            // Fade in background elements
            var fv = GK.Ease.smoothstep(0.7, 0.9, value);
            scene.dimension.alpha = fv;
            scene.quad.alpha = fv;
            scene.points.alpha = fv;

            // Start data events
            if (value > 0.1 && !pulsed) {
                Site.globeKitView.pulse(0.4, 0.25, 0.0, 4.0);
                pulsed = true;
            }

            if (value > 0.8 && !eventsStarted) {
                Site.globeData.start();
                eventsStarted = true;
            }
        };

        introAnim.completeFn = function() {
            Site.introDone = true;
            introAnim = null;

            var crestColor = vec3.fromValues(157/255, 166/255, 196/255);
            scene.globe.crestColor = crestColor;

            var a = new GK.Animation(2.0);
            a.updateFn = function(value) {
                Site.camPower = value;
            }
            a.start();
        };

        introAnim.start();
    },

    destroy: function() {
        var attachedElements = Site.globeKitView.attachedElements;
        for (var j=0; j<attachedElements.length; j++) {
            var attachedElement = attachedElements[j];
            attachedElement.parentNode.removeChild(attachedElement);
        }

        clearTimeout(Site.unfocusTimeout);
        Site.globeKitView.destroy();
        delete Site.globeKitView;
    }
};
