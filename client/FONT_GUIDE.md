# Font System Guide - PlanCrest

## Current Setup: Inter + Poppins

### Fonts Loaded:

- **Inter** - Primary font for UI, body text, forms, buttons
- **Poppins** - Secondary font for headings (h1-h6)

### Automatic Application:

✅ **No manual changes needed!** All your existing components automatically use:

- Inter for all body text, UI elements, forms
- Poppins for all headings (h1, h2, h3, h4, h5, h6)

---

## How to Use

### Default Usage (No classes needed):

```jsx
<p>This uses Inter automatically</p>
<button>This uses Inter automatically</button>
<h1>This uses Poppins automatically</h1>
```

### Tailwind Font Classes:

```jsx
// Use Inter explicitly
<div className="font-sans">Inter font</div>

// Use Poppins explicitly
<div className="font-heading">Poppins font</div>
```

### Font Weight Classes:

```jsx
<p className="font-light">Light (300)</p>
<p className="font-normal">Normal (400)</p>
<p className="font-medium">Medium (500)</p>
<p className="font-semibold">Semibold (600)</p>
<p className="font-bold">Bold (700)</p>
<p className="font-extrabold">Extra Bold (800)</p>
```

---

## Design Recommendations

### For Headings:

```jsx
<h1 className="text-4xl font-bold">Main Title</h1>
<h2 className="text-3xl font-semibold">Section Title</h2>
<h3 className="text-2xl font-semibold">Subsection</h3>
```

### For Body Text:

```jsx
<p className="text-base font-normal">Regular paragraph</p>
<p className="text-sm font-medium">Small emphasis text</p>
```

### For Buttons:

```jsx
<button className="font-medium">Primary Action</button>
<button className="font-semibold">Important CTA</button>
```

### For Navigation:

```jsx
<nav className="font-medium">Nav items</nav>
```

---

## Alternative: Switch to Inter-Only

If you want maximum simplicity, you can use **just Inter** for everything:

### Step 1: Update `index.html`

Change the Google Fonts import to:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
  rel="stylesheet"
/>
```

### Step 2: Update `index.css`

Remove the heading font override:

```css
body {
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Step 3: Update `tailwind.config.js`

```js
fontFamily: {
  sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
},
```

This gives you a cleaner, more cohesive design with just one professional font.

---

## Performance Notes

- ✅ Fonts are preloaded for optimal performance
- ✅ Only necessary weights are loaded
- ✅ Font smoothing is enabled for better rendering
- ✅ System font fallbacks are configured

## Used By Top SaaS Products

**Inter is used by:**

- GitHub
- Vercel
- Linear
- Stripe
- Notion
- And hundreds more

This font choice puts you in good company! 🚀
