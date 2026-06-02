document.addEventListener('DOMContentLoaded', () => {
  const feedContainer = document.getElementById('feed-container');
  const sentinel = document.getElementById('scroll-sentinel');

  if (!feedContainer || !sentinel) return;

  let isFetching = false;

  const observer = new IntersectionObserver(async (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (isFetching) return;

      const cursor = feedContainer.dataset.cursor;
      if (!cursor) {
        observer.disconnect();
        feedContainer.insertAdjacentHTML('beforeend', '<p class="feed-end">You\'re all caught up.</p>');
        return;
      }

      isFetching = true;
      try {
        const res = await fetch(`/api/posts?cursor=${cursor}`);
        const data = await res.json();

        if (data.html) {
          feedContainer.insertAdjacentHTML('beforeend', data.html);
        }

        feedContainer.dataset.cursor = data.nextCursor ?? '';
        Prism.highlightAll();
      } catch (err) {
        console.error('Feed fetch error:', err);
      } finally {
        isFetching = false;
      }
    }
  }, { rootMargin: '200px' });

  observer.observe(sentinel);
});
