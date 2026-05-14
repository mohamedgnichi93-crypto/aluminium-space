const fs = require('fs');
const files = ['fr.json', 'en.json', 'ar.json', 'tn.json', 'it.json'];
const updates = {
  fr: { sub: "Dernière étape", desc: "Laissez-nous vos coordonnées pour enregistrer votre demande de mesure.", nameLabel: "Nom complet", phoneLabel: "Numéro de téléphone", submitBtn: "Envoyer ma demande" },
  en: { sub: "Last step", desc: "Leave us your details to register your measurement request.", nameLabel: "Full name", phoneLabel: "Phone number", submitBtn: "Send my request" },
  ar: { sub: "الخطوة الأخيرة", desc: "اتركوا لنا بياناتكم لتسجيل طلب القياس.", nameLabel: "الاسم الكامل", phoneLabel: "رقم الهاتف", submitBtn: "إرسال الطلب" },
  tn: { sub: "الخطوة الأخيرة", desc: "خلينا نسجلوا معطياتك باش نكملوا طلب القياس.", nameLabel: "الإسم الكامل", phoneLabel: "رقم التلفون", submitBtn: "إبعث الطلب" },
  it: { sub: "Ultimo passo", desc: "Lasciaci i tuoi dati per registrare la tua richiesta di misura.", nameLabel: "Nome completo", phoneLabel: "Numero di telefono", submitBtn: "Invia la mia richiesta" }
};
for(const f of files) {
  const p = './src/i18n/locales/' + f;
  if(fs.existsSync(p)){
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    const lang = f.split('.')[0];
    if(d.measureGuide && d.measureGuide.clientStep) {
      // Create new object to maintain ordering somewhat nicely if we want, or just add keys
      // To ensure properties are grouped, we can just assign them
      const cs = d.measureGuide.clientStep;
      
      const newCs = {
        sub: updates[lang].sub,
        title: cs.title,
        desc: updates[lang].desc,
        nameLabel: updates[lang].nameLabel,
        namePlaceholder: cs.namePlaceholder,
        phoneLabel: updates[lang].phoneLabel,
        phonePlaceholder: cs.phonePlaceholder,
        submitBtn: updates[lang].submitBtn,
        successTitle: cs.successTitle,
        successDesc: cs.successDesc
      };
      
      d.measureGuide.clientStep = newCs;
      fs.writeFileSync(p, JSON.stringify(d, null, 2) + '\n');
    }
  }
}
console.log("JSON files updated.");
