window.$ = window.jQuery = require('jquery');
require('bootstrap-sass');
import Vue from 'vue';
import VueResource from 'vue-resource'
import Home from "./components/Home.vue"


Vue.use(VueResource)

const app = new Vue({
    el: '#app',
    components: {
        home: Home
    }
});