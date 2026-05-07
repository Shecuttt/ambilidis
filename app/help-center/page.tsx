import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pusat Bantuan - Ambilidis",
  description: "Temukan jawaban atas pertanyaan Anda dan bantuan penggunaan platform Ambilidis.",
};

export default function HelpCenterPage() {
  const faqs = [
    {
      question: "Apa itu Ambilidis?",
      answer: "Ambilidis adalah platform marketplace lokal yang memudahkan Anda untuk menemukan dan membeli produk dari toko-toko di sekitar Anda dengan cepat dan mudah."
    },
    {
      question: "Bagaimana cara melakukan pemesanan?",
      answer: "Cari produk yang Anda inginkan, tambahkan ke keranjang, dan ikuti langkah-langkah checkout untuk menyelesaikan pesanan Anda."
    },
    {
      question: "Apakah saya bisa menjadi penjual di Ambilidis?",
      answer: "Tentu! Anda bisa mendaftar sebagai seller melalui halaman pendaftaran seller dan mulai mengelola toko Anda sendiri."
    },
    {
      question: "Bagaimana metode pembayarannya?",
      answer: "Kami mendukung berbagai metode pembayaran termasuk transfer bank, e-wallet, dan metode pembayaran lainnya yang tersedia saat checkout."
    },
    {
      question: "Bagaimana cara melacak pesanan saya?",
      answer: "Anda dapat melihat status pesanan Anda di halaman 'Pesanan Saya' setelah masuk ke akun Anda."
    }
  ];

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-primary mb-4">Pusat Bantuan</h1>
        <p className="text-muted-foreground text-lg">
          Punya pertanyaan? Kami di sini untuk membantu Anda.
        </p>
      </div>

      <div className="bg-card rounded-2xl p-6 md:p-10 shadow-sm border">
        <h2 className="text-2xl font-bold mb-8">Pertanyaan Umum (FAQ)</h2>
        <Accordion className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-lg font-semibold py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground">
          Tidak menemukan jawaban yang Anda cari?{" "}
          <a href="/contact-us" className="text-primary font-bold hover:underline">
            Hubungi Tim Kami
          </a>
        </p>
      </div>
    </div>
  );
}
