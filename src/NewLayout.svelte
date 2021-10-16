<script lang="ts">
  import Layout from './Layout.svelte';
  import {parseCode} from './layout';

  const SAMPLE_LAYOUT_CODE =
`SET PIXELS_PER_METER 60

STRIP AT -1m, 0m
SEGMENT 300 pixels

STRIP AT 1m, 0m
SEGMENT 300 pixels
`;
  let layoutCode = SAMPLE_LAYOUT_CODE;
  let layout = null;
  let layoutCodeError = null;
  $: {
    try {
      layout = parseCode(layoutCode);
      layoutCodeError = null;
    } catch (err) {
      layout = null;
      layoutCodeError = err;
    }
  }
</script>

<style>
  .layout-code-edit {
    font-family: monospace;
  }
  .layout-code-edit.layout-code-valid {
    height: 640px;
  }
  .layout-code-edit.layout-code-invalid {
    height: 320px;
  }
  .layout-code-error {
    height: 320px;
    font-family: monospace;
    background-color: #f5f5f5;
  }
</style>

<div class="container">
  <div class="block">
    <input class="input is-large" type="text" placeholder="Layout name...">
  </div>
  <div class="columns">
    <div class="column">
      <Layout />
    </div>
    <div class="column">
      <textarea
        class="textarea has-fixed-size layout-code-edit"
        class:layout-code-valid={layoutCodeError === null}
        class:layout-code-invalid={layoutCodeError !== null}
        bind:value={layoutCode}
      />
      {#if layoutCodeError !== null}
      <textarea
        class="textarea layout-code-error has-fixed-size is-danger"
        readonly
        value={layoutCodeError.message}
      />
      {/if}
    </div>
  </div>
</div>
