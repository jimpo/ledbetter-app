<script lang="ts">
  import {Router, Route} from "svelte-navigator";
  import 'bulma/css/bulma.css';
  import '@fortawesome/fontawesome-free/scss/solid.scss';
  import '@fortawesome/fontawesome-free/scss/fontawesome.scss';

  import Devices from './Devices.svelte';
  import Drivers from './Drivers.svelte';
  import NewLayout from './NewLayout.svelte';
</script>

<main class="section">
  <Router>
    <Route path="devices/" component={Devices}/>
    <Route path="drivers/" component={Drivers}/>
    <Route path="layouts/new" component={NewLayout}/>
  </Router>
</main>
