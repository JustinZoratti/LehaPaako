const tools = document.getElementById("tools");
const c1 = document.getElementById("c1");
const c2 = document.getElementById("c2");
const ctx1 = c1.getContext("2d");
const ctx2 = c2.getContext("2d");
const right = document.getElementById("right");
const stroke = 16;
const eraser = 30;
let origin = { x: 0, y: 0 };
const current = { x: 0, y: 0 };
const last = { x: 0, y: 0 };
const selection = { x: 0, y: 0, w: 0, y: 0, data: null };

const config = {
	color: "#000",
	action: "pencil"
};

selectAction("pencil");
update();


let down = false;
let canDrawSelection = true;

c1.addEventListener("mousedown", e => {
	down = true;

	origin = {x: e.offsetX, y: e.offsetY};

	draw(e);
});

c1.addEventListener("mousemove", e => {
	last.x = current.x;
	last.y = current.y;

	current.x = e.offsetX;
	current.y = e.offsetY;
	draw(e);
});

window.addEventListener("mouseup", e => {

	compare();

	const canvas = e.target.closest("canvas");

	if (canvas) {
		ctx2.clearRect(0, 0, c2.width, c2.height);

		if (config.action === "line") {
			const o1 = ceil(origin.x - stroke, origin.y - stroke);
			const o2 = ceil(e.offsetX - stroke, e.offsetY - stroke);

			brezLine(o1.x, o1.y, o2.x, o2.y, ctx1);
		}

		if (config.action === "square") {
			drawSquare(ctx1);
		}

		if (config.action === "circle") {
			drawCircle(ctx1);
		}

		if (config.action === "select") {

			console.log(selection)
			if (Math.abs(selection.w) <= 0 || Math.abs(selection.h) <= 0) {
				ctx2.clearRect(0, 0, c2.width, c2.height);
				selection.active = false;
				selection.dragging = false;
				selection.data = null;
				selection.x = 0;
				selection.y = 0;
				selection.w = 0;
				selection.h = 0;
				return;
			}

			if (selection.active) {

				selection.x = origin.x;
				selection.y = origin.y;
				selection.w = current.x - origin.x;
				selection.h = current.y - origin.y;

				drawSelection(selection.x, selection.y, selection.w, selection.h);
				selection.data = ctx1.getImageData(selection.x, selection.y, selection.w, selection.h);

				ctx2.putImageData(selection.data, selection.x, selection.y);

				selection.active = false
			}

			if (selection.dragging) {
				ctx1.putImageData(selection.data, selection.x + (current.x - origin.x), selection.y + (current.y - origin.y));

				selection.data = null;
				selection.x = 0;
				selection.y = 0;
				selection.w = 0;
				selection.h = 0;
			}

			selection.active = false
			selection.dragging = false
		}
	}

	down = false;
});

window.addEventListener("resize", update);

function update() {
	const rect = right.getBoundingClientRect();

	c1.width = c2.width = rect.width - 10;
	c1.height = c2.height = rect.height - 10;

	ctx1.fillStyle = "white";
	ctx1.fillRect(0, 0, c1.width, c1.height);

	const text = "日本語";
	const fontSize = 200;
	ctx1.font = `${fontSize}px Arial`;
	ctx1.fillStyle = "lightgray";
	ctx1.fillText(text, 0, fontSize);
}

function compare() {
	const offscreen = new OffscreenCanvas(c1.width, c2.height);
	const ctx = offscreen.getContext('2d');
	ctx.width = c1.width;
	ctx.height = c1.height;
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c1.width, c1.height);

	const text = "日本語";
	const fontSize = 200;
	ctx.font = `${fontSize}px Arial`;
	ctx.fillStyle = "black";
	ctx.fillText(text, 0, fontSize);

	const imageData = ctx1.getImageData(0, 0, c1.width, c1.height);
	var data = imageData.data;

	const imageData2 = ctx.getImageData(0, 0, c1.width, c1.height);
	var data2 = imageData2.data;

	let diff = 0;
	for (let y = 0; y < c1.height; y++) {
		for (let x = 0; x < c1.width; x++) {
			for (let ch = 0; ch < 4; ch++) {
				const pixelIndex = (y * c1.width + x) * 4 + ch;
				if(data[pixelIndex] * data2[pixelIndex] < data[pixelIndex] + data2[pixelIndex]) {
					diff++;
				}
			}
		}
	}
	console.log("Diff:", diff);

	delete offscreen;
}

function selectAction(action) {
	const last = config.action;
	config.action = action;

	right.classList.remove(last);
	right.classList.add(action);

	const buttons = [...tools.getElementsByTagName("button")];

	for (const button of buttons) {
		button.classList.toggle("active", button.dataset.action === action);
	}
}

function adjust(p) {
	const offscreen = new OffscreenCanvas(c1.width, c2.height);
	const ctx = offscreen.getContext('2d');
	ctx.width = c1.width;
	ctx.height = c1.height;
	ctx.fillStyle = "white";
	ctx.fillRect(0, 0, c1.width, c1.height);

	const text = "日本語";
	const fontSize = 200;
	ctx.font = `${fontSize}px Arial`;
	ctx.fillStyle = "black";
	ctx.fillText(text, 0, fontSize);

	const imageData = ctx.getImageData(0, 0, c1.width, c1.height);
	var data = imageData.data;

	count = 0;
	xsum = 0;
	ysum = 0;
	for(let x = p.x - stroke; x < p.x + stroke; x++) {
		if(x < 0) {
			continue
		}
		if (x >= c1.width) {
			continue
		}
		for(let y = p.y - stroke; y < p.y + stroke; y++) {
			if(y < 0) {
				continue
			}
			if (y >= c1.height) {
				continue
			}

			if((y - p.y) * (y - p.y) + (x - p.x) * (x - p.x) > stroke * stroke) {
				continue
			}

			let ind = Math.floor((y * c1.width + x) * 4);
			if(!data[ind]) {
				count++
				xsum += x
				ysum += y
			}
		}
	}

	delete offscreen;

	if(count == 0) {
		return p
	}

	return {x: xsum/count, y: ysum/count}
}

function draw(e) {
	ctx2.setLineDash([]);

	let p = {x: e.offsetX, y: e.offsetY};
	p = adjust(p)
	if (down) {
		let l = {x: last.x, y: last.y};
		l = adjust(l)
		brezLine(l.x, l.y, p.x, p.y, ctx1);
	} else {
		ctx2.clearRect(0, 0, c2.width, c2.height);
		brezLine(p.x, p.y, p.x, p.y, ctx2);
	}
}

function drawCircle(ctx) {
	ctx2.clearRect(0, 0, c2.width, c2.height);

	ctx.beginPath();
	ctx.ellipse(
		current.x,
		current.y,
		(current.x - origin.x),
		(current.y - origin.y),
		0, 0, 2 * Math.PI
	);
	ctx.stroke();
}

function drawSquare(ctx) {
	ctx2.clearRect(0, 0, c2.width, c2.height);
	const s = ceil(current.x - origin.x, current.y - origin.y);
	ctx.beginPath();
	ctx.lineWidth = stroke;
	ctx.strokeStyle = config.color;
	ctx.rect(origin.x - (stroke / 2), origin.y - (stroke / 2), s.x, s.y);
	ctx.stroke();
	ctx.closePath();
}

function drawSelection(x, y, w, h) {
	ctx2.setLineDash([5, 5]);
	ctx2.lineWidth = 1;
	ctx2.strokeStyle = "#000";
	ctx2.beginPath();
	ctx2.rect(x - 0.5, y - 0.5, w, h);
	ctx2.stroke();
	ctx2.closePath();
}

function erase(x, y) {
	ctx1.fillStyle = "#fff";
	ctx1.fillRect(x, y, eraser, eraser);
}

tools.addEventListener("click", selectTool, false);

function selectTool(e) {
	const button = e.target.closest("button");

	if ("action" in button.dataset && !button.disabled) {
		selectAction(button.dataset.action);
	}
}

const select = document.getElementById("selection");

select.addEventListener("click", selectColor, false);

function selectColor(e) {
	const button = e.target.closest("button");

	if (button) {
		const color = button.className.replace("color ", "");

		document.getElementById("foreground").firstElementChild.className = `color ${color}`;

		config.color = button.dataset.color;
	}
}

function rgbToHex(r, g, b) {
	if (r > 255 || g > 255 || b > 255)
		throw "Invalid color component";
	return ((r << 16) | (g << 8) | b).toString(16);
}

function pixel(x, y, ctx) {
	ctx.fillStyle = config.color;
	ctx.fillRect(x, y, stroke, stroke);
}

function brezLine(x1, y1, x2, y2, ctx) {
	// Begin a new path
	ctx.beginPath();

	// Set the starting point of the line
	ctx.moveTo(x1, y1);

	// Set the ending point of the line
	ctx.lineTo(x2, y2);

	// Set the line style (optional)
	ctx.lineWidth = stroke;
	ctx.lineCap = 'round'; 
	ctx.strokeStyle = "black";

	// Draw the line
	ctx.stroke();
}

function dropper(e) {
	const pos = ceil(e.offsetX, e.offsetY);
	const pixelData = ctx1.getImageData(pos.x, pos.y, 1, 1).data;
	return "#" + ("000000" + rgbToHex(pixelData[0], pixelData[1], pixelData[2])).slice(-6);
}

function hexToRgbA(hex, opacity) {
	var h = hex.replace('#', '');
	h = h.match(new RegExp('(.{' + h.length / 3 + '})', 'g'));

	for (var i = 0; i < h.length; i++)
		h[i] = parseInt(h[i].length == 1 ? h[i] + h[i] : h[i], 16);

	if (typeof opacity != 'undefined') h.push(opacity);

	return 'rgba(' + h.join(',') + ')';
}

var getPixelPos = function (x, y) {
	return (y * c1.width + x) * 4;
};

var matchStartColor = function (data, pos, startColor) {
	return (data[pos] === startColor.r &&
		data[pos + 1] === startColor.g &&
		data[pos + 2] === startColor.b &&
		data[pos + 3] === startColor.a);
};

var colorPixel = function (data, pos, color) {
	data[pos] = color.r || 0;
	data[pos + 1] = color.g || 0;
	data[pos + 2] = color.b || 0;
	data[pos + 3] = color.hasOwnProperty("a") ? color.a : 255;
};

// http://www.williammalone.com/articles/html5-canvas-javascript-paint-bucket-tool/
var floodFill = function (startX, startY, fillColor) {
	fillColor = hexToRgbA(fillColor, 1);
	var canvas = c1;
	var ctx = ctx1;
	//var srcImg = ctx.getImageData(0,0,canvas.width,canvas.height);
	//var srcData = srcImg.data;
	var dstImg = ctx.getImageData(0, 0, canvas.width, canvas.height);
	var dstData = dstImg.data;

	var startPos = getPixelPos(startX, startY);
	var startColor = {
		r: dstData[startPos],
		g: dstData[startPos + 1],
		b: dstData[startPos + 2],
		a: dstData[startPos + 3]
	};
	var todo = [[startX, startY]];

	while (todo.length) {
		var pos = todo.pop();
		var x = pos[0];
		var y = pos[1];
		var currentPos = getPixelPos(x, y);

		while ((y-- >= 0) && matchStartColor(dstData, currentPos, startColor)) {
			currentPos -= canvas.width * 4;
		}

		currentPos += canvas.width * 4;
		++y;
		var reachLeft = false;
		var reachRight = false;

		while ((y++ < canvas.height - 1) && matchStartColor(dstData, currentPos, startColor)) {

			colorPixel(dstData, currentPos, fillColor);

			if (x > 0) {
				if (matchStartColor(dstData, currentPos - 4, startColor)) {
					if (!reachLeft) {
						todo.push([x - 1, y]);
						reachLeft = true;
					}
				}
				else if (reachLeft) {
					reachLeft = false;
				}
			}

			if (x < canvas.width - 1) {
				if (matchStartColor(dstData, currentPos + 4, startColor)) {
					if (!reachRight) {
						todo.push([x + 1, y]);
						reachRight = true;
					}
				}
				else if (reachRight) {
					reachRight = false;
				}
			}

			currentPos += canvas.width * 4;
		}
	}

	ctx.putImageData(dstImg, 0, 0);
};

// keep coords on grid
function ceil(x, y) {
	return {
		x: Math.ceil(x / stroke) * stroke,
		y: Math.ceil(y / stroke) * stroke
	};
}

function inSelection(e) {
	return e.offsetX > selection.x && e.offsetX < selection.x + selection.w &&
		e.offsetY > selection.y && e.offsetY < selection.y + selection.h;
}