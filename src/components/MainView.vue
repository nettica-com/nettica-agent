<template>
  <div>
    <div class="row">
      <header>
        <nav class="navbar navbar-dark bg-dark">
          <span>
            <img
              class="mr-3 ml-3"
              :src="require('../assets/nettica.png')"
              height="50"
              alt="nettica"
            />
            <span class="navbar-brand">nettica agent</span>
          </span>
          <v-spacer />
          <button
            class="btn btn-primary my-2 my-sm-0 mr-3"
            icon
            @click="addServer()"
          >
            <v-icon title="Add Server" dark> mdi-plus </v-icon>
          </button>
        </nav>
      </header>
    </div>
    <div
      v-for="(item, index) in servers"
      :key="`server-${index}`"
      class="pt-3 pb-3"
    >
      <div style="display: flex; align-items: center; flex-wrap: nowrap">
        <v-label
          :key="index"
          class="pt-5 pb-5 pr-5 pl-5"
          style="font-size: 18px; font-family: Roboto"
          v-model="item.name"
          >{{ item.name }}</v-label
        >
        <div style="flex-grow: 1; margin-left: auto"></div>
        <button
          class="btn btn-primary my-2 my-sm-0"
          icon
          @click="startSettings(item)"
        >
          <v-icon title="Settings" dark> mdi-cog-outline </v-icon>
        </button>
        &nbsp;
        <button
          :disabled="addNetDisabled"
          @click="startCreate(item)"
          class="btn btn-primary my-2 my-sm-0"
        >
          <img
            title="Join Network"
            :src="require('../assets/hub.svg')"
            height="24"
            alt="nettica"
          />
        </button>
        &nbsp;
        <button :class="item.class" @click="login(item)" type="button">
          <v-icon :title="loginText" dark> mdi-lock </v-icon>
        </button>
        &nbsp;&nbsp;
      </div>
      <div class="row">
        <v-expansion-panels dark>
          <v-expansion-panel
            @click="loadNetwork(item.config[i])"
            v-for="(net, i) in item.config"
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
                @click="deleteVPN(item, item.config[i])"
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
                v-on:change="EnableVPN(item, net)"
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
    </div>
    <h4 style="text-align: center">{{ netName }}</h4>
    <div style="display: flex; align-items: center; flex-wrap: wrap">
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
    </div>
    <v-dialog v-model="dialogCreate" max-width="550">
      <v-card>
        <v-card-title class="headline">Join Network</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-form ref="form" v-model="valid">
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
                  v-on:change="updateDefaults"
                />
                <v-text-field
                  v-model="vpnName"
                  label="DNS name"
                  :rules="[rules.required, rules.host]"
                  required
                />
                <v-text-field
                  v-model="endpoint"
                  label="Public endpoint for clients"
                  :rules="[rules.ipport]"
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
                    <td>
                      <v-switch
                        v-model="vpn.current.failsafe"
                        label="FailSafe"
                      />
                    </td>
                    <td>
                      <v-switch
                        v-model="vpn.current.enableDns"
                        label="Nettica DNS"
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
    <v-dialog v-model="dialogServer" max-width="550">
      <v-card>
        <v-card-title class="headline">Add Server</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-form ref="form" v-model="valid">
                <v-text-field
                  v-model="server"
                  label="Server"
                  :rules="[(v) => !!v || 'Server is required']"
                  single
                  persistent-hint
                  required
                />
              </v-form>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="!valid" color="success" @click="createServer()">
            Submit
            <v-icon right dark>mdi-check-outline</v-icon>
          </v-btn>
          <v-btn color="primary" @click="dialogServer = false">
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
                  v-if="!device.registered"
                  v-model="device.ezcode"
                  label="EZ-Code"
                />
                <v-text-field
                  v-model="device.server"
                  readonly
                  label="Server"
                  required
                />
                <v-text-field v-model="device.id" label="Device ID" />
                <v-text-field v-model="device.apiKey" label="Api Key" />
                <v-text-field v-model="device.instanceid" label="Instance ID" />
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
          <v-btn
            :disabled="!valid"
            color="success"
            @click="saveSettings(device)"
          >
            Submit
            <v-icon right dark>mdi-check-outline</v-icon>
          </v-btn>
          <v-btn color="primary" @click="dialogSettings = false">
            Cancel
            <v-icon right dark>mdi-close-circle-outline</v-icon>
          </v-btn>
          <v-btn color="red" @click="deleteSettings()">
            Delete
            <v-icon right dark>mdi-delete-outline</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogAbout" width="400">
      <v-card>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-form ref="form" v-model="valid">
                <div class="text-center">
                  <h4>Nettica Agent {{ version }}</h4>
                  <img
                    class="mr-3"
                    :src="require('../assets/nettica.png')"
                    height="100"
                    alt="nettica"
                  />
                  <p>
                    <v-label @click="launchNettica()"
                      >https://nettica.com</v-label
                    >
                  </p>
                  <v-btn color="primary" @click="dialogAbout = false">
                    OK
                  </v-btn>
                </div>
              </v-form>
            </v-col>
          </v-row>
        </v-card-text>
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
const execSync = window.require("child_process").execSync;
const pack = require("../../package");
const ApexCharts = window.require("apexcharts");
const os = window.require("os");
const AutoLaunch = window.require("auto-launch");

var appData = "C:\\ProgramData";
var { version } = pack;

if (process.env.ALLUSERSPROFILE != null) {
  appData = process.env.ALLUSERSPROFILE;
}

let xPath = null;
let NetticaServersPath = appData + "\\nettica\\";

if (os.platform() == "linux") {
  xPath = `/opt/Nettica\\ Agent/nettica.agent`; // have to fix it up because of the space in the path
  NetticaServersPath = "/etc/nettica/";
}

if (os.platform() == "darwin") {
  xPath = null;
  NetticaServersPath = "/usr/local/etc/nettica/";
}

// setup autoLaunch
const autoLauncher = new AutoLaunch({
  name: "nettica.agent",
  path: xPath,
});

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
      server: "https://my.nettica.com",
      appData: appData,
      name: os.hostname(),
      ezcode: "",
      id: "",
      apiKey: "",
      instanceid: "",
      os: os.platform(),
      arch: os.arch(),
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
        failsafe: false,
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
    dialogAbout: false,
    dialogServer: false,
    version: version,
    autoLaunch: false,
    server: "",
    servers: [],
    savedItem: null,
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
    rules: {
      required: (value) => !!value || "Required.",
      email: (v) => /.+@.+\..+/.test(v) || "E-mail must be valid",
      host: (v) =>
        /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/.test(
          v
        ) ||
        "Only letters, numbers, dots and hyphens are allowed. Must start and end with a letter or number.",
      ipport: (v) =>
        !v ||
        (v && v.length == 0) ||
        /^(((\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}\b)|(\[([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\]:[0-9]{1,5})|^$)(,\s+((\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d{1,5}\b)|(\[([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\]:[0-9]{1,5})|^$))*)$/.test(
          v
        ) ||
        "If present, must be valid IPv4 or IPv6 address and port",
    },
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
    ipcRenderer.on("handle-servers", (event, args) => {
      var oldServers = this.servers;
      console.log("oldServers = ", oldServers);
      this.servers = args;

      /*      for (let i = 0; i < args.length; i++) {
        for (let j = 0; j < this.servers.length; j++) {
          if (this.servers[j].device.server == args[i].device.server) {
            args[i].accessToken = this.servers[j].accessToken;
            args[i].class = this.servers[j].class;
            args[i].config = this.servers[j].config;
            args[i].device = this.servers[j].device;
            args[i].name = this.servers[j].name;
          }
        }
      }
      this.servers = args;
      console.log("servers = ", this.servers);*/
      // find the local host in a net and set the enable flag on the net
      for (let x = 0; x < this.servers.length; x++) {
        this.servers[x].name = this.servers[x].device.server.replace(
          "https://",
          ""
        );
        this.servers[x].class = "btn btn-danger";
        for (let i = 0; i < this.servers[x].config.length; i++) {
          for (let j = 0; j < this.servers[x].config[i].vpns.length; j++) {
            if (
              this.servers[x].config[i].vpns[j].deviceid ==
              this.servers[x].device.id
            ) {
              this.servers[x].config[i].enable =
                this.servers[x].config[i].vpns[j].enable;
            }
          }
        }
      }
    });
    ipcRenderer.on("authenticated", (event, args) => {
      console.log("on authenticated", args);
      this.savedItem.accessToken = args;
      this.savedItem.class = "btn btn-success";
    });
    ipcRenderer.on("update-available", (event, args) => {
      console.log("update-available", args);
      if (confirm("An update is available. Do you want to install it now?")) {
        ipcRenderer.send("install-now");
      }
    });
    ipcRenderer.on("update-downloaded", (event, args) => {
      console.log("update-downloaded", args);
      alert("An update has been downloaded. Click to install.");
      ipcRenderer.send("install-now");
    });
    this.$vuetify.theme.dark = true;
    let config = {};
    config.config = [];

    this.chart = new ApexCharts(
      window.document.querySelector("chart"),
      this.goptions
    );
    try {
      config = JSON.parse(
        fs.readFileSync(NetticaServersPath + "my.nettica.com.json")
      );
    } catch (e) {
      console.error("my.nettica.com.json does not exist: ", e.toString());
    }

    console.log("Config = ", config);
    this.nets = config.config;

    try {
      this.device = {};
      this.device.server = "https://my.nettica.com";
      this.device.sourceAddress = "0.0.0.0";
      this.device.quiet = true;
      this.device.checkInterval = 10;
      this.device.id = "";
      this.device.name = os.hostname();
      this.device.os = os.platform();
      this.device.arch = os.arch();
    } catch (e) {
      console.error("nettica.conf does not exist: ", e.toString());

      this.device = {};
      this.device.server = "https://my.nettica.com";
      this.device.sourceAddress = "0.0.0.0";
      this.device.quiet = true;
      this.device.checkInterval = 10;
      this.device.id = "";
      this.device.name = os.hostname();
      this.device.os = os.platform();
      this.device.arch = os.arch();
    }

    console.log("device = ", this.device);

    autoLauncher.isEnabled().then((isEnabled) => {
      this.autoLaunch = isEnabled;
    });

    ipcRenderer.on("handle-about", (event) => {
      console.log("handle-about", event, this);
      this.dialogAbout = true;
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
        console.log("getMetrics", this.net.netName);
        this.getMetrics(this, this.net.netName);
      }
    }, 5000);
  },
  displayAbout() {
    this.dialogAbout = true;
  },
  methods: {
    async logout(item) {
      this.loginText = "Login";

      this.callLogout(item.device.server);
      console.log("logout - after callLogout");
      alert("You have been logged out");
    },
    async login(item) {
      if (item.accessToken == null) {
        try {
          this.savedItem = item;
          await ipcRenderer.sendSync("authenticate", item.device.server);
          item.class = "btn btn-success";
          this.loginText = "Logout";
          this.logged_in = true;
          this.$forceUpdate();
        } catch (e) {
          console.log("login - error = ", e);
        }
      } else {
        item.accessToken = null;
        item.class = "btn btn-danger";
        console.log("logout - accessToken = ", item.accessToken);
        this.loginText = "Login";
        this.logged_in = false;
        this.logout(item);
        this.$forceUpdate();
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
        try {
          var term = execSync(
            "gsettings get org.gnome.desktop.default-applications.terminal exec"
          );
          console.log("term = ", term);
          term = term.toString().replace(/'/g, "");
          term = term.replace(/\n/g, "");
          var args = [];
          if (term == "terminator") {
            args = ["--new-tab", "-e", "ssh " + name];
          } else if (term == "gnome-terminal") {
            args = ["--", "ssh", name];
          } else {
            args = ["-e", "ssh", name];
          }
          var child = spawn(term, args, {
            foreground: true,
            detached: true,
          });
          console.log("child = ", child);
        } catch (e) {
          console.log("Error launching ssh: ", e);
          if (this.device.terminal != null) {
            parts = this.device.terminal.split(" ");
            term = parts.pop();
            parts.push("ssh");
            parts.push(name);
            child = spawn(term, parts, {
              foreground: true,
              detached: true,
            });
            console.log("child3 = ", child);
          }
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
    async startCreate(item) {
      this.device = item.device;
      this.savedItem = item;

      await this.getNetList(item);
      await this.getAccountsList(item);

      this.netList = { selected: { text: "", value: "" }, items: [] };

      var selected = 0;
      let k = 0;
      for (let i = 0; i < this.myNets.length; i++) {
        if (item.config != null) {
          // filter out any nets that are already in the list
          let found = false;
          for (let j = 0; j < item.config.length; j++) {
            if (this.myNets[i].id == item.config[j].netid) {
              found = true;
              break;
            }
          }
          if (found) continue;
        }
        this.netList.items[k] = {
          text: this.myNets[i].netName,
          value: this.myNets[i].id,
        };
        if (this.netList.items[k].text == this.vpn.netName) {
          selected = k;
        }
        k++;
      }
      this.netList.selected = this.netList.items[selected];
      this.updateDefaults(this.netList.selected);

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
          if (stats[net] != null) {
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
    updateDefaults(net) {
      console.log("updateDefaults", net);
      var selected = 0;
      for (let i = 0; i < this.myNets.length; i++) {
        if (this.myNets[i].id == net.value) {
          selected = i;
          break;
        }
      }

      this.vpnName = this.device.name + "." + this.myNets[selected].netName;
      this.vpn.current.syncEndpoint =
        this.myNets[selected].default.syncEndpoint;

      this.vpn.current.hasSSH = this.myNets[selected].default.hasSSH;
      this.vpn.current.hasRDP = this.myNets[selected].default.hasRDP;
      this.vpn.current.upnp = this.myNets[selected].default.upnp;
      this.vpn.current.failsafe = this.myNets[selected].default.failsafe;
      this.vpn.current.enableDns = this.myNets[selected].default.enableDns;
      console.log("updateDefaults = ", this.vpn, this.myNets[selected]);
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

      var net = null;
      for (let i = 0; i < this.myNets.length; i++) {
        if (this.myNets[i].id == this.netList.selected.value) {
          net = this.myNets[i];
          break;
        }
      }

      this.vpn.name = this.vpnName;
      this.vpn.current.endpoint = this.endpoint;
      this.vpn.current.listenPort = 0;

      // get the listen port from the endpoint field if it is there
      if (
        this.vpn.current.endpoint != null &&
        this.vpn.current.endpoint != "" &&
        this.vpn.current.endpoint.indexOf(":") != -1
      ) {
        let parts = this.vpn.current.endpoint.split(":");
        this.vpn.current.listenPort = parseInt(parts[parts.length - 1], 10);
      }
      this.vpn.netName = net.netName;
      this.vpn.accountid = net.accountid;
      this.vpn.netid = net.id;
      this.vpn.deviceid = this.device.id;
      this.dialogCreate = false;
      console.log("createVPN vpn = ", this.vpn);
      this.createVPN(vpn);
    },
    addServer() {
      console.log("Add Server");
      this.dialogServer = true;
    },
    createServer() {
      console.log("Create Server: ", this.server);
      var s = { device: { server: this.server, config: [] } };
      s.name = this.server.replace("https://", "");
      s.class = "btn btn-danger";
      s.device.name = os.hostname();
      s.device.ezcode = "";
      s.device.id = "";
      s.device.apiKey = "";
      s.device.instanceid = "";
      this.servers.push(s);
      this.dialogServer = false;
    },

    createVPN(vpn) {
      let item = this.savedItem;
      let accessToken = item.accessToken;
      console.log("createVPN accessToken = ", accessToken);

      if (item.device.id == "") {
        item.device.name = os.hostname();
        item.device.accountid = vpn.accountid;
        axios
          .post(item.device.server + "/api/v1.0/device", item.device, {
            headers: {
              Authorization: "Bearer " + accessToken,
            },
          })
          .then((response) => {
            item.device = response.data;
            console.log("device = ", item.device);
            vpn.deviceid = item.device.id;

            this.saveSettings(item.device);

            axios
              .post(item.device.server + "/api/v1.0/vpn", vpn, {
                headers: {
                  Authorization: "Bearer " + accessToken,
                },
              })
              .then((response) => {
                let vpn = response.data;
                console.log("VPN = ", vpn);
              })
              .catch((error) => {
                if (error) {
                  console.log("Error = ", error);
                  alert(error.response.data.error);
                }
              });
          })
          .catch((error) => {
            if (error) console.error(error);
          });
      } else {
        axios
          .post(item.device.server + "/api/v1.0/vpn", vpn, {
            headers: {
              Authorization: "Bearer " + accessToken,
            },
          })
          .then((response) => {
            let vpn = response.data;
            console.log("VPN = ", vpn);
          })
          .catch((error) => {
            if (error) {
              console.log("Error = ", error);
              alert(error.response.data.error);
            }
          });
      }
    },
    async callLogout(server) {
      return new Promise((resolve) => {
        console.log("callLogout");
        ipcRenderer.invoke("logout", server);
        console.log("callLogout - after logout");
        resolve();
      });
    },
    async getAccountsList(item) {
      return new Promise((resolve, reject) => {
        let accessToken = item.accessToken;
        console.log("getAccountsList accessToken = ", accessToken);
        if (!accessToken) return reject(new Error("no access token available"));
        axios
          .get(item.device.server + "/api/v1.0/accounts/", {
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
      });
    },
    async getNetList(item) {
      return new Promise((resolve, reject) => {
        let accessToken = item.accessToken;
        console.log("getNetList accessToken = ", accessToken);
        if (!accessToken) return reject(new Error("no access token available"));
        axios
          .get(item.device.server + "/api/v1.0/net", {
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
      });
    },

    async EnableVPN(item, net) {
      console.log("Enable VPN: ", net);
      let vpn = null;
      for (let i = 0; i < net.vpns.length; i++) {
        if (net.vpns[i].deviceid == item.device.id) {
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
          .patch(this.device.server + "/api/v1.0/vpn/" + vpn.id, vpn, {
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
      });
    },

    async deleteVPN(item, config) {
      if (confirm(`Do you really want to delete ${config.netName} ?`)) {
        console.log("deleteVPN ", config);
        let vpn = null;
        for (let i = 0; i < config.vpns.length; i++) {
          if (config.vpns[i].deviceid == item.device.id) {
            vpn = config.vpns[i];
            break;
          }
        }

        if (vpn == null) {
          return new Error("local vpn not found on device");
        }

        console.log("DeleteVPN: vpn = ", vpn);

        axios
          .delete("http://127.0.0.1:53280/vpn/" + vpn.id, {
            headers: {},
          })
          .then((response) => {
            console.log("deleteVPN response = ", response);
          });
      }
    },

    startSettings(item) {
      this.device = item.device;
      this.dialogSettings = true;
    },
    deleteSettings() {
      if (
        confirm(
          `Do you really want to delete this device ${this.device.name}?  This will also remove this server ${this.device.server} as well as VPNs associated with it.`
        )
      ) {
        axios
          .delete("http://127.0.0.1:53280/device/" + this.device.id, {
            headers: {},
          })
          .then(() => {
            console.log("deleteSettings - after delete");
            this.dialogSettings = false;
          });
      } else {
        this.dialogSettings = false;
      }
    },

    async saveSettings(device) {
      this.dialogSettings = false;

      axios
        .get(
          "http://127.0.0.1:53280/config/?server=" +
            device.server +
            "&id=" +
            device.id +
            "&name=" +
            device.name +
            "&apiKey=" +
            device.apiKey +
            "&ezcode=" +
            device.ezcode +
            "&instanceid=" +
            device.instanceid +
            "&appdata=" +
            device.appData +
            "&accountid=" +
            device.accountid,
          {
            headers: {},
          }
        )
        .then((response) => {
          console.log("Save Settings response = ", response);
        });
    },
    launchNettica() {
      console.log("launchNettica");
      if (os.platform == "win32") {
        spawn("start", ["https://nettica.com"], {
          detached: true,
          shell: true,
        });
      }
      if (os.platform == "linux") {
        spawn("open", ["https://nettica.com"], {
          detached: true,
          shell: false,
        });
      }
      if (os.platform == "darwin") {
        spawn("open", ["https://nettica.com"], {
          detached: true,
          shell: false,
        });
      }
    },
    setAutoLaunch() {
      if (this.autoLaunch) {
        autoLauncher.enable();
      } else {
        autoLauncher.disable();
      }
    },
    loadNetwork(config) {
      console.log("loadNetwork: ", config);
      let name = config.netName;
      this.netName = config.netName;
      let x = 0;
      let l = 0;
      this.links = [];
      this.nodes = [];
      let net_vpns = [];
      this.net = config;
      this.seriesInit = true;
      this.showChart = true;

      for (let i = 0; i < config.vpns.length; i++) {
        if (config.vpns[i].netName == name) {
          net_vpns[x] = config.vpns[i];
          this.nodes[x] = { id: x, name: config.vpns[i].name };
          if (config.vpns[i].current.endpoint == "") {
            this.nodes[x]._color = "#34adcd";
          } else {
            this.nodes[x]._color = "#83c44d";
          }
          if (config.vpns[i].role == "Egress") {
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
