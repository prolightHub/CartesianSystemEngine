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
    Math.constrain = function(num, min, max)
    {
        return this.min(this.max(num, min), max);
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
            world: {},
            camera: {}
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

            config.camera = config.camera || {};
            c.camera = new C.prototype.Camera(config.camera.x || 0, config.camera.y || 0, config.camera.width || 0, config.camera.height || 0);
            c.camera.speed = config.camera.speed || c.camera.speed;
            c.camera.padding = (config.camera.padding || config.camera.padding === 0) ? config.camera.padding : c.camera.padding;

            c.noPhysics = config.noPhysics || false;
        };

        C.prototype.setup();  
	};

	function init(c, C)
	{
		"use strict";

        var _c = c;

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
                            var vx = rect1.body.xVel + rect2.body.xVel,
                                vy = rect1.body.yVel + rect2.body.yVel;
                            
                            //Based on the last decided side ignore x or y.
                            if(rect1.body.side === "up" || rect1.body.side === "down" || rect1.body.side === "")
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
                                case "left":
                                    if(rect1.body.gravityX)
                                    {
                                        rect1.body.inAir = (rect1.body.gravityX < 0);
                                    }
                                    rect1.body.xVel = (!noZero) ? 0 : rect1.body.xVel;
                                    rect1.x = rect2.x - rect1.width;
                                    break;
                                
                                case "right":
                                    if(rect1.body.gravityX)
                                    {
                                        rect1.body.inAir = (rect1.body.gravityX > 0);
                                    }
                                    rect1.body.xVel = (!noZero) ? 0 : rect1.body.xVel;
                                    rect1.x = rect2.x + rect2.width;
                                    break;
                                         
                                case "up":
                                    if(rect1.body.gravityY)
                                    {
                                        rect1.body.inAir = (rect1.body.gravityY < 0);
                                    }
                                    rect1.body.yVel = (!noZero) ? 0 : rect1.body.yVel;
                                    rect1.y = rect2.y - rect1.height;
                                    break;
                                
                                case "down":
                                    if(rect1.body.gravityY)
                                    {
                                        rect1.body.inAir = (rect1.body.gravityY > 0);
                                    }
                                    rect1.body.yVel = (!noZero) ? 0 : rect1.body.yVel;
                                    rect1.y = rect2.y + rect2.height; 
                                    break;
                            }
                        },
                        applyVelSide: function(side, body1, body2)
                        {
                            switch(side)
                            {
                                case "left":
                                    if(body1.xVel > 0)
                                    {
                                        body2.xVel += body1.xForce || (body1.xAcl || 2) * (body1.mass || 1);
                                    }
                                    return true;
                                
                                case "right":
                                    if(body1.xVel < 0) 
                                    {
                                        body2.xVel -= body1.xForce || (body1.xAcl || 2) * (body1.mass || 1);  
                                    }
                                    return true;
                                    
                                case "up":
                                    if(body1.yVel > 0)
                                    {
                                        body2.yVel += body1.yForce || (body1.yAcl || 2) * (body1.mass || 1);
                                    }
                                    return true;
                                    
                                case "down":
                                    if(body1.yVel < 0)
                                    {
                                        body2.yVel -= body1.yForce || (body1.yAcl || 2) * (body1.mass || 1); 
                                    }
                                    return true;
                            }
                            return false;
                        },
                        getSideOneWay: function(side, rect1, oneWay)
                        {
                            switch(side)
                            {
                                case "left":
                                    if(oneWay.body.sides.left && rect1.body.xVel > 0 && 
                                    rect1.x + rect1.width <= oneWay.x + Math.abs(rect1.body.xVel))
                                    {
                                        return "left";    
                                    }
                                    break;
                                
                                case "right":
                                    if(oneWay.body.sides.right && rect1.body.xVel < 0 && 
                                    rect1.x + Math.abs(rect1.body.xVel) >= oneWay.x + oneWay.width)
                                    {
                                        return "right";    
                                    }
                                    break;
                                    
                                case "up":
                                    if(oneWay.body.sides.up && rect1.body.yVel > 0 && 
                                    rect1.y + rect1.height <= oneWay.y + Math.abs(rect1.body.yVel))
                                    {
                                        return "up";
                                    }
                                    break;
                                    
                                case "down":
                                    if(oneWay.body.sides.down && rect1.body.yVel < 0 && 
                                    rect1.y + Math.abs(rect1.body.yVel) >= oneWay.y + oneWay.height)
                                    {
                                        return "down";    
                                    }
                                    break;
                            }
                            return "";
                        },
                        solveCollision: function(rect1, rect2)
                        {
                            var side = this.getSide(rect1, rect2);

                            if(rect2.body.sides)
                            {
                                side = this.getSideOneWay(side, rect1, rect2);
                            }

                            rect1.body.side = side;

                            var noZero;

                            if(rect2.body.physics.moves)
                            {
                                noZero = this.applyVelSide(side, rect1.body, rect2.body);
                            }

                            this.applySide(side, rect1, rect2, noZero);

                            return {
                                side: side
                            };
                        }
                    },
                    "circlecircle": {
                        colliding: function(circle1, circle2)
                        {
                            this.distSq = Math.pow(Math.abs(circle2.x - circle1.x), 2) + Math.pow(Math.abs(circle2.y - circle1.y), 2); 
                            return (this.distSq < Math.pow(circle1.radius + circle2.radius, 2));
                        },
                        solveCollision: function(circle1, circle2)
                        {
                            var angle = Math.atan2(circle1.y - circle2.y, circle1.x - circle2.x);
                            var input = Math.max(0, circle1.radius + circle2.radius - Math.sqrt(this.distSq));

                            circle1.x += input * Math.cos(angle);
                            circle1.y += input * Math.sin(angle);

                            if(circle2.body.physics.moves)
                            {
                                var angle = Math.atan2(circle2.y - circle1.y, circle2.x - circle1.x);
                                var input = Math.max(0, circle2.radius + circle1.radius - Math.sqrt(this.distSq));

                                circle2.x += input * Math.cos(angle);
                                circle2.y += input * Math.sin(angle);
                            }
                        }
                    },
                    "rectcircle": {
                        colliding: function(rect, circle)
                        {
                            var x = circle.x - Math.constrain(circle.x, rect.x, rect.x + rect.width);                  
                            var y = circle.y - Math.constrain(circle.y, rect.y, rect.y + rect.height);
                            return ((this.dist = x * x + y * y) <= circle.radius * circle.radius);
                        },
                        solveCollision: function(rect, circle)
                        {
                            var angle = Math.atan2(rect.y + rect.halfHeight - circle.y, rect.x + rect.halfWidth - circle.x); 

                            if(rect.body.physics.moves)
                            {
                                var cBox = circle.body.boundingBox;
                                rect.x = Math.constrain(circle.x + (circle.radius + rect._halfHyp) * Math.cos(angle) - rect.halfWidth, cBox.minX - rect.width, cBox.maxX);
                                rect.y = Math.constrain(circle.y + (circle.radius + rect._halfHyp) * Math.sin(angle) - rect.halfHeight, cBox.minY - rect.height, cBox.maxY);
                            }
                            if(circle.body.physics.moves)
                            {
                                var esc = Math.abs(circle.radius - Math.sqrt(this.dist));

                                var inputX = esc * Math.cos(angle);
                                var inputY = esc * Math.sin(angle);

                                if(!rect.body.sides)
                                {
                                    circle.x -= inputX;
                                    circle.y -= inputY;
                                }else{
                                    if(rect.body.sides.left && circle.x + circle.radius <= rect.x + Math.abs(circle.body.xVel))
                                    {
                                        circle.x = rect.x - circle.radius;
                                        circle.body.xVel = 0;
                                    }
                                    if(rect.body.sides.right && circle.x - circle.radius + Math.abs(circle.body.xVel) >= rect.x + rect.width)
                                    {
                                        circle.x = rect.x + rect.width + circle.radius;
                                        circle.body.xVel = 0;
                                    }
                                    if(rect.body.sides.up && circle.y + circle.radius <= rect.y + Math.abs(circle.body.yVel))
                                    {
                                        circle.y = rect.y - circle.radius;
                                        circle.body.yVel = 0;
                                    }
                                    if(rect.body.sides.down && circle.y - circle.radius + Math.abs(circle.body.yVel) >= rect.y + rect.height)
                                    {
                                        circle.y = rect.y + rect.height + circle.radius;
                                        circle.body.yVel = 0;
                                    }
                                }
                            }
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
                    if(observer.collisionTypes[object1.body.physics.shape + object2.body.physics.shape])
                    {
                        return observer.collisionTypes[object1.body.physics.shape + object2.body.physics.shape][access](object1, object2);
                    }else{
                        return observer.collisionTypes[object2.body.physics.shape + object1.body.physics.shape][access](object2, object1);
                    }
                },
                colliding: function(object1, object2)
                {
                    if(observer.collisionTypes[object1.body.physics.shape + object2.body.physics.shape])
                    {
                        return observer.collisionTypes[object1.body.physics.shape + object2.body.physics.shape].colliding(object1, object2);
                    }else{
                        return observer.collisionTypes[object2.body.physics.shape + object1.body.physics.shape].colliding(object2, object1);
                    }
                },
                solveCollision: function(object1, object2)
                {
                    if(observer.collisionTypes[object1.body.physics.shape + object2.body.physics.shape])
                    {
                        return observer.collisionTypes[object1.body.physics.shape + object2.body.physics.shape].solveCollision(object1, object2);
                    }else{
                        return observer.collisionTypes[object2.body.physics.shape + object1.body.physics.shape].solveCollision(object2, object1);
                    }
                },
                boundingBoxesColliding: function(box1, box2)
                {
                    return (box1.minX < box2.maxX && box1.maxX > box2.minX && 
                            box1.minY < box2.maxY && box1.maxY > box2.minY);
                }
            };

            return observer;
        }(C.prototype));

        C.prototype.Camera = (function(c)
        {
            function Camera(x, y, width, height)
            {
                c.Objects.Rect.apply(this, arguments);

                this.focusX = this.halfWidth;
                this.focusY = this.halfHeight;
                this.speed = 0.1;
                this.padding = 0;

                var self = this;

                this.body.updateBoundingBox = function()
                {
                    this.boundingBox.minX = self.focusX - self.halfWidth;
                    this.boundingBox.minY = self.focusY - self.halfHeight;
                    this.boundingBox.maxX = self.focusX + self.halfWidth;
                    this.boundingBox.maxY = self.focusY + self.halfHeight;
                };
            }
            Camera.prototype.follow = function(boundingBox)
            {
                var x = boundingBox.minX + (boundingBox.maxX - boundingBox.minX) / 2;
                var y = boundingBox.minY + (boundingBox.maxY - boundingBox.minY) / 2;

                this.angle = Math.atan2(y - this.focusY, x - this.focusX);
                this.distance = Math.sqrt(Math.pow(Math.abs(x - this.focusX), 2) + Math.pow(Math.abs(y - this.focusY), 2)) * this.speed;

                this.focusX += this.distance * Math.cos(this.angle);
                this.focusY += this.distance * Math.sin(this.angle);

                //Keep it in the grid
                this.focusX = Math.constrain(this.focusX, _c.world.bounds.minX + this.halfWidth, _c.world.bounds.maxX - this.halfWidth);
                this.focusY = Math.constrain(this.focusY, _c.world.bounds.minY + this.halfHeight, _c.world.bounds.maxY - this.halfHeight);

                //Get the corners position on the grid
                this._upperLeft = c.cameraGrid.getPlace(this.focusX - this.halfWidth - _c.cameraGrid.cellWidth * this.padding,
                                                        this.focusY - this.halfHeight - _c.cameraGrid.cellHeight * this.padding);
                this._lowerRight = c.cameraGrid.getPlace(this.focusX + this.halfWidth + _c.cameraGrid.cellWidth * this.padding, 
                                                         this.focusY + this.halfHeight + _c.cameraGrid.cellHeight * this.padding);
            };
            Camera.prototype.translate = function(translate)
            {
                translate(this.x, this.y);
                    
                if((_c.world.bounds.maxX - _c.world.bounds.minX) >= this.width)
                {
                    translate(this.halfWidth - this.focusX, 0);
                }else{
                    translate(-c.world.bounds.minX, 0);
                }
                if((_c.world.bounds.maxY - _c.world.bounds.minY) >= this.height)
                {
                    translate(0, this.halfHeight - this.focusY);
                }else{
                    translate(0, -_c.world.bounds.minY);
                }
            };
            Camera.prototype.setTranslate = function(translate)
            {
                this._translate = translate;
            };
            Camera.prototype.view = function(object, translate)
            {
                this.follow(object.body.boundingBox);
                this.body.updateBoundingBox();

                if(translate || this._translate)
                {
                    this.translate(translate || this._translate);
                }
            };

            return Camera;
        }(C.prototype));

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

		C.prototype.gameObjects = (function(c) 
		{
			var gameObjects = c.createArray([]);

			gameObjects.applyCollision = function(objectA)
			{
				if(!objectA.body.physics.moves || _c.noPhysics)
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
                    	cell = c.cameraGrid[col][row];

		                for(i in cell)
		                {
		                	if(used[i])
		                	{
		                		continue;
		                	}

		                	// Is the same as getObject(name) and then getById(id)
		                	objectB = this[this.references[cell[i].arrayName]].map[cell[i].id];

		                	//Set tested (early before bounding box test)
		                	used[i] = true;

		                	//Check boundingBox!
		                	if(!c.observer.boundingBoxesColliding(objectA.body.boundingBox, objectB.body.boundingBox))
		                    {
		                        continue;        
		                    }

		                    if((objectA.body.physics.full && objectB.body.physics.full) || c.observer.colliding(objectA, objectB))
		                    {
		                    	info = {};

		                    	if(objectA.body.physics.solid && objectB.body.physics.solid)
		                    	{
		                    		info = c.observer.solveCollision(objectA, objectB) || {};

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

                cam = cam || _c.camera;

                var col, row, cell, i, object, index;

                for(col = cam._upperLeft.col; col <= cam._lowerRight.col; col++)
                {
                    for(row = cam._upperLeft.row; row <= cam._lowerRight.row; row++)
                    {
                        cell = c.cameraGrid[col][row];

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

                            // Refreshes the object's cell place after it has been moved 
                            if(object.body.physics.moves)
                            {
                                c.cameraGrid.removeReference(object);
                                c.cameraGrid.addReference(object);
                            }

                            // Save info for rendering
                            index = this.references[object._arrayName];
                            this.used[index] = this.used[index] || [];
                            this.used[index].push(object._id);

                            //Show we've used the object for this loop
                            used[i] = true;
                        }
                    }
                }
            };
			gameObjects.draw = function()
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

            /* Non-essentials */
            gameObjects.getObjectsInCam = function()
            {
                var objects = [];
                var i, j;

                for(i in this.used)
                {
                    for(j = 0; j < this.used[i].length; j++)
                    {
                        objects.push(this[i].map[this.used[i][j]]);
                    }
                }

                return objects;
            };
            gameObjects.eachObjectsInCam = function(callback)
            {
                for(i in this.used)
                {
                    for(j = 0; j < this.used[i].length; j++)
                    {
                        callback(this[i].map[this.used[i][j]]);
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
					boundingBox: {},

                    xVel: 0,
                    yVel: 0
				};

                this.body.contain = function() {};
                this.body.updateBoundingBox = function() {};

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

                this._halfHyp = Math.sqrt(Math.pow(this.halfWidth, 2) + Math.pow(this.halfHeight, 2));

				this.body.physics = {
					shape: "rect",
		            moves: false,
		            solid: true,
		            full: true
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

                this.body.contain = function()
                {
                    self.x = Math.constrain(self.x, _c.world.bounds.minX, _c.world.bounds.maxX - self.width);
                    self.y = Math.constrain(self.y, _c.world.bounds.minY, _c.world.bounds.maxY - self.height);
                };
			}

			c.gameObjects.addObject("rect", c.createArray(Rect));

			return Rect;
		}(C.prototype));

        C.prototype.Objects.Circle = (function(c) 
        {
            function Circle(x, y, diameter)
            {
                c.Objects.GameObject.apply(this, arguments);

                this.x = x;
                this.y = y;
                this.diameter = diameter;

                this.radius = diameter / 2;

                this.body.physics = {
                    shape: "circle",
                    moves: false,
                    solid: true,
                    full: false
                };

                var self = this;

                this.body.updateBoundingBox = function()
                {
                    this.boundingBox.minX = self.x - self.radius;
                    this.boundingBox.minY = self.y - self.radius;
                    this.boundingBox.maxX = self.x + self.radius;
                    this.boundingBox.maxY = self.y + self.radius;
                };
                this.body.updateBoundingBox();

                this.body.contain = function()
                {
                    self.x = Math.constrain(self.x, _c.world.bounds.minX + self.radius, _c.world.bounds.maxX - self.radius);
                    self.y = Math.constrain(self.y, _c.world.bounds.minY + self.radius, _c.world.bounds.maxY - self.radius);
                };
            }

            return Circle;
        }(C.prototype));

        C.prototype.Objects.DynamicObject = (function(c) 
        {
            function DynamicObject()
            {
                this.body.xAcl = 0;
                this.body.yAcl = 0;

                this.body.xDeacl = 0;
                this.body.yDeacl = 0;
                this.body.maxXVel = 0;
                this.body.maxYVel = 0;

                this.body.gravityX = 0;
                this.body.gravityY = 0;

                this.body.inAir = false;
                this.body.physics.moves = true; 

                var self = this;
                this.body.updateVel = function()
                {
                    this.xVel += this.gravityX;
                    this.xVel = Math.constrain(this.xVel, -this.maxXVel, this.maxXVel);
                    self.x += this.xVel;
                    
                    this.yVel += this.gravityY;
                    this.yVel = Math.constrain(this.yVel, -this.maxYVel, this.maxYVel);
                    self.y += this.yVel;

                    this.inAir = true;
                };

                this.body.slowX = function(xDeacl)
                {
                    if(!xDeacl)
                    {
                        return;
                    }

                    //Deaccleration
                    if(this.xVel < 0)
                    {
                        this.xVel += xDeacl;
                    }
                    else if(this.xVel > 0)
                    {
                        this.xVel -= xDeacl;
                    }

                    //Stop from moving in one direction.
                    if(Math.abs(this.xVel) <= xDeacl)
                    {
                        this.xVel = 0;
                    }
                };
                this.body.slowY = function(yDeacl)
                {
                    if(!yDeacl)
                    {
                        return;
                    }

                    //Deaccleration
                    if(this.yVel < 0)
                    {
                        this.yVel += yDeacl;
                    }
                    else if(this.yVel > 0)
                    {
                        this.yVel -= yDeacl;
                    }

                    //Stop from moving in one direction.
                    if(Math.abs(this.yVel) <= yDeacl)
                    {
                        this.yVel = 0;
                    }
                };

                this.body.slowVel = function()
                {
                    if(self.controls)
                    {
                        return;
                    }

                    this.slowX(this.xDeacl);
                    this.slowY(this.yDeacl);
                };

                var lastUpdate = this.update;
                this.update = function()
                {
                    lastUpdate.apply(this, arguments);

                    this.body.updateVel();
                    this.body.contain();
                    this.body.updateBoundingBox();
                    this.body.slowVel();
                };
            }

            c.gameObjects.addObject("dynamicObject", c.createArray(DynamicObject));

            return DynamicObject;
        }(C.prototype));

        C.prototype.Objects.LifeForm = (function(c) 
        {
            function LifeForm()
            {
                this.controls = { 
                    left: noop, 
                    right: noop, 
                    up: noop, 
                    down: noop
                };

                var lastUpdate = this.update;
                this.update = function()
                {
                    lastUpdate.apply(this, arguments);

                    if(this.controls.left())
                    {
                        this.body.xVel -= this.body.xAcl;
                    }
                    if(this.controls.right())
                    {
                        this.body.xVel += this.body.xAcl;
                    }
                    if(!this.controls.left() && !this.controls.right())
                    {
                        this.body.slowX(this.body.xDeacl);
                    }

                    if(this.controls.up())
                    {
                        this.body.yVel -= this.body.yAcl;
                    }
                    if(this.controls.down())
                    {
                        this.body.yVel += this.body.yAcl;
                    }
                    if(!this.controls.up() && !this.controls.down())
                    {
                        this.body.slowY(this.body.yDeacl);
                    }
                };
            }

            c.gameObjects.addObject("lifeForm", c.createArray(LifeForm));

            return LifeForm;
        }(C.prototype));

		return true;
	}

	/*Globalize Engine*/
	window['CartesianSystemEngine'] = CartesianSystemEngine;
}(window, window.document, Math));