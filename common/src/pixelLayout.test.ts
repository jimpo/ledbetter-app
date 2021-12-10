import {parseCode, PixelLayout, PixelLayoutStrip} from './pixelLayout';


test('parseCode', () => {
	const program = `
SET PIXELS_PER_METER 60
STRIP AT 10m, -10m
TURN 30 degrees
SEGMENT 300 pixels
`;
	const results = parseCode(program);
	const expectedLayout = new PixelLayout([
		new PixelLayoutStrip({
			pixelsPerMeter: 60,
			startXMeters: 10,
			startYMeters: -10,
			segments: [
				{
					directionDegrees: 30,
					lengthPixels: 300,
				},
			],
		}),
	]);
	expect(results).toEqual(expectedLayout);
});

test('parseCode without trailing newline', () => {
	const program = `
SET PIXELS_PER_METER 60
STRIP AT 10m, -10m
TURN 30 degrees
SEGMENT 300 pixels`;
	const results = parseCode(program);
	const expectedLayout = new PixelLayout([
		new PixelLayoutStrip({
			pixelsPerMeter: 60,
			startXMeters: 10,
			startYMeters: -10,
			segments: [
				{
					directionDegrees: 30,
					lengthPixels: 300,
				},
			],
		}),
	]);
	expect(results).toEqual(expectedLayout);
});

test('parseCode with unfinished input', () => {
	const program = `
SET PIXELS_PER_METER`;
	expect(() => parseCode(program)).toThrow(/Unexpected NL token/);
});

test('pixelLocs is computed correcty', () => {
	const strip = new PixelLayoutStrip({
		pixelsPerMeter: 60,
		startXMeters: 0,
		startYMeters: 0,
		segments: [
			{
				directionDegrees: 150,
				lengthPixels: 10,
			},
			{
				directionDegrees: 210,
				lengthPixels: 20,
			},
		],
	});
	expect(strip.pixelLocs.length).toEqual(30);
});

test('parseCode with fractional distances', () => {
	const program = `
SET PIXELS_PER_METER 60
STRIP AT 0.1m, -10m
TURN 30 degrees
SEGMENT 300 pixels
`;
	const results = parseCode(program);
	const expectedLayout = new PixelLayout([
		new PixelLayoutStrip({
			pixelsPerMeter: 60,
			startXMeters: 0.1,
			startYMeters: -10,
			segments: [
				{
					directionDegrees: 30,
					lengthPixels: 300,
				},
			],
		}),
	]);
	expect(results).toEqual(expectedLayout);
});
