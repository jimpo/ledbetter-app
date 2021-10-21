<script lang="ts">
  import type {layout as layoutLib} from 'ledbetter-common';

  export let layout: layoutLib.Layout | null;
  export let width: number;
  export let height: number;

  let xTrans: (x: number) => number;
  let yTrans: (y: number) => number;
  $: {
    if (layout !== null) {
      const bounds = layout.boundingBox();
      const boundsHeight = bounds.yMax - bounds.yMin;
      const boundsWidth = bounds.xMax - bounds.xMin;
      let scale: number;
      if (boundsHeight > 0 || boundsWidth > 0) {
        const buffer = 20;
        if (boundsWidth * height < width * boundsHeight) {
          // display region is wider than the boundingBox
          scale = Math.max(height - 2 * buffer, 0) / boundsHeight;
        } else {
          // boundingBox is wider than the display region
          scale = Math.max(width - 2 * buffer, 0) / boundsWidth;
        }
      } else {
        scale = 0;
      }

      const xShift = (width - scale * (bounds.xMin + bounds.xMax)) / 2;
      const yShift = (height + scale * (bounds.yMin + bounds.yMax)) / 2;

      xTrans = (x) => xShift + x * scale;
      yTrans = (y) => yShift - y * scale;
    } else {
      xTrans = (_) => 0;
      yTrans = (_) => 0;
    }
  }
</script>

<svg width={width} height={height}>
{#if layout !== null}
{#each layout.pixelStrips as strip}
{#each strip.pixelLocs as {x, y}}
 <circle cx="0" cy="0" r="1" fill="black" />
 <circle cx={xTrans(x)} cy={yTrans(y)} r="1" fill="black" />
{/each}
{/each}
{/if}
</svg>
