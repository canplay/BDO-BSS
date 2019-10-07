<template>
  <q-page padding ref="contatiner">
    <div class="row">
      <div class="col-10">
        <q-input
          standout="bg-primary text-white"
          v-model="file"
          label="File"
          bg-color="blue"
          @click="onOpen"
          ref="header"
        />
      </div>

      <div class="col-1" style="width: 1%" />

      <div class="col">
        <q-btn :label="langBtnSave" color="primary" class="fit" @click="onSave" />
      </div>
    </div>

    <q-space style="margin: 10px" />

    <q-table
      class="my-sticky-header-table"
      :title="total === 0 ? '' : 'count: ' + total"
      :data="table.data"
      :columns="table.columns"
      row-key="no"
      dense
      :pagination.sync="table.pagination"
      :table-style="{ 'max-height': table.height + 'px' }"
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
import { Buffer } from "buffer";

export default {
  name: "PageIndex",

  data() {
    return {
      file: "",
      table: {
        height: 0,
        pagination: {
          sortBy: "no",
          rowsPerPage: 0
        },
        columns: [],
        data: []
      },
      total: 0,
      langBtnSave: ""
    };
  },

  methods: {
    onResize() {
      this.table.height =
        this.$refs.contatiner.$el.clientHeight -
        this.$refs.header.$el.clientHeight -
        145;
    },

    onOpen() {
      this.$q.electron.remote.dialog
        .showOpenDialog({
          properties: ["openFile"],
          filters: [{ name: "*.bss", extensions: ["bss"] }]
        })
        .then(result => {
          if (result.canceled) return;

          this.file = result.filePaths[0].replace(/\\/g, "/");

          fileStream.open(this.file, (err, fd) => {
            if (err) {
              return console.error(err);
            }

            this.table.columns = [];
            this.table.data = [];
            this.parseTotal(fd);

            let filename = this.file.substring(
              this.file.lastIndexOf("/") + 1,
              this.file.length
            );

            switch (filename) {
              case "eventmanagement.bss":
                this.table.columns = format.event.columns;
                this.parseEventSection(
                  fd,
                  Int16Array.BYTES_PER_ELEMENT,
                  Int16Array.BYTES_PER_ELEMENT * 2
                );
                this.parseFix(fd);
                break;
              case "cashproduct.bss":
                this.table.columns = format.shop.columns;
                this.parseCashSection(
                  fd,
                  Int16Array.BYTES_PER_ELEMENT,
                  Int16Array.BYTES_PER_ELEMENT * 2
                );
                break;
            }
          });
        });
    },

    onSave() {
      this.$q.electron.remote.dialog
        .showSaveDialog({
          filters: [{ name: "*.bss", extensions: ["bss"] }]
        })
        .then(result => {
          if (result.canceled) return;

          this.file = result.filePath.replace(/\\/g, "/");

          fileStream.open(this.file, "w", (err, fd) => {
            if (err) {
              return console.error(err);
            }

            this.writeEvent(fd);
          });
        });
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
              format.shop.no = hex.getInt16(0, true);
              this.data.push({ ...format.shop });
              this.parseCashSection(fd, 1, offset + size + 1, 0);
            }
          });
          break;
      }
    },

    parseEventSection(fd, size, offset, rounds) {
      let buf;

      switch (rounds) {
        default:
          buf = new Buffer.alloc(size);
          fileStream.read(fd, buf, 0, size, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              format.event.no = buf.readInt16LE();
              this.parseEventSection(
                fd,
                Int16Array.BYTES_PER_ELEMENT,
                offset + size,
                0
              );
            }
          });
          break;

        case 0:
          buf = new Buffer.alloc(size);
          fileStream.read(fd, buf, 0, size, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              this.parseEventSection(
                fd,
                buf.readInt16LE() * Int16Array.BYTES_PER_ELEMENT,
                offset + size + Int16Array.BYTES_PER_ELEMENT * 3,
                1
              );
            }
          });
          break;

        case 1:
          buf = new Buffer.alloc(size);
          fileStream.read(fd, buf, 0, size, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              format.event.name = buf.toString();
              this.parseEventSection(
                fd,
                Int16Array.BYTES_PER_ELEMENT,
                offset + size,
                2
              );
            }
          });
          break;

        case 2:
          buf = new Buffer.alloc(size);
          fileStream.read(fd, buf, 0, size, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              this.parseEventSection(
                fd,
                buf.readInt16LE() * Int16Array.BYTES_PER_ELEMENT,
                offset + size + Int16Array.BYTES_PER_ELEMENT * 3,
                3
              );
            }
          });
          break;

        case 3:
          buf = new Buffer.alloc(size);
          fileStream.read(fd, buf, 0, size, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              format.event.condition = buf.toString();
              this.parseEventSection(
                fd,
                Int16Array.BYTES_PER_ELEMENT,
                offset + size,
                4
              );
            }
          });
          break;

        case 4:
          buf = new Buffer.alloc(size);
          fileStream.read(fd, buf, 0, size, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              this.parseEventSection(
                fd,
                buf.readInt16LE() * Int16Array.BYTES_PER_ELEMENT,
                offset + size + Int16Array.BYTES_PER_ELEMENT * 3,
                5
              );
            }
          });
          break;

        case 5:
          buf = new Buffer.alloc(size);
          fileStream.read(fd, buf, 0, size, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              format.event.setted = buf.toString();
              this.table.data.push({ ...format.event });

              // let buf1 = new Buffer.alloc(1);
              // fileStream.read(fd, buf1, 0, size, offset, (err, bytes) => {
              //   if (err) {
              //     console.log(err);
              //   }

              //   if (bytes > 0) {
              //     if (buf1.readInt16LE() === 0) {
              //       buf1 = new Buffer.alloc(Int16Array.BYTES_PER_ELEMENT);

              //       if (buf1.readInt16LE() == 0) {
                      this.parseEventSection(
                        fd,
                        Int16Array.BYTES_PER_ELEMENT,
                        offset + size + 1
                      );
              //       }
              //     }
              //   }
              // });
            }
          });
          break;
      }
    },

    parseFix(fd, size, offset, round) {
      let buf;

      switch (round) {
        default:
          buf = new Buffer.alloc(size);
          fileStream.read(fd, buf, 0, size, offset, (err, bytes) => {
            if (err) {
              console.log(err);
            }

            if (bytes > 0) {
              console.log(buf);
            }
          });
          break;
      }
    },

    writeEvent(fd) {
      let buf;
      let total = new Buffer.alloc(Int16Array.BYTES_PER_ELEMENT);
      total.writeInt16LE(this.total);
      buf = Buffer.concat(
        [total, Buffer.alloc(Int16Array.BYTES_PER_ELEMENT)],
        total.length + Int16Array.BYTES_PER_ELEMENT
      );

      for (let index = 0; index < this.table.data.length; index++) {
        const val = this.table.data[index];
        let no = new Buffer.alloc(Int16Array.BYTES_PER_ELEMENT);
        no.writeInt16LE(val.no);

        let nameLen = new Buffer.alloc(Int16Array.BYTES_PER_ELEMENT);
        nameLen.writeInt16LE(val.name.length / 2);
        let name = new Buffer.alloc(val.name.length);
        name.write(val.name);

        let conditionLen = new Buffer.alloc(Int16Array.BYTES_PER_ELEMENT);
        conditionLen.writeInt16LE(val.condition.length / 2);
        let condition = new Buffer.alloc(val.condition.length);
        condition.write(val.condition);

        let settedLen = new Buffer.alloc(Int16Array.BYTES_PER_ELEMENT);
        settedLen.writeInt16LE(val.setted.length / 2);
        let setted = new Buffer.alloc(val.setted.length);
        setted.write(val.setted);

        buf = Buffer.concat([
          buf,
          no,
          nameLen,
          Buffer.alloc(Int16Array.BYTES_PER_ELEMENT * 3),
          name,
          conditionLen,
          Buffer.alloc(Int16Array.BYTES_PER_ELEMENT * 3),
          condition,
          settedLen,
          Buffer.alloc(Int16Array.BYTES_PER_ELEMENT * 3),
          setted,
          Buffer.alloc(1)
        ]);
      }

      // this.table.data.forEach(val => {
      //   let no = new Buffer.alloc(Int16Array.BYTES_PER_ELEMENT);
      //   no.writeInt16LE(val.no);

      //   let nameLen = new Buffer.alloc(Int16Array.BYTES_PER_ELEMENT);
      //   nameLen.writeInt16LE(val.name.length / 2);
      //   let name = new Buffer.alloc(val.name.length);
      //   name.write(val.name);

      //   let conditionLen = new Buffer.alloc(Int16Array.BYTES_PER_ELEMENT);
      //   conditionLen.writeInt16LE(val.condition.length / 2);
      //   let condition = new Buffer.alloc(val.condition.length);
      //   condition.write(val.condition);

      //   let settedLen = new Buffer.alloc(Int16Array.BYTES_PER_ELEMENT);
      //   settedLen.writeInt16LE(val.setted.length / 2);
      //   let setted = new Buffer.alloc(val.setted.length);
      //   setted.write(val.setted);

      //   console.log(val.no, setted.toString())

      //   buf = Buffer.concat(
      //     [
      //       buf,
      //       no,
      //       nameLen,
      //       Buffer.alloc(Int16Array.BYTES_PER_ELEMENT * 3),
      //       name,
      //       conditionLen,
      //       Buffer.alloc(Int16Array.BYTES_PER_ELEMENT * 3),
      //       condition,
      //       settedLen,
      //       Buffer.alloc(Int16Array.BYTES_PER_ELEMENT * 3),
      //       setted,
      //       Buffer.alloc(1)
      //     ]
      //   );
      // });

      fileStream.write(fd, buf, 0, buf.length, 0, err => {
        if (err) {
          console.log(err);
        }
      });
    }
  },

  created() {
    window.addEventListener("resize", this.onResize);

    this.langBtnSave = "保存";
  },

  mounted() {
    this.onResize();
  },

  destroyed() {
    window.removeEventListener("resize", this.onResize);
  }
};
</script>
