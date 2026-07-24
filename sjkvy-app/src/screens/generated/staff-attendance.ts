// GENERATED from handoff app/staff-attendance.html — do not edit by hand. Regenerate: npm run convert
export const portal = "staff";
export const title = "Attendance Management | SJKVY Institutional Portal";
export const html = `<!-- Sidebar Navigation -->
<aside class="bg-on-background dark:bg-inverse-surface fixed left-0 top-0 h-full w-sidebar-width border-r border-outline-variant/20 flex flex-col py-8 z-50">
<div class="px-8 mb-12">
<h1 class="font-headline-lg text-headline-lg text-surface tracking-tight">SJKVY Staff</h1>
<p class="font-label-md text-label-md text-tertiary-fixed-dim uppercase tracking-widest mt-1">Institutional Portal</p>
</div>
<nav class="flex-grow space-y-1">
<!-- Dashboard -->
<div class="cursor-pointer flex items-center gap-4 px-6 py-4 text-tertiary-fixed-dim font-normal hover:bg-primary-fixed-variant/5 hover:text-surface transition-all">
<span class="material-symbols-outlined">dashboard</span>
<span class="font-label-md text-label-md">Dashboard</span>
</div>
<!-- Verification -->
<div class="cursor-pointer flex items-center gap-4 px-6 py-4 text-tertiary-fixed-dim font-normal hover:bg-primary-fixed-variant/5 hover:text-surface transition-all">
<span class="material-symbols-outlined">verified_user</span>
<span class="font-label-md text-label-md">Verification</span>
</div>
<!-- Counselling -->
<div class="cursor-pointer flex items-center gap-4 px-6 py-4 text-tertiary-fixed-dim font-normal hover:bg-primary-fixed-variant/5 hover:text-surface transition-all">
<span class="material-symbols-outlined">groups</span>
<span class="font-label-md text-label-md">Counselling</span>
</div>
<!-- Attendance (ACTIVE) -->
<div class="cursor-pointer flex items-center gap-4 px-6 py-4 border-l-4 border-secondary text-surface font-semibold bg-primary-fixed-variant/10">
<span class="material-symbols-outlined">co_present</span>
<span class="font-label-md text-label-md">Attendance</span>
</div>
<!-- Hostel -->
<div class="cursor-pointer flex items-center gap-4 px-6 py-4 text-tertiary-fixed-dim font-normal hover:bg-primary-fixed-variant/5 hover:text-surface transition-all">
<span class="material-symbols-outlined">apartment</span>
<span class="font-label-md text-label-md">Hostel</span>
</div>
<!-- Placement -->
<div class="cursor-pointer flex items-center gap-4 px-6 py-4 text-tertiary-fixed-dim font-normal hover:bg-primary-fixed-variant/5 hover:text-surface transition-all">
<span class="material-symbols-outlined">work</span>
<span class="font-label-md text-label-md">Placement</span>
</div>
<!-- Reports -->
<div class="cursor-pointer flex items-center gap-4 px-6 py-4 text-tertiary-fixed-dim font-normal hover:bg-primary-fixed-variant/5 hover:text-surface transition-all">
<span class="material-symbols-outlined">assessment</span>
<span class="font-label-md text-label-md">Reports</span>
</div>
</nav>
<div class="mt-auto px-8 pt-8 border-t border-outline-variant/10">
<div class="cursor-pointer flex items-center gap-4 py-3 text-tertiary-fixed-dim hover:text-surface transition-colors">
<span class="material-symbols-outlined">settings</span>
<span class="font-label-md text-label-md">Settings</span>
</div>
<div class="cursor-pointer flex items-center gap-4 py-3 text-tertiary-fixed-dim hover:text-surface transition-colors">
<span class="material-symbols-outlined">logout</span>
<span class="font-label-md text-label-md">Logout</span>
</div>
</div>
</aside>
<!-- Top Navigation Bar -->
<header class="fixed top-0 right-0 left-sidebar-width w-[calc(100%-280px)] z-40 bg-surface/60 backdrop-blur-md shadow-sm h-topbar-height">
<div class="flex justify-between items-center h-full px-margin-desktop max-w-max-width mx-auto">
<div class="flex items-center gap-8">
<div class="relative group">
<input class="bg-surface-container-low border-none rounded-full px-12 py-2 w-64 font-body-md text-on-surface-variant focus:ring-1 focus:ring-primary focus:w-80 transition-all duration-300" placeholder="Search batch, student, or ID..." type="text"/>
<span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
</div>
<div class="hidden md:flex gap-6">
<a class="text-primary font-semibold border-b-2 border-primary pb-1 font-body-md" href="#">Directory</a>
<a class="text-on-surface-variant font-medium hover:text-primary transition-colors duration-200 font-body-md" href="#">Resources</a>
</div>
</div>
<div class="flex items-center gap-6">
<button class="active:scale-95 transition-transform text-on-surface-variant relative">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute top-0 right-0 w-2 h-2 bg-error rounded-full"></span>
</button>
<button class="active:scale-95 transition-transform text-on-surface-variant">
<span class="material-symbols-outlined">help_outline</span>
</button>
<div class="flex items-center gap-3 pl-6 border-l border-outline-variant/30">
<div class="text-right">
<p class="font-label-md text-label-md text-on-surface">Dr. Ananya Roy</p>
<p class="font-caption text-caption text-on-surface-variant">Senior Administrator</p>
</div>
<img class="w-10 h-10 rounded-full object-cover border border-outline-variant/20" data-alt="A professional headshot of an administrative professional in a bright, modern office setting. The lighting is soft and even, highlighting a warm and confident expression. The aesthetic is clean and institutional, with soft focus bookshelves in the background, adhering to a minimalist museum-quality UI design with high clarity." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_LEyYbOytDhxHC5_j5_o2glWj7U7ltypQAiCVvqYbc_gPiJtQubiXJbs9Yr7If-tFLCfMab3MjSbpc4VDDtLB54tTiFaGvMuqfTymzZ5OjtoRbNGjueFSm-a9Ijwm9Jig6silEHh4mHb2DyhtO6bwoCZJ9g3pwv50j0hK1fNH8Qd_UgbL5nmAF9S6DHwfR3Er0zOwaA9WvtiyojQwIANlvPnhUvq8lRsmwTqlNljI57aUp6U5DsVL"/>
</div>
</div>
</div>
</header>
<!-- Main Content Area -->
<main class="ml-sidebar-width pt-topbar-height min-h-screen">
<div class="px-margin-desktop py-12 max-w-max-width mx-auto">
<!-- Header Section -->
<div class="mb-12 flex justify-between items-end">
<div>
<h2 class="font-display-md text-display-md text-primary mb-2">Attendance Management</h2>
<p class="text-on-surface-variant font-body-lg">Monitoring and record management for Academic Session 2024-25</p>
</div>
<div class="flex items-center gap-4">
<div class="bg-surface-container-high px-4 py-2 rounded-lg border silk-gold-border flex items-center gap-2">
<span class="material-symbols-outlined text-secondary">calendar_today</span>
<span class="font-label-md">Oct 24, 2023</span>
</div>
<button class="bg-primary text-on-primary px-6 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95">
<span class="material-symbols-outlined">download</span>
<span class="font-label-md">Export Report</span>
</button>
</div>
</div>
<!-- Dashboard Grid -->
<div class="grid grid-cols-12 gap-gutter">
<!-- Left Column: Batch & Attendance -->
<div class="col-span-8 space-y-gutter">
<!-- Batch Selector & Filters -->
<section class="bg-surface-container-lowest p-8 rounded-xl museum-shadow border-t-2 border-primary">
<div class="flex justify-between items-center mb-8">
<h3 class="font-title-lg text-title-lg text-on-surface">Live Roll Call</h3>
<div class="flex items-center gap-3">
<select class="bg-surface-container border-none text-on-surface font-label-md py-2 px-4 pr-10 rounded-lg focus:ring-primary">
<option>Batch A-2024 (Design)</option>
<option>Batch B-2024 (Eng.)</option>
<option>Batch C-2024 (Med.)</option>
</select>
<div class="h-8 w-px bg-outline-variant/30"></div>
<span class="font-label-md text-on-surface-variant uppercase tracking-widest">34 Students</span>
</div>
</div>
<!-- Student List / Table Pattern -->
<div class="overflow-x-auto">
<table class="w-full text-left">
<thead class="border-b silk-gold-border">
<tr>
<th class="py-4 font-label-md text-primary uppercase tracking-widest">Student</th>
<th class="py-4 font-label-md text-primary uppercase tracking-widest">ID Number</th>
<th class="py-4 font-label-md text-primary uppercase tracking-widest">Last 7 Days</th>
<th class="py-4 font-label-md text-primary uppercase tracking-widest text-right">Status</th>
</tr>
</thead>
<tbody class="divide-y silk-gold-border">
<tr class="group hover:bg-surface-container/30 transition-colors">
<td class="py-6">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-semibold">AS</div>
<div>
<p class="font-semibold text-on-surface">Arjun Sharma</p>
<p class="text-caption text-on-surface-variant">B.Des - Year 2</p>
</div>
</div>
</td>
<td class="py-6 font-caption text-on-surface-variant">#SJKVY-24012</td>
<td class="py-6">
<div class="flex gap-1">
<div class="w-2 h-6 bg-primary rounded-full"></div>
<div class="w-2 h-6 bg-primary rounded-full"></div>
<div class="w-2 h-6 bg-primary/30 rounded-full"></div>
<div class="w-2 h-6 bg-primary rounded-full"></div>
<div class="w-2 h-6 bg-primary rounded-full"></div>
<div class="w-2 h-6 bg-primary rounded-full"></div>
<div class="w-2 h-6 bg-primary rounded-full"></div>
</div>
</td>
<td class="py-6 text-right">
<div class="inline-flex rounded-lg border silk-gold-border overflow-hidden">
<button class="px-4 py-2 bg-primary text-on-primary text-label-md hover:bg-primary-container transition-colors">Present</button>
<button class="px-4 py-2 bg-surface text-on-surface-variant text-label-md hover:bg-error/10 hover:text-error transition-colors">Absent</button>
</div>
</td>
</tr>
<tr class="group hover:bg-surface-container/30 transition-colors">
<td class="py-6">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full bg-primary-fixed-dim flex items-center justify-center text-on-primary-fixed font-semibold">MK</div>
<div>
<p class="font-semibold text-on-surface">Meera Kapoor</p>
<p class="text-caption text-on-surface-variant">B.Des - Year 2</p>
</div>
</div>
</td>
<td class="py-6 font-caption text-on-surface-variant">#SJKVY-24045</td>
<td class="py-6">
<div class="flex gap-1">
<div class="w-2 h-6 bg-primary rounded-full"></div>
<div class="w-2 h-6 bg-primary rounded-full"></div>
<div class="w-2 h-6 bg-primary rounded-full"></div>
<div class="w-2 h-6 bg-primary rounded-full"></div>
<div class="w-2 h-6 bg-primary rounded-full"></div>
<div class="w-2 h-6 bg-primary rounded-full"></div>
<div class="w-2 h-6 bg-primary rounded-full"></div>
</div>
</td>
<td class="py-6 text-right">
<div class="inline-flex rounded-lg border silk-gold-border overflow-hidden">
<button class="px-4 py-2 bg-surface text-on-surface-variant text-label-md hover:bg-primary/10 hover:text-primary transition-colors">Present</button>
<button class="px-4 py-2 bg-error text-on-error text-label-md hover:bg-error-container transition-colors">Absent</button>
</div>
</td>
</tr>
<tr class="group hover:bg-surface-container/30 transition-colors">
<td class="py-6">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-full bg-tertiary-fixed-dim flex items-center justify-center text-on-tertiary-fixed font-semibold">RV</div>
<div>
<p class="font-semibold text-on-surface">Rohan Verma</p>
<p class="text-caption text-on-surface-variant">B.Des - Year 2</p>
</div>
</div>
</td>
<td class="py-6 font-caption text-on-surface-variant">#SJKVY-24089</td>
<td class="py-6">
<div class="flex gap-1">
<div class="w-2 h-6 bg-primary rounded-full"></div>
<div class="w-2 h-6 bg-primary/30 rounded-full"></div>
<div class="w-2 h-6 bg-primary/30 rounded-full"></div>
<div class="w-2 h-6 bg-primary rounded-full"></div>
<div class="w-2 h-6 bg-primary rounded-full"></div>
<div class="w-2 h-6 bg-primary rounded-full"></div>
<div class="w-2 h-6 bg-primary rounded-full"></div>
</div>
</td>
<td class="py-6 text-right">
<div class="inline-flex rounded-lg border silk-gold-border overflow-hidden">
<button class="px-4 py-2 bg-primary text-on-primary text-label-md">Present</button>
<button class="px-4 py-2 bg-surface text-on-surface-variant text-label-md">Absent</button>
</div>
</td>
</tr>
</tbody>
</table>
</div>
</section>
<!-- Heatmap Visualization -->
<section class="bg-surface-container-lowest p-8 rounded-xl museum-shadow border silk-gold-border">
<div class="flex justify-between items-center mb-8">
<div>
<h3 class="font-title-lg text-title-lg text-on-surface">30-Day Attendance Heatmap</h3>
<p class="text-on-surface-variant font-body-md mt-1">Daily aggregation across all active batches</p>
</div>
<div class="flex items-center gap-2 text-on-surface-variant font-label-md">
<span>Low</span>
<div class="w-3 h-3 bg-primary/10 rounded-sm"></div>
<div class="w-3 h-3 bg-primary/40 rounded-sm"></div>
<div class="w-3 h-3 bg-primary/70 rounded-sm"></div>
<div class="w-3 h-3 bg-primary rounded-sm"></div>
<span>High</span>
</div>
</div>
<!-- Heatmap Grid -->
<div class="flex gap-1 overflow-x-auto pb-4 scroll-hide">
<!-- Week 1 -->
<div class="flex flex-col gap-1">
<div class="heatmap-cell bg-primary"></div>
<div class="heatmap-cell bg-primary/80"></div>
<div class="heatmap-cell bg-primary"></div>
<div class="heatmap-cell bg-primary/20"></div>
<div class="heatmap-cell bg-primary/60"></div>
<div class="heatmap-cell bg-surface-container"></div>
<div class="heatmap-cell bg-surface-container"></div>
</div>
<!-- Repeats for visualization -->
<div class="flex flex-col gap-1"><div class="heatmap-cell bg-primary"></div><div class="heatmap-cell bg-primary"></div><div class="heatmap-cell bg-primary/90"></div><div class="heatmap-cell bg-primary/80"></div><div class="heatmap-cell bg-primary"></div><div class="heatmap-cell bg-surface-container"></div><div class="heatmap-cell bg-surface-container"></div></div>
<div class="flex flex-col gap-1"><div class="heatmap-cell bg-primary/40"></div><div class="heatmap-cell bg-primary/60"></div><div class="heatmap-cell bg-primary/80"></div><div class="heatmap-cell bg-primary"></div><div class="heatmap-cell bg-primary/90"></div><div class="heatmap-cell bg-surface-container"></div><div class="heatmap-cell bg-surface-container"></div></div>
<div class="flex flex-col gap-1"><div class="heatmap-cell bg-primary"></div><div class="heatmap-cell bg-primary/90"></div><div class="heatmap-cell bg-primary/20"></div><div class="heatmap-cell bg-primary/80"></div><div class="heatmap-cell bg-primary"></div><div class="heatmap-cell bg-surface-container"></div><div class="heatmap-cell bg-surface-container"></div></div>
<div class="flex flex-col gap-1"><div class="heatmap-cell bg-primary/10"></div><div class="heatmap-cell bg-primary/60"></div><div class="heatmap-cell bg-primary/80"></div><div class="heatmap-cell bg-primary/90"></div><div class="heatmap-cell bg-primary"></div><div class="heatmap-cell bg-surface-container"></div><div class="heatmap-cell bg-surface-container"></div></div>
<div class="flex flex-col gap-1"><div class="heatmap-cell bg-primary/80"></div><div class="heatmap-cell bg-primary/90"></div><div class="heatmap-cell bg-primary"></div><div class="heatmap-cell bg-primary"></div><div class="heatmap-cell bg-primary/70"></div><div class="heatmap-cell bg-surface-container"></div><div class="heatmap-cell bg-surface-container"></div></div>
<div class="flex flex-col gap-1"><div class="heatmap-cell bg-primary/20"></div><div class="heatmap-cell bg-primary/40"></div><div class="heatmap-cell bg-primary/60"></div><div class="heatmap-cell bg-primary/80"></div><div class="heatmap-cell bg-primary"></div><div class="heatmap-cell bg-surface-container"></div><div class="heatmap-cell bg-surface-container"></div></div>
<div class="flex flex-col gap-1"><div class="heatmap-cell bg-primary/80"></div><div class="heatmap-cell bg-primary/90"></div><div class="heatmap-cell bg-primary"></div><div class="heatmap-cell bg-primary"></div><div class="heatmap-cell bg-primary/70"></div><div class="heatmap-cell bg-surface-container"></div><div class="heatmap-cell bg-surface-container"></div></div>
</div>
<div class="mt-4 flex justify-between font-label-md text-on-surface-variant uppercase tracking-widest text-[10px]">
<span>September</span>
<span>October</span>
</div>
</section>
</div>
<!-- Right Column: Stats & Leave Requests -->
<div class="col-span-4 space-y-gutter">
<!-- Quick Stats Cards -->
<div class="bg-primary text-on-primary p-8 rounded-xl museum-shadow relative overflow-hidden">
<div class="relative z-10">
<p class="font-label-md text-label-md opacity-80 mb-2 uppercase tracking-widest">Average Monthly Attendance</p>
<h4 class="font-display-md text-display-md">94.2%</h4>
<div class="mt-4 flex items-center gap-2 text-primary-fixed font-semibold">
<span class="material-symbols-outlined text-sm">trending_up</span>
<span class="text-caption">+2.4% from last month</span>
</div>
</div>
<div class="absolute -right-4 -bottom-4 opacity-10">
<span class="material-symbols-outlined !text-[120px]">equalizer</span>
</div>
</div>
<!-- Leave Applications -->
<section class="bg-surface-container-lowest p-8 rounded-xl museum-shadow border silk-gold-border">
<div class="flex justify-between items-center mb-6">
<h3 class="font-title-lg text-title-lg text-on-surface">Leave Requests</h3>
<span class="bg-error-container text-on-error-container px-2 py-0.5 rounded text-caption font-semibold">3 New</span>
</div>
<div class="space-y-4">
<!-- Leave Item -->
<div class="p-4 rounded-lg bg-surface border silk-gold-border group transition-all hover:border-primary/50">
<div class="flex items-start gap-3">
<img class="w-10 h-10 rounded-full object-cover" data-alt="Close-up of a student student in casual university attire, smiling softly. High-quality digital photography with a blurred library background, warm skin tones, and soft institutional lighting that conveys a respectful educational environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmhkqOVNvcamh_8U9cjq8-_cdoWPEw9Ci-U8iILPY0PTfO5eOmBStU2LfJLHCv82eKelFGypCN7ooecoKAY2X7LIPVMpYfhgYtYiX-f4LAxOYTl9pIhQNFNxhWJYpWws1gh2fXHwXCSatasEBmshhgfUivmJ1sanDXE3bEIXlzC0j4dCMRfIbVjovoeY0E_uPm1SKHRyi0shkpNRKcFcjXG-4h3M2rRrXQfQPWYvSq4ZgAVqMYnMrk"/>
<div class="flex-grow">
<p class="font-semibold text-on-surface">Priya Menon</p>
<p class="text-caption text-on-surface-variant">Medical Emergency • 2 Days</p>
<div class="mt-3 flex gap-2">
<button class="flex-1 py-1.5 rounded bg-primary text-on-primary font-label-md hover:bg-primary-container transition-colors">Approve</button>
<button class="flex-1 py-1.5 rounded border silk-gold-border text-on-surface-variant font-label-md hover:bg-error/5 hover:text-error transition-colors">Decline</button>
</div>
</div>
</div>
</div>
<!-- Leave Item -->
<div class="p-4 rounded-lg bg-surface border silk-gold-border group transition-all hover:border-primary/50">
<div class="flex items-start gap-3">
<div class="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-semibold">KD</div>
<div class="flex-grow">
<p class="font-semibold text-on-surface">Kabir Das</p>
<p class="text-caption text-on-surface-variant">Family Event • 1 Day</p>
<div class="mt-3 flex gap-2">
<button class="flex-1 py-1.5 rounded bg-primary text-on-primary font-label-md hover:bg-primary-container transition-colors">Approve</button>
<button class="flex-1 py-1.5 rounded border silk-gold-border text-on-surface-variant font-label-md hover:bg-error/5 hover:text-error transition-colors">Decline</button>
</div>
</div>
</div>
</div>
</div>
<button class="w-full mt-6 py-3 text-primary font-label-md border-t silk-gold-border hover:text-primary-container transition-colors flex items-center justify-center gap-2">
                            View All Applications
                            <span class="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</section>
<!-- Alert / System Status -->
<div class="p-6 rounded-xl bg-secondary-fixed/30 border border-secondary/20 flex gap-4">
<span class="material-symbols-outlined text-secondary">info</span>
<div>
<p class="font-semibold text-on-secondary-fixed">Biometric Sync</p>
<p class="text-caption text-on-secondary-fixed-variant">Last successful synchronization: 14:02 Today</p>
</div>
</div>
</div>
</div>
</div>
</main>`;
export const css = `.museum-shadow {
            box-shadow: 0 4px 20px rgba(26, 28, 30, 0.04);
        }
        .silk-gold-border {
            border-color: rgba(119, 90, 25, 0.2);
        }
        .heatmap-cell {
            width: 14px;
            height: 14px;
            border-radius: 2px;
            transition: transform 0.2s ease;
        }
        .heatmap-cell:hover {
            transform: scale(1.2);
            z-index: 10;
        }
        .scroll-hide::-webkit-scrollbar {
            display: none;
        }
        .scroll-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
    
/*sjkvy-bgfix*/:root{forced-color-adjust:none;-webkit-forced-color-adjust:none}html,body{forced-color-adjust:none;color-scheme:light}`;
