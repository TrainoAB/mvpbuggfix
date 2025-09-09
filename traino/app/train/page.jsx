'use client';
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useMotionValueEvent, useTransform } from 'framer-motion';
import Navigation from '@/app/components/Menus/Navigation';
import TrainCategory from '@/app/components/TrainCategory';
import { getCategories, setCookie } from '@/app/functions/functions';
import { useAppState } from '@/app/hooks/useAppState';
import { debounce } from '@/app/functions/functions';
import { InformationModal } from '@/app/components/InformationModal';
import TrainCategories from '@/app/components/TrainCategories/TrainCategories';
import Loader from '@/app/components/Loader';
import EventModal from './EventModal';
import './page.css';

export default function Train() {
  const {
    isLoggedin,
    userData,
    baseUrl,
    sessionObject,
    traincategories,
    setTraincategories,
    DEBUG,
    useTranslations,
    language,
  } = useAppState();
  const [initialLoad, setInitialLoad] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [fetchCategories, setFetchCategories] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [firstMount, setFirstMount] = useState(true);
  const [filteredTrainCategories, setFilteredTrainCategories] = useState([]);
  const [trainerDetails, setTrainerDetails] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Batch size
  const inputRef = useRef(null);
  const ref = useRef(null);
  const router = useRouter();

  const { scrollYProgress } = useScroll({ container: ref });

  const { translate } = useTranslations('train', language);

  // Add global translations for category names
  const { translate: translateGlobal } = useTranslations('global', language);
  const { translate: translateGlobalSV } = useTranslations('global', 'sv');
  const { translate: translateGlobalEN } = useTranslations('global', 'en');

  useEffect(() => {
    const handleNavigation = () => {
      if (isLoggedin.current && userData.current && userData.current.usertype === 'trainer') {
        router.push(`/trainer/@${userData.current.alias}`);
      }
    };

    handleNavigation();

    const handlePageShow = (event) => {
      if (event.persisted) {
        handleNavigation();
      }
    };

    if (typeof window === 'undefined') return; // Prevent SSR issues

    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, [isLoggedin, userData, router]);

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const previous = scrollYProgress.getPrevious();

    if (latest > previous && latest > 0.05 && latest < 0.9) {
      setHidden(true);
      setShowSearch(false);
    } else if (latest < previous && latest !== 0) {
      setShowSearch(true);
    } else if (latest > previous && latest > 0.9) {
      setHidden(true);
      setShowSearch(true);
    } else {
      setHidden(false);
      setShowSearch(false);
    }
  });

  useEffect(() => {
    setHidden(false);
    setShowSearch(false);
    setCookie('category_link', '');
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!fetchCategories) {
        if (traincategories.length === 0) {
          await getCategories(setTraincategories); // Wait for getCategories to finish
          setLoading(false);
          setFetchCategories(true);
        } else {
          setFilteredTrainCategories(traincategories);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [fetchCategories, traincategories, setTraincategories]);

  // Move cache outside component to persist across renders
  const cache = useRef(new Map()).current;

  // Use useRef for the debounce timer
  const debounceTimerRef = useRef(null);

  const fetchTrainerDetails = useCallback(
    async (searchTerm, page) => {
      const cacheKey = `${searchTerm}-${page}`;
      if (cache.has(cacheKey)) {
        const cachedData = cache.get(cacheKey);
        setTrainerDetails(cachedData.users);
        setTotalResults(cachedData.totalResults || 0);
        setTotalPages(cachedData.totalPages || 0);
        setCurrentPage(page);
        setSearching(false);
        return cachedData;
      }
      setSearching(true);
      try {
        const response = await fetch(`${baseUrl}/api/proxy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sessionObject.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: `${baseUrl}/api/map/trainer?querytrainer=${encodeURIComponent(
              searchTerm,
            )}&page=${page}&limit=${itemsPerPage}`,
            method: 'GET',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        DEBUG && console.log('Trainer details:', data);

        setTrainerDetails(data.users || []);
        DEBUG && console.log(data.users);
        setTotalResults(data.totalResults || 0);
        setTotalPages(data.totalPages || 0);
        setCurrentPage(page);

        setSearching(false); // Ensure searching state is reset
        setInitialLoad(false); // Ensure initial load state is reset

        cache.set(cacheKey, data); // Cache the result

        return data;
      } catch (error) {
        console.error('Error fetching data:', error);
        setTrainerDetails([]);
        setTotalResults(0);
        setTotalPages(0);
        setSearching(false); // Ensure searching state is reset on error
        setInitialLoad(false); // Ensure initial load state is reset on error
        throw error;
      } finally {
        setSearching(false);
      }
    },
    [baseUrl, sessionObject, cache, DEBUG],
  );

  // Custom debounce with cancellation support
  const debouncedFetchTrainerDetails = useMemo(() => {
    const debouncedFunc = (query) => {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = setTimeout(() => {
        fetchTrainerDetails(query, 1);
      }, 500);
    };

    debouncedFunc.cancel = () => {
      clearTimeout(debounceTimerRef.current);
    };

    return debouncedFunc;
  }, [fetchTrainerDetails]);

  const handleInputChange = () => {
    const inputValue = inputRef.current.value.toLowerCase().trim();
    setSearchQuery(inputValue);

    if (inputValue.length === 0) {
      // Cancel any pending debounced calls
      debouncedFetchTrainerDetails.cancel();
      setSearching(false);
      setFilteredTrainCategories(traincategories); // Show all categories if search is cleared
      setTrainerDetails([]); // Clear trainer details
      setFilteredTrainerDetails([]); // Clear filtered trainer details
      setTotalResults(0);
      setTotalPages(0);
      setCurrentPage(1);
    } else if (inputValue.length >= 3) {
      setSearching(true);
      debouncedFetchTrainerDetails(inputValue); // Only trigger API call after debounce delay
    } else {
      // For 1-2 characters, only show category filtering, no trainer search
      // Cancel any pending debounced calls
      debouncedFetchTrainerDetails.cancel();
      setSearching(false);
      setTrainerDetails([]);
      setFilteredTrainerDetails([]);
      setTotalResults(0);
      setTotalPages(0);
      setCurrentPage(1);
    }

    // Filter categories immediately based on the input value - supporting multilingual search
    const filteredCategories = traincategories.filter((category) => {
      // Check if the search term matches the original category name
      const matchesOriginalName = category.category_name?.toLowerCase().includes(inputValue) || false;

      // Check if the search term matches translated names (Swedish and English)
      if (!category.category_link) {
        return matchesOriginalName;
      }

      const categoryKey = `cat_${category.category_link}`;
      const swedishTranslation = translateGlobalSV(categoryKey)?.toLowerCase() || '';
      const englishTranslation = translateGlobalEN(categoryKey)?.toLowerCase() || '';

      const matchesSwedish = swedishTranslation.includes(inputValue);
      const matchesEnglish = englishTranslation.includes(inputValue);

      // Return true if any translation matches
      return matchesOriginalName || matchesSwedish || matchesEnglish;
    });
    setFilteredTrainCategories(filteredCategories); // Update state to display filtered categories
  };

  const firstTime = {
    header: translate('first_train_title', language),
    text: translate('first_train_text', language),
  };

  // Render sports categories initially or filtered based on search input
  //const renderCategories = searchQuery.length >= 3 ? filteredTrainCategories : traincategories;
  const renderCategories = useMemo(() => {
    return searchQuery.length >= 3 ? filteredTrainCategories : traincategories;
  }, [searchQuery, filteredTrainCategories, traincategories]);

  const [filteredTrainerDetails, setFilteredTrainerDetails] = useState([]);

  useEffect(() => {
    DEBUG && console.log('Filtering:', trainerDetails);
    if (trainerDetails && trainerDetails.length > 0 && searchQuery.length >= 3) {
      // Split the search query into an array of words
      const searchTerms = searchQuery
        .trim()
        .split(/\s+/)
        .map((term) => term.toLowerCase());

      const filtered = trainerDetails.filter((trainer) => {
        // Ensure the trainer fields (firstname, lastname, alias) are not null
        if (trainer.firstname !== null && trainer.lastname !== null && trainer.alias !== null) {
          // Check if each search term is included in any of the trainer's fields
          return searchTerms.every(
            (term) =>
              trainer.firstname.toLowerCase().includes(term) ||
              trainer.lastname.toLowerCase().includes(term) ||
              trainer.alias.toLowerCase().includes(term),
          );
        }
        return false;
      });

      // Deduplicate filtered results based on a unique property (e.g., id)
      const deduplicated = Array.from(new Map(filtered.map((trainer) => [trainer.id, trainer])).values());

      setFilteredTrainerDetails(deduplicated); // Update state with filtered and deduplicated list
    } else if (searchQuery.length < 3) {
      // Clear filtered trainer details if search query is too short
      setFilteredTrainerDetails([]);
    }
  }, [searchQuery, trainerDetails, DEBUG]);
  // Re-run effect whenever `searchQuery` or `trainerDetails` changes

  // Handle pagination
  const handlePageChange = useCallback(
    (newPage) => {
      if (newPage >= 1 && newPage <= totalPages) {
        fetchTrainerDetails(searchQuery, newPage);
      }
    },
    [searchQuery, totalPages, fetchTrainerDetails],
  );

  // MARK: Markup
  return (
    <>
      <main ref={ref} id="train" className="train-wrapper-one">
        <EventModal />
        <InformationModal data={firstTime} pageName="train" />
        {loading ? (
          <Loader />
        ) : (
          <div className="container">
            <motion.div
              variants={{ visible: { y: 0 }, hidden: { y: '-100%' }, showsearch: { y: '-50%' } }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              animate={showSearch ? 'showsearch' : hidden ? 'hidden' : 'visible'}
              className="input-group-train-page"
              id="search-group-train"
            >
              <div className="logo-train" />
              <h3>{translate('slogan', language)}</h3>

              <div className="search-container">
                <div className="icon-search-train"></div>
                <input
                  ref={inputRef}
                  className="input-train"
                  type="search"
                  id="search"
                  name="search"
                  placeholder={translate('searchbar', language)}
                  autoComplete="off"
                  onChange={handleInputChange}
                />
              </div>
            </motion.div>
            <TrainCategories
              renderCategories={renderCategories}
              filteredTrainerDetails={filteredTrainerDetails}
              handlePageChange={handlePageChange}
              currentPage={currentPage}
              totalPages={totalPages}
            />
            {searching ? (
              <div className="searching">
                <Loader />
              </div>
            ) : (
              // Show no results only when actively searching and no results found
              searchQuery.length >= 3 &&
              filteredTrainerDetails.length === 0 &&
              filteredTrainCategories.length === 0 &&
              !searching && (
                <div className="no-results">
                  <h2>{translateGlobal('noresultsfound')}</h2>
                </div>
              )
            )}
          </div>
        )}
        <Navigation />
      </main>
    </>
  );
}
