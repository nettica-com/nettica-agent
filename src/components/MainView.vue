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
              <v-icon title="Settings" dark> mdi-cog-outline </v-icon>
              Settings
            </button>
            &nbsp;
            <button
              :disabled="addNetDisabled"
              @click="startCreate()"
              class="btn btn-primary my-2 my-sm-0"
            >
              <img
                :src="require('../assets/hub.svg')"
                height="26"
                alt="nettica"
              />
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
    <div class="row">
      <v-expansion-panels dark>
        <v-expansion-panel
          @click="loadNetwork"
          v-for="(net, i) in nets"
          :key="i"
        >
          <v-expansion-panel-header>
            <v-btn
              class="px-0 mx-0"
              max-width="50px"
              color="red"
              icon
              flex="0"
              shrink="0"
              @click="deleteVPN(net)"
              :disabled="net.enable"
              title="Delete Network"
            >
              <v-icon dark width="30px" style="width: 30px">
                mdi-delete-outline
              </v-icon>
            </v-btn>
            <v-switch
              dark
              class="px-0"
              color="success"
              v-model="net.enable"
              v-on:change="EnableVPN(net)"
            />
            {{ net.netName }}
            <v-spacer />
          </v-expansion-panel-header>
          <v-expansion-panel-content>
            <table class="vpntable">
              <th>ssh</th>
              <th>rdp</th>
              <th>name</th>
              <th class="hidden-xs-only">address</th>
              <tr v-for="(vpn, x) in net.vpns" :key="x">
                <td>
                  <v-btn
                    class="mx-2"
                    icon
                    @click="launchSSH(net, vpn)"
                    title="SSH"
                    :disabled="!vpn.current.hasSSH"
                  >
                    <v-icon dark> mdi-lan-connect </v-icon>
                  </v-btn>
                </td>
                <td>
                  <v-btn
                    class="mx-2"
                    icon
                    @click="launchRDP(net, vpn)"
                    title="Remote Desktop"
                    :disabled="!vpn.current.hasRDP"
                  >
                    <v-icon dark> mdi-remote-desktop </v-icon>
                  </v-btn>
                </td>
                <td>
                  {{ vpn.name }}
                </td>
                <td class="hidden-xs-only">
                  {{ vpn.current.address[0] }}
                </td>
              </tr>
            </table>
          </v-expansion-panel-content>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
    <h4 style="align: center">{{ netName }}</h4>
    <v-row id="exp" dense>
      <v-col cols="4" class="ml-4">
        <div class="chart-wrapper" v-show="showChart">
          <apexChart
            v-show="showChart"
            ref="chart1"
            id="chart1"
            dark
            type="line"
            :width="330"
            :height="280"
            :options="goptions"
            :series="series"
          ></apexChart>
        </div>
      </v-col>
      <v-col col="5" class="mx-0">
        <d3-network
          class="network"
          :height="300"
          :net-nodes="nodes"
          :net-links="links"
          :options="options"
        />
      </v-col>
      <v-col cols="3" class="mx-4">
        <div>
          <b v-show="showDns" class="mb-0">DNS&nbsp;Queries</b>
          <div
            id="canvas"
            v-show="showDns"
            style="
              border: 1px solid #000000;
              border-radius: 10px;
              background: #444;
              width: 350px;
              min-width: 200px;
              height: 276px;
              overflow-y: auto;
              margin-bottom: 10px;
            "
          >
            <div
              v-for="(query, index) in queries"
              :key="index"
              style="font-size: 12px; padding-left: 5px"
            >
              {{ query }}
            </div>
          </div>
        </div>
      </v-col>
    </v-row>
    <v-dialog v-model="dialogCreate" max-width="550">
      <v-card>
        <v-card-title class="headline">Add to Network</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-form ref="form" v-model="valid">
                <v-text-field
                  v-model="vpnName"
                  label="DNS name"
                  :rules="[(v) => !!v || 'dns name is required']"
                  required
                />
                <v-select
                  return-object
                  v-model="acntList.selected"
                  :items="acntList.items"
                  item-text="text"
                  item-value="value"
                  label="For this account"
                  :rules="[(v) => !!v || 'Account is required']"
                  single
                  persistent-hint
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
                <table width="100%">
                  <tr>
                    <td>
                      <v-switch
                        v-model="vpn.current.syncEndpoint"
                        label="Sync Endpoint"
                      />
                    </td>
                    <td>
                      <v-switch v-model="vpn.current.hasSSH" label="SSH" />
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <v-switch
                        v-model="vpn.current.upnp"
                        label="Enable UPnP"
                      />
                    </td>
                    <td>
                      <v-switch
                        v-model="vpn.current.hasRDP"
                        label="Remote Desktop"
                      />
                    </td>
                  </tr>
                  <tr>
                    <td colspan="2">
                      <v-switch
                        v-model="vpn.current.enableDns"
                        label="Enable Nettica DNS"
                      />
                    </td>
                  </tr>
                </table>
              </v-form>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="!valid" color="success" @click="create(vpn)">
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
                  v-model="device.name"
                  label="Friendly name"
                  :rules="[(v) => !!v || 'friendly name is required']"
                  required
                />
                <v-text-field
                  v-model="device.server"
                  label="Server"
                  :rules="[
                    (v) =>
                      !!v || 'server is required, eg. https://my.nettica.com/',
                  ]"
                  required
                />
                <v-text-field
                  v-model="device.id"
                  label="Device ID"
                  :rules="[(v) => !!v || 'Device ID is required']"
                  required
                />
                <v-text-field
                  v-model="device.apiKey"
                  label="Api Key"
                  :rules="[(v) => !!v || 'Api Key is required']"
                  required
                />
                <v-switch
                  v-model="autoLaunch"
                  label="Launch at start-up"
                  @click="setAutoLaunch()"
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
const AutoLaunch = window.require("auto-launch");
// query the value of autoLaunch
const autoLauncher = new AutoLaunch({
  name: "netticaagent",
  path: process.execPath,
});

var { serverUrl, appData, apiIdentifier, auth0Domain, clientId } = env;

if (process.env.ALLUSERSPROFILE != null) {
  appData = process.env.ALLUSERSPROFILE;
}

let NetticaConfigPath = appData + "\\nettica\\nettica.json";
let NetticaClientPath = appData + "\\nettica\\nettica.conf";

if (os.platform() == "linux") {
  NetticaConfigPath = "/etc/nettica/nettica.json";
  NetticaClientPath = "/etc/nettica/nettica.conf";
}

if (os.platform() == "darwin") {
  NetticaConfigPath = "/usr/local/etc/nettica/nettica.json";
  NetticaClientPath = "/usr/local/etc/nettica/nettica.conf";
}

let Nets;
ipcRenderer.on("handle-config", (e, arg) => {
  // document window
  Nets = arg;
  console.log("Nets updated: ", Nets);
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
    device: {
      server: serverUrl,
      apiid: apiIdentifier,
      authdomain: auth0Domain,
      clientid: clientId,
      appData: appData,
      name: os.hostname(),
    },
    queries: [],
    nets: [],
    net: null,
    vpn: {
      name: "",
      accountid: "",
      email: "",
      enable: true,
      tags: [],
      current: {
        syncEndpoint: false,
        upnp: false,
        enableDns: false,
        hasSSH: false,
        hasRDP: false,
      },
    },
    netName: "",
    myNets: [],
    netList: {},
    myAccounts: [],
    acntList: {},
    nodes: [],
    links: [],
    nodeSize: 30,
    selected: "",
    dialogCreate: false,
    dialogSettings: false,
    autoLaunch: false,
    server: "",
    deviceId: "",
    deviceName: os.hostname(),
    apiKey: "",
    oneHour: 0,
    valid: false,
    endpoint: "",
    listenPort: 0,
    tags: [],
    vpnEnable: true,
    vpnName: "",
    showChart: false,
    showDns: false,
    logged_in: false,
    timer_running: false,
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
                borderRadius: 10,
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
    addNetDisabled() {
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
      this.device = JSON.parse(fs.readFileSync(NetticaClientPath));
    } catch (e) {
      console.error("nettica.conf does not exist: ", e.toString());

      this.device = {};
      this.device.server = serverUrl;
      this.device.sourceAddress = "0.0.0.0";
      this.device.quiet = true;
      this.device.checkInterval = 10;
      this.device.id = "";
    }

    this.device.appData = appData;
    this.device.authdomain = auth0Domain;
    this.device.clientid = clientId;
    this.device.apiid = apiIdentifier;
    this.device.name = os.hostname();
    this.device.os = os.platform();
    this.device.arch = os.arch();
    console.log("Device = ", this.device);
    // find the local host in a net and set the enable flag on the net
    if (this.nets != null) {
      for (let i = 0; i < this.nets.length; i++) {
        for (let j = 0; j < this.nets[i].vpns.length; j++) {
          if (this.nets[i].vpns[j].deviceid == this.device.id) {
            this.nets[i].enable = this.nets[i].vpns[j].enable;
          }
        }
      }
    }

    autoLauncher.isEnabled().then((isEnabled) => {
      this.autoLaunch = isEnabled;
    });

    // setInterval(loadNets, 1000);
    setInterval(() => {
      this.oneHour++;
      if (this.oneHour > (60 * 60) / 5) {
        // no longer authenticated
        console.log("No longer authenticated");
        this.loginText = "Login";
        this.logged_in = false;

        this.oneHour = 0;
      }
      this.loadNets();
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
    loadNets() {
      if (Nets) {
        console.log("loadNets - Nets = ", Nets);
        this.nets = Nets;
        Nets = null;
        console.log("loadNets Config = ", this.nets);
        // find the local host in a net and set the enable flag on the net
        for (let i = 0; i < this.nets.length; i++) {
          for (let j = 0; j < this.nets[i].vpns.length; j++) {
            if (this.nets[i].vpns[j].deviceid == this.device.id) {
              this.nets[i].enable = this.nets[i].vpns[j].enable;
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
    launchSSH(net, item) {
      console.log("SSH Item: ", item, net);
      var name = item.name;
      if (this.isDnsEnabled(net) == false) {
        var parts = item.current.address[0].split("/");
        name = parts[0];
      }
      if (os.platform == "win32") {
        console.log("item = ", item);
        spawn("cmd.exe", ["/c", "wt.exe", "-w", "ssh", "nt", "ssh.exe", name], {
          windowsHide: true,
          detached: true,
          shell: false,
        });
      } else if (os.platform == "linux") {
        var child = spawn(
          "x-terminal-emulator",
          ["--new-tab", "-e", "ssh", name],
          {
            foreground: true,
            detached: true,
          }
        );
        console.log("child = ", child);
        if (child.exitCode != null && child.exitCode != 0) {
          var child2 = spawn(
            "exo-open",
            ["--launch", "TerminalEmulator", "ssh", name],
            {
              foreground: true,
              detached: true,
              shell: true,
            }
          );
          console.log("child2 = ", child2);
        }
      } else if (os.platform == "darwin") {
        child = spawn("open", ["-a", "Terminal", "ssh", name], {
          foreground: true,
          detached: true,
        });
        console.log("child = ", child);
      }
    },
    isDnsEnabled(net) {
      var enabled = false;
      for (let i = 0; i < net.vpns.length; i++) {
        if (
          net.vpns[i].deviceid == this.device.id &&
          net.vpns[i].current.enableDns == true
        ) {
          enabled = true;
          break;
        }
      }
      return enabled;
    },
    launchRDP(net, item) {
      console.log("RDP Item", item, net);
      var name = item.name;
      if (this.isDnsEnabled(net) == false) {
        var parts = item.current.address[0].split("/");
        name = parts[0];
      }
      if (os.platform == "win32") {
        spawn("mstsc.exe", ["/v:" + name]);
      } else {
        var child = spawn("rdesktop", ["-f", name]);
        console.log("child = %s", child);
      }
    },
    async startCreate() {
      // if (Nets != null) {
      //  this.nets = Nets;
      //}
      await this.getNetList();
      await this.getAccountsList();

      this.netList = { selected: { text: "", value: "" }, items: [] };

      var selected = 0;
      for (let i = 0; i < this.myNets.length; i++) {
        if (this.nets != null) {
          // filter out any nets that are already in the list
          let found = false;
          for (let j = 0; j < this.nets.length; j++) {
            if (this.myNets[i].id == this.nets[j].netid) {
              found = true;
              break;
            }
          }
          if (found) continue;
        }
        this.netList.items[i] = {
          text: this.myNets[i].netName,
          value: this.myNets[i].id,
        };
        if (this.netList.items[i].text == this.vpn.netName) {
          selected = i;
        }
      }
      this.netList.selected = this.netList.items[selected];

      selected = 0;
      this.acntList = { selected: { text: "", value: "" }, items: [] };
      for (let i = 0; i < this.myAccounts.length; i++) {
        this.acntList.items[i] = {
          text:
            this.myAccounts[i].accountName + " - " + this.myAccounts[i].parent,
          value: this.myAccounts[i].parent,
        };
      }
      this.acntList.selected = this.acntList.items[selected];

      this.dialogCreate = true;
    },

    async startService(netName) {
      console.log("startService %s", netName);
      axios
        .patch("http://127.0.0.1:53280/service/" + netName + "/", {
          headers: {},
        })
        .then((response) => {
          console.log("startService response = ", response);
        });
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
            try {
              that.$refs.chart1.updateSeries([that.series[0], that.series[1]]);
            } catch (e) {
              // do nothing
            }
          }
        });
      // .catch(() => {});
      //       {
      // name: "",
      // data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      // head: 0,
      // buckets: 12,
    },
    create(vpn) {
      console.log("Create VPN: ", vpn);

      if (this.vpn.current.syncEndpoint && this.endpoint == "") {
        alert("Endpoint is required if sync is selected");
        return;
      }
      // get a new keypair from the keystore for this host
      try {
        axios
          .get("http://127.0.0.1:53280/keys/", { headers: {} })
          .then((response) => {
            console.log("Public Key = ", response.data);
            vpn.current.publicKey = response.data.Public;
            vpn.current.privateKey = "";
          });
      } catch (e) {
        console.log("Error getting keypair: ", e);
      }

      this.vpn.name = this.vpnName;
      this.vpn.current.endpoint = this.endpoint;
      this.vpn.current.listenPort = this.listenPort;
      this.vpn.current.listenPort = parseInt(this.vpn.current.listenPort, 10);
      this.vpn.netName = this.netList.selected.text;
      this.vpn.netid = this.netList.selected.value;
      this.vpn.deviceid = this.device.id;
      this.vpn.accountid = this.acntList.selected.value;
      this.dialogCreate = false;
      console.log("createVPN vpn = ", this.vpn);
      this.createVPN(vpn);
    },
    createVPN(vpn) {
      let accessToken = ipcRenderer.sendSync("accessToken");
      let body = {
        grant_type: "authorization_code",
        client_id: this.device.clientid,
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
          if (this.device.id == "") {
            this.device.name = os.hostname();
            this.device.accountid = vpn.accountid;
            axios
              .post(serverUrl + "/api/v1.0/device", this.device, {
                headers: {
                  Authorization: "Bearer " + accessToken,
                },
              })
              .then((response) => {
                this.device = response.data;
                console.log("device = ", this.device);
                vpn.deviceid = this.device.id;

                this.saveSettings();

                axios
                  .post(serverUrl + "/api/v1.0/vpn", vpn, {
                    headers: {
                      Authorization: "Bearer " + accessToken,
                    },
                  })
                  .then((response) => {
                    let vpn = response.data;
                    console.log("VPN = ", vpn);
                  })
                  .catch((error) => {
                    if (error) console.error(error);
                  });
              })
              .catch((error) => {
                if (error) console.error(error);
              });
          } else {
            axios
              .post(serverUrl + "/api/v1.0/vpn", vpn, {
                headers: {
                  Authorization: "Bearer " + accessToken,
                },
              })
              .then((response) => {
                let vpn = response.data;
                console.log("VPN = ", vpn);
              })
              .catch((error) => {
                if (error) console.error(error);
              });
          }
        })
        .catch((error) => {
          if (error) throw new Error(error);
        });
    },
    async getAccountsList() {
      return new Promise((resolve, reject) => {
        let accessToken = ipcRenderer.sendSync("accessToken");
        if (!accessToken) return reject(new Error("no access token available"));
        let body = {
          grant_type: "authorization_code",
          client_id: this.device.clientid,
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
              .get(serverUrl + "/api/v1.0/accounts/", {
                headers: {
                  Authorization: "Bearer " + accessToken,
                },
              })
              .then((response) => {
                this.myAccounts = response.data;
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
    async getNetList() {
      return new Promise((resolve, reject) => {
        let accessToken = ipcRenderer.sendSync("accessToken");
        if (!accessToken) return reject(new Error("no access token available"));
        let body = {
          grant_type: "authorization_code",
          client_id: this.device.clientid,
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
                this.myNets = response.data;
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

    async EnableVPN(net) {
      console.log("Enable VPN: ", net);
      let vpn = null;
      for (let i = 0; i < net.vpns.length; i++) {
        if (net.vpns[i].deviceid == this.device.id) {
          vpn = net.vpns[i];
          break;
        }
      }

      if (vpn == null) {
        return new Error("local vpn not found on device");
      }

      vpn.enable = net.enable;

      if (vpn.enable) {
        this.startService(vpn.netName);
      } else {
        this.stopService(vpn.netName);
      }
    },

    async updateVPN(net) {
      return new Promise((resolve, reject) => {
        console.log("Update Net: ", net);
        let accessToken = ipcRenderer.sendSync("accessToken");
        if (!accessToken) ipcRenderer.sendSync("authenticate");
        if (!accessToken) accessToken = ipcRenderer.sendSync("accessToken");
        let body = {
          grant_type: "authorization_code",
          client_id: this.device.clientid,
          state: accessToken,
          code: accessToken,
          redirect_uri: serverUrl,
        };
        let vpn = null;
        for (let i = 0; i < net.vpns.length; i++) {
          if (net.vpns[i].deviceid == this.device.id) {
            vpn = net.vpns[i];
            break;
          }
        }
        if (vpn != null) {
          vpn.enable = net.enable;
        } else {
          return reject(new Error("local vpn not found on device"));
        }
        axios
          .post(serverUrl + "/api/v1.0/auth/token", body, {
            headers: {
              Authorization: "Bearer " + accessToken,
            },
          })
          .then(() => {
            axios
              .patch(serverUrl + "/api/v1.0/vpn/" + vpn.id, vpn, {
                headers: {
                  Authorization: "Bearer " + accessToken,
                },
              })
              .then(() => {
                if (!vpn.enable) {
                  this.stopService(vpn.netName);
                }
                resolve();
              })
              .catch((error) => {
                if (error) console.error(error);
                if (!vpn.enable) {
                  this.stopService(vpn.netName);
                }
              });
          })
          .catch((error) => {
            if (error) throw new Error(error);
          });
      });
    },

    async deleteVPN(net) {
      if (confirm(`Do you really want to delete ${net.netName} ?`)) {
        console.log("deleteVPN ", net);
        let vpn = null;
        for (let i = 0; i < net.vpns.length; i++) {
          if (net.vpns[i].deviceid == this.device.id) {
            vpn = net.vpns[i];
            break;
          }
        }

        if (vpn == null) {
          return new Error("local vpn not found on device");
        }

        axios
          .delete("http://127.0.0.1:53280/vpn/" + vpn.id + "/", {
            headers: {},
          })
          .then((response) => {
            console.log("stopService response = ", response);
          });
      }
    },

    startSettings() {
      this.dialogSettings = true;
    },
    async saveSettings() {
      this.dialogSettings = false;

      axios
        .get(
          "http://127.0.0.1:53280/config/?server=" +
            this.device.server +
            "&id=" +
            this.device.id +
            "&name=" +
            this.device.name +
            "&apiKey=" +
            this.device.apiKey +
            "&appdata=" +
            this.device.appData +
            "&clientid=" +
            this.device.clientid +
            "&authdomain=" +
            this.device.authdomain +
            "&apiid=" +
            this.device.apiid +
            "&accountid=" +
            this.device.accountid,
          {
            headers: {},
          }
        )
        .then((response) => {
          console.log("Save Settings response = ", response);
        });
    },

    setAutoLaunch() {
      if (this.autoLaunch) {
        autoLauncher.enable();
      } else {
        autoLauncher.disable();
      }
    },
    loadNetwork(evt) {
      let name = evt.currentTarget.innerText;
      let x = 0;
      let l = 0;
      this.links = [];
      this.nodes = [];
      let net_vpns = [];
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

      for (let i = 0; i < this.net.vpns.length; i++) {
        if (this.net.vpns[i].netName == name) {
          net_vpns[x] = this.net.vpns[i];
          this.nodes[x] = { id: x, name: this.net.vpns[i].name };
          if (this.net.vpns[i].current.endpoint == "") {
            this.nodes[x]._color = "#34adcd";
          } else {
            this.nodes[x]._color = "#83c44d";
          }
          if (this.net.vpns[i].role == "Egress") {
            this.nodes[x]._color = "#50C878";
          }
          x++;
        }
      }
      for (let i = 0; i < net_vpns.length; i++) {
        for (let j = 0; j < net_vpns.length; j++) {
          if (
            i != j &&
            net_vpns[j].current.endpoint != "" &&
            net_vpns[j].role != "Egress"
          ) {
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
  height: 300px;
}

.network {
  width: 100%;
  height: 100%;
}

h4 {
  margin: 20px;
  display: flex;
  justify-content: center;
  font-size: 18px;
}

div.chart-wrapper {
  align-items: left;
  padding: 10px;
  border-radius: 10px;
  background-color: #444;
  height: 300px;
  width: 350px;
}

.draggable-area {
  -webkit-app-region: drag;
}

.vpntable th {
  text-align: center;
}
.vpntable tr td {
  padding: 3px;
  margin: 0px;
  border: 0px;
  height: 40px;
}
</style>
