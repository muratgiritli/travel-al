import type { LangCode } from './types';

/** Per-key translations. Missing keys fall back to English. */
type Row = Partial<Record<LangCode, string>> & { en: string };

function pack(rows: Record<string, Row>): Record<LangCode, Record<string, string>> {
  const langs: LangCode[] = ['en', 'ar', 'es', 'de', 'tr', 'fr', 'ru'];
  const out = Object.fromEntries(langs.map((l) => [l, {} as Record<string, string>])) as Record<
    LangCode,
    Record<string, string>
  >;
  for (const [key, row] of Object.entries(rows)) {
    for (const l of langs) {
      out[l][key] = row[l] ?? row.en;
    }
  }
  return out;
}

const ROWS: Record<string, Row> = {
  // ── Common ──
  'common.continue': {
    en: 'Continue', tr: 'Devam', ar: 'متابعة', es: 'Continuar', de: 'Weiter', fr: 'Continuer', ru: 'Продолжить',
  },
  'common.cancel': {
    en: 'Cancel', tr: 'İptal', ar: 'إلغاء', es: 'Cancelar', de: 'Abbrechen', fr: 'Annuler', ru: 'Отмена',
  },
  'common.back': {
    en: 'Back', tr: 'Geri', ar: 'رجوع', es: 'Atrás', de: 'Zurück', fr: 'Retour', ru: 'Назад',
  },
  'common.yes': {
    en: 'Yes', tr: 'Evet', ar: 'نعم', es: 'Sí', de: 'Ja', fr: 'Oui', ru: 'Да',
  },
  'common.no': {
    en: 'No', tr: 'Hayır', ar: 'لا', es: 'No', de: 'Nein', fr: 'Non', ru: 'Нет',
  },
  'common.optional': {
    en: 'optional', tr: 'isteğe bağlı', ar: 'اختياري', es: 'opcional', de: 'optional', fr: 'facultatif', ru: 'необязательно',
  },
  'common.language': {
    en: 'Language', tr: 'Dil', ar: 'اللغة', es: 'Idioma', de: 'Sprache', fr: 'Langue', ru: 'Язык',
  },
  'common.selectCountry': {
    en: 'Select country', tr: 'Ülke seç', ar: 'اختر البلد', es: 'Seleccionar país', de: 'Land wählen', fr: 'Choisir le pays', ru: 'Выберите страну',
  },
  'common.submitting': {
    en: 'Submitting…', tr: 'Gönderiliyor…', ar: 'جارٍ الإرسال…', es: 'Enviando…', de: 'Wird gesendet…', fr: 'Envoi…', ru: 'Отправка…',
  },
  'common.remove': {
    en: 'Remove', tr: 'Kaldır', ar: 'إزالة', es: 'Eliminar', de: 'Entfernen', fr: 'Retirer', ru: 'Удалить',
  },

  // ── Chat chrome ──
  'chat.loadingCountries': {
    en: 'Loading countries…', tr: 'Ülkeler yükleniyor…', ar: 'جاري تحميل البلدان…', es: 'Cargando países…', de: 'Länder werden geladen…', fr: 'Chargement des pays…', ru: 'Загрузка стран…',
  },
  'chat.noCountry': {
    en: 'No country found', tr: 'Ülke bulunamadı', ar: 'لم يتم العثور على بلد', es: 'No se encontró el país', de: 'Kein Land gefunden', fr: 'Aucun pays trouvé', ru: 'Страна не найдена',
  },
  'chat.selectCountryFirst': {
    en: 'Select your passport country first', tr: 'Önce pasaport ülkenizi seçin', ar: 'اختر بلد جواز سفرك أولاً', es: 'Seleccione primero su país de pasaporte', de: 'Bitte zuerst Passland wählen', fr: 'Sélectionnez d’abord votre pays de passeport', ru: 'Сначала выберите страну паспорта',
  },
  'chat.changeCountry': {
    en: 'Change', tr: 'Değiştir', ar: 'تغيير', es: 'Cambiar', de: 'Ändern', fr: 'Changer', ru: 'Изменить',
  },
  'chat.passportCountry': {
    en: 'Passport country', tr: 'Pasaport ülkesi', ar: 'بلد جواز السفر', es: 'País del pasaporte', de: 'Passland', fr: 'Pays du passeport', ru: 'Страна паспорта',
  },
  'chat.backToServices': {
    en: '← Back to services', tr: '← Hizmetlere dön', ar: '← العودة إلى الخدمات', es: '← Volver a servicios', de: '← Zurück zu Diensten', fr: '← Retour aux services', ru: '← К услугам',
  },
  'chat.aiError': {
    en: 'Sorry, the AI service is temporarily unavailable. Please try again.',
    tr: 'Yapay zeka servisi geçici olarak kullanılamıyor. Lütfen tekrar deneyin.',
    ar: 'عذراً، خدمة الذكاء الاصطناعي غير متاحة مؤقتاً. يرجى المحاولة مرة أخرى.',
    es: 'Lo sentimos, el servicio de IA no está disponible temporalmente. Inténtelo de nuevo.',
    de: 'Der KI-Dienst ist vorübergehend nicht verfügbar. Bitte erneut versuchen.',
    fr: 'Désolé, le service IA est temporairement indisponible. Réessayez.',
    ru: 'Извините, ИИ временно недоступен. Попробуйте снова.',
  },

  // ── Footer ──
  'footer.faq': { en: 'FAQ', tr: 'SSS', ar: 'الأسئلة', es: 'FAQ', de: 'FAQ', fr: 'FAQ', ru: 'FAQ' },
  'footer.contact': { en: 'Contact', tr: 'İletişim', ar: 'اتصل', es: 'Contacto', de: 'Kontakt', fr: 'Contact', ru: 'Контакты' },
  'footer.privacy': { en: 'Privacy', tr: 'Gizlilik', ar: 'الخصوصية', es: 'Privacidad', de: 'Datenschutz', fr: 'Confidentialité', ru: 'Конфиденциальность' },
  'footer.terms': { en: 'Terms', tr: 'Şartlar', ar: 'الشروط', es: 'Términos', de: 'Bedingungen', fr: 'Conditions', ru: 'Условия' },
  'footer.track': { en: 'Track', tr: 'Takip', ar: 'تتبع', es: 'Seguimiento', de: 'Verfolgen', fr: 'Suivi', ru: 'Отслеживание' },

  // ── Option cards ──
  'option.label': {
    en: 'Option {n}', tr: 'Seçenek {n}', ar: 'الخيار {n}', es: 'Opción {n}', de: 'Option {n}', fr: 'Option {n}', ru: 'Вариант {n}',
  },
  'option.applyNow': {
    en: 'APPLY NOW', tr: 'ŞİMDİ BAŞVUR', ar: 'قدّم الآن', es: 'SOLICITAR AHORA', de: 'JETZT BEANTRAGEN', fr: 'DEMANDER MAINTENANT', ru: 'ПОДАТЬ ЗАЯВКУ',
  },
  'option.ageInfo': {
    en: 'Under 15 and over 45 can apply for a direct e-Permit without additional permit conditions.',
    tr: '15 yaş altı ve 45 yaş üstü ek izin şartı olmadan doğrudan e-izin başvurusu yapabilir.',
    ar: 'من هم دون 15 وفوق 45 يمكنهم التقديم على تصريح إلكتروني مباشر دون شروط إضافية.',
    es: 'Menores de 15 y mayores de 45 pueden solicitar un e-Permiso directo sin condiciones adicionales.',
    de: 'Unter 15 und über 45 können eine direkte e-Genehmigung ohne zusätzliche Bedingungen beantragen.',
    fr: 'Les moins de 15 ans et plus de 45 ans peuvent demander un e-Permis direct sans conditions supplémentaires.',
    ru: 'Лица младше 15 и старше 45 могут подать на прямой e-Permit без доп. условий.',
  },
  'option.ageQuestion': {
    en: 'Are you under 15 or over 45?',
    tr: '15 yaş altında veya 45 yaş üzerinde misiniz?',
    ar: 'هل أنت دون 15 أو فوق 45؟',
    es: '¿Tiene menos de 15 o más de 45 años?',
    de: 'Sind Sie unter 15 oder über 45?',
    fr: 'Avez-vous moins de 15 ou plus de 45 ans ?',
    ru: 'Вам меньше 15 или больше 45?',
  },
  'option.ageNoHint': {
    en: 'This option is only for the eligible age group. Please use Option 2 or another path that matches your situation.',
    tr: 'Bu seçenek yalnızca uygun yaş grubu içindir. Lütfen Seçenek 2 veya durumunuza uygun başka bir yolu kullanın.',
    ar: 'هذا الخيار للفئة العمرية المؤهلة فقط. يرجى استخدام الخيار 2 أو مساراً آخر يناسب وضعك.',
    es: 'Esta opción es solo para el grupo de edad elegible. Use la Opción 2 u otra vía adecuada.',
    de: 'Diese Option gilt nur für die berechtigte Altersgruppe. Bitte Option 2 oder einen anderen Weg wählen.',
    fr: 'Cette option est réservée au groupe d’âge éligible. Utilisez l’option 2 ou une autre voie.',
    ru: 'Этот вариант только для подходящей возрастной группы. Используйте вариант 2 или другой путь.',
  },

  // ── Entry apply ──
  'entry.title': {
    en: 'Application form', tr: 'Başvuru formu', ar: 'نموذج الطلب', es: 'Formulario de solicitud', de: 'Antragsformular', fr: 'Formulaire de demande', ru: 'Форма заявки',
  },
  'entry.arrival': {
    en: 'Arrival Date in Türkiye', tr: 'Türkiye’ye varış tarihi', ar: 'تاريخ الوصول إلى تركيا', es: 'Fecha de llegada a Türkiye', de: 'Ankunftsdatum in Türkiye', fr: 'Date d’arrivée en Türkiye', ru: 'Дата прибытия в Türkiye',
  },
  'entry.endDate': {
    en: 'End date', tr: 'Bitiş tarihi', ar: 'تاريخ الانتهاء', es: 'Fecha de fin', de: 'Enddatum', fr: 'Date de fin', ru: 'Дата окончания',
  },
  'entry.tripLength': {
    en: 'Trip length', tr: 'Seyahat süresi', ar: 'مدة الرحلة', es: 'Duración del viaje', de: 'Reisedauer', fr: 'Durée du séjour', ru: 'Длительность поездки',
  },
  'entry.days': {
    en: '{n} day', tr: '{n} gün', ar: '{n} يوم', es: '{n} día', de: '{n} Tag', fr: '{n} jour', ru: '{n} день',
  },
  'entry.days_plural': {
    en: '{n} days', tr: '{n} gün', ar: '{n} أيام', es: '{n} días', de: '{n} Tage', fr: '{n} jours', ru: '{n} дней',
  },
  'entry.applicantPrimary': {
    en: 'Applicant 1 (primary)', tr: 'Başvuran 1 (birincil)', ar: 'مقدم الطلب 1 (أساسي)', es: 'Solicitante 1 (principal)', de: 'Antragsteller 1 (primär)', fr: 'Demandeur 1 (principal)', ru: 'Заявитель 1 (основной)',
  },
  'entry.applicantN': {
    en: 'Applicant {n}', tr: 'Başvuran {n}', ar: 'مقدم الطلب {n}', es: 'Solicitante {n}', de: 'Antragsteller {n}', fr: 'Demandeur {n}', ru: 'Заявитель {n}',
  },
  'entry.addApplicant': {
    en: '+ Add another applicant', tr: '+ Başka başvuran ekle', ar: '+ إضافة مقدم طلب آخر', es: '+ Añadir otro solicitante', de: '+ Weiteren Antragsteller hinzufügen', fr: '+ Ajouter un autre demandeur', ru: '+ Добавить заявителя',
  },
  'entry.firstName': {
    en: 'Given/First Name(s)', tr: 'Ad', ar: 'الاسم الأول', es: 'Nombre(s)', de: 'Vorname(n)', fr: 'Prénom(s)', ru: 'Имя',
  },
  'entry.surname': {
    en: 'Surname(s)', tr: 'Soyad', ar: 'اسم العائلة', es: 'Apellido(s)', de: 'Nachname', fr: 'Nom(s)', ru: 'Фамилия',
  },
  'entry.dob': {
    en: 'Date of Birth', tr: 'Doğum tarihi', ar: 'تاريخ الميلاد', es: 'Fecha de nacimiento', de: 'Geburtsdatum', fr: 'Date de naissance', ru: 'Дата рождения',
  },
  'entry.placeOfBirth': {
    en: 'Place of Birth', tr: 'Doğum yeri', ar: 'مكان الميلاد', es: 'Lugar de nacimiento', de: 'Geburtsort', fr: 'Lieu de naissance', ru: 'Место рождения',
  },
  'entry.passportNo': {
    en: 'Passport Number', tr: 'Pasaport no', ar: 'رقم جواز السفر', es: 'Número de pasaporte', de: 'Passnummer', fr: 'Numéro de passeport', ru: 'Номер паспорта',
  },
  'entry.passportIssue': {
    en: 'Passport Issue Date', tr: 'Pasaport veriliş tarihi', ar: 'تاريخ إصدار الجواز', es: 'Fecha de emisión', de: 'Ausstellungsdatum', fr: 'Date de délivrance', ru: 'Дата выдачи',
  },
  'entry.passportExpiry': {
    en: 'Passport Expiry Date', tr: 'Pasaport bitiş tarihi', ar: 'تاريخ انتهاء الجواز', es: 'Fecha de caducidad', de: 'Ablaufdatum', fr: 'Date d’expiration', ru: 'Срок действия',
  },
  'entry.suppFrom': {
    en: 'Supporting Doc. From', tr: 'Destekleyici belge ülkesi', ar: 'وثيقة داعمة من', es: 'Doc. de apoyo de', de: 'Nachweis aus', fr: 'Doc. justificatif de', ru: 'Подтверждающий док. из',
  },
  'entry.suppNo': {
    en: 'Supporting Doc. No.', tr: 'Destekleyici belge no', ar: 'رقم الوثيقة الداعمة', es: 'N.º doc. de apoyo', de: 'Nachweis-Nr.', fr: 'N° doc. justificatif', ru: 'Номер документа',
  },
  'entry.suppExpiry': {
    en: 'Supp. Doc. Expiry Date', tr: 'Belge bitiş tarihi', ar: 'انتهاء الوثيقة الداعمة', es: 'Caducidad doc. apoyo', de: 'Nachweis gültig bis', fr: 'Expiration du justificatif', ru: 'Срок документа',
  },
  'entry.contact': {
    en: 'Contact', tr: 'İletişim', ar: 'التواصل', es: 'Contacto', de: 'Kontakt', fr: 'Contact', ru: 'Контакты',
  },
  'entry.email': {
    en: 'E-mail address', tr: 'E-posta', ar: 'البريد الإلكتروني', es: 'Correo electrónico', de: 'E-Mail', fr: 'E-mail', ru: 'Эл. почта',
  },
  'entry.phone': {
    en: 'Phone Number', tr: 'Telefon', ar: 'رقم الهاتف', es: 'Teléfono', de: 'Telefonnummer', fr: 'Téléphone', ru: 'Телефон',
  },
  'entry.address': {
    en: 'Address', tr: 'Adres', ar: 'العنوان', es: 'Dirección', de: 'Adresse', fr: 'Adresse', ru: 'Адрес',
  },
  'entry.insuranceTitle': {
    en: 'Travel health insurance', tr: 'Seyahat sağlık sigortası', ar: 'تأمين السفر الصحي', es: 'Seguro de viaje', de: 'Reisekrankenversicherung', fr: 'Assurance voyage', ru: 'Медицинская страховка',
  },
  'entry.insuranceBody': {
    en: 'Coverage for the applicants below, matching your travel dates.',
    tr: 'Aşağıdaki başvuranlar için seyahat tarihlerine uygun teminat.',
    ar: 'تغطية لمقدمي الطلب أدناه وفق تواريخ سفركم.',
    es: 'Cobertura para los solicitantes según sus fechas de viaje.',
    de: 'Schutz für die unten genannten Antragsteller entsprechend Ihrer Reisedaten.',
    fr: 'Couverture pour les demandeurs ci-dessous selon vos dates de voyage.',
    ru: 'Покрытие для заявителей ниже по датам поездки.',
  },
  'entry.entryFee': {
    en: 'Entry permit ({currency} {price} × {n})',
    tr: 'Giriş izni ({currency} {price} × {n})',
    ar: 'تصريح الدخول ({currency} {price} × {n})',
    es: 'Permiso de entrada ({currency} {price} × {n})',
    de: 'Einreiseerlaubnis ({currency} {price} × {n})',
    fr: 'Permis d’entrée ({currency} {price} × {n})',
    ru: 'Разрешение на въезд ({currency} {price} × {n})',
  },
  'entry.insuranceLine': {
    en: 'Insurance', tr: 'Sigorta', ar: 'التأمين', es: 'Seguro', de: 'Versicherung', fr: 'Assurance', ru: 'Страховка',
  },
  'entry.total': {
    en: 'Total', tr: 'Toplam', ar: 'المجموع', es: 'Total', de: 'Gesamt', fr: 'Total', ru: 'Итого',
  },
  'entry.paymentNow': {
    en: 'PAYMENT NOW', tr: 'ŞİMDİ ÖDE', ar: 'ادفع الآن', es: 'PAGAR AHORA', de: 'JETZT ZAHLEN', fr: 'PAYER MAINTENANT', ru: 'ОПЛАТИТЬ СЕЙЧАС',
  },
  'entry.validityNote': {
    en: 'Your {label} is valid from {from} to {to} for a total period of {days} days. Your stay cannot exceed {max} days.',
    tr: '{label} belgeniz {from} – {to} arasında toplam {days} gün geçerlidir. Konaklamanız {max} günü aşamaz.',
    ar: '{label} ساري من {from} إلى {to} لمدة إجمالية {days} يوماً. لا يمكن أن تتجاوز إقامتك {max} يوماً.',
    es: 'Su {label} es válido del {from} al {to} por un total de {days} días. Su estancia no puede superar {max} días.',
    de: 'Ihr {label} ist vom {from} bis {to} für insgesamt {days} Tage gültig. Der Aufenthalt darf {max} Tage nicht überschreiten.',
    fr: 'Votre {label} est valable du {from} au {to} pour une période totale de {days} jours. Le séjour ne peut dépasser {max} jours.',
    ru: 'Ваш {label} действует с {from} по {to}, всего {days} дней. Пребывание не может превышать {max} дней.',
  },
  'entry.validityNoteEmpty': {
    en: 'Your {label} is valid for a total period of {days} days from your arrival date. Your stay cannot exceed {max} days.',
    tr: '{label} belgeniz varış tarihinden itibaren toplam {days} gün geçerlidir. Konaklamanız {max} günü aşamaz.',
    ar: '{label} ساري لمدة إجمالية {days} يوماً من تاريخ وصولك. لا يمكن أن تتجاوز إقامتك {max} يوماً.',
    es: 'Su {label} es válido por un total de {days} días desde la llegada. Su estancia no puede superar {max} días.',
    de: 'Ihr {label} ist ab Ankunft für insgesamt {days} Tage gültig. Der Aufenthalt darf {max} Tage nicht überschreiten.',
    fr: 'Votre {label} est valable {days} jours à compter de l’arrivée. Le séjour ne peut dépasser {max} jours.',
    ru: 'Ваш {label} действует {days} дней с даты прибытия. Пребывание не более {max} дней.',
  },
  'entry.err.dates': {
    en: 'Select arrival and end dates.', tr: 'Varış ve bitiş tarihlerini seçin.', ar: 'حدد تاريخي الوصول والانتهاء.', es: 'Seleccione fechas de llegada y fin.', de: 'Ankunfts- und Enddatum wählen.', fr: 'Sélectionnez les dates d’arrivée et de fin.', ru: 'Выберите даты прибытия и окончания.',
  },
  'entry.err.stayMax': {
    en: 'Stay cannot exceed {max} days.', tr: 'Konaklama {max} günü aşamaz.', ar: 'لا يمكن أن تتجاوز الإقامة {max} يوماً.', es: 'La estancia no puede superar {max} días.', de: 'Aufenthalt max. {max} Tage.', fr: 'Séjour max. {max} jours.', ru: 'Пребывание не более {max} дней.',
  },
  'entry.err.email': {
    en: 'Enter a valid email address.', tr: 'Geçerli bir e-posta girin.', ar: 'أدخل بريداً إلكترونياً صالحاً.', es: 'Introduzca un email válido.', de: 'Gültige E-Mail eingeben.', fr: 'Entrez un e-mail valide.', ru: 'Введите корректный email.',
  },
  'entry.err.phone': {
    en: 'Enter a phone number.', tr: 'Telefon numarası girin.', ar: 'أدخل رقم الهاتف.', es: 'Introduzca un teléfono.', de: 'Telefonnummer eingeben.', fr: 'Entrez un téléphone.', ru: 'Введите телефон.',
  },
  'entry.err.address': {
    en: 'Enter an address.', tr: 'Adres girin.', ar: 'أدخل العنوان.', es: 'Introduzca una dirección.', de: 'Adresse eingeben.', fr: 'Entrez une adresse.', ru: 'Введите адрес.',
  },

  // ── Sticker ──
  'sticker.firstName': {
    en: 'First name', tr: 'Ad', ar: 'الاسم الأول', es: 'Nombre', de: 'Vorname', fr: 'Prénom', ru: 'Имя',
  },
  'sticker.surname': {
    en: 'Surname', tr: 'Soyad', ar: 'اسم العائلة', es: 'Apellido', de: 'Nachname', fr: 'Nom', ru: 'Фамилия',
  },
  'sticker.passportNo': {
    en: 'Passport No', tr: 'Pasaport no', ar: 'رقم الجواز', es: 'N.º pasaporte', de: 'Pass-Nr.', fr: 'N° passeport', ru: '№ паспорта',
  },
  'sticker.passportValid': {
    en: 'Passport Valid Date', tr: 'Pasaport geçerlilik', ar: 'صلاحية الجواز', es: 'Validez del pasaporte', de: 'Pass gültig bis', fr: 'Validité du passeport', ru: 'Срок паспорта',
  },
  'sticker.city': {
    en: 'City', tr: 'Şehir', ar: 'المدينة', es: 'Ciudad', de: 'Stadt', fr: 'Ville', ru: 'Город',
  },
  'sticker.residence': {
    en: 'Residence Country', tr: 'İkamet ülkesi', ar: 'بلد الإقامة', es: 'País de residencia', de: 'Wohnsitzland', fr: 'Pays de résidence', ru: 'Страна проживания',
  },
  'sticker.birthDate': {
    en: 'Birth Date', tr: 'Doğum tarihi', ar: 'تاريخ الميلاد', es: 'Fecha de nacimiento', de: 'Geburtsdatum', fr: 'Date de naissance', ru: 'Дата рождения',
  },
  'sticker.serviceFee': {
    en: 'Service fee', tr: 'Hizmet bedeli', ar: 'رسوم الخدمة', es: 'Tarifa de servicio', de: 'Servicegebühr', fr: 'Frais de service', ru: 'Сервисный сбор',
  },
  'sticker.continuePay': {
    en: 'Continue to payment', tr: 'Ödemeye devam', ar: 'متابعة الدفع', es: 'Continuar al pago', de: 'Weiter zur Zahlung', fr: 'Continuer vers le paiement', ru: 'К оплате',
  },

  // ── Insurance form ──
  'ins.regTitle': {
    en: 'Insurance registration', tr: 'Sigorta kaydı', ar: 'تسجيل التأمين', es: 'Registro de seguro', de: 'Versicherungsregistrierung', fr: 'Inscription assurance', ru: 'Регистрация страховки',
  },
  'ins.regHint': {
    en: 'Enter travel dates and traveler details to calculate your total.',
    tr: 'Toplamı hesaplamak için seyahat tarihlerini ve yolcu bilgilerini girin.',
    ar: 'أدخل تواريخ السفر وتفاصيل المسافرين لحساب المجموع.',
    es: 'Introduzca fechas y datos de viajeros para calcular el total.',
    de: 'Reisedaten und Reisende eingeben, um den Gesamtbetrag zu berechnen.',
    fr: 'Saisissez les dates et voyageurs pour calculer le total.',
    ru: 'Укажите даты и данные путешественников для расчёта суммы.',
  },
  'ins.travelStart': {
    en: 'Travel start', tr: 'Seyahat başlangıcı', ar: 'بداية السفر', es: 'Inicio del viaje', de: 'Reisebeginn', fr: 'Début du voyage', ru: 'Начало поездки',
  },
  'ins.travelEnd': {
    en: 'Travel end', tr: 'Seyahat sonu', ar: 'نهاية السفر', es: 'Fin del viaje', de: 'Reiseende', fr: 'Fin du voyage', ru: 'Конец поездки',
  },
  'ins.totalDays': {
    en: 'Total days', tr: 'Toplam gün', ar: 'إجمالي الأيام', es: 'Días totales', de: 'Gesamttage', fr: 'Jours au total', ru: 'Всего дней',
  },
  'ins.travelers': {
    en: 'Travelers', tr: 'Yolcular', ar: 'المسافرون', es: 'Viajeros', de: 'Reisende', fr: 'Voyageurs', ru: 'Путешественники',
  },
  'ins.maxTravelers': {
    en: 'max 6', tr: 'en fazla 6', ar: 'بحد أقصى 6', es: 'máx. 6', de: 'max. 6', fr: 'max. 6', ru: 'макс. 6',
  },
  'ins.travelerN': {
    en: 'Traveler {n}', tr: 'Yolcu {n}', ar: 'المسافر {n}', es: 'Viajero {n}', de: 'Reisender {n}', fr: 'Voyageur {n}', ru: 'Путешественник {n}',
  },
  'ins.firstName': {
    en: 'First name', tr: 'Ad', ar: 'الاسم الأول', es: 'Nombre', de: 'Vorname', fr: 'Prénom', ru: 'Имя',
  },
  'ins.lastName': {
    en: 'Last name', tr: 'Soyad', ar: 'اسم العائلة', es: 'Apellido', de: 'Nachname', fr: 'Nom', ru: 'Фамилия',
  },
  'ins.birthYear': {
    en: 'Birth year', tr: 'Doğum yılı', ar: 'سنة الميلاد', es: 'Año de nacimiento', de: 'Geburtsjahr', fr: 'Année de naissance', ru: 'Год рождения',
  },
  'ins.year': {
    en: 'Year', tr: 'Yıl', ar: 'السنة', es: 'Año', de: 'Jahr', fr: 'Année', ru: 'Год',
  },
  'ins.passportNo': {
    en: 'Passport number', tr: 'Pasaport no', ar: 'رقم الجواز', es: 'N.º pasaporte', de: 'Passnummer', fr: 'N° passeport', ru: 'Номер паспорта',
  },
  'ins.mobile': {
    en: 'Mobile phone', tr: 'Cep telefonu', ar: 'هاتف محمول', es: 'Móvil', de: 'Mobiltelefon', fr: 'Mobile', ru: 'Мобильный',
  },
  'ins.email': {
    en: 'Email', tr: 'E-posta', ar: 'البريد', es: 'Email', de: 'E-Mail', fr: 'E-mail', ru: 'Email',
  },
  'ins.continuePay': {
    en: 'Continue to payment', tr: 'Ödemeye devam', ar: 'متابعة الدفع', es: 'Continuar al pago', de: 'Weiter zur Zahlung', fr: 'Continuer vers le paiement', ru: 'К оплате',
  },

  // ── eSIM ──
  'esim.orderTitle': {
    en: 'eSIM order', tr: 'eSIM siparişi', ar: 'طلب eSIM', es: 'Pedido eSIM', de: 'eSIM-Bestellung', fr: 'Commande eSIM', ru: 'Заказ eSIM',
  },
  'esim.firstName': {
    en: 'First name', tr: 'Ad', ar: 'الاسم الأول', es: 'Nombre', de: 'Vorname', fr: 'Prénom', ru: 'Имя',
  },
  'esim.lastName': {
    en: 'Last name', tr: 'Soyad', ar: 'اسم العائلة', es: 'Apellido', de: 'Nachname', fr: 'Nom', ru: 'Фамилия',
  },
  'esim.phone': {
    en: 'Phone', tr: 'Telefon', ar: 'الهاتف', es: 'Teléfono', de: 'Telefon', fr: 'Téléphone', ru: 'Телефон',
  },
  'esim.email': {
    en: 'Email', tr: 'E-posta', ar: 'البريد', es: 'Email', de: 'E-Mail', fr: 'E-mail', ru: 'Email',
  },
  'esim.country': {
    en: 'Country', tr: 'Ülke', ar: 'البلد', es: 'País', de: 'Land', fr: 'Pays', ru: 'Страна',
  },
  'esim.submitPay': {
    en: 'Continue to payment', tr: 'Ödemeye devam', ar: 'متابعة الدفع', es: 'Continuar al pago', de: 'Weiter zur Zahlung', fr: 'Continuer vers le paiement', ru: 'К оплате',
  },
  'esim.backPackages': {
    en: '← Back to packages', tr: '← Paketlere dön', ar: '← العودة إلى الباقات', es: '← Volver a paquetes', de: '← Zurück zu Paketen', fr: '← Retour aux forfaits', ru: '← К пакетам',
  },

  // ── Payment ──
  'pay.title': {
    en: 'Payment', tr: 'Ödeme', ar: 'الدفع', es: 'Pago', de: 'Zahlung', fr: 'Paiement', ru: 'Оплата',
  },
  'pay.hint': {
    en: 'Enter card details to continue.', tr: 'Devam etmek için kart bilgilerini girin.', ar: 'أدخل بيانات البطاقة للمتابعة.', es: 'Introduzca los datos de la tarjeta.', de: 'Kartendaten eingeben, um fortzufahren.', fr: 'Saisissez les données de carte.', ru: 'Введите данные карты.',
  },
  'pay.amountDue': {
    en: 'Amount due', tr: 'Ödenecek tutar', ar: 'المبلغ المستحق', es: 'Importe a pagar', de: 'Fälliger Betrag', fr: 'Montant dû', ru: 'К оплате',
  },
  'pay.cardholder': {
    en: 'Cardholder name', tr: 'Kart sahibi', ar: 'اسم حامل البطاقة', es: 'Titular de la tarjeta', de: 'Karteninhaber', fr: 'Titulaire de la carte', ru: 'Имя на карте',
  },
  'pay.cardNumber': {
    en: 'Card number', tr: 'Kart numarası', ar: 'رقم البطاقة', es: 'Número de tarjeta', de: 'Kartennummer', fr: 'Numéro de carte', ru: 'Номер карты',
  },
  'pay.expiry': {
    en: 'Expiry', tr: 'Son kullanma', ar: 'الانتهاء', es: 'Caducidad', de: 'Ablauf', fr: 'Expiration', ru: 'Срок',
  },
  'pay.cvc': {
    en: 'CVC', tr: 'CVC', ar: 'CVC', es: 'CVC', de: 'CVC', fr: 'CVC', ru: 'CVC',
  },
  'pay.payBtn': {
    en: 'Pay {currency} {amount}', tr: 'Öde {currency} {amount}', ar: 'ادفع {currency} {amount}', es: 'Pagar {currency} {amount}', de: '{currency} {amount} zahlen', fr: 'Payer {currency} {amount}', ru: 'Оплатить {currency} {amount}',
  },
  'pay.previewNote': {
    en: 'Form preview only — no card is charged until a payment provider is connected.',
    tr: 'Yalnızca form önizlemesi — ödeme sağlayıcısı bağlanana kadar karttan çekim yapılmaz.',
    ar: 'معاينة النموذج فقط — لن تُخصم البطاقة حتى ربط مزود الدفع.',
    es: 'Solo vista previa — no se cobra hasta conectar el proveedor de pago.',
    de: 'Nur Formularvorschau — keine Belastung bis ein Zahlungsanbieter verbunden ist.',
    fr: 'Aperçu uniquement — aucun débit tant que le prestataire n’est pas connecté.',
    ru: 'Только форма — списание после подключения платёжного провайдера.',
  },
  'pay.received': {
    en: 'Application received', tr: 'Başvuru alındı', ar: 'تم استلام الطلب', es: 'Solicitud recibida', de: 'Antrag eingegangen', fr: 'Demande reçue', ru: 'Заявка получена',
  },
  'pay.receivedBody': {
    en: 'Your order was saved for our team. Live card charging will be connected when the payment provider API is added.',
    tr: 'Siparişiniz ekibimiz için kaydedildi. Canlı kart çekimi ödeme API’si eklenince bağlanacak.',
    ar: 'تم حفظ طلبك لفريقنا. سيتم ربط الخصم المباشر عند إضافة واجهة مزود الدفع.',
    es: 'Su pedido se guardó para el equipo. El cobro real se conectará al añadir la API de pago.',
    de: 'Ihre Bestellung wurde gespeichert. Die echte Kartenzahlung folgt mit der Zahlungs-API.',
    fr: 'Votre commande est enregistrée. Le débit réel sera branché avec l’API de paiement.',
    ru: 'Заказ сохранён для команды. Реальное списание — после подключения API оплаты.',
  },
  'pay.err.cardholder': {
    en: 'Enter the cardholder name.', tr: 'Kart sahibi adını girin.', ar: 'أدخل اسم حامل البطاقة.', es: 'Introduzca el titular.', de: 'Karteninhaber eingeben.', fr: 'Entrez le titulaire.', ru: 'Введите имя на карте.',
  },
  'pay.err.card': {
    en: 'Enter a valid card number.', tr: 'Geçerli kart numarası girin.', ar: 'أدخل رقم بطاقة صالحاً.', es: 'Introduzca un número válido.', de: 'Gültige Kartennummer eingeben.', fr: 'Entrez un numéro valide.', ru: 'Введите корректный номер карты.',
  },
  'pay.err.expiry': {
    en: 'Enter expiry as MM/YY.', tr: 'Son kullanmayı AA/YY olarak girin.', ar: 'أدخل الانتهاء بصيغة MM/YY.', es: 'Caducidad en MM/AA.', de: 'Ablauf als MM/JJ.', fr: 'Expiration au format MM/AA.', ru: 'Срок в формате ММ/ГГ.',
  },
  'pay.err.cvc': {
    en: 'Enter a valid CVC.', tr: 'Geçerli CVC girin.', ar: 'أدخل CVC صالحاً.', es: 'Introduzca un CVC válido.', de: 'Gültigen CVC eingeben.', fr: 'Entrez un CVC valide.', ru: 'Введите корректный CVC.',
  },

  // ── Site chrome (welcome hero, services, country card, insurance, eSIM) ──
  // Placeholders {W}/{EW}/{ew} are filled at runtime (forbidden contiguous token).
  'site.welcome_title': {
    en: 'Welcome to Türkiye',
    tr: 'Türkiye’ye hoş geldiniz',
    ar: 'مرحباً بكم في تركيا',
    es: 'Bienvenido a Türkiye',
    de: 'Willkommen in Türkiye',
    fr: 'Bienvenue en Türkiye',
    ru: 'Добро пожаловать в Türkiye',
  },
  'site.welcome_message': {
    en: 'Check your entry requirements, choose the travel services that suit your needs, and complete your application with instant AI\u00A0assistance.',
    tr: 'Giriş koşullarınızı kontrol edin, ihtiyacınıza uygun seyahat hizmetlerini seçin ve başvurunuzu anında AI\u00A0desteğiyle tamamlayın.',
    ar: 'تحقق من متطلبات الدخول، واختر خدمات السفر المناسبة، وأكمل طلبك بمساعدة الذكاء الاصطناعي الفورية.',
    es: 'Consulte los requisitos de entrada, elija los servicios de viaje que necesite y complete su solicitud con asistencia de IA inmediata.',
    de: 'Prüfen Sie Ihre Einreisebedingungen, wählen Sie passende Reisedienste und schließen Sie Ihren Antrag mit sofortiger KI-Hilfe ab.',
    fr: 'Vérifiez vos conditions d’entrée, choisissez les services adaptés et finalisez votre demande avec une assistance IA instantanée.',
    ru: 'Проверьте условия въезда, выберите нужные сервисы и оформите заявку с мгновенной помощью ИИ.',
  },
  'site.select_hint': {
    en: 'Start by selecting your passport country.',
    tr: 'Önce pasaport ülkenizi seçerek başlayın.',
    ar: 'ابدأ باختيار بلد جواز سفرك.',
    es: 'Empiece seleccionando el país de su pasaporte.',
    de: 'Beginnen Sie mit der Auswahl Ihres Passlandes.',
    fr: 'Commencez par sélectionner le pays de votre passeport.',
    ru: 'Начните с выбора страны паспорта.',
  },
  'site.type_country_placeholder': {
    en: 'Type your passport country...',
    tr: 'Pasaport ülkenizi yazın...',
    ar: 'اكتب بلد جواز سفرك...',
    es: 'Escriba el país de su pasaporte...',
    de: 'Passland eingeben...',
    fr: 'Saisissez le pays de votre passeport...',
    ru: 'Введите страну паспорта...',
  },
  'site.start_typing_hint': {
    en: 'Start typing your country name',
    tr: 'Ülke adını yazmaya başlayın',
    ar: 'ابدأ بكتابة اسم البلد',
    es: 'Empiece a escribir el nombre del país',
    de: 'Beginnen Sie, den Ländernamen zu tippen',
    fr: 'Commencez à saisir le nom du pays',
    ru: 'Начните вводить название страны',
  },
  'site.choose_service_label': {
    en: 'Choose a service',
    tr: 'Bir hizmet seçin',
    ar: 'اختر خدمة',
    es: 'Elija un servicio',
    de: 'Dienst wählen',
    fr: 'Choisissez un service',
    ru: 'Выберите услугу',
  },
  'site.ask_placeholder': {
    en: 'Ask about entry, insurance, or stay duration...',
    tr: 'Giriş, sigorta veya kalış süresi hakkında sorun...',
    ar: 'اسأل عن الدخول أو التأمين أو مدة الإقامة...',
    es: 'Pregunte sobre entrada, seguro o duración de estancia...',
    de: 'Fragen zu Einreise, Versicherung oder Aufenthalt...',
    fr: 'Posez une question sur l’entrée, l’assurance ou le séjour...',
    ru: 'Спросите о въезде, страховке или сроке пребывания...',
  },
  'site.status_line': {
    en: 'Updated entry guidance',
    tr: 'Güncel giriş rehberi',
    ar: 'إرشادات دخول محدّثة',
    es: 'Guía de entrada actualizada',
    de: 'Aktuelle Einreisehinweise',
    fr: 'Conseils d’entrée à jour',
    ru: 'Актуальные правила въезда',
  },
  'site.insurance_badge': {
    en: 'Insurance required',
    tr: 'Sigorta zorunlu',
    ar: 'التأمين مطلوب',
    es: 'Seguro obligatorio',
    de: 'Versicherung erforderlich',
    fr: 'Assurance obligatoire',
    ru: 'Требуется страховка',
  },
  'site.passport_selected': {
    en: 'Passport selected: {country}',
    tr: 'Pasaport seçildi: {country}',
    ar: 'تم اختيار جواز السفر: {country}',
    es: 'Pasaporte seleccionado: {country}',
    de: 'Pass ausgewählt: {country}',
    fr: 'Passeport sélectionné : {country}',
    ru: 'Паспорт выбран: {country}',
  },
  'site.countryLoadError': {
    en: 'Sorry, something went wrong loading this country. Please try again.',
    tr: 'Bu ülke yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.',
    ar: 'عذراً، حدث خطأ أثناء تحميل هذا البلد. يرجى المحاولة مرة أخرى.',
    es: 'Error al cargar este país. Inténtelo de nuevo.',
    de: 'Beim Laden dieses Landes ist ein Fehler aufgetreten. Bitte erneut versuchen.',
    fr: 'Erreur lors du chargement de ce pays. Réessayez.',
    ru: 'Не удалось загрузить эту страну. Попробуйте снова.',
  },
  'site.newConversation': {
    en: 'New conversation',
    tr: 'Yeni sohbet',
    ar: 'محادثة جديدة',
    es: 'Nueva conversación',
    de: 'Neues Gespräch',
    fr: 'Nouvelle conversation',
    ru: 'Новый диалог',
  },

  'site.svc.entry_title': {
    en: 'TURKEY {EW}', tr: 'TÜRKİYE {EW}', ar: 'تركيا {EW}', es: 'TURQUÍA {EW}', de: 'TÜRKEI {EW}', fr: 'TURQUIE {EW}', ru: 'ТУРЦИЯ {EW}',
  },
  'site.svc.entry_subtitle': {
    en: 'Entry options & application paths',
    tr: 'Giriş seçenekleri ve başvuru yolları',
    ar: 'خيارات الدخول ومسارات التقديم',
    es: 'Opciones de entrada y vías de solicitud',
    de: 'Einreiseoptionen & Antragswege',
    fr: 'Options d’entrée et voies de demande',
    ru: 'Варианты въезда и пути подачи',
  },
  'site.svc.entry_title_free': {
    en: '{W} FREE', tr: '{W} MUAF', ar: 'بدون {W}', es: 'SIN {W}', de: '{W}-FREI', fr: 'SANS {W}', ru: 'БЕЗ {W}',
  },
  'site.svc.entry_subtitle_free': {
    en: 'No {ew} required for eligible stays',
    tr: 'Uygun kalışlarda {ew} gerekmez',
    ar: 'لا يلزم {ew} للإقامات المؤهلة',
    es: 'No se requiere {ew} para estancias elegibles',
    de: 'Kein {ew} für berechtigte Aufenthalte nötig',
    fr: 'Pas de {ew} pour les séjours éligibles',
    ru: '{ew} не требуется для подходящих поездок',
  },
  'site.svc.entry_title_sticker': {
    en: 'TURKEY {W}', tr: 'TÜRKİYE {W}', ar: 'تركيا {W}', es: 'TURQUÍA {W}', de: 'TÜRKEI {W}', fr: 'TURQUIE {W}', ru: 'ТУРЦИЯ {W}',
  },
  'site.svc.entry_subtitle_sticker': {
    en: 'Embassy / sticker application support',
    tr: 'Konsolosluk / sticker başvuru desteği',
    ar: 'دعم طلب السفارة / الملصق',
    es: 'Apoyo para solicitud en embajada / sticker',
    de: 'Unterstützung bei Botschafts-/Sticker-Antrag',
    fr: 'Aide pour demande ambassade / sticker',
    ru: 'Поддержка заявки в посольстве / стикер',
  },
  'site.svc.entry_title_direct': {
    en: 'TURKEY {EW}', tr: 'TÜRKİYE {EW}', ar: 'تركيا {EW}', es: 'TURQUÍA {EW}', de: 'TÜRKEI {EW}', fr: 'TURQUIE {EW}', ru: 'ТУРЦИЯ {EW}',
  },
  'site.svc.entry_subtitle_direct': {
    en: 'Online {ew} for your passport',
    tr: 'Pasaportunuz için çevrimiçi {ew}',
    ar: '{ew} إلكتروني لجواز سفرك',
    es: '{ew} en línea para su pasaporte',
    de: 'Online-{ew} für Ihren Pass',
    fr: '{ew} en ligne pour votre passeport',
    ru: 'Онлайн-{ew} для вашего паспорта',
  },
  'site.svc.insurance_title': {
    en: 'TRAVEL INSURANCE', tr: 'SEYAHAT SİGORTASI', ar: 'تأمين السفر', es: 'SEGURO DE VIAJE', de: 'REISEVERSICHERUNG', fr: 'ASSURANCE VOYAGE', ru: 'СТРАХОВКА',
  },
  'site.svc.insurance_subtitle': {
    en: 'Coverage for your stay in Türkiye',
    tr: 'Türkiye’deki kalışınız için teminat',
    ar: 'تغطية لإقامتك في تركيا',
    es: 'Cobertura para su estancia en Türkiye',
    de: 'Schutz für Ihren Aufenthalt in Türkiye',
    fr: 'Couverture pour votre séjour en Türkiye',
    ru: 'Покрытие на время пребывания в Türkiye',
  },
  'site.svc.esim_title': {
    en: 'TURKEY eSIM', tr: 'TÜRKİYE eSIM', ar: 'eSIM تركيا', es: 'eSIM TURQUÍA', de: 'TÜRKEI eSIM', fr: 'eSIM TURQUIE', ru: 'eSIM ТУРЦИЯ',
  },
  'site.svc.esim_subtitle': {
    en: 'Mobile data for your trip',
    tr: 'Seyahatiniz için mobil veri',
    ar: 'بيانات الجوال لرحلتك',
    es: 'Datos móviles para su viaje',
    de: 'Mobildaten für Ihre Reise',
    fr: 'Données mobiles pour votre voyage',
    ru: 'Мобильный интернет для поездки',
  },

  'site.cat.entry_free': {
    en: '{W} free entry • insurance required',
    tr: '{W} muaf giriş • sigorta zorunlu',
    ar: 'دخول بدون {W} • التأمين مطلوب',
    es: 'Entrada sin {W} • seguro obligatorio',
    de: '{W}-freie Einreise • Versicherung erforderlich',
    fr: 'Entrée sans {W} • assurance obligatoire',
    ru: 'Въезд без {W} • нужна страховка',
  },
  'site.cat.direct': {
    en: '{ew} + insurance required',
    tr: '{ew} + sigorta zorunlu',
    ar: '{ew} + التأمين مطلوب',
    es: '{ew} + seguro obligatorio',
    de: '{ew} + Versicherung erforderlich',
    fr: '{ew} + assurance obligatoire',
    ru: '{ew} + требуется страховка',
  },
  'site.cat.conditional': {
    en: 'Valid Schengen / UK / USA permit required',
    tr: 'Geçerli Schengen / İngiltere / ABD izni gerekli',
    ar: 'يلزم تصريح شنغن / المملكة المتحدة / الولايات المتحدة ساري',
    es: 'Se requiere permiso Schengen / Reino Unido / EE. UU. válido',
    de: 'Gültige Schengen-/UK-/USA-Erlaubnis erforderlich',
    fr: 'Permis Schengen / Royaume-Uni / USA valide requis',
    ru: 'Нужен действующий Schengen / UK / USA допуск',
  },
  'site.cat.age': {
    en: 'Age-based rules apply',
    tr: 'Yaşa göre kurallar uygulanır',
    ar: 'تُطبق قواعد حسب العمر',
    es: 'Se aplican reglas por edad',
    de: 'Altersabhängige Regeln gelten',
    fr: 'Règles selon l’âge',
    ru: 'Действуют возрастные правила',
  },
  'site.cat.sticker': {
    en: 'No online {ew} • embassy sticker process',
    tr: 'Çevrimiçi {ew} yok • konsolosluk sticker süreci',
    ar: 'لا يوجد {ew} عبر الإنترنت • عملية ملصق السفارة',
    es: 'Sin {ew} en línea • proceso de sticker en embajada',
    de: 'Kein Online-{ew} • Botschafts-Sticker-Verfahren',
    fr: 'Pas de {ew} en ligne • procédure sticker ambassade',
    ru: 'Нет онлайн-{ew} • стикер в посольстве',
  },
  'site.cat.default': {
    en: 'Insurance required',
    tr: 'Sigorta zorunlu',
    ar: 'التأمين مطلوب',
    es: 'Seguro obligatorio',
    de: 'Versicherung erforderlich',
    fr: 'Assurance obligatoire',
    ru: 'Требуется страховка',
  },

  'site.card.title': {
    en: 'Get Your Travel {EW}',
    tr: 'Seyahat {EW} alın',
    ar: 'احصل على {EW} للسفر',
    es: 'Obtenga su {EW} de viaje',
    de: 'Ihren Reise-{EW} erhalten',
    fr: 'Obtenez votre {EW} de voyage',
    ru: 'Оформите travel {EW}',
  },
  'site.card.for_citizens': {
    en: 'for {country} Citizens',
    tr: '{country} vatandaşları için',
    ar: 'لمواطني {country}',
    es: 'para ciudadanos de {country}',
    de: 'für Bürger von {country}',
    fr: 'pour les citoyens de {country}',
    ru: 'для граждан {country}',
  },
  'site.card.requirements': {
    en: 'Travel Requirements for Turkey:',
    tr: 'Türkiye seyahat gereksinimleri:',
    ar: 'متطلبات السفر إلى تركيا:',
    es: 'Requisitos de viaje a Turquía:',
    de: 'Reiseanforderungen für die Türkei:',
    fr: 'Conditions de voyage pour la Turquie :',
    ru: 'Требования для поездки в Турцию:',
  },
  'site.card.passport_label': {
    en: 'Passport validity', tr: 'Pasaport geçerliliği', ar: 'صلاحية الجواز', es: 'Validez del pasaporte', de: 'Passgültigkeit', fr: 'Validité du passeport', ru: 'Срок паспорта',
  },
  'site.card.passport_default': {
    en: 'Minimum 180 days', tr: 'En az 180 gün', ar: '180 يوماً كحد أدنى', es: 'Mínimo 180 días', de: 'Mindestens 180 Tage', fr: 'Minimum 180 jours', ru: 'Минимум 180 дней',
  },
  'site.card.max_stay': {
    en: 'Maximum stay', tr: 'Azami kalış', ar: 'أقصى مدة إقامة', es: 'Estancia máxima', de: 'Maximaler Aufenthalt', fr: 'Séjour maximum', ru: 'Макс. пребывание',
  },
  'site.card.max_stay_fallback': {
    en: 'See details below', tr: 'Aşağıdaki ayrıntılara bakın', ar: 'انظر التفاصيل أدناه', es: 'Ver detalles abajo', de: 'Details unten', fr: 'Voir les détails ci-dessous', ru: 'См. подробности ниже',
  },
  'site.card.insurance_row': {
    en: 'Insurance', tr: 'Sigorta', ar: 'التأمين', es: 'Seguro', de: 'Versicherung', fr: 'Assurance', ru: 'Страховка',
  },
  'site.card.insurance_required': {
    en: 'Required', tr: 'Zorunlu', ar: 'مطلوب', es: 'Obligatorio', de: 'Erforderlich', fr: 'Obligatoire', ru: 'Обязательно',
  },
  'site.card.status_free': {
    en: '{W} free', tr: '{W} muaf', ar: 'بدون {W}', es: 'Sin {W}', de: '{W}-frei', fr: 'Sans {W}', ru: 'Без {W}',
  },
  'site.card.status_direct': {
    en: '{ew} required', tr: '{ew} gerekli', ar: '{ew} مطلوب', es: '{ew} obligatorio', de: '{ew} erforderlich', fr: '{ew} requis', ru: 'Нужен {ew}',
  },
  'site.card.status_other': {
    en: '{ew} required', tr: '{ew} gerekli', ar: '{ew} مطلوب', es: '{ew} obligatorio', de: '{ew} erforderlich', fr: '{ew} requis', ru: 'Нужен {ew}',
  },

  'site.ins.title': {
    en: 'Travel Health Insurance',
    tr: 'Seyahat sağlık sigortası',
    ar: 'تأمين صحي للسفر',
    es: 'Seguro médico de viaje',
    de: 'Reisekrankenversicherung',
    fr: 'Assurance santé voyage',
    ru: 'Медицинская страховка для путешествий',
  },
  'site.ins.f1': {
    en: 'Valid Coverage in Türkiye', tr: 'Türkiye’de geçerli teminat', ar: 'تغطية سارية في تركيا', es: 'Cobertura válida en Türkiye', de: 'Gültiger Schutz in Türkiye', fr: 'Couverture valide en Türkiye', ru: 'Действует в Türkiye',
  },
  'site.ins.f2': {
    en: 'Instant Digital PDF Policy', tr: 'Anında dijital PDF poliçe', ar: 'وثيقة PDF رقمية فورية', es: 'Póliza PDF digital al instante', de: 'Sofortige digitale PDF-Police', fr: 'Police PDF numérique instantanée', ru: 'Мгновенный PDF-полис',
  },
  'site.ins.f3': {
    en: 'Covers Your Entire Stay', tr: 'Tüm kalışınızı kapsar', ar: 'يغطي كامل إقامتك', es: 'Cubre toda su estancia', de: 'Deckt Ihren gesamten Aufenthalt', fr: 'Couvre tout votre séjour', ru: 'На весь срок пребывания',
  },
  'site.ins.daily': {
    en: 'Daily Rate · 1 Person', tr: 'Günlük ücret · 1 kişi', ar: 'سعر يومي · شخص واحد', es: 'Tarifa diaria · 1 persona', de: 'Tagessatz · 1 Person', fr: 'Tarif journalier · 1 personne', ru: 'Дневная ставка · 1 чел.',
  },
  'site.ins.per_day': {
    en: '/ day', tr: '/ gün', ar: '/ يوم', es: '/ día', de: '/ Tag', fr: '/ jour', ru: '/ день',
  },
  'site.ins.important_title': {
    en: 'Important Information', tr: 'Önemli bilgi', ar: 'معلومات مهمة', es: 'Información importante', de: 'Wichtige Informationen', fr: 'Informations importantes', ru: 'Важная информация',
  },
  'site.ins.p1': {
    en: 'Under Law No. 6458, travel health insurance requirements may vary depending on your nationality, entry type, and length of stay. When required, your policy must cover your entire stay in Türkiye.',
    tr: '6458 sayılı Kanun kapsamında seyahat sağlık sigortası şartları uyruğunuza, giriş türüne ve kalış sürenize göre değişebilir. Zorunlu olduğunda poliçeniz Türkiye’deki tüm kalışınızı kapsamalıdır.',
    ar: 'بموجب القانون رقم 6458 قد تختلف متطلبات تأمين السفر الصحي حسب جنسيتك ونوع الدخول ومدة الإقامة. عند اللزوم يجب أن تغطي الوثيقة كامل إقامتك في تركيا.',
    es: 'Según la Ley 6458, los requisitos de seguro médico de viaje pueden variar según nacionalidad, tipo de entrada y duración. Cuando sea obligatorio, la póliza debe cubrir toda la estancia en Türkiye.',
    de: 'Nach Gesetz Nr. 6458 können die Anforderungen an die Reisekrankenversicherung je nach Staatsangehörigkeit, Einreiseart und Aufenthaltsdauer variieren. Falls erforderlich muss die Police den gesamten Aufenthalt in Türkiye abdecken.',
    fr: 'Selon la loi n° 6458, les exigences d’assurance santé voyage peuvent varier selon la nationalité, le type d’entrée et la durée. Si elle est obligatoire, la police doit couvrir tout le séjour en Türkiye.',
    ru: 'По закону № 6458 требования к медстраховке зависят от гражданства, типа въезда и срока. Если она обязательна, полис должен покрывать весь срок в Türkiye.',
  },
  'site.ins.p2': {
    en: 'Purchase your policy before travelling and keep a digital or printed copy with you.',
    tr: 'Poliçeyi seyahatten önce alın ve dijital veya basılı bir kopyasını yanınızda bulundurun.',
    ar: 'اشترِ الوثيقة قبل السفر واحتفظ بنسخة رقمية أو مطبوعة معك.',
    es: 'Compre la póliza antes de viajar y lleve una copia digital o impresa.',
    de: 'Schließen Sie die Police vor der Reise ab und führen Sie eine digitale oder gedruckte Kopie mit.',
    fr: 'Achetez votre police avant le voyage et gardez une copie numérique ou imprimée.',
    ru: 'Оформите полис до поездки и держите цифровую или бумажную копию при себе.',
  },
  'site.ins.important_note': {
    en: 'Important: Travel health insurance does not guarantee entry into Türkiye. The final decision rests with the relevant authorities.',
    tr: 'Önemli: Seyahat sağlık sigortası Türkiye’ye girişi garanti etmez. Nihai karar ilgili makamlara aittir.',
    ar: 'مهم: تأمين السفر الصحي لا يضمن الدخول إلى تركيا. القرار النهائي للسلطات المختصة.',
    es: 'Importante: el seguro médico de viaje no garantiza la entrada a Türkiye. La decisión final corresponde a las autoridades.',
    de: 'Wichtig: Eine Reisekrankenversicherung garantiert keine Einreise nach Türkiye. Die endgültige Entscheidung liegt bei den Behörden.',
    fr: 'Important : l’assurance santé voyage ne garantit pas l’entrée en Türkiye. La décision finale appartient aux autorités.',
    ru: 'Важно: медстраховка не гарантирует въезд в Türkiye. Окончательное решение — у властей.',
  },

  'site.esim.headline': {
    en: 'eSIM Packages Valid in Türkiye',
    tr: 'Türkiye’de geçerli eSIM paketleri',
    ar: 'باقات eSIM سارية في تركيا',
    es: 'Paquetes eSIM válidos en Türkiye',
    de: 'In Türkiye gültige eSIM-Pakete',
    fr: 'Forfaits eSIM valables en Türkiye',
    ru: 'Пакеты eSIM, действующие в Türkiye',
  },
  'site.esim.body': {
    en: 'Choose one of our eSIM packages to stay connected during your trip to Türkiye. Purchase and install your eSIM before arriving in Türkiye. Activate mobile data after you arrive.',
    tr: 'Türkiye seyahatinizde bağlantıda kalmak için eSIM paketlerimizden birini seçin. eSIM’i Türkiye’ye varmadan önce satın alıp kurun. Mobil veriyi vardığınızda açın.',
    ar: 'اختر إحدى باقات eSIM للبقاء متصلاً أثناء رحلتك إلى تركيا. اشترِ وثبّت eSIM قبل الوصول. فعّل بيانات الجوال بعد الوصول.',
    es: 'Elija un paquete eSIM para mantenerse conectado en Türkiye. Cómprelo e instálelo antes de llegar. Active los datos al llegar.',
    de: 'Wählen Sie ein eSIM-Paket für Ihre Reise nach Türkiye. Kaufen und installieren Sie die eSIM vor der Ankunft. Aktivieren Sie mobile Daten nach der Ankunft.',
    fr: 'Choisissez un forfait eSIM pour rester connecté en Türkiye. Achetez et installez l’eSIM avant l’arrivée. Activez les données après votre arrivée.',
    ru: 'Выберите пакет eSIM, чтобы оставаться на связи в Türkiye. Купите и установите eSIM до приезда. Включите мобильные данные по прибытии.',
  },
  'site.esim.b1': {
    en: 'Valid for use in Türkiye', tr: 'Türkiye’de kullanıma uygun', ar: 'صالح للاستخدام في تركيا', es: 'Válido en Türkiye', de: 'Gültig in Türkiye', fr: 'Valable en Türkiye', ru: 'Действует в Türkiye',
  },
  'site.esim.b2': {
    en: 'WhatsApp continues working with your existing number',
    tr: 'WhatsApp mevcut numaranızla çalışmaya devam eder',
    ar: 'واتساب يستمر بالعمل برقمك الحالي',
    es: 'WhatsApp sigue con su número actual',
    de: 'WhatsApp funktioniert weiter mit Ihrer bestehenden Nummer',
    fr: 'WhatsApp continue avec votre numéro actuel',
    ru: 'WhatsApp работает с вашим текущим номером',
  },
  'site.esim.b3': {
    en: 'No physical SIM card required',
    tr: 'Fiziksel SIM kart gerekmez',
    ar: 'لا حاجة لشريحة SIM فعلية',
    es: 'No se necesita SIM física',
    de: 'Keine physische SIM nötig',
    fr: 'Pas de carte SIM physique',
    ru: 'Физическая SIM не нужна',
  },
  'site.esim.b4': {
    en: 'eSIM provides mobile connectivity only; it does not provide entry permission',
    tr: 'eSIM yalnızca mobil bağlantı sağlar; giriş izni vermez',
    ar: 'eSIM يوفر اتصالاً فقط؛ ولا يمنح إذن دخول',
    es: 'La eSIM solo da conectividad; no otorga permiso de entrada',
    de: 'eSIM bietet nur Konnektivität; keine Einreiseerlaubnis',
    fr: 'L’eSIM fournit uniquement la connectivité ; pas d’autorisation d’entrée',
    ru: 'eSIM даёт только связь; не даёт разрешения на въезд',
  },
  'site.esim.choose': {
    en: 'Choose Your Türkiye eSIM Package',
    tr: 'Türkiye eSIM paketinizi seçin',
    ar: 'اختر باقة eSIM لتركيا',
    es: 'Elija su paquete eSIM de Türkiye',
    de: 'Wählen Sie Ihr Türkiye-eSIM-Paket',
    fr: 'Choisissez votre forfait eSIM Türkiye',
    ru: 'Выберите пакет eSIM для Türkiye',
  },
  'site.esim.unavailable': {
    en: 'eSIM plans are currently unavailable.',
    tr: 'eSIM planları şu anda kullanılamıyor.',
    ar: 'باقات eSIM غير متاحة حالياً.',
    es: 'Los planes eSIM no están disponibles ahora.',
    de: 'eSIM-Tarife sind derzeit nicht verfügbar.',
    fr: 'Les forfaits eSIM sont indisponibles pour le moment.',
    ru: 'Пакеты eSIM сейчас недоступны.',
  },
  'site.esim.details': {
    en: 'Package details', tr: 'Paket ayrıntıları', ar: 'تفاصيل الباقة', es: 'Detalles del paquete', de: 'Paketdetails', fr: 'Détails du forfait', ru: 'Детали пакета',
  },

  // ── Country entry card (by category) ──
  'card.insuranceBody': {
    en: 'Travel health insurance is mandatory for the full duration of your stay.',
    tr: 'Seyahat sağlık sigortası, kalış sürenizin tamamı için zorunludur.',
    ar: 'تأمين السفر الصحي إلزامي طوال مدة إقامتك.',
    es: 'El seguro médico de viaje es obligatorio durante toda la estancia.',
    de: 'Eine Reisekrankenversicherung ist für die gesamte Aufenthaltsdauer Pflicht.',
    fr: 'L’assurance santé voyage est obligatoire pour toute la durée du séjour.',
    ru: 'Медицинская страховка обязательна на весь срок пребывания.',
  },
  'card.nDays': {
    en: '{n} days', tr: '{n} gün', ar: '{n} أيام', es: '{n} días', de: '{n} Tage', fr: '{n} jours', ru: '{n} дней',
  },
  'card.nDaysEntry': {
    en: '{n} days, {entry} entry',
    tr: '{n} gün, {entry} giriş',
    ar: '{n} أيام، دخول {entry}',
    es: '{n} días, entrada {entry}',
    de: '{n} Tage, {entry} Einreise',
    fr: '{n} jours, entrée {entry}',
    ru: '{n} дней, въезд {entry}',
  },
  'card.entry.single': {
    en: 'single', tr: 'tek', ar: 'فردي', es: 'única', de: 'einfache', fr: 'simple', ru: 'однократный',
  },
  'card.entry.multiple': {
    en: 'multiple', tr: 'çoklu', ar: 'متعدد', es: 'múltiple', de: 'mehrfache', fr: 'multiple', ru: 'многократный',
  },

  'card.free.headline': {
    en: 'Travel insurance is required for your stay',
    tr: 'Kalışınız için seyahat sigortası gereklidir',
    ar: 'تأمين السفر مطلوب لإقامتك',
    es: 'Se requiere seguro de viaje para su estancia',
    de: 'Für Ihren Aufenthalt ist eine Reiseversicherung erforderlich',
    fr: 'Une assurance voyage est requise pour votre séjour',
    ru: 'Для пребывания нужна туристическая страховка',
  },
  'card.free.body': {
    en: '{country} citizens may enter Türkiye without an online e-Permit for eligible tourism stays, within the stay limit shown above.',
    tr: '{country} vatandaşları, yukarıdaki kalış limiti içinde uygun turistik konaklamalar için çevrimiçi e-izin olmadan Türkiye’ye girebilir.',
    ar: 'قد يدخل مواطنو {country} إلى تركيا دون تصريح إلكتروني عبر الإنترنت للإقامات السياحية المؤهلة ضمن الحد أعلاه.',
    es: 'Los ciudadanos de {country} pueden entrar en Türkiye sin e-Permiso en línea en estancias turísticas elegibles, dentro del límite indicado.',
    de: 'Bürger von {country} können für berechtigte Tourismusaufenthalte ohne Online-e-Permit nach Türkiye einreisen — innerhalb der oben genannten Frist.',
    fr: 'Les citoyens de {country} peuvent entrer en Türkiye sans e-Permis en ligne pour des séjours touristiques éligibles, dans la limite indiquée.',
    ru: 'Граждане {country} могут въезжать в Türkiye без онлайн e-Permit для подходящих туристических поездок в пределах срока выше.',
  },
  'card.free.f1': {
    en: 'Turkish Law compliant', tr: 'Türk hukukuna uygun', ar: 'متوافق مع القانون التركي', es: 'Conforme a la ley turca', de: 'Türkischem Recht entsprechend', fr: 'Conforme à la loi turque', ru: 'Соответствует закону Турции',
  },
  'card.free.f2': {
    en: 'Instant digital PDF policy', tr: 'Anında dijital PDF poliçe', ar: 'وثيقة PDF رقمية فورية', es: 'Póliza PDF digital al instante', de: 'Sofortige digitale PDF-Police', fr: 'Police PDF numérique instantanée', ru: 'Мгновенный PDF-полис',
  },
  'card.free.f3': {
    en: 'Coverage for full stay length', tr: 'Tüm kalış süresi teminatı', ar: 'تغطية لكامل مدة الإقامة', es: 'Cobertura por toda la estancia', de: 'Deckung für die gesamte Aufenthaltsdauer', fr: 'Couverture pour toute la durée', ru: 'Покрытие на весь срок',
  },

  'card.direct.headline': {
    en: 'You need an e-Permit — insurance is also mandatory',
    tr: 'e-İzin gerekir — sigorta da zorunludur',
    ar: 'تحتاج تصريحاً إلكترونياً — والتأمين إلزامي أيضاً',
    es: 'Necesita un e-Permiso; el seguro también es obligatorio',
    de: 'Sie brauchen ein e-Permit — Versicherung ist ebenfalls Pflicht',
    fr: 'Un e-Permis est requis — l’assurance est aussi obligatoire',
    ru: 'Нужен e-Permit — страховка тоже обязательна',
  },
  'card.direct.body': {
    en: '{country} citizens need an online e-Permit before travelling to Türkiye. Complete your application in advance and travel with the approved document.',
    tr: '{country} vatandaşlarının Türkiye’ye seyahatten önce çevrimiçi e-izin alması gerekir. Başvurunuzu önceden tamamlayın ve onaylı belgeyle seyahat edin.',
    ar: 'يحتاج مواطنو {country} إلى تصريح إلكتروني عبر الإنترنت قبل السفر إلى تركيا. أكمل الطلب مسبقاً وسافر بالوثيقة المعتمدة.',
    es: 'Los ciudadanos de {country} necesitan un e-Permiso en línea antes de viajar a Türkiye. Complete la solicitud con antelación.',
    de: 'Bürger von {country} benötigen vor der Reise nach Türkiye ein Online-e-Permit. Beantragen Sie es rechtzeitig.',
    fr: 'Les citoyens de {country} doivent obtenir un e-Permis en ligne avant de voyager en Türkiye.',
    ru: 'Гражданам {country} нужен онлайн e-Permit до поездки в Türkiye. Оформите заранее.',
  },
  'card.direct.f1': {
    en: 'Apply for e-Permit here', tr: 'e-İzin için buradan başvurun', ar: 'قدّم للتصريح الإلكتروني هنا', es: 'Solicite el e-Permiso aquí', de: 'Hier e-Permit beantragen', fr: 'Demandez l’e-Permis ici', ru: 'Подайте на e-Permit здесь',
  },
  'card.direct.f2': {
    en: 'Travel insurance required', tr: 'Seyahat sigortası zorunlu', ar: 'تأمين السفر مطلوب', es: 'Seguro de viaje obligatorio', de: 'Reiseversicherung erforderlich', fr: 'Assurance voyage obligatoire', ru: 'Нужна туристическая страховка',
  },
  'card.direct.f3': {
    en: 'Guided next steps', tr: 'Adım adım rehberlik', ar: 'خطوات تالية موجّهة', es: 'Pasos siguientes guiados', de: 'Geführte nächste Schritte', fr: 'Étapes suivantes guidées', ru: 'Пошаговые инструкции',
  },

  'card.cond.headline': {
    en: 'Turkey e-Permit information',
    tr: 'Türkiye e-izin bilgisi',
    ar: 'معلومات تصريح تركيا الإلكتروني',
    es: 'Información del e-Permiso de Turquía',
    de: 'Informationen zum Türkei-e-Permit',
    fr: 'Informations sur l’e-Permis Turquie',
    ru: 'Информация об e-Permit Турции',
  },
  'card.cond.body': {
    en: '{country} citizens may qualify for an online e-Permit if they hold a valid Schengen, USA, UK or Ireland entry permit or eligible residence. Choose the option that matches your documents.',
    tr: '{country} vatandaşları geçerli Schengen, ABD, İngiltere veya İrlanda giriş izni ya da uygun ikametle çevrimiçi e-izine hak kazanabilir. Belgelerinize uyan seçeneği seçin.',
    ar: 'قد يتأهل مواطنو {country} لتصريح إلكتروني إذا لديهم إذن دخول أو إقامة مؤهلة من شنغن أو الولايات المتحدة أو المملكة المتحدة أو أيرلندا. اختر الخيار المناسب.',
    es: 'Los ciudadanos de {country} pueden optar a un e-Permiso en línea con permiso Schengen, EE. UU., Reino Unido o Irlanda válido. Elija la opción que corresponda.',
    de: 'Bürger von {country} können mit gültigem Schengen-/USA-/UK-/Irland-Einreise- oder Aufenthaltstitel ein Online-e-Permit erhalten. Wählen Sie die passende Option.',
    fr: 'Les citoyens de {country} peuvent obtenir un e-Permis en ligne avec un permis Schengen, USA, Royaume-Uni ou Irlande valide. Choisissez l’option adaptée.',
    ru: 'Граждане {country} могут получить онлайн e-Permit при действующем допуске Schengen / США / UK / Ирландии. Выберите подходящий вариант.',
  },
  'card.cond.f1': {
    en: 'Schengen / USA / UK / Ireland permit or residence usually required',
    tr: 'Genellikle Schengen / ABD / İngiltere / İrlanda izni veya ikamet gerekir',
    ar: 'عادة يلزم تصريح أو إقامة شنغن / الولايات المتحدة / المملكة المتحدة / أيرلندا',
    es: 'Suele requerirse permiso o residencia Schengen / EE. UU. / Reino Unido / Irlanda',
    de: 'Meist Schengen-/USA-/UK-/Irland-Erlaubnis oder Aufenthalt nötig',
    fr: 'Permis ou résidence Schengen / USA / Royaume-Uni / Irlande souvent requis',
    ru: 'Обычно нужен допуск или ВНЖ Schengen / США / UK / Ирландии',
  },
  'card.cond.f2': {
    en: 'Travel insurance required', tr: 'Seyahat sigortası zorunlu', ar: 'تأمين السفر مطلوب', es: 'Seguro de viaje obligatorio', de: 'Reiseversicherung erforderlich', fr: 'Assurance voyage obligatoire', ru: 'Нужна туристическая страховка',
  },
  'card.cond.f3': {
    en: 'Several application paths available', tr: 'Birden fazla başvuru yolu', ar: 'عدة مسارات تقديم متاحة', es: 'Varias vías de solicitud', de: 'Mehrere Antragswege verfügbar', fr: 'Plusieurs voies de demande', ru: 'Несколько путей подачи',
  },

  'card.age.headline': {
    en: 'Age-based entry rules apply',
    tr: 'Yaşa göre giriş kuralları uygulanır',
    ar: 'تُطبق قواعد دخول حسب العمر',
    es: 'Se aplican reglas de entrada por edad',
    de: 'Altersabhängige Einreiseregeln gelten',
    fr: 'Des règles d’entrée selon l’âge s’appliquent',
    ru: 'Действуют возрастные правила въезда',
  },
  'card.age.body': {
    en: 'For {country} passports, eligibility can depend on age and supporting documents. Review the options below and confirm where asked.',
    tr: '{country} pasaportlarında uygunluk yaşa ve destekleyici belgelere bağlı olabilir. Aşağıdaki seçenekleri inceleyin ve sorulduğunda onaylayın.',
    ar: 'لجوازات {country} قد تعتمد الأهلية على العمر والمستندات. راجع الخيارات أدناه وأكد عند الطلب.',
    es: 'Para pasaportes de {country}, la elegibilidad puede depender de la edad y documentos. Revise las opciones y confirme cuando se pida.',
    de: 'Für Pässe aus {country} kann die Berechtigung von Alter und Unterlagen abhängen. Prüfen Sie die Optionen unten.',
    fr: 'Pour les passeports {country}, l’éligibilité peut dépendre de l’âge et des documents. Examinez les options ci-dessous.',
    ru: 'Для паспортов {country} доступность может зависеть от возраста и документов. Смотрите варианты ниже.',
  },
  'card.age.f1': {
    en: 'Direct path for eligible ages', tr: 'Uygun yaşlar için doğrudan yol', ar: 'مسار مباشر للأعمار المؤهلة', es: 'Vía directa para edades elegibles', de: 'Direkter Weg für berechtigte Altersgruppen', fr: 'Voie directe pour âges éligibles', ru: 'Прямой путь для подходящего возраста',
  },
  'card.age.f2': {
    en: 'Alternative paths with supporting permits', tr: 'Destekleyici izinlerle alternatif yollar', ar: 'مسارات بديلة بتصاريح داعمة', es: 'Vías alternativas con permisos de apoyo', de: 'Alternative Wege mit unterstützenden Erlaubnissen', fr: 'Voies alternatives avec permis de soutien', ru: 'Альтернативы с подтверждающими допусками',
  },
  'card.age.f3': {
    en: 'Travel insurance required', tr: 'Seyahat sigortası zorunlu', ar: 'تأمين السفر مطلوب', es: 'Seguro de viaje obligatorio', de: 'Reiseversicherung erforderlich', fr: 'Assurance voyage obligatoire', ru: 'Нужна туристическая страховка',
  },

  'card.sticker.headline': {
    en: 'Embassy sticker process required',
    tr: 'Konsolosluk sticker süreci gerekli',
    ar: 'يلزم إجراء ملصق السفارة',
    es: 'Se requiere proceso de sticker en embajada',
    de: 'Botschafts-Sticker-Verfahren erforderlich',
    fr: 'Procédure sticker ambassade requise',
    ru: 'Нужен стикер в посольстве',
  },
  'card.sticker.body': {
    en: '{country} ordinary passport holders generally cannot use an online e-Permit. An embassy / consulate sticker process applies; consultancy support is available below.',
    tr: '{country} umuma mahsus pasaport sahipleri genelde çevrimiçi e-izin kullanamaz. Konsolosluk sticker süreci uygulanır; aşağıda danışmanlık desteği vardır.',
    ar: 'حاملو جوازات {country} العادية عادة لا يمكنهم استخدام تصريح إلكتروني عبر الإنترنت. يُطبق إجراء ملصق السفارة؛ والدعم متاح أدناه.',
    es: 'Los pasaportes ordinarios de {country} generalmente no usan e-Permiso en línea. Aplica el proceso de sticker en embajada; hay apoyo abajo.',
    de: 'Inhaber gewöhnlicher Pässe aus {country} können meist kein Online-e-Permit nutzen. Es gilt das Botschafts-Sticker-Verfahren; Unterstützung unten.',
    fr: 'Les passeports ordinaires {country} ne peuvent généralement pas utiliser un e-Permis en ligne. Procédure sticker ambassade ; aide ci-dessous.',
    ru: 'Обычные паспорта {country} обычно без онлайн e-Permit. Нужен стикер в посольстве; поддержка ниже.',
  },
  'card.sticker.f1': {
    en: 'No online e-Permit for this passport', tr: 'Bu pasaport için çevrimiçi e-izin yok', ar: 'لا يوجد تصريح إلكتروني عبر الإنترنت لهذا الجواز', es: 'Sin e-Permiso en línea para este pasaporte', de: 'Kein Online-e-Permit für diesen Pass', fr: 'Pas d’e-Permis en ligne pour ce passeport', ru: 'Нет онлайн e-Permit для этого паспорта',
  },
  'card.sticker.f2': {
    en: 'Apply via Turkish embassy / consulate process', tr: 'Türk konsolosluğu süreciyle başvuru', ar: 'قدّم عبر عملية السفارة / القنصلية التركية', es: 'Solicite vía embajada / consulado turco', de: 'Antrag über türkische Botschaft / Konsulat', fr: 'Demande via ambassade / consulat turc', ru: 'Подача через посольство / консульство Турции',
  },
  'card.sticker.f3': {
    en: 'Document & appointment guidance available', tr: 'Belge ve randevu rehberliği mevcut', ar: 'إرشاد للمستندات والمواعيد متاح', es: 'Orientación de documentos y citas disponible', de: 'Hilfe zu Unterlagen und Terminen verfügbar', fr: 'Aide documents et rendez-vous disponible', ru: 'Есть помощь с документами и записью',
  },

  // ── Option cards (by stable id) ──
  'opt.ePermit.title': {
    en: 'Get a Turkey e-Permit',
    tr: 'Türkiye e-izin alın',
    ar: 'احصل على تصريح تركيا الإلكتروني',
    es: 'Obtenga un e-Permiso de Turquía',
    de: 'Türkei-e-Permit erhalten',
    fr: 'Obtenez un e-Permis Turquie',
    ru: 'Оформите e-Permit Турции',
  },
  'opt.entryPermit.title': {
    en: 'Get a Turkey Entry Permit',
    tr: 'Türkiye giriş izni alın',
    ar: 'احصل على إذن دخول تركيا',
    es: 'Obtenga un permiso de entrada a Turquía',
    de: 'Türkei-Einreiseerlaubnis erhalten',
    fr: 'Obtenez un permis d’entrée Turquie',
    ru: 'Оформите допуск в Турцию',
  },
  'opt.resident.desc': {
    en: 'If you have a valid residence permit in any of the following countries:',
    tr: 'Aşağıdaki ülkelerden birinde geçerli ikamet izniniz varsa:',
    ar: 'إذا كان لديك تصريح إقامة ساري في أي من البلدان التالية:',
    es: 'Si tiene un permiso de residencia válido en alguno de estos países:',
    de: 'Wenn Sie einen gültigen Aufenthaltstitel in einem der folgenden Länder haben:',
    fr: 'Si vous avez un titre de séjour valide dans l’un des pays suivants :',
    ru: 'Если у вас есть действующий ВНЖ в одной из следующих стран:',
  },
  'opt.resident.bullet': {
    en: 'Your Turkey e-Permit and travel information will be delivered directly to your email. Depending on the processing speed chosen, delivery occurs between 60 minutes and 7 days.',
    tr: 'Türkiye e-izniniz ve seyahat bilgileriniz e-postanıza iletilir. Seçilen işleme hızına göre teslimat 60 dakika ile 7 gün arasında olur.',
    ar: 'سيُرسل تصريح تركيا الإلكتروني ومعلومات السفر إلى بريدك. حسب سرعة المعالجة، التسليم بين 60 دقيقة و7 أيام.',
    es: 'Su e-Permiso de Turquía e información de viaje se envían a su correo. Según la velocidad, la entrega es entre 60 minutos y 7 días.',
    de: 'Ihr Türkei-e-Permit und Reiseinfos werden per E-Mail geliefert. Je nach Bearbeitungsgeschwindigkeit zwischen 60 Minuten und 7 Tagen.',
    fr: 'Votre e-Permis Turquie et les infos voyage sont envoyés par e-mail. Selon la vitesse, livraison entre 60 minutes et 7 jours.',
    ru: 'e-Permit Турции и информация о поездке придут на email. Срок — от 60 минут до 7 дней в зависимости от скорости.',
  },
  'opt.validPermit.desc': {
    en: 'If you have a valid entry permit to any of the following countries:',
    tr: 'Aşağıdaki ülkelerden birine geçerli giriş izniniz varsa:',
    ar: 'إذا كان لديك إذن دخول ساري إلى أي من البلدان التالية:',
    es: 'Si tiene un permiso de entrada válido a alguno de estos países:',
    de: 'Wenn Sie eine gültige Einreiseerlaubnis für eines der folgenden Länder haben:',
    fr: 'Si vous avez un permis d’entrée valide pour l’un des pays suivants :',
    ru: 'Если у вас есть действующий въездной допуск в одну из следующих стран:',
  },
  'opt.validPermit.bullet': {
    en: 'If you hold a valid physical entry permit from the Schengen Area, USA, UK, or Ireland, you are eligible for an easy online e-Permit. Your Turkey e-Permit and travel information will be delivered directly to your email. Depending on the processing speed chosen, delivery occurs between 60 minutes and 7 days.',
    tr: 'Schengen, ABD, İngiltere veya İrlanda’dan geçerli fiziki giriş izniniz varsa kolay çevrimiçi e-izine hak kazanırsınız. Türkiye e-izniniz ve seyahat bilgileriniz e-postanıza iletilir; teslimat 60 dakika ile 7 gün arasındadır.',
    ar: 'إذا لديك إذن دخول فعلي ساري من شنغن أو الولايات المتحدة أو المملكة المتحدة أو أيرلندا فأنت مؤهل لتصريح إلكتروني سهل. يُرسل إلى بريدك خلال 60 دقيقة إلى 7 أيام.',
    es: 'Con un permiso de entrada físico válido de Schengen, EE. UU., Reino Unido o Irlanda puede obtener un e-Permiso en línea. Se entrega por correo entre 60 minutos y 7 días.',
    de: 'Mit gültiger physischer Einreiseerlaubnis aus Schengen, USA, UK oder Irland sind Sie für ein Online-e-Permit berechtigt. Lieferung per E-Mail in 60 Minuten bis 7 Tagen.',
    fr: 'Avec un permis d’entrée physique valide Schengen, USA, Royaume-Uni ou Irlande, vous êtes éligible à un e-Permis en ligne. Livraison par e-mail sous 60 minutes à 7 jours.',
    ru: 'При действующем физическом въездном допуске Schengen / США / UK / Ирландии доступен онлайн e-Permit. Доставка на email от 60 минут до 7 дней.',
  },
  'opt.gcc.desc': {
    en: 'If you have a valid residence permit to any of the following countries:',
    tr: 'Aşağıdaki ülkelerden birinde geçerli ikamet izniniz varsa:',
    ar: 'إذا كان لديك تصريح إقامة ساري في أي من البلدان التالية:',
    es: 'Si tiene un permiso de residencia válido en alguno de estos países:',
    de: 'Wenn Sie einen gültigen Aufenthaltstitel in einem der folgenden Länder haben:',
    fr: 'Si vous avez un titre de séjour valide dans l’un des pays suivants :',
    ru: 'Если у вас есть действующий ВНЖ в одной из следующих стран:',
  },
  'opt.gcc.bullet': {
    en: 'Citizens holding a valid residence permit from one of the following countries are eligible to apply for a Turkey entry permit for holiday purposes. This streamlines the process, offering a 30-day stay in Turkey. Your application and information details will be sent to your email address within the same day.',
    tr: 'Aşağıdaki ülkelerden birinde geçerli ikamet izni olanlar tatil amaçlı Türkiye giriş iznine başvurabilir. Süreç sadeleşir ve 30 günlük kalış sunulur. Başvuru ve bilgiler aynı gün e-postanıza gönderilir.',
    ar: 'حاملو إقامة سارية من أحد البلدان التالية مؤهلون لطلب إذن دخول تركيا للعطلة. يبسّط الإجراء ويمنح إقامة 30 يوماً. تُرسل التفاصيل إلى بريدك في نفس اليوم.',
    es: 'Quienes tengan residencia válida en uno de estos países pueden solicitar un permiso de entrada a Turquía por turismo (30 días). Los detalles se envían al correo el mismo día.',
    de: 'Mit gültigem Aufenthaltstitel aus einem der folgenden Länder können Sie eine Türkei-Einreiseerlaubnis für Urlaub (30 Tage) beantragen. Details noch am selben Tag per E-Mail.',
    fr: 'Avec un titre de séjour valide dans l’un de ces pays, vous pouvez demander un permis d’entrée Turquie pour vacances (30 jours). Détails envoyés par e-mail le jour même.',
    ru: 'При действующем ВНЖ одной из этих стран можно подать на допуск в Турцию для отдыха (30 дней). Детали придут на email в тот же день.',
  },
  'opt.sticker.desc': {
    en: 'If you do not qualify for an online e-Permit option:',
    tr: 'Çevrimiçi e-izin seçeneğine hak kazanmıyorsanız:',
    ar: 'إذا لم تكن مؤهلاً لخيار التصريح الإلكتروني عبر الإنترنت:',
    es: 'Si no califica para una opción de e-Permiso en línea:',
    de: 'Wenn Sie für keine Online-e-Permit-Option berechtigt sind:',
    fr: 'Si vous n’êtes pas éligible à une option e-Permis en ligne :',
    ru: 'Если онлайн e-Permit вам не подходит:',
  },
  'opt.sticker.bullet': {
    en: 'If you do not qualify for an online e-Permit, our consultancy supports a Turkey entry permit through the embassy / consulate sticker process. We guide you on documents, appointments, forms and biometrics. Application details and next steps are sent to your email.',
    tr: 'Çevrimiçi e-izine hak kazanmazsanız danışmanlığımız konsolosluk sticker süreciyle Türkiye giriş izninde destek olur. Belge, randevu, form ve biometri konusunda rehberlik ederiz. Ayrıntılar e-postanıza gönderilir.',
    ar: 'إن لم تكن مؤهلاً لتصريح إلكتروني، ندعم إذن دخول تركيا عبر ملصق السفارة / القنصلية. نرشدك للمستندات والمواعيد والنماذج والبصمات. تُرسل التفاصيل إلى بريدك.',
    es: 'Si no califica para e-Permiso en línea, nuestra consultoría apoya el permiso de entrada vía sticker en embajada/consulado. Guiamos documentos, citas, formularios y biometría. Detalles por correo.',
    de: 'Ohne Online-e-Permit unterstützen wir die Einreiseerlaubnis über das Botschafts-/Konsulats-Sticker-Verfahren. Hilfe zu Unterlagen, Terminen, Formularen und Biometrie. Details per E-Mail.',
    fr: 'Sans e-Permis en ligne, notre conseil aide pour un permis d’entrée via sticker ambassade/consulat. Documents, rendez-vous, formulaires et biométrie. Détails par e-mail.',
    ru: 'Без онлайн e-Permit помогаем с допуском через стикер в посольстве/консульстве: документы, запись, формы, биометрия. Детали на email.',
  },
  'opt.ageDirect.desc': {
    en: 'Direct e-Permit for eligible age groups.',
    tr: 'Uygun yaş grupları için doğrudan e-izin.',
    ar: 'تصريح إلكتروني مباشر للفئات العمرية المؤهلة.',
    es: 'e-Permiso directo para grupos de edad elegibles.',
    de: 'Direktes e-Permit für berechtigte Altersgruppen.',
    fr: 'e-Permis direct pour les groupes d’âge éligibles.',
    ru: 'Прямой e-Permit для подходящих возрастных групп.',
  },
  'opt.ageDirect.b1': {
    en: 'e-Permit + travel info delivered by email.',
    tr: 'e-İzin + seyahat bilgisi e-posta ile iletilir.',
    ar: 'يُرسل التصريح الإلكتروني ومعلومات السفر بالبريد.',
    es: 'e-Permiso e información de viaje por correo.',
    de: 'e-Permit + Reiseinfos per E-Mail.',
    fr: 'e-Permis + infos voyage par e-mail.',
    ru: 'e-Permit и информация о поездке на email.',
  },
  'opt.ageDirect.b2': {
    en: 'Delivery between 60 minutes and 7 days.',
    tr: 'Teslimat 60 dakika ile 7 gün arasında.',
    ar: 'التسليم بين 60 دقيقة و7 أيام.',
    es: 'Entrega entre 60 minutos y 7 días.',
    de: 'Lieferung zwischen 60 Minuten und 7 Tagen.',
    fr: 'Livraison entre 60 minutes et 7 jours.',
    ru: 'Доставка от 60 минут до 7 дней.',
  },
  'opt.agePermit.desc': {
    en: 'With a valid entry permit for an eligible country.',
    tr: 'Uygun bir ülke için geçerli giriş izniyle.',
    ar: 'مع إذن دخول ساري لبلد مؤهل.',
    es: 'Con un permiso de entrada válido de un país elegible.',
    de: 'Mit gültiger Einreiseerlaubnis für ein berechtigtes Land.',
    fr: 'Avec un permis d’entrée valide pour un pays éligible.',
    ru: 'С действующим въездным допуском подходящей страны.',
  },
  'opt.agePermit.condition': {
    en: 'Valid physical entry permit from the Schengen Area, USA, UK or Ireland required.',
    tr: 'Schengen, ABD, İngiltere veya İrlanda’dan geçerli fiziki giriş izni gerekir.',
    ar: 'يلزم إذن دخول فعلي ساري من شنغن أو الولايات المتحدة أو المملكة المتحدة أو أيرلندا.',
    es: 'Se requiere permiso de entrada físico válido de Schengen, EE. UU., Reino Unido o Irlanda.',
    de: 'Gültige physische Einreiseerlaubnis aus Schengen, USA, UK oder Irland erforderlich.',
    fr: 'Permis d’entrée physique valide Schengen, USA, Royaume-Uni ou Irlande requis.',
    ru: 'Нужен действующий физический допуск Schengen / США / UK / Ирландии.',
  },
  'opt.tag.docPrep': {
    en: 'Document preparation', tr: 'Belge hazırlama', ar: 'إعداد المستندات', es: 'Preparación de documentos', de: 'Unterlagenvorbereitung', fr: 'Préparation des documents', ru: 'Подготовка документов',
  },
  'opt.tag.embassy': {
    en: 'Embassy appointment', tr: 'Konsolosluk randevusu', ar: 'موعد السفارة', es: 'Cita en embajada', de: 'Botschaftstermin', fr: 'Rendez-vous ambassade', ru: 'Запись в посольство',
  },
  'opt.tag.forms': {
    en: 'Form & biometric support', tr: 'Form ve biometri desteği', ar: 'دعم النماذج والبصمات', es: 'Apoyo en formularios y biometría', de: 'Formular- & Biometrie-Hilfe', fr: 'Aide formulaires et biométrie', ru: 'Помощь с формами и биометрией',
  },
  'opt.tag.tracking': {
    en: 'Application tracking', tr: 'Başvuru takibi', ar: 'تتبع الطلب', es: 'Seguimiento de solicitud', de: 'Antragsverfolgung', fr: 'Suivi de demande', ru: 'Отслеживание заявки',
  },
};

export const DICTS = pack(ROWS);

export function translate(
  lang: LangCode,
  key: string,
  vars?: Record<string, string | number>,
): string {
  let s = DICTS[lang]?.[key] ?? DICTS.en[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    }
  }
  return s;
}
