<template>
  <div>
    <div class="container">
      <div class="card" v-for="ev in events">
        <div class="card-header">
          {{ ev.publisher.name }}
        </div>
        <div class="card-body">
          {{ ev.text }}
          <div class="subtitle">
            <span class="arc-city">{{ ev.origin.name }}, {{ ev.origin.region }}</span>
            <span v-if="ev.arc_connections.length > 0">-></span>
            <span v-for="arc in ev.arc_connections" class="arc-city">{{ arc.name }}, {{ arc.region }} </span>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
//  import VueGoogleAutocomplete from 'vue-google-autocomplete'
//  import {GlobeData} from '../assets/js/GlobeData.js'
//  import {Site} from '../assets/js/Site.js'
  //var GlobeData = require('../assets/js/GlobeData.js')
  //var Site = require('../assets/js/Site.js')

  export default {
    name: 'EventList',
//    components: {
//      VueGoogleAutocomplete
//    },
    data () {
      return {
      }
    },
    watch: {
      events () {
        console.log(this.events)
      }
    },
    props: ['events'],
    mounted: function() {
//      let globe_url = 'http://127.0.0.1:8000/globekit_data/'
//      this.$http.get(local_url).then(response => {
//        GlobeData.sheetDidLoad(response.body)
////      let a = GlobeData.sheetDidLoad()
//      })
//    this.$refs.city.focus()

//      this.show = true
    },
    methods: {
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  .subtitle {
    padding-top: 10px;
  }
  .card {
    margin: 30px 0px;
  }

  .arc-city {
    border: 1px solid black;
    padding: 5px 10px;
    margin-right: 10px;
  }
</style>
