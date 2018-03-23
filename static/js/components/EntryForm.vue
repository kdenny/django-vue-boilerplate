<template>
  <div class="container" style="width: 100%" v-if="publishers">
    <form>
      <div class="form-group">
        <label for="exampleSelect1">Select Publisher</label>
        <v_select id="exampleSelect1" v-if="publishers.length > 0" v-model="form.publisher" label="name" :options="publishers"></v_select>
        <v_select id="exampleSelect1" v-if="publishers.length == 0" label="name" :options="['Publishers loading']"></v_select>
      </div>
      <div class="form-group">
        <label for="city">Enter Origin</label>
        <vue-google-autocomplete
          id="city"
          classname="form-control"
          placeholder="Start typing"
          :types="'(cities)'"
          v-on:placechanged="selectOrigin"
        >
        </vue-google-autocomplete>
      </div>
      <div class="form-group">
        <label for="city2" style="width: 100%; display: block;">Arc Connections</label>
        <div class="card arc-connection" v-if="form.arc_connections.length > 0" v-for="c in form.arc_connections">
          <div class="card-body">
            {{ c.name }}
          </div>
        </div>
        <vue-google-autocomplete
          id="city2"
          ref="arcs"
          classname="form-control"
          placeholder="Start typing"
          :types="'(cities)'"
          v-on:placechanged="addConnection"
        >
        </vue-google-autocomplete>
      </div>
      <div class="form-group">
        <label for="categorySelect">Select Category</label>
        <v_select id="categorySelect" v-model="form.category" :options="options.category"></v_select>
      </div>
      <div class="form-group">
        <label for="exampleTextarea">Enter event text</label>
        <textarea class="form-control" id="exampleTextarea" rows="3" placeholder="Start typing" v-model="form.text"></textarea>
      </div>
      <div class="form-group">
        <label for="animationSelect">Select Animation</label>
        <v_select id="animationSelect" v-model="form.animation" :options="options.animation"></v_select>
      </div>
      <div class="form-group">
        <label for="sideSelect" style="">Select Display Side</label>
        <div id="sideSelect">
          <div class="form-check" style="float: left;">
            <input class="form-check-input" type="radio" name="exampleRadios" id="exampleRadios1" value="right" v-model="form.side" checked>
            <label class="form-check-label" for="exampleRadios1">
              Right
            </label>
          </div>
          <div class="form-check" style="float: left;">
            <input class="form-check-input" type="radio" name="exampleRadios" id="exampleRadios2" value="left" v-model="form.side">
            <label class="form-check-label" for="exampleRadios2">
              Left
            </label>
          </div>
        </div>
        <!--<v-select id="sideSelect" v-model="form.side" :options="options.side"></v-select>-->
      </div>
      <button class="btn btn-primary" v-on:click="submitForm">Submit</button>
    </form>
  </div>

</template>

<script>
  import VueGoogleAutocomplete from 'vue-google-autocomplete'
  import vSelect from 'vue-select'
//  import {GlobeData} from '../assets/js/GlobeData.js'
//  import {Site} from '../assets/js/Site.js'
  //var GlobeData = require('../assets/js/GlobeData.js')
  //var Site = require('../assets/js/Site.js')

  export default {
    name: 'HelloWorld',
    components: {
      VueGoogleAutocomplete,
      v_select: vSelect
    },
    data () {
      return {
        msg: 'Welcome to Your Vue.js App',
        arcs: '',
        form: {
          publisher: null,
          origin: null,
          arc_connections: [],
          category: null,
          text: null,
          animation: null,
          side: null
        },
        options: {
          category: [
            'Subscriptions',
            'Entitlements',
            'Digital Conversions',
            'Adblocking'
          ],
          animation: [
            'Takeover',
            'Dot',
            'Arc'
          ],
          side: [
            'right',
            'left'
          ]
        }
      }
    },
    props: ['publishers'],
    mounted: function() {
      var me = this

//      let globe_url = 'http://127.0.0.1:8000/globekit_data/'
//      this.$http.get(local_url).then(response => {
//        GlobeData.sheetDidLoad(response.body)
////      let a = GlobeData.sheetDidLoad()
//      })
//    this.$refs.city.focus()

      this.show = true
    },
    methods: {
      /**
       * When the location found
       * @param {Object} addressData Data of the found location
       * @param {Object} placeResultData PlaceResult object
       * @param {String} id Input container ID
       */
      getAddressData (addressData, placeResultData, id) {
        let city = {
          latitude: addressData.latitude,
          longitude: addressData.longitude
        }
        if (addressData.country === 'United States') {
          city.name = addressData.locality
          city.region = addressData.administrative_area_level_1
        } else {
          if (addressData.locality) {
            city.name = addressData.locality
            city.region = addressData.country
          } else {
            city.name = addressData.administrative_area_level_1
            city.region = addressData.country
          }
        }

        return city
      },
      selectOrigin (addressData, placeResultData, id) {
        let cloc = this.getAddressData(addressData, placeResultData, id)
        this.form.origin = cloc
        this.arcText = null
        console.log(this.$refs["arcs"])
        this.$refs["arcs"].$el.value = '';
      },
      addConnection(addressData, placeResultData, id) {
        let cloc = this.getAddressData(addressData, placeResultData, id)
        this.form.arc_connections.push(cloc)
        this.arcText = null
        console.log(this.$refs["arcs"])
        this.$refs["arcs"].$el.value = '';
      },
      selectPub (p, d) {

        console.log(p)
        console.log(d)
        console.log(this.form)

      },
      submitForm () {
        console.log(this.form)
        console.log(this.arcText)
//      let url = 'http://globekit-cms.appspot.com/publishers/'
        let local_url = 'http://127.0.0.1:8000/events/'
        this.$http.post(local_url, this.form).then(response => {
          let data = response.body
          console.log(data)
          this.$emit('submit', data)
        })
      }
    }
  }
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
  h1, h2 {
    font-weight: normal;
  }
  ul {
    list-style-type: none;
    padding: 0;
  }
  li {
    display: inline-block;
    margin: 0 10px;
  }
  a {
    color: #42b983;
  }

  .arc-connection {
    width: 33%;
    float: left;
    margin: 20px 0px;
  }

  .form-check {
    float: left;
    display: block;
    width: 100%
  }

  .container {
    border: 1px solid black;
    padding: 10px 40px;
  }
</style>
