const fs = require('fs');
const path = require('path');

const localesDir = path.join(__dirname, 'src/i18n/locales');
const files = ['fr.json', 'en.json', 'it.json', 'ar.json', 'tn.json'];

const contents = {
  fr: { title: "Vos coordonnées", namePlaceholder: "Votre prénom et nom", phonePlaceholder: "Ex: 55 123 456", submit: "Envoyer ma demande", successTitle: "Demande envoyée !", successDesc: "Votre demande a été envoyée avec succès. Notre équipe vous contactera bientôt." },
  en: { title: "Your details", namePlaceholder: "Your full name", phonePlaceholder: "Ex: 55 123 456", submit: "Send my request", successTitle: "Request sent!", successDesc: "Your request has been sent successfully. Our team will contact you shortly." },
  it: { title: "I tuoi dati", namePlaceholder: "Il tuo nome e cognome", phonePlaceholder: "Es: 55 123 456", submit: "Invia la mia richiesta", successTitle: "Richiesta inviata!", successDesc: "La tua richiesta è stata inviata con successo. Il nostro team ti contatterà a breve." },
  ar: { title: "بياناتك", namePlaceholder: "الاسم واللقب", phonePlaceholder: "مثال: 55 123 456", submit: "إرسال الطلب", successTitle: "تم إرسال الطلب!", successDesc: "تم إرسال طلبك بنجاح. سيتصل بك فريقنا قريباً." },
  tn: { title: "معطياتك", namePlaceholder: "الإسم و اللقب", phonePlaceholder: "مثال: 55 123 456", submit: "إبعث الطلب", successTitle: "الطلب تبعث!", successDesc: "الطلب متاعك تبعث بنجاح. فريقنا باش يكلمك في أقرب وقت." }
};

for (const f of files) {
  const p = path.join(localesDir, f);
  if (!fs.existsSync(p)) continue;
  const d = JSON.parse(fs.readFileSync(p, 'utf8'));
  const lang = f.split('.')[0];
  if (d.measureGuide) {
    d.measureGuide.clientStep = contents[lang];
    fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n', 'utf8');
    console.log(`Updated ${f}`);
  }
}
