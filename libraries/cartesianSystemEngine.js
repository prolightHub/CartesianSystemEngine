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

		C.prototype.cameraGrid = (function(c) 
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
		}(C.prototype));

		C.prototype.observer = (function(c) 
		{
			var observer = {
				collisionTypes: {
					"rectrect": {
						colliding: function(rect1, rect2)
						{
							return ((rect1.x + rect1.width > rect2.x && 
		                         	 rect1.x < rect2.x + rect2.width) && 
		                        	(rect1.y + rect1.height > rect2.y && 
		                         	 rect1.y < rect2.y + rect2.height));
						},
						getSide: function(rect1, rect2)
		                {
		                    /*
		                        @dx: Difference x or the difference between both centers 
		                             of rectangles in X-axis.
		                             
		                        @dy: Difference y or the difference between both centers 
		                             of rectangles in Y-axis.
		                    */
		                    var dx = ((rect1.x + rect1.halfWidth) - (rect2.x + rect2.halfWidth)),
		                        dy = ((rect1.y + rect1.halfHeight) - (rect2.y + rect2.halfHeight));
		                    
		                    /*Note that these values can be subsituted 
		                      or moved down below (with ox and oy)*/
		                    var vx = rect1.xVel + rect2.xVel,
		                        vy = rect1.yVel + rect2.yVel;
		                    
		                    //Based on the last decided side ignore x or y.
		                    if(rect1.body.side === "up" || rect1.body.side === "down")
		                    {
		                        vx = 0;
		                    }
		                    else if(rect1.body.side === "left" || rect1.body.side === "right")
		                    {
		                        vy = 0;
		                    }

		                    var ox = (rect1.halfWidth  + rect2.halfWidth)  - Math.abs(dx - vx),
		                        oy = (rect1.halfHeight + rect2.halfHeight) - Math.abs(dy - vy);
		                        
		                    if(ox < oy)
		                    {
		                        if(dx < 0)
		                        {
		                            return "left";
		                        }else{
		                            return "right";
		                        }
		                    }else{
		                        if(dy < 0)
		                        {
		                            return "up";  
		                        }else{
		                            return "down";  
		                        }
		                    }
		                },
		                applySide: function(side, rect1, rect2, noZero)
		                {
		                    switch(side)
		                    {
		                        case "left" :
		                            if(rect1.gravityX)
		                            {
		                                rect1.inAir = (rect1.gravityX < 0);
		                            }
		                            rect1.xVel = (!noZero) ? 0 : rect1.xVel;
		                            rect1.x = rect2.x - rect1.width;
		                            break;
		                        
		                        case "right" :
		                            if(rect1.gravityX)
		                            {
		                                rect1.inAir = (rect1.gravityX > 0);
		                            }
		                            rect1.xVel = (!noZero) ? 0 : rect1.xVel;
		                            rect1.x = rect2.x + rect2.width;
		                            break;
		                                 
		                        case "up" :
		                            if(rect1.gravityY)
		                            {
		                                rect1.inAir = (rect1.gravityY < 0);
		                            }
		                            rect1.yVel = (!noZero) ? 0 : rect1.yVel;
		                            rect1.y = rect2.y - rect1.height;
		                            break;
		                        
		                        case "down" :
		                            if(rect1.gravityY)
		                            {
		                                rect1.inAir = (rect1.gravityY > 0);
		                            }
		                            rect1.yVel = (!noZero) ? 0 : rect1.yVel;
		                            rect1.y = rect2.y + rect2.height; 
		                            break;
		                    }
		                },
						solveCollision: function(rect1, rect2)
						{
							var side = this.getSide(rect1, rect2);

							rect1.body.side = side;

                    		var noZero;
                    		this.applySide(side, rect1, rect2, noZero);

							return {
								side: side
							};
						}
					}
				},
				getType: function(name1, name2, object)
		        {
		        	var flipped;
		            var typeToReturn = "";
		            var type = name1 + name2;

		            if(object[type])
		            {
		                typeToReturn = type;
		            }else{
		                //Flip shapes
		                flipped = true;
		                type = name2 + name1;
		                if(object[type])
		                {
		                    typeToReturn = type;
		                }
		            }
		            return {
		                type: typeToReturn,
		                flipped: flipped,
		            };
		        },     
				access: function(object1, object2, access)
		        {
		            var info = observer.getType(
		                object1.body.physics.shape,
		                object2.body.physics.shape,
		                observer.collisionTypes
		            );
		            var colliding = false;

		            if(info.flipped)
		            {
		            	colliding = observer.collisionTypes[info.type][access](object2, object1);              
		            }else{
		                colliding = observer.collisionTypes[info.type][access](object1, object2);
		            }
		            return colliding;
		        },
				colliding: function(object1, object2)
		        {
		            return this.access(object1, object2, "colliding");
		        },
		        solveCollision: function(object1, object2)
		        {
		            return this.access(object1, object2, "solveCollision");
		        },
				boundingBoxesColliding: function(box1, box2)
		        {
		            return (box1.minX < box2.maxX && box1.maxX > box2.minX && 
		                    box1.minY < box2.maxY && box1.maxY > box2.minY);
		        }
			};

			return observer;
		}(C.prototype));

		C.prototype.gameObjects = (function(c) 
		{
			var gameObjects = c.createArray([]);

			gameObjects.applyCollision = function(objectA)
			{
				if(!objectA.body.physics.moves)
				{
					return;
				}

				var used = {};

				//We don't want to test objectA against it self!
				used[objectA._arrayName + objectA._id] = true; 

				var col, row, cell, i, objectB, info;

                for(col = objectA._upperLeft.col; col <= objectA._lowerRight.col; col++)
                {
                    for(row = objectA._upperLeft.row; row <= objectA._lowerRight.row; row++)
                    {
                    	cell = cse.cameraGrid[col][row];

		                for(i in cell)
		                {
		                	if(used[i])
		                	{
		                		continue;
		                	}

		                	// Is the same as getObject(name) and then getById(id)
		                	objectB = this[this.references[cell[i].arrayName]].map[cell[i].id];

		                	//Set tested (early before continues)
		                	used[i] = true;

		                	//Check boundingBox!
		                	if(!c.observer.boundingBoxesColliding(objectA.body.boundingBox, objectB.body.boundingBox))
		                    {
		                        continue;        
		                    }

		                    if((objectA.body.physics.full && objectB.body.physics.full) || 
		                    	c.observer.colliding(objectA, objectB))
		                    {
		                    	info = {};

		                    	if(objectA.body.physics.solid && objectB.body.physics.solid)
		                    	{
		                    		info = c.observer.solveCollision(objectA, objectB);

		                    		objectA.body.updateBoundingBox();
                        			objectB.body.updateBoundingBox();   
		                    	}

		                    	objectA.onCollide(objectB, info);
		                    	objectB.onCollide(objectA, info);
		                    }
		                }
                    }
                }
			};
			gameObjects.update = function(cam) 
            {
                var used = {};
                this.used = {};

                var col, row, cell, i, object, index;

                for(col = cam._upperLeft.col; col <= cam._lowerRight.col; col++)
                {
                    for(row = cam._upperLeft.row; row <= cam._lowerRight.row; row++)
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

                            // Heres where we can finally update the gameObject!
                            object.update();
                            this.applyCollision(object);

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

		C.prototype.factory = (function(c)
		{
			var factory = {
				add: function(arrayName, args)
	            {
	                var place = c.gameObjects.getObject(arrayName);
	                var object = place.add.apply(place, args);
	                c.cameraGrid.addReference(object);
	                return object;
	            },
	            remove: function(name, index)
	            {
	                var object = (c.gameObjects[c.gameObjects.references[name]] || [])[index];
	                if(object)
	                {
		                c.cameraGrid.removeReference(object);
		                delete c.gameObjects[c.gameObjects.references[name]].map[object._id];
		                c.gameObjects[c.gameObjects.references[name]].splice(index, 1);
		            }
	            },
	            addObject: function()
	            {
	                var name = ((typeof arguments[0] === "string") ? arguments[0] : arguments[0].name || "");
	                var inputObject = arguments[1] || arguments[0];

	                c.gameObjects.addObject(name.lower(), c.createArray(inputObject));
	                c.Objects[name.upper()] = inputObject;

	                return inputObject;
	            },
	            getObject: function()
	            {
	            	return c.gameObjects[c.gameObjects.references[name]];
	            }
			};

			return factory;
		}(C.prototype));

		C.prototype.Objects.GameObject = (function(c) 
		{
			function GameObject()
			{
				this.body = {
					physics: {
						shape: "",
						moves: false,
						solid: false
					},
					boundingBox: {}
				};

				this.update = function() {};
				this.draw = function() {};

				this.remove = function() {};
				this.onCollide = function() {};
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
		            solid: true,
		            full: true
				};

				this.xVel = 0;
				this.yVel = 0;

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