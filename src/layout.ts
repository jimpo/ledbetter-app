import nearley from 'nearley';
import grammar from './grammars/layout';

interface BoundingBox {
	xMin: number,
	xMax: number,
	yMin: number,
	yMax: number,
}

class LayoutPixelStrip {
	pixelsPerMeter: number;
	startXMeters: number;
	startYMeters: number;
	segments: {
		directionDegrees: number,
		lengthPixels: number,
	}[];

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
	}

	boundingBox(): BoundingBox {
		let x = this.startXMeters;
		let y = this.startYMeters;
		const bounds = {
			xMin: x,
			xMax: x,
			yMin: y,
			yMax: y,
		};
		for (const segment of this.segments) {
			let len = segment.lengthPixels / this.pixelsPerMeter;
			let radians = 2 * Math.PI * segment.directionDegrees / 360;
			x += len * Math.cos(radians);
			y += len * Math.sin(radians);
			bounds.xMin = Math.min(bounds.xMin, x);
			bounds.xMax = Math.max(bounds.xMax, x);
			bounds.yMin = Math.min(bounds.yMin, y);
			bounds.yMax = Math.max(bounds.yMax, y);
		}
		return bounds;
	}
}

class Layout {
	constructor(public pixelStrips: LayoutPixelStrip[]) {}

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
	pixelStrips:LayoutPixelStrip[] = [];
	currentPixelStrip:{strip: LayoutPixelStrip, degrees: number} | null = null;

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
		this.pixelsPerMeter = value;
		if (this.currentPixelStrip !== null) {
			this.pixelStrips.push(this.currentPixelStrip.strip);
		}
	}

	_stripAt({x: startXMeters, y: startYMeters}: {x: number, y: number}) {
		if (!this.pixelsPerMeter) {
			throw Error("Must SET PIXELSPERMETER before STRIP AT directive");
		}
		if (this.currentPixelStrip !== null) {
			this.pixelStrips.push(this.currentPixelStrip.strip);
		}
		this.currentPixelStrip = {
			strip: new LayoutPixelStrip({
				pixelsPerMeter: this.pixelsPerMeter,
				startXMeters,
				startYMeters,
				segments: [],
			}),
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
		this.currentPixelStrip.strip.segments.push({
			directionDegrees: this.currentPixelStrip.degrees,
			lengthPixels: nPixels,
		});
	}

	finish(): Layout {
		if (this.currentPixelStrip !== null) {
			this.pixelStrips.push(this.currentPixelStrip.strip);
		}
		return new Layout(this.pixelStrips);
	}
}

export function parseCode(code: string): Layout {
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
