export interface Product {
  id: string;
  nama: string;
  kategori: string;
  satuan: string;
  hargaBeli: number;
  hargaJual: number;
  stokAwal: number;
  minStok: number;
}

export interface Transaction {
  id: string;
  productId: string;
  jumlah: number;
  tanggal: string; // ISO String
  tipe: 'MASUK' | 'KELUAR';
  keterangan: string;
}

export type View = 'dashboard' | 'master' | 'masuk' | 'keluar' | 'laporan';
