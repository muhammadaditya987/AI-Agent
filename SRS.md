# Software Requirements Specification (SRS)

## AI Agency Platform

| Atribut | Nilai |
|---|---|
| Versi dokumen | 1.1 |
| Status | Draft baseline, diperbarui setelah keputusan stack Sprint 1/2 |
| Tanggal | 31 Oktober 2026 |
| Bahasa | Indonesia |
| Pemilik produk | Belum ditetapkan |

## 1. Tujuan Project

### 1.1 Latar belakang

Organisasi membutuhkan platform yang dapat mengotomatiskan berbagai workflow lintas fungsi dengan memanfaatkan model AI, integrasi sistem, aturan bisnis, dan persetujuan manusia. Implementasi otomatisasi yang terpisah-pisah meningkatkan biaya pemeliharaan, menyulitkan kontrol akses, dan membuat kualitas serta penggunaan AI sulit diaudit.

### 1.2 Tujuan

AI Agency Platform adalah platform orkestrasi otomatisasi berbasis AI yang memungkinkan organisasi:

1. Merancang, menguji, menerbitkan, dan mengelola workflow otomatis tanpa harus membangun setiap integrasi dari awal.
2. Menggabungkan agent AI, pemrosesan deterministik, konektor, dan human-in-the-loop dalam satu alur yang dapat diaudit.
3. Mengelola workflow, data, pengguna, kebijakan, dan kredensial secara aman dalam konteks organisasi atau tenant.
4. Memantau biaya, kualitas, latensi, kegagalan, dan dampak bisnis setiap workflow.
5. Mengembangkan kapabilitas melalui katalog template dan integrasi yang dapat digunakan ulang.

### 1.3 Hasil bisnis yang diharapkan

- Mengurangi waktu pengerjaan proses yang berulang.
- Mempercepat pembuatan dan perubahan workflow.
- Meningkatkan konsistensi hasil dan keterlacakan proses.
- Mengurangi risiko penggunaan AI yang tidak terkendali.
- Menyediakan dasar pengukuran ROI per workflow.

Target angka bisnis, seperti penghematan waktu atau biaya per workflow, ditetapkan oleh Product Owner setelah baseline proses saat ini diukur.

### 1.4 Ruang lingkup

**Termasuk dalam platform:**

- Workspace organisasi dan kontrol akses berbasis peran.
- Editor workflow visual, versi workflow, validasi, dan lingkungan uji.
- Orkestrasi langkah AI, logika, integrasi, persetujuan, serta retry.
- Katalog konektor dan pengelolaan konfigurasi integrasi.
- Eksekusi terjadwal, berbasis event, atau manual.
- Riwayat eksekusi, observability, audit, dan kontrol penggunaan.
- API untuk pemicu workflow dan integrasi eksternal.

**Tidak termasuk dalam baseline MVP:**

- Pelatihan foundation model sendiri.
- Autonomous agent tanpa batas akses atau persetujuan.
- Marketplace publik dengan billing dan komisi pihak ketiga.
- Jaminan bahwa keluaran model selalu benar.
- Penggantian sistem sumber seperti CRM, ERP, atau HRIS.

### 1.5 Definisi

| Istilah | Definisi |
|---|---|
| Tenant | Batas isolasi data dan konfigurasi suatu organisasi/pelanggan. |
| Workflow | Graf terstruktur berisi trigger, langkah, kondisi, dan hasil. |
| Agent | Komponen yang menggunakan model AI dan/atau tools untuk mencapai tujuan terbatas. |
| Run | Satu instans eksekusi workflow dari trigger hingga selesai atau berhenti. |
| Connector | Adapter terkelola untuk berkomunikasi dengan sistem eksternal. |
| Human-in-the-loop (HITL) | Tahap yang memerlukan pemeriksaan atau keputusan manusia. |
| Approval gate | Kontrol yang menahan langkah atau efek samping sampai disetujui. |

## 2. User Persona

| Persona | Kebutuhan utama | Hak/aktivitas tipikal |
|---|---|---|
| Platform Administrator | Mengoperasikan platform secara aman dan andal | Mengelola tenant, konfigurasi global, kapasitas, kebijakan platform, dan insiden. |
| Organization Administrator | Mengelola pemakaian AI dalam organisasinya | Mengundang pengguna, menetapkan peran, mengatur konektor, kebijakan, dan kuota organisasi. |
| Workflow Builder / Automation Engineer | Membuat otomatisasi yang dapat dipelihara | Membuat, menguji, menerbitkan, memversikan, dan mendiagnosis workflow. |
| Business Owner | Mengotomatisasi proses bisnis dan mengukur manfaat | Mendefinisikan kebutuhan, memantau hasil, menyetujui perubahan, dan menetapkan KPI. |
| Operator / Approver | Menangani eksekusi yang memerlukan intervensi | Meninjau output, menyetujui/menolak tindakan, dan melanjutkan atau menghentikan run. |
| Auditor / Security Reviewer | Memastikan kepatuhan dan keterlacakan | Membaca log audit, konfigurasi, kebijakan, serta riwayat versi dan eksekusi. |
| End User / API Client | Memulai atau menerima hasil otomatisasi | Memicu workflow yang diizinkan dan melihat status/hasil sesuai otorisasi. |

Prinsip akses: least privilege; satu pengguna dapat memiliki lebih dari satu peran, tetapi hak akses efektif harus dapat dijelaskan dan diaudit.

## 3. Functional Requirements

Prioritas: **M** = wajib untuk MVP, **S** = penting setelah MVP, **C** = kandidat/opsional.

### 3.1 Organisasi, identitas, dan akses

| ID | Prioritas | Kebutuhan |
|---|---:|---|
| FR-001 | M | Sistem harus mendukung organisasi/tenant dengan isolasi data, konfigurasi, workflow, kredensial, dan run. |
| FR-002 | M | Sistem harus menyediakan autentikasi pengguna dan siklus undangan, aktivasi, penonaktifan, dan pencabutan sesi. |
| FR-003 | M | Sistem harus mendukung RBAC untuk tingkat platform, organisasi, workspace, workflow, dan aksi sensitif. |
| FR-004 | M | Sistem harus menerapkan otorisasi pada setiap operasi UI, API, dan eksekusi; menyembunyikan UI saja tidak cukup. |
| FR-005 | S | Sistem harus menyediakan SSO berbasis standar organisasi (OIDC; SAML bila diperlukan) dan pemetaan grup ke peran. |
| FR-006 | S | Sistem harus mendukung workspace/proyek untuk membatasi kolaborasi dan akses aset dalam tenant. |

### 3.2 Desain dan siklus hidup workflow

| ID | Prioritas | Kebutuhan |
|---|---:|---|
| FR-010 | M | Builder harus menyediakan cara visual atau deklaratif untuk menyusun trigger, langkah, kondisi, cabang, dan output. |
| FR-011 | M | Setiap workflow harus memiliki nama, deskripsi, pemilik, status, versi, skema input/output, dan metadata. |
| FR-012 | M | Sistem harus memvalidasi konfigurasi workflow sebelum uji coba atau publikasi, serta menunjukkan kesalahan dan lokasinya. |
| FR-013 | M | Pengguna harus dapat menyimpan draft, menguji dengan data contoh, menerbitkan versi, menonaktifkan, dan mengembalikan versi sebelumnya. |
| FR-014 | M | Versi workflow yang telah diterbitkan harus immutable; perubahan berikutnya menghasilkan versi baru. |
| FR-015 | M | Sistem harus mendukung variabel, transformasi data, kondisi, loop terbatas, timeout, dan penanganan kegagalan. |
| FR-016 | M | Sistem harus menampilkan preview input/output setiap langkah selama pengujian dengan penyamaran data sensitif. |
| FR-017 | S | Sistem harus mendukung template workflow yang dapat disalin dan disesuaikan sesuai hak akses. |
| FR-018 | S | Sistem harus menyediakan perbandingan versi dan catatan perubahan sebelum publikasi. |

### 3.3 Eksekusi dan orkestrasi

| ID | Prioritas | Kebutuhan |
|---|---:|---|
| FR-020 | M | Workflow harus dapat dimulai secara manual, melalui API, dan melalui jadwal. |
| FR-021 | S | Workflow harus dapat dipicu oleh event/webhook dari connector yang didukung. |
| FR-022 | M | Sistem harus mengelola status run: queued, running, waiting approval, succeeded, failed, cancelled, atau timed out. |
| FR-023 | M | Sistem harus mencatat waktu, versi workflow, identitas pemicu, langkah, hasil, dan error untuk setiap run. |
| FR-024 | M | Sistem harus mendukung timeout dan retry yang dapat dikonfigurasi untuk langkah idempoten, dengan exponential backoff dan batas percobaan. |
| FR-025 | M | Sistem harus mencegah duplikasi pemrosesan saat trigger yang sama dikirim ulang, menggunakan idempotency key bila tersedia. |
| FR-026 | M | Operator yang berwenang harus dapat membatalkan run; sistem harus menghentikan langkah berikutnya dan melaporkan status pembatalan. |
| FR-027 | S | Sistem harus mendukung jeda, resume, dan re-run dari langkah yang aman tanpa mengulang efek samping yang sudah berhasil. |
| FR-028 | M | Efek samping berisiko tinggi harus dapat ditahan sampai approval diberikan. |
| FR-029 | S | Sistem harus menyediakan antrean kerja dan kontrol konkurensi per tenant, workflow, serta connector. |

### 3.4 Kapabilitas AI

| ID | Prioritas | Kebutuhan |
|---|---:|---|
| FR-030 | M | Langkah AI harus mengidentifikasi provider/model, konfigurasi, input yang dikirim, dan metadata penggunaan. |
| FR-031 | M | Builder harus dapat menetapkan instruksi sistem, template prompt, parameter model yang didukung, dan batas output. |
| FR-032 | M | Sistem harus memvalidasi keluaran terhadap format/skema yang diminta sebelum diteruskan ke langkah berikutnya. |
| FR-033 | M | Sistem harus mencatat token/pemakaian, latensi, provider, dan biaya estimasi bila tersedia. |
| FR-034 | M | Workflow harus dapat membatasi model yang diizinkan, sumber data, tools, dan tindakan eksternal. |
| FR-035 | M | Sistem harus menyediakan kebijakan penanganan prompt injection, konten berbahaya, data sensitif, dan keluaran tidak valid sesuai konfigurasi organisasi. |
| FR-036 | M | Sistem harus menyediakan human review untuk keputusan berisiko tinggi, keluaran berketidakpastian, atau kondisi yang ditetapkan pemilik workflow. |
| FR-037 | S | Sistem harus mendukung evaluasi workflow AI menggunakan kumpulan kasus uji, kriteria kualitas, dan perbandingan versi/model. |
| FR-038 | S | Sistem dapat menyediakan retrieval/RAG dengan sumber dokumen, hak akses, metadata, serta aturan retensi yang jelas. |

### 3.5 Integrasi dan pengelolaan rahasia

| ID | Prioritas | Kebutuhan |
|---|---:|---|
| FR-040 | M | Sistem harus menyediakan connector awal melalui API/HTTP terkelola dan pola adapter yang konsisten. |
| FR-041 | M | Kredensial harus disimpan terpisah dari definisi workflow dan tidak boleh dikembalikan dalam bentuk plaintext setelah disimpan. |
| FR-042 | M | Sistem harus menyediakan uji koneksi, status kesehatan, rotasi, dan pencabutan kredensial sesuai kemampuan connector. |
| FR-043 | M | Akses connector harus dibatasi per tenant/workspace/workflow dan per operasi yang diizinkan. |
| FR-044 | S | Sistem harus mendukung konektor terpilih sesuai prioritas pelanggan, misalnya email, chat, CRM, dokumen, dan penyimpanan cloud. |
| FR-045 | S | Sistem harus memberikan batas permintaan, timeout, retry, serta pencatatan error connector yang aman. |

### 3.6 Operasi, pencarian, dan pelaporan

| ID | Prioritas | Kebutuhan |
|---|---:|---|
| FR-050 | M | Pengguna berwenang harus dapat mencari dan memfilter workflow serta run berdasarkan status, waktu, pemilik, trigger, dan ID. |
| FR-051 | M | Detail run harus menampilkan timeline langkah, durasi, status, pesan error yang telah disanitasi, dan jejak keputusan approval. |
| FR-052 | M | Sistem harus menyediakan log audit untuk perubahan akses, kebijakan, kredensial, versi workflow, publikasi, approval, dan tindakan administratif. |
| FR-053 | M | Sistem harus menyediakan ekspor data operasional dan audit sesuai peran dan kebijakan tenant. |
| FR-054 | S | Sistem harus menyediakan dashboard penggunaan, volume run, tingkat keberhasilan, biaya AI, dan tren latensi. |
| FR-055 | S | Sistem harus menyediakan notifikasi untuk kegagalan berulang, approval tertunda, kuota mendekati batas, dan degradasi connector. |

### 3.7 API

| ID | Prioritas | Kebutuhan |
|---|---:|---|
| FR-060 | M | API harus menyediakan autentikasi, otorisasi, validasi skema, versi, rate limit, dan dokumentasi. |
| FR-061 | M | API pemicu workflow harus mengembalikan ID run dan status penerimaan; hasil akhir dapat diambil atau dikirim melalui webhook. |
| FR-062 | M | API harus mendukung idempotency key untuk operasi pemicu yang berpotensi diulang. |
| FR-063 | S | Sistem harus menyediakan API administratif untuk mengelola aset sesuai kontrol akses. |

## 4. Non-Functional Requirements

Nilai target berikut adalah **baseline awal** yang perlu divalidasi terhadap beban, biaya, dan SLA bisnis.

| ID | Kategori | Target/Kebutuhan |
|---|---|---|
| NFR-001 | Ketersediaan | MVP: target ketersediaan layanan 99,5% per bulan, tidak termasuk pemeliharaan terjadwal dan gangguan provider eksternal. Target production enterprise dapat dinaikkan menjadi 99,9% setelah desain HA dan biaya disetujui. |
| NFR-002 | Latensi | API kontrol (selain pemrosesan AI/connector eksternal) p95 ≤ 500 ms pada beban yang disepakati. Pemicu asinkron mengembalikan acknowledgement p95 ≤ 1 detik. |
| NFR-003 | Skalabilitas | Kapasitas worker harus dapat ditambah horizontal; baseline uji beban awal 100 eksekusi aktif bersamaan, lalu disesuaikan dengan profil pelanggan. |
| NFR-004 | Durabilitas | Run yang diterima harus tersimpan secara durable; kegagalan satu worker tidak boleh menghilangkan status eksekusi. |
| NFR-005 | Isolasi | Tidak boleh ada kebocoran lintas tenant pada API, query, storage, cache, event, log yang dapat diakses pelanggan, atau kredensial. |
| NFR-006 | Keamanan | TLS untuk komunikasi; enkripsi data tersimpan; secret dikelola melalui secret manager; akses dengan least privilege. |
| NFR-007 | Privasi | Data prompt, dokumen, dan output diminimalkan; retensi dapat dikonfigurasi; penggunaan provider AI mengikuti kebijakan data organisasi dan perjanjian provider. |
| NFR-008 | Observability | Semua request dan run memiliki correlation/trace ID; metrik utama dapat ditelusuri ke tenant, workflow, versi, dan langkah tanpa mengekspos rahasia. |
| NFR-009 | Kemudahan pemeliharaan | Connector, provider AI, dan komponen orkestrasi memiliki batas antarmuka yang jelas dan pengujian kontrak. |
| NFR-010 | Portabilitas | Aplikasi harus dapat dijalankan pada lingkungan cloud yang disetujui; konfigurasi lingkungan dipisahkan dari artefak aplikasi. |
| NFR-011 | Aksesibilitas | UI mengikuti WCAG 2.1 AA untuk alur inti bila memungkinkan dan mendukung navigasi keyboard. |
| NFR-012 | Kompatibilitas | UI mendukung dua versi utama terbaru browser desktop yang disepakati; API mempertahankan kompatibilitas dalam versi mayor. |
| NFR-013 | Pemulihan | Target awal RPO ≤ 15 menit dan RTO ≤ 4 jam; wajib diuji melalui prosedur pemulihan sebelum produksi. |
| NFR-014 | Auditabilitas | Log audit bersifat append-only dari perspektif aplikasi, memiliki waktu tersinkronisasi, dan mengikuti retensi yang ditetapkan organisasi. |
| NFR-015 | Pengujian | Jalur kritis mencakup unit, integrasi, kontrak API/connector, isolasi tenant, keamanan, dan uji beban yang terukur. |
| NFR-016 | Biaya | Sistem harus menampilkan penggunaan dan biaya estimasi per tenant/workflow serta mendukung kuota atau batas pengeluaran. |

## 5. Tech Stack yang Direkomendasikan

Rekomendasi ini merupakan baseline netral-cloud; keputusan final perlu disesuaikan dengan kemampuan tim, regulasi, dan vendor organisasi.

| Lapisan | Rekomendasi | Pertimbangan |
|---|---|---|
| Frontend | React + TypeScript; Next.js untuk aplikasi web; komponen UI dengan aksesibilitas | Ekosistem luas, antarmuka workflow interaktif, typing end-to-end. |
| Backend API | Node.js + TypeScript dengan NestJS | Dipilih untuk implementasi Sprint 1/2 dan konsistensi TypeScript pada backend. |
| Orkestrasi | n8n dengan queue mode (main/editor dan worker) | Dipilih sebagai workflow engine; verifikasi retry, wait/resume, concurrency, dan persistensi pada versi deployment yang ditinjau. |
| Database transaksional | PostgreSQL | Data tenant, pengguna, definisi, konfigurasi, dan indeks run; terapkan isolasi tenant pada layer aplikasi dan database. |
| Cache / rate limit | Redis | Redis database 1 digunakan n8n queue mode; database 0 dicadangkan untuk kebutuhan platform API. |
| Antrean | Redis Bull queue n8n; broker terkelola dapat dievaluasi untuk event throughput tinggi | Memakai queue mode n8n untuk dispatch execution; Redis queue bukan sumber kebenaran data domain. |
| Object storage | Penyimpanan objek kompatibel S3 dengan enkripsi dan kebijakan lifecycle | Lampiran, artefak, dan dokumen yang tidak cocok disimpan sebagai blob transaksional. |
| AI gateway | Lapisan adapter internal untuk provider AI, kebijakan, logging, dan batas biaya | Meminimalkan ketergantungan langsung dan memungkinkan kontrol provider/model. |
| Secrets | Cloud secret manager atau Vault yang dikelola | Rotasi, kontrol akses, audit, dan integrasi dengan KMS. |
| Identitas | OIDC-compatible identity provider; SSO enterprise sesuai kebutuhan | Mengurangi pengelolaan password internal dan memudahkan federasi. |
| Observability | OpenTelemetry; backend metrics/logs/traces terkelola (mis. Prometheus/Grafana dan layanan log/trace) | Standar instrumentasi, korelasi lintas layanan, dan kemampuan memilih vendor. |
| Deployment | Container OCI; Kubernetes terkelola untuk skala/isolasi, atau container platform terkelola untuk MVP sederhana | Menghindari kompleksitas Kubernetes sebelum kebutuhan operasional membenarkannya. |
| CI/CD | Pipeline Git-based, pemeriksaan kualitas, pemindaian dependensi/image, deployment bertahap | Build dapat direproduksi, perubahan terlacak, rollback tersedia. |

**Prinsip arsitektur:** modular monolith atau layanan terpisah minimal pada tahap awal; pisahkan control plane (desain, konfigurasi, administrasi) dari execution plane (worker dan orkestrasi) saat kebutuhan skala/isolasi muncul. Jangan mengunci desain pada satu penyedia model atau cloud tanpa kebutuhan bisnis.

## 6. Workflow Sistem

### 6.1 Membuat dan menerbitkan workflow

1. Builder membuat workflow dari template atau kanvas kosong.
2. Builder memilih trigger, langkah AI/deterministik, connector, kondisi, dan output.
3. Builder mengikat credential reference tanpa menanam secret ke definisi workflow.
4. Sistem memvalidasi skema, izin, konfigurasi model, batas loop, timeout, dan approval gate.
5. Builder menjalankan uji coba menggunakan data sintetis atau data yang diizinkan.
6. Sistem menyajikan hasil per langkah dan menandai kesalahan atau data sensitif.
7. Workflow masuk ke review/approval bila kebijakan tenant mewajibkan.
8. Pengguna berwenang menerbitkan versi immutable; perubahan selanjutnya dibuat sebagai versi baru.

### 6.2 Eksekusi workflow

1. Trigger manual/API/jadwal/event diterima dan diotorisasi.
2. Sistem memvalidasi input, tenant, idempotency key, kuota, dan status publikasi.
3. Run dibuat durable dan dimasukkan ke orkestrator/antrean.
4. Worker menjalankan langkah sesuai urutan dan kebijakan: AI gateway, connector, transformasi, dan kondisi.
5. Setiap langkah mencatat status, durasi, penggunaan, correlation ID, dan hasil yang telah disanitasi.
6. Kegagalan ditangani sesuai kebijakan retry/timeout; kegagalan non-retriable menghentikan run dengan error yang dapat ditindaklanjuti.
7. Approval gate menahan run; approver mendapat notifikasi, kemudian menyetujui, menolak, atau meminta perubahan sesuai aturan.
8. Sistem memfinalisasi status run, menyimpan hasil sesuai retensi, mengirim notifikasi/webhook, dan memperbarui metrik.

### 6.3 Penanganan insiden dan re-run

1. Operator menemukan run bermasalah dari dashboard atau notifikasi.
2. Sistem menampilkan timeline dan error tersanitasi, tanpa menampilkan credential atau data sensitif yang tidak berwenang.
3. Operator dapat membatalkan, memperbaiki konfigurasi workflow, atau melakukan re-run sesuai hak akses.
4. Re-run menggunakan versi yang eksplisit dan menandai hubungan dengan run sebelumnya.
5. Sistem mencegah pengulangan efek samping yang diketahui telah berhasil, atau meminta konfirmasi/approval sebelum melanjutkan.

## 7. Integrasi

### 7.1 Kategori integrasi

- **Identity provider:** OIDC, dan SAML bila diwajibkan pelanggan.
- **Provider AI:** provider model cloud atau model privat/on-premises yang disetujui; integrasi melalui AI gateway.
- **Sistem bisnis:** CRM, ERP, helpdesk, HRIS, email, kalender, chat, dan sistem tiket.
- **Dokumen dan storage:** object storage, drive perusahaan, basis pengetahuan, serta sumber dokumen retrieval.
- **Event dan notifikasi:** webhook, email, chat, dan event bus sesuai kebutuhan.
- **Observability dan incident management:** ekspor log/metrics/traces dan pengiriman alert ke sistem operasional.
- **Billing/usage:** ekspor metrik penggunaan; integrasi billing khusus dapat menjadi fase lanjutan.

### 7.2 Kontrak integrasi

Setiap connector harus menetapkan: metode autentikasi, scope izin minimum, operasi yang tersedia, skema input/output, timeout, retryability, rate limit, idempotensi, kebijakan data, batas ukuran, versi API, dan perilaku saat provider tidak tersedia.

Webhook masuk harus memvalidasi tanda tangan bila provider mendukung, memeriksa replay, menerapkan rate limit, dan mengembalikan acknowledgement setelah event tersimpan secara durable.

### 7.3 Prioritas connector

Connector MVP dipilih berdasarkan wawancara pelanggan dan proses bernilai tinggi. Kandidat awal: HTTP/API generik yang dikontrol, email, satu platform chat, satu CRM atau ticketing, dan object storage. Nama vendor tidak ditetapkan sampai keputusan procurement dan data residency dikonfirmasi.

## 8. Security dan Governance

1. **Identitas dan akses:** RBAC, least privilege, MFA/SSO bila tersedia, sesi yang dapat dicabut, dan review akses berkala.
2. **Isolasi tenant:** tenant context wajib pada setiap operasi; validasi lintas tenant diuji otomatis; akses administratif lintas tenant dibatasi dan diaudit.
3. **Enkripsi:** TLS untuk transit dan enkripsi kuat untuk database, backup, dan object storage; kunci dikelola melalui KMS.
4. **Rahasia:** simpan di secret manager; larang secret dalam prompt, log, workflow export, source control, atau error response; rotasi dan pencabutan harus didukung.
5. **Perlindungan data:** klasifikasi data, minimisasi, masking/redaction, retensi dan penghapusan terkonfigurasi, serta pembatasan data yang dikirim ke provider AI.
6. **AI safety:** input tidak tepercaya diperlakukan sebagai data, bukan instruksi; batasi tools dan akses jaringan; validasi output; gunakan approval untuk aksi berdampak; berikan batas biaya/token dan waktu.
7. **Prompt injection dan exfiltration:** retrieval/tool output dianggap tidak tepercaya; batasi akses sumber per identitas; cegah agent mengirim data ke tujuan di luar allowlist.
8. **Connector berisiko:** tindakan tulis, kirim, hapus, pembayaran, atau perubahan hak istimewa memerlukan scope minimum dan approval sesuai kebijakan.
9. **Keamanan aplikasi:** validasi input, proteksi CSRF/XSS/SSRF sesuai konteks, rate limiting, security headers, dependency scanning, secret scanning, dan pengujian keamanan berkala.
10. **Audit:** catat actor, tindakan, waktu, tenant, target, hasil, dan correlation ID; jangan merekam token, password, atau payload sensitif secara default.
11. **Supply chain:** pin dan tinjau dependensi, scan image, tanda tangani artefak bila didukung, serta batasi hak pipeline deployment.
12. **Respons insiden:** prosedur triase, isolasi tenant/connector, rotasi credential, preservasi bukti, notifikasi, dan post-incident review.
13. **Kepatuhan:** target sertifikasi/regulasi (mis. SOC 2, ISO 27001, GDPR, atau aturan lokal) harus ditetapkan berdasarkan sektor, lokasi data, dan kontrak pelanggan; platform tidak boleh mengklaim kepatuhan sebelum audit formal.

## 9. Monitoring dan Operasional

### 9.1 Metrik minimum

- Ketersediaan API, error rate, p50/p95/p99 latency.
- Jumlah run per status, tingkat keberhasilan, durasi, antrean, dan retry.
- Kegagalan per workflow/versi/connector/provider.
- Penggunaan token, biaya estimasi, batas kuota, dan outlier.
- Waktu tunggu approval dan run yang tertahan.
- Kesehatan worker, antrean, database, cache, dan integrasi eksternal.
- Penolakan otorisasi, rate limit, serta anomali autentikasi.

### 9.2 Logging dan tracing

- Log terstruktur dengan timestamp UTC, environment, service, tenant ID yang tidak sensitif, workflow/run ID, dan trace ID.
- Payload dan prompt tidak dicatat secara default; jika diagnosis memerlukan sampel, masking dan kontrol akses wajib.
- Trace harus menghubungkan request API, orkestrator, worker, AI gateway, dan connector.
- Retensi log operasional dan audit ditetapkan terpisah sesuai kebutuhan hukum dan bisnis.

### 9.3 Alert dan SLO

Alert minimal mencakup peningkatan error rate, ketersediaan di bawah SLO, backlog antrean, kegagalan connector, kuota/biaya mendekati batas, worker tidak sehat, dan kegagalan backup. Setiap alert produksi harus memiliki pemilik, tingkat keparahan, runbook, serta jalur eskalasi.

## 10. Deployment dan Lingkungan

### 10.1 Lingkungan

- **Development:** data sintetis; kredensial non-produksi; eksperimen terisolasi.
- **Test/Staging:** konfigurasi mendekati produksi, dataset terkontrol, dan uji integrasi.
- **Production:** akses dibatasi, observability aktif, backup dan prosedur pemulihan teruji.

### 10.2 Pipeline rilis

1. Pull request menjalankan format/lint, unit test, type check, pemindaian dependensi, dan secret scan.
2. Build menghasilkan artefak immutable yang diberi versi.
3. Deployment ke staging menjalankan integration/contract test dan smoke test.
4. Rilis production menggunakan canary atau rolling deployment dengan health check dan observasi metrik.
5. Bila indikator memburuk, rollback aplikasi harus tersedia; perubahan skema database harus kompatibel lintas versi.

### 10.3 Data dan pemulihan

- Migrasi database harus berversi dan dapat diaudit.
- Backup terenkripsi, retensi, dan restore drill harus dijadwalkan.
- RPO/RTO mengikuti baseline NFR-013 hingga target final disetujui.
- Sediakan rencana pemulihan untuk kehilangan region/provider kritis sesuai biaya dan tier layanan.

### 10.4 Operasi produksi

Setiap deployment harus memiliki pemilik, catatan perubahan, prosedur rollback, dashboard kesehatan, dan jalur eskalasi. Perubahan policy, model default, dan akses connector diperlakukan sebagai perubahan produksi yang harus ditinjau.

## 11. Roadmap

| Fase | Cakupan | Kriteria keluar |
|---|---|---|
| 0. Discovery & Design (2–4 minggu) | Wawancara persona, pemetaan proses, klasifikasi data, keputusan tenant/identity, arsitektur, threat model, dan KPI baseline. | Prioritas workflow dan integrasi disepakati; asumsi kritis memiliki pemilik dan keputusan. |
| 1. MVP Platform (6–10 minggu) | Tenant/workspace dasar, login dan RBAC, workflow builder dasar, versi, trigger manual/API/jadwal, orkestrasi durable, AI gateway satu provider, HTTP connector, approval, run history, audit, dan observability dasar. | End-to-end workflow bernilai bisnis berjalan di staging; kontrol akses, failure/retry, dan isolasi tenant lulus pengujian. |
| 2. Pilot (4–8 minggu) | Pilot terbatas, connector prioritas, notifikasi, kuota/biaya, usability, hardening security, backup/restore, dan runbook. | Pengguna pilot menyelesaikan skenario target; metrik kualitas/ROI tersedia; risiko produksi ditangani. |
| 3. Enterprise GA (6–12 minggu) | SSO, kebijakan lanjutan, HA/DR sesuai SLO, evaluasi AI, ekspor audit, connector tambahan, proses support, serta peningkatan kapasitas. | SLO, keamanan, operasional, dokumentasi, dan persetujuan pelanggan terpenuhi. |
| 4. Scale & Ecosystem (berkelanjutan) | Katalog template, RAG terkelola, SDK/connector framework, billing lanjutan, multi-region atau deployment privat bila bernilai. | Fitur dirilis berdasarkan adopsi, risiko, biaya, dan bukti kebutuhan pelanggan. |

Durasi adalah estimasi perencanaan awal, bukan komitmen; perlu disesuaikan setelah tim, integrasi, dan tingkat kepatuhan diketahui.

## 12. Kriteria Penerimaan MVP

MVP dianggap siap untuk pilot bila:

1. Pengguna tenant A tidak dapat membaca atau mengubah aset tenant B, termasuk melalui API langsung.
2. Builder dapat menyusun, memvalidasi, menguji, menerbitkan, dan mengembalikan versi workflow.
3. Run yang diterima tercatat durable dan dapat dipantau sampai status terminal atau menunggu approval.
4. Timeout, retry, pembatalan, idempotensi, serta error connector mengikuti konfigurasi dan tidak menggandakan efek samping secara tidak terkendali.
5. Aksi yang dikategorikan berisiko tinggi tertahan sampai approval yang sah diberikan.
6. Secret tidak muncul di UI setelah disimpan, log, audit event, ekspor, atau pesan error.
7. Penggunaan AI dan kegagalan dapat ditelusuri per workflow/run dengan payload sensitif disamarkan.
8. Backup dapat dipulihkan dalam target yang disepakati dan prosedur pemulihan terdokumentasi.
9. Hasil uji beban, uji keamanan, dan uji integrasi memenuhi ambang yang telah disetujui Product Owner.

## 13. Asumsi, Ketergantungan, dan Keputusan Terbuka

### Asumsi baseline

- Platform melayani organisasi lebih dari satu tenant.
- Workflow dapat memanggil layanan eksternal dan menyertakan keputusan AI, tetapi tindakan berdampak tidak berjalan tanpa kontrol yang sesuai.
- MVP menggunakan model/provider eksternal yang disetujui; dukungan model privat dapat ditambahkan kemudian.
- Pengguna bisnis dan teknis menggunakan platform melalui web UI dan API.

### Keputusan yang perlu ditetapkan sebelum desain rinci

1. Target pelanggan dan proses bisnis pertama yang akan dipilotkan.
2. Deployment: public cloud, private cloud, atau on-premises; region dan data residency.
3. Model/provider AI yang disetujui serta apakah data pelanggan boleh dikirim ke provider tersebut.
4. SSO, MFA, dan provider identitas yang diwajibkan.
5. Kebutuhan regulasi, retensi, penghapusan, audit, serta data klasifikasi.
6. Target ketersediaan, RPO/RTO, kapasitas, volume run, dan batas latensi.
7. Connector MVP berdasarkan nilai bisnis dan akses API pelanggan.
8. Kebijakan approval untuk tindakan tulis/eksternal dan tingkat otonomi agent.
9. Model harga, kuota, dan kepemilikan biaya provider AI.
10. Bahasa UI, kebutuhan lokalisasi, dan kanal dukungan operasional.

Keputusan tersebut perlu direkam sebagai keputusan arsitektur/produk sebelum kontrak API, model data, dan rencana rilis dikunci.
