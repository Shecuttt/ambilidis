import { Metadata } from "next";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export const metadata: Metadata = {
  title: "Hubungi Kami - Ambilidis",
  description: "Hubungi tim dukungan Ambilidis untuk pertanyaan, saran, atau bantuan teknis.",
};

export default function ContactUsPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold text-primary mb-4">Hubungi Kami</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Kami senang mendengar dari Anda. Silakan hubungi kami melalui formulir di bawah ini atau melalui kontak resmi kami.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div className="space-y-8">
          <div className="bg-card rounded-2xl p-8 shadow-sm border space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Informasi Kontak</h2>
            
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Email</h3>
                <p className="text-muted-foreground">support@ambilidis.com</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Phone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Telepon</h3>
                <p className="text-muted-foreground">+62 812 3456 7890</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold">Alamat</h3>
                <p className="text-muted-foreground">
                  Jl. Contoh No. 123, Jakarta Selatan<br />
                  DKI Jakarta, 12345
                </p>
              </div>
            </div>
          </div>

          <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10">
            <h3 className="text-xl font-bold text-primary mb-2">Jam Operasional</h3>
            <p className="text-muted-foreground">
              Senin - Jumat: 09:00 - 18:00 WIB<br />
              Sabtu: 09:00 - 15:00 WIB
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-card rounded-2xl p-8 md:p-10 shadow-lg border border-primary/10">
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input id="name" placeholder="Masukkan nama Anda" className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="email@example.com" className="h-11" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subjek</Label>
              <Input id="subject" placeholder="Apa yang ingin Anda tanyakan?" className="h-11" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Pesan</Label>
              <Textarea id="message" placeholder="Tuliskan pesan Anda di sini..." className="min-h-[150px] resize-none" />
            </div>

            <Button className="w-full h-12 text-lg font-bold">
              <Send className="mr-2 h-5 w-5" />
              Kirim Pesan
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
