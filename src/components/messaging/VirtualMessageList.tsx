useEffect(() => {
    if (!loadMoreRef.current || !hasMoreMessages || loading) return;
    
    const currentRef = loadMoreRef.current; // Store reference
    
    const observer = new IntersectionObserver(
      entries => {
        const [entry] = entries;
        if (entry.isIntersecting && onLoadMore) {
          onLoadMore();
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(currentRef);
    
    return () => {
      observer.unobserve(currentRef); // Unobserve specific element
      observer.disconnect();
    };
  }, [hasMoreMessages, onLoadMore, loading]);