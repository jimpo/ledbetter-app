<script lang="ts">
  import Layout from './Layout.svelte';
</script>

<style>
  .layout-code-edit {
    height: 640px;
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
      <textarea class="textarea has-fixed-size layout-code-edit" placeholder="Directives"></textarea>
    </div>
  </div>
</div>
