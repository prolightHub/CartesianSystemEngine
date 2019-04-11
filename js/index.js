function objects()
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

    var Crate = function(x, y, width, height, color)
    {
        cse.Objects.Block.apply(this, arguments);
        cse.Objects.DynamicObject.apply(this);

        this.body.maxXVel = 5;
        this.body.maxYVel = 5;
        this.body.xAcl = 2;
        this.body.yAcl = 2;
        this.body.xDeacl = 0.2;
        this.body.yDeacl = 0.2;
    };
    cse.factory.addObject("crate", Crate);

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
    cse.factory.addObject("ring", Ring);

    var Ball = function(x, y, diameter, color)
    {
        cse.Objects.Ring.apply(this, arguments);
        cse.Objects.DynamicObject.apply(this);

        this.body.maxXVel = 5;
        this.body.maxYVel = 5;
        this.body.xAcl = 2;
        this.body.yAcl = 2;
        this.body.xDeacl = 0.2;
        this.body.yDeacl = 0.2;
    };
    cse.factory.addObject("ball", Ball);

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

        this.body.maxXVel = 4;
        this.body.maxYVel = 4;
        this.body.xAcl = 2;
        this.body.yAcl = 2;
        this.body.xDeacl = 1;
        this.body.yDeacl = 1;
    };
    cse.factory.addObject("player", Player);
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
        text('x: ' + player.x.toFixed(0) + ' y: ' + player.y.toFixed(), width - 12, 10);

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
        noPhysics: true
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
        
        diff: 1000 / 60,
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

function main()
{
    function setup()
    {
        cse.factory.add("block", [243, 22, 33, 44, color(233, 4, 5)]);
        cse.factory.add("block", [463, 222, 33, 44, color(23, 44, 5)]);
        cse.factory.add("block", [243, 167, 140, 44, color(23, 4, 115)]);

        for(var i = 0; i < 500; i++)
        {
            cse.factory.add("block", [
                round(random(cse.world.bounds.minX, cse.world.bounds.maxX)), 
                round(random(cse.world.bounds.minY, cse.world.bounds.maxY)), 
                random(10, 30), 
                random(10, 30), 
                color(23, 4, 125)
            ]);
        }

        // for(var i = 0; i < 500; i++)
        // {
        //     cse.factory.add("crate", [
        //         round(random(cse.world.bounds.minX, cse.world.bounds.maxX)), 
        //         round(random(cse.world.bounds.minY, cse.world.bounds.maxY)), 
        //         random(10, 30), 
        //         random(10, 30), 
        //         color(23, 124, 125)
        //     ]);
        // }

        // for(var i = 0; i < 300; i++)
        // {
        //     cse.factory.add("ring", [
        //         round(random(cse.world.bounds.minX, cse.world.bounds.maxX)), 
        //         round(random(cse.world.bounds.minY, cse.world.bounds.maxY)), 
        //         random(20, 60), 
        //         color(73, 4, 45)
        //     ]);
        // }

        // for(var i = 0; i < 300; i++)
        // {
        //     cse.factory.add("ball", [
        //         round(random(cse.world.bounds.minX, cse.world.bounds.maxX)), 
        //         round(random(cse.world.bounds.minY, cse.world.bounds.maxY)), 
        //         random(20, 60), 
        //         color(23, 124, 125)
        //     ]);
        // }
    }

    var cam = new Camera(45, 45, width - 90, height - 90);
    var player = cse.factory.add("player", [300, 300, 36, 36, color(0, 80, 205, 200)]);

    setup();

    var world = planck.World({
        gravity: planck.Vec2(0, 0)
    });

    const SCALE = 30;

    var fixtureDef = {
        density: 1.0,
        restitution: 0.3,
        friction: 0.5
    };

    var createRect = function(object)
    {
        var body = world.createBody({
            type: object.body.physics.moves ? "dynamic" : "static",
            fixedRotation: true
        });
        body.setPosition(planck.Vec2(
            object.x / SCALE + object.halfWidth / SCALE, 
            object.y / SCALE + object.halfHeight / SCALE));
        body.createFixture(planck.Box(
            object.halfWidth / SCALE,
            object.halfHeight / SCALE), fixtureDef);
        return body;
    };

    var nullBody = world.createBody();

    var applyFriction = function(body, friction)
    {
        world.createJoint(
            planck.FrictionJoint({
                maxForce: friction,
                maxTorque: friction
            }, body, nullBody)
        );
    };

    player.oBody = createRect(player);

    var lastUpdate = player.update;
    player.friction = 0.8;
    player.maxvel = 7;
    player.update = function()
    {
        lastUpdate.apply(this, arguments);

        this.accel = (1 - this.friction) * this.maxvel / (this.friction);
        var lv = this.oBody.getLinearVelocity();

        var f = planck.Vec2(this.body.xVel, this.body.yVel);

        f.x *= SCALE;
        f.y *= SCALE;
        f.clamp(10);

        this.oBody.setAwake(true);
        this.oBody.applyForceToCenter(f);

        this.x = (this.oBody.getPosition().x * SCALE) - this.halfWidth;
        this.y = (this.oBody.getPosition().y * SCALE) - this.halfHeight;
    };

    applyFriction(player.oBody, 4);

    cse.gameObjects.getObject("block").forEach(function(block)
    {
        block.oBody = createRect(block);
    });

	draw = function()
	{
		background(0, 0, 0);

		pushMatrix();
            cam.view(player);
            cse.gameObjects.update(cam);
			cse.gameObjects.draw();

            world.stepBodies(1 / SCALE, cse.gameObjects.getRendered("oBody"));

            cse.cameraGrid.draw();
            cse.world.draw();
		popMatrix();

        cam.draw();
        debug();

        fpsCatcher.draw();
        fpsCatcher.update();
	};

	window.cse = cse;
    window.cam = cam;
    window.player = player;

    console.log(cse);
}

createProcessing(preload, ui, objects, main);

function planck_setup() {
    size(600, 600);

    let config = {
        grid: {
            cols: 14,
            rows: 16,
            cellWidth: 240,
            cellHeight: 240
        },
        noPhysics: true
    };

    window.cse = new CartesianSystemEngine(config);
    console.log(cse);

    var Vector = planck.Vec2;

    var fixtureDef = {
        density: 1.0,
        restitution: 0.3,
        friction: 0.5
    };

    var bodyDef = {
        type: "dynamic",
        fixedRotation: false
    };

    var SCALE = 30;

    window.world = new planck.World(Vector(0, 0));

    var createRect = function(x, y, w, h) {
        var body = world.createBody(bodyDef);
        body.setPosition(Vector(x / SCALE, y / SCALE));
        body.createFixture(planck.Box(w / 2 / SCALE, h / 2 / SCALE), fixtureDef);
        return body;
    };

    var createCircle = function(x, y, d) {
        var body = world.createBody(bodyDef);
        body.setPosition(Vector(x / SCALE, y / SCALE));
        body.createFixture(planck.Circle(d / 2 / SCALE), fixtureDef);
        return body;
    };

    var nullBody = world.createBody();

    var applyFriction = function(body, friction) {
        world.createJoint(
            planck.FrictionJoint({
                maxForce: friction,
                maxTorque: friction
            }, body, nullBody)
        );
    };

    var keys = {};
    keyPressed = function() {
        keys[key.toString()] = true;
        keys[keyCode] = true;
    };
    keyReleased = function() {
        keys[key.toString()] = false;
        keys[keyCode] = false;
    };

    window.player = {
        x: 300,
        y: 300,
        s: 60,
        maxvel: 7,
        friction: 0.8,
        vel: {
            x: 0,
            y: 0
        },
        cam: {
            x: 0,
            y: 0
        },
        body: null,
        draw: function() {
            stroke(100);
            strokeWeight(3);
            fill(200);
            ellipse(this.x, this.y, this.s, this.s);
        },
        update: function() {
            this.x = this.body.getPosition().x * SCALE;
            this.y = this.body.getPosition().y * SCALE;
        },
        applyForce: function(f) {
            f.x *= SCALE;
            f.y *= SCALE;
            this.body.setAwake(true);
            this.body.applyForceToCenter(f);
        },
        move: function() {
            this.accel = (1 - this.friction) * this.maxvel / (this.friction);
            var lv = this.body.getLinearVelocity();
            var f = Vector(0, 0);
            if ((keys[LEFT] || keys.a) && lv.x > -this.maxvel) {
                f.x -= this.accel;
            }
            if ((keys[RIGHT] || keys.d) && lv.x < this.maxvel) {
                f.x += this.accel;
            }
            if ((keys[UP] || keys.w) && lv.y > -this.maxvel) {
                f.y -= this.accel;
            }
            if ((keys[DOWN] || keys.s) && lv.y < this.maxvel) {
                f.y += this.accel;
            }
            this.applyForce(f);
        },
        focus: function() {
            var x = constrain(300 - this.x, 0, 600);
            var y = constrain(300 - this.y, 0, 600);
            this.cam.x += (x - this.cam.x) / 10;
            this.cam.y += (y - this.cam.y) / 10;
            translate(this.cam.x, this.cam.y);
        }
    };
    player.body = createCircle(player.x, player.y, player.s);
    applyFriction(player.body, 7);
    var crates = [];

    var newCrate = function(x, y, s, m) {
        var $ = {
            x: x,
            y: y,
            s: s,
            m: m,
            rot: 0
        };
        bodyDef.type = m ? "dynamic" : "static";
        $.obj = createRect(x, y, s, s);
        applyFriction($.obj, 7);
        $.draw = function() {
            pushMatrix();
            translate($.x, $.y);
            rotate($.rot);
            scale($.s / 80);
            rectMode(CENTER);
            strokeWeight(3);
            stroke(80, 40, 0);
            fill(100, 50, 0);
            rect(0, 0, 56, 56);
            pushMatrix();
            rotate(45);
            fill(140, 60, 0);
            rect(0, 0, 15, 85);
            fill(160, 80, 0);
            rect(0, 0, 85, 15);
            popMatrix();
            noStroke();
            fill(140, 60, 0);
            for (var i = 0; i < 360; i += 90) {
                pushMatrix();
                rotate(i);
                rect(35, 0, 12, 80);
                popMatrix();
            }
            noFill();
            stroke(80, 40, 0);
            rect(0, 0, 56, 56);
            rect(0, 0, 80, 80);
            if (!$.m) {
                fill(200, 200, 200);
                strokeWeight(2);
                ellipse(+33, +33, 6, 6);
                ellipse(-33, +33, 6, 6);
                ellipse(+33, -33, 6, 6);
                ellipse(-33, -33, 6, 6);
            }
            popMatrix();
        };
        $.update = function() {
            $.x = $.obj.getPosition().x * SCALE;
            $.y = $.obj.getPosition().y * SCALE;
            $.rot = degrees($.obj.getAngle());
        };
        crates.push($);
        return $;
    };

    while (crates.length < 30 * 3) {
        var m = crates.length % 4 > 0;
        newCrate(random(-200, 800) * 2, random(-200, 800) * 2, 80, m);
    }

    bodyDef.type = "static";

    draw = function() {
        background(255);
        
        pushMatrix();
            player.focus();

            var toUpdate = [player.body];
            crates.forEach(function(crat) {
                crat.draw();
                crat.update();

                // world.stepBody(1 / SCALE, crat.obj);

                toUpdate.push(crat.obj);
            });
            player.move();
            
            /*Need to limit bodies in this function! Possibly change this 
            function to only update one at a time or add bodies then step then remove bodies*/
            // world.step(1 / SCALE); 
            
            world.stepBodies(1 / SCALE, toUpdate);

            player.update();

            player.draw();
        popMatrix();

        if(keys[" "])
        {
            console.log(player);
        }
    };
}

// createProcessing(planck_setup);