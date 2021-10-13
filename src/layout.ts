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

// function parseCode(code: string): Layout {

// }
