import nearley from 'nearley';
import grammar from './grammars/layout';

export interface BoundingBox {
	xMin: number,
	xMax: number,
	yMin: number,
	yMax: number,
}

interface PixelLayoutSegment {
	directionDegrees: number,
	lengthPixels: number,
}

export class PixelLayoutStrip {
	pixelsPerMeter: number;
	startXMeters: number;
	startYMeters: number;
	segments: PixelLayoutSegment[];
	pixelLocs: {x: number, y: number}[];

	constructor({
		pixelsPerMeter,
		startXMeters,
		startYMeters,
		segments,
	}: {
		pixelsPerMeter: number,
		startXMeters: number,
		startYMeters: number,
		segments: {
			directionDegrees: number,
			lengthPixels: number,
		}[],
	}) {
		this.pixelsPerMeter = pixelsPerMeter;
		this.startXMeters = startXMeters;
		this.startYMeters = startYMeters;
		this.segments = segments;

		this.pixelLocs = this._computePixelLocs();
	}

	get length(): number {
		return this.pixelLocs.length;
	}

	boundingBox(): BoundingBox {
		const bounds = {
			xMin: this.startXMeters,
			xMax: this.startXMeters,
			yMin: this.startYMeters,
			yMax: this.startYMeters,
		};
		for (const {x, y} of this.pixelLocs) {
			bounds.xMin = Math.min(bounds.xMin, x);
			bounds.xMax = Math.max(bounds.xMax, x);
			bounds.yMin = Math.min(bounds.yMin, y);
			bounds.yMax = Math.max(bounds.yMax, y);
		}
		return bounds;
	}

	_computePixelLocs(): {x: number, y: number}[] {
		let x = this.startXMeters;
		let y = this.startYMeters;
		let pixelLocs = [];
		for (const segment of this.segments) {
			let radians = 2 * Math.PI * segment.directionDegrees / 360;
			const dx = Math.cos(radians) / this.pixelsPerMeter;
			const dy = Math.sin(radians) / this.pixelsPerMeter;
			for (let i = 0; i < segment.lengthPixels; i++) {
				pixelLocs.push({x, y});
				x += dx;
				y += dy;
			}
		}
		return pixelLocs;
	}
}

export class PixelLayout {
	constructor(public pixelStrips: PixelLayoutStrip[]) {}

	boundingBox(): BoundingBox {
		if (this.pixelStrips.length === 0) {
			return {
				xMin: 0,
				xMax: 0,
				yMin: 0,
				yMax: 0,
			};
		}

		const bounds = this.pixelStrips[0].boundingBox();
		for (let i = 1; i < this.pixelStrips.length; i++) {
			const stripBounds = this.pixelStrips[i].boundingBox();
			bounds.xMin = Math.min(bounds.xMin, stripBounds.xMin);
			bounds.xMax = Math.max(bounds.xMax, stripBounds.xMax);
			bounds.yMin = Math.min(bounds.yMin, stripBounds.yMin);
			bounds.yMax = Math.max(bounds.yMax, stripBounds.yMax);
		}
		return bounds;
	}
}

class LayoutLangInterpreter {
	pixelsPerMeter:number = 0;
	pixelStrips:PixelLayoutStrip[] = [];
	currentPixelStrip:{
		startXMeters: number,
		startYMeters: number,
		segments: PixelLayoutSegment[],
		degrees: number,
	} | null = null;

	nextDirective(directive: any): void {
		if (directive.statement == 'set_pixels_per_meter') {
			this._setPixelsPerMeter(directive);
		} else if (directive.statement == 'strip') {
			this._stripAt(directive);
		} else if (directive.statement == 'turn') {
			this._turn(directive);
		} else if (directive.statement == 'segment') {
			this._segment(directive);
		} else {
			throw Error(`unexpected directive: ${JSON.stringify(directive)}`);
		}
	}

	_setPixelsPerMeter({value}: {value: number}) {
		if (value <= 0) {
			throw Error("Must SET PIXELSPERMETER to a non-negative value");
		}
		this._finishCurrentStrip();
		this.pixelsPerMeter = value;
	}

	_stripAt({x: startXMeters, y: startYMeters}: {x: number, y: number}) {
		if (!this.pixelsPerMeter) {
			throw Error("Must SET PIXELSPERMETER before STRIP AT directive");
		}
		this._finishCurrentStrip();
		this.currentPixelStrip = {
			startXMeters,
			startYMeters,
			segments: [],
			degrees: 0,
		};
	}

	_turn({degrees}: {degrees: number}) {
		if (this.currentPixelStrip === null) {
			throw Error('Must declare STRIP AT before TURN');
		}
		const new_degrees = this.currentPixelStrip.degrees + degrees;
		// Normalize to [0, 360)
		this.currentPixelStrip.degrees = ((new_degrees % 360) + 360) % 360;
	}

	_segment({nPixels}: {nPixels: number}) {
		if (this.currentPixelStrip === null) {
			throw Error('Must declare STRIP AT before SEGMENT');
		}
		if (nPixels < 0) {
			throw Error('SEGMENT expects positive number of pixels');
		}
		this.currentPixelStrip.segments.push({
			directionDegrees: this.currentPixelStrip.degrees,
			lengthPixels: nPixels,
		});
	}

	_finishCurrentStrip() {
		if (this.currentPixelStrip !== null) {
			this.pixelStrips.push(new PixelLayoutStrip({
				pixelsPerMeter: this.pixelsPerMeter,
				startXMeters: this.currentPixelStrip.startXMeters,
				startYMeters: this.currentPixelStrip.startYMeters,
				segments: this.currentPixelStrip.segments,
			}));
			this.currentPixelStrip = null;
		}
	}

	finish(): PixelLayout {
		this._finishCurrentStrip();
		return new PixelLayout(this.pixelStrips);
	}
}

export function parseCode(code: string): PixelLayout {
	const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
	parser.feed(code);
	if (!code.endsWith("\n")) {
		parser.feed("\n");
	}
	const directives:any[] = parser.results[0];

	const interpreter = new LayoutLangInterpreter();
	for (const directive of directives) {
		interpreter.nextDirective(directive);
	}
	return interpreter.finish();
}
