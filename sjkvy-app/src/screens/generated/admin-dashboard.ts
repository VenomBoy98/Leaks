// GENERATED from handoff app/admin-dashboard.html — do not edit by hand. Regenerate: npm run convert
export const portal = "admin";
export const title = "SJKVY Centre Admin Portal";
export const html = `<!-- Side Navigation -->
<aside class="w-72 h-screen fixed left-0 top-0 bg-primary dark:bg-primary-container shadow-xl flex flex-col py-8 z-50 overflow-y-auto">
<div class="px-8 mb-12">
<h1 class="font-headline-lg text-secondary-fixed tracking-tight leading-none mb-1">SJKVY Portal</h1>
<p class="font-label-sm text-secondary-fixed/70 uppercase tracking-widest">Centre Admin</p>
</div>
<nav class="flex-1 px-4 space-y-1">
<!-- Active Tab: Dashboard -->
<a class="flex items-center gap-4 px-4 py-3 rounded sidebar-active transition-transform duration-200 scale-98" href="#">
<span class="material-symbols-outlined">dashboard</span>
<span class="font-label-md">Dashboard</span>
</a>
<a class="flex items-center gap-4 px-4 py-3 rounded text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">assignment_turned_in</span>
<span class="font-label-md">Applications</span>
</a>
<a class="flex items-center gap-4 px-4 py-3 rounded text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">group_work</span>
<span class="font-label-md">Batch Management</span>
</a>
<a class="flex items-center gap-4 px-4 py-3 rounded text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">group</span>
<span class="font-label-md">Directory</span>
</a>
<a class="flex items-center gap-4 px-4 py-3 rounded text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">hotel</span>
<span class="font-label-md">Hostel Tracking</span>
</a>
<a class="flex items-center gap-4 px-4 py-3 rounded text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">assessment</span>
<span class="font-label-md">Reports</span>
</a>
</nav>
<div class="mt-auto px-4 space-y-1 pt-8 border-t border-white/10">
<button class="w-full flex items-center justify-center gap-2 mb-6 py-3 bg-secondary-fixed text-on-secondary-fixed font-bold rounded-lg hover:brightness-110 transition-all">
<span class="material-symbols-outlined text-[20px]">add</span>
<span class="font-label-md">Quick Enroll</span>
</button>
<a class="flex items-center gap-4 px-4 py-3 rounded text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">settings</span>
<span class="font-label-md">Settings</span>
</a>
<a class="flex items-center gap-4 px-4 py-3 rounded text-on-primary/70 hover:text-on-primary hover:bg-white/5 transition-colors" href="#">
<span class="material-symbols-outlined">help</span>
<span class="font-label-md">Support</span>
</a>
</div>
</aside>
<!-- Main Content Area -->
<main class="ml-72 min-h-screen relative">
<!-- Top App Bar -->
<header class="flex justify-between items-center px-gutter h-20 bg-surface/80 backdrop-blur-md sticky top-0 z-40 border-b border-outline-variant">
<div class="flex items-center flex-1">
<div class="relative w-96 max-w-full">
<span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
<input class="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-full focus:ring-1 focus:ring-primary focus:border-primary outline-none text-body-md" placeholder="Search center records..." type="text"/>
</div>
</div>
<div class="flex items-center gap-6">
<button class="relative text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined">notifications</span>
<span class="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full"></span>
</button>
<button class="text-on-surface-variant hover:text-primary transition-colors">
<span class="material-symbols-outlined">help_outline</span>
</button>
<div class="h-8 w-[1px] bg-outline-variant"></div>
<div class="flex items-center gap-3">
<div class="text-right">
<p class="font-label-md text-on-surface leading-none">Arjun Sharma</p>
<p class="text-[10px] text-on-surface-variant uppercase tracking-tighter">Centre Lead</p>
</div>
<img class="w-10 h-10 rounded-full object-cover border border-outline-variant" data-alt="A professional studio portrait of a confident Indian administrator in a modern office environment, wearing business casual attire. The lighting is soft and natural, reflecting a clean, high-end institutional aesthetic with a blurred architectural background of a state-of-the-art vocational training center." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC71RaTytSa8EYHhCI2bMXL5a7TbXYtW7IPhzArrSJpnEQFHhBPZCP5EpDeHhdSXchMM7sveiJjzxinHTZt_yz3AW-Ln-ccbLc_G1-nKyDUes7MW-a1WTr9lUPhUzSxbs5yZ_nkApRKybnxWytX2E-VfHjHWSKFW6OiFbXKvBNkweOqdglPCeCVCY2uAej86upBKrnmZ7yY3NYp0ABkGp6ZTz_bsgfFI4ny2ywTYPNa-tqB9YN1r6RX"/>
</div>
</div>
</header>
<!-- Dashboard Content -->
<div class="p-margin-desktop max-w-max-width mx-auto">
<!-- Welcome Header -->
<section class="mb-12">
<div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<span class="font-label-md text-secondary tracking-[0.2em] uppercase mb-2 block">Executive Overview</span>
<h2 class="font-display-md text-on-surface">Centre Performance</h2>
</div>
<div class="flex gap-3">
<button class="px-6 py-2 border border-secondary text-secondary font-label-md rounded flex items-center gap-2 hover:bg-secondary/5 transition-colors">
<span class="material-symbols-outlined text-[18px]">calendar_today</span>
                            Current Quarter
                        </button>
<button class="px-6 py-2 bg-primary text-on-primary font-label-md rounded flex items-center gap-2 shadow-lg hover:brightness-95 transition-all">
<span class="material-symbols-outlined text-[18px]">download</span>
                            Export Report
                        </button>
</div>
</div>
</section>
<!-- KPI Bento Grid -->
<section class="bento-grid mb-12">
<!-- KPI 1 -->
<div class="museum-card bg-white p-6 rounded-lg flex flex-col justify-between">
<div class="flex justify-between items-start">
<div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
<span class="material-symbols-outlined">group</span>
</div>
<span class="text-primary font-label-md flex items-center gap-1">
                            +12% <span class="material-symbols-outlined text-[14px]">trending_up</span>
</span>
</div>
<div>
<p class="text-display-md leading-none mb-1">1,284</p>
<p class="font-label-md text-on-surface-variant">Total Students</p>
</div>
</div>
<!-- KPI 2 -->
<div class="museum-card bg-white p-6 rounded-lg flex flex-col justify-between">
<div class="flex justify-between items-start">
<div class="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
<span class="material-symbols-outlined">layers</span>
</div>
</div>
<div>
<p class="text-display-md leading-none mb-1">42</p>
<p class="font-label-md text-on-surface-variant">Active Batches</p>
</div>
</div>
<!-- KPI 3 -->
<div class="museum-card bg-white p-6 rounded-lg flex flex-col justify-between border-t-2 border-t-primary">
<div class="flex justify-between items-start">
<div class="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
<span class="material-symbols-outlined">work</span>
</div>
<span class="text-primary font-label-md flex items-center gap-1">
                            +4% <span class="material-symbols-outlined text-[14px]">trending_up</span>
</span>
</div>
<div>
<p class="text-display-md leading-none mb-1">94.2%</p>
<p class="font-label-md text-on-surface-variant">Placement Rate</p>
</div>
</div>
<!-- KPI 4 -->
<div class="museum-card bg-white p-6 rounded-lg flex flex-col justify-between">
<div class="flex justify-between items-start">
<div class="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center text-error">
<span class="material-symbols-outlined">fact_check</span>
</div>
</div>
<div>
<p class="text-display-md leading-none mb-1">88%</p>
<p class="font-label-md text-on-surface-variant">Attendance Avg</p>
</div>
</div>
<!-- Performance Chart (Spans 3 columns) -->
<div class="col-span-3 museum-card bg-white p-8 rounded-lg">
<div class="flex justify-between items-center mb-8">
<div>
<h3 class="font-title-lg text-on-surface">Batch Performance Comparison</h3>
<p class="font-body-md text-on-surface-variant">Performance metrics across different vocational streams</p>
</div>
<div class="flex gap-4">
<div class="flex items-center gap-2">
<span class="w-3 h-3 rounded-full bg-primary"></span>
<span class="font-label-md text-on-surface-variant">Placement</span>
</div>
<div class="flex items-center gap-2">
<span class="w-3 h-3 rounded-full bg-secondary-fixed-dim"></span>
<span class="font-label-md text-on-surface-variant">Completion</span>
</div>
</div>
</div>
<div class="h-64 flex items-end justify-around gap-4 border-b border-outline-variant/30 pb-4">
<!-- Chart Bar 1 -->
<div class="flex flex-col items-center gap-2 w-full max-w-[60px]">
<div class="w-full flex items-end gap-1 h-48">
<div class="bg-primary chart-bar w-1/2 rounded-t-sm" style="height: 85%;"></div>
<div class="bg-secondary-fixed-dim chart-bar w-1/2 rounded-t-sm" style="height: 92%;"></div>
</div>
<span class="font-label-md text-[10px] text-center">Solar Tech</span>
</div>
<!-- Chart Bar 2 -->
<div class="flex flex-col items-center gap-2 w-full max-w-[60px]">
<div class="w-full flex items-end gap-1 h-48">
<div class="bg-primary chart-bar w-1/2 rounded-t-sm" style="height: 70%;"></div>
<div class="bg-secondary-fixed-dim chart-bar w-1/2 rounded-t-sm" style="height: 85%;"></div>
</div>
<span class="font-label-md text-[10px] text-center">Hospitality</span>
</div>
<!-- Chart Bar 3 -->
<div class="flex flex-col items-center gap-2 w-full max-w-[60px]">
<div class="w-full flex items-end gap-1 h-48">
<div class="bg-primary chart-bar w-1/2 rounded-t-sm" style="height: 95%;"></div>
<div class="bg-secondary-fixed-dim chart-bar w-1/2 rounded-t-sm" style="height: 98%;"></div>
</div>
<span class="font-label-md text-[10px] text-center">IT Services</span>
</div>
<!-- Chart Bar 4 -->
<div class="flex flex-col items-center gap-2 w-full max-w-[60px]">
<div class="w-full flex items-end gap-1 h-48">
<div class="bg-primary chart-bar w-1/2 rounded-t-sm" style="height: 60%;"></div>
<div class="bg-secondary-fixed-dim chart-bar w-1/2 rounded-t-sm" style="height: 75%;"></div>
</div>
<span class="font-label-md text-[10px] text-center">Nursing</span>
</div>
<!-- Chart Bar 5 -->
<div class="flex flex-col items-center gap-2 w-full max-w-[60px]">
<div class="w-full flex items-end gap-1 h-48">
<div class="bg-primary chart-bar w-1/2 rounded-t-sm" style="height: 88%;"></div>
<div class="bg-secondary-fixed-dim chart-bar w-1/2 rounded-t-sm" style="height: 90%;"></div>
</div>
<span class="font-label-md text-[10px] text-center">Mechanics</span>
</div>
</div>
</div>
<!-- Priority Tasks -->
<div class="museum-card bg-surface-container p-6 rounded-lg flex flex-col">
<h3 class="font-title-lg text-on-surface mb-4 flex items-center gap-2">
<span class="material-symbols-outlined text-error">priority_high</span>
                        Priority Tasks
                    </h3>
<div class="space-y-4 flex-1">
<div class="p-3 bg-white rounded border-l-4 border-error">
<p class="font-label-md text-on-surface">Batch SM-204 Verification</p>
<p class="text-[10px] text-on-surface-variant">Due in 4 hours • 28 students</p>
</div>
<div class="p-3 bg-white rounded border-l-4 border-secondary">
<p class="font-label-md text-on-surface">Hostel Occupancy Audit</p>
<p class="text-[10px] text-on-surface-variant">Scheduled for 3:00 PM</p>
</div>
<div class="p-3 bg-white rounded border-l-4 border-primary">
<p class="font-label-md text-on-surface">Faculty Review Meeting</p>
<p class="text-[10px] text-on-surface-variant">Tomorrow, 10:00 AM</p>
</div>
</div>
<button class="mt-4 text-primary font-label-md hover:underline flex items-center gap-1">
                        View all tasks <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
</button>
</div>
</section>
<!-- Recent Activity & Featured Section -->
<section class="grid grid-cols-3 gap-6">
<!-- Activity Feed -->
<div class="col-span-2 museum-card bg-white rounded-lg overflow-hidden flex flex-col h-[400px]">
<div class="px-8 py-6 border-b border-outline-variant/10 bg-surface-container-low flex justify-between items-center">
<h3 class="font-title-lg">Recent Activity Feed</h3>
<div class="flex gap-2">
<span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
<span class="text-[10px] font-label-md text-on-surface-variant uppercase">Live Updates</span>
</div>
</div>
<div class="flex-1 overflow-y-auto custom-scroll p-8">
<div class="space-y-8 relative">
<!-- Timeline Line -->
<div class="absolute left-[11px] top-2 bottom-2 w-[2px] bg-outline-variant/20"></div>
<!-- Activity Item 1 -->
<div class="relative flex gap-6">
<div class="w-6 h-6 rounded-full bg-primary flex items-center justify-center ring-4 ring-white z-10">
<span class="material-symbols-outlined text-[14px] text-on-primary">how_to_reg</span>
</div>
<div class="flex-1">
<div class="flex justify-between mb-1">
<p class="font-label-md text-on-surface">Enrollment Verified</p>
<span class="text-[10px] text-on-surface-variant">12 mins ago</span>
</div>
<p class="text-body-md text-on-surface-variant">Rahul Kumar from Batch SM-204 has been successfully verified for the Solar Technician course.</p>
</div>
</div>
<!-- Activity Item 2 -->
<div class="relative flex gap-6">
<div class="w-6 h-6 rounded-full bg-secondary flex items-center justify-center ring-4 ring-white z-10">
<span class="material-symbols-outlined text-[14px] text-on-secondary">school</span>
</div>
<div class="flex-1">
<div class="flex justify-between mb-1">
<p class="font-label-md text-on-surface">New Batch Created</p>
<span class="text-[10px] text-on-surface-variant">1 hour ago</span>
</div>
<p class="text-body-md text-on-surface-variant">Advanced Electrician (Batch AE-09) has been initialized with 30 candidate seats.</p>
</div>
</div>
<!-- Activity Item 3 -->
<div class="relative flex gap-6">
<div class="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center ring-4 ring-white z-10">
<span class="material-symbols-outlined text-[14px] text-on-primary-container">work_outline</span>
</div>
<div class="flex-1">
<div class="flex justify-between mb-1">
<p class="font-label-md text-on-surface">Placement Milestone</p>
<span class="text-[10px] text-on-surface-variant">3 hours ago</span>
</div>
<p class="text-body-md text-on-surface-variant">5 students from Batch IT-401 secured placements at TechServe Solutions Pvt Ltd.</p>
</div>
</div>
<!-- Activity Item 4 -->
<div class="relative flex gap-6">
<div class="w-6 h-6 rounded-full bg-outline flex items-center justify-center ring-4 ring-white z-10">
<span class="material-symbols-outlined text-[14px] text-white">verified</span>
</div>
<div class="flex-1">
<div class="flex justify-between mb-1">
<p class="font-label-md text-on-surface">Centre Audit Completed</p>
<span class="text-[10px] text-on-surface-variant">Yesterday</span>
</div>
<p class="text-body-md text-on-surface-variant">Monthly infrastructure audit completed with 98% compliance score.</p>
</div>
</div>
</div>
</div>
</div>
<!-- Featured Highlight -->
<div class="museum-card bg-primary text-on-primary rounded-lg p-8 flex flex-col relative overflow-hidden h-[400px]">
<div class="relative z-10">
<span class="font-label-md bg-white/20 px-3 py-1 rounded-full text-white text-[10px] tracking-widest uppercase mb-6 inline-block">Centre Spotlight</span>
<h3 class="font-display-md mb-4 text-secondary-fixed">Excellence in Solar Training</h3>
<p class="text-body-lg text-white/80 mb-8">Your centre has been recognized for achieving the highest placement rate in renewable energy courses across the state this month.</p>
<div class="grid grid-cols-2 gap-4 mt-auto">
<div class="bg-white/10 p-4 rounded backdrop-blur">
<p class="text-display-md leading-tight">#1</p>
<p class="text-[10px] font-label-md uppercase opacity-70">State Ranking</p>
</div>
<div class="bg-white/10 p-4 rounded backdrop-blur">
<p class="text-display-md leading-tight">98%</p>
<p class="text-[10px] font-label-md uppercase opacity-70">Placement</p>
</div>
</div>
</div>
<!-- Decorative Element -->
<div class="absolute -bottom-10 -right-10 opacity-20 transform rotate-12">
<span class="material-symbols-outlined text-[200px]" style="font-variation-settings: 'FILL' 1;">stars</span>
</div>
</div>
</section>
</div>
<!-- Footer Info -->
<footer class="p-gutter mt-12 border-t border-outline-variant/30 flex justify-between items-center bg-white/50 backdrop-blur">
<p class="text-caption text-on-surface-variant">© 2024 SJKVY Skill Development Initiative. All rights reserved.</p>
<div class="flex gap-6">
<a class="text-caption text-on-surface-variant hover:text-primary transition-colors" href="#">Data Privacy</a>
<a class="text-caption text-on-surface-variant hover:text-primary transition-colors" href="#">Accessibility</a>
<a class="text-caption text-on-surface-variant hover:text-primary transition-colors" href="#">API Status</a>
</div>
</footer>
</main>
<!-- Micro-interactions Script -->`;
export const css = `body { background-color: #fcf9f8; color: #1b1c1b; }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .bento-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            grid-auto-rows: minmax(180px, auto);
            gap: 24px;
        }
        .museum-card {
            box-shadow: 0 4px 20px rgba(26, 28, 30, 0.04);
            border: 1px solid rgba(119, 90, 25, 0.1);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .museum-card:hover {
            transform: translateY(-4px);
        }
        .chart-bar {
            transition: height 1s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .sidebar-active {
            background-color: rgba(255, 255, 255, 0.1);
            color: #ffdea5;
            font-weight: 700;
            border-left: 4px solid #ffdea5;
        }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #c1c9bf; border-radius: 10px; }
    
/*sjkvy-bgfix*/:root{forced-color-adjust:none;-webkit-forced-color-adjust:none}html,body{forced-color-adjust:none;color-scheme:light}`;
