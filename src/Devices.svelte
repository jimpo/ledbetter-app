<script lang="ts">
  export let onSearch: () => void;
</script>

<div class="container">
  <div>
    <button class="button is-fullwidth" on:click={onSearch}>Search for devices</button>
  </div>
</div>
