// Slideshow function
(function () {
    const slides = document.querySelectorAll("#slideshow .slide");
    const animationDuration = 2000; // Animation duration (in ms)
    const intervalDuration = 5000; // Time between slides (in ms)
  
    let currentIndex = 0;
    let previousIndex = null;
    let isAnimating = false;
  
    function updateSlides() {
      slides.forEach((slide, index) => {
        if (index === currentIndex) {
          slide.style.opacity = "1";
          slide.style.zIndex = "1";
        } else if (index === previousIndex && isAnimating) {
          slide.style.opacity = "1"; // Both images opaque during animation
          slide.style.zIndex = "0";
        } else {
          slide.style.opacity = "0";
          slide.style.zIndex = "0";
        }
      });
    }
  
    function nextSlide() {
      if (isAnimating) return;
  
      previousIndex = currentIndex;
      currentIndex = (currentIndex + 1) % slides.length;
      isAnimating = true;
  
      updateSlides();
  
      setTimeout(() => {
        isAnimating = false;
        updateSlides(); // Ensure final state after animation
      }, animationDuration);
    }
  
    // Start the slideshow
    setInterval(nextSlide, intervalDuration);
  
    // Initialize
    updateSlides();
  })();
  
