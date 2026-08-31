import React, { useState, useEffect, useMemo } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Send, 
  AlertCircle, 
  Copy, 
  Check, 
  Clock, 
  MessageSquare, 
  ShieldCheck, 
  Inbox, 
  Trash2,
  Calendar,
  X,
  Facebook,
  Github,
  Instagram,
  RefreshCw,
  Info,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PERSONAL_INFO, UI_TRANSLATIONS } from '../data/portfolioData';
import { ContactMessage, Language } from '../types';
import { MagicCard } from './MagicCard';

interface ContactSectionProps {
  language: Language;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
}

const DRAFT_STORAGE_KEY = 'hoanglong_portfolio_contact_draft';
const COOLDOWN_STORAGE_KEY = 'hoanglong_portfolio_last_sent_time';
const COOLDOWN_SECONDS = 180; // 3 minutes

// Validation helper functions
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export type PhoneValidationResult = 
  | { type: 'empty' }
  | { type: 'valid_vn'; formatted: string }
  | { type: 'international'; countryCode: string }
  | { type: 'invalid'; errorVi: string; errorEn: string };

export function evaluatePhoneNumber(rawPhone: string): PhoneValidationResult {
  const trimmed = rawPhone.trim();
  if (!trimmed) {
    return { type: 'empty' };
  }

  // Remove spaces, hyphens, dots, parentheses
  const clean = trimmed.replace(/[\s.\-()]/g, '');

  // 1. Vietnamese number with +84 prefix
  if (clean.startsWith('+84')) {
    const afterCode = clean.slice(3);
    // Standard VN mobile numbers have 9 digits after +84 (starting with 3, 5, 7, 8, 9, 2)
    if (/^[1-9][0-9]{8}$/.test(afterCode)) {
      return { type: 'valid_vn', formatted: clean };
    }
    return {
      type: 'invalid',
      errorVi: 'Số điện thoại (+84) cần có 9 chữ số theo sau (Ví dụ: +84 912 345 678).',
      errorEn: 'Phone number with +84 must have 9 digits following (e.g. +84 912 345 678).'
    };
  }

  // 2. Vietnamese standard 10-digit number starting with 0
  if (clean.startsWith('0')) {
    if (/^0[1-9][0-9]{8}$/.test(clean)) {
      return { type: 'valid_vn', formatted: clean };
    }
    return {
      type: 'invalid',
      errorVi: 'Số điện thoại Việt Nam cần đủ đúng 10 chữ số bắt đầu bằng số 0 (Ví dụ: 0912 345 678).',
      errorEn: 'Vietnamese phone number must have exactly 10 digits starting with 0 (e.g. 0912 345 678).'
    };
  }

  // 3. International phone numbers starting with + (not +84)
  if (clean.startsWith('+')) {
    // Check if it's a plausible international phone number (7 to 15 digits)
    if (/^\+[1-9][0-9]{6,14}$/.test(clean)) {
      const match = clean.match(/^\+(\d{1,4})/);
      return { 
        type: 'international', 
        countryCode: match ? match[1] : 'int'
      };
    }
    return {
      type: 'invalid',
      errorVi: 'Định dạng số điện thoại quốc tế không hợp lệ (Ví dụ: +1 415 555 2671).',
      errorEn: 'Invalid international phone number format (e.g. +1 415 555 2671).'
    };
  }

  // 4. Any other non-standard / short numbers (e.g., 113, 114, 115, random characters)
  return {
    type: 'invalid',
    errorVi: 'Số điện thoại không hợp lệ. Vui lòng nhập đủ 10 chữ số (bắt đầu bằng 0) hoặc mã quốc tế (+84 / +XY).',
    errorEn: 'Invalid phone number. Please enter a 10-digit number (starting with 0) or country code (+84 / +XY).'
  };
}

export const ContactSection: React.FC<ContactSectionProps> = ({ language, onShowToast }) => {
  const t = UI_TRANSLATIONS[language].contact;
  const toastT = UI_TRANSLATIONS[language].toasts;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    _hp: '', // Honeypot trap
  });

  // Controls the dynamic 70% / 30% expanding flex animation on focus
  const [activeFocusField, setActiveFocusField] = useState<'none' | 'phone' | 'email'>('none');
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Real-time phone evaluation
  const phoneEvaluation = useMemo(() => evaluatePhoneNumber(formData.phone), [formData.phone]);
  const isInternationalPhone = phoneEvaluation.type === 'international';

  // Admin / Test Inbox Modal State
  const [isInboxModalOpen, setIsInboxModalOpen] = useState<boolean>(false);
  const [inboxMessages, setInboxMessages] = useState<ContactMessage[]>([]);
  const [isLoadingInbox, setIsLoadingInbox] = useState<boolean>(false);

  // Book a call modal state
  const [isBookCallModalOpen, setIsBookCallModalOpen] = useState<boolean>(false);

  // Load saved draft and calculate cooldown on mount
  useEffect(() => {
    // 1. Load draft
    try {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setFormData((prev) => ({
          ...prev,
          name: parsed.name || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          message: parsed.message || '',
        }));
      }
    } catch {
      // ignore
    }

    // 2. Calculate cooldown
    const checkCooldown = () => {
      const lastSent = Number(localStorage.getItem(COOLDOWN_STORAGE_KEY) || 0);
      if (lastSent) {
        const diffSeconds = Math.floor((Date.now() - lastSent) / 1000);
        const remaining = Math.max(0, COOLDOWN_SECONDS - diffSeconds);
        setCooldownRemaining(remaining);
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Save draft on change
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      // Save draft (exclude honeypot)
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          name: updated.name,
          email: updated.email,
          phone: updated.phone,
          message: updated.message,
        })
      );
      return updated;
    });

    // Clear errors for edited field
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[name];
      if (name === 'phone' || name === 'email') {
        delete next.contact;
      }
      return next;
    });
  };

  // Validate form client-side with strict phone & email rules
  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    // 1. Name validation
    if (!formData.name.trim()) {
      errors.name = language === 'en' ? 'Please enter your full name.' : 'Vui lòng nhập họ và tên của bạn.';
    }

    const phoneTrimmed = formData.phone.trim();
    const emailTrimmed = formData.email.trim();

    const phoneEval = evaluatePhoneNumber(phoneTrimmed);
    const hasEmail = Boolean(emailTrimmed);
    const hasPhone = phoneEval.type !== 'empty';

    // 2. Require at least one contact channel
    if (!hasEmail && !hasPhone) {
      errors.contact =
        language === 'en'
          ? 'Please provide an Email address or a 10-digit Phone number.'
          : 'Vui lòng cung cấp Email hoặc Số điện thoại (10 chữ số) để liên hệ.';
    }

    // 3. Phone validation
    if (hasPhone) {
      if (phoneEval.type === 'invalid') {
        errors.phone = language === 'en' ? phoneEval.errorEn : phoneEval.errorVi;
      } else if (phoneEval.type === 'international') {
        // International number requires email for reliable responses
        if (!hasEmail) {
          errors.email =
            language === 'en'
              ? 'International phone number detected. Please also provide your Email so we can reach you.'
              : 'Số điện thoại quốc tế (+XY) cần kèm theo địa chỉ Email để Hoàng Long có thể phản hồi lại bạn.';
        }
      }
    }

    // 4. Email validation
    if (hasEmail) {
      if (!EMAIL_REGEX.test(emailTrimmed)) {
        errors.email =
          language === 'en'
            ? 'Please enter a valid email address with @ and domain (e.g. name@gmail.com).'
            : 'Địa chỉ email không đúng định dạng (cần có ký tự @ và tên miền, ví dụ: name@gmail.com).';
      }
    }

    // 5. Message validation
    if (!formData.message.trim()) {
      errors.message =
        language === 'en' ? 'Please enter your message.' : 'Vui lòng nhập nội dung tin nhắn.';
    } else if (formData.message.trim().length < 5) {
      errors.message =
        language === 'en'
          ? 'Message should be at least 5 characters.'
          : 'Nội dung tin nhắn cần tối thiểu 5 ký tự.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cooldownRemaining > 0) {
      onShowToast(
        'info',
        toastT.cooldownTitle,
        `${toastT.cooldownMsg} (${formatTime(cooldownRemaining)})`
      );
      return;
    }

    if (!validateForm()) {
      onShowToast('error', toastT.formErrorTitle, toastT.formErrorMsg);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Trigger celebratory confetti
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00d2ff', '#38bdf8', '#a855f7', '#10b981'],
        });

        onShowToast(
          'success',
          toastT.formSuccessTitle,
          language === 'en'
            ? 'Thank you! Your message was delivered safely to Hoàng Long.'
            : data.message || 'Cảm ơn bạn! Hoàng Long sẽ sớm phản hồi lại bạn.'
        );

        // Update cooldown & clear draft
        localStorage.setItem(COOLDOWN_STORAGE_KEY, String(Date.now()));
        setCooldownRemaining(COOLDOWN_SECONDS);
        localStorage.removeItem(DRAFT_STORAGE_KEY);

        setFormData({
          name: '',
          email: '',
          phone: '',
          message: '',
          _hp: '',
        });
        setFieldErrors({});
      } else {
        onShowToast(
          'error',
          toastT.formErrorTitle,
          data.message || 'An error occurred. Please try again.'
        );
      }
    } catch (error) {
      console.error('Contact submit error:', error);
      onShowToast(
        'error',
        'Connection Error',
        language === 'en'
          ? 'Unable to connect to the server. Please check your network connection.'
          : 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    onShowToast('success', toastT.copiedTitle, `${text} ${toastT.copiedMsg}`);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Fetch admin inbox messages for test verification
  const fetchInbox = async () => {
    setIsLoadingInbox(true);
    try {
      const res = await fetch('/api/contact/messages');
      const data = await res.json();
      if (data.messages) {
        setInboxMessages(data.messages);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingInbox(false);
    }
  };

  const clearInbox = async () => {
    try {
      await fetch('/api/contact/messages', { method: 'DELETE' });
      setInboxMessages([]);
      onShowToast(
        'info',
        language === 'en' ? 'Inbox Cleared' : 'Đã xóa',
        language === 'en' ? 'Server test messages have been reset.' : 'Hộp thư thử nghiệm đã được làm sạch.'
      );
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <section id="contact" className="min-h-full py-8 px-4 sm:px-6 lg:px-10 max-w-6xl mx-auto flex flex-col justify-center">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Mail className="w-5 h-5 text-accent" />
            <span className="text-xs font-bold uppercase tracking-widest text-accent">
              {t.tagline}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-display">
            {t.title}
          </h2>
        </div>

        {/* Server Test Inbox Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsInboxModalOpen(true);
              fetchInbox();
            }}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Inspect submitted test messages on Express server"
          >
            <Inbox className="w-4 h-4 text-cyan-400" />
            <span>{t.testInboxBtn}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Direct Contact Info, Quick Call CTA & Socials */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <MagicCard 
            enableTilt={true}
            enableBorderGlow={true}
            enableStars={true}
            particleCount={8}
            className="p-6 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl shadow-xl space-y-6"
          >
            <div>
              <span className="text-xs font-bold text-accent uppercase tracking-wider">
                {t.letsTalk}
              </span>
              <h3 className="text-xl font-extrabold text-white mt-1">
                {t.calloutHeading}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {t.calloutDesc}
              </p>
            </div>

            {/* Contact Details with 1-Click Copy */}
            <div className="space-y-3">
              {/* Address */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent-soft text-accent">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-400">{t.addressLabel}</p>
                  <p className="text-xs font-semibold text-white truncate">
                    {language === 'en' ? PERSONAL_INFO.locationEn : PERSONAL_INFO.locationVi}
                  </p>
                </div>
              </div>

              {/* Phone */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-accent-soft text-accent">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400">{t.phoneLabel}</p>
                    <a
                      href={`tel:${PERSONAL_INFO.phone.replace(/\s/g, '')}`}
                      className="text-xs font-semibold text-white hover:text-accent transition-colors truncate block"
                    >
                      {PERSONAL_INFO.phone}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(PERSONAL_INFO.phone, 'phone')}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy phone number"
                >
                  {copiedField === 'phone' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Email */}
              <div className="p-3 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-accent-soft text-accent">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400">{t.emailLabel}</p>
                    <a
                      href={`mailto:${PERSONAL_INFO.email}`}
                      className="text-xs font-semibold text-white hover:text-accent transition-colors truncate block"
                    >
                      {PERSONAL_INFO.email}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => copyToClipboard(PERSONAL_INFO.email, 'email')}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Copy email address"
                >
                  {copiedField === 'email' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Quick Call Callout */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-accent-soft to-transparent border border-accent-border flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white">{t.quickCallTitle}</p>
                <p className="text-[11px] text-slate-300">{t.quickCallSubtitle}</p>
              </div>
              <button
                onClick={() => setIsBookCallModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-accent text-slate-950 font-bold text-xs hover:opacity-90 transition-all cursor-pointer shadow-accent-sm whitespace-nowrap"
              >
                {t.quickCallBtn}
              </button>
            </div>

            {/* Social Links */}
            <div>
              <p className="text-xs text-slate-400 mb-2 font-medium">{t.socialsLabel}</p>
              <div className="flex items-center gap-3">
                <a
                  href={PERSONAL_INFO.socials.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-blue-600/20 hover:text-blue-400 border border-white/10 text-slate-300 transition-all flex items-center gap-2 text-xs font-semibold"
                >
                  <Facebook className="w-4 h-4" />
                  <span>Facebook</span>
                </a>
                <a
                  href={PERSONAL_INFO.socials.github}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-white/20 hover:text-white border border-white/10 text-slate-300 transition-all flex items-center gap-2 text-xs font-semibold"
                >
                  <Github className="w-4 h-4" />
                  <span>GitHub</span>
                </a>
                <a
                  href={PERSONAL_INFO.socials.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-pink-600/20 hover:text-pink-400 border border-white/10 text-slate-300 transition-all flex items-center gap-2 text-xs font-semibold"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </a>
              </div>
            </div>
          </MagicCard>
        </div>

        {/* Right Column: Secure Interactive Contact Form with Dynamic Flex Widths */}
        <div className="lg:col-span-7">
          <MagicCard 
            enableTilt={true}
            enableBorderGlow={true}
            enableStars={true}
            particleCount={10}
            className="p-6 sm:p-7 rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden"
          >
            
            {/* Form Title & Security Badge */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-accent" />
                <h3 className="text-base font-bold text-white">{t.formTitle}</h3>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.securityBadge}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Honeypot hidden input (traps bots) */}
              <input
                type="text"
                name="_hp"
                value={formData._hp}
                onChange={handleInputChange}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              {/* Name Field */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.nameLabel} <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder={t.namePlaceholder}
                  className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                    fieldErrors.name
                      ? 'border-rose-500 bg-rose-500/10 focus:ring-2 focus:ring-rose-500/30'
                      : 'border-white/10 focus:border-accent focus:bg-white/10 focus:ring-2 focus:ring-accent/20'
                  }`}
                />
                {fieldErrors.name && (
                  <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {fieldErrors.name}
                  </p>
                )}
              </div>

              {/* Dual Column: Phone & Email with 70% / 30% Dynamic Flex Focus Expansion */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    {t.contactInfoLabel} <span className="text-slate-400 font-normal">{t.contactInfoSub}</span> <span className="text-rose-400">*</span>
                  </label>
                  {activeFocusField !== 'none' && (
                    <span className="text-[10px] text-accent font-mono animate-in fade-in">
                      {activeFocusField === 'email' ? 'Focus: 70% Email | 30% Phone' : 'Focus: 70% Phone | 30% Email'}
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full">
                  {/* Phone Field Wrapper (Dynamic 70% / 30% width) */}
                  <div
                    className={`w-full transition-all duration-300 ease-in-out ${
                      activeFocusField === 'phone'
                        ? 'sm:w-[70%] sm:flex-[7]'
                        : activeFocusField === 'email'
                        ? 'sm:w-[30%] sm:flex-[3]'
                        : 'sm:w-1/2 sm:flex-1'
                    }`}
                  >
                    <div className="relative">
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onFocus={() => setActiveFocusField('phone')}
                        onBlur={() => {
                          setTimeout(() => {
                            const activeElName = document.activeElement?.getAttribute('name');
                            if (activeElName === 'email') {
                              setActiveFocusField('email');
                            } else if (activeElName !== 'phone') {
                              setActiveFocusField('none');
                            }
                          }, 50);
                        }}
                        onChange={handleInputChange}
                        placeholder={t.phonePlaceholder}
                        className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                          fieldErrors.contact || fieldErrors.phone
                            ? 'border-rose-500 bg-rose-500/10'
                            : activeFocusField === 'phone'
                            ? 'border-accent bg-white/10 ring-2 ring-accent/20'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      />
                      {phoneEvaluation.type === 'valid_vn' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-emerald-400 pointer-events-none">
                          <Check className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline font-mono">VN</span>
                        </div>
                      )}
                      {isInternationalPhone && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[11px] text-amber-400 pointer-events-none">
                          <Globe className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline font-mono">INTL</span>
                        </div>
                      )}
                    </div>
                    {fieldErrors.phone && (
                      <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1 leading-snug">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Email Field Wrapper (Dynamic 70% / 30% width) */}
                  <div
                    className={`w-full transition-all duration-300 ease-in-out ${
                      activeFocusField === 'email'
                        ? 'sm:w-[70%] sm:flex-[7]'
                        : activeFocusField === 'phone'
                        ? 'sm:w-[30%] sm:flex-[3]'
                        : 'sm:w-1/2 sm:flex-1'
                    }`}
                  >
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onFocus={() => setActiveFocusField('email')}
                        onBlur={() => {
                          setTimeout(() => {
                            const activeElName = document.activeElement?.getAttribute('name');
                            if (activeElName === 'phone') {
                              setActiveFocusField('phone');
                            } else if (activeElName !== 'email') {
                              setActiveFocusField('none');
                            }
                          }, 50);
                        }}
                        onChange={handleInputChange}
                        placeholder={t.emailPlaceholder}
                        className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all ${
                          fieldErrors.contact || fieldErrors.email
                            ? 'border-rose-500 bg-rose-500/10'
                            : activeFocusField === 'email'
                            ? 'border-accent bg-white/10 ring-2 ring-accent/20'
                            : 'border-white/10 hover:border-white/20'
                        }`}
                      />
                      {EMAIL_REGEX.test(formData.email.trim()) && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-emerald-400 pointer-events-none">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                    {fieldErrors.email && (
                      <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1 leading-snug">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {fieldErrors.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* International Phone Notice Callout */}
                {isInternationalPhone && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5 animate-in fade-in duration-200">
                    <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <p className="font-semibold text-amber-300">
                        {language === 'en' ? 'International phone number detected' : 'Phát hiện số điện thoại quốc tế (+XY)'}
                      </p>
                      <p className="text-[11px] text-amber-200/90 mt-0.5">
                        {language === 'en'
                          ? 'This is not a Vietnamese phone number (+84). Please also provide your Email address so Hoàng Long can respond to you smoothly.'
                          : 'Đây không phải là số điện thoại Việt Nam (+84), vui lòng nhập thêm địa chỉ Email để Hoàng Long có thể phản hồi cho bạn qua thư điện tử.'}
                      </p>
                    </div>
                  </div>
                )}

                {fieldErrors.contact && (
                  <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {fieldErrors.contact}
                  </p>
                )}
              </div>

              {/* Message Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    {t.messageLabel} <span className="text-rose-400">*</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {formData.message.length} {t.chars}
                  </span>
                </div>
                <textarea
                  name="message"
                  rows={4}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder={t.messagePlaceholder}
                  className={`w-full px-4 py-2.5 rounded-xl bg-white/5 border text-sm text-white placeholder:text-slate-500 focus:outline-none transition-all resize-y ${
                    fieldErrors.message
                      ? 'border-rose-500 bg-rose-500/10 focus:ring-2 focus:ring-rose-500/30'
                      : 'border-white/10 focus:border-accent focus:bg-white/10 focus:ring-2 focus:ring-accent/20'
                  }`}
                />
                {fieldErrors.message && (
                  <p className="text-rose-400 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {fieldErrors.message}
                  </p>
                )}
              </div>

              {/* Rate limit & Cooldown Notice */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-accent" />
                  <span>{t.rateLimitNotice}</span>
                  {cooldownRemaining > 0 && (
                    <span className="font-mono font-bold text-accent bg-accent-soft px-2 py-0.5 rounded-md border border-accent-border">
                      {formatTime(cooldownRemaining)}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500 italic">
                  {t.draftNotice}
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || cooldownRemaining > 0}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  cooldownRemaining > 0
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                    : 'bg-accent-gradient text-white shadow-accent hover:opacity-90 hover:scale-[1.01] active:scale-95'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t.btnSending}</span>
                  </>
                ) : cooldownRemaining > 0 ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>{t.btnCooldown} ({formatTime(cooldownRemaining)})</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t.btnSubmit}</span>
                  </>
                )}
              </button>
            </form>
          </MagicCard>
        </div>

      </div>

      {/* Book a Call Modal */}
      {isBookCallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-4">
            <button
              onClick={() => setIsBookCallModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-accent-soft text-accent">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{t.modalCallTitle}</h3>
                <p className="text-xs text-slate-400">{t.modalCallDesc}</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {t.modalCallText}
            </p>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Zalo / Phone:</span>
                <span className="font-mono font-bold text-white">{PERSONAL_INFO.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Email:</span>
                <span className="font-mono font-bold text-white">{PERSONAL_INFO.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">{t.hoursLabel}</span>
                <span className="text-emerald-400 font-semibold">{t.hoursValue}</span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <a
                href={`tel:${PERSONAL_INFO.phone.replace(/\s/g, '')}`}
                className="flex-1 py-2.5 rounded-xl bg-accent text-slate-950 font-bold text-xs text-center hover:opacity-90 transition-opacity"
              >
                {t.btnCallNow}
              </a>
              <a
                href={`mailto:${PERSONAL_INFO.email}?subject=Project%20Discussion%20Sync`}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs text-center transition-colors border border-white/10"
              >
                {t.btnSendEmail}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Admin Test Inbox Modal */}
      {isInboxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-white/15 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl p-6 relative">
            <button
              onClick={() => setIsInboxModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between pb-4 border-b border-white/10 pr-10">
              <div className="flex items-center gap-2">
                <Inbox className="w-5 h-5 text-accent" />
                <div>
                  <h3 className="text-base font-bold text-white">{t.inboxTitle}</h3>
                  <p className="text-xs text-slate-400">
                    {t.inboxDesc}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchInbox}
                  disabled={isLoadingInbox}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                  title="Refresh inbox"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingInbox ? 'animate-spin' : ''}`} />
                </button>
                {inboxMessages.length > 0 && (
                  <button
                    onClick={clearInbox}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-pointer"
                    title={t.clearInbox}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {isLoadingInbox ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-accent" />
                  {t.inboxLoading}
                </div>
              ) : inboxMessages.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  {t.inboxEmpty}
                </div>
              ) : (
                inboxMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-white text-sm">{msg.name}</span>
                        <div className="text-slate-400 text-[11px] flex gap-3 mt-0.5">
                          {msg.email && <span>📧 {msg.email}</span>}
                          {msg.phone && <span>📞 {msg.phone}</span>}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-accent bg-accent-soft px-2 py-0.5 rounded-md">
                        {new Date(msg.timestamp).toLocaleTimeString()} {new Date(msg.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-200 bg-slate-950/50 p-2.5 rounded-xl border border-white/5 leading-relaxed">
                      {msg.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
