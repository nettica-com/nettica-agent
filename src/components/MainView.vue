<template>
  <div>
    <div class="row">
      <header>
        <nav
          class="navbar navbar-dark bg-dark"
          style="
            background-image: url('wide-network.jpeg');
            background-size: cover;
          "
        >
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
        <a
          :href="item.device.server"
          @click.prevent="openExternal(item.device.server)"
          class="pt-5 pb-5 pr-5 pl-5"
          style="
            font-size: 18px;
            font-family: Roboto;
            color: white;
            text-decoration: none;
          "
        >
          {{ item.name }}
        </a>
        <div style="flex-grow: 1; margin-left: auto"></div>
        <button
          class="btn btn-primary mr-2 my-2 my-sm-0"
          icon
          @click="startSettings(item)"
        >
          <v-icon title="Settings" dark> mdi-cog-outline </v-icon>
        </button>
        <button
          :disabled="!item.logged_in"
          @click="startCreate(item)"
          class="btn btn-primary mr-2 my-2 my-sm-0"
        >
          <img
            title="Join Network"
            :src="require('../assets/hub.svg')"
            height="24"
            alt="nettica"
          />
        </button>
        <button
          :disabled="!item.logged_in"
          @click="startMembers(item)"
          class="btn btn-primary mr-2 my-2 my-sm-0"
        >
          <v-icon title="Account" dark> mdi-account-group </v-icon>
        </button>
        <button :class="item.class" @click="login(item)" type="button">
          <v-icon :title="item.logged_in ? 'Logout' : 'Login'" dark>
            mdi-lock
          </v-icon>
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
              <table>
                <tr>
                  <td>
                    <v-label
                      :key="index"
                      class="pt-5 pb-0 pr-5 pl-5"
                      style="font-size: 18px; font-family: Roboto"
                      v-model="net.netName"
                      >{{ net.netName }}</v-label
                    >
                  </td>
                </tr>
                <tr>
                  <td>
                    <v-label
                      class="pt-0 pb-5 pr-5 pl-5"
                      style="font-size: 12px; font-family: Roboto"
                      v-model="net.description"
                    >
                      {{ net.description }}</v-label
                    >
                  </td>
                </tr>
              </table>
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
                      @click="launchSSH(item, net, vpn)"
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
                      @click="launchRDP(item, net, vpn)"
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
    <v-dialog v-model="dialogMembers" max-width="550">
      <v-card>
        <v-card-title class="headline">Account</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <h3>{{ savedAccount.accountName }}</h3>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-list>
                <v-list-item
                  v-for="(member, index) in members"
                  :key="index"
                  class="flex-container"
                  @click="startEditMember(member)"
                >
                  <v-icon>mdi-account</v-icon>
                  <div class="table-container">
                    <table>
                      <tr>
                        <td>
                          <v-label
                            :key="index"
                            class="pt-5 pb-0 pr-5 pl-5"
                            style="font-size: 18px; font-family: Roboto"
                            v-model="member.name"
                            >{{ member.name }}</v-label
                          >
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <v-label
                            class="pt-0 pb-5 pr-5 pl-5"
                            style="font-size: 12px; font-family: Roboto"
                            v-model="member.email"
                          >
                            {{ member.email }}</v-label
                          >
                        </td>
                      </tr>
                    </table>
                  </div>
                </v-list-item>
              </v-list>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="success" @click="startInviteMember">
            Invite
            <v-icon right dark>mdi-account-plus</v-icon>
          </v-btn>
          <v-btn color="primary" @click="dialogMembers = false">
            Close
            <v-icon right dark>mdi-close-circle-outline</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogEditMember" max-width="550">
      <v-card>
        <v-card-title class="headline">Edit Member</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-form ref="form" v-model="valid">
                <v-text-field
                  v-if="editMember.role === 'Owner'"
                  v-model="editMember.accountName"
                  label="Company"
                  :rules="[(v) => !!v || 'Company is required']"
                  required
                />
                <v-text-field
                  v-model="editMember.name"
                  label="Name"
                  :rules="[(v) => !!v || 'Name is required']"
                  required
                />
                <v-text-field
                  v-model="editMember.email"
                  label="Email"
                  :rules="[rules.email]"
                  readonly
                  required
                />
                <v-select
                  v-if="editMember.role != 'Owner'"
                  v-model="editMember.role"
                  :items="roles"
                  label="Role"
                  :rules="[(v) => !!v || 'Role is required']"
                  required
                />
                <v-select
                  v-if="editMember.role != 'Owner'"
                  v-model="editMember.status"
                  :items="statuses"
                  label="Status"
                  :rules="[(v) => !!v || 'Status is required']"
                  required
                />
              </v-form>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-btn
            v-if="editMember.role !== 'Owner'"
            color="red"
            @click="deleteMember(editMember)"
          >
            Delete
            <v-icon right dark>mdi-delete-outline</v-icon>
          </v-btn>
          <v-spacer />
          <v-btn
            :disabled="!valid"
            color="success"
            @click="saveMember(editMember)"
          >
            Save
            <v-icon right dark>mdi-check-outline</v-icon>
          </v-btn>
          <v-btn color="primary" @click="dialogEditMember = false">
            Cancel
            <v-icon right dark>mdi-close-circle-outline</v-icon>
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogInviteMember" max-width="550">
      <v-card>
        <v-card-title class="headline">Invite New Member</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-form ref="form" v-model="valid">
                <v-text-field
                  v-model="newMember.name"
                  label="Name"
                  :rules="[(v) => !!v || 'Name is required']"
                  required
                />
                <v-text-field
                  v-model="newMember.email"
                  label="Email"
                  :rules="[rules.email]"
                  required
                />
                <v-select
                  v-model="newMember.role"
                  :items="roles"
                  label="Role"
                  :rules="[(v) => !!v || 'Role is required']"
                  required
                />
                <v-switch
                  v-model="newMember.sendEmail"
                  label="Send Email Invite"
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
            @click="addMember(newMember)"
          >
            Invite
            <v-icon right dark>mdi-check-outline</v-icon>
          </v-btn>
          <v-btn color="primary" @click="dialogInviteMember = false">
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
    <v-dialog v-model="dialogMessage" max-width="550">
      <v-card>
        <v-card-title class="headline">Error</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-form ref="form">
                <v-label class="pt-5 pb-0 pr-5 pl-5" style="font-size: 18px">{{
                  message
                }}</v-label>
              </v-form>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="dialogMessage = false"> OK </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-dialog v-model="dialogLogout" max-width="550">
      <v-card>
        <v-card-title class="headline">Logout</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-form ref="form">
                <v-label class="pt-5 pb-0 pr-5 pl-5" style="font-size: 18px"
                  >You have been logged out.</v-label
                >
              </v-form>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="dialogLogout = false"> OK </v-btn>
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
                <v-select
                  v-model="device.logging"
                  :items="loglevel.items"
                  label="Logging"
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
    <v-dialog v-model="dialogConfirmDelete" max-width="550">
      <v-card>
        <v-card-title class="headline">Confirm Delete</v-card-title>
        <v-card-text>
          <v-row>
            <v-col cols="12">
              <v-checkbox
                v-model="hardDelete"
                label="Delete from server"
              ></v-checkbox>
              <p>
                Are you sure you want to delete this device? Deleting the device
                will also disconnect any running VPNs, log you out and exit the
                application.
              </p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="red" @click="confirmDelete">
            Delete
            <v-icon right dark>mdi-delete-outline</v-icon>
          </v-btn>
          <v-btn color="primary" @click="dialogConfirmDelete = false">
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
const execSync = window.require("child_process").execSync;
const pack = require("../../package");
const ApexCharts = window.require("apexcharts");
const os = window.require("os");
const AutoLaunch = window.require("auto-launch");

// a blank console.log function to disable logging
console.log = function () {};

var appData = "C:\\ProgramData";
var { version } = pack;

if (process.env.ALLUSERSPROFILE != null) {
  appData = process.env.ALLUSERSPROFILE;
}

let xPath = null;
let NetticaServersPath = appData + "\\nettica\\";

if (os.platform() == "linux") {
  xPath = `/opt/Nettica\\ Agent/nettica.agent`; // must have this exactly as it is in order to properly fix the bug in AutoLauncher
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
    device: {
      server: "https://my.nettica.com",
      appData: appData,
      name: os.hostname().toLowerCase(),
      description: "",
      ezcode: "",
      id: "",
      logging: "",
      apiKey: "",
      instanceid: "",
      registered: false,
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
    newMember: {
      name: "",
      email: "",
      role: "",
      sendEmail: false,
    },
    editMember: {
      name: "",
      email: "",
      role: "",
      status: "",
      accountName: "",
    },
    dialogMembers: false,
    dialogEditMember: false,
    dialogInviteMember: false,
    hardDelete: false,
    dialogConfirmDelete: false,
    roles: ["Admin", "User"],
    statuses: ["Active", "Pending"],
    netName: "",
    members: [],
    myNets: [],
    netList: {},
    myAccounts: [],
    acntList: {},
    nodes: [],
    links: [],
    loglevel: {
      selected: { text: "None", value: "" },
      items: [
        { text: "None", value: "" },
        { text: "Error", value: "error" },
        { text: "Info", value: "info" },
        { text: "Debug", value: "debug" },
      ],
    },
    nodeSize: 30,
    selected: "",
    dialogCreate: false,
    dialogSettings: false,
    dialogAbout: false,
    dialogServer: false,
    dialogMessage: false,
    dialogLogout: false,
    message: "",
    version: version,
    autoLaunch: false,
    server: "",
    servers: [],
    savedItem: null,
    savedAccount: { accountName: "" },
    deviceId: "",
    deviceName: os.hostname().toLowerCase(),
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
      console.log("args (servers) = ", args);
      // go through the servers and put the access token into the args
      if (this.servers != null) {
        for (let i = 0; i < this.servers.length; i++) {
          for (let j = 0; j < args.length; j++) {
            if (this.servers[i].device.server == args[j].device.server) {
              console.log(
                "handle-servers found server ",
                this.servers[i].name,
                this.servers[i]
              );
              args[j].accessToken = this.servers[i].accessToken;
              args[j].class = this.servers[i].class;
              args[j].logged_in = this.servers[i].logged_in;

              if (args[j].class == null || args[j].class == "") {
                args[j].class = "btn btn-danger";
                args[j].logged_in = false;
              }
            }
          }
        }
      }
      this.servers = null;
      this.servers = args;
      console.log("handle-servers servers = ", this.servers);

      // find the local host in a net and set the enable flag on the net
      for (let x = 0; x < this.servers.length; x++) {
        this.servers[x].name = this.servers[x].device.server.replace(
          "https://",
          ""
        );
        if (this.servers[x].class == null) {
          this.servers[x].class = "btn btn-danger";
        }
        if (this.servers[x].logged_in == null) {
          this.servers[x].logged_in = false;
        }
        if (this.servers[x].config == null) {
          this.servers[x].config = [];
        }
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
      this.savedItem.logged_in = true;
      console.log("on authenticated - savedItem = ", this.savedItem);

      if (this.savedItem.device.registered == false) {
        this.discoverDevice(this.savedItem);
      }

      for (let i = 0; i < this.servers.length; i++) {
        if (this.servers[i].device.server == this.savedItem.device.server) {
          console.log("found server ", this.servers[i].name);
          this.servers[i].accessToken = args;
          this.servers[i].class = "btn btn-success";
          this.servers[i].logged_in = true;
          break;
        }
      }

      this.$forceUpdate();
    });
    ipcRenderer.on("update-available", (event, args) => {
      console.log("update-available", args);
      if (confirm("An update is available. Do you want to install it now?")) {
        ipcRenderer.send("install-now");
      }
    });
    ipcRenderer.on("update-downloaded", (event, args) => {
      console.log("update-downloaded", args);
      alert("An update has been downloaded and is ready to install.");
      ipcRenderer.send("install-now");
    });
    ipcRenderer.on("handle-vpn", (event, args) => {
      console.log("handle-vpn", args);
      this.vpn = args;

      // toggle the vpn
      if (!this.vpn.enable) {
        this.startService(this.vpn.netName);
      } else {
        this.stopService(this.vpn.netName);
      }
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

    autoLauncher.isEnabled().then((isEnabled) => {
      this.autoLaunch = isEnabled;
    });

    ipcRenderer.on("handle-about", (event) => {
      console.log("handle-about", event, this);
      this.dialogAbout = true;
    });

    setInterval(() => {
      this.oneHour++;
      if (this.oneHour > (60 * 60) / 5) {
        // no longer authenticated
        console.log("No longer authenticated");
        for (let i = 0; i < this.servers.length; i++) {
          if (this.servers[i].logged_in) {
            this.servers[i].class = "btn btn-danger";
            this.servers[i].logged_in = false;
            this.servers[i].accessToken = null;
          }
        }

        this.oneHour = 0;
      }
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
      item.logged_in = false;
      item.class = "btn btn-danger";
      item.accessToken = null;

      this.callLogout(item.device.server);
      console.log("logout - after callLogout");
      this.dialogLogout = true;
    },
    async login(item) {
      if (item.accessToken == null) {
        try {
          this.savedItem = item;
          item.accessToken = await ipcRenderer.sendSync(
            "authenticate",
            item.device.server
          );

          console.log("login - item.accessToken = ", item.accessToken);

          if (item.accessToken != null) {
            item.class = "btn btn-success";
            item.logged_in = true;
            this.savedItem = item;
            this.$forceUpdate();
          }
        } catch (e) {
          console.log("login - error = ", e);
        }
      } else {
        item.class = "btn btn-danger";
        item.logged_in = false;
        console.log("logout - accessToken = ", item.accessToken);
        this.logout(item);
        item.accessToken = null;
        this.$forceUpdate();
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
    launchSSH(item, net, vpn) {
      console.log("SSH Item: ", item, net);
      var name = vpn.name;
      if (this.isDnsEnabled(item, net) == false) {
        var parts = vpn.current.address[0].split("/");
        name = parts[0];
      }
      if (os.platform == "win32") {
        console.log("vpn = ", vpn);
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
    isDnsEnabled(item, net) {
      var enabled = false;
      for (let j = 0; j < net.vpns.length; j++) {
        if (
          net.vpns[j].deviceid == item.device.id &&
          net.vpns[j].current.enableDns == true
        ) {
          enabled = true;
          break;
        }
      }
      return enabled;
    },
    launchRDP(item, net, vpn) {
      console.log("RDP Item", vpn, net);
      var name = vpn.name;
      if (this.isDnsEnabled(item, net) == false) {
        var parts = vpn.current.address[0].split("/");
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

    async startMembers(item) {
      this.device = item.device;
      this.savedItem = item;

      await this.getAccountsList(item);

      for (let i = 0; i < this.myAccounts.length; i++) {
        if (this.myAccounts[i].parent == this.myAccounts[i].id) {
          this.savedAccount = this.myAccounts[i];
          console.log("savedAccount = ", this.savedAccount);
          await this.getMembers(item, this.myAccounts[i]);
          break;
        }
      }

      this.dialogMembers = true;
    },

    async startEditMember(item) {
      this.editMember = item;
      this.dialogEditMember = true;
    },

    async startInviteMember() {
      this.newMember = {
        name: "",
        email: "",
        role: "User",
        sendEmail: false,
        parent: this.savedAccount.id,
      };
      this.dialogInviteMember = true;
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
    async create(vpn) {
      console.log("Create VPN: ", vpn);
      var publicKey = "";

      if (this.vpn.current.syncEndpoint && this.endpoint == "") {
        this.message = "Endpoint is required if sync is selected";
        this.dialogMessage = true;
        return;
      }
      // get a new keypair from the keystore for this host
      try {
        await axios
          .get("http://127.0.0.1:53280/keys/", { headers: {} })
          .then((response) => {
            console.log("Public Key = ", response.data);
            publicKey = response.data.Public;
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
      this.vpn.current.publicKey = publicKey;
      this.vpn.netName = net.netName;
      this.vpn.accountid = net.accountid;
      this.vpn.netid = net.id;
      this.vpn.deviceid = this.device.id;
      this.dialogCreate = false;
      console.log("createVPN vpn = ", this.vpn);
      this.createVPN(this.vpn);
    },
    addServer() {
      console.log("Add Server");
      if (this.servers.length == 0) {
        this.server = "https://my.nettica.com";
      } else {
        this.server = "";
      }
      this.dialogServer = true;
    },
    async createServer() {
      console.log("Create Server: ", this.server);

      var success = false;
      if (this.server == "") {
        this.dialogServer = false;
        return;
      }

      // check to see if the server is valid
      // https://server/api/v1.0/auth/oauth2_url

      this.server = this.server.trim();
      // remove the trailing slash if it is there
      if (this.server[this.server.length - 1] == "/") {
        this.server = this.server.substring(0, this.server.length - 1);
      }

      try {
        const response = await axios.get(
          this.server + "/api/v1.0/auth/oauth2_url",
          {
            headers: {},
          }
        );
        console.log("response = ", response);
        success = true;
      } catch (error) {
        console.log("Error = ", error);
        this.message =
          "Invalid server. This version of Nettica Agent supports multiple servers (eg, Enterprise customers).  Click the login button, and then click Join Network to add this device to your service.";
        this.dialogServer = false;
        this.dialogMessage = true;
        return;
      }

      for (let i = 0; i < this.servers.length; i++) {
        if (this.servers[i].device.server == this.server) {
          this.dialogServer = false;
          return;
        }
      }

      // ensure the server does not get added if the call failed
      if (!success) {
        this.dialogServer = false;
        return;
      }

      // get the description from the main process
      var s = { device: { server: this.server, config: [] } };
      var name = this.server.trimStart("https://");
      name = name.trimStart("http://");

      s.name = name;
      s.class = "btn btn-danger";
      s.device.name = os.hostname().toLowerCase();
      s.device.server = this.server;
      s.device.ezcode = "";
      s.device.id = "";
      s.device.apiKey = "";
      s.device.instanceid = "";
      s.device.enable = true;
      s.device.registered = false;
      s.device.description = await ipcRenderer.invoke("description");
      s.device.os = os.platform();

      this.servers.push(s);
      this.dialogServer = false;
    },

    async createVPN(vpn) {
      let item = this.savedItem;
      let accessToken = item.accessToken;
      console.log("createVPN accessToken = ", accessToken);

      if (item.device.id == "") {
        item.device.name = os.hostname().toLowerCase();
        item.device.description = await ipcRenderer.invoke("description");
        item.device.accountid = vpn.accountid;
        item.device.updateKeys = true;
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
                  this.message = error.response.data.error;
                  this.dialogMessage = true;
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
              this.message = error.response.data.error;
              this.dialogMessage = true;
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
            reject(error);
          });
      });
    },

    async discoverDevice(item) {
      console.log("discoverDevice", item);

      let devices = await this.getDevices(item);
      console.log("item = ", item);
      console.log("devices = ", devices);

      let found = false;

      for (let i = 0; i < devices.length; i++) {
        if (devices[i].name.toLowerCase() == os.hostname().toLowerCase()) {
          item.device = devices[i];
          found = true;
          break;
        }
      }

      if (found) {
        for (let i = 0; i < this.servers.length; i++) {
          if (this.servers[i].device.server == item.device.server) {
            this.servers[i].device = item.device;
            this.servers[i].accessToken = item.accessToken;
            this.servers[i].class = "btn btn-success";
            this.servers[i].logged_in = true;
            var temp = this.servers;
            this.servers = null;
            this.servers = temp;
            break;
          }
        }
        await this.saveSettings(item.device);
        this.$forceUpdate();
        console.log("this.servers = ", this.servers);
      } else {
        console.log("Device not found on the server");
      }
    },

    async getDevices(item) {
      return new Promise((resolve, reject) => {
        let accessToken = item.accessToken;
        console.log("getDevices accessToken = ", accessToken);
        if (!accessToken) return reject(new Error("no access token available"));
        axios
          .get(item.device.server + "/api/v1.0/device", {
            headers: {
              Authorization: "Bearer " + accessToken,
            },
          })
          .then((response) => {
            console.log("devices = ", response.data);
            resolve(response.data);
          })
          .catch((error) => {
            if (error) console.error(error);
            reject(error);
          });
      });
    },

    async getMembers(item, account) {
      return new Promise((resolve, reject) => {
        let accessToken = item.accessToken;
        console.log("getMembers accessToken = ", accessToken);
        if (!accessToken) return reject(new Error("no access token available"));
        axios
          .get(
            item.device.server + "/api/v1.0/accounts/" + account.id + "/users",
            {
              headers: {
                Authorization: "Bearer " + accessToken,
              },
            }
          )
          .then((response) => {
            this.members = response.data;
            resolve();
          })
          .catch((error) => {
            if (error) console.error(error);
            reject(error);
          });
      });
    },

    async saveMember(member) {
      let item = this.savedItem;
      let accessToken = item.accessToken;
      console.log("saveMember accessToken = ", accessToken);

      if (!accessToken) return new Error("no access token available");

      member.accoutnName = this.savedAccount.accountName;

      console.log("saveMember member = ", member);

      axios
        .patch(item.device.server + "/api/v1.0/accounts/" + member.id, member, {
          headers: {
            Authorization: "Bearer " + accessToken,
          },
        })
        .then(() => {
          this.dialogInviteMember = false;
          this.getMembers(this.savedItem, this.savedAccount);
        })
        .catch((error) => {
          if (error) console.error(error);
        });
    },

    async deleteMember(member) {
      let item = this.savedItem;
      let accessToken = item.accessToken;
      console.log("deleteMember accessToken = ", accessToken);
      console.log("deleteMember member = ", member);

      if (!accessToken) return new Error("no access token available");

      axios
        .delete(item.device.server + "/api/v1.0/accounts/" + member.id, {
          headers: {
            Authorization: "Bearer " + accessToken,
          },
        })
        .then(() => {
          this.dialogEditMember = false;
          this.getMembers(this.savedItem, this.savedAccount);
        })
        .catch((error) => {
          if (error) console.error(error);
        });
    },

    async addMember(member) {
      let item = this.savedItem;
      let accessToken = item.accessToken;
      console.log("addMember accessToken = ", accessToken);
      if (!accessToken) return new Error("no access token available");

      member.accountName = this.savedAccount.accountName;

      if (member.sendEmail) {
        member.status = "Pending";
      } else {
        member.status = "Active";
      }
      member.parent = this.savedAccount.id;

      console.log("addMember member = ", member);

      axios
        .post(item.device.server + "/api/v1.0/accounts/", member, {
          headers: {
            Authorization: "Bearer " + accessToken,
          },
        })
        .then(async (m) => {
          if (member.sendEmail) {
            await this.inviteMember(m.data);
          } else {
            // alert(member.name + " added successfully.");
          }

          this.getMembers(this.savedItem, this.savedAccount);
          this.dialogInviteMember = false;
        })
        .catch((error) => {
          if (error) console.error(error);
        });
    },

    async inviteMember(member) {
      let item = this.savedItem;
      let accessToken = item.accessToken;
      console.log("inviteMember accessToken = ", accessToken);
      console.log("inviteMember member = ", member);
      if (!accessToken) return new Error("no access token available");

      axios
        .get(
          item.device.server + "/api/v1.0/accounts/" + member.id + "/invite",
          {
            headers: {
              Authorization: "Bearer " + accessToken,
            },
          }
        )
        .then(() => {
          // alert("Email invitation sent to " + member.email);
          this.dialogInviteMember = false;
          this.getMembers(this.savedItem, this.savedAccount);
        })
        .catch((error) => {
          if (error) console.error(error);
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
            reject(error);
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
            reject(error);
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
      this.dialogConfirmDelete = true;
    },
    confirmDelete() {
      let softDelete = "";

      if (!this.hardDelete) {
        softDelete = "/soft";
      }

      axios
        .delete(
          "http://127.0.0.1:53280/device/" + this.device.id + softDelete,
          {
            headers: {},
          }
        )
        .then(() => {
          console.log("deleteSettings - after delete");
          this.dialogSettings = false;
        });

      this.logout(this.savedItem);
      ipcRenderer.send("quit-app");
    },

    async saveSettings(device) {
      this.dialogSettings = false;
      console.log("Save Settings: ", device);

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
            "&logging=" +
            device.logging +
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

    async openExternal(url) {
      console.log("openExternal: ", url);
      if (os.platform == "win32") {
        spawn("start", [url], {
          detached: true,
          shell: true,
        });
      }
      if (os.platform == "linux") {
        spawn("open", [url], {
          detached: true,
          shell: false,
        });
      }
      if (os.platform == "darwin") {
        spawn("open", [url], {
          detached: true,
          shell: false,
        });
      }
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
    async setAutoLaunch() {
      if (this.autoLaunch) {
        await autoLauncher.enable();
        // autoLauncher can't properly create the desktop file on linux,
        // so copy it from /usr/share/applications because it's correct there
        if (os.platform() == "linux") {
          const src = "/usr/share/applications/nettica.agent.desktop";
          const dest = `${os.homedir()}/.config/autostart/nettica.agent.desktop`;
          const autostartDir = `${os.homedir()}/.config/autostart`;
          if (!fs.existsSync(autostartDir)) {
            fs.mkdirSync(autostartDir, { recursive: true });
          }
          fs.copyFile(src, dest, (err) => {
            if (err) {
              console.error("Error copying file:", err);
            } else {
              console.log("File copied to autostart directory");
            }
          });
        }
      } else {
        autoLauncher.disable();
        // we don't need to remove the file if linux, autoLauncher can manage that
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

.btn-primary {
  background-color: #336699;
  border-color: #336699;
}
.btn-primary:disabled {
  background-color: #6699cc;
  border-color: #6699cc;
}

.navbar-brand {
  text-shadow: #000 1px 1px 1px;
}

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

h3 {
  justify-content: center;
  margin: 0px;
  display: flex;
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

.flex-container {
  display: flex;
  align-items: center; /* Center vertically */
  border: 1px solid #444;
}

.icon {
  margin-right: 16px; /* Adjust the spacing as needed */
}

.table-container {
  flex-grow: 1; /* Allow the table to take up the remaining space */
}
</style>
