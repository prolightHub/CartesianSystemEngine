!(function(window, document, Math)
{
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

		//Lets the entire project know that we have initiated the project.
		c.initiated = init(this, C);

		if(!c.initiated)
		{
			throw ("The engine failed to initiate with error code '" + c.initiated + "'");
		}

		config = config || {};
		C.prototype.cameraGrid.setup(config.cols || 1, config.rows || 1, config.cellWidth || 0, config.cellHeight || 0);
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
			    		this[col].push();
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

		    cameraGrid.addReference = function(object) {};
		    cameraGrid.removeReference = function(object) {};

			return cameraGrid;
		}(C.prototype.createArray));

		C.prototype.gameObjects = (function(c) 
		{
			var gameObjects = c.createArray([]);

			gameObjects.update = function() {};
			gameObjects.draw = function() 
			{
				for(var i = 0; i < this.length; i++)
				{
					for(var j = 0; j < this[i].length; j++)
					{
						this[i][j].draw();
					}
				}
			};

			return gameObjects;
		}(C.prototype));

        C.prototype.Objects = {};

		C.prototype.Objects.GameObject = (function(c) 
		{
			function GameObject()
			{
				this.body = {
					physics: {
						shape: "",
						movement: "static",
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

				this.body.physics = {
					shape: "rect",
		            movement: "static",
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