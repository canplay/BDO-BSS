<template>
  <q-page padding ref="contatiner">
    <q-input
      standout="bg-primary text-white"
      v-model="file"
      label="File"
      bg-color="blue"
      @click="showFileDlg"
      ref="header"
    />

    <q-space style="margin: 10px" />

    <q-table
      class="my-sticky-header-table"
      :title="total === 0 ? '' : 'count: ' + total"
      :data="data"
      :columns="columns"
      row-key="no"
      dense
      :pagination.sync="pagination"
      :table-style="{ 'max-height': tableHeight + 'px' }"
    />
  </q-page>
</template>

<style lang="sass">
.my-sticky-header-table
  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    background-color: white

  thead tr:first-child th
    position: sticky
    top: 0
    opacity: 1
    z-index: 1
</style>

<script>
import fileStream from "fs";
import format from "../components/format.js";

export default {
  name: "PageIndex",

  data() {
    return {
      tableHeight: 0,
      file: "",
      pagination: {
        sortBy: "no",
        rowsPerPage: 0
      },
      columns: [
        {
          name: "no",
          label: "No",
          align: "left",
          field: "no",
          sortable: true
        },
        {
          name: "name",
          label: "Name",
          align: "left",
          field: "arg1"
        },
        {
          name: "condition",
          label: "Condition",
          align: "left",
          field: "arg2"
        },
        {
          name: "setted",
          label: "Setted",
          align: "left",
          field: "arg3"
        }
      ],
      data: [],
      total: 0
    };
  },

  methods: {
    onResize() {
      this.tableHeight = this.$refs.contatiner.$el.clientHeight
      - this.$refs.header.$el.clientHeight - 145;
    },

    showFileDlg() {
      this.$q.electron.remote.dialog
        .showOpenDialog({
          properties: ["openFile"],
          filters: [{ name: "bss", extensions: ["bss"] }]
        })
        .then(result => {
          this.file = result.filePaths[0].replace(/\\/g, "/");

          fileStream.open(this.file, (err, fd) => {
            if (err) {
              return console.error(err);
            }

            this.data = [];
            this.parseTotal(fd);

            let filename = this.file.lastIndexOf("/");

            switch (this.file.substring(filename + 1, this.file.length)) {
              case "eventmanagement.bss":
                this.parseEventSection(fd, 2, 4);
                break;
              case "cashproduct.bss":
                this.parseCashSection(fd, 2, 4);
                break;
            }
          });
        });
    },

    hexToStr(hex) {
      let val = "";
      for (let index = 0; index < hex.byteLength; index++) {
        val += String.fromCharCode(hex.getInt8(index, true));
      }
      return val;
    },

    parseTotal(fd) {
      let buf = new ArrayBuffer(2);
      let hex = new DataView(buf);
      fileStream.read(fd, hex, 0, 2, null, (err, bytes) => {
        if (err) {
          console.log(err);
        }

        if (bytes > 0) {
          this.total = hex.getInt16(0, true);
        }
      });
    },

    parseCashSection(fd, size, offset, rounds) {
      let buf = new ArrayBuffer(1024);
      let hex = new DataView(buf);

      switch (rounds) {
        default:
          fileStream.read(fd, hex, 0, size, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              format.no = hex.getInt16(0, true);
              this.parseCashSection(fd, 1, offset + size + 1, 0);
            }
          });
          break;

        case 0:
          fileStream.read(fd, hex, 0, size, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              format.no = hex.getInt16(0, true);
              this.parseCashSection(fd, 1, offset + size + 1, 1);
            }
          });
          break;
      }
    },

    parseEventSection(fd, size, offset, rounds) {
      let buf = new ArrayBuffer(1024);
      let hex = new DataView(buf);

      switch (rounds) {
        default:
          fileStream.read(fd, hex, 0, size, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              format.event.no = hex.getInt16(0, true);
              this.parseEventSection(fd, 2, offset + size, 0);
            }
          });
          break;

        case 0:
          fileStream.read(fd, hex, 0, size, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              this.parseEventSection(
                fd,
                hex.getInt16(0, true),
                offset + size + 6,
                1
              );
            }
          });
          break;

        case 1:
          fileStream.read(fd, hex, 0, size * 2, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              format.event.arg1 = this.hexToStr(hex);
              this.parseEventSection(fd, 2, offset + size * 2, 2);
            }
          });
          break;

        case 2:
          fileStream.read(fd, hex, 0, size, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              this.parseEventSection(
                fd,
                hex.getInt16(0, true),
                offset + size + 6,
                3
              );
            }
          });
          break;

        case 3:
          fileStream.read(fd, hex, 0, size * 2, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              format.event.arg2 = this.hexToStr(hex);
              this.parseEventSection(fd, 2, offset + size * 2, 4);
            }
          });
          break;

        case 4:
          fileStream.read(fd, hex, 0, size, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              this.parseEventSection(
                fd,
                hex.getInt16(0, true),
                offset + size + 6,
                5
              );
            }
          });
          break;

        case 5:
          fileStream.read(fd, hex, 0, size * 2, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              format.event.arg3 = this.hexToStr(hex);
              this.data.push({ ...format.event });
              this.parseEventSection(fd, 2, offset + size * 2 + 1);
            }
          });
          break;
      }
    }
  },

  created() {
    window.addEventListener("resize", this.onResize);
  },

  mounted() {
    this.onResize();
  },

  destroyed() {
    window.removeEventListener("resize", this.onResize);
  }
};
</script>
