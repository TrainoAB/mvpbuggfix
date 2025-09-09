import { useState, useEffect, useRef } from 'react';

// Swiper Imports
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import { Navigation as SwiperNavigation, Pagination } from 'swiper/modules';

const AboutContributors = () => {
    const contributors = [
        {
          name: 'Lennart S.',
          image: 'about-placeholder.png',
          title: 'Leaflet, JavaScript & Stripe'
        },
        {
          name: 'Johan Svensson',
          image: 'about-placeholder.png',
          title: 'Vercel, GitHub & Stripe'
        },
        {
          name: 'Daniel Westergren',
          image: 'about-placeholder.png',
          title: 'HTML, CSS & S3'
        },
        {
          name: 'Therese Weidenstedt',
          image: 'about-placeholder.png',
          title: 'HTML, CSS & JavaScript'
        },
        {
          name: 'Sofia Hjerpe',
          image: 'about-placeholder.png',
          title: 'HTML, CSS & JavaScript'
        },
        {
          name: 'Erik Wistrand',
          image: 'about-placeholder.png',
          title: 'HTML, CSS, JavaScript & Stripe'
        },
        {
          name: 'Henrik Enqvist',
          image: 'about-placeholder.png',
          title: 'HTML, CSS & JavaScript'
        },
        {
          name: 'Jonas Nilsson',
          image: 'about-placeholder.png',
          title: 'HTML, CSS & JavaScript'
        },
        {
          name: 'Khaliil Hassan',
          image: 'about-placeholder.png',
          title: 'HTML, CSS & JavaScript'
        },
        {
          name: 'Daniel Björlund',
          image: 'about-placeholder.png',
          title: 'HTML, CSS & JavaScript'
        },
        {
          name: "Mohammad 'Cyrus' Shahbazi",
          image: 'about-placeholder.png',
          title: 'HTML, CSS & JavaScript'
        },
        {
          name: 'Peter Nydahl',
          image: 'about-placeholder.png',
          title: 'HTML, CSS & JavaScript'
        }
    ];

    const swiperRef = useRef(null);
    const svgRef = useRef(null);
    const [svgWidth, setSvgWidth] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
  
    // Update pagination based on the number of slides and slidesPerView
    const updatePagination = (swiper) => {
      const slidesPerView = swiper.params.slidesPerView === 'auto' ? swiper.slidesPerViewDynamic() : swiper.params.slidesPerView;
      const newTotalPages = Math.ceil(swiper.slides.length / slidesPerView);
      setTotalPages(newTotalPages);
    };
  
    // Update the SVG width dynamically based on the number of bullets
    const updateSvgWidth = () => {
      const circles = svgRef.current.querySelectorAll('circle');
      const bulletSpacing = 18; // Adjust the spacing for the bullets
      const newWidth = circles.length * bulletSpacing;
      setSvgWidth(newWidth);
    };
  
    // Handle navigation button visibility based on whether there is more than one "page" of slides
    const toggleNavigationVisibility = (swiper) => {
      const prevButton = document.querySelector('.prev');
      const nextButton = document.querySelector('.next');
      const isSinglePage = swiper.isBeginning && swiper.isEnd;
  
      if (isSinglePage) {
        prevButton.style.display = 'none';
        nextButton.style.display = 'none';
      } else {
        prevButton.style.display = 'block';
        nextButton.style.display = 'block';
      }
    };
  
    // Handle resize event to update Swiper layout and pagination
    const handleResize = (swiper) => {
      swiper.update();
      updatePagination(swiper);
      toggleNavigationVisibility(swiper);
    };
  
    // Resize event listener for both pagination width and Swiper
    useEffect(() => {
      const swiper = swiperRef.current?.swiper;
      if (swiper) {
        updatePagination(swiper);
        swiper.on('resize', () => handleResize(swiper));
        swiper.on('slideChange', () => toggleNavigationVisibility(swiper));
      }
  
      return () => {
        const swiper = swiperRef.current?.swiper;
        if (swiper) {
          swiper.off('resize', handleResize);
          swiper.off('slideChange', toggleNavigationVisibility);
        }
      };
    }, [contributors]); // Re-run on contributor updates
  
    // Initialize pagination bullets and SVG width
    useEffect(() => {
      updateSvgWidth();
      window.addEventListener('resize', updateSvgWidth);
      return () => window.removeEventListener('resize', updateSvgWidth);
    }, [totalPages]);

    return (
        <div className="content scroll">
        <h4>Contributors</h4>
        <div className="team-scroll">
            <span className="icon-chevron prev" role="button"></span>

            <Swiper
            ref={swiperRef}
            spaceBetween={20}
            slidesPerView="auto"
            slidesPerGroupAuto={true}
            modules={[SwiperNavigation, Pagination]}
            navigation={{
                nextEl: '.next',
                prevEl: '.prev',
            }}
            pagination={{
                el: '.team-scroll-indicator',
                clickable: true,
                renderBullet: (index, className) => `<circle class="${className}" cx="${5.5 + 18 * index}" cy="5.5" r="5.5" fill="${'#575757'}"></circle>`,
            }}
            onResize={(swiper) => handleResize(swiper)}
            onBreakpoint={() => swiperRef.current.swiper.update()}
            onInit={(swiper) => toggleNavigationVisibility(swiper)}
            onSlideChange={(swiper) => toggleNavigationVisibility(swiper)}
            >
            {contributors.map((contributor, index) => (
                <SwiperSlide key={index} className="swiper-slide-custom">
                <div className="team-scroll-page">
                    <div className="team-member">
                    <img src={"./assets/" + contributor.image} alt={contributor.name} title={contributor.name} />
                    <div>
                        <h5>{contributor.name}</h5>
                        <p className="description-text">{contributor.title}</p>
                    </div>
                    </div>
                </div>
                </SwiperSlide>
            ))}
            </Swiper>

            <span className="icon-chevron next" role="button"></span>
        </div>
        <svg
        ref={svgRef}
        className="team-scroll-indicator"
        width={svgWidth}
        viewBox={`0 0 ${svgWidth} 11`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        ></svg>
    </div>
    )
};

export default AboutContributors;