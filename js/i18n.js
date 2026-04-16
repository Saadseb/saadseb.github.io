/* ═══ I18N — Internationalisation FR / EN / DE ═══ */
/* ═══ i18n — défini tôt dans le <head> pour être disponible dès le premier clic ═══ */
var LANG = 'fr';
var TRANSLATIONS = {
  fr: {
    nav_home:'Accueil', nav_shop:'Boutique', nav_blog:'Blog', nav_track:'Suivi',
    nav_about:'Atelier', nav_contact:'Contact', nav_affil:'🔗 Affiliation',
    nav_track_long:'Suivi Commande', nav_about_long:'Notre Atelier', cart:'Panier',
    hero_sub:'Fès · Marrakech · Livraison Mondiale', hero_em:"L'Art du Maroc",
    hero_cta1:'Découvrir la Collection', hero_cta2:'Suivre ma Commande',
    contact_eyebrow:'Nous Joindre', contact_title_em:'de Vous',
    contact_hero_sub:'Notre équipe vous répond en moins de 2 heures',
    contact_form_eyebrow:'Envoyer un Message', contact_name:'Votre Nom',
    contact_subject:'Sujet', contact_opt1:'Commande sur mesure',
    contact_opt2:'Question sur un produit', contact_opt3:'Suivi de commande',
    contact_opt4:'Autre', contact_msg_label:'Message', contact_send:'Envoyer le Message →',
  },
  en: {
    nav_home:'Home', nav_shop:'Shop', nav_blog:'Blog', nav_track:'Tracking',
    nav_about:'Atelier', nav_contact:'Contact', nav_affil:'🔗 Affiliate',
    nav_track_long:'Order Tracking', nav_about_long:'Our Atelier', cart:'Cart',
    hero_sub:'Fès · Marrakech · Worldwide Shipping', hero_em:'The Art of Morocco',
    hero_cta1:'Explore the Collection', hero_cta2:'Track my Order',
    contact_eyebrow:'Get in Touch', contact_title_em:'About You',
    contact_hero_sub:'Our team replies within 2 hours',
    contact_form_eyebrow:'Send a Message', contact_name:'Your Name',
    contact_subject:'Subject', contact_opt1:'Custom order',
    contact_opt2:'Product question', contact_opt3:'Order tracking',
    contact_opt4:'Other', contact_msg_label:'Message', contact_send:'Send Message →',
  },
  de: {
    nav_home:'Startseite', nav_shop:'Shop', nav_blog:'Blog', nav_track:'Bestellung',
    nav_about:'Atelier', nav_contact:'Kontakt', nav_affil:'🔗 Affiliate',
    nav_track_long:'Bestellung verfolgen', nav_about_long:'Unser Atelier', cart:'Warenkorb',
    hero_sub:'Fès · Marrakesch · Weltweiter Versand', hero_em:'Die Kunst Marokkos',
    hero_cta1:'Kollektion entdecken', hero_cta2:'Bestellung verfolgen',
    contact_eyebrow:'Kontakt aufnehmen', contact_title_em:'mit Ihnen',
    contact_hero_sub:'Unser Team antwortet innerhalb von 2 Stunden',
    contact_form_eyebrow:'Nachricht senden', contact_name:'Ihr Name',
    contact_subject:'Betreff', contact_opt1:'Maßanfertigung',
    contact_opt2:'Produktfrage', contact_opt3:'Bestellverfolgung',
    contact_opt4:'Sonstiges', contact_msg_label:'Nachricht', contact_send:'Nachricht senden →',
  }
};
function setLang(lang) {
  LANG = lang;
  ['fr','en','de'].forEach(function(l) {
    var btn = document.getElementById('lang-'+l);
    if(btn) btn.classList.toggle('active', l===lang);
  });
  var t = TRANSLATIONS[lang];
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if(t[key] !== undefined) el.textContent = t[key];
  });
  try { localStorage.setItem('faiza_lang', lang); } catch(e) {}
}
// Restaurer la langue sauvegardée
(function() {
  try {
    var saved = localStorage.getItem('faiza_lang');
    if(saved && ['fr','en','de'].indexOf(saved) > -1) {
      document.addEventListener('DOMContentLoaded', function() { setLang(saved); });
    }
  } catch(e) {}
})();