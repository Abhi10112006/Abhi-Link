import React from 'react';

export const PremiumBackground = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#e6e1dc] pointer-events-none">
      {/* Sacred Geometry / Mandala Pattern inspired by ancient architecture */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{ 
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='120' height='120' viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cg stroke='%238b7355' stroke-width='1' fill='none'%3E%3Cpath d='M60 0 L120 60 L60 120 L0 60 Z'/%3E%3Ccircle cx='60' cy='60' r='42'/%3E%3Ccircle cx='60' cy='60' r='30'/%3E%3Cpath d='M60 18 L60 102 M18 60 L102 60'/%3E%3Cpath d='M30 30 L90 90 M30 90 L90 30'/%3E%3Ccircle cx='60' cy='60' r='2' fill='%238b7355'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '120px 120px',
          backgroundPosition: 'center'
        }}
      />
      {/* Subtle radial gradient to focus center */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#e6e1dc_100%)] opacity-60" />
    </div>
  );
};
