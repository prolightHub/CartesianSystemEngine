!(function(window, document, Math)
{
    String.prototype.upper = function() 
    {
        return this.charAt(0).toUpperCase() + this.slice(1);
    };
	String.prototype.lower = function() 
	{
	    return this.charAt(0).toLowerCase() + this.slice(1);
	};

	function noop() {}

	var CartesianSystemEngine = this.CartesianSystemEngine = function(config)
	{
		"use strict";

		/*Scope references*/
		var c = this, C = CartesianSystemEngine;

        C.prototype.Objects = {};
        C.prototype.factory = {};
        c.world = {
            width: 0,
            height: 0,
            bounds: {
                minX: 0,
                maxX: 0,
                minY: 0,
                maxY: 0
            }
        };

		//Lets the entire project know that we have initiated the project.
		c.initiated = init(this, C);

		if(!c.initiated)
		{
			throw ("The engine failed to initiate with error code '" + c.initiated + "'");
		}

		config = config || { 
            grid: {},
            world: {}
        };

        config.grid = config.grid || {};
        config.world = config.world || {};

        C.prototype.setup = function()
        {
        	C.prototype.cameraGrid.setup(config.grid.cols || 1, config.grid.rows || 1, config.grid.cellWidth || 0, config.grid.cellHeight || 0);

            c.world.width = config.world.width || config.grid.cols * config.grid.cellWidth;
            c.world.height = config.world.height || config.grid.rows * config.grid.cellHeight;

            c.world.bounds.maxX = c.world.width;
            c.world.bounds.maxY = c.world.height;
        };

        C.prototype.setup();  
	};

	function init(c, C)
	{
		"use strict";

		C.prototype.createArray = (function()
		{
			function createArray(object, array, arrayName)
			{
				array = array || [];
				array.references = {};
				array.temp = {
					empty: 0
				};
				array.map = {};
				array._name = arrayName || (object.name || "").lower();

				var args, i;
				array.add = function()
				{	
			        i = this.length;

					if(object.apply !== undefined)
			        {
			            //Instatiate
			            var item = Object.create(object.prototype);
			            object.apply(item, arguments);
			            this.push(item);
			        }else{
			            this.push(Array.prototype.slice.call(arguments)[0]);
			        }

			        this.map[i + this.temp.empty] = this[i];

			        var item = this[i];
			        item._id = i + this.temp.empty;
			        item._name = this.temp.name || (object.name || "").lower();
			        item._arrayName = this._name;

			        delete this.temp.name;
			        return item;
				};
				array.addObject = function(name)
				{
					if(this.references[name] !== undefined)
					{
						return;
					}

					this.references[name] = this.length;
					args = Array.prototype.slice.call(arguments);
					this.temp.name = args.shift();
					return this.add.apply(this, args);
				};
				array.getObject = function(name)
				{
					return this[this.references[name]];
				};
				array.removeObject = function(name)
				{
					if(typeof this.references[name] === "number")
			        {
			        	delete this.map[array[this.references[name]]._id];
			        	this.temp.empty++;
			            this.splice(this.references[name], 1);
			            delete this.references[name];
			        }
				};
				array.remove = function(index)
				{
					this.removeFromMap(this[index]._id);
					this.splice(index, 1);
				};
				array.removeFromMap = function(id)
				{
					delete this.map[id];
		        	this.temp.empty++;
				};
				array.getById = function(id)
			    {
			        return this.map[id];
			    };

			    /*Call this after removing items from the array, 
			    like splice or other functions*/
			    array.refresh = function() 
			    {
			    	this.map = {};

			    	var maxId = 0;
			    	for(var i = 0; i < this.length; i++)
			    	{
			    		this.map[this[i]._id] = this[i];

			    		if(maxId < this[i]._id)
			    		{
			    			maxId = this[i]._id;
			    		}
			    	}

			    	this.temp.empty = (maxId - this.length) + 1;
			    };
				array.act = function(name)
				{
					for(var i = 0; i < this.length; i++)
					{
						this[i][name]();
					}
				};

			    return array;
			}

			return createArray;
		}());

		C.prototype.cameraGrid = (function() 
		{
			var cameraGrid = [];

			cameraGrid.setup = function(cols, rows, cellWidth, cellHeight)
		    {
		        this.cellWidth = cellWidth;
		        this.cellHeight = cellHeight;
		        this.halfCellWidth = cellWidth / 2;
		        this.halfCellHeight = cellHeight / 2;

		        this.resize(cols, rows);
		    };
		    cameraGrid.resize = function(cols, rows)
		    {
		    	this.length = 0;

		    	for(var col = 0; col < cols; col++)
		    	{
		    		this.push([]);

		    		for(var row = 0; row < rows; row++)
			    	{
			    		this[col].push({});
			    	}
		    	}

		    	this.cols = cols;
		    	this.rows = rows;

		    	this.maxCol = this.length - 1;
		    	this.maxRow = this[0].length - 1;
		    };
		    cameraGrid.getPlace = function(x, y)
		    {
		    	return {
		            col: Math.max(Math.min(Math.round((x - this.halfCellWidth) / this.cellWidth), this.maxCol), 0),
		            row: Math.max(Math.min(Math.round((y - this.halfCellHeight) / this.cellHeight), this.maxRow), 0)
		        };
		    };

		    cameraGrid.addReference = function(object) 
            {
                var index = object._arrayName + object._id;
                var toSet = {
                    arrayName: object._arrayName,
                    id: object._id
                };

                var upperLeft = this.getPlace(object.body.boundingBox.minX, object.body.boundingBox.minY);
                var lowerRight = this.getPlace(object.body.boundingBox.maxX, object.body.boundingBox.maxY);

                for(var col = upperLeft.col; col <= lowerRight.col; col++)
                {
                    for(var row = upperLeft.row; row <= lowerRight.row; row++)
                    {
                        this[col][row][index] = toSet;
                    }
                }

                object._upperLeft = upperLeft;
                object._lowerRight = lowerRight;
            };
		    cameraGrid.removeReference = function(object) 
            {
                var index = object._arrayName + object._id;

                var upperLeft = object._upperLeft,
                    lowerRight = object._lowerRight;

                for(var col = upperLeft.col; col <= lowerRight.col; col++)
                {
                    for(var row = upperLeft.row; row <= lowerRight.row; row++)
                    {
                        delete this[col][row][index];
                    }
                }
            };

			return cameraGrid;
		}(C.prototype.createArray));

		C.prototype.gameObjects = (function(c) 
		{
			var gameObjects = c.createArray([]);
            
			gameObjects.update = function(cam) 
            {
                var used = {};
                this.used = {};

                var col, row, cell, i, object, index;

                for(var col = cam._upperLeft.col; col <= cam._lowerRight.col; col++)
                {
                    for(var row = cam._upperLeft.row; row <= cam._lowerRight.row; row++)
                    {
                        cell = cse.cameraGrid[col][row];

                        for(i in cell)
                        {
                            if(used[i])
                            {
                                continue;
                            }

                            // Is the same as getObject(name) and then getById(id)
                            object = this[this.references[cell[i].arrayName]].map[cell[i].id];
                            object.update();

                            /* Refreshes the object's cell place after it has been moved */
                            if(object.body.physics.moves)
                            {
                                cse.cameraGrid.removeReference(object);
                                cse.cameraGrid.addReference(object);
                            }

                            // Save info for rendering
                            index = this.references[object._arrayName];
                            this.used[index] = this.used[index] || [];
                            this.used[index].push(object._id);

                            // We've used the object for this loop
                            used[i] = true;
                        }
                    }
                }
            };
			gameObjects.draw = function(cam) 
			{
                var i, j;

                for(i in this.used)
                {
                    for(j = 0; j < this.used[i].length; j++)
                    {
                        this[i].map[this.used[i][j]].draw();
                    }
                }
			};

			return gameObjects;
		}(C.prototype));

        C.prototype.factory.add = (function(c) 
        {
            function add(arrayName, args)
            {
                var place = c.gameObjects.getObject(arrayName);
                var object = place.add.apply(place, args);
                c.cameraGrid.addReference(object);
                return object;
            }

            return add;
        }(C.prototype)); 

        C.prototype.factory.addObject = (function(c) 
        {
            function addObject()
            {
                var name = ((typeof arguments[0] === "string") ? arguments[0] : arguments[0].name || "");
                var inputObject = arguments[1] || arguments[0];

                c.gameObjects.addObject(name.lower(), c.createArray(inputObject));
                c.Objects[name.upper()] = inputObject;

                return inputObject;
            }

            return addObject;
        }(C.prototype)); 

		C.prototype.Objects.GameObject = (function(c) 
		{
			function GameObject()
			{
				this.body = {
					physics: {
						shape: "",
						moves: false,
						solidObject: false
					},
					boundingBox: {}
				};

				this.update = function() {};
				this.draw = function() {};
			}

			c.gameObjects.addObject("gameObject", c.createArray(GameObject));

			return GameObject;
		}(C.prototype));

		C.prototype.Objects.Rect = (function(c) 
		{
			function Rect(x, y, width, height)
			{
				c.Objects.GameObject.apply(this, arguments);

				this.x = x;
				this.y = y;
				this.width = width;
				this.height = height;

                this.halfWidth = width / 2;
                this.halfHeight = height / 2;

				this.body.physics = {
					shape: "rect",
		            moves: false,
		            solidObject: true
				};

				var self = this;
				this.body.updateBoundingBox = function()
				{
					var box = this.boundingBox;
					box.minX = self.x;
					box.minY = self.y;
					box.maxX = self.x + self.width;
					box.maxY = self.y + self.height;
				};

				this.body.updateBoundingBox();
			}

			c.gameObjects.addObject("rect", c.createArray(Rect));

			return Rect;
		}(C.prototype));

		return true;
	}

	/*Globalize Engine*/
	window['CartesianSystemEngine'] = CartesianSystemEngine;
}(window, window.document, Math));