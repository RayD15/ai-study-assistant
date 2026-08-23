export type Material = {
  id: number;
  title: string;
  subject: string;
  fileName: string;
  fileType: "pdf" | "txt" | "text";
  createdAt: string;
};

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

export type Flashcard = {
  id: number;
  question: string;
  answer: string;
  mastered: boolean;
};

export const mockUser = {
  name: "Ray",
  username: "rayhand",
  email: "rayhand@example.com",
  xp: 1250,
  level: 5,
  levelName: "Learner",
  streak: 7,
  badges: ["First Quiz", "7 Day Streak", "Bookworm"],
};

export const mockMaterials: Material[] = [
  {
    id: 1,
    title: "Algoritma dan Pemrograman",
    subject: "Pemrograman",
    fileName: "algoritma-dasar.pdf",
    fileType: "pdf",
    createdAt: "2026-08-20",
  },
  {
    id: 2,
    title: "Trigonometri",
    subject: "Matematika",
    fileName: "trigonometri.pdf",
    fileType: "pdf",
    createdAt: "2026-08-18",
  },
  {
    id: 3,
    title: "Teks Eksplanasi",
    subject: "Bahasa Indonesia",
    fileName: "teks-eksplanasi.txt",
    fileType: "txt",
    createdAt: "2026-08-15",
  },
];

export const mockQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "Apa fungsi utama dari HTML?",
    options: [
      "Mengatur database",
      "Membuat struktur halaman web",
      "Membuat server",
      "Mengatur sistem operasi",
    ],
    correctAnswer: 1,
    explanation:
      "HTML (HyperText Markup Language) digunakan untuk membuat struktur halaman web, seperti heading, paragraf, dan gambar.",
  },
  {
    id: 2,
    question: "Apa kepanjangan dari CSS?",
    options: [
      "Creative Style Sheet",
      "Computer Style Sheet",
      "Cascading Style Sheets",
      "Colorful Style Sheets",
    ],
    correctAnswer: 2,
    explanation:
      "CSS adalah Cascading Style Sheets, bahasa untuk mengatur tampilan halaman web.",
  },
  {
    id: 3,
    question:
      "Manakah pernyataan yang benar tentang algoritma?",
    options: [
      "Algoritma harus ditulis dalam bahasa pemrograman",
      "Algoritma adalah urutan langkah logis penyelesaian masalah",
      "Algoritma hanya bisa berupa flowchart",
      "Algoritma tidak bisa diubah setelah dibuat",
    ],
    correctAnswer: 1,
    explanation:
      "Algoritma adalah urutan langkah logis dan sistematis untuk menyelesaikan masalah. Ia bisa ditulis dalam pseudocode, flowchart, maupun bahasa natural.",
  },
  {
    id: 4,
    question: "True atau False: JavaScript hanya bisa dijalankan di browser.",
    options: ["True", "False"],
    correctAnswer: 1,
    explanation:
      "Salah. JavaScript juga bisa berjalan di luar browser, misalnya melalui Node.js.",
  },
  {
    id: 5,
    question: "Apa itu pseudocode?",
    options: [
      "Bahasa pemrograman yang dikompilasi",
      "Notasi informal untuk menuliskan algoritma",
      "Kode mesin komputer",
      "Nama lain dari HTML",
    ],
    correctAnswer: 1,
    explanation:
      "Pseudocode adalah notasi informal menyerupai kode program untuk mendeskripsikan algoritma, tidak harus mengikuti sintaks bahasa tertentu.",
  },
];

export const mockFlashcards: Flashcard[] = [
  {
    id: 1,
    question: "Apa kepanjangan HTML?",
    answer: "HyperText Markup Language",
    mastered: false,
  },
  {
    id: 2,
    question: "Fungsi CSS dalam web development?",
    answer: "Mengatur tampilan/style halaman web",
    mastered: false,
  },
  {
    id: 3,
    question: "Sebutkan tiga cara menyajikan algoritma.",
    answer:
      "Kalimat deskriptif, flowchart, dan pseudocode.",
    mastered: true,
  },
  {
    id: 4,
    question: "Apa itu variabel?",
    answer:
      "Tempat penyimpanan data di memori yang nilainya dapat berubah selama program berjalan.",
    mastered: false,
  },
];

export const mockChatMessages = [
  {
    role: "assistant" as const,
    content:
      "Halo Ray. Aku sudah membaca materi Algoritma dan Pemrograman. Tanyakan apa saja tentang materinya.",
  },
  {
    role: "user" as const,
    content: "Apa itu inheritance dalam OOP?",
  },
  {
    role: "assistant" as const,
    content:
      "Inheritance (pewarisan) adalah mekanisme di mana sebuah class dapat mewarisi properti dan method dari class lain.\n\nContoh sederhana:\nclass Hewan punya atribut nama dan method makan().\nClass Burung mewarisi keduanya, lalu menambahkan method terbang().\n\nDengan begitu kita tidak perlu menulis ulang kode yang sama. Coba jelaskan dengan kata-katamu sendiri: kenapa inheritance membantu mengurangi duplikasi kode?",
  },
];
