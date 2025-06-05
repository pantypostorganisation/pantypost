// src/components/homepage/FeaturesSection.tsx
'use client';

import { motion } from 'framer-motion';
import { itemVariants, containerVariants, shapeVariants, VIEWPORT_CONFIG } from '@/utils/motion.config';
import { PLATFORM_FEATURES } from '@/utils/homepage-constants';

export default function FeaturesSection() {
  return (
    <div className="bg-gradient-to-b from-black to-[#101010] pt-16 pb-16 md:pt-20 md:pb-20 relative z-30 overflow-hidden">
      {/* Content container */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <motion.h2
          className="text-3xl md:text-4xl lg:text-5xl font-bold text-center text-white mb-16 tracking-tight"
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true, amount: 0.5 }} 
          variants={itemVariants}
        >
          How <span className="text-[#ff950e]">PantyPost</span> Works
        </motion.h2>
        
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial="hidden" 
          whileInView="visible" 
          viewport={VIEWPORT_CONFIG} 
          variants={containerVariants}
        >
          {PLATFORM_FEATURES.map((feature, index) => (
            <motion.div
              key={index}
              className="group relative bg-[#131313] rounded-xl p-6 transition-all duration-300 border border-white/10 hover:border-[#ff950e]/50 hover:scale-[1.03] hover:shadow-2xl hover:shadow-[#ff950e]/10"
              variants={itemVariants}
              whileHover={{ y: -8 }}
            >
              {/* Shine effect */}
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <div className="absolute inset-0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
              </div>
              
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-[#ff950e]/10 to-[#ff950e]/5 rounded-full flex items-center justify-center mb-5 border border-[#ff950e]/20">
                  <feature.icon className="h-6 w-6 text-[#ff950e]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
      
      {/* Shape Divider 2 (Background Glow) */}
      <motion.div
        className="absolute -bottom-48 right-[-20%] md:right-[-10%] w-[120%] md:w-[80%] h-96 pointer-events-none z-0"
        initial="hidden" 
        whileInView="visible" 
        viewport={{ once: true, amount: 0.2 }} 
        variants={shapeVariants}
      >
        <div className="absolute inset-0 bg-gradient-radial from-[#ff950e]/10 via-transparent to-transparent blur-3xl rounded-[70%_30%_40%_60%/50%_60%_40%_50%] animate-spin-slow"></div>
      </motion.div>
    </div>
  );
}