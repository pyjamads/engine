pc.extend(pc, function() {
    'use strict';

    var ShaderHandler = function() {};

    ShaderHandler.prototype = {
        load: function(url, callback) {
            var actual = url.split("?")[0];
            console.log("requesting: " + actual);
            pc.Application.getApplication().customLoader.assets.get(actual, "text").then(function(response) {
                callback(null, response);
            }).catch(function(err) {
                callback(pc.string.format("Error loading shader resource: {0} [{1}]", url, err));
            });
        },

        open: function(url, data) {
            return data;
        },

        patch: function(asset, assets) {}
    };

    return {
        ShaderHandler: ShaderHandler
    };
}());