<template>
    <div>
        <h1 style="float: left; padding-left: 30%;">Globekit Data Entry CMS</h1>
        <div class="row" style="width: 100%">
            <div class="col-6" v-if="events && !showGlobe">
                <h3>Events List</h3>
                <event_list :events="events"></event_list>
            </div>
            <div class="col-3" v-if="events && showGlobe">
                <h3>Events List</h3>
                <event_list :events="events"></event_list>
            </div>
            <div class="col-6" v-if="!events">
                Events loading...
            </div>
            <div class="col-6" v-if="!showGlobe">
                <h3>Create new event</h3>
                <entry_form :publishers="publishers" v-on:submit="submit"></entry_form>
                <button class="btn btn-primary" v-on:click="loadGlobe">Show Globe</button>
            </div>
            <div class="col-9" v-if="showGlobe">
                <div class="globekit-canvas-container">
                    <canvas id="globekit-canvas" width="1024" height="1024"></canvas>
                </div>
                <div id="globe-key">
                    <ul id="globe-key-list"></ul>
                </div>
                <button class="btn btn-primary" v-on:click="showForm">Show Form</button>
            </div>
        </div>
    </div>

</template>

<script>
  import EntryForm from './EntryForm.vue'
  import EventList from './EventList.vue'

  export default {
    name: 'Home',
    components: {
      entry_form: EntryForm,
      event_list: EventList
    },
    data () {
      return {
        b: 'Welcome to Your Vue.js App',
        events: null,
        publishers: [],
        showGlobe: false,
        urls: {
          events: 'http://globekit-cms.appspot.com/globekit_data/',
          publishers: 'http://globekit-cms.appspot.com/publishers/'
        }
      }
    },
    mounted: function() {
      this.$http.get(this.urls.events).then(response => {
        let data = response.body
        this.events = data.events
      })
      this.$http.get(this.urls.publishers).then(response => {
        let data = response.body
        this.publishers = data
      })
    },
    methods: {
      submit (e) {
        this.events = e
      },
      showForm () {
        this.showGlobe = false
      },
      loadGlobe () {
        this.showGlobe = true
        // Add additional globe loading steps here
      }
    }
  }
</script>

<style scoped>
    .btn {
        margin-top: 30px;
        display: inline-block;
    }
    .globekit-canvas-container {
        display: inline-block;
        width: 100%;
        height: 1100px;
        border: 1px solid black;
    }
</style>