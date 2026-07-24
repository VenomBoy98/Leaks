// GENERATED from handoff app/attendance.html — do not edit by hand. Regenerate: npm run convert
export const portal = "student";
export const title = "SJKVY Attendance Tracker";
export const html = `<!-- Sidebar Navigation -->
<aside class="fixed left-0 top-0 h-full w-[280px] bg-on-tertiary-fixed-variant dark:bg-on-tertiary-fixed-variant border-r border-secondary-fixed/10 shadow-sm flex flex-col py-8 z-50">
<div class="px-8 mb-12">
<h1 class="font-display-md text-display-md text-on-secondary">SJKVY</h1>
<p class="font-label-md text-label-md text-secondary-fixed/60">Institutional Access</p>
</div>
<nav class="flex-1 space-y-1">
<a class="flex items-center px-8 py-4 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 cursor-pointer active:scale-95" href="#">
<span class="material-symbols-outlined mr-4">dashboard</span>
<span class="font-body-md text-body-md">Dashboard</span>
</a>
<a class="flex items-center px-8 py-4 border-l-4 border-secondary-fixed text-on-secondary bg-primary-container/20 transition-all duration-200 cursor-pointer active:scale-95" href="#">
<span class="material-symbols-outlined mr-4">calendar_today</span>
<span class="font-body-md text-body-md">Attendance</span>
</a>
<a class="flex items-center px-8 py-4 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 cursor-pointer active:scale-95" href="#">
<span class="material-symbols-outlined mr-4">apartment</span>
<span class="font-body-md text-body-md">Hostel</span>
</a>
<a class="flex items-center px-8 py-4 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 cursor-pointer active:scale-95" href="#">
<span class="material-symbols-outlined mr-4">assignment</span>
<span class="font-body-md text-body-md">Assessments</span>
</a>
<a class="flex items-center px-8 py-4 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 cursor-pointer active:scale-95" href="#">
<span class="material-symbols-outlined mr-4">workspace_premium</span>
<span class="font-body-md text-body-md">Certificates</span>
</a>
<a class="flex items-center px-8 py-4 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 cursor-pointer active:scale-95" href="#">
<span class="material-symbols-outlined mr-4">work_outline</span>
<span class="font-body-md text-body-md">Placement</span>
</a>
<a class="flex items-center px-8 py-4 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 cursor-pointer active:scale-95" href="#">
<span class="material-symbols-outlined mr-4">person</span>
<span class="font-body-md text-body-md">Profile</span>
</a>
</nav>
<div class="px-8 mt-auto">
<button class="w-full py-3 bg-secondary-fixed text-on-secondary-fixed font-label-md text-label-md rounded shadow-sm hover:brightness-90 transition-weighted active:scale-95">
                Support Desk
            </button>
</div>
</aside>
<!-- Top Navigation Bar -->
<header class="fixed top-0 right-0 w-[calc(100%-280px)] h-[72px] bg-surface/60 backdrop-blur-md dark:bg-surface-dim/60 flex justify-between items-center px-margin-desktop z-40">
<div class="flex items-center gap-8">
<span class="font-title-lg text-title-lg text-primary">Attendance Tracker</span>
<div class="hidden md:flex gap-6">
<a class="font-label-md text-label-md text-primary border-b-2 border-primary pb-1" href="#">Resources</a>
<a class="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors" href="#">Support</a>
</div>
</div>
<div class="flex items-center gap-6">
<div class="relative">
<span class="material-symbols-outlined text-on-surface-variant cursor-pointer">notifications</span>
<span class="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full"></span>
</div>
<span class="material-symbols-outlined text-on-surface-variant cursor-pointer">settings</span>
<div class="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden border border-outline-variant/20">
<img class="w-full h-full object-cover" data-alt="A professional studio portrait of a university student with a calm and confident expression, wearing a neutral-toned academic sweater. The background is a soft-focus institutional library with mahogany wood and warm ambient lighting. The aesthetic is high-quality and premium light mode, consistent with a museum-quality design system." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYUzVjaS7cM45ZEV-OQdN8uwpZOsAikE6qx60e5U87ksPtJyrl4dx86SXZ2ViOCzSlmPvRYxEe1RLBdi0WJiEJTuhGEKeo7-rvt9ZUh6-Tav33SPKu_NA9_nhLAaXCr7BC5pyJ5r9Pca6i4H4NwxDhi2w29vmQGo24AVvKlq9XaVuImUboPNz3tWYGH2V8KM0p5EQM0yPyyamcJ_uqxZFBRbv_y9MhmHYlH6dIdi8c9feC6ZMXMHvC"/>
</div>
</div>
</header>
<!-- Main Content Canvas -->
<main class="ml-[280px] pt-[72px] min-h-screen">
<div class="max-w-[1440px] mx-auto px-margin-desktop py-12">
<!-- Header Section -->
<div class="flex justify-between items-end mb-12 animate-staggered-fade" style="animation-delay: 0.1s">
<div>
<h2 class="font-display-md text-display-md text-on-background mb-2">Monthly Overview</h2>
<p class="font-body-md text-body-md text-on-surface-variant">Academic Session 2024-25 • Module: Advanced Web Architecture</p>
</div>
<div class="flex gap-4">
<button class="px-6 py-2 border border-secondary text-secondary rounded font-label-md text-label-md transition-weighted hover:bg-secondary/5">
                        Download Report
                    </button>
<button class="px-6 py-2 bg-primary text-on-primary rounded font-label-md text-label-md transition-weighted hover:brightness-110">
                        Mark Leave
                    </button>
</div>
</div>
<!-- Dashboard Bento Grid -->
<div class="bento-grid mb-12">
<!-- Status Card: On Track -->
<div class="col-span-4 bg-surface rounded-xl p-8 shadow-[0_4px_20px_rgba(26,28,30,0.04)] border-t-2 border-primary animate-staggered-fade" style="animation-delay: 0.2s">
<div class="flex justify-between items-start mb-6">
<span class="font-label-md text-label-md text-primary bg-primary/10 px-3 py-1 rounded-full uppercase">On Track</span>
<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">check_circle</span>
</div>
<div class="mb-4">
<span class="font-display-lg text-display-lg text-primary">94%</span>
<p class="font-body-md text-body-md text-on-surface-variant">Overall Attendance</p>
</div>
<div class="w-full h-1 bg-surface-container-high rounded-full overflow-hidden">
<div class="h-full bg-primary" style="width: 94%"></div>
</div>
</div>
<!-- Historical Trends Chart -->
<div class="col-span-8 bg-surface rounded-xl p-8 shadow-[0_4px_20px_rgba(26,28,30,0.04)] animate-staggered-fade relative overflow-hidden" style="animation-delay: 0.3s">
<div class="flex justify-between items-center mb-8">
<h3 class="font-title-lg text-title-lg text-on-background">Attendance History</h3>
<div class="flex items-center gap-4">
<span class="flex items-center gap-2 font-caption text-caption text-on-surface-variant">
<span class="w-3 h-3 rounded-full bg-primary"></span> Current Term
                            </span>
<span class="flex items-center gap-2 font-caption text-caption text-on-surface-variant opacity-50">
<span class="w-3 h-3 rounded-full bg-tertiary"></span> Previous Term
                            </span>
</div>
</div>
<div class="h-48 w-full">
<!-- Simulated SVG Chart -->
<svg class="w-full h-full overflow-visible" viewbox="0 0 800 200">
<defs>
<lineargradient id="line-grad" x1="0" x2="0" y1="0" y2="1">
<stop offset="0%" stop-color="#316342" stop-opacity="0.2"></stop>
<stop offset="100%" stop-color="#316342" stop-opacity="0"></stop>
</lineargradient>
</defs>
<path d="M0,150 Q100,120 200,140 T400,80 T600,110 T800,50 V200 H0 Z" fill="url(#line-grad)"></path>
<path d="M0,150 Q100,120 200,140 T400,80 T600,110 T800,50" fill="none" stroke="#316342" stroke-linecap="round" stroke-width="3"></path>
<circle cx="200" cy="140" fill="#316342" r="4"></circle>
<circle cx="400" cy="80" fill="#316342" r="4"></circle>
<circle cx="600" cy="110" fill="#316342" r="4"></circle>
<circle cx="800" cy="50" fill="#316342" r="4"></circle>
</svg>
</div>
</div>
<!-- Calendar View -->
<div class="col-span-12 md:col-span-7 bg-surface rounded-xl p-8 shadow-[0_4px_20px_rgba(26,28,30,0.04)] animate-staggered-fade" style="animation-delay: 0.4s">
<div class="flex justify-between items-center mb-10">
<h3 class="font-title-lg text-title-lg text-on-background">October 2024</h3>
<div class="flex gap-2">
<button class="p-2 hover:bg-surface-container rounded transition-colors"><span class="material-symbols-outlined">chevron_left</span></button>
<button class="p-2 hover:bg-surface-container rounded transition-colors"><span class="material-symbols-outlined">chevron_right</span></button>
</div>
</div>
<div class="grid grid-cols-7 gap-y-8 text-center">
<!-- Days of week -->
<div class="font-label-md text-label-md text-on-surface-variant/50">MON</div>
<div class="font-label-md text-label-md text-on-surface-variant/50">TUE</div>
<div class="font-label-md text-label-md text-on-surface-variant/50">WED</div>
<div class="font-label-md text-label-md text-on-surface-variant/50">THU</div>
<div class="font-label-md text-label-md text-on-surface-variant/50">FRI</div>
<div class="font-label-md text-label-md text-on-surface-variant/50">SAT</div>
<div class="font-label-md text-label-md text-on-surface-variant/50">SUN</div>
<!-- Dates (Abbreviated) -->
<div class="py-2 text-on-surface-variant/20 font-body-md text-body-md">30</div>
<div class="py-2 text-on-surface-variant font-body-md text-body-md">1</div>
<div class="py-2 relative flex justify-center items-center">
<span class="z-10 font-body-md text-body-md">2</span>
<div class="absolute w-10 h-10 bg-primary/10 rounded-full border border-primary/20"></div>
</div>
<div class="py-2 font-body-md text-body-md">3</div>
<div class="py-2 font-body-md text-body-md">4</div>
<div class="py-2 font-body-md text-body-md">5</div>
<div class="py-2 font-body-md text-body-md">6</div>
<!-- ... More dates skipped for visual clarity ... -->
<div class="py-2 font-body-md text-body-md">7</div>
<div class="py-2 font-body-md text-body-md">8</div>
<div class="py-2 font-body-md text-body-md">9</div>
<div class="py-2 relative flex justify-center items-center text-error">
<span class="z-10 font-body-md text-body-md">10</span>
<div class="absolute w-10 h-10 bg-error/5 rounded-full border border-error/20"></div>
</div>
<div class="py-2 font-body-md text-body-md">11</div>
<div class="py-2 font-body-md text-body-md">12</div>
<div class="py-2 font-body-md text-body-md">13</div>
</div>
</div>
<!-- Module Breakdown Table -->
<div class="col-span-12 md:col-span-5 bg-surface rounded-xl shadow-[0_4px_20px_rgba(26,28,30,0.04)] overflow-hidden animate-staggered-fade" style="animation-delay: 0.5s">
<div class="p-8 pb-4">
<h3 class="font-title-lg text-title-lg text-on-background">Module Health</h3>
</div>
<table class="w-full">
<thead>
<tr class="bg-surface-container-low border-b border-outline-variant/10">
<th class="text-left py-4 px-8 font-label-md text-label-md text-primary">Module</th>
<th class="text-center py-4 px-4 font-label-md text-label-md text-primary">Rate</th>
<th class="text-right py-4 px-8 font-label-md text-label-md text-primary">Status</th>
</tr>
</thead>
<tbody class="divide-y divide-outline-variant/10">
<tr class="hover:bg-surface-container-low transition-colors">
<td class="py-4 px-8 font-body-md text-body-md">Advanced Web Arch.</td>
<td class="py-4 px-4 text-center font-body-md text-body-md">98%</td>
<td class="py-4 px-8 text-right">
<span class="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded">ON TRACK</span>
</td>
</tr>
<tr class="hover:bg-surface-container-low transition-colors">
<td class="py-4 px-8 font-body-md text-body-md">Neural Networks</td>
<td class="py-4 px-4 text-center font-body-md text-body-md">72%</td>
<td class="py-4 px-8 text-right">
<span class="text-[10px] font-semibold text-error bg-error/10 px-2 py-1 rounded">ACTION REQ.</span>
</td>
</tr>
<tr class="hover:bg-surface-container-low transition-colors">
<td class="py-4 px-8 font-body-md text-body-md">Data Ethics</td>
<td class="py-4 px-4 text-center font-body-md text-body-md">100%</td>
<td class="py-4 px-8 text-right">
<span class="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded">ON TRACK</span>
</td>
</tr>
<tr class="hover:bg-surface-container-low transition-colors">
<td class="py-4 px-8 font-body-md text-body-md">Cloud Orchestration</td>
<td class="py-4 px-4 text-center font-body-md text-body-md">89%</td>
<td class="py-4 px-8 text-right">
<span class="text-[10px] font-semibold text-primary bg-primary/10 px-2 py-1 rounded">ON TRACK</span>
</td>
</tr>
</tbody>
</table>
</div>
<!-- Featured Highlight Card -->
<div class="col-span-12 bg-on-tertiary-fixed-variant rounded-xl p-10 flex flex-col md:flex-row items-center gap-10 animate-staggered-fade" style="animation-delay: 0.6s">
<div class="w-full md:w-1/3 aspect-video rounded-lg overflow-hidden border border-secondary-fixed/20">
<img class="w-full h-full object-cover grayscale opacity-60 hover:grayscale-0 transition-weighted duration-700" data-alt="A modern, high-tech lecture hall with tiered wooden seating and large digital screens displaying complex architectural diagrams. The lighting is soft and cinematic, with a color palette dominated by forest greens and warm bronze tones. The image captures the prestigious and intellectual atmosphere of an elite institutional campus." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSKNybjJGnme_lTvyWhCmKI28iuSYLIEZJ6lIDUZFAeBJaJemoHExZ6_AbUgGFk4GDd6GVveJG7A22rEJoyH1c1uBGEZ11T46OBH19g8wxasZwFTsL85-2tv_oDHyK_OKABVGjeah_PjU592QMWn0sl8RIcL-nOmPaQmliDSEbZnvOEvYB83zaCGLFhYDU2XPySByh2Iz11YIv8T2qV79XfrwOqOyLNtSeP7vnZ_k9dL91Gmn7z7UR"/>
</div>
<div class="flex-1">
<h4 class="font-headline-lg text-headline-lg text-on-secondary mb-4">Exceptional Consistency</h4>
<p class="font-body-lg text-body-lg text-secondary-fixed/80 mb-6 max-w-2xl">
                            You have maintained a 95%+ attendance rate for 12 consecutive weeks. This places you in the top 5th percentile of the current cohort. Keep up the momentum to qualify for the Presidential Excellence Medal.
                        </p>
<div class="flex gap-4">
<span class="px-4 py-2 bg-primary-container text-on-primary-container rounded font-label-md text-label-md">Excellence Badge</span>
<span class="px-4 py-2 bg-secondary-container text-on-secondary-container rounded font-label-md text-label-md">Tier 1 Eligibility</span>
</div>
</div>
</div>
</div>
</div>
<!-- Footer -->
<footer class="relative w-full py-12 bg-surface-container dark:bg-surface-container-highest border-t border-outline-variant/20">
<div class="flex flex-col md:flex-row justify-between items-center px-margin-desktop max-w-1440px mx-auto w-full">
<div class="mb-8 md:mb-0">
<span class="font-label-md text-label-md text-primary block mb-2">SJKVY Institutional Portal</span>
<p class="font-caption text-caption text-on-surface-variant opacity-70">© 2024 SJKVY Institutional Portal. All rights reserved.</p>
</div>
<div class="flex gap-8">
<a class="font-caption text-caption text-on-surface-variant hover:text-primary underline transition-all" href="#">Privacy Policy</a>
<a class="font-caption text-caption text-on-surface-variant hover:text-primary underline transition-all" href="#">Terms of Service</a>
<a class="font-caption text-caption text-on-surface-variant hover:text-primary underline transition-all" href="#">Institutional Contacts</a>
<a class="font-caption text-caption text-on-surface-variant hover:text-primary underline transition-all" href="#">FAQ</a>
</div>
</div>
</footer>
</main>
<!-- Floating Action Button (Contextual for Marked Leave) -->
<button class="fixed bottom-10 right-10 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-weighted group">
<span class="material-symbols-outlined group-hover:rotate-90 transition-weighted">add</span>
</button>`;
export const css = `body { font-family: 'Inter', sans-serif; background-color: #fcf9f8; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
        .glass-panel { backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); }
        .transition-weighted { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .bento-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; }
        .line-chart-gradient { fill: url(#line-grad); }
        .animate-staggered-fade { animation: fadeSlide 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; opacity: 0; transform: translateY(10px); }
        @keyframes fadeSlide { to { opacity: 1; transform: translateY(0); } }
    
/*sjkvy-bgfix*/:root{forced-color-adjust:none;-webkit-forced-color-adjust:none}html,body{forced-color-adjust:none;color-scheme:light}`;
