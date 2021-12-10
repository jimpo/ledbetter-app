<script lang="ts">
	import type {Program, PixelVal} from './program';
	import {createWasmProgram, TrivialProgram} from './program';
	import {DriverStatus, PixelLayout} from 'ledbetter-common';

	export let aspectRatio: number = 1;
	export let layout: PixelLayout | null = null;
	export let programWasm: BufferSource | null = null;
	export let status: DriverStatus = 'NotPlaying';

	let program: Program | null = null;
	let stoppedProgram: Program;

	$: stoppedProgram = new TrivialProgram(layout || new PixelLayout([]));

	$: {
		if (status == 'NotPlaying') {
			program = null;
		} else if (program === null) {
			if (programWasm && layout) {
				(async () => {
					program = await createWasmProgram(programWasm, layout);
				})();
			}
		}
	}

	let viewBox: {xMin: number, yMin: number, width: number, height: number};
	$: {
		if (layout !== null) {
			const bounds = layout.boundingBox();
			const boundsHeight = bounds.yMax - bounds.yMin;
			const boundsWidth = bounds.xMax - bounds.xMin;
			const xCenter = (bounds.xMin + bounds.xMax) / 2;
			const yCenter = (bounds.yMin + bounds.yMax) / 2;

			const bufferPct = 2;
			const scale = (1 + 2 * bufferPct / 100);
			const viewBoxWidth = Math.max(boundsWidth, aspectRatio * boundsHeight) * scale;
			const viewBoxHeight = Math.max(boundsHeight, boundsWidth / aspectRatio) * scale;

			viewBox = {
				xMin: xCenter - viewBoxWidth / 2,
				// This is kind of a hack to get the y-axis coordinates going bottom to top
				yMin: -yCenter - viewBoxHeight / 2,
				width: viewBoxWidth,
				height: viewBoxHeight,
			};
		} else {
			viewBox = {xMin: 0, yMin: 0, width: aspectRatio, height: 1};
		}
	}

	function svgColor(val: PixelVal): string {
		return `rgb(${val.red}, ${val.grn}, ${val.blu})`;
	}

	function formatHexByte(byte: number): string {
		return ("0" + byte.toString(16)).slice(-2).toUpperCase();
	}

	function gradiantId(val: PixelVal): string {
		return `led${formatHexByte(val.red)}${formatHexByte(val.grn)}${formatHexByte(val.blu)}`;
	}

	let pixelColors: PixelVal[][];

	let intervalId: number | null = null;
	$: {
		if (status == 'Playing' && intervalId === null) {
			intervalId = window.setInterval(
				() => {
					if (program) {
						program.tick();
						pixelColors = program.render();
					}
				},
				100
			);
		} else if (status !== 'Playing' && intervalId !== null) {
			window.clearInterval(intervalId);
			intervalId = null;
		}
	}

	$: {
		if (intervalId === null && status == 'NotPlaying') {
			pixelColors = stoppedProgram.render();
		}
	}

	let gradiantIds: {[key: string]: PixelVal};
	$: {
		gradiantIds = {};
		for (const stripColors of pixelColors) {
			for (const val of stripColors) {
				gradiantIds[gradiantId(val)] = val;
			}
		}
	}
</script>

<style>
	svg {
	  display: block;
  }
	circle {
	  mix-blend-mode: lighten;
	}
</style>

<svg width="100%" viewBox={`${viewBox.xMin} ${viewBox.yMin} ${viewBox.width} ${viewBox.height}`}>
	<rect
		x={viewBox.xMin}
		y={viewBox.yMin}
		width={viewBox.width}
		height={viewBox.height}
		fill="black"
	/>
	<defs>
		{#each Object.getOwnPropertyNames(gradiantIds) as id}
			<radialGradient {id}>
				<stop offset="0%" stop-color="white" />
				<stop offset="35%" stop-color={svgColor(gradiantIds[id])} />
				<stop offset="100%" stop-color={svgColor(gradiantIds[id])} stop-opacity={0} />
			</radialGradient>
		{/each}
	</defs>
	{#if layout !== null}
		{#each layout.pixelStrips as strip, i}
			{#each strip.pixelLocs as {x, y}, j}
				<circle cx={x} cy={-y} r={1/60} fill={`url('#${gradiantId(pixelColors[i][j])}')`} />
			{/each}
		{/each}
	{/if}
</svg>