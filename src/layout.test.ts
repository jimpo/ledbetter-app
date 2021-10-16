import {parseCode} from './layout';


test('parseCode', () => {
	const program = `
SET PIXELS_PER_METER 60
STRIP AT 10m, -10m
TURN 30 degrees
SEGMENT 300 pixels
`;
	const results = parseCode(program);
	const expectedLayout = {
		pixelStrips: [
			{
				pixelsPerMeter: 60,
				startXMeters: 10,
				startYMeters: -10,
				segments: [
					{
						directionDegrees: 30,
						lengthPixels: 300,
					},
				],
			},
		],
	};
	expect(results).toEqual(expectedLayout);
});

test('parseCode without trailing newline', () => {
	const program = `
SET PIXELS_PER_METER 60
STRIP AT 10m, -10m
TURN 30 degrees
SEGMENT 300 pixels`;
	const results = parseCode(program);
	const expectedLayout = {
		pixelStrips: [
			{
				pixelsPerMeter: 60,
				startXMeters: 10,
				startYMeters: -10,
				segments: [
					{
						directionDegrees: 30,
						lengthPixels: 300,
					},
				],
			},
		],
	};
	expect(results).toEqual(expectedLayout);
});

test('parseCode with unfinished input', () => {
	const program = `
SET PIXELS_PER_METER`;
	expect(() => parseCode(program)).toThrow(/Unexpected NL token/);
});
