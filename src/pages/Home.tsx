
import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Leaf, BarChart3, LineChart, PlaneTakeoff } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

const Home = () => {
  const { isAuthenticated } = useAuth();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 0.2], [0, -50]);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize any animations or effects
    const animateElements = () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      elements.forEach((el, index) => {
        if (el instanceof HTMLElement) {
          el.style.opacity = '0';
          el.style.transform = 'translateY(20px)';
          setTimeout(() => {
            el.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, 100 * (index + 1));
        }
      });
    };

    animateElements();
  }, []);

  const features = [
    {
      title: "AI-Powered Recommendations",
      description: "Advanced algorithms analyze your farm data and market conditions to suggest the most profitable crops to plant.",
      icon: <Leaf className="h-6 w-6 text-crop-primary" />,
    },
    {
      title: "Data-Driven Insights",
      description: "Make informed decisions based on personalized analytics tailored to your specific land, resources, and local market.",
      icon: <BarChart3 className="h-6 w-6 text-crop-primary" />,
    },
    {
      title: "Market Trend Analysis",
      description: "Stay ahead with real-time data on crop prices and demand forecasts to maximize your farming profits.",
      icon: <LineChart className="h-6 w-6 text-crop-primary" />,
    },
    {
      title: "Quick Implementation",
      description: "Get started in minutes by entering your farm details and receive instant crop recommendations.",
      icon: <PlaneTakeoff className="h-6 w-6 text-crop-primary" />,
    },
  ];

  return (
    <>
      <Navbar authenticated={isAuthenticated} />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-crop-light pt-32 pb-20 md:pt-40 md:pb-32">
          <div
            className="absolute inset-0 bg-[url('/lovable-uploads/dd005834-491b-4f42-9a07-be4ab6aff5c3.png')] bg-center bg-cover opacity-10"
            style={{ filter: "blur(8px)" }}
          />
          
          <motion.div 
            ref={headerRef} 
            style={{ opacity, y }}
            className="container mx-auto px-4 relative z-10"
          >
            <div className="text-center max-w-4xl mx-auto">
              <div className="inline-block bg-crop-accent/60 text-crop-primary text-sm font-medium rounded-full px-3 py-1 mb-6">
                AI-Powered Crop Recommendations
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
                Smarter Farming Decisions with{" "}
                <span className="text-gradient">CropAdvisor</span>
              </h1>
              
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Maximize your farm's potential with data-driven crop recommendations
                tailored to your land, resources, and market conditions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to={isAuthenticated ? "/input" : "/signup"}>
                  <Button size="lg" className="w-full sm:w-auto bg-crop-primary hover:bg-crop-primary/90">
                    Get Started
                  </Button>
                </Link>
                
                <Link to={isAuthenticated ? "/dashboard" : "/signin"}>
                  <Button size="lg" variant="outline" className="w-full sm:w-auto">
                    {isAuthenticated ? "Go to Dashboard" : "Sign In"}
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
        
        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 animate-on-scroll">Why Choose CropAdvisor?</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto animate-on-scroll">
                Our intelligent platform combines agricultural expertise with cutting-edge technology 
                to help farmers make data-driven decisions.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="p-6 border rounded-lg hover:border-crop-primary/50 transition-all duration-300 hover:shadow-sm animate-on-scroll"
                >
                  <div className="w-12 h-12 bg-crop-accent rounded-full flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-medium mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-20 bg-crop-light">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 animate-on-scroll">How It Works</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto animate-on-scroll">
                Get personalized crop recommendations in three simple steps
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center animate-on-scroll">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <span className="text-2xl font-bold text-crop-primary">1</span>
                </div>
                <h3 className="text-xl font-medium mb-2">Input Farm Data</h3>
                <p className="text-muted-foreground">
                  Enter details about your land size, soil type, water resources, and budget.
                </p>
              </div>
              
              <div className="text-center animate-on-scroll">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <span className="text-2xl font-bold text-crop-primary">2</span>
                </div>
                <h3 className="text-xl font-medium mb-2">AI Analysis</h3>
                <p className="text-muted-foreground">
                  Our AI processes your data along with current market conditions to generate recommendations.
                </p>
              </div>
              
              <div className="text-center animate-on-scroll">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <span className="text-2xl font-bold text-crop-primary">3</span>
                </div>
                <h3 className="text-xl font-medium mb-2">Get Results</h3>
                <p className="text-muted-foreground">
                  Receive a detailed analysis with crop recommendations prioritized by profitability and suitability.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 bg-crop-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6 animate-on-scroll">
              Ready to Optimize Your Farm's Potential?
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90 animate-on-scroll">
              Join thousands of farmers who are making data-driven decisions to increase their yields and profits.
            </p>
            <Link to={isAuthenticated ? "/input" : "/signup"}>
              <Button size="lg" variant="secondary" className="animate-on-scroll">
                Get Started for Free
              </Button>
            </Link>
          </div>
        </section>
      </main>
      
      <Footer />
    </>
  );
};

export default Home;
