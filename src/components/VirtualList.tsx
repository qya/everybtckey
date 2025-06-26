import React, { useEffect, useRef, useCallback, useState } from 'react';
import { KeyEntry } from './KeyEntry';
import { BitcoinKey } from '../utils/bitcoin';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface VirtualListProps {
  keys: BitcoinKey[];
  loading: boolean;
  loadMore: () => void;
  hasMore: boolean;
  totalVirtualKeys: number;
  onCheckBalance: (key: BitcoinKey) => Promise<void>;
}

const ITEM_HEIGHT = 60; // Height of each collapsed item
const BUFFER_SIZE = 10; // Increased buffer size for better performance
const OVERSCAN = 5; // Additional items to render outside viewport

export function VirtualList({ keys, loading, loadMore, hasMore, totalVirtualKeys, onCheckBalance }: VirtualListProps) {
  const { t } = useLanguage();
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingRef = useRef<HTMLDivElement>(null);
  const isLoadingMore = useRef(false);
  
  // Calculate visible range with better logic
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE);
  const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER_SIZE * 2 + OVERSCAN;
  const endIndex = Math.min(keys.length - 1, startIndex + visibleCount);
  
  const visibleItems = keys.slice(startIndex, endIndex + 1);
  
  // Calculate total height and offset
  const totalHeight = Math.max(keys.length * ITEM_HEIGHT, containerHeight);
  const offsetY = startIndex * ITEM_HEIGHT;
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const newScrollTop = element.scrollTop;
    const scrollHeight = element.scrollHeight;
    const clientHeight = element.clientHeight;
    
    setScrollTop(newScrollTop);
    
    // Only trigger loading if we have hasMore (not in search mode)
    if (!hasMore) return;
    
    // Check if we're near the bottom and need to load more
    const scrollPercentage = (newScrollTop + clientHeight) / scrollHeight;
    const nearBottom = scrollPercentage > 0.8; // Load when 80% scrolled
    
    // Also check if we're approaching the end of loaded keys
    const currentVirtualIndex = Math.floor(newScrollTop / ITEM_HEIGHT);
    const approachingEnd = currentVirtualIndex > keys.length - 20;
    
    if ((nearBottom || approachingEnd) && hasMore && !loading && !isLoadingMore.current) {
      isLoadingMore.current = true;
      loadMore();
      setTimeout(() => {
        isLoadingMore.current = false;
      }, 1000);
    }
  }, [keys.length, hasMore, loading, loadMore]);
  
  // Intersection observer for loading more content
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || !hasMore) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !isLoadingMore.current) {
          isLoadingMore.current = true;
          loadMore();
          setTimeout(() => {
            isLoadingMore.current = false;
          }, 1000);
        }
      },
      {
        rootMargin: '300px', // Start loading 300px before reaching the element
        threshold: 0.1,
      }
    );
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, loadMore]);
  
  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(rect.height);
      }
    };
    
    updateHeight();
    const resizeObserver = new ResizeObserver(updateHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    return () => {
      resizeObserver.disconnect();
    };
  }, []);
  
  // Cleanup intersection observer
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);
  
  // Reset loading flag when keys change
  useEffect(() => {
    if (keys.length > 0) {
      isLoadingMore.current = false;
    }
  }, [keys.length]);
  
  if (keys.length === 0 && loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
        <div className="flex items-center justify-center py-12 sm:py-16">
          <div className="flex items-center space-x-3">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 animate-spin" />
            <span className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">{t('generating')}</span>
          </div>
        </div>
      </div>
    );
  }
  
  if (keys.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors">
        <div className="text-center py-12 sm:py-16 px-4">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto" />
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">{t('noKeysAvailable')}</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            {t('unableToLoad')}
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden transition-colors">
      <div
        ref={containerRef}
        className="h-[500px] sm:h-[600px] overflow-auto"
        onScroll={handleScroll}
        style={{ scrollBehavior: 'auto' }}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleItems.map((key, index) => {
              const actualIndex = startIndex + index;
              const virtualIndex = actualIndex;
              const isLast = actualIndex === keys.length - 1;
              
              return (
                <div
                  key={key.id}
                  ref={isLast && hasMore ? lastElementRef : undefined}
                  style={{ minHeight: ITEM_HEIGHT }}
                >
                  <KeyEntry 
                    bitcoinKey={key} 
                    index={virtualIndex} 
                    onCheckBalance={onCheckBalance}
                  />
                </div>
              );
            })}
          </div>
        </div>
        
        {loading && hasMore && (
          <div 
            ref={loadingRef} 
            className="flex items-center justify-center py-3 sm:py-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800"
            style={{ 
              position: 'sticky',
              bottom: 0,
              zIndex: 10
            }}
          >
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 animate-spin" />
              <span className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm">{t('loadingMore')}</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Status bar */}
      <div className="px-3 sm:px-4 py-2 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 border-t flex items-center justify-between transition-colors">
        <span className="truncate">
          {t('showing')} {startIndex + 1}-{Math.min(endIndex + 1, keys.length)} {t('of')} {keys.length} {t('loadedKeys')}
        </span>
        {!hasMore && keys.length > 0 && (
          <span className="text-orange-600 dark:text-orange-400 font-medium text-xs whitespace-nowrap ml-2">{t('searchResults')}</span>
        )}
      </div>
    </div>
  );
}