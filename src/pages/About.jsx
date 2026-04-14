import { Link } from "react-router-dom";
import {
  FaLeaf,
  FaHandshake,
  FaFlask,
  FaGlobeAmericas,
  FaAward,
  FaUsers,
} from "react-icons/fa";
import { MdVerified, MdNaturePeople, MdEco } from "react-icons/md";

const values = [
  {
    icon: <FaLeaf className="w-7 h-7" />,
    title: "100% Natural",
    description:
      "Every product we carry is free from synthetic additives, preservatives, and harmful chemicals. Nature provides, we deliver.",
  },
  {
    icon: <FaFlask className="w-7 h-7" />,
    title: "Lab Tested",
    description:
      "All herbs and supplements are rigorously tested in certified laboratories to ensure purity, potency, and safety.",
  },
  {
    icon: <FaGlobeAmericas className="w-7 h-7" />,
    title: "Ethically Sourced",
    description:
      "We partner with farmers and cooperatives who share our commitment to sustainable, fair-trade practices worldwide.",
  },
  {
    icon: <FaHandshake className="w-7 h-7" />,
    title: "Customer First",
    description:
      "Your wellness journey is our mission. We stand behind every product with honest guidance and dedicated support.",
  },
];

const stats = [
  { value: "500+", label: "Products" },
  { value: "50K+", label: "Happy Customers" },
  { value: "30+", label: "Countries Sourced" },
  { value: "10+", label: "Years of Expertise" },
];

const team = [
  {
    name: "Dr. Sarah Al-Rashid",
    role: "Founder & Chief Herbalist",
    bio: "With a PhD in Ethnobotany and 15 years of field research, Sarah built Dot-Herbs to bring the world's most powerful plants to your doorstep.",
    avatar: "SR",
  },
  {
    name: "Omar Khalil",
    role: "Head of Quality Assurance",
    bio: "Omar oversees every batch from source to shelf, ensuring our lab-testing standards remain the highest in the industry.",
    avatar: "OK",
  },
  {
    name: "Lina Haddad",
    role: "Wellness Consultant",
    bio: "A certified naturopath, Lina develops our product guides and works directly with customers to craft personalised wellness plans.",
    avatar: "LH",
  },
];

const certifications = [
  { icon: <MdVerified className="w-6 h-6" />, label: "ISO 22000 Certified" },
  { icon: <MdEco className="w-6 h-6" />, label: "Organic Certified" },
  {
    icon: <FaAward className="w-6 h-6" />,
    label: "Good Manufacturing Practice",
  },
  { icon: <MdNaturePeople className="w-6 h-6" />, label: "Fair Trade Partner" },
];

const About = () => {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-[#f0f7e6] via-[#e8f5d0] to-[#d4edaa] py-24 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-[#68a300] blur-3xl" />
          <div className="absolute bottom-10 right-20 w-80 h-80 rounded-full bg-[#4a7a00] blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 bg-[#68a300]/10 text-[#4a7a00] text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <FaLeaf className="w-4 h-4" />
            Our Story
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Nature's Best,{" "}
            <span className="text-[#68a300]">Delivered to You</span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto mb-10">
            Dot-Herbs was founded on a simple belief — that nature holds the
            answers to vibrant health. We source, test, and deliver the world's
            finest herbs, teas, oils and supplements straight to your home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/products"
              className="inline-flex items-center justify-center gap-2 bg-[#68a300] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#5a8f00] transition-colors"
            >
              <FaLeaf className="w-4 h-4" />
              Explore Products
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 border-2 border-[#68a300] text-[#68a300] font-semibold px-8 py-3 rounded-lg hover:bg-[#68a300] hover:text-white transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-4xl font-extrabold text-[#68a300] mb-1">
                {stat.value}
              </p>
              <p className="text-gray-500 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <span className="inline-block bg-[#68a300]/10 text-[#4a7a00] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Our Mission
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-snug">
            Bridging Ancient Wisdom with Modern Wellness
          </h2>
          <p className="text-gray-600 text-lg leading-relaxed mb-5">
            For centuries, herbal traditions have guided communities toward
            balance and vitality. At Dot-Herbs, we honour that heritage by
            making it accessible, transparent, and trustworthy for the modern
            world.
          </p>
          <p className="text-gray-600 text-lg leading-relaxed">
            From the highland farms of Morocco to the tropical forests of Sri
            Lanka, we trace every ingredient back to its origin and share that
            journey with you — because you deserve to know exactly what you're
            putting in your body.
          </p>
        </div>
        <div className="relative">
          <div className="bg-gradient-to-br from-[#f0f7e6] to-[#d4edaa] rounded-3xl p-10 text-center">
            <FaLeaf className="w-24 h-24 text-[#68a300] mx-auto mb-4 opacity-80" />
            <blockquote className="text-xl font-serif italic text-gray-700 leading-relaxed">
              "Let food be thy medicine and medicine be thy food."
            </blockquote>
            <p className="text-sm text-gray-500 mt-4">— Hippocrates</p>
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-[#68a300]/10 rounded-2xl -z-10" />
          <div className="absolute -top-4 -left-4 w-16 h-16 bg-[#68a300]/10 rounded-xl -z-10" />
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block bg-[#68a300]/10 text-[#4a7a00] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              What We Stand For
            </span>
            <h2 className="text-4xl font-bold text-gray-900">
              Our Core Values
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((v) => (
              <div
                key={v.title}
                className="bg-white rounded-2xl p-8 shadow-soft hover:shadow-medium transition-shadow group"
              >
                <div className="w-14 h-14 bg-[#68a300]/10 text-[#68a300] rounded-xl flex items-center justify-center mb-5 group-hover:bg-[#68a300] group-hover:text-white transition-colors">
                  {v.icon}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {v.title}
                </h3>
                <p className="text-gray-500 leading-relaxed text-sm">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <span className="inline-block bg-[#68a300]/10 text-[#4a7a00] text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            The People Behind the Plants
          </span>
          <h2 className="text-4xl font-bold text-gray-900">Meet Our Team</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {team.map((member) => (
            <div key={member.name} className="text-center group">
              <div className="w-24 h-24 bg-gradient-to-br from-[#68a300] to-[#4a7a00] rounded-full flex items-center justify-center mx-auto mb-5 shadow-medium">
                <span className="text-white text-2xl font-bold">
                  {member.avatar}
                </span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
              <p className="text-[#68a300] font-semibold text-sm mb-3">
                {member.role}
              </p>
              <p className="text-gray-500 leading-relaxed text-sm">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Certifications */}
      <section className="bg-[#68a300] py-14">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-white font-semibold text-lg mb-10 opacity-90">
            Trusted, certified, and independently verified
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {certifications.map((cert) => (
              <div
                key={cert.label}
                className="flex flex-col items-center gap-3 bg-white/10 rounded-2xl px-6 py-6 text-white hover:bg-white/20 transition-colors"
              >
                {cert.icon}
                <span className="text-sm font-semibold text-center leading-snug">
                  {cert.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <FaUsers className="w-12 h-12 text-[#68a300] mx-auto mb-5 opacity-80" />
        <h2 className="text-4xl font-bold text-gray-900 mb-5">
          Join the Dot-Herbs Community
        </h2>
        <p className="text-gray-600 text-lg leading-relaxed mb-10 max-w-xl mx-auto">
          Thousands of people have already made the switch to natural wellness.
          Start your journey today — browse our full range or reach out to our
          specialists.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 bg-[#68a300] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#5a8f00] transition-colors"
          >
            Shop Now
          </Link>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center gap-2 border-2 border-gray-300 text-gray-700 font-semibold px-8 py-3 rounded-lg hover:border-[#68a300] hover:text-[#68a300] transition-colors"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
