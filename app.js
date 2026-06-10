const canvas = document.getElementById("sc");
const ctx = canvas.getContext("2d");
const wrap = document.getElementById("polaroid");
const hintEl = document.getElementById("hint");

const PAL = [
	"#edede9",
	"#e5dfd9",
	"#d6ccc2",
	"#f0e8e0",
	"#e3d5ca",
	"#d5bdaf",
	"#cbb09f",
	"#bfa090",
	"#f5ebe0",
	"#a68a78"
];

let W, H, COLS, ROWS, CELL;
let grid,
	colGrid,
	phase = "wait",
	fc = 0;

function resize() {
	const borderH = 36;
	W = wrap.offsetWidth - borderH;
	H = Math.round(W * 0.9);

	CELL = Math.max(2, Math.round(W / 180));

	canvas.width = W;
	canvas.height = H;
	canvas.style.width = W + "px";
	canvas.style.height = H + "px";
	ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function init() {
	COLS = Math.floor(W / CELL);
	ROWS = Math.floor(H / CELL);
	grid = new Uint8Array(COLS * ROWS);
	colGrid = new Array(COLS * ROWS).fill(null);
	phase = "wait";
	fc = 0;
	hintEl.style.opacity = "1";
	buildSources();
}

function rndCol() {
	return PAL[Math.floor(Math.random() * PAL.length)];
}

function buildSources() {
	const off = document.createElement("canvas");
	off.width = W;
	off.height = H;
	const oc = off.getContext("2d");
	const fs = Math.max(18, Math.floor(W * 0.27));

	oc.fillStyle = "#000";
	oc.font = "900 " + fs + "px sans-serif";
	oc.textAlign = "center";
	oc.textBaseline = "middle";
	oc.fillText("SAND", W / 2, H * 0.4);

	const d = oc.getImageData(0, 0, W, H).data;

	for (let cy = 0; cy < Math.floor(ROWS * 0.72); cy++) {
		for (let cx = 0; cx < COLS; cx++) {
			const px = cx * CELL + (CELL >> 1);
			const py = cy * CELL + (CELL >> 1);
			if (px < W && py < H && d[(py * W + px) * 4 + 3] > 100) {
				grid[cy * COLS + cx] = 1;
				colGrid[cy * COLS + cx] = rndCol();
			}
		}
	}
}

function triggerFall() {
	phase = "falling";
}

function updateSand() {
	let moved = false;

	for (let cy = ROWS - 2; cy >= 0; cy--) {
		const leftToRight = Math.random() < 0.5;

		for (let i = 0; i < COLS; i++) {
			const cx = leftToRight ? i : COLS - 1 - i;
			const idx = cy * COLS + cx;

			if (grid[idx] === 1) {
				const below = idx + COLS;
				const belowLeft = below - 1;
				const belowRight = below + 1;

				if (grid[below] === 0) {
					grid[below] = 1;
					colGrid[below] = colGrid[idx];
					grid[idx] = 0;
					colGrid[idx] = null;
					moved = true;
				} else if (
					cx > 0 &&
					grid[belowLeft] === 0 &&
					cx < COLS - 1 &&
					grid[belowRight] === 0
				) {
					const dir = Math.random() < 0.5 ? belowLeft : belowRight;
					grid[dir] = 1;
					colGrid[dir] = colGrid[idx];
					grid[idx] = 0;
					colGrid[idx] = null;
					moved = true;
				} else if (cx > 0 && grid[belowLeft] === 0) {
					grid[belowLeft] = 1;
					colGrid[belowLeft] = colGrid[idx];
					grid[idx] = 0;
					colGrid[idx] = null;
					moved = true;
				} else if (cx < COLS - 1 && grid[belowRight] === 0) {
					grid[belowRight] = 1;
					colGrid[belowRight] = colGrid[idx];
					grid[idx] = 0;
					colGrid[idx] = null;
					moved = true;
				}
			}
		}
	}
	return moved;
}

function draw() {
	ctx.fillStyle = "#edede9";
	ctx.fillRect(0, 0, W, H);

	for (let cy = 0; cy < ROWS; cy++) {
		for (let cx = 0; cx < COLS; cx++) {
			if (grid[cy * COLS + cx] === 1) {
				ctx.fillStyle = colGrid[cy * COLS + cx];

				ctx.fillRect(cx * CELL, cy * CELL, CELL - 0.3, CELL - 0.3);
			}
		}
	}
}

function frame() {
	fc++;

	if (phase === "wait" && fc === 60) {
		triggerFall();
		hintEl.style.opacity = "0";
	}

	if (phase === "falling") {
		let shifts = 0;
		for (let steps = 0; steps < 3; steps++) {
			if (updateSand()) shifts++;
		}

		if (shifts === 0) {
			phase = "done";
			hintEl.style.opacity = "1";
		}
	}

	draw();
	requestAnimationFrame(frame);
}

function start() {
	resize();
	init();
}

window.addEventListener("load", function () {
	start();
	frame();
});

wrap.addEventListener("click", function () {
	start();
});
