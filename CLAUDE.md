# Adams Homes Dashboard - Claude Instructions

## Standard Features for All Dashboards

### Back-to-Top Button
Add a fixed-position back-to-top button to all dashboard pages for improved navigation. This is a standard feature that should be included automatically in every build.

**Implementation:**

1. **CSS** - Add to `<style>` section:
```css
.back-to-top { position: fixed; bottom: 24px; right: 24px; width: 48px; height: 48px; background: #1a5a3a; color: white; border: none; border-radius: 50%; font-size: 20px; cursor: pointer; display: none; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15); z-index: 999; transition: background 0.3s, box-shadow 0.3s; }
.back-to-top:hover { background: #14472e; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.back-to-top.show { display: flex; }
```

2. **HTML** - Add button before closing `</script>` tag:
```html
<button class="back-to-top" id="backToTop" title="Back to top" aria-label="Back to top">↑</button>
```

3. **JavaScript** - Add scroll and click handlers:
```javascript
const backToTopBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (window.scrollY > 300) {
    backToTopBtn.classList.add('show');
  } else {
    backToTopBtn.classList.remove('show');
  }
});
backToTopBtn.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
```

**Features:**
- Hidden by default, appears when scrolled 300px down
- Smooth scroll animation to top
- Accessible with aria-label and title
- Hidden in print mode
