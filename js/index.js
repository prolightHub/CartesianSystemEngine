function objects()
{
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
    cse.factory.addObject("block", (Block));

    var Crate = function(x, y, width, height, color)
    {
        cse.Objects.Block.apply(this, arguments);
        cse.Objects.DynamicObject.apply(this);

        // this.body.maxXVel = 5;
        // this.body.maxYVel = 16;
        // this.body.xAcl = 2;
        // this.body.yAcl = 2;
        // this.body.xDeacl = 2;
        // this.body.yDeacl = 0;

        // this.body.gravityY = 0.45;
        // this.body.jumpHeight = 13;

        // this.body.xForce = 2;
        // this.body.yForce = 0;
        // this.body.upForce = 4;

        // this.body.limits.down = Infinity;
    };
    cse.factory.addObject(Crate);

    var Ring = function(x, y, diameter, color)
    {
        cse.Objects.Circle.apply(this, arguments);

        this.draw = function()
        {
            noStroke();
            fill(color);
            ellipse(this.x, this.y, this.diameter, this.diameter);
        };
    };
    cse.factory.addObject(Ring);

    var Ball = function(x, y, diameter, color)
    {
        cse.Objects.Ring.apply(this, arguments);
        cse.Objects.DynamicObject.apply(this);

        // this.body.maxXVel = 5;
        // this.body.maxYVel = 16;
        // this.body.xAcl = 2;
        // this.body.yAcl = 2;
        // this.body.xDeacl = 2;
        // this.body.yDeacl = 0;

        // this.body.gravityY = 0.45;
        // this.body.jumpHeight = 13;

        // this.body.limits.down = Infinity;
    };
    cse.factory.addObject(Ball);

    var Player = function(x, y, width, height, color)
    {
        Block.call(this, x, y, width, height, color);
        cse.Objects.DynamicObject.apply(this);
        cse.Objects.LifeForm.apply(this);

        this.controls = {
            left: function() 
            {
                return keys[LEFT] || keys.a;
            },
            right: function() 
            {
                return keys[RIGHT] || keys.d;
            },
            up: function() 
            {
                return keys[UP] || keys.w;
            },
            down: function() 
            {
                return keys[DOWN] || keys.s;
            },
        };

        // this.body.maxXVel = 4;
        // this.body.maxYVel = 16;
        // this.body.xAcl = 2;
        // this.body.yAcl = 2;
        // this.body.xDeacl = 1;
        // this.body.yDeacl = 0;

        // this.body.gravityY = 0.45;
        // this.body.jumpHeight = 12;

        // this.body.xForce = 2;
        // this.body.yForce = 0;
        // this.body.upForce = 4;

        // this.body.limits.down = Infinity;
    };
    cse.factory.addObject(Player);
}

function ui()
{
    fpsCatcher.draw = function()
    {
        textSize(12);
        textAlign(LEFT, TOP);
        fill(255, 255, 255, 120);
        text("fps: " + this.outFps.toFixed(2), 12, 10);
    };
    function debug()
    {
        textSize(12);
        textAlign(RIGHT, TOP);
        fill(255, 255, 255, 120);
        text('x: ' + player.x.toFixed(0) + ' y: ' + player.y.toFixed(0), width - 12, 10);
        text('x: ' + player.body.xVel.toFixed(0) + ' y: ' + player.body.yVel.toFixed(0), width - 12, 34);

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

function preload()
{
    size(800, 480);

    let config = {
        grid: {
            cols: 26,
            rows: 26,
            cellWidth: 240,
            cellHeight: 240
        },
        camera: {
            x: 0,
            y: 0,
            width: width,
            height: height
        },
        noPhysics: false
    };

    window.cse = new CartesianSystemEngine(config);

    var body = cse.Overrides.GameObject.body;

    body.maxXVel = 5;
    body.maxYVel = 5;
    body.xAcl = 2;
    body.yAcl = 2;
    body.xDeacl = 1;
    body.yDeacl = 1;

    // body.gravityY = 0.45;
    // body.jumpHeight = 13;

    body.xForce = 4;
    body.yForce = 4;
    // body.upForce = 4;

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
        
        diff: 1000 / 60,
        speed: 1,
    };
    fpsCatcher.update = function()
    {
        this.time = now();

        this.deltaTime = (this.time - this.lastTime);
        this.lastTime = this.time;
        
        this.fps = 1000 / this.deltaTime;
        this.speed = (this.deltaTime / 1000) * 60;
        
        if(this.time - this.lastOutTime > 250)
        {
            this.outFps = this.fps;
            this.lastOutTime = this.time;
        }
    };

    function now()
    {
        return performance.now(); 
    }
}

function main()
{
    function setup()
    {
        cse.factory.create("block", [
            200, 164, 40, 360,
            color(23, 4, 125, 150)
        ]);

        cse.factory.create("block", [
            200, 124, 400, 40,
            color(23, 4, 125, 150)
        ]);

        cse.factory.create("block", [
            210, 730, 800, 40,
            color(23, 4, 125, 150)
        ]);

        cse.factory.create("block", [
            600, 124, 40, 440, 
            color(23, 4, 125, 150) 
        ]);


        cse.factory.create("crate", [ 350, 254, 23, 34, color(23, 4, 125, 150) ]);
        for(var i = 20; i; i--)
        {
            
            cse.factory.create("crate", [ 350 + i * 34, 254 + random(324, 222), 34, 34, color(23, 4, 165, 150) ]);
        }
        // cse.factory.create("crate", [ 350, 254, 34, 34, color(23, 4, 165, 150) ]);

        for(var i = 0; i < 500; i++)
        {
            cse.factory.create("block", [
                round(random(cse.world.bounds.minX, cse.world.bounds.maxX)), 
                round(random(cse.world.bounds.minY, cse.world.bounds.maxY)), 
                random(10, 30) * 4, 
                random(10, 30) * 4, 
                color(23, 4, 125)
            ]);
        }

        for(var i = 0; i < 500; i++)
        {
            cse.factory.create("crate", [
                round(random(cse.world.bounds.minX, cse.world.bounds.maxX)), 
                round(random(cse.world.bounds.minY, cse.world.bounds.maxY)), 
                random(10, 30), 
                random(10, 30), 
                color(23, 124, 125)
            ]);
        }         

        for(var i = 0; i < 500; i++)
        {
            cse.factory.create("ring", [
                round(random(cse.world.bounds.minX, cse.world.bounds.maxX)), 
                round(random(cse.world.bounds.minY, cse.world.bounds.maxY)), 
                random(30, 80), 
                color(73, 4, 45)
            ]);
        }

        for(var i = 0; i < 500; i++)
        {
            cse.factory.create("ball", [
                round(random(cse.world.bounds.minX, cse.world.bounds.maxX)), 
                round(random(cse.world.bounds.minY, cse.world.bounds.maxY)), 
                random(20, 60), 
                color(23, 124, 125)
            ]);
        }
    }

    window.player = cse.factory.add("player", 350, 340, 34, 34, color(0, 80, 205, 200));
    var cam = cse.camera;
    cam.draw = function()
    {
        noFill();
        stroke(255, 255, 255, 100);
        strokeWeight(0.7);
        rect(this.x, this.y, this.width, this.height);
        noStroke();
    };

    setup();

    cam.setTranslate(translate);

    /*Todo: Make CSE have its own optional event loop and add gravity physics.*/

	draw = function()
	{
		background(0, 0, 0);

		pushMatrix();
            cse.camera.view(player);
            cse.gameObjects.update();
			cse.gameObjects.draw();

            cse.cameraGrid.draw();
            // cse.world.draw();
		popMatrix();

        cam.draw();
        debug();

        fpsCatcher.draw();
        fpsCatcher.update();
	};

    console.log(cse);
}

createProcessing(preload, ui, objects, main);