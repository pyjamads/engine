pc.extend(pc, function() {
    'use strict';

    var BinaryHandler = function() {

    };

    BinaryHandler.prototype = {
        load: function(url, callback) {
            var actual = url.split("?")[0];
            console.log("requesting: " + actual);
            pc.Application.getApplication().customLoader.assets.get(actual, "blob").then(function(response) {
                var reader = new FileReader();
                reader.readAsArrayBuffer(response);

                var onLoadArrayBuffer = function() {
                    callback(null, reader.result);
                };

                reader.onload = onLoadArrayBuffer;
            }).catch(function(err) {
                callback(pc.string.format("Error loading binary resource: {0} [{1}]", url, err));
            });
        },

        open: function(url, data) {
            return data;
        },

        patch: function(asset, assets) {}
    };

    return {
        BinaryHandler: BinaryHandler
    };
}());