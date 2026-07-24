// GENERATED from handoff app/admin-directory.html — do not edit by hand. Regenerate: npm run convert
export const portal = "admin";
export const title = "Student Directory | SJKVY Portal";
export const html = `<!-- SideNavBar Anchor -->
<aside class="w-72 h-screen fixed left-0 top-0 bg-primary shadow-xl flex flex-col py-8 z-50 overflow-y-auto">
<div class="px-8 mb-12">
<h1 class="font-display-md text-secondary-fixed tracking-tight leading-none">SJKVY Portal</h1>
<p class="font-label-md text-secondary-fixed/60 mt-2 uppercase tracking-widest">Centre Admin</p>
</div>
<nav class="flex-1 flex flex-col gap-1">
<a class="flex items-center gap-4 px-8 py-4 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">dashboard</span>
<span class="font-label-md">Dashboard</span>
</a>
<a class="flex items-center gap-4 px-8 py-4 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">assignment_turned_in</span>
<span class="font-label-md">Applications</span>
</a>
<a class="flex items-center gap-4 px-8 py-4 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">group_work</span>
<span class="font-label-md">Batch Management</span>
</a>
<!-- Active Tab: Directory -->
<a class="flex items-center gap-4 px-8 py-4 bg-white/10 text-secondary-fixed font-bold border-l-4 border-secondary-fixed" href="#">
<span class="material-symbols-outlined">group</span>
<span class="font-label-md">Directory</span>
</a>
<a class="flex items-center gap-4 px-8 py-4 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">hotel</span>
<span class="font-label-md">Hostel Tracking</span>
</a>
<a class="flex items-center gap-4 px-8 py-4 text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">assessment</span>
<span class="font-label-md">Reports</span>
</a>
</nav>
<div class="px-8 mt-auto pt-8 border-t border-white/10">
<a class="flex items-center gap-4 py-3 text-on-primary/70 hover:text-on-primary transition-colors mb-2" href="#">
<span class="material-symbols-outlined">settings</span>
<span class="font-label-md">Settings</span>
</a>
<a class="flex items-center gap-4 py-3 text-on-primary/70 hover:text-on-primary transition-colors" href="#">
<span class="material-symbols-outlined">help</span>
<span class="font-label-md">Support</span>
</a>
<button class="mt-6 w-full py-3 bg-secondary-fixed text-on-secondary-fixed font-bold rounded shadow-lg transition-transform active:scale-95">
                Quick Enroll
            </button>
</div>
</aside>
<!-- TopAppBar Anchor -->
<header class="flex justify-between items-center ml-72 px-gutter h-20 bg-surface/80 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant">
<div class="flex items-center flex-1 max-w-2xl">
<div class="relative w-full max-w-md">
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input class="w-full pl-12 pr-4 py-2 bg-surface-container border-none rounded-full focus:ring-2 focus:ring-primary text-body-md" placeholder="Search student directory..." type="text"/>
</div>
</div>
<div class="flex items-center gap-6">
<button class="text-on-surface-variant hover:text-primary transition-colors relative">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
</button>
<button class="text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined">help_outline</span>
</button>
<div class="h-10 w-10 rounded-full overflow-hidden border-2 border-primary/20">
<img class="w-full h-full object-cover" data-alt="A professional headshot of a female administrative official with a kind expression, wearing elegant formal attire in an office setting with warm wood tones and soft museum-style lighting. The image evokes authority and approachability in a modern institutional context." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWc0JfW9izFYi1EI7ALNdXUQz_1qRBWLJB7zKq-6w6cYaiQ6z15BM4tGE_ByG8Jk-p6tIJtavHiY2emy6nOn8EgXKxrXGmAp_SOa23XN1mH06GFUPJxQeZZ8c1YQn0zmSdEJT-Brrz9WmecjZFpBMko9wmtsrVYuGH6L4pRmtRtAUHw4DEa0i-kCcx_H8tEl3RbXjPnWV3d2m5hu8z16cuYuzKdjDXOALTTHC_Fh01VcY_sSInSm5S"/>
</div>
</div>
</header>
<!-- Main Content -->
<main class="ml-72 p-gutter max-w-max-width mx-auto">
<!-- Directory Header -->
<div class="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
<div>
<h2 class="font-display-lg text-on-background">Student Directory</h2>
<p class="font-body-lg text-on-surface-variant mt-2 max-w-xl">A comprehensive ledger of all scholars currently enrolled in the SJKVY program, detailing academic standing and phase progression.</p>
</div>
<div class="flex gap-4">
<div class="flex bg-surface-container p-1 rounded-lg">
<button class="p-2 bg-surface rounded-md shadow-sm text-primary" id="grid-view-btn">
<span class="material-symbols-outlined">grid_view</span>
</button>
<button class="p-2 text-on-surface-variant hover:text-primary" id="list-view-btn">
<span class="material-symbols-outlined">format_list_bulleted</span>
</button>
</div>
<button class="flex items-center gap-2 px-6 py-2 border border-secondary text-secondary font-semibold rounded hover:bg-secondary/5 transition-colors">
<span class="material-symbols-outlined">filter_list</span>
<span>Advanced Filters</span>
</button>
</div>
</div>
<!-- Filters Strip -->
<div class="flex flex-wrap gap-4 mb-8">
<div class="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center gap-2 cursor-pointer hover:bg-primary/20">
<span class="font-label-md">Batch: Winter 2024</span>
<span class="material-symbols-outlined text-sm">close</span>
</div>
<div class="px-4 py-2 bg-surface-container text-on-surface-variant border border-outline-variant/30 rounded-full flex items-center gap-2 cursor-pointer hover:bg-surface-container-high">
<span class="font-label-md">Academic Standing: All</span>
<span class="material-symbols-outlined text-sm">keyboard_arrow_down</span>
</div>
<div class="px-4 py-2 bg-surface-container text-on-surface-variant border border-outline-variant/30 rounded-full flex items-center gap-2 cursor-pointer hover:bg-surface-container-high">
<span class="font-label-md">Program: Vocational Arts</span>
<span class="material-symbols-outlined text-sm">keyboard_arrow_down</span>
</div>
<button class="text-primary font-label-md px-2 hover:underline">Clear All</button>
</div>
<!-- Results Grid -->
<div class="bento-grid" id="directory-container">
<!-- Student Card 1 -->
<div class="bg-surface rounded-lg museum-shadow border-t-2 border-primary overflow-hidden transition-all hover:translate-y-[-4px]">
<div class="p-6">
<div class="flex items-start justify-between mb-4">
<div class="flex gap-4 items-center">
<div class="w-16 h-16 rounded-full overflow-hidden border border-outline-variant/30">
<img class="w-full h-full object-cover" data-alt="Close up portrait of a male student with a focused and determined expression. He is dressed in a clean, modern dark green uniform. The lighting is soft and cinematic, highlighting his face against a blurred background of a modern architectural library with stone pillars and warm ivory walls." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTtmx9fod6mAt-ZZyPSa7X3Yf0RUNOHIbOaFxxeUFPm8D-JZ1tw8riwyOzpPZ1L9SOoA-Vs0F7cXpg-yBUK26vvde9MwlsTYaoGc7fYjlnILK3ggD2NyAXpZ29vEAoP6e3binTjhYhqyDwaTQc21hCKOb8Xb_aUFnrVeWXJ-rTknxCyrQiNQL5jqspfF9mq_ZK3GxJuxtgPhAE4tnBzhKBwa3PuuvF9Yrdhz5cscZQ3tQxjGeQPYNh"/>
</div>
<div>
<h3 class="font-title-lg text-on-background">Arjun Sharma</h3>
<p class="font-caption text-on-surface-variant">ID: #SJK-2024-0891</p>
</div>
</div>
<div class="px-2 py-1 bg-green-100 text-green-800 text-[10px] font-bold uppercase rounded border border-green-200">Excellent</div>
</div>
<div class="space-y-4">
<div class="flex justify-between items-center text-body-md">
<span class="text-on-surface-variant">Program</span>
<span class="font-semibold text-on-background">Sustainable Agriculture</span>
</div>
<div class="flex justify-between items-center text-body-md">
<span class="text-on-surface-variant">Current Module</span>
<span class="font-semibold text-on-background">Soil Nutrition II</span>
</div>
<div class="pt-4 border-t border-outline-variant/20">
<div class="flex justify-between items-center mb-1">
<span class="font-label-md text-on-surface-variant uppercase">Attendance</span>
<span class="font-bold text-primary">94%</span>
</div>
<div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
<div class="bg-primary h-full" style="width: 94%"></div>
</div>
</div>
</div>
</div>
<div class="px-6 py-4 bg-surface-container-low flex justify-between items-center">
<span class="text-caption italic text-on-surface-variant">Batch: Winter 2024</span>
<button class="text-primary font-bold font-label-md flex items-center gap-1 hover:gap-2 transition-all">
                        View Profile <span class="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</div>
<!-- Student Card 2 -->
<div class="bg-surface rounded-lg museum-shadow border-t-2 border-primary overflow-hidden transition-all hover:translate-y-[-4px]">
<div class="p-6">
<div class="flex items-start justify-between mb-4">
<div class="flex gap-4 items-center">
<div class="w-16 h-16 rounded-full overflow-hidden border border-outline-variant/30">
<img class="w-full h-full object-cover" data-alt="A portrait of a young woman smiling confidently, wearing a beige academic scarf over a charcoal sweater. She is standing in a brightly lit, modern corridor with large windows and clean white walls. The photography style is high-end, clean, and optimistic, fitting a premium educational institution's brand identity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDIq3Ykfp2KxSErCrrN0kZO4C9RHDeCexEX6Z2EcgY_jg1fjya3p5QRnsUY9GPC0P0oluIz74XcSa7KVdl7oPx_hc7T8zHXOpSFnw7gTq1jj67yudoTPTqo5UxNJngM7fQHXpeJKj1FFud8Ngvy_s5iIxgeBGtPpzeo6o8kj8daAGSuBtLSPo27vlGdALcLnN6yyaEGZWWTMn6_pZj6gkTbYKD3AhrkFZn1VEV-jP3wz8EF2l-gKd6J"/>
</div>
<div>
<h3 class="font-title-lg text-on-background">Priya Varma</h3>
<p class="font-caption text-on-surface-variant">ID: #SJK-2024-0102</p>
</div>
</div>
<div class="px-2 py-1 bg-green-100 text-green-800 text-[10px] font-bold uppercase rounded border border-green-200">Excellent</div>
</div>
<div class="space-y-4">
<div class="flex justify-between items-center text-body-md">
<span class="text-on-surface-variant">Program</span>
<span class="font-semibold text-on-background">Tasar Silk Weaving</span>
</div>
<div class="flex justify-between items-center text-body-md">
<span class="text-on-surface-variant">Current Module</span>
<span class="font-semibold text-on-background">Dyeing Techniques</span>
</div>
<div class="pt-4 border-t border-outline-variant/20">
<div class="flex justify-between items-center mb-1">
<span class="font-label-md text-on-surface-variant uppercase">Attendance</span>
<span class="font-bold text-primary">88%</span>
</div>
<div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
<div class="bg-primary h-full" style="width: 88%"></div>
</div>
</div>
</div>
</div>
<div class="px-6 py-4 bg-surface-container-low flex justify-between items-center">
<span class="text-caption italic text-on-surface-variant">Batch: Winter 2024</span>
<button class="text-primary font-bold font-label-md flex items-center gap-1 hover:gap-2 transition-all">
                        View Profile <span class="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</div>
<!-- Student Card 3 -->
<div class="bg-surface rounded-lg museum-shadow border-t-2 border-primary overflow-hidden transition-all hover:translate-y-[-4px]">
<div class="p-6">
<div class="flex items-start justify-between mb-4">
<div class="flex gap-4 items-center">
<div class="w-16 h-16 rounded-full overflow-hidden border border-outline-variant/30">
<img class="w-full h-full object-cover" data-alt="A portrait of a male student looking thoughtfully at a tablet device in a bright studio workspace. He is surrounded by artisanal tools and natural materials like wood and clay. The lighting is natural and atmospheric, creating a sense of craftsmanship and intellectual engagement within a modern museum-like setting." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBR22c71S5QEhyY_Bwr9ZB_tOJw1WPRskjAgNWQ6aPZV7ELEGxyB9MyC3f0FN7i2RptMC1aA2P2QY0C9nhy0Q8d88XWKCVXo1aOtFv5Oksx9ArIZqmdtjwCmzLFWeN9QqZyDdJ-Vr7mvaMs39VTGMLnM11D7G4ftWqbmNvYC_E7HfHe_scyPc5SOJKPNJk1FU_Awn2p4tPkEQwria81okvE7OMOha7xOSLCUe3M3hUpvqM5rV48rOSG"/>
</div>
<div>
<h3 class="font-title-lg text-on-background">Kabir Dass</h3>
<p class="font-caption text-on-surface-variant">ID: #SJK-2023-1142</p>
</div>
</div>
<div class="px-2 py-1 bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase rounded border border-secondary/20">Satisfactory</div>
</div>
<div class="space-y-4">
<div class="flex justify-between items-center text-body-md">
<span class="text-on-surface-variant">Program</span>
<span class="font-semibold text-on-background">Public Policy Admin</span>
</div>
<div class="flex justify-between items-center text-body-md">
<span class="text-on-surface-variant">Current Module</span>
<span class="font-semibold text-on-background">Ethics in Governance</span>
</div>
<div class="pt-4 border-t border-outline-variant/20">
<div class="flex justify-between items-center mb-1">
<span class="font-label-md text-on-surface-variant uppercase">Attendance</span>
<span class="font-bold text-primary">76%</span>
</div>
<div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
<div class="bg-secondary-container h-full" style="width: 76%"></div>
</div>
</div>
</div>
</div>
<div class="px-6 py-4 bg-surface-container-low flex justify-between items-center">
<span class="text-caption italic text-on-surface-variant">Batch: Autumn 2023</span>
<button class="text-primary font-bold font-label-md flex items-center gap-1 hover:gap-2 transition-all">
                        View Profile <span class="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</div>
<!-- Student Card 4 -->
<div class="bg-surface rounded-lg museum-shadow border-t-2 border-primary overflow-hidden transition-all hover:translate-y-[-4px]">
<div class="p-6">
<div class="flex items-start justify-between mb-4">
<div class="flex gap-4 items-center">
<div class="w-16 h-16 rounded-full overflow-hidden border border-outline-variant/30">
<img class="w-full h-full object-cover" data-alt="Close-up portrait of a young woman with a focused expression, wearing a high-quality linen work shirt. She is in a botanical research greenhouse with lush green foliage blurred in the background. The scene is illuminated by soft, natural morning light, emphasizing a clean, sustainable, and professional aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBh_7nk0JDJm7MTGI9M9DNvdrXnxO6ZA_cmnf-79GdJ1-uZ-P3kvkbvyfaEK1qBnU_urbZmYetNG5ruVdrguJWqxyJBit9GU-NfO3MzxCRVwhM_em-k8ldAzScstH3mU7PoxuCBBSxDD8hVbbcVsT5CXH_lSLX4x73nDZLDczAeNiaeRWAXSuFnjWYZti71mFzftQaT62TYGrFyzRK7aZ9rwHQROiJQ_QqV6ZnP3D-fe658rH1CC2df"/>
</div>
<div>
<h3 class="font-title-lg text-on-background">Ananya Roy</h3>
<p class="font-caption text-on-surface-variant">ID: #SJK-2024-0553</p>
</div>
</div>
<div class="px-2 py-1 bg-green-100 text-green-800 text-[10px] font-bold uppercase rounded border border-green-200">Excellent</div>
</div>
<div class="space-y-4">
<div class="flex justify-between items-center text-body-md">
<span class="text-on-surface-variant">Program</span>
<span class="font-semibold text-on-background">Environmental Science</span>
</div>
<div class="flex justify-between items-center text-body-md">
<span class="text-on-surface-variant">Current Module</span>
<span class="font-semibold text-on-background">Eco-Restoration</span>
</div>
<div class="pt-4 border-t border-outline-variant/20">
<div class="flex justify-between items-center mb-1">
<span class="font-label-md text-on-surface-variant uppercase">Attendance</span>
<span class="font-bold text-primary">98%</span>
</div>
<div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
<div class="bg-primary h-full" style="width: 98%"></div>
</div>
</div>
</div>
</div>
<div class="px-6 py-4 bg-surface-container-low flex justify-between items-center">
<span class="text-caption italic text-on-surface-variant">Batch: Winter 2024</span>
<button class="text-primary font-bold font-label-md flex items-center gap-1 hover:gap-2 transition-all">
                        View Profile <span class="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</div>
<!-- Student Card 5 -->
<div class="bg-surface rounded-lg museum-shadow border-t-2 border-primary overflow-hidden transition-all hover:translate-y-[-4px]">
<div class="p-6">
<div class="flex items-start justify-between mb-4">
<div class="flex gap-4 items-center">
<div class="w-16 h-16 rounded-full overflow-hidden border border-outline-variant/30">
<img class="w-full h-full object-cover" data-alt="A focused portrait of a male student in a modern technological lab. He is surrounded by high-end computer equipment and minimalist furniture. The lighting is cool and professional, with soft teal accents, conveying a sense of digital precision and high-level academic pursuit within the SJKVY program." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAndhhVXmrP5zy1T1u-qoJ1EASU-b5j6Vuzdf3IkWqLsaIWRqNAG4cfpeX5Ypofb8mqcrUNIEq8V9yeJR0u2uolTo8u6wwEAOtlDy6PtGtgJ_Z7kRykOonUZUh8VXdvonVVn4f2fe6n7218LZniw3QakYEdbXiB42XKa4-YxjXUGCnxLJEmPH5uXwlxX8PwnbQa99lKQh9e8oAJ8bz7c0qCHRS5tXyXluqCQjYj6Nx7IfDmNu9wCGkM"/>
</div>
<div>
<h3 class="font-title-lg text-on-background">Vikram Singh</h3>
<p class="font-caption text-on-surface-variant">ID: #SJK-2024-0022</p>
</div>
</div>
<div class="px-2 py-1 bg-error-container text-on-error-container text-[10px] font-bold uppercase rounded border border-error/20">Needs Attention</div>
</div>
<div class="space-y-4">
<div class="flex justify-between items-center text-body-md">
<span class="text-on-surface-variant">Program</span>
<span class="font-semibold text-on-background">Data Governance</span>
</div>
<div class="flex justify-between items-center text-body-md">
<span class="text-on-surface-variant">Current Module</span>
<span class="font-semibold text-on-background">Privacy Frameworks</span>
</div>
<div class="pt-4 border-t border-outline-variant/20">
<div class="flex justify-between items-center mb-1">
<span class="font-label-md text-on-surface-variant uppercase">Attendance</span>
<span class="font-bold text-error">62%</span>
</div>
<div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
<div class="bg-error h-full" style="width: 62%"></div>
</div>
</div>
</div>
</div>
<div class="px-6 py-4 bg-surface-container-low flex justify-between items-center">
<span class="text-caption italic text-on-surface-variant">Batch: Winter 2024</span>
<button class="text-primary font-bold font-label-md flex items-center gap-1 hover:gap-2 transition-all">
                        View Profile <span class="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</div>
<!-- Student Card 6 -->
<div class="bg-surface rounded-lg museum-shadow border-t-2 border-primary overflow-hidden transition-all hover:translate-y-[-4px]">
<div class="p-6">
<div class="flex items-start justify-between mb-4">
<div class="flex gap-4 items-center">
<div class="w-16 h-16 rounded-full overflow-hidden border border-outline-variant/30">
<img class="w-full h-full object-cover" data-alt="Portrait of a young female student with a creative and vibrant look, standing in an art studio filled with traditional canvases and digital drawing displays. The lighting is warm and artistic, with golden hour sunlight filtering through large windows, creating a rich, textured, and inspiring educational atmosphere." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAH-MovQsQx-K7NPs3uWwHydniMiFMMZWSALlLR5Xn7mZZ4O1S3IpcU1PPfBMhxf3631IE3UmBYNjmn041LmJWcXnCVWy1m89gcQD_PH7M0x00Bjydhwuxx7yq6woDzfsoiAkmIcgbrcHAx6kNRWcAQ9UvTB69S3rsB1uqR_PsSu-ys8vW6Thserx-16am6x5n4ObJcvWtzDFaEdThLnJBWxUw8R5zCt1cuN_xrSnJGRGNxeyHiZkhb"/>
</div>
<div>
<h3 class="font-title-lg text-on-background">Meera Iyer</h3>
<p class="font-caption text-on-surface-variant">ID: #SJK-2024-0319</p>
</div>
</div>
<div class="px-2 py-1 bg-green-100 text-green-800 text-[10px] font-bold uppercase rounded border border-green-200">Excellent</div>
</div>
<div class="space-y-4">
<div class="flex justify-between items-center text-body-md">
<span class="text-on-surface-variant">Program</span>
<span class="font-semibold text-on-background">Visual Communications</span>
</div>
<div class="flex justify-between items-center text-body-md">
<span class="text-on-surface-variant">Current Module</span>
<span class="font-semibold text-on-background">Brand Semiotics</span>
</div>
<div class="pt-4 border-t border-outline-variant/20">
<div class="flex justify-between items-center mb-1">
<span class="font-label-md text-on-surface-variant uppercase">Attendance</span>
<span class="font-bold text-primary">91%</span>
</div>
<div class="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
<div class="bg-primary h-full" style="width: 91%"></div>
</div>
</div>
</div>
</div>
<div class="px-6 py-4 bg-surface-container-low flex justify-between items-center">
<span class="text-caption italic text-on-surface-variant">Batch: Winter 2024</span>
<button class="text-primary font-bold font-label-md flex items-center gap-1 hover:gap-2 transition-all">
                        View Profile <span class="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</div>
</div>
<!-- Pagination -->
<div class="mt-16 flex items-center justify-between border-t border-outline-variant/30 pt-8 mb-12">
<p class="font-body-md text-on-surface-variant">Showing <span class="font-bold text-on-background">6</span> of <span class="font-bold text-on-background">1,248</span> students</p>
<div class="flex gap-2">
<button class="p-2 border border-outline-variant rounded hover:bg-surface-container transition-colors disabled:opacity-30" disabled="">
<span class="material-symbols-outlined">chevron_left</span>
</button>
<button class="px-4 py-2 bg-primary text-on-primary font-bold rounded">1</button>
<button class="px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded transition-colors">2</button>
<button class="px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded transition-colors">3</button>
<span class="px-2 py-2">...</span>
<button class="px-4 py-2 text-on-surface-variant hover:bg-surface-container rounded transition-colors">208</button>
<button class="p-2 border border-outline-variant rounded hover:bg-surface-container transition-colors">
<span class="material-symbols-outlined">chevron_right</span>
</button>
</div>
</div>
</main>
<!-- FAB for Quick Actions -->
<button class="fixed bottom-8 right-8 w-14 h-14 bg-secondary text-on-secondary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50 group">
<span class="material-symbols-outlined transition-transform group-hover:rotate-90">add</span>
</button>`;
export const css = `.material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .bento-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 24px;
        }
        .museum-shadow {
            box-shadow: 0 4px 20px rgba(26, 28, 30, 0.04);
        }
        .glass-surface {
            background: rgba(252, 249, 248, 0.6);
            backdrop-filter: blur(12px);
        }
    
/*sjkvy-bgfix*/:root{forced-color-adjust:none;-webkit-forced-color-adjust:none}html,body{forced-color-adjust:none;color-scheme:light}`;
