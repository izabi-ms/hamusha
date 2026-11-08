import React from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';

export default function Footer() {
  const { locale, t } = useLocale();
  const isBn = locale === 'bn';

  const footerLinks = {
    shop: [
      { label: t('nav.catalog'), href: isBn ? '/bn/catalog' : '/catalog' },
      { label: t('nav.cart'), href: isBn ? '/bn/cart' : '/cart' },
    ],
    support: [
      { label: 'Contact Us', href: '#' },
      { label: 'FAQs', href: '#' },
      { label: 'Shipping Info', href: '#' },
      { label: 'Returns', href: '#' },
    ],
    legal: [
      { label: 'Privacy Policy', href: '#' },
      { label: 'Terms of Service', href: '#' },
      { label: 'Cookie Policy', href: '#' },
    ],
  };

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">Haimish</div>
            <p className="footer-tagline">{t('app.tagline')}</p>
          </div>
          
          <div>
            <h4 className="footer-title">Shop</h4>
            <ul className="footer-links">
              {footerLinks.shop.map((link, i) => (
                <li key={i}>
                  <Link to={link.href} className="footer-link">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="footer-title">Support</h4>
            <ul className="footer-links">
              {footerLinks.support.map((link, i) => (
                <li key={i}>
                  <Link to={link.href} className="footer-link">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="footer-title">Legal</h4>
            <ul className="footer-links">
              {footerLinks.legal.map((link, i) => (
                <li key={i}>
                  <Link to={link.href} className="footer-link">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Haimish. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="footer-link" aria-label="Facebook">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
              </svg>
            </a>
            <a href="#" className="footer-link" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="#" className="footer-link" aria-label="Twitter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}