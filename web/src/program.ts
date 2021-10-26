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

export class Program {
	private readonly _tick: () => void;
	private readonly _render: () => void;
	private readonly _getPixelRed: (stripIdx: number, pixelIdx: number) => number;
	private readonly _getPixelGrn: (stripIdx: number, pixelIdx: number) => number;
	private readonly _getPixelBlu: (stripIdx: number, pixelIdx: number) => number;

	constructor(public instance: WebAssembly.Instance, public layout: PixelLayout) {
		const initLayout = getExportedFunction(instance, 'initLayout');
		const initStrip = getExportedFunction(instance, 'initStrip');
		this._tick = getExportedFunction(instance, 'tick') as () => void;
		this._render = getExportedFunction(instance, 'render') as () => void;
		this._getPixelRed = getExportedFunction(instance, 'getPixelRed') as
			(stripIdx: number, pixelIdx: number) => number;
		this._getPixelGrn = getExportedFunction(instance, 'getPixelGrn') as
			(stripIdx: number, pixelIdx: number) => number;
		this._getPixelBlu = getExportedFunction(instance, 'getPixelBlu') as
			(stripIdx: number, pixelIdx: number) => number;

		initLayout(layout.pixelStrips.length);
		for (const stripIdx in layout.pixelStrips) {
			initStrip(stripIdx, layout.pixelStrips[stripIdx].length);
		}
	}

	tick(): void {
		this._tick();
	}

	render(): PixelVal[][] {
		this._render();
		const pixels = [];
		for (let i = 0; i < this.layout.pixelStrips.length; i++) {
			const stripPixels = [];
			for (let j = 0; j < this.layout.pixelStrips[i].length; j++) {
				const red = this._getPixelRed(i, j);
				const grn = this._getPixelGrn(i, j);
				const blu = this._getPixelBlu(i, j);
				stripPixels.push({red, grn, blu});
			}
			pixels.push(stripPixels);
		}
		return pixels;
	}
}

export async function createProgram(wasm: BufferSource, layout: PixelLayout): Promise<Program> {
	const {instance, module} = await WebAssembly.instantiate( wasm, {
		env: {
			abort(_msg, _file, line, column) {
				console.error("abort called at main.ts:" + line + ":" + column);
			}
		}
	});

	return new Program(instance, layout);
}