<template>
  <div>
    <div class="row">
      <header class="col-md-12">
        <nav class="navbar navbar-dark bg-dark">
          <span>
            &nbsp;
            <a class="navbar-brand" href="https://my.nettica.com"
              ><img
                class="mr-3"
                :src="require('../assets/nettica.png')"
                height="50"
                alt="nettica"
            /></a>
            <a class="navbar-brand">nettica.agent</a>
          </span>
          <v-spacer />
          <span>
            <button
              class="btn btn-primary my-2 my-sm-0"
              icon
              @click="startSettings()"
            >
              <v-icon title="Settings" dark> mdi-cog </v-icon>
              Settings
            </button>
            &nbsp;
            <button
              :disabled="addMeshDisabled"
              @click="startCreate()"
              class="btn btn-primary my-2 my-sm-0"
            >
              <v-icon title="Add Network" dark> mdi-network </v-icon>
              Add Network
            </button>
            &nbsp;
            <button class="btn btn-danger" @click="login()" type="button">
              <v-icon title="Authentication" dark> mdi-lock </v-icon>
              {{ loginText }}
            </button>
            &nbsp;
          </span>
        </nav>
      </header>
    </div>
    <div class="row" id="exp">
      <h4 style="align: center">{{ netName }}</h4>
      <div class="chart-wrapper">
        <div
          id="canvas"
          v-show="showDns"
          style="
            border: 1px solid #000000;
            background: #333;
            width: 400px;
            min-width: 200px;
            height: 300px;
            overflow-y: auto;
            padding: 5px;
            margin-right: 5px;
            margin-left: 5px;
          "
        >
          <b>DNS Queries</b>
          <div
            v-for="(query, index) in queries"
            :key="index"
            style="font-size: 12px"
          >
            {{ query }}
          </div>
        </div>
        <apexChart
          v-show="showChart"
          ref="chart1"
          id="chart1"
          dark
          width="400"
          height="300"
          type="line"
          :options="goptions"
          :series="series"
        ></apexChart>
        <d3-network
          class="network"
          :net-nodes="nodes"
          :net-links="links"
          :options="options"
        />
      </div>
      <v-expansion-panels dark>
        <v-expansion-panel
          @click="loadNetwork"
          v-for="(net, i) in nets"
          :key="i"
        >
          <v-expansion-panel-header>
            <v-switch
              dark
              class="px-0"
              color="success"
              v-model="net.enable"
              v-on:change="update(net)"
            />
            {{ net.netName }}
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <v-data-table
              dark
              :headers="headers"
              :items="net.hosts"
              :search="search"
            >
              <!-- eslint-disable-next-line -->
              <template v-slot:item.action="{ item }">
                <v-btn class="mx-2" icon @click="launchSSH(item)">
                  <v-icon dark title="SSH"> mdi-lan-connect </v-icon>
                </v-btn>
                <v-btn class="mx-2" icon @click="launchRDP(item)">
                  <v-icon dark title="Remote Desktop">
                    mdi-remote-desktop
                  </v-icon>
                </v-btn>
              </template>
            </v-data-table>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
    <v-dialog v-model="dialogCreate" max-width="550">
      <v-card>
        <v-card-title class="headline">Add Host to Mesh</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-form ref="form" v-model="valid">
                <v-text-field
                  v-model="hostName"
                  label="Host friendly name"
                  :rules="[(v) => !!v || 'host name is required']"
                  required
                />
                <v-select
                  return-object
                  v-model="netList.selected"
                  :items="netList.items"
                  item-text="text"
                  item-value="value"
                  label="Join this network"
                  :rules="[(v) => !!v || 'Network is required']"
                  single
                  persistent-hint
                  required
                />
                <v-text-field
                  v-model="endpoint"
                  label="Public endpoint for clients"
                />
                <v-text-field
                  v-model="listenPort"
                  type="number"
                  label="Listen port"
                />
              </v-form>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="!valid" color="success" @click="create(host)">
            Submit
            <v-icon right dark>mdi-check-outline</v-icon>
          </v-btn>
          <v-btn color="primary" @click="dialogCreate = false">
            Cancel
            <v-icon right dark>mdi-close-circle-outline</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogSettings" max-width="550">
      <v-card>
        <v-card-title class="headline">Settings</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-form ref="form" v-model="valid">
                <v-text-field
                  v-model="netticaHost"
                  label="Nettica Host"
                  :rules="[
                    (v) =>
                      !!v || 'host is required, eg. https://my.nettica.com/',
                  ]"
                  required
                />
                <v-text-field
                  v-model="hostId"
                  label="Host Group"
                  :rules="[(v) => !!v || 'Host Group is required']"
                  required
                />
                <v-text-field
                  v-model="apiKey"
                  label="Api Key"
                  :rules="[(v) => !!v || 'Api Key is required']"
                  required
                />
              </v-form>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="!valid" color="success" @click="saveSettings()">
            Submit
            <v-icon right dark>mdi-check-outline</v-icon>
          </v-btn>
          <v-btn color="primary" @click="dialogSettings = false">
            Cancel
            <v-icon right dark>mdi-close-circle-outline</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>
<script>
const axios = require("axios");
const fs = window.require("fs");
const D3Network = window.require("vue-d3-network");
const ipcRenderer = window.require("electron").ipcRenderer;
const spawn = window.require("child_process").spawn;
const env = require("../../env");
const ApexCharts = window.require("apexcharts");
const os = window.require("os");

var { serverUrl, appData } = env;

if (process.env.ALLUSERSPROFILE != null) {
  appData = process.env.ALLUSERSPROFILE;
}

let NetticaConfigPath = appData + "\\nettica\\nettica.json";
let NetticaClientPath = appData + "\\nettica\\nettica.conf";

if (os.platform() == "linux") {
  NetticaConfigPath = "/etc/nettica/nettica.json";
  NetticaClientPath = "/etc/nettica/nettica.conf";
}

let Meshes;
ipcRenderer.on("handle-config", (e, arg) => {
  // document window
  Meshes = arg;
  console.log("Meshes updated: ", Meshes);
});
let Queries = [];
ipcRenderer.on("handle-dns", (e, arg) => {
  let add = true;
  // Eliminate duplicates before it goes on the main list
  for (let i = 0; i < Queries.length; i++) {
    if (Queries[i] == arg) {
      add = false;
      break;
    }
  }
  if (add) Queries.push(arg);
});

export default {
  name: "MainView",
  components: {
    D3Network,
  },
  data: () => ({
    search: "",
    headers: [
      { text: "Name", value: "name" },
      { text: "Address", value: "current.address" },
      { text: "Endpoint", value: "current.endpoint" },
      { text: "Actions", value: "action", sortable: false },
    ],
    loginText: "Login",
    netticaConfig: {},
    queries: [],
    nets: [],
    net: null,
    netName: "",
    myMeshes: [],
    nodes: [],
    links: [],
    nodeSize: 30,
    selected: "",
    dialogCreate: false,
    dialogSettings: false,
    netticaHost: "",
    hostId: "",
    apiKey: "",
    oneHour: 0,
    host: null,
    valid: false,
    netList: {},
    endpoint: "",
    listenPort: 0,
    tags: [],
    hostEnable: true,
    hostName: "",
    showChart: false,
    showDns: false,
    logged_in: false,
    goptions: {
      grid: {
        show: true,
      },
      stroke: {
        width: 2,
      },
      theme: {
        mode: "dark",
      },
      title: {
        text: "",
      },
      chart: {
        id: "chart",
        toolbar: {
          show: false,
        },
        responsive: [
          {
            breakpoint: 480,
            options: {
              chart: {
                width: 200,
              },
              legend: {
                show: false,
              },
            },
          },
        ],
      },
      xaxis: {
        categories: [
          "1min",
          " ",
          " ",
          45,
          " ",
          " ",
          30,
          " ",
          " ",
          15,
          " ",
          " ",
        ],
      },
      yaxis: {
        labels: {
          formatter: function (value) {
            var result = value + " bps";
            if (value >= 1000) {
              result = ((value / 1000) >> 0) + " Kbps";
            }
            if (value >= 1000000) {
              result = (value / 1000000).toFixed(1) + " Mbps";
            }
            if (value >= 1000000000) {
              result = (value / 1000000000).toFixed(1) + " Gbps";
            }
            return result;
          },
        },
      },
    },
    series: [],
    seriesInit: false,
    chart: null,
  }),
  computed: {
    addMeshDisabled() {
      return this.logged_in == false;
    },
    options() {
      return {
        force: 2000,
        size: { w: 400, h: 300 },
        nodeSize: this.nodeSize,
        nodeLabels: true,
        linkLabels: true,
        canvas: this.canvas,
      };
    },
  },
  created() {
    this.$vuetify.theme.dark = true;
    let config = [];

    this.chart = new ApexCharts(
      window.document.querySelector("chart"),
      this.goptions
    );
    try {
      config = JSON.parse(fs.readFileSync(NetticaConfigPath));
    } catch (e) {
      console.error("nettica.json does not exist: ", e.toString());
    }

    console.log("Config = ", config);
    this.nets = config.config;

    try {
      this.netticaConfig = JSON.parse(fs.readFileSync(NetticaClientPath));
    } catch (e) {
      console.error("nettica.conf does not exist: ", e.toString());

      this.netticaConfig = {};
      this.netticaConfig.NetticaHost = serverUrl;
      this.netticaConfig.SourceAddress = "0.0.0.0";
      this.netticaConfig.Quiet = true;
      this.netticaConfig.CheckInterval = 10;
      this.netticaConfig.HostID = "";
    }
    // find the local host in a net and set the enable flag on the net
    if (this.nets != null) {
      for (let i = 0; i < this.nets.length; i++) {
        for (let j = 0; j < this.nets[i].hosts.length; j++) {
          if (this.nets[i].hosts[j].hostGroup == this.netticaConfig.HostID) {
            this.nets[i].enable = this.nets[i].hosts[j].enable;
          }
        }
      }
    }

    // setInterval(loadMeshes, 1000);
    setInterval(() => {
      this.oneHour++;
      if (this.oneHour > (60 * 60) / 5) {
        // no longer authenticated
        console.log("No longer authenticated");
        this.loginText = "Login";
        this.logged_in = false;

        this.oneHour = 0;
      }
      this.loadMeshes();
      this.loadQueries();
      if (this.net != null) {
        this.getMetrics(this, this.net.netName);
      }
    }, 5000);
  },
  methods: {
    async logout() {
      ipcRenderer.send("logout");

      alert("You have been logged out");
      this.loginText = "Login";
    },
    async login() {
      if (this.loginText == "Login") {
        ipcRenderer.sendSync("authenticate");

        this.loginText = "Logout";
        this.logged_in = true;
      } else {
        this.loginText = "Login";
        this.logged_in = false;
        await this.logout();
      }
    },
    loadMeshes() {
      if (Meshes) {
        console.log("loadMeshes - Meshes = ", Meshes);
        this.nets = Meshes;
        Meshes = null;
        console.log("loadMeshes Config = ", this.nets);
        // find the local host in a net and set the enable flag on the net
        for (let i = 0; i < this.nets.length; i++) {
          for (let j = 0; j < this.nets[i].hosts.length; j++) {
            if (
              this.nets[i].hosts[j].hostGroup == this.netticaConfig.HostID
            ) {
              this.nets[i].enable = this.nets[i].hosts[j].enable;
            }
          }
        }
      }
    },
    loadQueries() {
      if (Queries) {
        for (let i = 0; i < Queries.length; i++) {
          this.queries.unshift(Queries[i]);
          if (this.queries.length > 1000) {
            this.queries.pop();
          }
          this.showDns = true;
        }
        Queries = [];
      }
    },
    launchSSH(item) {
      console.log("SSH Item: ", item);
      if (os.platform == "win32") {
        spawn("ssh", [item.name], {
          windowsHide: false,
          detached: true,
          shell: true,
        });
      } else {
        if (process.arch == "arm") {
          var child = spawn("lxterminal", ["-e", "ssh", item.name], {
            foreground: true,
            detached: true,
          });
          console.log("child = %s", child);
        } else {
          var child2 = spawn(
            "exo-open",
            ["--launch", "TerminalEmulator", "ssh", item.name],
            {
              foreground: true,
              detached: true,
              shell: true,
            }
          );
          console.log("child = %s", child2);
        }
      }
    },
    launchRDP(item) {
      console.log("RDP Item", item);
      if (os.platform == "win32") {
        spawn("mstsc.exe", ["/v:" + item.name]);
      } else {
        var child = spawn("rdesktop", ["-f", item.name]);
        console.log("child = %s", child);
      }
    },
    async startCreate() {
      this.host = {
        name: "",
        email: "",
        enable: true,
        tags: [],
        current: {},
      };

      // if (Meshes != null) {
      //  this.nets = Meshes;
      //}
      await this.getMeshList();

      this.netList = { selected: { text: "", value: "" }, items: [] };

      var selected = 0;
      for (let i = 0; i < this.myMeshes.length; i++) {
        this.netList.items[i] = {
          text: this.myMeshes[i].netName,
          value: this.myMeshes[i].id,
        };
        if (this.netList.items[i].text == this.host.netName) {
          selected = i;
        }
      }

      this.netList.selected = this.netList.items[selected];
      this.dialogCreate = true;
    },
    async stopService(netName) {
      console.log("stopService %s", netName);
      axios
        .delete("http://127.0.0.1:53280/service/" + netName + "/", {
          headers: {},
        })
        .then((response) => {
          console.log("stopService response = ", response);
        });
    },
    getMetrics(that, net) {
      let stats;
      axios
        .get("http://127.0.0.1:53280/stats/" + net, {
          headers: {},
        })
        .then((response) => {
          stats = response.data;
          if (stats[net] == null) {
            console.log("Response did not contain a result");
          } else {
            console.log("Stats = ", stats);
            if (this.series.length == 0 || this.seriesInit) {
              // this.series = [response.data.length];
              console.log("seriesInit = %s", this.seriesInit);
              this.seriesInit = false;
              that.series[0] = {
                name: "Sent",
                data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                last: stats[net].Send,
                head: 0,
                buckets: 12,
              };
              that.series[1] = {
                name: "Received",
                data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
                last: stats[net].Recv,
                head: 0,
                buckets: 12,
              };
            }
            for (let i = 1; i < 12; i++) {
              that.series[0].data[i - 1] = that.series[0].data[i];
              that.series[1].data[i - 1] = that.series[1].data[i];
            }
            that.series[0].data[11] = stats[net].Send - that.series[0].last;
            that.series[0].head = that.series[0].head + 1;
            that.series[0].last = stats[net].Send;
            that.series[1].data[11] = stats[net].Recv - that.series[1].last;
            that.series[1].head = that.series[1].head + 1;
            that.series[1].last = stats[net].Recv;
            console.log("Send %d %d", that.series[0].head, that.series[0].last);
            console.log("Recv %d %d", that.series[1].head, that.series[1].last);

            that.$refs.chart1.updateSeries([that.series[0], that.series[1]]);
          }
        });
      // .catch(() => {});
      //       {
      // name: "",
      // data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      // head: 0,
      // buckets: 12,
    },
    create(host) {
      console.log("Create Host: ", host);
      // get a new keypair from the keystore for this host
      try {
        axios
          .get("http://127.0.0.1:53280/keys/", { headers: {} })
          .then((response) => {
            console.log("Public Key = ", response.data);
            host.current.publicKey = response.data.Public;
            host.current.privateKey = "";
          });
      } catch (e) {
        console.log("Error getting keypair: ", e);
      }

      this.host.name = this.hostName;
      this.host.current.endpoint = this.endpoint;
      this.host.current.listenPort = this.listenPort;
      this.host.current.listenPort = parseInt(this.host.current.listenPort, 10);
      this.host.netName = this.netList.selected.text;
      this.host.netid = this.netList.selected.value;
      this.host.hostGroup = this.netticaConfig.HostID;
      this.dialogCreate = false;
      console.log("createHost Host = ", this.host);
      this.createHost(host);
    },
    createHost(host) {
      let accessToken = ipcRenderer.sendSync("accessToken");
      let body = {
        grant_type: "authorization_code",
        client_id: "Dz2KZcK8BT7ELBb91VnFzg8Xg1II6nLb",
        state: accessToken,
        code: accessToken,
        redirect_uri: serverUrl,
      };
      axios
        .post(serverUrl + "/api/v1.0/auth/token", body, {
          headers: {
            Authorization: "Bearer " + accessToken,
          },
        })
        .then(() => {
          axios
            .post(serverUrl + "/api/v1.0/host", host, {
              headers: {
                Authorization: "Bearer " + accessToken,
              },
            })
            .then((response) => {
              let host = response.data;
              console.log("Host = ", host);
              let changed = false;
              console.log("Checking nettica.conf for updates");
              if (
                this.netticaConfig.HostID == "" ||
                this.nets == null ||
                this.nets.length == 0
              ) {
                this.netticaConfig.HostID = host.hostGroup;
                this.netticaConfig.ApiKey = host.apiKey;
                changed = true;
                console.log(
                  "this.netticaConfig changed = ",
                  this.netticaConfig
                );
              }
              if (changed) {
                console.log("Writing new nettica.conf");
                try {
                  fs.writeFileSync(
                    NetticaClientPath,
                    JSON.stringify(this.netticaConfig)
                  );
                  console.log(
                    "nettica.conf has been updated :",
                    this.netticaConfig
                  );
                } catch (e) {
                  console.log("Error updating config file: %s", e);
                  if (os.platform() != "win32") {
                    // If we're not on windows, try to sudo cp it
                    try {
                      fs.writeFileSync(
                        "nettica.conf.tmp",
                        JSON.stringify(this.netticaConfig)
                      );
                      spawn(
                        "sudo",
                        ["mv", "nettica.conf.tmp", NetticaClientPath],
                        { windowsHide: false }
                      );
                    } catch (e) {
                      {
                        console.log("Could not write nettica.conf. %s", e);
                      }
                    }
                  }
                }
              }
            })
            .catch((error) => {
              if (error) console.error(error);
            });
        })
        .catch((error) => {
          if (error) throw new Error(error);
        });
    },
    async getMeshList() {
      return new Promise((resolve, reject) => {
        let accessToken = ipcRenderer.sendSync("accessToken");
        if (!accessToken) return reject(new Error("no access token available"));
        let body = {
          grant_type: "authorization_code",
          client_id: "Dz2KZcK8BT7ELBb91VnFzg8Xg1II6nLb",
          state: accessToken,
          code: accessToken,
          redirect_uri: serverUrl,
        };
        axios
          .post(serverUrl + "/api/v1.0/auth/token", body, {
            headers: {
              Authorization: "Bearer " + accessToken,
            },
          })
          .then(() => {
            axios
              .get(serverUrl + "/api/v1.0/net", {
                headers: {
                  Authorization: "Bearer " + accessToken,
                },
              })
              .then((response) => {
                this.myMeshes = response.data;
                resolve();
              })
              .catch((error) => {
                if (error) console.error(error);
              });
          })
          .catch((error) => {
            if (error) throw new Error(error);
          });
      });
    },
    async update(net) {
      return new Promise((resolve, reject) => {
        console.log("Update Net: ", net);
        let accessToken = ipcRenderer.sendSync("accessToken");
        if (!accessToken) ipcRenderer.sendSync("authenticate");
        if (!accessToken) accessToken = ipcRenderer.sendSync("accessToken");
        let body = {
          grant_type: "authorization_code",
          client_id: "Dz2KZcK8BT7ELBb91VnFzg8Xg1II6nLb",
          state: accessToken,
          code: accessToken,
          redirect_uri: serverUrl,
        };
        let host = null;
        for (let i = 0; i < net.hosts.length; i++) {
          if (net.hosts[i].hostGroup == this.netticaConfig.HostID) {
            host = net.hosts[i];
            break;
          }
        }
        if (host != null) {
          host.enable = !host.enable;
        } else {
          return reject(new Error("local host not found in net"));
        }
        axios
          .post(serverUrl + "/api/v1.0/auth/token", body, {
            headers: {
              Authorization: "Bearer " + accessToken,
            },
          })
          .then(() => {
            axios
              .patch(serverUrl + "/api/v1.0/host/" + host.id, host, {
                headers: {
                  Authorization: "Bearer " + accessToken,
                },
              })
              .then(() => {
                if (!host.enable) {
                  this.stopService(net.netName);
                }
                resolve();
              })
              .catch((error) => {
                if (error) console.error(error);
              });
          })
          .catch((error) => {
            if (error) throw new Error(error);
          });
      });
    },
    startSettings() {
      this.dialogSettings = true;

      this.netticaHost = this.netticaConfig.NetticaHost;
      this.hostId = this.netticaConfig.HostID;
      this.apiKey = this.netticaConfig.ApiKey;
    },
    saveSettings() {
      this.netticaConfig.NetticaHost = this.netticaHost;
      this.netticaConfig.HostID = this.hostId;
      this.netticaConfig.ApiKey = this.apiKey;
      this.dialogSettings = false;
      this.saveConfig();
    },
    loadNetwork(evt) {
      let name = evt.currentTarget.innerText;
      let x = 0;
      let l = 0;
      this.links = [];
      this.nodes = [];
      let net_hosts = [];
      for (let i = 0; i < this.nets.length; i++) {
        if (this.nets[i].netName == name) {
          this.net = this.nets[i];
          break;
        }
      }
      this.seriesInit = true;
      this.netName = this.net.netName;
      this.showChart = true;
      // this.getMetrics(this.net.netName);

      for (let i = 0; i < this.net.hosts.length; i++) {
        if (this.net.hosts[i].netName == name) {
          net_hosts[x] = this.net.hosts[i];
          this.nodes[x] = {
            id: x,
            name: this.net.hosts[i].name /* _color:'gray'*/,
          };
          x++;
        }
      }
      for (let i = 0; i < net_hosts.length; i++) {
        for (let j = 0; j < net_hosts.length; j++) {
          if (i != j && net_hosts[j].current.endpoint != "") {
            this.links[l] = { sid: i, tid: j, _color: "white" };
            l++;
          }
        }
      }
    },
  },
};
</script>
<style>
@import "~bootstrap/dist/css/bootstrap.min.css";
body {
  background: #333;
  color: white;
}

::-webkit-scrollbar {
  overflow: auto;
}
::-webkit-scrollbar-track {
  background: #444;
}
::-webkit-scrollbar-thumb {
  background: #888;
}
::-webkit-scrollbar-corner {
  background: #333;
}
text {
  font-size: 12px;
  color: orange;
  fill: orange;
}
.node {
  fill: #336699;
  stroke: #5b81a7;
}
/*
.link {
  color: white;
}
*/
.net-svg {
  margin: 0 auto;
}
.network {
  display: flex;
  justify-content: center;
}

h4 {
  margin: 20px;
  display: flex;
  justify-content: center;
  font-size: 18px;
}
div.chart-wrapper {
  display: flex;
  align-items: left;
  justify-content: left;
}
</style>
