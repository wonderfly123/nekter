const logos = [
  'Stackly',
  'Cloudbase',
  'Pipeflow',
  'Workstream',
  'Signalbox',
];

export function Logos() {
  return (
    <section className="py-16 px-6 border-t border-gray-100">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-sm text-gray-500 mb-8">Trusted by innovative teams at</p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
          {logos.map((logo) => (
            <span
              key={logo}
              className="text-xl font-semibold text-gray-400 hover:text-gray-600 transition-colors"
            >
              {logo}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
