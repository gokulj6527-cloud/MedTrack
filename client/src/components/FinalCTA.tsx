import React from 'react';
import { ArrowRight, Star } from 'lucide-react';

interface FinalCTAProps {
  onOpenLogin: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onOpenLogin }) => {
  const testimonials = [
    {
      rating: 5,
      quote: "MedTrack made our inventory tracking much easier. The expiry and batch alerts are extremely useful.",
      author: "Pharmacy Manager",
      reply: "Thank you for your valuable feedback and support! We’re glad MedTrack is helping your team manage medicines more efficiently."
    },
    {
      rating: 4.8,
      quote: "The real-time shipment and temperature monitoring gives us much better visibility across the supply chain.",
      author: "Distribution Manager",
      reply: "Thank you for trusting MedTrack. We truly appreciate your feedback!"
    },
    {
      rating: 5,
      quote: "Prescription verification and drug-interaction alerts make dispensing much safer.",
      author: "Pharmacist",
      reply: "Thank you for your kind words! Patient safety is at the heart of MedTrack."
    }
  ];

  return (
    <section className="py-24 bg-slate-50 relative overflow-hidden border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-24">
        
        {/* Testimonials */}
        <div>
          <div className="text-center mb-16">
            <h2 className="text-3xl font-light text-slate-900">What Healthcare Professionals Say</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-1 mb-4">
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} className={`w-4 h-4 ${idx < Math.floor(t.rating) ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-300'}`} />
                    ))}
                    <span className="text-xs font-semibold text-slate-700 ml-2">{t.rating}/5</span>
                  </div>
                  <p className="text-slate-600 text-sm font-light italic leading-relaxed mb-4">
                    “{t.quote}”
                  </p>
                  <p className="text-slate-900 text-sm font-medium">— {t.author}</p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-100">
                  <div className="text-xs font-semibold text-emerald-700 mb-1">Admin Reply:</div>
                  <p className="text-xs text-slate-500 font-light leading-relaxed">
                    {t.reply}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center max-w-4xl mx-auto space-y-8 bg-emerald-900 rounded-3xl p-12 lg:p-16 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
          
          <h2 className="text-4xl sm:text-5xl font-light text-white tracking-tight leading-tight relative z-10">
            The Future of Healthcare <br/>Starts With Better Intelligence.
          </h2>

          <p className="text-lg text-emerald-100 max-w-2xl mx-auto font-light leading-relaxed relative z-10">
            Log in using pre-seeded credentials to explore role-based capabilities, including inventory tracking, pharmaceutical alerts, and dispensing workflows.
          </p>

          <div className="flex justify-center pt-4 relative z-10">
            <button
              onClick={onOpenLogin}
              className="px-8 py-4 rounded-full bg-white text-emerald-900 font-medium text-sm tracking-wide shadow-xl hover:bg-emerald-50 hover:scale-105 transition-all flex items-center justify-center space-x-3"
            >
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
