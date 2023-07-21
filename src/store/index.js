/*
import Vue from "vue";
import Vuex from "vuex";

import { createPersistedState, createSharedMutations } from "vuex-electron";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    count: 0,
    nets: [],
  },

  actions: {
    increment(store) {
      store.commit("increment");
    },
    decrement(store) {
      store.commit("decrement");
    },
  },

  mutations: {
    set(state) {
      this.nets = state;
    },
  },

  plugins: [createPersistedState(), createSharedMutations()],
  strict: process.env.NODE_ENV !== "production",
});
*/

import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  modules: {},
});
