<template>
  <q-layout view="lHh Lpr lFf">
    <q-img
      src="statics/bg.png"
      class="fixed-center fit"
      style="z-index: -1; border-radius: 8px"
    />

    <q-header class="transparent">
      <q-toolbar class="text-white q-electron-drag transprent">
        <q-img
          src="statics/icon.png"
          style="width: 36px; height: 36px"
        />&nbsp;&nbsp;
        <div class="text-black">
          <q-badge class="bg-accent">{{ title }} {{ version }}</q-badge>
        </div>

        <q-space />

        <q-btn
          v-if="appurl === 'index'"
          dense
          flat
          color="black"
          icon="settings"
          @click="option"
        >
          <q-tooltip content-style="font-size: 12px">
            {{ label_Option }}
          </q-tooltip>
        </q-btn>

        <q-btn dense flat color="black" icon="minimize" @click="minimize">
          <q-tooltip content-style="font-size: 12px">
            {{ label_Minimize }}
          </q-tooltip>
        </q-btn>

        <!-- <q-btn dense flat color="black" icon="crop_square" @click="maximize">
        <q-tooltip content-style="font-size: 12px">maximize</q-tooltip>
        </q-btn>-->

        <q-btn dense flat color="black" icon="close" @click="close">
          <q-tooltip content-style="font-size: 12px">{{
            label_Close
          }}</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-dialog v-model="dlg_option">
      <q-card style="width: 600px">
        <q-card-section class="fit items-center">
          <div class="q-gutter-md">
            <div class="row">
              <div class="col">
                <q-btn
                  class="fit"
                  :label="label_btnSave"
                  color="primary"
                  @click="onSave"
                />
              </div>

              <div class="col-1" />

              <div class="col">
                <q-btn
                  class="fit"
                  :label="label_btnReset"
                  color="primary"
                  flat
                  @click="onReset"
                />
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<style>
* {
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
body::-webkit-scrollbar {
  display: none;
  overflow-x: hidden;
  overflow-y: hidden;
}
</style>

<script>
import common from "../components/common.js";

export default {
  name: "MyLayout",

  data() {
    return {
      title: this.$q.electron.remote.getCurrentWindow().getTitle(),
      version: "0.0.0",
      appurl: "",
      dlg_option: false,
      label_btnSave: "",
      label_btnReset: "",
      label_ok: "",
      label_Option: "",
      label_Minimize: "",
      label_Close: ""
    };
  },

  methods: {
    minimize() {
      this.$q.electron.remote.getCurrentWindow().minimize();
    },

    maximize() {
      if (this.$q.electron.remote.getCurrentWindow().isMaximized()) {
        this.$q.electron.remote.getCurrentWindow().unmaximize();
      } else {
        this.$q.electron.remote.getCurrentWindow().maximize();
      }
    },

    close() {
      window.close();
    },

    option() {
      this.dlg_option = true;
    },

    onSave() {},
    onReset() {}
  },

  created() {
    this.appurl = common.GetUrlParamValue("appurl");
    if (this.appurl != "index")
      this.$router.replace("window" + window.location.search);
    else this.$router.replace("index");

    common.applyLoc();

    this.label_btnSave = common.lang["保存"];
    this.label_btnReset = common.lang["重置"];
    this.label_ok = common.lang["确定"];
    this.label_Option = common.lang["设置"];
    this.label_Minimize = common.lang["最小化"];
    this.label_Close = common.lang["关闭"];
  }
};
</script>
