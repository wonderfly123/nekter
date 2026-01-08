import { Star } from 'lucide-react';

const testimonials = [
  {
    quote:
      "Nekter transformed how we manage customer health. We catch churn signals weeks earlier now, and our retention is at an all-time high.",
    name: 'Sarah Chen',
    title: 'Head of CS at TechStart',
    initials: 'SC',
  },
  {
    quote:
      "The AI insights are incredibly accurate. Our team saves hours every week, and we're having better conversations with the right accounts.",
    name: 'Marcus Rodriguez',
    title: 'Customer Success Lead at ScaleUp Inc',
    initials: 'MR',
  },
  {
    quote:
      "Finally, a CS tool that grows with us. We went from 5 to 50 CSMs without any growing pains. The analytics are chef's kiss.",
    name: 'Emma Thompson',
    title: 'VP of Operations at GrowthCo',
    initials: 'ET',
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Loved by CS teams{' '}
            <span className="text-gradient">everywhere</span>
          </h2>
          <p className="text-xl text-gray-600">
            Don't just take our word for it. Here's what our customers have to say.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="p-6 bg-white rounded-2xl border border-gray-100 hover:shadow-lg transition-all duration-200"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-5 h-5 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-semibold">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{testimonial.name}</p>
                  <p className="text-sm text-gray-500">{testimonial.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
