const tools = document.getElementById("tools");
const c1 = document.getElementById("c1");
const c2 = document.getElementById("c2");
const ctx1 = c1.getContext("2d");
const ctx2 = c2.getContext("2d");
const right = document.getElementById("right");
const stroke = 5;
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

	const x = Math.ceil(e.offsetX / stroke) * stroke;
	const y = Math.ceil(e.offsetY / stroke) * stroke;

	origin = ceil(e.offsetX, e.offsetY);

	if (config.action === "pencil") {
		draw(e);
	}

	if (config.action === "erase") {
		erase(x - (eraser / 2), y - (eraser / 2));
	}

	if (config.action === "fill") {
		// ctx1.fillStyle = config.color;
		// ctx1.fillRect(0,0,c1.width,c1.height);

		floodFill(origin.x, origin.y, config.color, 1);
	}

	if (config.action === "dropper") {
		const hex = dropper(e);

		const selection = document.getElementById("selection");
		const buttons = [...selection.getElementsByTagName("button")];

		for (const button of buttons) {
			if (button.dataset.color === hex) {
				const color = button.className.replace("color ", "");

				document.getElementById("foreground").firstElementChild.className = `color ${color}`;

				config.color = button.dataset.color;
			}
		}
	}


	if (config.action === "select") {
		if (selection.data) {
			selection.dragging = inSelection(e);
		} else {
			selection.active = true;
		}
	}
});

c1.addEventListener("mousemove", e => {
	last.x = current.x;
	last.y = current.y;

	current.x = e.offsetX;
	current.y = e.offsetY;
	draw(e);
});

window.addEventListener("mouseup", e => {
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

	ctx1.fillStyle = "#fff";
	ctx1.fillRect(0, 0, c1.width, c1.height);
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

function draw(e) {
	const pos = ceil(e.offsetX, e.offsetY);

	ctx2.setLineDash([]);

	if (down) {
		if (config.action === "pencil") {
			const l = ceil(last.x - stroke, last.y - stroke);
			const p = ceil(e.offsetX - stroke, e.offsetY - stroke);
			brezLine(
				l.x,
				l.y,
				p.x,
				p.y,
				ctx1
			);
		}

		if (config.action === "line") {
			const o1 = ceil(origin.x - stroke, origin.y - stroke);
			const o2 = ceil(e.offsetX - stroke, e.offsetY - stroke);
			ctx2.clearRect(0, 0, c2.width, c2.height);
			brezLine(o1.x, o1.y, o2.x, o2.y, ctx2);
		}

		if (config.action === "square") {
			drawSquare(ctx2);
		}


		if (config.action === "circle") {
			drawCircle(ctx2);
		}

		if (config.action === "select") {
			ctx2.clearRect(0, 0, c2.width, c2.height);

			if (selection.active) {
				selection.x = origin.x;
				selection.y = origin.y;
				selection.w = current.x - origin.x;
				selection.h = current.y - origin.y;

				drawSelection(selection.x, selection.y, selection.w, selection.h);
			}

			if (selection.dragging) {
				if (selection.data) {
					ctx1.clearRect(selection.x, selection.y, selection.w, selection.h);
					ctx2.putImageData(selection.data, selection.x + (current.x - origin.x), selection.y + (current.y - origin.y));
					drawSelection(selection.x + (current.x - origin.x), selection.y + (current.y - origin.y), selection.w, selection.h);
				}
			}
		}
	} else {
		if (config.action === "pencil" || config.action === "line" || config.action === "square") {
			ctx2.clearRect(0, 0, c2.width, c2.height);
			const l = ceil(last.x - stroke, last.y - stroke);
			pixel(l.x, l.y, ctx2);
		}
	}

	if (config.action === "dropper") {
		ctx2.clearRect(0, 0, c2.width, c2.height);
		ctx2.beginPath();
		ctx2.lineWidth = 1;
		ctx2.rect(pos.x - 0.5, pos.y - 0.5, stroke, stroke);
		ctx2.stroke();
		ctx2.closePath();
	}

	if (config.action === "erase") {
		ctx2.clearRect(0, 0, c2.width, c2.height);
		if (down) {
			erase(pos.x - (eraser / 2), pos.y - (eraser / 2));
		}

		ctx2.beginPath();
		ctx2.rect(pos.x - (eraser / 2), pos.y - (eraser / 2), eraser, eraser);
		ctx2.stroke();
		ctx2.closePath();
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

	// Iterators, counters required by algorithm
	let x, y, dx, dy, dx1, dy1, px, py, xe, ye, i;

	// Calculate line deltas
	dx = x2 - x1;
	dy = y2 - y1;

	// Create a positive copy of deltas (makes iterating easier)
	dx1 = Math.abs(dx);
	dy1 = Math.abs(dy);

	// Calculate error intervals for both axis
	px = 2 * dy1 - dx1;
	py = 2 * dx1 - dy1;

	// The line is X-axis dominant
	if (dy1 <= dx1) {

		// Line is drawn left to right
		if (dx >= 0) {
			x = x1;
			y = y1;
			xe = x2;
		} else { // Line is drawn right to left (swap ends)
			x = x2;
			y = y2;
			xe = x1;
		}

		pixel(x, y, ctx); // Draw first pixel

		// Rasterize the line
		for (i = 0; x < xe; i++) {
			x = x + stroke;

			// Deal with octants...
			if (px < 0) {
				px = px + 2 * dy1;
			} else {
				if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
					y = y + stroke;
				} else {
					y = y - stroke;
				}
				px = px + 2 * (dy1 - dx1);
			}

			// Draw pixel from line span at
			// currently rasterized position
			pixel(x, y, ctx);
		}

	} else { // The line is Y-axis dominant

		// Line is drawn bottom to top
		if (dy >= 0) {
			x = x1;
			y = y1;
			ye = y2;
		} else { // Line is drawn top to bottom
			x = x2;
			y = y2;
			ye = y1;
		}

		pixel(x, y, ctx); // Draw first pixel

		// Rasterize the line
		for (i = 0; y < ye; i++) {
			y = y + stroke;

			// Deal with octants...
			if (py <= 0) {
				py = py + 2 * dx1;
			} else {
				if ((dx < 0 && dy < 0) || (dx > 0 && dy > 0)) {
					x = x + stroke;
				} else {
					x = x - stroke;
				}
				py = py + 2 * (dx1 - dy1);
			}

			// Draw pixel from line span at
			// currently rasterized position
			pixel(x, y, ctx);
		}
	}
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