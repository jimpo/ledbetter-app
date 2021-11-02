import tinycolor from 'tinycolor2';
import type {PixelLayout} from 'ledbetter-common';

export interface PixelVal {
	red: number,
	grn: number,
	blu: number,
}

function getExportedFunction(instance: WebAssembly.Instance, name: string): Function {
	const exportVal = instance.exports[name];
	if (typeof exportVal !== 'function') {
		throw new Error(`WASM instance has the wrong type for ${name} export`);
	}
	return exportVal;
}

export interface Program {
	tick(): void;
	render(): PixelVal[][];
}

export class WasmProgram {
	private readonly _tick: () => void;
	private readonly _getPixelRed: (stripIdx: number, pixelIdx: number) => number;
	private readonly _getPixelGrn: (stripIdx: number, pixelIdx: number) => number;
	private readonly _getPixelBlu: (stripIdx: number, pixelIdx: number) => number;
	private readonly _pixels: PixelVal[][];

	constructor(
		public layout: PixelLayout,
		instance: WebAssembly.Instance,
		_module: WebAssembly.Module,
	) {
		// TODO: Validate module
		this._tick = getExportedFunction(instance, 'tick') as () => void;
		this._getPixelRed = getExportedFunction(instance, 'getPixelRed') as
			(stripIdx: number, pixelIdx: number) => number;
		this._getPixelGrn = getExportedFunction(instance, 'getPixelGrn') as
			(stripIdx: number, pixelIdx: number) => number;
		this._getPixelBlu = getExportedFunction(instance, 'getPixelBlu') as
			(stripIdx: number, pixelIdx: number) => number;

		this._pixels = trivialPixelValArray(layout);
		this._initLayout(instance);
	}

	_initLayout(instance: WebAssembly.Instance): void {
		const initLayoutSetNumStrips = getExportedFunction(instance, 'initLayoutSetNumStrips');
		const initLayoutSetStripLen = getExportedFunction(instance, 'initLayoutSetStripLen');
		const initLayoutSetPixelLoc = getExportedFunction(instance, 'initLayoutSetPixelLoc');
		const initLayoutDone = getExportedFunction(instance, 'initLayoutDone');

		initLayoutSetNumStrips(this.layout.pixelStrips.length);
		for (const stripIdx in this.layout.pixelStrips) {
			const strip = this.layout.pixelStrips[stripIdx];
			initLayoutSetStripLen(stripIdx, strip.length);
			for (const pixelIdx in strip.pixelLocs) {
				const pixelLoc = strip.pixelLocs[pixelIdx];
				initLayoutSetPixelLoc(stripIdx, pixelIdx, pixelLoc.x, pixelLoc.y);
			}
		}
		initLayoutDone();
	}

	tick(): void {
		this._tick();
	}

	render(): PixelVal[][] {
		for (let i = 0; i < this._pixels.length; i++) {
			for (let j = 0; j < this._pixels[i].length; j++) {
				const pixelVal = this._pixels[i][j];
				pixelVal.red = this._getPixelRed(i, j);
				pixelVal.grn = this._getPixelGrn(i, j);
				pixelVal.blu = this._getPixelBlu(i, j);
			}
		}
		return this._pixels;
	}
}

export async function createWasmProgram(wasm: BufferSource, layout: PixelLayout): Promise<Program> {
	const {instance, module} = await WebAssembly.instantiate( wasm, {
		env: {
			abort(_msgRef: number, _fileNameRef: number, line: number, column: number) {
				console.error("abort called at main.ts:" + line + ":" + column);
			},
		},
		colorConvert: {
			hsvToRgbEncoded(h: number, s: number, v: number): number {
				const {r, g, b} = tinycolor({h, s, v}).toRgb();
				return (b << 16) | (g << 8) | (r << 0);
			},
		},
	});

	return new WasmProgram(layout, instance, module);
}

export class TrivialProgram {
	private readonly _pixels: PixelVal[][];

	constructor(public layout: PixelLayout) {
		this._pixels = trivialPixelValArray(layout);
	}

	tick(): void {}

	render(): PixelVal[][] {
		return this._pixels;
	}
}

function trivialPixelValArray(layout: PixelLayout): PixelVal[][] {
	const pixels = [];
	for (let i = 0; i < layout.pixelStrips.length; i++) {
		const stripPixels = [];
		for (let j = 0; j < layout.pixelStrips[i].length; j++) {
			stripPixels.push({
				red: 255,
				grn: 255,
				blu: 255,
			});
		}
		pixels.push(stripPixels);
	}
	return pixels;
}