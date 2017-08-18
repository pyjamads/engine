pc.extend(pc, function() {
    'use strict';

    var SceneHandler = function(app) {
        this._app = app;
    };

    SceneHandler.prototype = {
        load: function(url, callback) {
            console.log("requesting: " + url);
            pc.Application.getApplication().customLoader.assets.get(url, "text").then(function(response) {
                var result = JSON.parse(response);
                callback(null, result);
            }).catch(function(err) {
                callback("Error requesting scene: " + url);
            });
        },

        open: function(url, data) {
            // prevent script initialization until entire scene is open
            this._app.systems.script.preloading = true;

            var parser = new pc.SceneParser(this._app);
            var parent = parser.parse(data);

            // set scene root
            var scene = this._app.scene;
            scene.root = parent;

            this._app.applySceneSettings(data.settings);

            // re-enable script initialization
            this._app.systems.script.preloading = false;

            return scene;
        },

        patch: function(asset, assets) {}
    };

    return {
        SceneHandler: SceneHandler
    };
}());