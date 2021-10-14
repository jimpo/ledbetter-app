import nearley from 'nearley';
import grammar from './grammars/layout';

interface LayoutPixelStrip {
	pixelsPerMeter: number,
	startXMeters: number,
	startYMeters: number,
	segments: {
		directionDegrees: number,
		lengthPixels: number,
	}[],
}

export interface Layout {
	pixelStrips: LayoutPixelStrip[],
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
			strip: {
				pixelsPerMeter: this.pixelsPerMeter,
				startXMeters,
				startYMeters,
				segments: [],
			},
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
		return {
			pixelStrips: this.pixelStrips,
		};
	}
}

export function parseCode(code: string): Layout {
	const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
	parser.feed(code);
	const directives:any[] = parser.results[0];

	const interpreter = new LayoutLangInterpreter();
	for (const directive of directives) {
		interpreter.nextDirective(directive);
	}
	return interpreter.finish();
}
