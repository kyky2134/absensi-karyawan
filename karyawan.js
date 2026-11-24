
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let karyawanAktif = null;

async function cekKaryawan() {
  const { data: sessionData } = await db.auth.getSession();

  if (!sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  const user = sessionData.session.user;

  const { data: profile, error: profileError } = await db
    .from("profiles")
    .select("nama, role")
    .eq("id", user.id)
    .single();

  if (profileError || profile.role !== "karyawan") {
    await db.auth.signOut();
    window.location.href = "index.html";
    return;
  }

  const { data, error } = await db
    .from("karyawan")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    document.getElementById("konten").textContent =
      "Data karyawan belum dihubungkan ke akun ini. Hubungi Admin.";
    return;
  }

  karyawanAktif = data;
  document.getElementById("namaKaryawan").textContent =
    "Selamat datang, " + data.nama;
}

async function absenMasuk() {
  if (!karyawanAktif) return alert("Data karyawan belum tersedia.");

  const sekarang = new Date();
  const tanggal = sekarang.toLocaleDateString("en-CA");
  const jam = sekarang.toTimeString().slice(0, 8);

  const { error } = await db.from("absensi").insert({
    karyawan_id: karyawanAktif.id,
    tanggal,
    jam_masuk: jam,
    status: "Hadir"
  });

  if (error) return alert("Gagal absen: " + error.message);

  alert("Absen masuk berhasil!");
}

async function absenPulang() {
  if (!karyawanAktif) return alert("Data karyawan belum tersedia.");

  const sekarang = new Date();
  const tanggal = sekarang.toLocaleDateString("en-CA");
  const jam = sekarang.toTimeString().slice(0, 8);

  const { data, error } = await db
    .from("absensi")
    .update({ jam_pulang: jam })
    .eq("karyawan_id", karyawanAktif.id)
    .eq("tanggal", tanggal)
    .is("jam_pulang", null)
    .select();

  if (error) return alert("Gagal absen pulang: " + error.message);

  if (!data.length) {
    alert("Belum absen masuk atau sudah absen pulang.");
    return;
  }

  alert("Absen pulang berhasil!");
}

async function lihatRiwayat() {
  const konten = document.getElementById("konten");
  if (!karyawanAktif) return;

  konten.textContent = "Memuat riwayat...";

  const { data, error } = await db
    .from("absensi")
    .select("*")
    .eq("karyawan_id", karyawanAktif.id)
    .order("tanggal", { ascending: false });

  if (error) {
    konten.textContent = "Gagal memuat riwayat.";
    return;
  }

  konten.innerHTML = "<h3>Riwayat Absensi</h3>";

  if (!data.length) {
    konten.innerHTML += "<p>Belum ada riwayat absensi.</p>";
    return;
  }

  data.forEach(a => {
    const baris = document.createElement("p");
    baris.textContent =
      `${a.tanggal} | Masuk: ${a.jam_masuk || "-"} | Pulang: ${a.jam_pulang || "-"}`;
    konten.appendChild(baris);
  });
}

function lihatProfil() {
  if (!karyawanAktif) return;

  const konten = document.getElementById("konten");
  konten.innerHTML = "<h3>Profil Saya</h3>";

  ["nama", "nomor_karyawan", "jabatan", "departemen"].forEach(kolom => {
    const baris = document.createElement("p");
    baris.textContent = kolom.replace("_", " ") + ": " +
      (karyawanAktif[kolom] || "-");
    konten.appendChild(baris);
  });
}

async function logout() {
  await db.auth.signOut();
  window.location.href = "index.html";
}

cekKaryawan();
