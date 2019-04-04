function gameObjects()
{
    var Camera = function(x, y, width, height)
    {
        cse.Objects.Rect.apply(this, arguments);

        this.focusX = this.halfWidth;
        this.focusY = this.halfHeight;
        this.speed = 0.1;

        var self = this;

        this.draw = function()
        {
            noFill();
            stroke(255, 255, 255, 100);
            strokeWeight(0.7);
            rect(this.x, this.y, this.width, this.height);
            noStroke();
        };

        this.body.updateBoundingBox = function()
        {
            this.boundingBox.minX = self.focusX - self.halfWidth;
            this.boundingBox.minY = self.focusY - self.halfHeight;
            this.boundingBox.maxX = self.focusX + self.halfWidth;
            this.boundingBox.maxY = self.focusY + self.halfHeight;
        };
    };
    Camera.prototype.follow = function(boundingBox)
    {
        var x = boundingBox.minX + (boundingBox.maxX - boundingBox.minX) / 2;
        var y = boundingBox.minY + (boundingBox.maxY - boundingBox.minY) / 2;

        this.angle = Math.atan2(y - this.focusY, x - this.focusX);
        this.distance = dist(this.focusX, this.focusY, x, y) * this.speed;

        this.focusX += this.distance * Math.cos(this.angle);
        this.focusY += this.distance * Math.sin(this.angle);

        //Keep it in the grid
        this.focusX = constrain(this.focusX, cse.world.bounds.minX + this.halfWidth, cse.world.bounds.maxX - this.halfWidth);
        this.focusY = constrain(this.focusY, cse.world.bounds.minY + this.halfHeight, cse.world.bounds.maxY - this.halfHeight);

        //Get the corners position on the grid
        this._upperLeft = cse.cameraGrid.getPlace(this.focusX - this.halfWidth, this.focusY - this.halfHeight);
        this._lowerRight = cse.cameraGrid.getPlace(this.focusX + this.halfWidth, this.focusY + this.halfHeight);
    };
    Camera.prototype.translate = function()
    {
        translate(this.x, this.y);
            
        if((cse.world.bounds.maxX - cse.world.bounds.minX) >= this.width)
        {
            translate(this.halfWidth - this.focusX, 0);
        }else{
            translate(-cse.world.bounds.minX, 0);
        }
        if((cse.world.bounds.maxY - cse.world.bounds.minY) >= this.height)
        {
            translate(0, this.halfHeight - this.focusY);
        }else{
            translate(0, -cse.world.bounds.minY);
        }
    };
    Camera.prototype.view = function(object)
    {
        this.follow(object.body.boundingBox);
        this.translate();
        this.body.updateBoundingBox();
    };
    
    var Block = function(x, y, width, height, color)
    {
        cse.Objects.Rect.apply(this, arguments);

        this.draw = function()
        {
            noStroke();
            fill(color);
            rect(this.x, this.y, this.width, this.height);
        };
    };
    cse.factory.addObject("block", Block);

    var Player = function(x, y, width, height, color)
    {
        Block.apply(this, arguments);
        this.body.physics.moves = "dynamic";

        this.controls = {
            left : function() 
            {
                return keys[LEFT] || keys.a;
            },
            right : function() 
            {
                return keys[RIGHT] || keys.d;
            },
            up : function() 
            {
                return keys[UP] || keys.w;
            },
            down : function() 
            {
                return keys[DOWN] || keys.s;
            },
        };

        this.xSpeed = 4;
        this.ySpeed = 4;

        this.update = function()
        {
            if(this.controls.left())
            {
                this.x -= this.xSpeed;
            }
            if(this.controls.right())
            {
                this.x += this.xSpeed;
            }

            if(this.controls.up())
            {
                this.y -= this.ySpeed;
            }
            if(this.controls.down())
            {
                this.y += this.ySpeed;
            }

            this.x = constrain(this.x, cse.world.bounds.minX, cse.world.bounds.maxX - this.width);
            this.y = constrain(this.y, cse.world.bounds.minY, cse.world.bounds.maxY - this.height);

            this.body.updateBoundingBox();
        };
    };
    cse.factory.addObject("player", Player);
}

function preload()
{
    size(800, 480);

    let config = {
        grid: {
            cols: 12,
            rows: 20,
            cellWidth: 130,
            cellHeight: 130
        }
    };

    window.cse = new CartesianSystemEngine(config);

    const keys = [];
    var keyPressed = function()
    {
        keys[keyCode] = true;
        keys[key.toString()] = true;
    };
    var keyReleased = function()
    {
        delete keys[keyCode];
        delete keys[key.toString()];
    };

    var fpsCatcher = {
        fps: 60,
        lastTime: 0,
        
        outFps: 60,
        lastOutTime: 0,
        
        diff : 1000 / 60,
        speed: 1,
    };
    fpsCatcher.update = function()
    {
        this.deltaTime = (now() - this.lastTime);
        this.lastTime = now();
        
        this.fps = 1000 / this.deltaTime;
        this.speed = (this.deltaTime / 1000) * 60;
        
        if(now() - this.lastOutTime > 250)
        {
            this.outFps = this.fps;
            this.lastOutTime = now();
        }
    };

    function now()
    {
        return performance.now(); 
    }
}

function ui()
{
    fpsCatcher.draw = function()
    {
        textSize(12);
        textAlign(LEFT, TOP);
        fill(255, 255, 255, 120);
        text("fps: " + this.outFps, 12, 10);
    };
    function debug()
    {
        var place = cse.cameraGrid.getPlace(cam.body.boundingBox.minX + mouseX - cam.x, 
                                            cam.body.boundingBox.minY + mouseY - cam.y);
        var cell = cse.cameraGrid[place.col][place.row];

        textAlign(NORMAL, NORMAL);
        textSize(12);
        fill(255, 255, 255, 100);
           
        text(place.col + ", " + place.row, 10, 125);

        var j = 0;
        for(var i in cell)
        {
            j++;
            text(i, 10, 125 + j * 14); 
        }
    }

    cse.cameraGrid.draw = function()
    {
        noFill();
        stroke(255, 255, 255, 100);
        strokeWeight(0.5);

        var col, row;

        for(col = cam._upperLeft.col; col <= cam._lowerRight.col; col++)
        {
            for(row = cam._upperLeft.row; row <= cam._lowerRight.row; row++)
            {  
                rect(col * this.cellWidth, row * this.cellHeight, this.cellWidth, this.cellHeight);
            }
        }

        noStroke();
    };
    cse.world.draw = function()
    {
        noFill();
        stroke(255, 255, 255, 100);
        strokeWeight(0.8);
        line(this.bounds.minX, this.bounds.minY, this.bounds.maxX, this.bounds.minY);
        line(this.bounds.minX, this.bounds.maxY, this.bounds.maxX, this.bounds.maxY);
        line(this.bounds.minX, this.bounds.minY, this.bounds.minX, this.bounds.maxY);
        line(this.bounds.maxX, this.bounds.minY, this.bounds.maxX, this.bounds.maxY);
        noStroke();
    };
}

function main()
{
    function setup()
    {
        var blocks = cse.gameObjects.getObject("block");
        blocks.add(243, 22, 33, 44, color(233, 4, 5));
        blocks.add(463, 222, 33, 44, color(23, 44, 5));
        blocks.add(243, 167, 63, 44, color(23, 4, 215));

        cse.gameObjects.forEach(array => array.forEach(object => cse.cameraGrid.addReference(object)));
    }

    var cam = new Camera(45, 45, width - 90, height - 90);
    var player = cse.factory.add("player", [300, 300, 40, 40, color(0, 80, 205, 200)]);

    setup();
    
	draw = function()
	{
		background(0, 0, 0);

		pushMatrix();
            cam.view(player);
            cse.gameObjects.update(cam);
			cse.gameObjects.draw(cam);
            cse.cameraGrid.draw();
            cse.world.draw();
		popMatrix();

        cam.draw();
        fpsCatcher.draw();
        debug();

        fpsCatcher.update();
	};

	window.cse = cse;
    window.cam = cam;
    window.player = player;

    console.log(cse);
}

createProcessing(preload, ui, gameObjects, main);