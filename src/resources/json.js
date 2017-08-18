pc.extend(pc, function() {
    'use strict';

    var JsonHandler = function() {

    };

    JsonHandler.prototype = {
        load: function(url, callback) {
            var actual = url.split("?")[0];
            console.log("requesting: " + actual);
            pc.Application.getApplication().customLoader.assets.get(actual, "text").then(function(text) {
                var result = JSON.parse(text);
                callback(null, result);
            }).catch(function(err) {
                callback(pc.string.format("Error loading JSON resource: {0} [{1}]", url, err));
            });
        },

        open: function(url, data) {
            return data;
        },

        patch: function(asset, assets) {}
    };

    return {
        JsonHandler: JsonHandler
    };
}());