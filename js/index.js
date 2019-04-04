function main()
{
	let config = {
		cols: 12,
		rows: 6,
		cellWidth: 60,
		cellHeight: 60
	};

    window.cse = new CartesianSystemEngine(config);

    size(800, 480);
    background(0, 0, 0);

    function Test(x, y, width, height, color)
    {
    	this.x = x;
    	this.y = y;
    	this.width = width;
    	this.height = height;
    	this.color = color;
    }
    Test.prototype.draw = function()
	{
		fill(this.color);
		rect(this.x, this.y, this.width, this.height);
	};

	noStroke();

	// var blocks = cse.createArray(Test);
	// blocks.add(23, 42, 23, 123, color(23, 55, 234));
	// blocks.addObject("john", 120, 200, 40, 70, color(23, 42, 200));
	// blocks.addObject("pro", 243, 22, 33, 44, color(233, 4, 5));

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
	cse.gameObjects.addObject("block", cse.createArray(Block));
	cse.gameObjects.getObject("block").add(243, 22, 33, 44, color(233, 4, 5));

	var Camera = function()
	{

	};

	draw = function()
	{
		background(0, 0, 0);
		// blocks.act("draw");

		pushMatrix();


			cse.gameObjects.update();
			cse.gameObjects.draw();
		popMatrix();
	};

	// window.blocks = blocks;
	window.cse = cse;

    console.log(cse);
}

createProcessing(main);