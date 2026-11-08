import React from 'react';
import { Link } from 'react-router-dom';
import { useLocale } from '../context/LocaleContext';

export function Home() {
  const { locale, t } = useLocale();
  const isBn = locale === 'bn';

  const features = [
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      ),
      title: { en: '3D Printed', bn: '৩ডি প্রিন্টেড' },
      desc: { en: 'Custom designs brought to life with precision 3D printing', bn: 'নির্ভুল ৩ডি প্রিন্টিং দিয়ে কাস্টম ডিজাইন বাস্তবে রূপান্তর' },
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      title: { en: 'Premium Quality', bn: 'প্রিমিয়াম গুণমান' },
      desc: { en: 'High-quality materials and craftsmanship in every piece', bn: 'প্রতিটি টুকরোতে উচ্চ গুণমানের উপাদান এবং শিল্পকর্ম' },
    },
    {
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
      title: { en: 'Fast Shipping', bn: 'দ্রুত ডেলিভারি' },
      desc: { en: 'Quick delivery across Bangladesh with tracking', bn: 'বাংলাদেশ জুড়ে ট্র্যাকিংসহ দ্রুত ডেলিভারি' },
    },
  ];

  const categories = [
    { slug: 'tshirts', name: { en: 'T-Shirts', bn: 'টিশার্ট' }, image: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=T-Shirts' },
    { slug: 'hoodies', name: { en: 'Hoodies', bn: 'হুডি' }, image: 'https://via.placeholder.com/400x300/06B6D4/FFFFFF?text=Hoodies' },
    { slug: 'accessories', name: { en: 'Accessories', bn: 'অ্যাক্সেসরি' }, image: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Accessories' },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="py-16 md:py-24 bg-primary-light">
        <div className="container text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            {t('app.name')}
          </h1>
          <p className="text-xl md:text-2xl text-muted mb-8 max-w-2xl mx-auto">
            {t('app.tagline')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={isBn ? '/bn/catalog' : '/catalog'} className="btn btn-primary btn-lg">
              {t('catalog.view_details')}
            </Link>
            <Link to={isBn ? '/bn/catalog' : '/catalog'} className="btn btn-outline btn-lg">
              Browse Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div key={i} className="text-center p-6">
                <div className="text-primary mb-4">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{isBn ? feature.title.bn : feature.title.en}</h3>
                <p className="text-muted">{isBn ? feature.desc.bn : feature.desc.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-bg">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Shop by Category</h2>
            <p className="text-muted">Explore our collection of custom 3D printed fashion</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <Link
                key={i}
                to={isBn ? `/bn/catalog?category=${cat.slug}` : `/catalog?category=${cat.slug}`}
                className="card overflow-hidden group"
              >
                <img
                  src={cat.image}
                  alt={cat.name.en}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="p-6 text-center">
                  <h3 className="text-xl font-semibold">{isBn ? cat.name.bn : cat.name.en}</h3>
                  <p className="text-muted mt-1">View Collection →</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container">
          <div className="card bg-primary text-primary-foreground p-8 md:p-12 text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Create Your Style?</h2>
            <p className="text-muted mb-6 max-w-xl mx-auto">
              Design unique 3D printed fashion pieces that express your individuality.
              Start browsing our catalog or contact us for custom orders.
            </p>
            <Link to={isBn ? '/bn/catalog' : '/catalog'} className="btn btn-lg" style={{ backgroundColor: 'white', color: 'var(--color-primary)' }}>
              Start Shopping
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}