import { INITIAL_RTS } from './rtsData.js'
import { INITIAL_RWS } from './rwsData.js'
export { INITIAL_RTS, INITIAL_RWS }

export const INITIAL_USERS = [
  {
    "id": "u-admin",
    "username": "admin",
    "aliases": [
      "admin",
      "admin@ipl.test",
      "superadmin"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Super Administrator",
    "role": "admin",
    "jabatan": "admin",
    "resident_id": null,
    "rt_id": null,
    "rw_id": null,
    "status": "active"
  },
  {
    "id": "u-rw-01",
    "username": "rw01",
    "aliases": [
      "rw01",
      "rw1",
      "rw",
      "ketua.rw01",
      "rw-01"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Bpk. H. Rahmat Hidayat (Ketua RW 01)",
    "role": "rw",
    "jabatan": "rw",
    "resident_id": "w-4",
    "rt_id": null,
    "rw_id": "rw-01",
    "status": "active"
  },
  {
    "id": "u-bendahara-01",
    "username": "bendahara",
    "aliases": [
      "bendahara",
      "bendahara01",
      "bendahara.rw01",
      "bendahara-kas"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Ibu Hj. Ratna Dewi (Bendahara Keuangan)",
    "role": "bendahara",
    "jabatan": "bendahara",
    "resident_id": "w-2",
    "rt_id": "rt-01-01",
    "rw_id": "rw-01",
    "status": "active"
  },
  {
    "id": "u-pengurus-01",
    "username": "pengurus",
    "aliases": [
      "pengurus",
      "pengurus01",
      "pengurus.rw01",
      "pengurus-fasum"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Bpk. Mulyadi Pratama (Pengurus Fasum & Layanan)",
    "role": "pengurus",
    "jabatan": "pengurus",
    "resident_id": "w-3",
    "rt_id": "rt-01-01",
    "rw_id": "rw-01",
    "status": "active"
  },
  {
    "id": "u-rw-02",
    "username": "rw02",
    "aliases": [
      "rw02",
      "rw2",
      "admin02",
      "admin.rw02",
      "rw-02"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Pengurus RW 02 (Bpk. Bambang Wijaya)",
    "role": "admin",
    "resident_id": null,
    "rt_id": null,
    "rw_id": "rw-02",
    "status": "active"
  },
  {
    "id": "u-rw-03",
    "username": "rw03",
    "aliases": [
      "rw03",
      "rw3",
      "admin03",
      "admin.rw03",
      "rw-03"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Pengurus RW 03 (Bpk. Gunawan Wibowo)",
    "role": "admin",
    "resident_id": null,
    "rt_id": null,
    "rw_id": "rw-03",
    "status": "active"
  },
  {
    "id": "u-rw-04",
    "username": "rw04",
    "aliases": [
      "rw04",
      "rw4",
      "admin04",
      "admin.rw04",
      "rw-04"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Pengurus RW 04 (Bpk. Dedi Kurniawan)",
    "role": "admin",
    "resident_id": null,
    "rt_id": null,
    "rw_id": "rw-04",
    "status": "active"
  },
  {
    "id": "u-rw-05",
    "username": "rw05",
    "aliases": [
      "rw05",
      "rw5",
      "admin05",
      "admin.rw05",
      "rw-05"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Pengurus RW 05 (Bpk. Agus Salim)",
    "role": "admin",
    "resident_id": null,
    "rt_id": null,
    "rw_id": "rw-05",
    "status": "active"
  },
  {
    "id": "u-rt-01-01",
    "username": "rt01.rw01",
    "aliases": [
      "rt01.rw01",
      "rt1.rw1",
      "rt01rw01",
      "rt-01-01",
      "rt01",
      "rt1",
      "rt01@ipl.test",
      "rt",
      "pengurus"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Bpk. Syahdan (Ketua RT 01 / RW 01)",
    "role": "rt",
    "jabatan": "rt",
    "resident_id": null,
    "rt_id": "rt-01-01",
    "rw_id": "rw-01",
    "status": "active"
  },
  {
    "id": "u-rt-01-02",
    "username": "rt02.rw01",
    "aliases": [
      "rt02.rw01",
      "rt2.rw1",
      "rt02rw01",
      "rt-01-02",
      "rt02",
      "rt2",
      "rt02@ipl.test"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Bpk. Suryanto Wijaya (Ketua RT 02 / RW 01)",
    "role": "rt",
    "resident_id": null,
    "rt_id": "rt-01-02",
    "rw_id": "rw-01",
    "status": "active"
  },
  {
    "id": "u-rt-02-01",
    "username": "rt01.rw02",
    "aliases": [
      "rt01.rw02",
      "rt1.rw2",
      "rt01rw02",
      "rt-02-01"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Bpk. Herman Susilo (Ketua RT 01 / RW 02)",
    "role": "rt",
    "resident_id": null,
    "rt_id": "rt-02-01",
    "rw_id": "rw-02",
    "status": "active"
  },
  {
    "id": "u-rt-02-02",
    "username": "rt02.rw02",
    "aliases": [
      "rt02.rw02",
      "rt2.rw2",
      "rt02rw02",
      "rt-02-02"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Bpk. Hendra Saputra (Ketua RT 02 / RW 02)",
    "role": "rt",
    "resident_id": null,
    "rt_id": "rt-02-02",
    "rw_id": "rw-02",
    "status": "active"
  },
  {
    "id": "u-rt-03-01",
    "username": "rt01.rw03",
    "aliases": [
      "rt01.rw03",
      "rt1.rw3",
      "rt01rw03",
      "rt-03-01"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Bpk. Bambang Pamungkas (Ketua RT 01 / RW 03)",
    "role": "rt",
    "resident_id": null,
    "rt_id": "rt-03-01",
    "rw_id": "rw-03",
    "status": "active"
  },
  {
    "id": "u-rt-03-02",
    "username": "rt02.rw03",
    "aliases": [
      "rt02.rw03",
      "rt2.rw3",
      "rt02rw03",
      "rt-03-02"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Bpk. Doni Setiawan (Ketua RT 02 / RW 03)",
    "role": "rt",
    "resident_id": null,
    "rt_id": "rt-03-02",
    "rw_id": "rw-03",
    "status": "active"
  },
  {
    "id": "u-rt-04-01",
    "username": "rt01.rw04",
    "aliases": [
      "rt01.rw04",
      "rt1.rw4",
      "rt01rw04",
      "rt-04-01"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Bpk. Farhan Maulana (Ketua RT 01 / RW 04)",
    "role": "rt",
    "resident_id": null,
    "rt_id": "rt-04-01",
    "rw_id": "rw-04",
    "status": "active"
  },
  {
    "id": "u-rt-04-02",
    "username": "rt02.rw04",
    "aliases": [
      "rt02.rw04",
      "rt2.rw4",
      "rt02rw04",
      "rt-04-02"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Bpk. Gunawan Wibisono (Ketua RT 02 / RW 04)",
    "role": "rt",
    "resident_id": null,
    "rt_id": "rt-04-02",
    "rw_id": "rw-04",
    "status": "active"
  },
  {
    "id": "u-rt-05-01",
    "username": "rt01.rw05",
    "aliases": [
      "rt01.rw05",
      "rt1.rw5",
      "rt01rw05",
      "rt-05-01"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Bpk. Irfan Hakim (Ketua RT 01 / RW 05)",
    "role": "rt",
    "resident_id": null,
    "rt_id": "rt-05-01",
    "rw_id": "rw-05",
    "status": "active"
  },
  {
    "id": "u-rt-05-02",
    "username": "rt02.rw05",
    "aliases": [
      "rt02.rw05",
      "rt2.rw5",
      "rt02rw05",
      "rt-05-02"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Bpk. Joko Anwar (Ketua RT 02 / RW 05)",
    "role": "rt",
    "resident_id": null,
    "rt_id": "rt-05-02",
    "rw_id": "rw-05",
    "status": "active"
  },
  {
    "id": "u-w-1",
    "username": "bambang.sutrisno",
    "aliases": [
      "bambang.sutrisno",
      "bambang.sutrisno",
      "bambang",
      "warga",
      "warga1",
      "w-1",
      "WR101"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Bambang Sutrisno (Warga Blok A-01)",
    "role": "warga",
    "jabatan": "warga",
    "resident_id": "w-1",
    "rt_id": "rt-01-01",
    "rw_id": "rw-01",
    "status": "active"
  },
  {
    "id": "u-w-2",
    "username": "ahmad.fauzi",
    "aliases": [
      "ahmad.fauzi",
      "ahmad.fauzi",
      "ahmad",
      "warga2",
      "w-2",
      "WR102"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Ahmad Fauzi (Warga Blok A-02)",
    "role": "warga",
    "resident_id": "w-2",
    "rt_id": "rt-01-01",
    "rw_id": "rw-01",
    "status": "active"
  },
  {
    "id": "u-w-3",
    "username": "siti.rahayu",
    "aliases": [
      "siti.rahayu",
      "siti.rahayu",
      "siti",
      "warga3",
      "w-3",
      "WR103"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Siti Rahayu (Warga Blok A-03)",
    "role": "warga",
    "resident_id": "w-3",
    "rt_id": "rt-01-01",
    "rw_id": "rw-01",
    "status": "active"
  },
  {
    "id": "u-w-4",
    "username": "budi.santoso",
    "aliases": [
      "budi.santoso",
      "budi.santoso",
      "budi",
      "warga4",
      "w-4",
      "WR104"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Budi Santoso (Warga Blok B-01)",
    "role": "warga",
    "resident_id": "w-4",
    "rt_id": "rt-01-02",
    "rw_id": "rw-01",
    "status": "active"
  },
  {
    "id": "u-w-5",
    "username": "dewi.lestari",
    "aliases": [
      "dewi.lestari",
      "dewi.lestari",
      "dewi",
      "warga5",
      "w-5",
      "WR105"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Dewi Lestari (Warga Blok B-02)",
    "role": "warga",
    "resident_id": "w-5",
    "rt_id": "rt-01-02",
    "rw_id": "rw-01",
    "status": "active"
  },
  {
    "id": "u-w-6",
    "username": "hendra.pratama",
    "aliases": [
      "hendra.pratama",
      "hendra.pratama",
      "hendra",
      "warga6",
      "w-6",
      "WR106"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Hendra Pratama (Warga Blok B-03)",
    "role": "warga",
    "resident_id": "w-6",
    "rt_id": "rt-01-02",
    "rw_id": "rw-01",
    "status": "active"
  },
  {
    "id": "u-w-7",
    "username": "rahmat.hidayat",
    "aliases": [
      "rahmat.hidayat",
      "rahmat.hidayat",
      "rahmat",
      "warga7",
      "w-7",
      "WR107"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Rahmat Hidayat (Warga Blok C-01)",
    "role": "warga",
    "resident_id": "w-7",
    "rt_id": "rt-02-01",
    "rw_id": "rw-02",
    "status": "active"
  },
  {
    "id": "u-w-8",
    "username": "sri.wahyuni",
    "aliases": [
      "sri.wahyuni",
      "sri.wahyuni",
      "sri",
      "warga8",
      "w-8",
      "WR108"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Sri Wahyuni (Warga Blok C-02)",
    "role": "warga",
    "resident_id": "w-8",
    "rt_id": "rt-02-01",
    "rw_id": "rw-02",
    "status": "active"
  },
  {
    "id": "u-w-9",
    "username": "joko.widodo",
    "aliases": [
      "joko.widodo",
      "joko.widodo",
      "joko",
      "warga9",
      "w-9",
      "WR109"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Joko Widodo (Warga Blok C-03)",
    "role": "warga",
    "resident_id": "w-9",
    "rt_id": "rt-02-01",
    "rw_id": "rw-02",
    "status": "active"
  },
  {
    "id": "u-w-10",
    "username": "arif.wibowo",
    "aliases": [
      "arif.wibowo",
      "arif.wibowo",
      "arif",
      "warga10",
      "w-10",
      "WR110"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Arif Wibowo (Warga Blok D-01)",
    "role": "warga",
    "resident_id": "w-10",
    "rt_id": "rt-02-02",
    "rw_id": "rw-02",
    "status": "active"
  },
  {
    "id": "u-w-11",
    "username": "nurul.hidayah",
    "aliases": [
      "nurul.hidayah",
      "nurul.hidayah",
      "nurul",
      "warga11",
      "w-11",
      "WR111"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Nurul Hidayah (Warga Blok D-02)",
    "role": "warga",
    "resident_id": "w-11",
    "rt_id": "rt-02-02",
    "rw_id": "rw-02",
    "status": "active"
  },
  {
    "id": "u-w-12",
    "username": "eko.prasetyo",
    "aliases": [
      "eko.prasetyo",
      "eko.prasetyo",
      "eko",
      "warga12",
      "w-12",
      "WR112"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Eko Prasetyo (Warga Blok D-03)",
    "role": "warga",
    "resident_id": "w-12",
    "rt_id": "rt-02-02",
    "rw_id": "rw-02",
    "status": "active"
  },
  {
    "id": "u-w-13",
    "username": "agus.setiawan",
    "aliases": [
      "agus.setiawan",
      "agus.setiawan",
      "agus",
      "warga13",
      "w-13",
      "WR113"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Agus Setiawan (Warga Blok E-01)",
    "role": "warga",
    "resident_id": "w-13",
    "rt_id": "rt-03-01",
    "rw_id": "rw-03",
    "status": "active"
  },
  {
    "id": "u-w-14",
    "username": "rina.marlina",
    "aliases": [
      "rina.marlina",
      "rina.marlina",
      "rina",
      "warga14",
      "w-14",
      "WR114"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Rina Marlina (Warga Blok E-02)",
    "role": "warga",
    "resident_id": "w-14",
    "rt_id": "rt-03-01",
    "rw_id": "rw-03",
    "status": "active"
  },
  {
    "id": "u-w-15",
    "username": "doni.kusuma",
    "aliases": [
      "doni.kusuma",
      "doni.kusuma",
      "doni",
      "warga15",
      "w-15",
      "WR115"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Doni Kusuma (Warga Blok E-03)",
    "role": "warga",
    "resident_id": "w-15",
    "rt_id": "rt-03-01",
    "rw_id": "rw-03",
    "status": "active"
  },
  {
    "id": "u-w-16",
    "username": "bayu.permana",
    "aliases": [
      "bayu.permana",
      "bayu.permana",
      "bayu",
      "warga16",
      "w-16",
      "WR116"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Bayu Permana (Warga Blok F-01)",
    "role": "warga",
    "resident_id": "w-16",
    "rt_id": "rt-03-02",
    "rw_id": "rw-03",
    "status": "active"
  },
  {
    "id": "u-w-17",
    "username": "dian.sastro",
    "aliases": [
      "dian.sastro",
      "dian.sastro",
      "dian",
      "warga17",
      "w-17",
      "WR117"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Dian Sastro (Warga Blok F-02)",
    "role": "warga",
    "resident_id": "w-17",
    "rt_id": "rt-03-02",
    "rw_id": "rw-03",
    "status": "active"
  },
  {
    "id": "u-w-18",
    "username": "farhan.ramli",
    "aliases": [
      "farhan.ramli",
      "farhan.ramli",
      "farhan",
      "warga18",
      "w-18",
      "WR118"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Farhan Ramli (Warga Blok F-03)",
    "role": "warga",
    "resident_id": "w-18",
    "rt_id": "rt-03-02",
    "rw_id": "rw-03",
    "status": "active"
  },
  {
    "id": "u-w-19",
    "username": "gilang.ramadhan",
    "aliases": [
      "gilang.ramadhan",
      "gilang.ramadhan",
      "gilang",
      "warga19",
      "w-19",
      "WR119"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Gilang Ramadhan (Warga Blok G-01)",
    "role": "warga",
    "resident_id": "w-19",
    "rt_id": "rt-04-01",
    "rw_id": "rw-04",
    "status": "active"
  },
  {
    "id": "u-w-20",
    "username": "hani.handayani",
    "aliases": [
      "hani.handayani",
      "hani.handayani",
      "hani",
      "warga20",
      "w-20",
      "WR120"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Hani Handayani (Warga Blok G-02)",
    "role": "warga",
    "resident_id": "w-20",
    "rt_id": "rt-04-01",
    "rw_id": "rw-04",
    "status": "active"
  },
  {
    "id": "u-w-21",
    "username": "indra.wijaya",
    "aliases": [
      "indra.wijaya",
      "indra.wijaya",
      "indra",
      "warga21",
      "w-21",
      "WR121"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Indra Wijaya (Warga Blok G-03)",
    "role": "warga",
    "resident_id": "w-21",
    "rt_id": "rt-04-01",
    "rw_id": "rw-04",
    "status": "active"
  },
  {
    "id": "u-w-22",
    "username": "junaedi.akbar",
    "aliases": [
      "junaedi.akbar",
      "junaedi.akbar",
      "junaedi",
      "warga22",
      "w-22",
      "WR122"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Junaedi Akbar (Warga Blok H-01)",
    "role": "warga",
    "resident_id": "w-22",
    "rt_id": "rt-04-02",
    "rw_id": "rw-04",
    "status": "active"
  },
  {
    "id": "u-w-23",
    "username": "kartika.dewi",
    "aliases": [
      "kartika.dewi",
      "kartika.dewi",
      "kartika",
      "warga23",
      "w-23",
      "WR123"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Kartika Dewi (Warga Blok H-02)",
    "role": "warga",
    "resident_id": "w-23",
    "rt_id": "rt-04-02",
    "rw_id": "rw-04",
    "status": "active"
  },
  {
    "id": "u-w-24",
    "username": "lukman.hakim",
    "aliases": [
      "lukman.hakim",
      "lukman.hakim",
      "lukman",
      "warga24",
      "w-24",
      "WR124"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Lukman Hakim (Warga Blok H-03)",
    "role": "warga",
    "resident_id": "w-24",
    "rt_id": "rt-04-02",
    "rw_id": "rw-04",
    "status": "active"
  },
  {
    "id": "u-w-25",
    "username": "maya.anggraini",
    "aliases": [
      "maya.anggraini",
      "maya.anggraini",
      "maya",
      "warga25",
      "w-25",
      "WR125"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Maya Anggraini (Warga Blok I-01)",
    "role": "warga",
    "resident_id": "w-25",
    "rt_id": "rt-05-01",
    "rw_id": "rw-05",
    "status": "active"
  },
  {
    "id": "u-w-26",
    "username": "nanda.pratama",
    "aliases": [
      "nanda.pratama",
      "nanda.pratama",
      "nanda",
      "warga26",
      "w-26",
      "WR126"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Nanda Pratama (Warga Blok I-02)",
    "role": "warga",
    "resident_id": "w-26",
    "rt_id": "rt-05-01",
    "rw_id": "rw-05",
    "status": "active"
  },
  {
    "id": "u-w-27",
    "username": "osman.syarif",
    "aliases": [
      "osman.syarif",
      "osman.syarif",
      "osman",
      "warga27",
      "w-27",
      "WR127"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Osman Syarif (Warga Blok I-03)",
    "role": "warga",
    "resident_id": "w-27",
    "rt_id": "rt-05-01",
    "rw_id": "rw-05",
    "status": "active"
  },
  {
    "id": "u-w-28",
    "username": "putri.melati",
    "aliases": [
      "putri.melati",
      "putri.melati",
      "putri",
      "warga28",
      "w-28",
      "WR128"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Putri Melati (Warga Blok J-01)",
    "role": "warga",
    "resident_id": "w-28",
    "rt_id": "rt-05-02",
    "rw_id": "rw-05",
    "status": "active"
  },
  {
    "id": "u-w-29",
    "username": "qori.iskandar",
    "aliases": [
      "qori.iskandar",
      "qori.iskandar",
      "qori",
      "warga29",
      "w-29",
      "WR129"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Qori Iskandar (Warga Blok J-02)",
    "role": "warga",
    "resident_id": "w-29",
    "rt_id": "rt-05-02",
    "rw_id": "rw-05",
    "status": "active"
  },
  {
    "id": "u-w-30",
    "username": "rizky.ramadhan",
    "aliases": [
      "rizky.ramadhan",
      "rizky.ramadhan",
      "rizky",
      "warga30",
      "w-30",
      "WR130"
    ],
    "password_hash": "c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e",
    "name": "Rizky Ramadhan (Warga Blok J-03)",
    "role": "warga",
    "resident_id": "w-30",
    "rt_id": "rt-05-02",
    "rw_id": "rw-05",
    "status": "active"
  }
]

export const INITIAL_ADMIN_AUTH = {
  username: 'admin@ipl.test',
  password_hash: 'c699afa220b2b8d1587025c7c0bb839b95358f0cb72a70fadca0e699fd0fb20e'
}

export const INITIAL_CONFIG = {
  namaLingkungan: 'Perumahan Alam Tirta Lestari',
  rw: 'RW 01',
  rtRw: 'RT 01 / RW 01',
  kelurahan: 'Pagelaran',
  kecamatan: 'Ciomas',
  kota: 'Kabupaten Bogor',
  ketuaRw: 'Bpk. H. Rahmat Hidayat',
  bendaharaRw: 'Bpk. Mulyadi',
  kontakRw: '081122334401',
  rekeningRw: 'Bank Transfer Sandbox 090908080777 a.n Rafi Nurrahman',
  ketuaRt: 'Bpk. Syahdan',
  bendahara: 'Ibu Siti Aminah',
  kontakRt: '081234567801',
  rekeningBank: 'Bank Transfer Sandbox 090908080777 a.n Rafi Nurrahman',
  autoBilling: {
    enabled: true,
    publishDay: 5,
    dueDay: 20,
    scope: 'ALL',
    last_run_at: null,
    last_run_period: null,
    last_run_status: 'standby',
    last_run_created_count: 0,
    last_run_skipped_count: 0,
    last_run_message: 'Sistem otomatisasi aktif menunggu jadwal tanggal terbit.',
    scheduler_heartbeat: new Date().toISOString(),
    scheduler_status: 'RUNNING'
  }
}

export const INITIAL_JENIS_IURAN = [
  // Iuran Scope RT
  { id: 'ji-1', nama: 'Iuran Kebersihan & Sampah RT', nominal: 35000, wajib: true, aktif: true, payment_scope: 'RT', target_id: 'ALL_RT', periode: 'Bulanan', keterangan: 'Biaya angkut sampah rutin 3x seminggu' },
  { id: 'ji-2', nama: 'Iuran Keamanan & Portal RT', nominal: 50000, wajib: true, aktif: true, payment_scope: 'RT', target_id: 'ALL_RT', periode: 'Bulanan', keterangan: 'Honor satpam jaga pos RT' },
  { id: 'ji-3', nama: 'Kas Pemeliharaan & Fasum RT', nominal: 25000, wajib: true, aktif: true, payment_scope: 'RT', target_id: 'ALL_RT', periode: 'Bulanan', keterangan: 'Lampu jalan, taman warga, dan sarana RT' },
  { id: 'ji-4', nama: 'Dana Sosial & Kematian RT', nominal: 10000, wajib: false, aktif: true, payment_scope: 'RT', target_id: 'ALL_RT', periode: 'Bulanan', keterangan: 'Bantuan santunan warga RT' },
  // Iuran Scope RW
  { id: 'ji-rw-1', nama: 'Iuran Pembangunan & Fasum RW', nominal: 25000, wajib: true, aktif: true, payment_scope: 'RW', target_id: 'ALL_RW', periode: 'Bulanan', keterangan: 'Perbaikan jalan utama, pos keamanan gerbang RW' },
  { id: 'ji-rw-2', nama: 'Iuran Kegiatan Bersama RW', nominal: 15000, wajib: false, aktif: true, payment_scope: 'RW', target_id: 'ALL_RW', periode: 'Bulanan', keterangan: 'Event bersama tingkat RW' }
]

export const INITIAL_BANK_ACCOUNTS = [
  {
    "id": "ba-moota-main",
    "owner_type": "ALL",
    "owner_id": "moota",
    "bank_name": "Bank Transfer (Sandbox)",
    "account_number": "090908080777",
    "account_holder": "Rafi Nurrahman",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "ba-rw-01-1",
    "owner_type": "RW",
    "owner_id": "rw-01",
    "bank_name": "BCA",
    "account_number": "7788990001",
    "account_holder": "Bendahara RW 01 (Bpk. Mulyadi)",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "ba-rw-02-1",
    "owner_type": "RW",
    "owner_id": "rw-02",
    "bank_name": "BCA",
    "account_number": "7788990002",
    "account_holder": "Bendahara RW 02 (Ibu Ratna Sari)",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "ba-rw-03-1",
    "owner_type": "RW",
    "owner_id": "rw-03",
    "bank_name": "BCA",
    "account_number": "7788990003",
    "account_holder": "Bendahara RW 03 (Bpk. Joko Susilo)",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "ba-rw-04-1",
    "owner_type": "RW",
    "owner_id": "rw-04",
    "bank_name": "BCA",
    "account_number": "7788990004",
    "account_holder": "Bendahara RW 04 (Ibu Endang Lestari)",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "ba-rw-05-1",
    "owner_type": "RW",
    "owner_id": "rw-05",
    "bank_name": "BCA",
    "account_number": "7788990005",
    "account_holder": "Bendahara RW 05 (Bpk. Arif Rahman)",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "ba-rt-01-01-1",
    "owner_type": "RT",
    "owner_id": "rt-01-01",
    "bank_name": "BCA",
    "account_number": "873019280101",
    "account_holder": "Bendahara RT 01 / RW 01 (Ibu Siti Aminah)",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "ba-rt-01-02-1",
    "owner_type": "RT",
    "owner_id": "rt-01-02",
    "bank_name": "BCA",
    "account_number": "873019280102",
    "account_holder": "Bendahara RT 02 / RW 01 (Ibu Ratna Dewi)",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "ba-rt-02-01-1",
    "owner_type": "RT",
    "owner_id": "rt-02-01",
    "bank_name": "BCA",
    "account_number": "873019280201",
    "account_holder": "Bendahara RT 01 / RW 02 (Bpk. Agus Santoso)",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "ba-rt-02-02-1",
    "owner_type": "RT",
    "owner_id": "rt-02-02",
    "bank_name": "BCA",
    "account_number": "873019280202",
    "account_holder": "Bendahara RT 02 / RW 02 (Ibu Diana Kusuma)",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "ba-rt-03-01-1",
    "owner_type": "RT",
    "owner_id": "rt-03-01",
    "bank_name": "BCA",
    "account_number": "873019280301",
    "account_holder": "Bendahara RT 01 / RW 03 (Ibu Tri Astuti)",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "ba-rt-03-02-1",
    "owner_type": "RT",
    "owner_id": "rt-03-02",
    "bank_name": "BCA",
    "account_number": "873019280302",
    "account_holder": "Bendahara RT 02 / RW 03 (Bpk. Eko Wahyudi)",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "ba-rt-04-01-1",
    "owner_type": "RT",
    "owner_id": "rt-04-01",
    "bank_name": "BCA",
    "account_number": "873019280401",
    "account_holder": "Bendahara RT 01 / RW 04 (Ibu Gita Gutawa)",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "ba-rt-04-02-1",
    "owner_type": "RT",
    "owner_id": "rt-04-02",
    "bank_name": "BCA",
    "account_number": "873019280402",
    "account_holder": "Bendahara RT 02 / RW 04 (Bpk. Hari Prasetyo)",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "ba-rt-05-01-1",
    "owner_type": "RT",
    "owner_id": "rt-05-01",
    "bank_name": "BCA",
    "account_number": "873019280501",
    "account_holder": "Bendahara RT 01 / RW 05 (Ibu Juwita Bahar)",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "ba-rt-05-02-1",
    "owner_type": "RT",
    "owner_id": "rt-05-02",
    "bank_name": "BCA",
    "account_number": "873019280502",
    "account_holder": "Bendahara RT 02 / RW 05 (Ibu Kartika Putri)",
    "is_primary": true,
    "is_active": true
  }
]

export const INITIAL_QRIS_ACCOUNTS = [
  {
    "id": "qris-rw-01-1",
    "owner_type": "RW",
    "owner_id": "rw-01",
    "qris_name": "QRIS RW 01 Utama",
    "image_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KAS_RW_01",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "qris-rw-02-1",
    "owner_type": "RW",
    "owner_id": "rw-02",
    "qris_name": "QRIS RW 02 Utama",
    "image_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KAS_RW_02",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "qris-rw-03-1",
    "owner_type": "RW",
    "owner_id": "rw-03",
    "qris_name": "QRIS RW 03 Utama",
    "image_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KAS_RW_03",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "qris-rw-04-1",
    "owner_type": "RW",
    "owner_id": "rw-04",
    "qris_name": "QRIS RW 04 Utama",
    "image_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KAS_RW_04",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "qris-rw-05-1",
    "owner_type": "RW",
    "owner_id": "rw-05",
    "qris_name": "QRIS RW 05 Utama",
    "image_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KAS_RW_05",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "qris-rt-01-01-1",
    "owner_type": "RT",
    "owner_id": "rt-01-01",
    "qris_name": "QRIS RT 01 / RW 01 Utama",
    "image_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KAS_RT_01_01",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "qris-rt-01-02-1",
    "owner_type": "RT",
    "owner_id": "rt-01-02",
    "qris_name": "QRIS RT 02 / RW 01 Utama",
    "image_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KAS_RT_01_02",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "qris-rt-02-01-1",
    "owner_type": "RT",
    "owner_id": "rt-02-01",
    "qris_name": "QRIS RT 01 / RW 02 Utama",
    "image_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KAS_RT_02_01",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "qris-rt-02-02-1",
    "owner_type": "RT",
    "owner_id": "rt-02-02",
    "qris_name": "QRIS RT 02 / RW 02 Utama",
    "image_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KAS_RT_02_02",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "qris-rt-03-01-1",
    "owner_type": "RT",
    "owner_id": "rt-03-01",
    "qris_name": "QRIS RT 01 / RW 03 Utama",
    "image_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KAS_RT_03_01",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "qris-rt-03-02-1",
    "owner_type": "RT",
    "owner_id": "rt-03-02",
    "qris_name": "QRIS RT 02 / RW 03 Utama",
    "image_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KAS_RT_03_02",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "qris-rt-04-01-1",
    "owner_type": "RT",
    "owner_id": "rt-04-01",
    "qris_name": "QRIS RT 01 / RW 04 Utama",
    "image_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KAS_RT_04_01",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "qris-rt-04-02-1",
    "owner_type": "RT",
    "owner_id": "rt-04-02",
    "qris_name": "QRIS RT 02 / RW 04 Utama",
    "image_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KAS_RT_04_02",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "qris-rt-05-01-1",
    "owner_type": "RT",
    "owner_id": "rt-05-01",
    "qris_name": "QRIS RT 01 / RW 05 Utama",
    "image_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KAS_RT_05_01",
    "is_primary": true,
    "is_active": true
  },
  {
    "id": "qris-rt-05-02-1",
    "owner_type": "RT",
    "owner_id": "rt-05-02",
    "qris_name": "QRIS RT 02 / RW 05 Utama",
    "image_url": "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=KAS_RT_05_02",
    "is_primary": true,
    "is_active": true
  }
]

export const ALASAN_PENOLAKAN_PRESET = [
  'Nominal tidak sesuai',
  'Bukti pembayaran tidak jelas',
  'Bukti pembayaran tidak ditemukan',
  'Rekening tujuan tidak sesuai',
  'QRIS tujuan tidak sesuai',
  'Tanggal pembayaran tidak sesuai',
  'Bukti pembayaran sudah pernah digunakan',
  'Bukti pembayaran tidak sesuai dengan tagihan',
  'Lainnya'
]

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    userId: 'u-w-1',
    residentId: 'w-1',
    title: 'Pembayaran IPL Terverifikasi ✅',
    message: 'Pembayaran IPL September 2026 sebesar Rp 120.000 telah disetujui oleh Bendahara RT 01.',
    type: 'payment_verified',
    tagihanId: 'tag-rt-2026-09-w-1',
    read: false,
    created_at: '2026-09-05T14:30:00Z'
  }
]

export const INITIAL_AUDIT_LOGS = [
  {
    id: 'audit-1',
    userId: 'u-rt-01-01',
    userName: 'Bpk. Syahdan (Bendahara RT 01)',
    userRole: 'rt',
    action: 'VERIFY_PAYMENT',
    entity: 'tagihan',
    entityId: 'tag-rt-2026-09-w-1',
    details: 'Menyetujui pembayaran IPL September 2026 warga Bambang Sutrisno (Lunas). No Kwitansi: KW-RT-01-202609-100',
    created_at: '2026-09-05T14:30:00Z'
  }
]

export const INITIAL_WARGA = [
  {
    "id": "w-1",
    "rt_id": "rt-01-01",
    "rw_id": "rw-01",
    "kodeUnik": "WR101",
    "nama": "Bambang Sutrisno",
    "jabatan": "warga",
    "nik": "320101150482001",
    "noKk": "320101150482001",
    "blok": "A",
    "noRumah": "01",
    "noHp": "08121111001",
    "email": "bambang.sutrisno@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "PNS",
    "lat": -6.5975,
    "lng": 106.7635,
    "kontakDaruratNama": "Bambang Sutrisno (Keluarga)",
    "kontakDaruratHp": "08121111001",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-1-1",
        "nama": "Bambang Sutrisno",
        "nik": "320101150482001",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "PNS",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111001"
      }
    ]
  },
  {
    "id": "w-2",
    "rt_id": "rt-01-01",
    "rw_id": "rw-01",
    "kodeUnik": "WR102",
    "nama": "Ahmad Fauzi",
    "jabatan": "bendahara",
    "nik": "320101150482002",
    "noKk": "320101150482002",
    "blok": "A",
    "noRumah": "02",
    "noHp": "08121111002",
    "email": "ahmad.fauzi@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Karyawan Swasta",
    "lat": -6.5973500000000005,
    "lng": 106.76365,
    "kontakDaruratNama": "Ahmad Fauzi (Keluarga)",
    "kontakDaruratHp": "08121111002",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-2-1",
        "nama": "Ahmad Fauzi",
        "nik": "320101150482002",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Karyawan Swasta",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111002"
      }
    ]
  },
  {
    "id": "w-3",
    "rt_id": "rt-01-01",
    "rw_id": "rw-01",
    "kodeUnik": "WR103",
    "nama": "Siti Rahayu",
    "jabatan": "pengurus",
    "nik": "320101150482003",
    "noKk": "320101150482003",
    "blok": "A",
    "noRumah": "03",
    "noHp": "08121111003",
    "email": "siti.rahayu@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Perempuan",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Wiraswasta",
    "lat": -6.5972,
    "lng": 106.76379999999999,
    "kontakDaruratNama": "Siti Rahayu (Keluarga)",
    "kontakDaruratHp": "08121111003",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-3-1",
        "nama": "Siti Rahayu",
        "nik": "320101150482003",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Perempuan",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Wiraswasta",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111003"
      }
    ]
  },
  {
    "id": "w-4",
    "rt_id": "rt-01-02",
    "rw_id": "rw-01",
    "kodeUnik": "WR104",
    "nama": "Budi Santoso",
    "jabatan": "rw",
    "nik": "320101150482004",
    "noKk": "320101150482004",
    "blok": "B",
    "noRumah": "01",
    "noHp": "08121111004",
    "email": "budi.santoso@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Dosen",
    "lat": -6.59705,
    "lng": 106.76395,
    "kontakDaruratNama": "Budi Santoso (Keluarga)",
    "kontakDaruratHp": "08121111004",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-4-1",
        "nama": "Budi Santoso",
        "nik": "320101150482004",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Dosen",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111004"
      }
    ]
  },
  {
    "id": "w-5",
    "rt_id": "rt-01-02",
    "rw_id": "rw-01",
    "kodeUnik": "WR105",
    "nama": "Dewi Lestari",
    "nik": "320101150482005",
    "noKk": "320101150482005",
    "blok": "B",
    "noRumah": "02",
    "noHp": "08121111005",
    "email": "dewi.lestari@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Perempuan",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Dokter",
    "lat": -6.5969,
    "lng": 106.7641,
    "kontakDaruratNama": "Dewi Lestari (Keluarga)",
    "kontakDaruratHp": "08121111005",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-5-1",
        "nama": "Dewi Lestari",
        "nik": "320101150482005",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Perempuan",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Dokter",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111005"
      }
    ]
  },
  {
    "id": "w-6",
    "rt_id": "rt-01-02",
    "rw_id": "rw-01",
    "kodeUnik": "WR106",
    "nama": "Hendra Pratama",
    "nik": "320101150482006",
    "noKk": "320101150482006",
    "blok": "B",
    "noRumah": "03",
    "noHp": "08121111006",
    "email": "hendra.pratama@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Arsitek",
    "lat": -6.59675,
    "lng": 106.76424999999999,
    "kontakDaruratNama": "Hendra Pratama (Keluarga)",
    "kontakDaruratHp": "08121111006",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-6-1",
        "nama": "Hendra Pratama",
        "nik": "320101150482006",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Arsitek",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111006"
      }
    ]
  },
  {
    "id": "w-7",
    "rt_id": "rt-02-01",
    "rw_id": "rw-02",
    "kodeUnik": "WR107",
    "nama": "Rahmat Hidayat",
    "nik": "320101150482007",
    "noKk": "320101150482007",
    "blok": "C",
    "noRumah": "01",
    "noHp": "08121111007",
    "email": "rahmat.hidayat@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Akuntan",
    "lat": -6.5966000000000005,
    "lng": 106.7644,
    "kontakDaruratNama": "Rahmat Hidayat (Keluarga)",
    "kontakDaruratHp": "08121111007",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-7-1",
        "nama": "Rahmat Hidayat",
        "nik": "320101150482007",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Akuntan",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111007"
      }
    ]
  },
  {
    "id": "w-8",
    "rt_id": "rt-02-01",
    "rw_id": "rw-02",
    "kodeUnik": "WR108",
    "nama": "Sri Wahyuni",
    "nik": "320101150482008",
    "noKk": "320101150482008",
    "blok": "C",
    "noRumah": "02",
    "noHp": "08121111008",
    "email": "sri.wahyuni@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Perempuan",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Guru",
    "lat": -6.59645,
    "lng": 106.76455,
    "kontakDaruratNama": "Sri Wahyuni (Keluarga)",
    "kontakDaruratHp": "08121111008",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-8-1",
        "nama": "Sri Wahyuni",
        "nik": "320101150482008",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Perempuan",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Guru",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111008"
      }
    ]
  },
  {
    "id": "w-9",
    "rt_id": "rt-02-01",
    "rw_id": "rw-02",
    "kodeUnik": "WR109",
    "nama": "Joko Widodo",
    "nik": "320101150482009",
    "noKk": "320101150482009",
    "blok": "C",
    "noRumah": "03",
    "noHp": "08121111009",
    "email": "joko.widodo@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Wiraswasta",
    "lat": -6.5963,
    "lng": 106.76469999999999,
    "kontakDaruratNama": "Joko Widodo (Keluarga)",
    "kontakDaruratHp": "08121111009",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-9-1",
        "nama": "Joko Widodo",
        "nik": "320101150482009",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Wiraswasta",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111009"
      }
    ]
  },
  {
    "id": "w-10",
    "rt_id": "rt-02-02",
    "rw_id": "rw-02",
    "kodeUnik": "WR110",
    "nama": "Arif Wibowo",
    "nik": "320101150482010",
    "noKk": "320101150482010",
    "blok": "D",
    "noRumah": "01",
    "noHp": "08121111010",
    "email": "arif.wibowo@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Programmer",
    "lat": -6.59615,
    "lng": 106.76485,
    "kontakDaruratNama": "Arif Wibowo (Keluarga)",
    "kontakDaruratHp": "08121111010",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-10-1",
        "nama": "Arif Wibowo",
        "nik": "320101150482010",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Programmer",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111010"
      }
    ]
  },
  {
    "id": "w-11",
    "rt_id": "rt-02-02",
    "rw_id": "rw-02",
    "kodeUnik": "WR111",
    "nama": "Nurul Hidayah",
    "nik": "320101150482011",
    "noKk": "320101150482011",
    "blok": "D",
    "noRumah": "02",
    "noHp": "08121111011",
    "email": "nurul.hidayah@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Perempuan",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Apoteker",
    "lat": -6.596,
    "lng": 106.76499999999999,
    "kontakDaruratNama": "Nurul Hidayah (Keluarga)",
    "kontakDaruratHp": "08121111011",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-11-1",
        "nama": "Nurul Hidayah",
        "nik": "320101150482011",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Perempuan",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Apoteker",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111011"
      }
    ]
  },
  {
    "id": "w-12",
    "rt_id": "rt-02-02",
    "rw_id": "rw-02",
    "kodeUnik": "WR112",
    "nama": "Eko Prasetyo",
    "nik": "320101150482012",
    "noKk": "320101150482012",
    "blok": "D",
    "noRumah": "03",
    "noHp": "08121111012",
    "email": "eko.prasetyo@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Manajer Proyek",
    "lat": -6.59585,
    "lng": 106.76514999999999,
    "kontakDaruratNama": "Eko Prasetyo (Keluarga)",
    "kontakDaruratHp": "08121111012",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-12-1",
        "nama": "Eko Prasetyo",
        "nik": "320101150482012",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Manajer Proyek",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111012"
      }
    ]
  },
  {
    "id": "w-13",
    "rt_id": "rt-03-01",
    "rw_id": "rw-03",
    "kodeUnik": "WR113",
    "nama": "Agus Setiawan",
    "nik": "320101150482013",
    "noKk": "320101150482013",
    "blok": "E",
    "noRumah": "01",
    "noHp": "08121111013",
    "email": "agus.setiawan@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "PNS",
    "lat": -6.5957,
    "lng": 106.7653,
    "kontakDaruratNama": "Agus Setiawan (Keluarga)",
    "kontakDaruratHp": "08121111013",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-13-1",
        "nama": "Agus Setiawan",
        "nik": "320101150482013",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "PNS",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111013"
      }
    ]
  },
  {
    "id": "w-14",
    "rt_id": "rt-03-01",
    "rw_id": "rw-03",
    "kodeUnik": "WR114",
    "nama": "Rina Marlina",
    "nik": "320101150482014",
    "noKk": "320101150482014",
    "blok": "E",
    "noRumah": "02",
    "noHp": "08121111014",
    "email": "rina.marlina@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Perempuan",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Konsultan",
    "lat": -6.59555,
    "lng": 106.76544999999999,
    "kontakDaruratNama": "Rina Marlina (Keluarga)",
    "kontakDaruratHp": "08121111014",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-14-1",
        "nama": "Rina Marlina",
        "nik": "320101150482014",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Perempuan",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Konsultan",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111014"
      }
    ]
  },
  {
    "id": "w-15",
    "rt_id": "rt-03-01",
    "rw_id": "rw-03",
    "kodeUnik": "WR115",
    "nama": "Doni Kusuma",
    "nik": "320101150482015",
    "noKk": "320101150482015",
    "blok": "E",
    "noRumah": "03",
    "noHp": "08121111015",
    "email": "doni.kusuma@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Desainer Grafis",
    "lat": -6.5954,
    "lng": 106.76559999999999,
    "kontakDaruratNama": "Doni Kusuma (Keluarga)",
    "kontakDaruratHp": "08121111015",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-15-1",
        "nama": "Doni Kusuma",
        "nik": "320101150482015",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Desainer Grafis",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111015"
      }
    ]
  },
  {
    "id": "w-16",
    "rt_id": "rt-03-02",
    "rw_id": "rw-03",
    "kodeUnik": "WR116",
    "nama": "Bayu Permana",
    "nik": "320101150482016",
    "noKk": "320101150482016",
    "blok": "F",
    "noRumah": "01",
    "noHp": "08121111016",
    "email": "bayu.permana@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Wiraswasta",
    "lat": -6.59525,
    "lng": 106.76575,
    "kontakDaruratNama": "Bayu Permana (Keluarga)",
    "kontakDaruratHp": "08121111016",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-16-1",
        "nama": "Bayu Permana",
        "nik": "320101150482016",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Wiraswasta",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111016"
      }
    ]
  },
  {
    "id": "w-17",
    "rt_id": "rt-03-02",
    "rw_id": "rw-03",
    "kodeUnik": "WR117",
    "nama": "Dian Sastro",
    "nik": "320101150482017",
    "noKk": "320101150482017",
    "blok": "F",
    "noRumah": "02",
    "noHp": "08121111017",
    "email": "dian.sastro@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Perempuan",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Pegawai Bank",
    "lat": -6.5951,
    "lng": 106.76589999999999,
    "kontakDaruratNama": "Dian Sastro (Keluarga)",
    "kontakDaruratHp": "08121111017",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-17-1",
        "nama": "Dian Sastro",
        "nik": "320101150482017",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Perempuan",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Pegawai Bank",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111017"
      }
    ]
  },
  {
    "id": "w-18",
    "rt_id": "rt-03-02",
    "rw_id": "rw-03",
    "kodeUnik": "WR118",
    "nama": "Farhan Ramli",
    "nik": "320101150482018",
    "noKk": "320101150482018",
    "blok": "F",
    "noRumah": "03",
    "noHp": "08121111018",
    "email": "farhan.ramli@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Insinyur Sipil",
    "lat": -6.59495,
    "lng": 106.76604999999999,
    "kontakDaruratNama": "Farhan Ramli (Keluarga)",
    "kontakDaruratHp": "08121111018",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-18-1",
        "nama": "Farhan Ramli",
        "nik": "320101150482018",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Insinyur Sipil",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111018"
      }
    ]
  },
  {
    "id": "w-19",
    "rt_id": "rt-04-01",
    "rw_id": "rw-04",
    "kodeUnik": "WR119",
    "nama": "Gilang Ramadhan",
    "nik": "320101150482019",
    "noKk": "320101150482019",
    "blok": "G",
    "noRumah": "01",
    "noHp": "08121111019",
    "email": "gilang.ramadhan@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "PNS",
    "lat": -6.5948,
    "lng": 106.7662,
    "kontakDaruratNama": "Gilang Ramadhan (Keluarga)",
    "kontakDaruratHp": "08121111019",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-19-1",
        "nama": "Gilang Ramadhan",
        "nik": "320101150482019",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "PNS",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111019"
      }
    ]
  },
  {
    "id": "w-20",
    "rt_id": "rt-04-01",
    "rw_id": "rw-04",
    "kodeUnik": "WR120",
    "nama": "Hani Handayani",
    "nik": "320101150482020",
    "noKk": "320101150482020",
    "blok": "G",
    "noRumah": "02",
    "noHp": "08121111020",
    "email": "hani.handayani@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Perempuan",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Bidan",
    "lat": -6.594650000000001,
    "lng": 106.76634999999999,
    "kontakDaruratNama": "Hani Handayani (Keluarga)",
    "kontakDaruratHp": "08121111020",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-20-1",
        "nama": "Hani Handayani",
        "nik": "320101150482020",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Perempuan",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Bidan",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111020"
      }
    ]
  },
  {
    "id": "w-21",
    "rt_id": "rt-04-01",
    "rw_id": "rw-04",
    "kodeUnik": "WR121",
    "nama": "Indra Wijaya",
    "nik": "320101150482021",
    "noKk": "320101150482021",
    "blok": "G",
    "noRumah": "03",
    "noHp": "08121111021",
    "email": "indra.wijaya@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Supervisor",
    "lat": -6.5945,
    "lng": 106.7665,
    "kontakDaruratNama": "Indra Wijaya (Keluarga)",
    "kontakDaruratHp": "08121111021",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-21-1",
        "nama": "Indra Wijaya",
        "nik": "320101150482021",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Supervisor",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111021"
      }
    ]
  },
  {
    "id": "w-22",
    "rt_id": "rt-04-02",
    "rw_id": "rw-04",
    "kodeUnik": "WR122",
    "nama": "Junaedi Akbar",
    "nik": "320101150482022",
    "noKk": "320101150482022",
    "blok": "H",
    "noRumah": "01",
    "noHp": "08121111022",
    "email": "junaedi.akbar@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Pebisnis Online",
    "lat": -6.59435,
    "lng": 106.76665,
    "kontakDaruratNama": "Junaedi Akbar (Keluarga)",
    "kontakDaruratHp": "08121111022",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-22-1",
        "nama": "Junaedi Akbar",
        "nik": "320101150482022",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Pebisnis Online",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111022"
      }
    ]
  },
  {
    "id": "w-23",
    "rt_id": "rt-04-02",
    "rw_id": "rw-04",
    "kodeUnik": "WR123",
    "nama": "Kartika Dewi",
    "nik": "320101150482023",
    "noKk": "320101150482023",
    "blok": "H",
    "noRumah": "02",
    "noHp": "08121111023",
    "email": "kartika.dewi@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Perempuan",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Notaris",
    "lat": -6.5942,
    "lng": 106.76679999999999,
    "kontakDaruratNama": "Kartika Dewi (Keluarga)",
    "kontakDaruratHp": "08121111023",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-23-1",
        "nama": "Kartika Dewi",
        "nik": "320101150482023",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Perempuan",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Notaris",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111023"
      }
    ]
  },
  {
    "id": "w-24",
    "rt_id": "rt-04-02",
    "rw_id": "rw-04",
    "kodeUnik": "WR124",
    "nama": "Lukman Hakim",
    "nik": "320101150482024",
    "noKk": "320101150482024",
    "blok": "H",
    "noRumah": "03",
    "noHp": "08121111024",
    "email": "lukman.hakim@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Dosen",
    "lat": -6.59405,
    "lng": 106.76695,
    "kontakDaruratNama": "Lukman Hakim (Keluarga)",
    "kontakDaruratHp": "08121111024",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-24-1",
        "nama": "Lukman Hakim",
        "nik": "320101150482024",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Dosen",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111024"
      }
    ]
  },
  {
    "id": "w-25",
    "rt_id": "rt-05-01",
    "rw_id": "rw-05",
    "kodeUnik": "WR125",
    "nama": "Maya Anggraini",
    "nik": "320101150482025",
    "noKk": "320101150482025",
    "blok": "I",
    "noRumah": "01",
    "noHp": "08121111025",
    "email": "maya.anggraini@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Perempuan",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Psikolog",
    "lat": -6.5939000000000005,
    "lng": 106.7671,
    "kontakDaruratNama": "Maya Anggraini (Keluarga)",
    "kontakDaruratHp": "08121111025",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-25-1",
        "nama": "Maya Anggraini",
        "nik": "320101150482025",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Perempuan",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Psikolog",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111025"
      }
    ]
  },
  {
    "id": "w-26",
    "rt_id": "rt-05-01",
    "rw_id": "rw-05",
    "kodeUnik": "WR126",
    "nama": "Nanda Pratama",
    "nik": "320101150482026",
    "noKk": "320101150482026",
    "blok": "I",
    "noRumah": "02",
    "noHp": "08121111026",
    "email": "nanda.pratama@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Software Engineer",
    "lat": -6.59375,
    "lng": 106.76724999999999,
    "kontakDaruratNama": "Nanda Pratama (Keluarga)",
    "kontakDaruratHp": "08121111026",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-26-1",
        "nama": "Nanda Pratama",
        "nik": "320101150482026",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Software Engineer",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111026"
      }
    ]
  },
  {
    "id": "w-27",
    "rt_id": "rt-05-01",
    "rw_id": "rw-05",
    "kodeUnik": "WR127",
    "nama": "Osman Syarif",
    "nik": "320101150482027",
    "noKk": "320101150482027",
    "blok": "I",
    "noRumah": "03",
    "noHp": "08121111027",
    "email": "osman.syarif@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Wiraswasta",
    "lat": -6.5936,
    "lng": 106.7674,
    "kontakDaruratNama": "Osman Syarif (Keluarga)",
    "kontakDaruratHp": "08121111027",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-27-1",
        "nama": "Osman Syarif",
        "nik": "320101150482027",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Wiraswasta",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111027"
      }
    ]
  },
  {
    "id": "w-28",
    "rt_id": "rt-05-02",
    "rw_id": "rw-05",
    "kodeUnik": "WR128",
    "nama": "Putri Melati",
    "nik": "320101150482028",
    "noKk": "320101150482028",
    "blok": "J",
    "noRumah": "01",
    "noHp": "08121111028",
    "email": "putri.melati@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Perempuan",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Manajer HRD",
    "lat": -6.59345,
    "lng": 106.76755,
    "kontakDaruratNama": "Putri Melati (Keluarga)",
    "kontakDaruratHp": "08121111028",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-28-1",
        "nama": "Putri Melati",
        "nik": "320101150482028",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Perempuan",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Manajer HRD",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111028"
      }
    ]
  },
  {
    "id": "w-29",
    "rt_id": "rt-05-02",
    "rw_id": "rw-05",
    "kodeUnik": "WR129",
    "nama": "Qori Iskandar",
    "nik": "320101150482029",
    "noKk": "320101150482029",
    "blok": "J",
    "noRumah": "02",
    "noHp": "08121111029",
    "email": "qori.iskandar@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Jurnalis",
    "lat": -6.5933,
    "lng": 106.76769999999999,
    "kontakDaruratNama": "Qori Iskandar (Keluarga)",
    "kontakDaruratHp": "08121111029",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-29-1",
        "nama": "Qori Iskandar",
        "nik": "320101150482029",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Jurnalis",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111029"
      }
    ]
  },
  {
    "id": "w-30",
    "rt_id": "rt-05-02",
    "rw_id": "rw-05",
    "kodeUnik": "WR130",
    "nama": "Rizky Ramadhan",
    "nik": "320101150482030",
    "noKk": "320101150482030",
    "blok": "J",
    "noRumah": "03",
    "noHp": "08121111030",
    "email": "rizky.ramadhan@gmail.com",
    "statusHuni": "Tetap",
    "statusKepemilikan": "Milik Sendiri",
    "jenisKelamin": "Laki-laki",
    "agama": "Islam",
    "statusPernikahan": "Kawin",
    "jumlahJiwa": 4,
    "pekerjaan": "Data Analyst",
    "lat": -6.5931500000000005,
    "lng": 106.76785,
    "kontakDaruratNama": "Rizky Ramadhan (Keluarga)",
    "kontakDaruratHp": "08121111030",
    "kontakDaruratHubungan": "Keluarga",
    "tglMasuk": "2020-01-15",
    "statusApproval": "Disetujui",
    "aktif": true,
    "anggotaKeluarga": [
      {
        "id": "ak-w-30-1",
        "nama": "Rizky Ramadhan",
        "nik": "320101150482030",
        "hubungan": "Kepala Keluarga",
        "jenisKelamin": "Laki-laki",
        "tempatLahir": "Bogor",
        "tanggalLahir": "1985-05-15",
        "agama": "Islam",
        "pendidikan": "S1",
        "pekerjaan": "Data Analyst",
        "statusPernikahan": "Kawin",
        "golonganDarah": "O",
        "noHp": "08121111030"
      }
    ]
  }
]

export const INITIAL_TAGIHAN = [
  {
    "id": "tag-rt-2026-09-w-1",
    "wargaId": "w-1",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-01-01",
    "pembayaran_kepada": "RT 01 / RW 01",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": "2026-09-05",
    "metodeBayar": "Transfer Bank",
    "noKwitansi": "KW-RT-01-202609-100",
    "catatan": "Pembayaran IPL RT Lunas"
  },
  {
    "id": "tag-rw-2026-09-w-1",
    "wargaId": "w-1",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-01",
    "pembayaran_kepada": "RW 01",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": "2026-09-08",
    "metodeBayar": "QRIS",
    "noKwitansi": "KW-RW-01-202609-200",
    "catatan": "Iuran Fasum RW Lunas"
  },
  {
    "id": "tag-rt-2026-09-w-2",
    "wargaId": "w-2",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-01-01",
    "pembayaran_kepada": "RT 01 / RW 01",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-2",
    "wargaId": "w-2",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-01",
    "pembayaran_kepada": "RW 01",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rt-2026-09-w-3",
    "wargaId": "w-3",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-01-01",
    "pembayaran_kepada": "RT 01 / RW 01",
    "status": "Menunggu Verifikasi",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-3",
    "wargaId": "w-3",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-01",
    "pembayaran_kepada": "RW 01",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": "2026-09-08",
    "metodeBayar": "QRIS",
    "noKwitansi": "KW-RW-01-202609-202",
    "catatan": "Iuran Fasum RW Lunas"
  },
  {
    "id": "tag-rt-2026-09-w-4",
    "wargaId": "w-4",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-01-02",
    "pembayaran_kepada": "RT 02 / RW 01",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": "2026-09-05",
    "metodeBayar": "Transfer Bank",
    "noKwitansi": "KW-RT-02-202609-103",
    "catatan": "Pembayaran IPL RT Lunas"
  },
  {
    "id": "tag-rw-2026-09-w-4",
    "wargaId": "w-4",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-01",
    "pembayaran_kepada": "RW 01",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rt-2026-09-w-5",
    "wargaId": "w-5",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-01-02",
    "pembayaran_kepada": "RT 02 / RW 01",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-5",
    "wargaId": "w-5",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-01",
    "pembayaran_kepada": "RW 01",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": "2026-09-08",
    "metodeBayar": "QRIS",
    "noKwitansi": "KW-RW-01-202609-204",
    "catatan": "Iuran Fasum RW Lunas"
  },
  {
    "id": "tag-rt-2026-09-w-6",
    "wargaId": "w-6",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-01-02",
    "pembayaran_kepada": "RT 02 / RW 01",
    "status": "Menunggu Verifikasi",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-6",
    "wargaId": "w-6",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-01",
    "pembayaran_kepada": "RW 01",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rt-2026-09-w-7",
    "wargaId": "w-7",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-02-01",
    "pembayaran_kepada": "RT 01 / RW 02",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": "2026-09-05",
    "metodeBayar": "Transfer Bank",
    "noKwitansi": "KW-RT-01-202609-106",
    "catatan": "Pembayaran IPL RT Lunas"
  },
  {
    "id": "tag-rw-2026-09-w-7",
    "wargaId": "w-7",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-02",
    "pembayaran_kepada": "RW 02",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": "2026-09-08",
    "metodeBayar": "QRIS",
    "noKwitansi": "KW-RW-02-202609-206",
    "catatan": "Iuran Fasum RW Lunas"
  },
  {
    "id": "tag-rt-2026-09-w-8",
    "wargaId": "w-8",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-02-01",
    "pembayaran_kepada": "RT 01 / RW 02",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-8",
    "wargaId": "w-8",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-02",
    "pembayaran_kepada": "RW 02",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rt-2026-09-w-9",
    "wargaId": "w-9",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-02-01",
    "pembayaran_kepada": "RT 01 / RW 02",
    "status": "Menunggu Verifikasi",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-9",
    "wargaId": "w-9",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-02",
    "pembayaran_kepada": "RW 02",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": "2026-09-08",
    "metodeBayar": "QRIS",
    "noKwitansi": "KW-RW-02-202609-208",
    "catatan": "Iuran Fasum RW Lunas"
  },
  {
    "id": "tag-rt-2026-09-w-10",
    "wargaId": "w-10",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-02-02",
    "pembayaran_kepada": "RT 02 / RW 02",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": "2026-09-05",
    "metodeBayar": "Transfer Bank",
    "noKwitansi": "KW-RT-02-202609-109",
    "catatan": "Pembayaran IPL RT Lunas"
  },
  {
    "id": "tag-rw-2026-09-w-10",
    "wargaId": "w-10",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-02",
    "pembayaran_kepada": "RW 02",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rt-2026-09-w-11",
    "wargaId": "w-11",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-02-02",
    "pembayaran_kepada": "RT 02 / RW 02",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-11",
    "wargaId": "w-11",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-02",
    "pembayaran_kepada": "RW 02",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": "2026-09-08",
    "metodeBayar": "QRIS",
    "noKwitansi": "KW-RW-02-202609-210",
    "catatan": "Iuran Fasum RW Lunas"
  },
  {
    "id": "tag-rt-2026-09-w-12",
    "wargaId": "w-12",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-02-02",
    "pembayaran_kepada": "RT 02 / RW 02",
    "status": "Menunggu Verifikasi",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-12",
    "wargaId": "w-12",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-02",
    "pembayaran_kepada": "RW 02",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rt-2026-09-w-13",
    "wargaId": "w-13",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-03-01",
    "pembayaran_kepada": "RT 01 / RW 03",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": "2026-09-05",
    "metodeBayar": "Transfer Bank",
    "noKwitansi": "KW-RT-01-202609-112",
    "catatan": "Pembayaran IPL RT Lunas"
  },
  {
    "id": "tag-rw-2026-09-w-13",
    "wargaId": "w-13",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-03",
    "pembayaran_kepada": "RW 03",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": "2026-09-08",
    "metodeBayar": "QRIS",
    "noKwitansi": "KW-RW-03-202609-212",
    "catatan": "Iuran Fasum RW Lunas"
  },
  {
    "id": "tag-rt-2026-09-w-14",
    "wargaId": "w-14",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-03-01",
    "pembayaran_kepada": "RT 01 / RW 03",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-14",
    "wargaId": "w-14",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-03",
    "pembayaran_kepada": "RW 03",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rt-2026-09-w-15",
    "wargaId": "w-15",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-03-01",
    "pembayaran_kepada": "RT 01 / RW 03",
    "status": "Menunggu Verifikasi",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-15",
    "wargaId": "w-15",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-03",
    "pembayaran_kepada": "RW 03",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": "2026-09-08",
    "metodeBayar": "QRIS",
    "noKwitansi": "KW-RW-03-202609-214",
    "catatan": "Iuran Fasum RW Lunas"
  },
  {
    "id": "tag-rt-2026-09-w-16",
    "wargaId": "w-16",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-03-02",
    "pembayaran_kepada": "RT 02 / RW 03",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": "2026-09-05",
    "metodeBayar": "Transfer Bank",
    "noKwitansi": "KW-RT-02-202609-115",
    "catatan": "Pembayaran IPL RT Lunas"
  },
  {
    "id": "tag-rw-2026-09-w-16",
    "wargaId": "w-16",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-03",
    "pembayaran_kepada": "RW 03",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rt-2026-09-w-17",
    "wargaId": "w-17",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-03-02",
    "pembayaran_kepada": "RT 02 / RW 03",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-17",
    "wargaId": "w-17",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-03",
    "pembayaran_kepada": "RW 03",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": "2026-09-08",
    "metodeBayar": "QRIS",
    "noKwitansi": "KW-RW-03-202609-216",
    "catatan": "Iuran Fasum RW Lunas"
  },
  {
    "id": "tag-rt-2026-09-w-18",
    "wargaId": "w-18",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-03-02",
    "pembayaran_kepada": "RT 02 / RW 03",
    "status": "Menunggu Verifikasi",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-18",
    "wargaId": "w-18",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-03",
    "pembayaran_kepada": "RW 03",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rt-2026-09-w-19",
    "wargaId": "w-19",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-04-01",
    "pembayaran_kepada": "RT 01 / RW 04",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": "2026-09-05",
    "metodeBayar": "Transfer Bank",
    "noKwitansi": "KW-RT-01-202609-118",
    "catatan": "Pembayaran IPL RT Lunas"
  },
  {
    "id": "tag-rw-2026-09-w-19",
    "wargaId": "w-19",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-04",
    "pembayaran_kepada": "RW 04",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": "2026-09-08",
    "metodeBayar": "QRIS",
    "noKwitansi": "KW-RW-04-202609-218",
    "catatan": "Iuran Fasum RW Lunas"
  },
  {
    "id": "tag-rt-2026-09-w-20",
    "wargaId": "w-20",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-04-01",
    "pembayaran_kepada": "RT 01 / RW 04",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-20",
    "wargaId": "w-20",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-04",
    "pembayaran_kepada": "RW 04",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rt-2026-09-w-21",
    "wargaId": "w-21",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-04-01",
    "pembayaran_kepada": "RT 01 / RW 04",
    "status": "Menunggu Verifikasi",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-21",
    "wargaId": "w-21",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-04",
    "pembayaran_kepada": "RW 04",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": "2026-09-08",
    "metodeBayar": "QRIS",
    "noKwitansi": "KW-RW-04-202609-220",
    "catatan": "Iuran Fasum RW Lunas"
  },
  {
    "id": "tag-rt-2026-09-w-22",
    "wargaId": "w-22",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-04-02",
    "pembayaran_kepada": "RT 02 / RW 04",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": "2026-09-05",
    "metodeBayar": "Transfer Bank",
    "noKwitansi": "KW-RT-02-202609-121",
    "catatan": "Pembayaran IPL RT Lunas"
  },
  {
    "id": "tag-rw-2026-09-w-22",
    "wargaId": "w-22",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-04",
    "pembayaran_kepada": "RW 04",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rt-2026-09-w-23",
    "wargaId": "w-23",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-04-02",
    "pembayaran_kepada": "RT 02 / RW 04",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-23",
    "wargaId": "w-23",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-04",
    "pembayaran_kepada": "RW 04",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": "2026-09-08",
    "metodeBayar": "QRIS",
    "noKwitansi": "KW-RW-04-202609-222",
    "catatan": "Iuran Fasum RW Lunas"
  },
  {
    "id": "tag-rt-2026-09-w-24",
    "wargaId": "w-24",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-04-02",
    "pembayaran_kepada": "RT 02 / RW 04",
    "status": "Menunggu Verifikasi",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-24",
    "wargaId": "w-24",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-04",
    "pembayaran_kepada": "RW 04",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rt-2026-09-w-25",
    "wargaId": "w-25",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-05-01",
    "pembayaran_kepada": "RT 01 / RW 05",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": "2026-09-05",
    "metodeBayar": "Transfer Bank",
    "noKwitansi": "KW-RT-01-202609-124",
    "catatan": "Pembayaran IPL RT Lunas"
  },
  {
    "id": "tag-rw-2026-09-w-25",
    "wargaId": "w-25",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-05",
    "pembayaran_kepada": "RW 05",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": "2026-09-08",
    "metodeBayar": "QRIS",
    "noKwitansi": "KW-RW-05-202609-224",
    "catatan": "Iuran Fasum RW Lunas"
  },
  {
    "id": "tag-rt-2026-09-w-26",
    "wargaId": "w-26",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-05-01",
    "pembayaran_kepada": "RT 01 / RW 05",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-26",
    "wargaId": "w-26",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-05",
    "pembayaran_kepada": "RW 05",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rt-2026-09-w-27",
    "wargaId": "w-27",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-05-01",
    "pembayaran_kepada": "RT 01 / RW 05",
    "status": "Menunggu Verifikasi",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-27",
    "wargaId": "w-27",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-05",
    "pembayaran_kepada": "RW 05",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": "2026-09-08",
    "metodeBayar": "QRIS",
    "noKwitansi": "KW-RW-05-202609-226",
    "catatan": "Iuran Fasum RW Lunas"
  },
  {
    "id": "tag-rt-2026-09-w-28",
    "wargaId": "w-28",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-05-02",
    "pembayaran_kepada": "RT 02 / RW 05",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": "2026-09-05",
    "metodeBayar": "Transfer Bank",
    "noKwitansi": "KW-RT-02-202609-127",
    "catatan": "Pembayaran IPL RT Lunas"
  },
  {
    "id": "tag-rw-2026-09-w-28",
    "wargaId": "w-28",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-05",
    "pembayaran_kepada": "RW 05",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rt-2026-09-w-29",
    "wargaId": "w-29",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-05-02",
    "pembayaran_kepada": "RT 02 / RW 05",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-29",
    "wargaId": "w-29",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-05",
    "pembayaran_kepada": "RW 05",
    "status": "Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": "2026-09-08",
    "metodeBayar": "QRIS",
    "noKwitansi": "KW-RW-05-202609-228",
    "catatan": "Iuran Fasum RW Lunas"
  },
  {
    "id": "tag-rt-2026-09-w-30",
    "wargaId": "w-30",
    "bulan": 9,
    "tahun": 2026,
    "total": 120000,
    "namaPos": "Iuran Pengelolaan Lingkungan (IPL)",
    "payment_scope": "RT",
    "target_payment_owner": "rt-05-02",
    "pembayaran_kepada": "RT 02 / RW 05",
    "status": "Menunggu Verifikasi",
    "rincian": [
      {
        "nama": "Iuran Kebersihan & Sampah RT",
        "nominal": 35000
      },
      {
        "nama": "Iuran Keamanan & Portal RT",
        "nominal": 50000
      },
      {
        "nama": "Kas Pemeliharaan & Fasum RT",
        "nominal": 25000
      },
      {
        "nama": "Dana Sosial & Kematian RT",
        "nominal": 10000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  },
  {
    "id": "tag-rw-2026-09-w-30",
    "wargaId": "w-30",
    "bulan": 9,
    "tahun": 2026,
    "total": 40000,
    "namaPos": "Iuran Pembangunan & Fasum RW",
    "payment_scope": "RW",
    "target_payment_owner": "rw-05",
    "pembayaran_kepada": "RW 05",
    "status": "Belum Lunas",
    "rincian": [
      {
        "nama": "Iuran Pembangunan & Fasum RW",
        "nominal": 25000
      },
      {
        "nama": "Iuran Kegiatan Bersama RW",
        "nominal": 15000
      }
    ],
    "tanggalBayar": null,
    "metodeBayar": null,
    "noKwitansi": null,
    "catatan": ""
  }
]

export const INITIAL_KAS = [
  {
    "id": "kas-rw-01-1",
    "tanggal": "2026-09-01",
    "tipe": "Masuk",
    "kategori": "Saldo Awal",
    "deskripsi": "Saldo kas awal RW 01 periode September 2026",
    "nominal": 5000000,
    "scope": "rw",
    "rt_id": null,
    "rw_id": "rw-01"
  },
  {
    "id": "kas-rw-02-1",
    "tanggal": "2026-09-01",
    "tipe": "Masuk",
    "kategori": "Saldo Awal",
    "deskripsi": "Saldo kas awal RW 02 periode September 2026",
    "nominal": 5000000,
    "scope": "rw",
    "rt_id": null,
    "rw_id": "rw-02"
  },
  {
    "id": "kas-rw-03-1",
    "tanggal": "2026-09-01",
    "tipe": "Masuk",
    "kategori": "Saldo Awal",
    "deskripsi": "Saldo kas awal RW 03 periode September 2026",
    "nominal": 5000000,
    "scope": "rw",
    "rt_id": null,
    "rw_id": "rw-03"
  },
  {
    "id": "kas-rw-04-1",
    "tanggal": "2026-09-01",
    "tipe": "Masuk",
    "kategori": "Saldo Awal",
    "deskripsi": "Saldo kas awal RW 04 periode September 2026",
    "nominal": 5000000,
    "scope": "rw",
    "rt_id": null,
    "rw_id": "rw-04"
  },
  {
    "id": "kas-rw-05-1",
    "tanggal": "2026-09-01",
    "tipe": "Masuk",
    "kategori": "Saldo Awal",
    "deskripsi": "Saldo kas awal RW 05 periode September 2026",
    "nominal": 5000000,
    "scope": "rw",
    "rt_id": null,
    "rw_id": "rw-05"
  },
  {
    "id": "kas-rt-01-01-1",
    "tanggal": "2026-09-01",
    "tipe": "Masuk",
    "kategori": "Saldo Awal",
    "deskripsi": "Saldo kas awal RT 01 / RW 01 periode September 2026",
    "nominal": 2000000,
    "scope": "rt",
    "rt_id": "rt-01-01",
    "rw_id": "rw-01"
  },
  {
    "id": "kas-rt-01-02-1",
    "tanggal": "2026-09-01",
    "tipe": "Masuk",
    "kategori": "Saldo Awal",
    "deskripsi": "Saldo kas awal RT 02 / RW 01 periode September 2026",
    "nominal": 2000000,
    "scope": "rt",
    "rt_id": "rt-01-02",
    "rw_id": "rw-01"
  },
  {
    "id": "kas-rt-02-01-1",
    "tanggal": "2026-09-01",
    "tipe": "Masuk",
    "kategori": "Saldo Awal",
    "deskripsi": "Saldo kas awal RT 01 / RW 02 periode September 2026",
    "nominal": 2000000,
    "scope": "rt",
    "rt_id": "rt-02-01",
    "rw_id": "rw-02"
  },
  {
    "id": "kas-rt-02-02-1",
    "tanggal": "2026-09-01",
    "tipe": "Masuk",
    "kategori": "Saldo Awal",
    "deskripsi": "Saldo kas awal RT 02 / RW 02 periode September 2026",
    "nominal": 2000000,
    "scope": "rt",
    "rt_id": "rt-02-02",
    "rw_id": "rw-02"
  },
  {
    "id": "kas-rt-03-01-1",
    "tanggal": "2026-09-01",
    "tipe": "Masuk",
    "kategori": "Saldo Awal",
    "deskripsi": "Saldo kas awal RT 01 / RW 03 periode September 2026",
    "nominal": 2000000,
    "scope": "rt",
    "rt_id": "rt-03-01",
    "rw_id": "rw-03"
  },
  {
    "id": "kas-rt-03-02-1",
    "tanggal": "2026-09-01",
    "tipe": "Masuk",
    "kategori": "Saldo Awal",
    "deskripsi": "Saldo kas awal RT 02 / RW 03 periode September 2026",
    "nominal": 2000000,
    "scope": "rt",
    "rt_id": "rt-03-02",
    "rw_id": "rw-03"
  },
  {
    "id": "kas-rt-04-01-1",
    "tanggal": "2026-09-01",
    "tipe": "Masuk",
    "kategori": "Saldo Awal",
    "deskripsi": "Saldo kas awal RT 01 / RW 04 periode September 2026",
    "nominal": 2000000,
    "scope": "rt",
    "rt_id": "rt-04-01",
    "rw_id": "rw-04"
  },
  {
    "id": "kas-rt-04-02-1",
    "tanggal": "2026-09-01",
    "tipe": "Masuk",
    "kategori": "Saldo Awal",
    "deskripsi": "Saldo kas awal RT 02 / RW 04 periode September 2026",
    "nominal": 2000000,
    "scope": "rt",
    "rt_id": "rt-04-02",
    "rw_id": "rw-04"
  },
  {
    "id": "kas-rt-05-01-1",
    "tanggal": "2026-09-01",
    "tipe": "Masuk",
    "kategori": "Saldo Awal",
    "deskripsi": "Saldo kas awal RT 01 / RW 05 periode September 2026",
    "nominal": 2000000,
    "scope": "rt",
    "rt_id": "rt-05-01",
    "rw_id": "rw-05"
  },
  {
    "id": "kas-rt-05-02-1",
    "tanggal": "2026-09-01",
    "tipe": "Masuk",
    "kategori": "Saldo Awal",
    "deskripsi": "Saldo kas awal RT 02 / RW 05 periode September 2026",
    "nominal": 2000000,
    "scope": "rt",
    "rt_id": "rt-05-02",
    "rw_id": "rw-05"
  },
  {
    "id": "kas-out-rw-01-1",
    "tanggal": "2026-09-10",
    "tipe": "Keluar",
    "kategori": "Keamanan Lingkungan",
    "deskripsi": "Honor & konsumsi 4 personil petugas keamanan pos gerbang utama RW 01",
    "keterangan": "Honor & konsumsi 4 personil petugas keamanan pos gerbang utama RW 01",
    "nominal": 2500000,
    "scope": "rw",
    "rt_id": null,
    "rw_id": "rw-01",
    "pj": "Koordinator Keamanan RW 01 (Bpk. Bambang)"
  },
  {
    "id": "kas-out-rw-01-2",
    "tanggal": "2026-09-18",
    "tipe": "Keluar",
    "kategori": "Perbaikan Fasum",
    "deskripsi": "Perbaikan & penggantian pompa air sumur artesis fasum taman RW 01",
    "keterangan": "Perbaikan & penggantian pompa air sumur artesis fasum taman RW 01",
    "nominal": 850000,
    "scope": "rw",
    "rt_id": null,
    "rw_id": "rw-01",
    "pj": "Seksi Pembangunan RW 01 (Bpk. Mulyadi)"
  },
  {
    "id": "kas-out-rw-01-3",
    "tanggal": "2026-09-25",
    "tipe": "Keluar",
    "kategori": "Kebersihan",
    "deskripsi": "Retribusi armada pengangkutan sampah ke TPA & pembersihan drainase RW",
    "keterangan": "Retribusi armada pengangkutan sampah ke TPA & pembersihan drainase RW",
    "nominal": 1200000,
    "scope": "rw",
    "rt_id": null,
    "rw_id": "rw-01",
    "pj": "Bendahara RW 01 (Ibu Ratna)"
  },
  {
    "id": "kas-out-rt-01-01-1",
    "tanggal": "2026-09-12",
    "tipe": "Keluar",
    "kategori": "Penerangan Jalan",
    "deskripsi": "Penggantian 5 unit bohlam LED 50W & fitting lampu jalan PJU Blok A RT 01",
    "keterangan": "Penggantian 5 unit bohlam LED 50W & fitting lampu jalan PJU Blok A RT 01",
    "nominal": 375000,
    "scope": "rt",
    "rt_id": "rt-01-01",
    "rw_id": "rw-01",
    "pj": "Seksi Sarana RT 01 (Bpk. Syahdan)"
  },
  {
    "id": "kas-out-rt-01-01-2",
    "tanggal": "2026-09-22",
    "tipe": "Keluar",
    "kategori": "Kebersihan Lingkungan",
    "deskripsi": "Operasional kerja bakti lingkungan & pengadaan kantong sampah RT 01",
    "keterangan": "Operasional kerja bakti lingkungan & pengadaan kantong sampah RT 01",
    "nominal": 250000,
    "scope": "rt",
    "rt_id": "rt-01-01",
    "rw_id": "rw-01",
    "pj": "Bendahara RT 01"
  },
  {
    "id": "kas-out-rt-01-01-3",
    "tanggal": "2026-10-02",
    "tipe": "Keluar",
    "kategori": "Sosial & Warga",
    "deskripsi": "Bantuan santunan duka cita warga Blok A-08 RT 01",
    "keterangan": "Bantuan santunan duka cita warga Blok A-08 RT 01",
    "nominal": 300000,
    "scope": "rt",
    "rt_id": "rt-01-01",
    "rw_id": "rw-01",
    "pj": "Ketua RT 01 / RW 01"
  }
]

export const INITIAL_EVENTS = [
  {
    id: 'evt-17an-2026',
    judul: 'Semarak Peringatan HUT RI ke-81 Tingkat Lingkungan RW',
    kategori: 'Agustusan',
    scope: 'rw',
    rt_id: null,
    targetType: 'all',
    targetWargaId: null,
    tipePengumuman: 'iuran',
    nominalPerKK: 50000,
    batasTanggal: '2026-08-14',
    deskripsi: 'Panggung gembira malam tirakatan, pameran UMKM, jalan santai akbar seluruh warga & pembagian doorprize.',
    posterUrl: null,
    tanggalDibuat: '2026-08-01',
    aktif: true
  },
  {
    id: 'evt-lomba-rt1',
    judul: 'Lomba Anak & Senam Sehat Khusus Warga RT 01 / RW 01',
    kategori: 'Lomba',
    scope: 'rt',
    rt_id: 'rt-01-01',
    targetType: 'all',
    targetWargaId: null,
    tipePengumuman: 'iuran',
    nominalPerKK: 35000,
    batasTanggal: '2026-08-17',
    deskripsi: 'Lomba mewarnai anak, makan kerupuk, balap kelereng, dan senam sehat Minggu pagi khusus keluarga RT 01.',
    posterUrl: null,
    tanggalDibuat: '2026-08-03',
    aktif: true
  }
]

export const INITIAL_TAGIHAN_EVENTS = [
  {
    id: 'tevt-17an-w-1',
    eventId: 'evt-17an-2026',
    wargaId: 'w-1',
    nominal: 50000,
    status: 'Lunas',
    tanggalBayar: '2026-08-05',
    metodeBayar: 'Transfer BCA',
    noKwitansi: 'KW-EVT-17AN-001',
    catatan: ''
  }
]

export const INITIAL_PENGADUAN = [
  {
    id: 'lapor-001',
    wargaId: 'w-1',
    rt_id: 'rt-01-01',
    judul: 'Lampu Penerangan Jalan Mati di Depan Blok A-02',
    kategori: 'Fasilitas & Lampu Jalan',
    lokasi: 'Jalan Utama Blok A (depan unit A-02)',
    deskripsi: 'Lampu PJU sudah 3 malam padam sehingga jalanan sangat gelap saat malam hari. Mohon dibantu pengecekan fitting atau bohlamnya.',
    status: 'Sedang Ditangani',
    tanggal: '2026-09-18',
    fotoUrl: '',
    tanggapan: 'Teknisi fasilitas RT sudah dihubungi, penggantian bohlam LED 50W dijadwalkan besok siang (Bpk. Syahdan).',
    tanggalTanggapan: '2026-09-19'
  }
]

export const INITIAL_SURAT_PENGANTAR = [
  {
    id: 'srt-2026-001',
    noSurat: '470/012/RT.01-RW.01/IX/2026',
    wargaId: 'w-1',
    rt_id: 'rt-01-01',
    jenisSurat: 'Surat Pengantar KTP / KK',
    keperluan: 'Pembuatan Kartu Identitas Anak (KIA) untuk anak kedua',
    status: 'Disetujui',
    tanggalPengajuan: '2026-09-15',
    tanggalDisetujui: '2026-09-16',
    catatanPengurus: 'Surat sudah disetujui & ditandatangani Ketua RT.',
    nikPemohon: '3201011504820001',
    pekerjaan: 'PNS',
    alamatLengkap: 'Perumahan Alam Tirta Lestari, Blok A No. 01, RT 01 / RW 01, Pagelaran, Ciomas'
  }
]

export const INITIAL_KONTAK_DARURAT = [
  {
    id: 'emg-110',
    nama: 'Kepolisian RI (Polisi)',
    kategori: 'Kepolisian',
    nomor: '110',
    wa: '',
    deskripsi: 'Layanan darurat kepolisian 24 jam bebas pulsa',
    icon: 'BadgeAlert',
    urgent: true,
    color: 'bg-sky-50 text-sky-800 border-sky-200',
    rt_id: null
  },
  {
    id: 'emg-119',
    nama: 'Layanan Ambulans & Medis (Kemenkes)',
    kategori: 'Medis & Kesehatan',
    nomor: '119',
    wa: '081388001199',
    deskripsi: 'Layanan tanggap darurat medis nasional 24 jam & ambulans siaga',
    icon: 'HeartPulse',
    urgent: true,
    color: 'bg-rose-50 text-rose-800 border-rose-200',
    rt_id: null
  },
  {
    id: 'emg-1',
    nama: 'Pos Satpam Gerbang Utama 24 Jam',
    kategori: 'Keamanan Lingkungan',
    nomor: '081299887766',
    wa: '081299887766',
    deskripsi: 'Pos utama gerbang perumahan & patroli malam',
    icon: 'Shield',
    urgent: true,
    color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    rt_id: null
  }
]

export const INITIAL_PETUGAS_SATPAM = [
  {
    id: 'sec-1',
    nama: 'Bpk. Joko Susilo',
    jabatan: 'Komandan Regu (Danru)',
    telepon: '081299887711',
    wa: '081299887711',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    status: 'Aktif',
    posUtama: 'Pos Utama Gerbang Depan'
  },
  {
    id: 'sec-2',
    nama: 'Bpk. Slamet Riyadi',
    jabatan: 'Anggota Patroli & Portal',
    telepon: '081299887722',
    wa: '081299887722',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    status: 'Aktif',
    posUtama: 'Pos 2 Portal Belakang'
  },
  {
    id: 'sec-3',
    nama: 'Bpk. Asep Saepudin',
    jabatan: 'Anggota Pengamanan & Tamu',
    telepon: '081299887733',
    wa: '081299887733',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    status: 'Aktif',
    posUtama: 'Pos Utama Gerbang Depan'
  },
  {
    id: 'sec-4',
    nama: 'Bpk. Rudi Hermawan',
    jabatan: 'Anggota Patroli Keliling',
    telepon: '081299887744',
    wa: '081299887744',
    foto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    status: 'Aktif',
    posUtama: 'Ronda Lingkungan'
  },
  {
    id: 'sec-5',
    nama: 'Bpk. Herman Santoso',
    jabatan: 'Anggota Pengamanan Malam',
    telepon: '081299887755',
    wa: '081299887755',
    foto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    status: 'Aktif',
    posUtama: 'Pos Utama Gerbang Depan'
  },
  {
    id: 'sec-6',
    nama: 'Bpk. Supriyadi',
    jabatan: 'Anggota Ronda Malam',
    telepon: '081299887766',
    wa: '081299887766',
    foto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    status: 'Aktif',
    posUtama: 'Pos Ronda & Patroli'
  }
]

export const INITIAL_JADWAL_SATPAM = [
  // Senin
  { id: 'jdw-sen-1', hari: 'Senin', shift: 'Pagi', jam: '07:00 - 15:00', petugasIds: ['sec-1', 'sec-2'], lokasi: 'Pos Utama & Portal Timur', catatan: 'Pembukaan portal pukul 05:00, pantau jam berangkat kerja/sekolah' },
  { id: 'jdw-sen-2', hari: 'Senin', shift: 'Siang', jam: '15:00 - 23:00', petugasIds: ['sec-3', 'sec-4'], lokasi: 'Pos Utama & Patroli', catatan: 'Penutupan portal timur pukul 18:00, pencatatan titipan paket kurir' },
  { id: 'jdw-sen-3', hari: 'Senin', shift: 'Malam', jam: '23:00 - 07:00', petugasIds: ['sec-5', 'sec-6'], lokasi: 'Pos Utama & Ronda Malam', catatan: 'Penutupan portal utama pukul 23:00, patroli keliling berkala per 2 jam' },

  // Selasa
  { id: 'jdw-sel-1', hari: 'Selasa', shift: 'Pagi', jam: '07:00 - 15:00', petugasIds: ['sec-2', 'sec-3'], lokasi: 'Pos Utama & Portal Timur', catatan: 'Pembukaan portal pukul 05:00, cek kebersihan area pos' },
  { id: 'jdw-sel-2', hari: 'Selasa', shift: 'Siang', jam: '15:00 - 23:00', petugasIds: ['sec-4', 'sec-5'], lokasi: 'Pos Utama & Patroli', catatan: 'Penutupan portal timur pukul 18:00, pantau kendaraan tamu' },
  { id: 'jdw-sel-3', hari: 'Selasa', shift: 'Malam', jam: '23:00 - 07:00', petugasIds: ['sec-6', 'sec-1'], lokasi: 'Pos Utama & Ronda Malam', catatan: 'Pemeriksaan tamu malam, pencatatan identitas di pos' },

  // Rabu
  { id: 'jdw-rab-1', hari: 'Rabu', shift: 'Pagi', jam: '07:00 - 15:00', petugasIds: ['sec-1', 'sec-4'], lokasi: 'Pos Utama & Portal Timur', catatan: 'Lalu lintas pagi warga, pantau mobil operasional kebersihan' },
  { id: 'jdw-rab-2', hari: 'Rabu', shift: 'Siang', jam: '15:00 - 23:00', petugasIds: ['sec-3', 'sec-6'], lokasi: 'Pos Utama & Patroli', catatan: 'Penutupan portal timur pukul 18:00, serah terima buku ekspedisi kurir' },
  { id: 'jdw-rab-3', hari: 'Rabu', shift: 'Malam', jam: '23:00 - 07:00', petugasIds: ['sec-5', 'sec-2'], lokasi: 'Pos Utama & Ronda Malam', catatan: 'Pemeriksaan portal gerbang utama, keliling blok A s/d F' },

  // Kamis
  { id: 'jdw-kam-1', hari: 'Kamis', shift: 'Pagi', jam: '07:00 - 15:00', petugasIds: ['sec-3', 'sec-2'], lokasi: 'Pos Utama & Portal Timur', catatan: 'Pengecekan CCTV & perlengkapan senter siaga' },
  { id: 'jdw-kam-2', hari: 'Kamis', shift: 'Siang', jam: '15:00 - 23:00', petugasIds: ['sec-1', 'sec-5'], lokasi: 'Pos Utama & Patroli', catatan: 'Penutupan portal timur pukul 18:00, monitoring lalu lintas sore' },
  { id: 'jdw-kam-3', hari: 'Kamis', shift: 'Malam', jam: '23:00 - 07:00', petugasIds: ['sec-4', 'sec-6'], lokasi: 'Pos Utama & Ronda Malam', catatan: 'Patroli blok perumahan pada pukul 00:00, 02:00, dan 04:00 WIB' },

  // Jumat
  { id: 'jdw-jum-1', hari: 'Jumat', shift: 'Pagi', jam: '07:00 - 15:00', petugasIds: ['sec-1', 'sec-3'], lokasi: 'Pos Utama & Portal Timur', catatan: 'Pengamanan sholat Jumat di Masjid komplek & pengaturan parkir jamaah' },
  { id: 'jdw-jum-2', hari: 'Jumat', shift: 'Siang', jam: '15:00 - 23:00', petugasIds: ['sec-2', 'sec-4'], lokasi: 'Pos Utama & Patroli', catatan: 'Penutupan portal timur pukul 18:00, pengawasan keluar masuk tamu luar' },
  { id: 'jdw-jum-3', hari: 'Jumat', shift: 'Malam', jam: '23:00 - 07:00', petugasIds: ['sec-5', 'sec-6'], lokasi: 'Pos Utama & Ronda Malam', catatan: 'Siaga akhir pekan, pengetatan pemeriksaan identitas tamu larut malam' },

  // Sabtu
  { id: 'jdw-sab-1', hari: 'Sabtu', shift: 'Pagi', jam: '07:00 - 15:00', petugasIds: ['sec-4', 'sec-5'], lokasi: 'Pos Utama & Portal Timur', catatan: 'Pantau aktivitas olahraga pagi warga, kurir paket ekspedisi' },
  { id: 'jdw-sab-2', hari: 'Sabtu', shift: 'Siang', jam: '15:00 - 23:00', petugasIds: ['sec-1', 'sec-6'], lokasi: 'Pos Utama & Patroli', catatan: 'Pengaturan tamu weekend dan acara arisan/keluarga warga' },
  { id: 'jdw-sab-3', hari: 'Sabtu', shift: 'Malam', jam: '23:00 - 07:00', petugasIds: ['sec-2', 'sec-3'], lokasi: 'Pos Utama & Ronda Malam', catatan: 'Ronda intensif malam minggu, koordinasi posko pemuda & portal' },

  // Minggu
  { id: 'jdw-min-1', hari: 'Minggu', shift: 'Pagi', jam: '07:00 - 15:00', petugasIds: ['sec-6', 'sec-2'], lokasi: 'Pos Utama & Portal Timur', catatan: 'Pengamanan kerja bakti / car free day komplek' },
  { id: 'jdw-min-2', hari: 'Minggu', shift: 'Siang', jam: '15:00 - 23:00', petugasIds: ['sec-5', 'sec-3'], lokasi: 'Pos Utama & Patroli', catatan: 'Penutupan portal timur pukul 18:00, persiapan serah terima regu awal pekan' },
  { id: 'jdw-min-3', hari: 'Minggu', shift: 'Malam', jam: '23:00 - 07:00', petugasIds: ['sec-1', 'sec-4'], lokasi: 'Pos Utama & Ronda Malam', catatan: 'Penutupan portal utama pukul 23:00, patroli rutin lingkungan' }
]

