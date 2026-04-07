import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Zap, Bell, Users, MapPin, BarChart3, Clock, ArrowRight, Star, CheckCircle } from 'lucide-react';

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } };

const features = [
  { icon: Zap, title: 'One-Tap SOS', desc: 'Instantly alert your security team with a single tap emergency button.' },
  { icon: Bell, title: 'Real-Time Alerts', desc: 'Live notifications via Socket.io keep everyone informed instantly.' },
  { icon: MapPin, title: 'Location Tracking', desc: 'Pinpoint exact incident locations within your property.' },
  { icon: Users, title: 'Team Coordination', desc: 'Assign staff, track response times, and manage incidents as a team.' },
  { icon: BarChart3, title: 'Analytics Dashboard', desc: 'Monitor trends, response times, and team performance in real-time.' },
  { icon: Clock, title: 'Incident Timeline', desc: 'Complete audit trail with timestamped actions for every incident.' },
];

const stats = [
  { value: '< 30s', label: 'Average Response Time' },
  { value: '500+', label: 'Hotels Protected' },
  { value: '99.9%', label: 'System Uptime' },
  { value: '50K+', label: 'Incidents Resolved' },
];

const testimonials = [
  { name: 'Sarah Chen', role: 'Hotel Manager, Grand Pacific', text: 'CrisisGuard reduced our emergency response time by 70%. The real-time notifications are a game-changer.' },
  { name: 'Michael Torres', role: 'Security Director, Luxe Resorts', text: 'The incident management system is intuitive and powerful. Our team adopted it immediately.' },
  { name: 'Priya Sharma', role: 'Operations Head, Coastal Hotels', text: 'Having a centralized emergency system has transformed how we handle guest safety.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">CrisisGuard</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#stats" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Statistics</a>
            <a href="#testimonials" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Testimonials</a>
            <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-foreground hover:text-primary transition-colors">Sign In</Link>
            <Link to="/login" className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
            <Zap className="w-4 h-4" /> Trusted by 500+ Hospitality Businesses
          </div>
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            Rapid Emergency Coordination for Hotels & Hospitality
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto">
            Protect your guests and staff with real-time crisis management. From SOS alerts to incident resolution — all in one platform.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all hover:scale-105">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="px-6 py-3 border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-accent transition-colors">
              Request Demo
            </button>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ duration: 0.5 }} className="text-center mb-14">
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">Everything You Need</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Comprehensive tools to handle any crisis situation with speed and precision.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial="hidden" whileInView="visible" viewport={{ once: true }}
              variants={fadeUp} transition={{ delay: i * 0.1, duration: 0.4 }}
              className="bg-card rounded-2xl border border-border p-6 card-shadow hover:card-shadow-lg transition-shadow group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="bg-primary py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(s => (
            <motion.div key={s.label} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
              <div className="font-display text-3xl md:text-4xl font-bold text-primary-foreground mb-1">{s.value}</div>
              <div className="text-sm text-primary-foreground/70">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <h2 className="font-display text-3xl font-bold text-foreground mb-6">Why Choose CrisisGuard?</h2>
            <div className="space-y-4">
              {['Reduce response times by up to 70%', 'Complete incident audit trail', 'Role-based access for your entire team', 'Real-time communication channels', 'Works on any device, anywhere'].map(b => (
                <div key={b} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-success mt-0.5 shrink-0" />
                  <span className="text-foreground">{b}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: 0.2 }}
            className="bg-card rounded-2xl border border-border p-8 card-shadow-lg"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-xl">
                <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />
                <span className="text-sm font-medium text-foreground">Active Emergency — Fire in Kitchen</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-warning/10 rounded-xl">
                <div className="w-3 h-3 rounded-full bg-warning" />
                <span className="text-sm font-medium text-foreground">In Progress — Medical, Room 412</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-success/10 rounded-xl">
                <div className="w-3 h-3 rounded-full bg-success" />
                <span className="text-sm font-medium text-foreground">Resolved — Suspicious Activity</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="max-w-6xl mx-auto px-6 py-20">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">Trusted by Industry Leaders</h2>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <motion.div key={t.name} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl border border-border p-6 card-shadow"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-warning text-warning" />)}
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">"{t.text}"</p>
              <div>
                <div className="font-semibold text-sm text-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="max-w-6xl mx-auto px-6 py-20">
        <div className="bg-card rounded-2xl border border-border p-8 md:p-12 card-shadow-lg text-center">
          <h2 className="font-display text-3xl font-bold text-foreground mb-3">Ready to Protect Your Property?</h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">Get started in minutes. No credit card required.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all hover:scale-105">
              Start Free Trial <ArrowRight className="w-4 h-4" />
            </Link>
            <button className="px-6 py-3 border border-border text-foreground rounded-xl text-sm font-semibold hover:bg-accent transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-foreground">CrisisGuard</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 CrisisGuard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
