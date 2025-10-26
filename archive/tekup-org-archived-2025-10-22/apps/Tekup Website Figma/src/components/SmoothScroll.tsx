'use client';

export const scrollToSection = (sectionId: string) => {
  const element = document.getElementById(sectionId.replace('#', ''));
  if (element) {
    const navHeight = 80; // Height of fixed navigation
    const targetPosition = element.offsetTop - navHeight;
    
    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  }
};

export const handleNavClick = (href: string, callback?: () => void) => {
  if (href.startsWith('#')) {
    scrollToSection(href);
    callback?.();
  } else {
    // External link or other functionality
    console.log('Navigate to:', href);
    callback?.();
  }
};