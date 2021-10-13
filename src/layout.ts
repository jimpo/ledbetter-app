import nearley from 'nearley';
import grammar from './grammars/layout';

export interface Layout {
	pixels_per_meter: number,
	pixel_strips: {
		start_x_meters: number,
		start_y_meters: number,
		segments: {
			direction_degrees: number,
			length_pixels: number,
		}[],
	}[],
}

export function parseCode(code: string): any {
	// Create a Parser object from our grammar.
	const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

	// Parse something!
	parser.feed(code);

	// parser.results is an array of possible parsings.
	return parser.results;
}
