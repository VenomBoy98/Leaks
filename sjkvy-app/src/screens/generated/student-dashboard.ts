// GENERATED from handoff app/student-dashboard.html — do not edit by hand. Regenerate: npm run convert
export const portal = "student";
export const title = "SJKVY Student Portal | Dashboard";
export const html = `<!-- Sidebar Navigation -->
<aside class="fixed left-0 top-0 h-full w-[280px] bg-on-tertiary-fixed-variant dark:bg-on-tertiary-fixed-variant border-r border-secondary-fixed/10 shadow-sm flex flex-col h-full py-base z-50">
<div class="px-6 py-8">
<h1 class="font-headline-lg text-headline-lg text-on-secondary mb-1">SJKVY Portal</h1>
<p class="font-label-md text-label-md text-tertiary-fixed opacity-70">Institutional Access</p>
</div>
<nav class="flex-1 px-4 space-y-2 mt-4">
<!-- Active Tab: Dashboard -->
<a class="flex items-center gap-3 px-4 py-3 border-l-4 border-secondary-fixed text-on-secondary bg-primary-container/20 font-body-md text-body-md cursor-pointer active:scale-95 transition-all duration-200" href="#">
<span class="material-symbols-outlined">dashboard</span>
<span>Dashboard</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 font-body-md text-body-md cursor-pointer active:scale-95" href="#">
<span class="material-symbols-outlined">calendar_today</span>
<span>Attendance</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 font-body-md text-body-md cursor-pointer active:scale-95" href="#">
<span class="material-symbols-outlined">apartment</span>
<span>Hostel</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 font-body-md text-body-md cursor-pointer active:scale-95" href="#">
<span class="material-symbols-outlined">assignment</span>
<span>Assessments</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 font-body-md text-body-md cursor-pointer active:scale-95" href="#">
<span class="material-symbols-outlined">workspace_premium</span>
<span>Certificates</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 font-body-md text-body-md cursor-pointer active:scale-95" href="#">
<span class="material-symbols-outlined">work_outline</span>
<span>Placement</span>
</a>
<a class="flex items-center gap-3 px-4 py-3 text-tertiary-fixed opacity-70 hover:bg-primary-container/10 hover:text-on-secondary transition-all duration-200 font-body-md text-body-md cursor-pointer active:scale-95" href="#">
<span class="material-symbols-outlined">person</span>
<span>Profile</span>
</a>
</nav>
<div class="mt-auto px-6 py-6">
<button class="w-full flex items-center justify-center gap-2 bg-secondary-fixed text-on-secondary-fixed px-4 py-3 rounded-lg font-label-md hover:brightness-90 transition-all">
<span class="material-symbols-outlined text-[18px]">contact_support</span>
                Support Desk
            </button>
</div>
</aside>
<!-- Top Navigation Bar -->
<header class="fixed top-0 right-0 w-[calc(100%-280px)] h-[72px] bg-surface/60 backdrop-blur-md dark:bg-surface-dim/60 shadow-[0_4px_20px_rgba(26,28,30,0.04)] flex justify-between items-center px-margin-desktop z-40">
<div class="flex items-center gap-8">
<span class="font-display-md text-display-md text-primary">SJKVY</span>
<nav class="hidden md:flex items-center gap-6">
<a class="font-label-md text-label-md text-primary border-b-2 border-primary pb-1 duration-200 ease-in-out" href="#">Resources</a>
<a class="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors duration-200 ease-in-out" href="#">Support</a>
</nav>
</div>
<div class="flex items-center gap-6">
<div class="relative group hidden lg:block">
<input class="w-64 bg-surface-container-low border border-outline-variant/20 rounded-full px-5 py-2 text-body-md focus:outline-none focus:border-primary transition-all" placeholder="Search resources..." type="text"/>
<span class="material-symbols-outlined absolute right-4 top-2 text-on-surface-variant">search</span>
</div>
<div class="flex items-center gap-4">
<button class="material-symbols-outlined text-on-surface-variant hover:text-primary transition-all">notifications</button>
<button class="material-symbols-outlined text-on-surface-variant hover:text-primary transition-all">settings</button>
<div class="h-10 w-10 rounded-full overflow-hidden border border-secondary-fixed/30 cursor-pointer active:scale-95 transition-all">
<img class="w-full h-full object-cover" data-alt="A professional studio portrait of a young South Asian student wearing a modern neutral-toned blazer. The lighting is soft and flattering, typical of a high-end institutional directory. The background is a clean, textured warm ivory that matches the portal's aesthetic. The overall mood is academic and sophisticated." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTokNwVjNcgzMAuR-v626rbVZvsZ8EfSfRYrQ8oBjU6iKmAO_PjVJwflqYfiD8ZZLfUFdPW3fg-C3rEVGTwROVvZfXnV7S6_CpOWXUPQ8dRZ_NtD_X5_kqv2v_KKDllduAieIGqqVQYrXCa4ps2ky2rMwDcKXIV2Y5yp8upT2ZWJIO0XNzRnpgkWBEwjpBdONSpAf5wEYZRcXJex5ZjVdUPYe9vf7_f4DQ-xOGaeeS97o8g6zlj-xl"/>
</div>
</div>
</div>
</header>
<!-- Main Content Canvas -->
<main class="ml-[280px] pt-[72px] min-h-screen px-margin-desktop py-12 max-w-1440px">
<!-- Header Section -->
<header class="mb-12 stagger-in">
<p class="font-label-md text-label-md text-secondary tracking-widest uppercase mb-2">Student Dashboard</p>
<h2 class="font-display-lg text-display-lg text-on-surface italic">Welcome back, Arnav.</h2>
<div class="w-24 h-1 bg-secondary mt-6"></div>
</header>
<!-- Metrics Grid (Bento Style) -->
<section class="bento-grid mb-gutter stagger-in">
<!-- Metric: Grade -->
<div class="col-span-12 md:col-span-3 bg-surface-container-lowest p-8 museum-shadow border-t-2 border-primary-container delay-1">
<div class="flex justify-between items-start mb-6">
<span class="font-label-md text-label-md text-on-surface-variant uppercase tracking-tighter">Current Grade</span>
<span class="material-symbols-outlined text-primary">school</span>
</div>
<div class="flex items-baseline gap-2">
<span class="font-display-md text-display-md">A-</span>
<span class="font-body-md text-primary">+0.2 from last term</span>
</div>
<div class="w-full bg-surface-container h-1 mt-6">
<div class="bg-primary w-[88%] h-full"></div>
</div>
</div>
<!-- Metric: Attendance -->
<div class="col-span-12 md:col-span-3 bg-surface-container-lowest p-8 museum-shadow delay-2">
<div class="flex justify-between items-start mb-6">
<span class="font-label-md text-label-md text-on-surface-variant uppercase tracking-tighter">Attendance %</span>
<span class="material-symbols-outlined text-secondary">verified_user</span>
</div>
<div class="flex items-baseline gap-2">
<span class="font-display-md text-display-md">94%</span>
</div>
<p class="font-caption text-caption text-on-surface-variant mt-2 italic">Institutional requirement: 85%</p>
</div>
<!-- Metric: Assessment Readiness -->
<div class="col-span-12 md:col-span-3 bg-surface-container-lowest p-8 museum-shadow delay-3">
<div class="flex justify-between items-start mb-6">
<span class="font-label-md text-label-md text-on-surface-variant uppercase tracking-tighter">Ready Score</span>
<span class="material-symbols-outlined text-primary">analytics</span>
</div>
<div class="flex items-baseline gap-2">
<span class="font-display-md text-display-md">82</span>
<span class="font-caption text-caption">/100</span>
</div>
<p class="font-caption text-caption text-on-surface-variant mt-2 italic">Calculated from mid-term mocks</p>
</div>
<!-- Metric: Hostel Stay -->
<div class="col-span-12 md:col-span-3 bg-surface-container-lowest p-8 museum-shadow border-t-2 border-secondary delay-4">
<div class="flex justify-between items-start mb-6">
<span class="font-label-md text-label-md text-on-surface-variant uppercase tracking-tighter">Hostel Stay</span>
<span class="material-symbols-outlined text-secondary">king_bed</span>
</div>
<div class="flex flex-col">
<span class="font-body-lg text-body-lg font-bold">Block B, Rm 402</span>
<span class="font-caption text-caption text-on-surface-variant">Maintenance: Scheduled for Tuesday</span>
</div>
</div>
</section>
<!-- Secondary Grid -->
<section class="bento-grid mb-gutter">
<!-- Upcoming Classes -->
<div class="col-span-12 lg:col-span-8 bg-surface museum-shadow p-0 overflow-hidden flex flex-col">
<div class="p-8 border-b border-outline-variant/10 flex justify-between items-center">
<h3 class="font-headline-lg text-headline-lg">Upcoming Classes</h3>
<button class="text-secondary font-label-md hover:underline transition-all">View Full Calendar</button>
</div>
<div class="p-0 overflow-y-auto max-h-[400px] custom-scrollbar">
<!-- Class Item -->
<div class="flex items-center gap-6 p-8 hover:bg-surface-container-low transition-all border-b border-outline-variant/10">
<div class="flex flex-col items-center justify-center bg-surface-container-high w-16 h-16 shrink-0">
<span class="font-label-md text-label-md text-secondary">OCT</span>
<span class="font-title-lg text-title-lg text-on-surface">12</span>
</div>
<div class="flex-1">
<h4 class="font-title-lg text-title-lg">Advanced Computational Structures</h4>
<p class="font-body-md text-on-surface-variant">Dr. Miryam Salcedo • Hall 4A • 09:00 AM</p>
</div>
<div class="hidden sm:block">
<span class="px-3 py-1 bg-primary-container/10 text-primary-container font-label-md border border-primary-container/20 rounded">MANDATORY</span>
</div>
</div>
<!-- Class Item -->
<div class="flex items-center gap-6 p-8 hover:bg-surface-container-low transition-all border-b border-outline-variant/10">
<div class="flex flex-col items-center justify-center bg-surface-container-high w-16 h-16 shrink-0">
<span class="font-label-md text-label-md text-secondary">OCT</span>
<span class="font-title-lg text-title-lg text-on-surface">12</span>
</div>
<div class="flex-1">
<h4 class="font-title-lg text-title-lg">Ethics in Design Archaeology</h4>
<p class="font-body-md text-on-surface-variant">Prof. Julian Vane • Seminar Room B • 01:30 PM</p>
</div>
<div class="hidden sm:block">
<span class="px-3 py-1 bg-surface-container-high text-on-surface-variant font-label-md border border-outline-variant/20 rounded">OPTIONAL</span>
</div>
</div>
<!-- Class Item -->
<div class="flex items-center gap-6 p-8 hover:bg-surface-container-low transition-all">
<div class="flex flex-col items-center justify-center bg-surface-container-high w-16 h-16 shrink-0">
<span class="font-label-md text-label-md text-secondary">OCT</span>
<span class="font-title-lg text-title-lg text-on-surface">13</span>
</div>
<div class="flex-1">
<h4 class="font-title-lg text-title-lg">Quantitative Research Methods</h4>
<p class="font-body-md text-on-surface-variant">Dr. Sarah Khalil • Digital Lab • 10:00 AM</p>
</div>
<div class="hidden sm:block">
<span class="px-3 py-1 bg-primary-container/10 text-primary-container font-label-md border border-primary-container/20 rounded">MANDATORY</span>
</div>
</div>
</div>
</div>
<!-- Personalized Learning Path -->
<div class="col-span-12 lg:col-span-4 bg-primary text-on-primary p-8 museum-shadow flex flex-col relative overflow-hidden">
<!-- Background Decoration -->
<div class="absolute -right-10 -bottom-10 opacity-10">
<span class="material-symbols-outlined text-[200px]" style="font-variation-settings: 'wght' 100;">auto_stories</span>
</div>
<h3 class="font-headline-lg text-headline-lg mb-6 relative z-10">Learning Path</h3>
<p class="font-body-md mb-8 relative z-10 opacity-90">Based on your recent assessment in <i>Numerical Theory</i>, we recommend these curated modules to strengthen your core proficiency.</p>
<ul class="space-y-4 relative z-10">
<li class="p-4 bg-white/10 backdrop-blur border border-white/20 flex items-center gap-4 hover:bg-white/20 transition-all cursor-pointer">
<span class="material-symbols-outlined">play_circle</span>
<div>
<p class="font-label-md">MODULE 04</p>
<p class="font-body-md font-bold">Stochastic Modeling Prep</p>
</div>
</li>
<li class="p-4 bg-white/10 backdrop-blur border border-white/20 flex items-center gap-4 hover:bg-white/20 transition-all cursor-pointer">
<span class="material-symbols-outlined">description</span>
<div>
<p class="font-label-md">READING</p>
<p class="font-body-md font-bold">Bayesian Fundamentals</p>
</div>
</li>
<li class="p-4 bg-white/10 backdrop-blur border border-white/20 flex items-center gap-4 hover:bg-white/20 transition-all cursor-pointer">
<span class="material-symbols-outlined">quiz</span>
<div>
<p class="font-label-md">PRACTICE</p>
<p class="font-body-md font-bold">Weekly Logic Sprint</p>
</div>
</li>
</ul>
<button class="mt-auto py-4 bg-on-secondary text-primary font-bold hover:bg-surface-container-high transition-all relative z-10">
                    CONTINUE JOURNEY
                </button>
</div>
</section>
<!-- Social Feed Section -->
<section class="mb-gutter">
<div class="flex justify-between items-end mb-8">
<div>
<h3 class="font-headline-lg text-headline-lg">Campus Social Feed</h3>
<p class="font-body-md text-on-surface-variant">Stay connected with the SJKVY community</p>
</div>
<div class="flex gap-2">
<button class="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container transition-all">
<span class="material-symbols-outlined">chevron_left</span>
</button>
<button class="w-10 h-10 rounded-full border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container transition-all">
<span class="material-symbols-outlined">chevron_right</span>
</button>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
<!-- Post 1 -->
<article class="bg-surface-container-low museum-shadow group cursor-pointer overflow-hidden">
<div class="h-48 w-full overflow-hidden">
<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" data-alt="A wide-angle professional photograph of a sun-drenched library interior at a modern university. Students are quietly working at long oak tables under large architectural windows. The atmosphere is studious, serene, and bathed in golden morning light. High-end museum-quality aesthetic with clean lines and a sense of history meeting modernity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTPV3XQV2-V6QKGYJzIE5IJi7N8thALyYlA8s21uYl4zBAos8xcJ1-yc7SrimFyw5ljD8DVus5PF9smTJDNdG8a8dZTF9b89G5SH1xMw5xFMm9VGXG_eRlKvAj_li-SCKlLm4X7RfhtzcqiDN3Q1mLsNuhp047tzz1daayGkfQLJC3rrfVnwdfzhzvGRz0-Nl-2zWkJzSp1fSwevWcGzC57WDCQOprKkBPB8Xf4CSqBFyYVjPgSmRx"/>
</div>
<div class="p-6">
<div class="flex gap-2 mb-3">
<span class="text-[10px] font-bold tracking-widest text-secondary border border-secondary/30 px-2 py-0.5">ACADEMICS</span>
</div>
<h4 class="font-title-lg text-title-lg mb-2">New Library Quiet Zones Implemented</h4>
<p class="font-body-md text-on-surface-variant line-clamp-2">The central archive has introduced biophilic soundscapes to enhance deep-work sessions...</p>
<div class="mt-4 flex items-center gap-3">
<div class="w-6 h-6 rounded-full bg-primary-container/20 border border-primary/10"></div>
<span class="font-caption text-caption text-on-surface-variant">Dean's Office • 2h ago</span>
</div>
</div>
</article>
<!-- Post 2 -->
<article class="bg-surface-container-low museum-shadow group cursor-pointer overflow-hidden">
<div class="h-48 w-full overflow-hidden">
<img class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" data-alt="A close-up high-detail shot of a gourmet farm-to-table meal served on ceramic stoneware. The setting is a refined university dining hall with soft, focused pendant lighting. Fresh greens, vibrant colors, and elegant presentation reflect a premium institutional dining experience. The mood is warm, inviting, and sophisticated." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-cW2teT_bLMSra0HKCuB0L_yI70-VlJ0ixP6pWlTkDpt2im6g6CU-4QL3bmI2Q_foqlKY9bJGQZxM9XHRiJH-bjeHwkTg-rvY_G2CPazSpKIfhU2khqKi9pvZ3BbBOhsJnrCcng8WjVVnU3zGtswquRZyi_Ae5C5cbeDqNq0I8jSXAjOXP3WpPbal1PyxU-6YMERIBHCMSkP5UW4zwdX4vujbnrghOhmNjfPPO3vBRxvvWyjDrYGf"/>
</div>
<div class="p-6">
<div class="flex gap-2 mb-3">
<span class="text-[10px] font-bold tracking-widest text-primary border border-primary/30 px-2 py-0.5">RESIDENTIAL</span>
</div>
<h4 class="font-title-lg text-title-lg mb-2">Seasonal Menu Launch in Dining Hall B</h4>
<p class="font-body-md text-on-surface-variant line-clamp-2">Celebrate the harvest with our chef's new sustainable, farm-to-campus initiative starting Monday...</p>
<div class="mt-4 flex items-center gap-3">
<div class="w-6 h-6 rounded-full bg-secondary-fixed/50 border border-secondary/10"></div>
<span class="font-caption text-caption text-on-surface-variant">Dining Services • 5h ago</span>
</div>
</div>
</article>
<!-- Post 3 -->
<article class="bg-surface-container-low museum-shadow group cursor-pointer overflow-hidden border-b-4 border-secondary">
<div class="p-8 h-full flex flex-col justify-center">
<span class="material-symbols-outlined text-secondary text-5xl mb-4">event_note</span>
<h4 class="font-display-md text-display-md mb-4 italic">Annual Tech Symposium</h4>
<p class="font-body-md text-on-surface-variant mb-6">Call for abstracts is now open. Submit your research for the prestigious Institutional Merit Award.</p>
<button class="self-start text-secondary font-bold flex items-center gap-2 group-hover:translate-x-2 transition-transform">
                            LEARN MORE <span class="material-symbols-outlined">arrow_forward</span>
</button>
</div>
</article>
</div>
</section>
</main>
<!-- Footer Section -->
<footer class="relative w-full py-12 bg-surface-container dark:bg-surface-container-highest border-t border-outline-variant/20 ml-[280px] w-[calc(100%-280px)]">
<div class="flex flex-col md:flex-row justify-between items-center px-margin-desktop max-w-1440px mx-auto gap-8">
<div class="flex flex-col items-center md:items-start">
<span class="font-label-md text-label-md text-primary mb-2">SJKVY INSTITUTIONAL</span>
<p class="font-caption text-caption text-on-surface-variant">© 2024 SJKVY Institutional Portal. All rights reserved.</p>
</div>
<div class="flex flex-wrap justify-center gap-8">
<a class="font-caption text-caption text-on-surface-variant hover:text-primary underline transition-all" href="#">Privacy Policy</a>
<a class="font-caption text-caption text-on-surface-variant hover:text-primary underline transition-all" href="#">Terms of Service</a>
<a class="font-caption text-caption text-on-surface-variant hover:text-primary underline transition-all" href="#">Institutional Contacts</a>
<a class="font-caption text-caption text-on-surface-variant hover:text-primary underline transition-all" href="#">FAQ</a>
</div>
<div class="flex gap-4">
<div class="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all cursor-pointer">
<span class="material-symbols-outlined text-sm">language</span>
</div>
<div class="w-8 h-8 rounded-full border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary transition-all cursor-pointer">
<span class="material-symbols-outlined text-sm">share</span>
</div>
</div>
</div>
</footer>
<!-- FAB (Suppressed on Dashboard per logic, but shown here for UI demonstration as an "Action Center" button) -->
<button class="fixed bottom-8 right-8 w-14 h-14 bg-secondary text-on-secondary rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-50">
<span class="material-symbols-outlined" style="font-variation-settings: 'wght' 600;">add</span>
</button>`;
export const css = `.material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
            vertical-align: middle;
        }
        .bento-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
            gap: 24px;
        }
        .museum-shadow {
            box-shadow: 0 4px 20px rgba(26, 28, 30, 0.04);
        }
        .stagger-in > * {
            opacity: 0;
            transform: translateY(10px);
            animation: slideUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        @keyframes slideUp {
            to { opacity: 1; transform: translateY(0); }
        }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }
        .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #775a19;
            border-radius: 10px;
        }
    
/*sjkvy-bgfix*/:root{forced-color-adjust:none;-webkit-forced-color-adjust:none}html,body{forced-color-adjust:none;color-scheme:light}`;
