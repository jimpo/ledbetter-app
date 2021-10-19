<script lang="ts">
  import Layout from './Layout.svelte';
  import {parseCode} from './layout';

  const SAMPLE_LAYOUT_CODE =
`SET PIXELS_PER_METER 60

STRIP AT -1m, 0m
TURN 90 degrees
SEGMENT 150 pixels

STRIP AT 1m, 0m
TURN 90 degrees
SEGMENT 150 pixels
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

  .action-buttons {
    text-align: right;
  }
</style>

<div class="container">
  <nav class="breadcrumb" aria-label="breadcrumbs">
    <ul>
      <li><a href="/layouts">Layouts</a></li>
      <li class="is-active"><a href="/layouts/new" aria-current="page">New Layout</a></li>
    </ul>
  </nav>

  <div class="block">
    <div class="columns">
      <div class="column is-three-quarters">
        <input class="input is-large" type="text" placeholder="Layout name...">
      </div>
      <div class="column action-buttons">
        <button class="button is-large is-primary is-outlined" title="Create">
          <span class="icon">
            <i class="fas fa-check"></i>
          </span>
        </button>
      </div>
    </div>
  </div>

  <div class="columns">
    <div class="column">
      <Layout width={640} height={640} layout={layout} />
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
