pc.extend(pc.fw, function () {
    /**
     * @name pc.fw.Application
     * @class Default application which performs general setup code and initiates the main game loop
     * <pre class="code" lang="javascript">
     * // Create application
     * var app = new pc.fw.Application(canvas, options);
     * // Start game loop
     * app.start()
     * </pre>
     * 
     * To create custom applications derive a new Application class and override the update and render methods
     * 
     * <pre class="code" lang="javascript">
     * var MyApplication = function () {
     * };
     * MyApplication = MyApplication.extendsFrom(pc.fw.Application);
     * 
     * MyApplication.prototype.update = function () {
     *   // custom update code
     * }
     * 
     * MyApplication.prototype.render = function () {
     *   // custom render code
     * }
     * 
     * var app = new MyApplication(canvas, options);
     * app.start();
     * </pre>
     * @constructor Create a new Application
     * @param {DOMElement} canvas The canvas element
     * @param {Object} options
     * @param {String} options.dataDir Path to the directory where data is.
     * @param {Object} [options.config] Configuration options for the application
     * @param {pc.common.DepotApi} [options.depot] API interface to the current depot
     * @param {pc.input.Controller} [options.controller] Generic input controller, available from the ApplicationContext as controller.
     * @param {pc.input.Keyboard} [options.keyboard] Keyboard handler for input, available from the ApplicationContext as keyboard.
     * @param {pc.input.Mouse} [options.mouse] Mouse handler for input, available from the ApplicationContext as mouse.
     */
    var Application = function (canvas, options) {
        this.canvas = canvas;

        this._link = new pc.fw.LiveLink(window);
        this._link.listen(pc.callback(this, this._handleMessage));
        
        // Open the log
        Log.open();

        // Create the graphics device
        this.graphicsDevice = new pc.gfx.Device(canvas);

        // Activate the graphics device
        pc.gfx.Device.setCurrent(this.graphicsDevice);        

        pc.gfx.post.initialize();

        // Enable validation of each WebGL command
        this.graphicsDevice.enableValidation(false);            

        var registry = new pc.fw.ComponentSystemRegistry();
        
        scriptPrefix = (options.config && options.config['script_prefix']) ? options.config['script_prefix'] : "";
        //pc.string.format("{0}/code/{1}/{2}", options.api.url, options.api.username, options.api.project);

		// Create resource loader
		var loader = new pc.resources.ResourceLoader();
        loader.registerHandler(pc.resources.ImageRequest, new pc.resources.ImageResourceHandler());
        loader.registerHandler(pc.resources.ModelRequest, new pc.resources.ModelResourceHandler());
        loader.registerHandler(pc.resources.AnimationRequest, new pc.resources.AnimationResourceHandler());
        loader.registerHandler(pc.resources.EntityRequest, new pc.resources.EntityResourceHandler(registry, options.depot));
        loader.registerHandler(pc.resources.AssetRequest, new pc.resources.AssetResourceHandler(options.depot));

		// The ApplicationContext is passed to new Components and user scripts
        this.context = new pc.fw.ApplicationContext(loader, new pc.scene.Scene(), registry, options.controller, options.keyboard, options.mouse);
    
        // Register the ScriptResourceHandler late as we need the context        
        loader.registerHandler(pc.resources.ScriptRequest, new pc.resources.ScriptResourceHandler(this.context, scriptPrefix));
        
        // Create systems
        var animationsys = new pc.fw.AnimationComponentSystem(this.context);
        var bloomsys = new pc.fw.BloomComponentSystem(this.context);
        var headersys = new pc.fw.HeaderComponentSystem(this.context);
        var modelsys = new pc.fw.ModelComponentSystem(this.context);
        var camerasys = new pc.fw.CameraComponentSystem(this.context);
        var cubemapsys = new pc.fw.CubeMapComponentSystem(this.context);
        var staticcubemapsys = new pc.fw.StaticCubeMapComponentSystem(this.context);
        var dlightsys = new pc.fw.DirectionalLightComponentSystem(this.context);
        var plightsys = new pc.fw.PointLightComponentSystem(this.context);
        var primitivesys = new pc.fw.PrimitiveComponentSystem(this.context);
        var packsys = new pc.fw.PackComponentSystem(this.context);
        var skyboxsys = new pc.fw.SkyboxComponentSystem(this.context);
        var scriptsys = new pc.fw.ScriptComponentSystem(this.context);        
        var simplebodysys = new pc.fw.SimpleBodyComponentSystem(this.context);
        var picksys = new pc.fw.PickComponentSystem(this.context);
        var audiosourcesys = new pc.fw.AudioSourceComponentSystem(this.context);
        var audiolistenersys = new pc.fw.AudioListenerComponentSystem(this.context);
        
        skyboxsys.setDataDir(options.dataDir);
        staticcubemapsys.setDataDir(options.dataDir);
        
        // Add event support
        pc.extend(this, pc.events);
        
        this.init();        
    };
    
    /**
     * @function
     * @name pc.fw.Application#start
     * @description Start the Application updating
     */
    Application.prototype.start = function (entity) {
        if(entity) {
            this.context.root.addChild(entity);
        }
        this.context.root.syncHierarchy();
        this.tick();
    };
    
    Application.prototype.init = function () {
    };
    
    /**
     * @function
     * @name pc.fw.Application#update
     * @description Application specific update method. Override this if you have a custom Application
     * @param {Number} dt The time delta since the last frame.
     */
    Application.prototype.update = function (dt) {
        var inTools = !!window.pc.apps.designer;
        var context = this.context;

        // Perform ComponentSystem update
        pc.fw.ComponentSystem.update(dt, context, inTools);

        // fire update event
        this.fire("update", dt);

        if (context.controller) {
            context.controller.update(dt);
        }
        if (context.keyboard) {
            context.keyboard.update(dt);
        }
    };

    /** 
     * @function
     * @name pc.fw.Application#render
     * @description Application specific render method. Override this if you have a custom Application
     */
    Application.prototype.render = function () {
        var inTools = !!window.pc.apps.designer;
        var context = this.context;
        
        context.root.syncHierarchy();

        pc.gfx.Device.setCurrent(this.graphicsDevice);
        if(context.systems.camera._camera) {
            context.systems.camera.frameBegin();

            pc.fw.ComponentSystem.render(context, inTools);
            context.scene.dispatch(context.systems.camera._camera);
            context.scene.flush();

            context.systems.camera.frameEnd();            
        }
    };

    /** 
     * @function
     * @name pc.fw.Application#tick
     * @description Application specific tick method that calls update and render and queues
     * the next tick. Override this if you have a custom Application.
     */
    Application.prototype.tick = function () {
        var dt = 1.0 / 60.0;

    	this.update(dt);
    	this.render();

        // Submit a request to queue up a new animation frame immediately
        requestAnimFrame(this.tick.bind(this), this.canvas);
    };

    /**
     * @function
     * @name pc.fw.Application#_handleMessage
     * @description Called when the LiveLink object receives a new message
     * @param {pc.fw.LiveLiveMessage} msg The received message
     */
    Application.prototype._handleMessage = function (msg) {
        switch(msg.type) {
            case pc.fw.LiveLinkMessageType.UPDATE_COMPONENT:
                this._updateComponent(msg.content.id, msg.content.component, msg.content.attribute, msg.content.value);
                break;
            case pc.fw.LiveLinkMessageType.UPDATE_ENTITY:
                this._updateEntity(msg.content.id, msg.content.components);
                break;
            case pc.fw.LiveLinkMessageType.UPDATE_ENTITY_ATTRIBUTE:
                this._updateEntityAttribute(msg.content.id, msg.content.accessor, msg.content.value);
                break;
            case pc.fw.LiveLinkMessageType.CLOSE_ENTITY:
                //this.context.loaders.entity.close(msg.content.id, this.context.root, this.context.systems);
                var entity = this.context.root.findOne("getGuid", guid);
                if(entity) {
                    entity.close(this.context.systems);
                }
                break;
            case pc.fw.LiveLinkMessageType.OPEN_ENTITY:
                var entities = {};
                msg.content.models.forEach(function (model) {
                    var entity = this.context.loader.open(pc.resources.EntityRequest, model);
                    entities[entity.getGuid()] = entity;
                    
                }, this);
                
                
                // create a temporary handler to patch children
                var handler = new pc.resources.EntityResourceHandler();
                for (guid in entities) {
                    if (entities.hasOwnProperty(guid)) {
                        handler.patchChildren(entities[guid], entities);
                        // Added top level entity to the root
                        if(!entities[guid].getParent()) {
                            this.context.root.addChild(entities[guid]);
                        }
                    }
                }
                
                break;
        }
    };

/**
     * @function
     * @name pc.fw.Application#_updateComponent
     * @description Update a value on a component, 
     * @param {String} guid GUID for the entity
     * @param {String} componentName name of the component to update
     * @param {String} attributeName name of the attribute on the component
     * @param {Object} value - value to set attribute to
     */
    Application.prototype._updateComponent = function(guid, componentName, attributeName, value) {
        var entity = this.context.root.findOne("getGuid", guid);
        var system;
            
        if (entity) {
            if(componentName) {
                system = this.context.systems[componentName];
                if(system) {
                    system.set(entity, attributeName, value);
                } else {
                    logWARNING(pc.string.format("No component system called '{0}' exists", componentName))
                }
            } else {
                // set value on node
                entity[attributeName] = value;
            }
        }
    };
    
    Application.prototype._updateEntityAttribute = function (guid, accessor, value) {
        var entity = this.context.root.findOne("getGuid", guid);
        
        if(entity) {
            if(pc.type(entity[accessor]) != "function") {
                logWARNING(pc.string.format("{0} is not an accessor function", accessor));
            }
            
            if(pc.string.startsWith(accessor, "reparent")) {
                entity[accessor](value, this.context);                
            } else {
                entity[accessor](value);                
            }
        }
    };
    
    /**
     * @function
     * @name pc.fw.Application#_updateEntity
     * @description Update an Entity from a set of components, deletes components that are no longer there, adds components that are new.
     * Note this does not update the data inside the components, just whether or not a component is present.
     * @param {Object} guid GUID of the entity
     * @param {Object} components Component object keyed by component name.
     */
    Application.prototype._updateEntity = function (guid, components) {
        var type;
        var entity = this.context.root.findOne("getGuid", guid);
        
        if(entity) {
            for(type in components) {
                if(this.context.systems.hasOwnProperty(type)) {
                   if(!this.context.systems[type].hasComponent(entity)) {
                        this.context.systems[type].createComponent(entity);
                    }
                }
            }
            
            for(type in this.context.systems) {
                if(type === "gizmo" || type === "pick") {
                    continue;
                }

                if(this.context.systems.hasOwnProperty(type)) {
                    if(!components.hasOwnProperty(type) && 
                        this.context.systems[type].hasComponent(entity)) {
                        this.context.systems[type].deleteComponent(entity);
                    }
                }
            }
        }
    };
        
    return {
            Application: Application
    };
    
} ());




