import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import vuetify from "./plugins/vuetify";
import "roboto-fontface/css/roboto/roboto-fontface.css";
import "@mdi/font/css/materialdesignicons.min.css";
import VueApexCharts from "vue-apexcharts";

Vue.component("apexChart", VueApexCharts);

Vue.config.productionTip = false;

new Vue({
  el: "#app",
  router,
  store,
  vuetify,
  VueApexCharts,
  render: (h) => h(App),
}).$mount("#app");
