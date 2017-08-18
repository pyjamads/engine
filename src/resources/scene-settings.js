pc.extend(pc, function() {
    'use strict';

    var SceneSettingsHandler = function(app) {
        this._app = app;
    };

    SceneSettingsHandler.prototype = {
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
            return data.settings;
        }
    };

    return {
        SceneSettingsHandler: SceneSettingsHandler
    };
}());